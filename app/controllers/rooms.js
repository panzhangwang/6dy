'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const { wrap: async } = require('co');
const only = require('only');
const { getIP, isInn, isOut } = require('../utils');
const Room = mongoose.model('Room');
const Document = mongoose.model('Document');
const Pc = mongoose.model('Pc');
const assign = Object.assign;
const _ = require('lodash');

/**
 * Load
 */

exports.load = async(function*(req, res, next, id) {
  try {
    req.room = yield Room.load(id);
    if (!req.room) return next(new Error('Room not found'));
  } catch (err) {
    return next(err);
  }
  next();
});

/**
 * List
 */

exports.index = async(function*(req, res) {
  const page = (req.query.page > 0 ? req.query.page : 1) - 1;
  const _id = req.query.item;
  const limit = 15;
  const options = {
    limit: limit,
    page: page
  };

  if (_id) options.criteria = { _id };

  const rooms = yield Room.list(options);
  const count = yield Room.countDocuments();

  res.render('rooms/index', {
    title: 'Rooms',
    rooms: rooms,
    page: page + 1,
    pages: Math.ceil(count / limit)
  });
});

/**
 * New room
 */

exports.new = function(req, res) {
  res.render('rooms/new', {
    title: '新建云文件夹',
    room: new Room()
  });
};

/**
 * Create an room
 */

exports.create = async(function*(req, res) {
  const room = new Room(only(req.body, 'name'));
  const pc = yield Pc.findOne({ip: getIP(req)});
  room.mgr = pc;
  const pcs = [];
  pcs.push(pc._id);
  room.pcs = pcs;

  try {
    yield room.save();
    res.redirect('/rooms/'+room._id);
  } catch (err) {
    res.status(422).render('rooms/new', {
      title: '新建云文件夹',
      errors: [err.toString()],
      room
    });
  }
});

/**
 * Edit an room
 */

exports.edit = function(req, res) {
  res.render('rooms/edit', {
    title: '编辑共享云文件夹',
    room: req.room
  });
};

/**
 * Update room
 */

exports.update = async(function*(req, res) {
  const room = req.room;
  assign(room, only(req.body, 'name'));
  try {
    yield room.save();
    res.redirect(`/`);
  } catch (err) {
    res.status(422).render('rooms/edit', {
      title: '编辑共享云文件夹',
      errors: [err.toString()],
      room
    });
  }
});


exports.show = async(function*(req, res) {
  const ip = getIP(req);
  const pc = yield Pc.findOne({ ip: ip});
  if (pc.flow == '无许可') {
    return res.redirect('/');
  }
  const room = req.room;
  const pcs = yield Pc.find({_id: {$in: room.pcs}}).lean();
  
  const isManager = room.mgr.id === pc.id ? true : false;

  const page = (req.query.page > 0 ? req.query.page : 1) - 1;  
  const limit = 15;
  const criteria = { room: room };
  const options = {
    limit: limit,
    page: page,
    criteria: criteria
  };
  const docs = yield Document.list(options);
  const count = yield Document.countDocuments(criteria);

  res.render('rooms/show', {
    title: '编辑共享云文件夹',
    page: page + 1,
    pages: Math.ceil(count / limit),
    room: req.room,
    tag: '',
    isManager, pcs, docs, pc, ip
  });
});

exports.showByTag = async(function*(req, res) {
  const ip = getIP(req);
  const pc = yield Pc.findOne({ ip: ip });
  if (pc.flow == '无许可') {
    return res.redirect('/');
  }
  const room = req.room;
  const tag = req.params.tag;
  const pcs = yield Pc.find({_id: {$in: room.pcs}}).lean();
  
  const isManager = room.mgr.id === pc.id ? true : false;

  const page = (req.query.page > 0 ? req.query.page : 1) - 1;  
  const limit = 15;
  const criteria = { room: room, tags: tag };
  const options = {
    limit: limit,
    page: page,
    criteria: criteria
  };
  const docs = yield Document.list(options);
  const count = yield Document.countDocuments(criteria);

  res.render('rooms/show', {
    title: '编辑共享云文件夹',
    page: page + 1,
    pages: Math.ceil(count / limit),
    room: req.room,
    tag: tag,
    isManager, pcs, docs, pc, ip
  });
});

exports.add = async(function*(req, res) {
  const room = req.room;
  const pcs = yield Pc.find({_id: {$nin: room.pcs}, flow: '已授权'}).lean();
  let pc = yield Pc.findOne({ ip: getIP(req)});
  const isManager = room.mgr.id === pc.id ? true : false;
  
  res.render('rooms/add', {
    title: '添加共享主机',
    room: req.room,
    isManager, pcs
  });
});


exports.addPc = async(function*(req, res) {
  const room = req.room;
  const pc = req.pc;
  const pcs = room.pcs;
  pcs.push(pc._id);
  room.pcs = pcs;
  yield room.save();
  res.redirect("/rooms/"+room._id);
});

exports.delPc = async(function*(req, res) {
  const room = req.room;
  const pc = req.pc;

  var filtered = _.remove(room.pcs, function(it) {
    return it.toString() !== pc.id.toString();
  });
  room.pcs = filtered;
  yield room.save();
  res.redirect("/rooms/"+room._id);
});


exports.search = async(function*(req, res) {
  const ip = getIP(req);
  const pc = yield Pc.findOne({ ip: ip });
  if (pc.flow == '无许可') {
    return res.redirect('/');
  }
  const room = req.room;
  const isManager = room.mgr.id === pc.id ? true : false;
  const pcs = yield Pc.find({_id: {$in: room.pcs}}).lean();

  const docs = yield Document.aggregate([
    { $match: { room: room._id } },
    { $unwind: "$tags" },
    { $group: { _id: "$tags", tagsCount: { $sum: 1 } } },
    { $sort: { "tagsCount": -1 } }
  ]);
  const tags = [];
  for (var i = 0; i < docs.length; i++) {
    const d = docs[i];
    tags.push(d._id);
  }
  
  res.render('rooms/search', {
    title: '查询',
    tag: '查询',
    room, pcs, isManager, tags
  });
});


exports.searchPost = async(function*(req, res) {
  const ip = getIP(req);
  const pc = yield Pc.findOne({ ip: ip});
  if (pc.flow == '无许可') {
    return res.redirect('/');
  }
  const room = req.room;
  const pcs = yield Pc.find({_id: {$in: room.pcs}}).lean();
  
  const isManager = room.mgr.id === pc.id ? true : false;

  const page = (req.query.page > 0 ? req.query.page : 1) - 1;  
  const limit = 15;
  const criteria = { room: room };
  
  const keyword = req.body.keyword.trim();
  if (keyword) {
    criteria.title = new RegExp(keyword, 'i');
  }
  if (req.body.local) {
    criteria.pc = pc;
  }
  if (req.body.tags) {
    criteria.tags = { $all: req.body.tags };
  }
  const options = {
    limit: limit,
    page: page,
    criteria: criteria
  };
  const docs = yield Document.list(options);
  const count = yield Document.countDocuments(criteria);

  res.render('rooms/show', {
    title: '查询结果',
    page: page + 1,
    pages: Math.ceil(count / limit),
    room: req.room,
    tag: '结果',
    isManager, pcs, docs, pc, ip
  });
});

exports.delete = async(function*(req, res) {
  const room = req.room;
  const docs = yield Document.countDocuments({ room: room });
  if (docs>0) {
    req.flash('warning', '无法删除！该文件夹下含有文件');
    return res.redirect('/rooms/'+room._id);
  }
  yield room.remove();
  res.redirect('/');
});