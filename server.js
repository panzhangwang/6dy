'use strict';

/*
 * nodejs-express-mongoose-demo
 * Copyright(c) 2013 Madhusudhan Srinivasa <madhums8@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies
 */

require('dotenv').config();

const fs = require('fs');
const join = require('path').join;
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const config = require('./config');

const models = join(__dirname, 'app/models');
const port = process.env.PORT || 3000;
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

/**
 * Expose
 */

module.exports = app;

// Bootstrap models
fs.readdirSync(models)
  .filter(file => ~file.search(/^[^.].*\.js$/))
  .forEach(file => require(join(models, file)));

// Bootstrap routes
require('./config/passport')(passport);
require('./config/express')(app, passport);
require('./config/routes')(app, passport);

const opts = {
  keepAlive: 1,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
}

connect();

function listen() {
  if (app.get('env') === 'test') return;
  server.listen(port);
  console.log('Express app started on port ' + port);
}
function connect() {
  mongoose.connection
    .on('error', console.log)
    .on('disconnected', connect)
    .once('open', listen);
  return mongoose.connect(config.db, opts);
}

io.on('connection', function (socket) {
  socket.on('notify', function(data) {
    socket.emit('broad', data);
    socket.broadcast.emit('broad',data);
  });
});