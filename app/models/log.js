'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Log Schema
 */

const LogSchema = new Schema({
  srcpc:  { type: Schema.ObjectId, ref: 'Pc' },
  vispc:  { type: Schema.ObjectId, ref: 'Pc' },
  title:  { type : String, default : '', trim : true },
  code:   { type : String, default : '', trim : true },
  emp:    { type : String, default : '', trim : true },
  mime:   { type : String, default : '', trim : true },
  ext:    { type : String, default : '', trim : true },
  size:   Number,
  at:     { type : Date, default : Date.now }
});

/**
 * Statics
 */

LogSchema.statics = {

  /**
   * Find document by id
   *
   * @param {ObjectId} id
   * @api private
   */

  load: function (_id) {
    return this.findOne({ _id })
      .populate('srcpc')
      .populate('vispc')
      .exec();
  },

  /**
   * List documents
   *
   * @param {Object} options
   * @api private
   */

  list: function (options) {
    const criteria = options.criteria || {};
    const page = options.page || 0;
    const limit = options.limit || 30;
    return this.find(criteria)
      .populate('srcpc')
      .populate('vispc')
      .sort({ at: -1 })
      .limit(limit)
      .skip(limit * page)
      .exec();
  }
};

mongoose.model('Log', LogSchema);
