var config = require('config');
var mongoose = require('mongoose');
var Cdr = require('../models/cdr');
var CallFlow = require('../models/callflow');
var HostConfig = require('../models/config');
var Webhooks = require('./webhooks');
var log = require('./log');

var mongo_host = process.env.MONGO_PORT_27017_TCP_ADDR ? process.env.MONGO_PORT_27017_TCP_ADDR : config.mongo.host;
var mongo_port = process.env.MONGO_PORT_27017_TCP_PORT ? process.env.MONGO_PORT_27017_TCP_PORT : config.mongo.port;
var mongo_db = (config.mongo.db) ? config.mongo.db : 'abilling';

var url = 'mongodb://'+ mongo_host + ':' + mongo_port + '/';

var connection = {
    'url' : url + mongo_db
}

mongoose.connect(connection.url); // connect to our database


function insert(bill){

		// adjusting fields to insert in DB
		call = {
			callid: bill.callid,
			uuid: bill.uuid,
			calldate: bill.calldate,
			srcname: bill.fromname,
			src: bill.from,
			dst: bill.to,
			dstname: bill.toname,
			route: bill.route,
			duration: bill.duration,
			billsec: bill.billsec,
			statusdesc: bill.status,
			status: bill.status
		}
		var newCdr = new Cdr(call);
    newCdr.save(function(error, result){
      if(error) log.error(error)
    });

		for (var i = bill.callflow.length - 1; i >= 0; i--) {
			// adjusting fields to insert in DB
			callflow = {
				callid: bill.callid,
				uuid: bill.uuid,
				uniqueid: bill.callflow[i].callid,
				calldate: bill.callflow[i].calldate,
				src: bill.callflow[i].from,
				dst: bill.callflow[i].to,
				duration: bill.callflow[i].duration,
				billsec: bill.callflow[i].billsec,
				statusdesc: bill.callflow[i].status,
				status: bill.callflow[i].status
			}
      var newCallFlow = new CallFlow(callflow);
      newCallFlow.save(function(error, result){
        if(error) log.error(error)
      });
		}

}

function savecdr(bill){
	bill.uuid = require('./device').uuid;
	insert(bill);
	Webhooks.webhook(bill);

}


function search(data){
		log.info('Starting Search for %s', JSON.stringify(data));
		return q.Promise(function(resolve, reject){
			if(data){
				Cdr.find({}, function(err, rows){
					if(err){
						log.info("Error getting cdr: %s", err);
						reject(err);
					}
					resolve(rows);
				});
        		//resolve(data);
			}else{
				reject({message: 'Rejected without data'});
			}

    	});

}

module.exports = { insert, search, savecdr }
