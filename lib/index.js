exports.mysql = function(mysql){
	var connection = mysql.createConnection({
  		host     : 'localhost',
  		user     : 'snep',
  		password : 'sneppass',
  		database : 'billing'
	})
	connection.connect(function(err) {
  		if (err) {
    		console.error('error connecting: ' + err.stack);
    		return;
    	}
    });
    return connection;
}

exports.insert = function(bill){
	// adjusting fields to insert in DB
	call = {
		callid: bill.callid,
		calldate: bill.calldate,
		srcname: bill.fromname,
		src: bill.from,
		dst: bill.to,
		dstname: bill.toname,
		duration: bill.duration,
		billsec: bill.billsec,
		statusdesc: bill.status,
		status: bill.status
	}
	connection.query('INSERT INTO cdr SET ?', call, function(err,result){
				if (err) {
					//connection.end();
					console.log(err);
					console.log(result);
				}
		}
	);
	
}

exports.savecdr = function(bill){
	abilling.insert(bill);
	abilling.webhook(bill);
}

exports.webhook = function(bill){
	
	// request to send data to webhooks
	var request = require('request');
	var webhooks = getwebhooks(function(err,webhooks){
		if(err){
			console.log("Error getting webhooks: %s", err);
			return
		}
		for (var i = webhooks.length - 1; i >= 0; i--) {
			console.log("Sending to webhook %s through URL %s METHOD %s",webhooks[i].name,webhooks[i].url,webhooks[i].method);

			request(webhooks[i].url,
		            { 
		            	json: true, 
		            	method: webhooks[i].method, 
		            	body: bill 
		            },
		            function(err, res, body) {
		              if(err){
		              	console.log('Error Sending bill: %s',err);
		              }
		              // `body` is a js object if request was successful
		              console.log(JSON.stringify(res));
		              
		              result = res;
		              console.log("<=======================================================>");
		    });
		};
	});
	
}

function getwebhooks(callback){
		console.log("Getting all Webhooks configured...");
		connection.query("SELECT * FROM webhooks", function(err, rows, fields){
			if(err){
				console.log("Error getting webhooks: %s", err);
				callback(err,null);
			}
			callback(null,rows);
		});		
}