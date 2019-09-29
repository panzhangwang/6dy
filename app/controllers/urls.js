'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const { wrap: async } = require('co');
const only = require('only');
const Url = mongoose.model('Url');
const Pc = mongoose.model('Pc');
const assign = Object.assign;
const utils = require('../utils');

/**
 * Load
 */

exports.load = async(function*(req, res, next, id) {
  try {
    req.urlObj = yield Url.load(id);
    if (!req.url) return next(new Error('Url not found'));
  } catch (err) {
    return next(err);
  }
  next();
});

/**
 * List
 */

exports.index = async(function*(req, res) {
  const urls = yield Url.find();
  let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  if (ip.substr(0, 7) == "::ffff:") {
    ip = ip.substr(7);
  }
  let pc = yield Pc.findOne({ ip: ip});
  if (!pc) {
    pc = new Pc({ ip: ip });
    yield pc.save();
  }

  res.render('urls/index', {
    title: '网址管理',
    urls
  });
});

/**
 * New url
 */

exports.new = function(req, res) {
  res.render('urls/new', {
    title: '新建指标',
    url: new Url()
  });
};

/**
 * Create an url
 */

exports.create = async(function*(req, res) {
  const url = new Url(only(req.body, 'name inn out memo'));
  const ips = req.body.ips.split(',');
  url.ips = ips;
  try {
    yield url.save(req.file);
    req.flash('success', '创建成功！');
    res.redirect(`/urls`);
  } catch (err) {
    res.status(422).render('urls/new', {
      title: '新建指标',
      errors: [err.toString()],
      url
    });
  }
});

/**
 * Edit an url
 */

exports.edit = function(req, res) {
  res.render('urls/edit', {
    title: '编辑网址',
    url: req.urlObj
  });
};

/**
 * Update url
 */

exports.update = async(function*(req, res) {
  const url = req.urlObj;
  assign(url, only(req.body, 'name inn out memo'));
  const ips = req.body.ips.split(',');
  url.ips = ips;
  try {
    yield url.save();
    res.redirect(`/urls`);
  } catch (err) {
    res.status(422).render('urls/edit', {
      title: '编辑网址',
      errors: [err.toString()],
      url
    });
  }
});

/**
 * Delete an url
 */

exports.destroy = async(function*(req, res) {
  yield req.urlObj.remove();
  req.flash('info', '删除成功！');
  res.redirect('/urls');
});


exports.nav = async(function*(req, res) {
  const url = req.url;
  let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  if (ip.substr(0, 7) == "::ffff:") {
    ip = ip.substr(7);
  }
  let pc = yield Pc.findOne({ ip: ip});
  if (!pc) {
    pc = new Pc({ ip: ip });
    yield pc.save();
  }
  
  let out = true;
  const cri = {};
  if (ip.substring(0, 4) == '192.') {
    out = true;
  } else {
    out = false;
  }
  const urls = yield Url.find().lean();
  
  res.render('urls/nav', {
    title: '网址导航',
    urls, out
  });
});