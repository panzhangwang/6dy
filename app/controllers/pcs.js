'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const { wrap: async } = require('co');
const only = require('only');
const Pc = mongoose.model('Pc');
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

  res.render('pcs/edit', {
    title: '编辑终端信息',
    pc: req.pc,
    depts
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
  assign(pc, only(req.body, 'name memo phone flow dept'));
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