'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Notice Schema
 */

const NoticeSchema = new Schema({
  pc:   { type: Schema.ObjectId, ref: 'Pc' },  
  who:  { type : String, default : '', trim : true },
  what: { type : String, default : '', trim : true },  
  flag: { type : String, default : 'new', trim : true },
  ack:  { type : String, default : '', trim : true },
  by:   { type: Schema.ObjectId, ref: 'Pc' },  
  at:   { type : Date, default : Date.now },
  mat:  { type : Date }
});

/**
 * Statics
 */

NoticeSchema.statics = {

  /**
   * Find document by id
   *
   * @param {ObjectId} id
   * @api private
   */

  load: function (_id) {
    return this.findOne({ _id })
      .populate('pc')
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
      .populate('pc')
      .populate('by')
      .sort({ at: -1 })
      .limit(limit)
      .skip(limit * page)
      .exec();
  }
};

mongoose.model('Notice', NoticeSchema);
