const path = require('path');
const server = require('../web');
const mongoose = require('mongoose');

// Export globals
global.server = server;
global.apiUrl = pathname => `http://localhost:3000${pathname}`;
global.imagesPath = path.join(__dirname, '..', 'tmp', 'test-images');

describe('Mapas Coletivos', function () {
  before(done => {
    mongoose.connection.on('open', done);
  });

  require('./test-content.js');
  require('./test-images.js');

  after(async function () {
    mongoose.connection.close();
  });
});