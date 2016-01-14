/**
 * port:  port server
 * host: host server
 * username: username for authentication
 * password: username's password for authentication
 * events: this parameter determines whether events are emited.
 * 187.103.106.67 snep-dev server and 54.94.235.38 conector.opens.com.br
 **/
var ami = new require('asterisk-manager')('5038','localhost', 'snep', 'sneppass', true);

var mysql = require('mysql');

var abilling = require('./lib/');

var connection = abilling.mysql(mysql);

var Rx = require('rx');
var util = require('util');

// In case of any connectiviy problems we got you coverd.
ami.keepConnected();

// NewChannel event Observable
var source = Rx.Observable.create( function(observer) {
  console.log("Starting the observer for now calls");
	ami.on('newchannel', function(evt) {
        if(evt.linkedid == evt.uniqueid){
          console.log("New call detected: {from:%s , name:%s, to:%s}", 
          JSON.stringify(evt.calleridnum),
          JSON.stringify(evt.calleridname),
          JSON.stringify(evt.exten));  
        }
        
    		observer.onNext(evt);
	})
})
.map(function(x){
  var date = new Date();
  var call = {};
    call = x;
    call.to = x.exten;
    call.date = date;
  return call;
});

var newstate = Rx.Observable.create( function(observer){
  ami.on('newstate', function(evt){
    if(evt.channelstate != "6"){
      observer.onNext(evt);  
    }
  })
})
.map(function(x){
  var call = {};
  if(x.uniqueid == x.linkedid){
    console.log("Newstate in a monitored channel: %s - %s for channel %s", x.channelstate,x.channelstatedesc,x.channel);
    call.newstatedate = new Date();
    if(x.channelstate == 6){
        call.answerdate = new Date();
        call.from = x.calleridnum;
      console.log("Call Answered at: %s", JSON.stringify(call));
    }
  }
  return call;
})

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
  console.log("Call Ended: %s", JSON.stringify(call2));
  return call2;
});

// Join three Observables (Newchannel, Answered and Hangup)
var joinall = Rx.Observable.zip(
	source,
	hangup,
  newstate
)
	.map(function(source){
    console.log("Joined: %s", JSON.stringify(source));
		var call = {};
    		call.from = source[1].from;
    		call.fromname = source[1].fromname;
        call.to = source[1].to;
        if (call.to === "<unknown>") {
          call.to = source[0].to;
        };
        call.toname = source[1].toname;
    		call.hangupdate = source[1].hangupdate;
    		call.date = source[0].date;
        call.answerdate = source[2].answerdate;
    		call.uniqueid = source[0].uniqueid;
    		call.linkedid = source[1].uniqueid;
    		call.status = source[1].status;
		    call.billsec = (call.hangupdate - source[2].answerdate) / 1000;
        if(!call.billsec){ call.billsec = 0; }
        call.duration = (call.hangupdate - call.date) / 1000;
  		return call;
});

// Doing subscription for this events and do something with them
var subhangup = joinall.subscribe(
	function(x){
	  if(x.linkedid == x.uniqueid){
      var bill = {
        callid: x.uniqueid,
        calldate: x.date,
        src: x.from,
        srcname: x.fromname,
        dst: x.to,
        dstname: x.toname,
        status: x.status,
        billsec: x.billsec,
        duration: x.duration
      }
      //var savecdr = require('./lib/').savecdr(abilling,connection,bill);
      var savecdr = abilling.savecdr(abilling,connection,bill);
		  console.log("Hangup in subscribe:" + JSON.stringify(x));
	  }
	},
	function(err){
		console.log("Hangup Error in:" + JSON.stringify(err));
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

