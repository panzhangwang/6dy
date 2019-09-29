const moment = require('moment');
const qs = require('querystring');
const url = require('url');
const validator = require('validator');
const _ = require('lodash');
moment.locale('zh-cn');

/**
 * Helpers method
 *
 * @param {String} name
 * @return {Function}
 * @api public
 */

function uihelpers (name) {
  return function (req, res, next) {
    res.locals.formatDate = function (d) {
      return moment(d).format('YYYY-MM-DD HH:mm');
    }
    res.locals.isOut = function (ip) {
      return (ip.indexOf(process.env.OUT_NET) == 0) ? true : false;
    }
    next()
  }
}

module.exports = uihelpers