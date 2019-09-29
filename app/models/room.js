'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Room Schema
 */

const RoomSchema = new Schema({
  mgr:    { type: Schema.ObjectId, ref: 'Pc', index: true },  
  name:   { type : String, default : '', trim : true },
  pcs:    [],
  at:     { type : Date, default : Date.now }
});

/**
 * Statics
 */

RoomSchema.statics = {

  /**
   * Find document by id
   *
   * @param {ObjectId} id
   * @api private
   */

  load: function (_id) {
    return this.findOne({ _id })
      .populate('mgr')
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
      .populate('fromPc')
      .populate('toPc')
      .sort({ at: -1 })
      .limit(limit)
      .skip(limit * page)
      .exec();
  }
};

mongoose.model('Room', RoomSchema);
