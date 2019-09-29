'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Dict Schema
 */

const DictSchema = new Schema({ 
  _id:  String,
  words: []
});

mongoose.model('Dict', DictSchema);
