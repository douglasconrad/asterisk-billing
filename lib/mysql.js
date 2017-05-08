var mysql = require('mysql');
var log = require('./log');
var config = require('config');
var Webhooks = require('./webhooks');

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
	bill.uuid = require('./device').uuid;
	insert(bill);
	Webhooks.webhook(bill);

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

module.exports = { insert, search, savecdr }
