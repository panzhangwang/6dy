'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const crypto = require('crypto');

/**
 * Document Schema
 */

const DocumentSchema = new Schema({
  room:   { type: Schema.ObjectId, ref: 'Room', index: true },
  pc:     { type: Schema.ObjectId, ref: 'Pc' },
  title:  { type : String, default : '', trim : true },
  code:   { type : String, default : '', trim : true },
  hash:   { type : String, default : '', trim : true },
  hashed: { type : Number, default : 0 },
  mime:   { type : String, default : '', trim : true },
  ext:    { type : String, default : '', trim : true },
  pass:   { type : String, default : '', trim : true, index: true },
  top:    Number,
  size:   Number,
  tags:   [],
  salt:   { type: String, default: '' },
  at:     { type : Date, default : Date.now }
});

DocumentSchema.virtual('password')
  .set(function(password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hash = this.encryptPassword(password);
  })
  .get(function() {
    return this._password;
  });

DocumentSchema.methods = {
  authenticate: function(plainText) {
    return this.encryptPassword(plainText) === this.hash;
  },
  makeSalt: function() {
    return Math.round(new Date().valueOf() * Math.random()) + '';
  },
  encryptPassword: function(password) {
    if (!password) return '';
    try {
      return crypto
        .createHmac('sha1', this.salt)
        .update(password)
        .digest('hex');
    } catch (err) {
      return '';
    }
  }
}

/**
 * Statics
 */

DocumentSchema.statics = {

  /**
   * Find document by id
   *
   * @param {ObjectId} id
   * @api private
   */

  load: function (_id) {
    return this.findOne({ _id })
      .populate('room')
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
      .sort({ at: -1 })
      .limit(limit)
      .skip(limit * page)
      .exec();
  }
};

mongoose.model('Document', DocumentSchema);
