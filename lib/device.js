var nodeuuid = require('node-uuid');
var datetime = require('node-datetime');
var Config = require('../models/config');

function createUUID(callback){

  var uuid = nodeuuid.v4();
  Config.update({ uuid:''}, {uuid: uuid}, {upsert: true}, function(error, result){
    if(error) return callback(error)
    return callback(null, uuid);
  })

}


function getUUID(callback){
  Config.findOne({}, function(error, config){
    if(error) return callback(error);

    if(!config.uuid){
      createUUID(function(error, uuid){
        module.exports.uuid = uuid;
        return callback(null, uuid);
      })
    }else{
      module.exports.uuid = config.uuid;
      return callback(null, config.uuid);
    }

  })
}

module.exports = { getUUID };
