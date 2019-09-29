'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Url Schema
 */

const UrlSchema = new Schema({
  name:  { type: String, default: '', trim: true, maxlength: 40, unique: true },
  inn:   { type: String, default: '', trim: true },
  out:   { type: String, default: '', trim: true },
  memo:  { type: String, default: '', trim: true },
  ips:   []
});

/**
 * Statics
 */

UrlSchema.statics = {
  /**
   * Find item by id
   *
   * @param {ObjectId} id
   * @api private
   */

  load: function(_id) {
    return this.findOne({ _id })
      .exec();
  },

  /**
   * List items
   *
   * @param {Object} options
   * @api private
   */

  list: function(options) {
    const criteria = options.criteria || {};
    const page = options.page || 0;
    const limit = options.limit || 30;
    return this.find(criteria)
      .limit(limit)
      .skip(limit * page)
      .exec();
  }
};

mongoose.model('Url', UrlSchema);
