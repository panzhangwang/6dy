'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const { wrap: async } = require('co');
const only = require('only');
const Pc = mongoose.model('Pc');
const Notice = mongoose.model('Notice');
const { getIP, isInn, isOut } = require('../utils');
const assign = Object.assign;

/**
 * Load
 */

exports.load = async(function*(req, res, next, id) {
  try {
    req.pc = yield Pc.load(id);
    if (!req.pc) return next(new Error('Pc not found'));
  } catch (err) {
    return next(err);
  }
  next();
});

/**
 * List
 */

exports.inners = async(function*(req, res) {
  const pcs = yield Pc.find({ ip: new RegExp('^'+process.env.INN_NET) }).lean();
  
  res.render('pcs/pcs', {
    title: '内网终端',
    pcs
  });
});

exports.outers = async(function*(req, res) {
  const pcs = yield Pc.find({ ip: new RegExp('^'+process.env.OUT_NET) }).lean();
  
  res.render('pcs/pcs', {
    title: '外网终端',
    pcs
  });
});

exports.pendings = async(function*(req, res) {
  const pcs = yield Pc.find({ flow: '待审核' }).lean();
  
  res.render('pcs/pcs', {
    title: '待入网终端',
    pcs
  });
});


exports.edit = async(function*(req, res) {
  const depts = yield Pc.find().distinct('dept');
  const teams = yield Pc.find().distinct('teams');
  
  res.render('pcs/edit', {
    title: '编辑终端信息',
    pc: req.pc,
    depts, teams
  });
});

exports.change = async(function*(req, res) {
  const depts = yield Pc.find().distinct('dept');

  res.render('pcs/change', {
    title: '编辑终端信息',
    pc: req.pc,
    depts
  });
});

/**
 * Update url
 */

exports.update = async(function*(req, res) {
  const pc = req.pc;
  assign(pc, only(req.body, 'name memo phone flow dept teams loc'));
  try {
    yield pc.save();
    res.redirect(`/pendings`);
  } catch (err) {
    res.status(422).render('pcs/edit', {
      title: '编辑终端信息',
      errors: [err.toString()],
      pc
    });
  }
});

exports.changePost = async(function*(req, res) {
  const pc = req.pc;
  assign(pc, only(req.body, 'loc phone'));
  try {
    yield pc.save();
    res.redirect(`/`);
  } catch (err) {
    res.status(422).render('pcs/edit', {
      title: '编辑终端信息',
      errors: [err.toString()],
      pc
    });
  }
});

exports.send = async(function*(req, res) {
  const ip = getIP(req);
  let pc = yield Pc.findOne({ ip: ip});
  const notice = new Notice({ pc: pc });
  notice.what = req.body.what;
  notice.who = req.body.who;
  yield notice.save();
  res.json({});
});

exports.inbox = async(function*(req, res) {
  const ip = getIP(req);
  let pc = yield Pc.findOne({ ip: ip});
  const page = (req.query.page > 0 ? req.query.page : 1) - 1;  
  const limit = 15;
  const criteria = { who: {$in: pc.teams} };
  const options = {
    limit: limit,
    page: page,
    criteria: criteria
  };

  const notices = yield Notice.list(options);
  const count = yield Notice.countDocuments(criteria);
  const news = yield Notice.countDocuments({ who: {$in: pc.teams}, flag: 'new' });

  res.render('pcs/inbox', {
    title: '收件箱',
    page: page + 1,
    pages: Math.ceil(count / limit),
    news, notices
  });
});

exports.outbox = async(function*(req, res) {
  const ip = getIP(req);
  let pc = yield Pc.findOne({ ip: ip});
  const page = (req.query.page > 0 ? req.query.page : 1) - 1;  
  const limit = 15;
  const criteria = { pc: pc };
  const options = {
    limit: limit,
    page: page,
    criteria: criteria
  };

  const notices = yield Notice.list(options);
  const count = yield Notice.countDocuments(criteria);

  res.render('pcs/outbox', {
    title: '发件箱',
    page: page + 1,
    pages: Math.ceil(count / limit),
    notices
  });
});

exports.editNotice = async(function*(req, res) {
  const notice = yield Notice.findById(req.params.noticeId).populate('pc');
  
  res.render('pcs/editNotice', {
    title: '处理消息',
    notice
  });
});

exports.updateNotice = async(function*(req, res) {
  const ip = getIP(req);
  let pc = yield Pc.findOne({ ip: ip});
  const notice = yield Notice.findById(req.params.noticeId).populate('pc');
  assign(notice, only(req.body, 'ack flag'));
  notice.by = pc;
  notice.mat = Date.now();
  yield notice.save();
  res.redirect('/inbox');
});