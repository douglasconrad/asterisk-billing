var config = require('config');

if(config.database == "mongo"){
  require('./mongo');
}else{
  require('./mysql');
}
