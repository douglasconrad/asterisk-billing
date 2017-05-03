var mysql = require('mysql');
var log = require('./log');
var config = require('config');

var mysqlhost = (process.env.MYSQL_HOST) ? process.env.MYSQL_HOST : config.mysql.host;
var mysqluser = (process.env.MYSQL_USER) ? process.env.MYSQL_USER : config.mysql.user;
var mysqlpassword = (process.env.MYSQL_PASSWORD) ? process.env.MYSQL_PASSWORD : config.mysql.password;
var mysqldatabase = (process.env.MYSQL_DATABASE) ? process.env.MYSQL_DATABASE : config.mysql.database;

var connection = mysql.createConnection({
		host     : mysqlhost,
		user     : mysqluser,
		password : mysqlpassword,
		database : mysqldatabase
});

connection.connect(function(err) {
	if (err) {
		log.error('error connecting: ' + err);
	}
});



function insert(bill){

		log.info("My UUID: " + bill.uuid);
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
		connection.query('INSERT INTO cdr SET ?', call, function(err,result){
					if (err) {
						//connection.end();
						log.error(err);
					}
					log.info(result);
			}
		);
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
			connection.query('INSERT INTO callflow SET ?', callflow, function(err,result){
				if (err) {
					//connection.end();
					log.info(err);
				}
				log.info(result);
			});
		}

}

function savecdr(bill){
	getuuid(function(err, uuid){
		if(err){
			throw err;
		}
		bill.uuid = uuid;
		insert(bill);
		webhook(bill);
	})

}

function webhook(bill){

	// request to send data to webhooks
	var request = require('request');
	var webhooks = getwebhooks(function(err,webhooks){
		if(err){
			log.info("Error getting webhooks: %s", err);
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

function getuuid(callback){
		connection.query("SELECT * FROM uuid LIMIT 1", function(err, rows, fields){
			if(err){
				log.info("Error Getting UUID: %s", err);
				callback(err,null);
			}
			if(rows[0]){
				log.info("UUID already exist: " + JSON.stringify(rows));
				callback(null,rows[0].uuid);
			}else{
				var uuid = generateuuid();
				log.info("UUID is not defined! Creating one: %s", uuid);
				callback(null,uuid);
			}
		});
}


function generateuuid(){
	var uuid = require('node-uuid');
	var datetime = require('node-datetime');
	var dt = datetime.create();
  var now = dt.format('Y-m-d H:M:S');
	var my_uuid = uuid.v4();
	log.info("UUID Generated: %s", my_uuid);
	connection.query('INSERT INTO uuid SET ?', {date: now, uuid: my_uuid}, function(err,result){
				if (err) {
					//connection.end();
					log.info(err);
					log.info(result);
				}
		}
	);
	return my_uuid;
}

function getwebhooks(callback){
		log.info("Getting all Webhooks configured...");
		connection.query("SELECT * FROM webhooks", function(err, rows, fields){
			if(err){
				log.info("Error getting webhooks: %s", err);
				callback(err,null);
			}
			callback(null,rows);
		});
}

function search(data){
		log.info('Starting Search for %s', JSON.stringify(data));
		return q.Promise(function(resolve, reject){
			if(data){
				connection.query("SELECT * FROM cdr", function(err, rows, fields){
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

module.exports = { insert, webhook, search, savecdr }
