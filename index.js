/**
 * port:  port server
 * host: host server
 * username: username for authentication
 * password: username's password for authentication
 * events: this parameter determines whether events are emited.
 * 187.103.106.67 snep-dev server and 54.94.235.38 conector.opens.com.br
 **/
var ami = new require('asterisk-manager')('5038','localhost', 'snep', 'sneppass', true);

var Rx = require('rx');
var util = require('util');

// In case of any connectiviy problems we got you coverd.
ami.keepConnected();

// NewChannel event Observable
var source = Rx.Observable.create( function(observer) {

	ami.on('newchannel', function(evt) {
    		observer.onNext(evt);
	})
})
.map(function(x){
  var date = new Date();
  var call = {};
    call = x;
    call.date = date;
  return call;
});

// Hangup event Observable
var hangup = Rx.Observable.create( function(observer) {

  ami.on('hangup', function(evt) {
    observer.onNext(evt);
  });

})

.map(function(x){
  var date = new Date();
  var call2 = {};
    call2.uniqueid = x.linkedid;
    call2.from = x.calleridnum;
    call2.fromname = x.calleridname;
    call2.to = x.connectedlinenum;
    call2.toname = x.connectedlinename;
    call2.hangupdate = date;
    call2.status = x.channelstate;
  return call2;
});

// Join two Observables (Newchannel and Hangup)
var joinall = Rx.Observable.zip(
	source,
	hangup
)
	.map(function(source){
		var call = {};
		//call = source;
    		call.from = source[1].from;
    		call.fromname = source[1].fromname;
    		call.to = source[1].to;
    		call.toname = source[1].toname;
    		call.hangupdate = source[1].hangupdate;
    		call.date = source[0].date;
    		call.uniqueid = source[0].uniqueid;
    		call.linkedid = source[1].uniqueid;
    		call.status = source[1].status;
		call.billsec = (call.hangupdate - call.date) / 1000;
  		return call;
});

// Doing subscription for this events and do something with them
var subhangup = joinall.subscribe(
	function(x){
	   if(x.linkedid == x.uniqueid){
		console.log("Hangup in subscribe:" + JSON.stringify(x));
	   }
	},
	function(err){
		console.log("Hangup Error in:" + JSON.stingify(err));
	},
	function(y){
		console.log("Hangup Done:" + JSON.stringify(y));
	}
	);

// Listen for any/all AMI events.
//ami.on('managerevent', function(evt) {console.log(evt) });

// Listen for specific AMI events. A list of event names can be found at
// https://wiki.asterisk.org/wiki/display/AST/Asterisk+11+AMI+Events

/* hangup */
/*
var hangup = ami.on('hangup', function(evt) {
	var result = JSON.stringify(evt);
  });
 */
  //return result;

//ami.on('confbridgejoin', function(evt) {});

// Listen for Action responses.
/*
ami.on('response', function(evt) {
	var result = JSON.stringify(evt);
	console.log('RESPONSES ' + result)
});

*/

