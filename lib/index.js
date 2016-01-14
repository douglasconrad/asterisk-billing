exports.mysql = function(mysql){
	var connection = mysql.createConnection({
  		host     : 'localhost',
  		user     : 'snep',
  		password : 'sneppass',
  		database : 'billing'
	})
	return connection;
}

exports.insert = function(bill,connection){
	connection.connect(function(err) {
  		if (err) {
    		console.error('error connecting: ' + err.stack);
    		return;
    	}
    });
	connection.query('INSERT INTO cdr SET ?', bill, function(err,result){
				if (err) {
					//connection.end();
					console.log(err);
					console.log(result);
				}
		}
	);
		/*(`callid`,`calldate`,`duration`,`billsec`,`src`,`srcname`,`dst`,`dstname`,`status`) VALUES 
		(`%s`,`%s`,`%s`,`%s`,`%s`,`%s`,`%s`,`%s`,`%s`)', (
			bill['callid'],
			bill['calldate'],
			bill['duration'],
			bill['billsec'],
			bill['src'],
			bill['srcname'],
			bill['dst'],
			bill['dstname'],
			bill['status']
			), function(err){
				if (err) throw err;
		}
		);
		*/
	//return connection.end();
}

exports.savecdr = function(abilling,connection,bill){
	abilling.insert(bill,connection);
	abilling.webhook(bill);
}

exports.webhook = function(bill){
	// request to send data to contactura
	var request = require('request');
	request('http://demo.opens.com.br/post2/',
            { json: true, body: bill },
            function(err, res, body) {
              // `body` is a js object if request was successful
              console.log(JSON.stringify(res));
              //console.log(err);
              result = res;
    });
}