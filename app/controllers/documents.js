'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const { wrap: async } = require('co');
const only = require('only');
const { getIP, isInn, isOut } = require('../utils');
const Document = mongoose.model('Document');
const Dict = mongoose.model('Dict');
const Room = mongoose.model('Room');
const Notice = mongoose.model('Notice');
const Url = mongoose.model('Url');
const Log = mongoose.model('Log');
const Pc = mongoose.model('Pc');
const assign = Object.assign;
const path = require('path');
const fs = require('fs');
const nanoid = require('nanoid');
const contentDisposition = require('content-disposition');

/**
 * Load
 */

exports.load = async(function*(req, res, next, id) {
  try {
    req.document = yield Document.load(id);
    if (!req.document) return next(new Error('Document not found'));
  } catch (err) {
    return next(err);
  }
  next();
});

/**
 * List
 */

exports.index = async(function*(req, res) {
  const ip = getIP(req);
  let pc = yield Pc.findOne({ ip: ip});
  if (!pc) {
    pc = new Pc({ ip: ip });
    yield pc.save();
  }

  let out = isOut(ip) ? true : false;
  const cri = {};
  const appUrls = yield Url.find().lean();

  const permitCookie = req.cookies['yydoc.permit']; 
  const applyCookie = req.cookies['yydoc.apply'];
  let flow = '';

  if (permitCookie) {
    const b = Buffer.from(permitCookie, 'base64');
    const formerIP = b.toString();
    if (formerIP === ip) {  
      flow = pc.flow;
    } else {
      flow = '无许可';
    }
  } else {
    if (applyCookie) {
      const ac = Buffer.from(applyCookie, 'base64');
      const applyIP = ac.toString();
      if (pc.flow === '已授权' && ip === applyIP) {
        return res.render('documents/confirm', {
          title: '申请已通过，请确认'
        });
      }
      flow = '待审核';
    } else {
      flow = '无许可';
    }
  }

  const rooms = yield Room.find({pcs:pc._id}).populate('mgr').lean();
  const tops = yield Document.find({ room: {$in: rooms}, top: 1 }).sort({at: -1}).limit(5).lean();
  
  const arr = [];
  for (var i = 0; i < rooms.length; i++) {
    const r = rooms[i];
    const count = yield Document.countDocuments({ room: r });
    arr.push({ _id: r._id, mgr: r.mgr, name: r.name, pcs: r.pcs, docCount: count });
  }

  const urls = [];
  for (var i = 0; i < appUrls.length; i++) {
    const u = appUrls[i];
    if (out && u.out)  {
      if (!u.ips || u.ips.length == 0) {
        urls.push({ _id: u._id, name: u.name, memo: u.memo, addr: u.out });
      } else {
        if (u.ips && u.ips.indexOf(ip) > -1) {
          urls.push({ _id: u._id, name: u.name, memo: u.memo, addr: u.out });
        }
      }
    }
    if (!out && u.inn) {
      if (!u.ips || u.ips.length == 0) {
        urls.push({ _id: u._id, name: u.name, memo: u.memo, addr: u.inn });
      } else {
        if (u.ips && u.ips.indexOf(ip) > -1) {
          urls.push({ _id: u._id, name: u.name, memo: u.memo, addr: u.inn });
        }
      }
    }
  }

  const teams = yield Pc.find({}).distinct('teams');
  const hasNotice = yield Notice.countDocuments({ who: {$in: pc.teams}, flag: 'new' });
  
  res.render('documents/index', {
    title: '首页',
    rooms: arr,
    flow, urls, out, ip, pc, tops, teams, hasNotice
  });
});


exports.apply = async(function*(req, res) {
  // const ip = getIP(req);
  // const pc = yield Pc.findOne({ ip: ip });
  
  // if (pc && pc.flow !== '无许可') {
  //   return res.redirect('/doc');
  // }
  res.render('documents/apply', {
    title: '申请开通文档共享'
  });
});


exports.applyPost = async(function*(req, res) {
  const ip = getIP(req);
  const pc = yield Pc.findOne({ ip: ip });
  assign(pc, only(req.body, 'phone memo'));
  pc.flow = '待审核';
  yield pc.save();

  const b = Buffer.from(ip);
  res.cookie('yydoc.apply', b.toString('base64'), {maxAge: 3*24*60*60*1000});

  return res.redirect('/');
});

exports.my = async(function*(req, res) {
  const ip = getIP(req);
  const pc = yield Pc.findOne({ ip: ip });
  const docs = yield Document.find({ toPc: pc }).lean();

  res.render('documents/my', {
    title: '我的文档',
    isOut: isOut(ip),
    isInn: isInn(ip),
    docs
  });
});

exports.confirmPost = async(function*(req, res) {
  const ip = getIP(req);
  const b = Buffer.from(ip);
  res.cookie('yydoc.permit', b.toString('base64'), {maxAge: 365*24*60*60*1000});

  return res.redirect('/');
});

exports.new = function (req, res){  
  const room = req.room;
  
  res.render('documents/new', {
    title: '上传新文档',
    document: new Document()
  });
};

exports.create = async(function* (req, res) {
  let dict = yield Dict.findOne({ _id: 'cuts' });
  if (!dict) {
    dict = new Dict({ _id: 'cuts' });
    yield dict.save();
  }
  const words = dict.words;
  const room = req.room;
  const pc = yield Pc.findOne({ ip: getIP(req)});

  if (!req.file) {
    return res.render('documents/new', {
      title: '上传新文档',
      document: new Document(),
      errors: ['文档不能为空']
    });
  }

  const document = new Document({});
  
  if (!document.title) {
    document.title = req.file.originalname;
    document.ext = path.extname(req.file.originalname);
  }
  document.code = req.file.filename;
  document.mime = req.file.mimetype;
  document.size = req.file.size;
  document.room = room;
  document.pc = pc;

  const tags = [];
  for (var i = 0; i < words.length; i++) {
    const d = words[i];
    if (document.title.indexOf(d) > -1) {
      tags.push(d);
    }
  };
  document.tags = tags;

  try {
    yield document.save();
    return res.redirect('/rooms/'+room._id);
  } catch (err) {
    respond(res, 'documents/new', {
      title: document.title || '上传新文档',
      errors: [err.toString()],
      document
    }, 422);
  }
});

exports.edit = async(function* (req, res) {
  const pc = yield Pc.findOne({ ip: getIP(req)});
  if (pc.flow == '无许可') {
    return res.redirect('/');
  }
  const document = req.document;
  const room = document.room;
  const tags = document.tags.join(',');
  const isManager = room.mgr.id === pc.id ? true : false;

  res.render('documents/edit', {
    title: '编辑文档',
    document, room, tags, isManager, pc
  });
});

exports.predownload = async(function* (req, res) {
  const ip = getIP(req);
  const document = req.document;
  const pc = document.pc;
  
  const arr = ip.split('.');
  const arr2 = pc.ip.split('.');
  
  let limits = [];
  if (arr[0] !== arr2[0]) {
    limits.push('crossed');
  }
  if (document.hashed) {
    limits.push('protected');
  }

  if (limits.length) {
    return res.render('documents/predownload', {
      title: '受控访问，需要提供以下信息',
      document, limits
    });
  }


  const pass = nanoid();
  document.pass = pass;
  yield document.save();

  res.redirect('/download/'+pass);
});

exports.predownloadPost = async(function* (req, res) {
  const pc = yield Pc.findOne({ ip: getIP(req)});
  const document = req.document;

  if (req.body.password) {
    if (!document.authenticate(req.body.password)) {
      req.flash('error', '密码错误！');
      return res.redirect('/documents/'+document._id+"/predownload");
    }
  }
  if (req.body.emp) {
    const log = new Log();
    log.srcpc = document.pc;
    log.vispc = pc;
    log.title = document.title;
    log.code = document.code;
    log.emp = req.body.emp;
    log.mime = document.mime;
    log.ext = document.ext;
    log.size = document.size;
    yield log.save();
  }
  
  const pass = nanoid();
  document.pass = pass;
  yield document.save();
  res.redirect('/download/'+pass);
});

exports.download = async(function* (req, res) {
  const document = yield Document.findOne({ pass: req.params.pass });
  
  if (document.title.endsWith(document.ext)) {
    res.setHeader('Content-Disposition', contentDisposition(document.title));
  } else {
    res.setHeader('Content-Disposition', contentDisposition(document.title + document.ext ));
  }
  res.setHeader('Content-type', document.mime);
  res.setHeader('Content-Length', document.size);
  
  const file = path.join(__dirname, '../../uploads/' + document.code);
  const filestream = fs.createReadStream(file);
  filestream.pipe(res);
});

exports.downloadlog = async(function* (req, res) {
  const document = yield Log.findById(req.params.logId);
  
  if (document.title.endsWith(document.ext)) {
    res.setHeader('Content-Disposition', contentDisposition(document.title));
  } else {
    res.setHeader('Content-Disposition', contentDisposition(document.title + document.ext ));
  }
  res.setHeader('Content-type', document.mime);
  res.setHeader('Content-Length', document.size);
  
  const file = path.join(__dirname, '../../uploads/' + document.code);
  const filestream = fs.createReadStream(file);
  filestream.pipe(res);
});


exports.editTags = async(function*(req, res) {
  const ip = getIP(req);
  const pc = yield Pc.findOne({ ip: ip });
  const document = req.document;
  const room = document.room;
  const tags = document.tags.join(',');

  res.render('documents/editTags', {
    title: '编辑标签',
    document, room, tags
  });
});

exports.update = async(function*(req, res) {
  const document = req.document;
  assign(document, only(req.body, 'title'));
  const room = document.room;
  const tags = req.body.tags.split(',');
  document.tags = tags;
  document.top = req.body.top ? 1 : 0;

  yield document.save();

  res.redirect('/rooms/'+room._id);
});

exports.remove = async(function*(req, res) {
  const document = req.document;
  const room = document.room;
  yield document.remove();
  res.redirect('/rooms/'+room._id);
});


exports.logs = async(function*(req, res) {
  const page = (req.query.page > 0 ? req.query.page : 1) - 1;  
  const limit = 15;
  const options = {
    limit: limit,
    page: page
  };

  const logs = yield Log.list(options);
  const count = yield Log.countDocuments();

  res.render('documents/logs', {
    title: '跨网下载审计',
    logs: logs,
    page: page + 1,
    pages: Math.ceil(count / limit)
  });
});

exports.cuts = async(function*(req, res) {
  let dict = yield Dict.findOne({_id: 'cuts'});
  if (!dict) {
    dict = new Dict({ _id: 'cuts'  });
    yield dict.save();
  }

  res.render('documents/cuts', {
    title: '分词设置',
    cuts: dict.words.join(',')
  });
});

exports.cutsPost = async(function*(req, res) {
  const dict = yield Dict.findOne({_id: 'cuts'});
  dict.words = req.body.cuts.split(',');
  yield dict.save();

  req.flash('info', '保存成功！');
  res.redirect('/cuts');
});


exports.pass = async(function* (req, res) {
  const pc = yield Pc.findOne({ ip: getIP(req)});
  if (pc.flow == '无许可') {
    return res.redirect('/');
  }
  const document = req.document;
  const room = document.room;
  const tags = document.tags.join(',');
  const isManager = room.mgr.id === pc.id ? true : false;

  res.render('documents/pass', {
    title: '设置密码',
    document, room, tags, isManager, pc
  });
});

exports.passPost = async(function* (req, res) {
  const pc = yield Pc.findOne({ ip: getIP(req)});
  if (pc.flow == '无许可') {
    return res.redirect('/');
  }
  const document = req.document;
  const room = document.room;
  if (req.body.pass) {
    document.hashed = 1;
  } else {
    document.hashed = 0;
  }
  document.password = req.body.pass;
  yield document.save();
  
  req.flash('success', '文档加密成功！');
  res.redirect('/rooms/'+room._id);
});