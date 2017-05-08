var request = require('request');
var HostConfig = require('../models/config');
var log = require('./log');

function webhook(bill){

	var webhooks = getwebhooks(function(err,webhooks){
		if(err){
			log.info("Error getting webhooks: %s", JSON.stringify(err));
			return
		}
		for (var i = webhooks.length - 1; i >= 0; i--) {
			log.info("Sending to webhook %s through URL %s METHOD %s",webhooks[i].name,webhooks[i].url,webhooks[i].method);

			request(webhooks[i].url,
		            {
		            	json: true,
		            	method: webhooks[i].method,
		            	body: bill
		            },
		            function(err, res, body) {
		              if(err){
		              	log.info('Error Sending bill: %s',err);
		              }
		              // `body` is a js object if request was successful
		              log.info(JSON.stringify(res));

		              result = res;
		              log.info("<=======================================================>");
		    });
		};
	});

}

function getwebhooks(callback){
		log.debug("Getting all Webhooks configured...");
		HostConfig.find({}, function(err, rows){
			if(err){
				callback(err,null);
			}

      if(rows.webhooks && rows.webhooks.length > 0){
        callback(null,rows);
      }else{
        callback({ message: 'no webhook configured'});
      }

		});
}

module.exports = { getwebhooks, webhook }
