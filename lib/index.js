var config = require('config');
var device = require('./device');


if(config.database == "mongo"){
  module.exports = require('./mongo');
}else{
  require('./mongo');
  module.exports = require('./mysql');
}
