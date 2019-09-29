'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Pc Schema
 */

const PcSchema = new Schema({
  ip:    { type: String, default: '', trim: true, maxlength: 40, unique: true },
  name:  { type: String, default: '', trim: true },
  memo:  { type: String, default: '', trim: true },
  loc:   { type: String, default: '', trim: true },
  phone: { type: String, default: '', trim: true },
  dept:  { type: String, default: '', trim: true },
  flow:  { type: String, default: '无许可', trim: true },
  at:    { type: Date, default: Date.now }
});

/**
 * Statics
 */

PcSchema.statics = {
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
      .sort({ at: -1 })
      .limit(limit)
      .skip(limit * page)
      .exec();
  }
};

mongoose.model('Pc', PcSchema);
