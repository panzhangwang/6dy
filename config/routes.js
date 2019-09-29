'use strict';

/*
 * Module dependencies.
 */

const users = require('../app/controllers/users');
const rooms = require('../app/controllers/rooms');
const documents = require('../app/controllers/documents');
const urls = require('../app/controllers/urls');
const pcs = require('../app/controllers/pcs');
const auth = require('./middlewares/authorization');

/**
 * Route middlewares
 */


const fail = {
  failureRedirect: '/login'
};

/**
 * Expose routes
 */

module.exports = function(app, passport) {
  const pauth = passport.authenticate.bind(passport);

  // user routes
  app.get('/login', users.login);
  app.get('/signup', users.signup);
  app.get('/logout', users.logout);
  app.post('/users', users.create);
  app.post(
    '/users/session',
    pauth('local', {
      failureRedirect: '/login',
      failureFlash: 'Invalid email or password.'
    }),
    users.session
  );

  app.param('userId', users.load);

  // home route
  app.get('/', documents.index);

  app.param('urlId', urls.load);
  app.get('/urls', urls.index);
  app.get('/urls/new', auth.requiresLogin, urls.new);
  app.post('/urls', auth.requiresLogin, urls.create);
  app.get('/urls/:urlId/edit', auth.requiresLogin, urls.edit);
  app.put('/urls/:urlId', auth.requiresLogin, urls.update);
  app.delete('/urls/:urlId', auth.requiresLogin, urls.destroy);

  app.get('/nav', urls.nav);
  
  app.param('pcId', pcs.load);
  app.get('/inners', auth.requiresLogin, pcs.inners);
  app.get('/outers', auth.requiresLogin, pcs.outers);
  app.get('/pendings', auth.requiresLogin, pcs.pendings);

  app.get('/pcs/:pcId/edit', auth.requiresLogin, pcs.edit);
  app.get('/pcs/:pcId/change', pcs.change);
  app.post('/pcs/:pcId/change', pcs.changePost);
  app.post('/pcs/:pcId', auth.requiresLogin, pcs.update);
  

  app.get('/logs', auth.requiresLogin, documents.logs);
  app.get('/logs/:logId/download', auth.requiresLogin, documents.downloadlog);

  app.get('/cuts', auth.requiresLogin, documents.cuts);
  app.post('/cuts', auth.requiresLogin, documents.cutsPost);


  app.param('docId', documents.load);
  app.get('/my', documents.my);
  app.get('/docs/new', documents.new);
  app.get('/apply', documents.apply);
  app.post('/apply', documents.applyPost);
  app.post('/confirm', documents.confirmPost);
  
   // room routes
  app.param('roomId', rooms.load);
  app.get('/rooms', rooms.index);
  app.get('/rooms/new',  rooms.new);
  app.post('/rooms',  rooms.create);
  app.get('/rooms/:roomId/edit',  rooms.edit);
  app.put('/rooms/:roomId',  rooms.update);
  app.get('/rooms/:roomId',  rooms.show);
  app.get('/rooms/:roomId/pcs/add',  rooms.add);
  app.get('/rooms/:roomId/addpc/:pcId',  rooms.addPc);
  app.get('/rooms/:roomId/delpc/:pcId',  rooms.delPc);

  app.get('/rooms/:roomId/search',  rooms.search);
  app.post('/rooms/:roomId/search',  rooms.searchPost);
  
  app.get('/rooms/:roomId/tags/:tag',  rooms.showByTag);

  app.get('/rooms/:roomId/docs/add',  documents.new);
  app.post('/rooms/:roomId/docs',  documents.create);
  app.delete('/rooms/:roomId',  rooms.delete);
  
  app.param('documentId', documents.load);
  app.get('/documents/:documentId/predownload',  documents.predownload);
  app.post('/documents/:documentId/predownload',  documents.predownloadPost);
  app.get('/download/:pass',  documents.download);
    
  app.get('/documents/:documentId/tags',  documents.editTags);
  app.delete('/documents/:documentId',  documents.remove);
  app.get('/documents/:documentId/edit',  documents.edit);
  app.get('/documents/:documentId/pass',  documents.pass);
  app.post('/documents/:documentId/pass',  documents.passPost);
  app.post('/documents/:documentId',  documents.update);


  /**
   * Error handling
   */

  app.use(function(err, req, res, next) {
    // treat as 404
    if (
      err.message &&
      (~err.message.indexOf('not found') ||
        ~err.message.indexOf('Cast to ObjectId failed'))
    ) {
      return next();
    }

    console.error(err.stack);

    if (err.stack.includes('ValidationError')) {
      res.status(422).render('422', { error: err.stack });
      return;
    }

    // error page
    res.status(500).render('500', { error: err.stack });
  });

  // assume 404 since no middleware responded
  app.use(function(req, res) {
    const payload = {
      url: req.originalUrl,
      error: 'Not found'
    };
    if (req.accepts('json')) return res.status(404).json(payload);
    res.status(404).render('404', payload);
  });
};
