var config = require('config');
var log = require('./log');

/**
 * port:  port server
 * host: host server
 * username: username for authentication
 * password: username's password for authentication
 * events: this parameter determines whether events are emited.
 * 187.103.106.67 snep-dev server and 54.94.235.38 conector.opens.com.br
 **/
var amiport = (process.env.AMI_PORT) ? process.env.AMI_PORT : config.asterisk.amiport;
var amihost = (process.env.AMI_HOST) ? process.env.AMI_HOST : config.asterisk.amihost;
var amiuser = (process.env.AMI_USER) ? process.env.AMI_USER : config.asterisk.amiuser;
var amipassword = (process.env.AMI_PASSWORD) ? process.env.AMI_PASSWORD : config.asterisk.amipassword;


log.info('Connecting to AMI_HOST: %s', amihost);
var ami = new require('asterisk-manager')(
	amiport,
	amihost,
	amiuser,
	amipassword,
	true);

module.exports = { ami }

// For Debug only

// ami.on('managerevent',function(evt,x){
// 	console.log('EVENTO: %s', JSON.stringify(evt));
// });

// In case of any connectiviy problems we got you coverd.
ami.keepConnected();

// the first try connection
ami.once('close', function(e) {
	log.debug('AMI Connection closed!')
});

ami.on('disconnect', function(e) {
	log.debug('AMI Connection was disconnected!')
});
ami.on('connect', function(e) {
	log.debug('AMI Connection is open!')
	// everything we connect and after lost the connection we will show
	ami.once('close', function(e) {
		log.debug('AMI Connection closed!')
	});
});

// loading CDR AMI monitor
var amicdr = require("./ami-cdr.js");
