var ami = new require('asterisk-manager')('5038','localhost', 'snep', 'sneppass', true);

var mysql = require('mysql');

global.abilling = require('./lib/');

global.connection = abilling.mysql(mysql);

var Rx = require('rx');
var util = require('util');

// In case of any connectiviy problems we got you coverd.
ami.keepConnected();

console.log("Starting the observer for now calls");


var newchannel = Rx.Observable.fromEvent(ami,'newchannel');
var newstate = Rx.Observable.fromEvent(ami,'newstate');	
var hangup = Rx.Observable.fromEvent(ami,'hangup');			


var joining = Rx.Observable.merge(
	newchannel,
	newstate,
	hangup);

var bill = [];

var billing = joining.subscribe(
	function(x){
		var date = new Date();
		if(x.event === 'Newchannel'){
			if(x.linkedid !== x.uniqueid){
					bill[x.linkedid].route = x.channel.split('-')[0];
					bill[x.linkedid].dstchannel = x.channel;
					bill[x.linkedid].linkedid = x.uniqueid;
					console.log("New channel in a already monitored call: %s", JSON.stringify(bill[x.linkedid]));
			}else{
				
				bill[x.uniqueid] = {
					callid: x.uniqueid,
					calldate: date,
					from: x.calleridnum,
					fromname: x.calleridname,
					to: x.exten,
					route: 'local',
					dstchannel: '',
					channel: x.channel,
					status: x.channelstate,
					linkedid: x.linkedid,
					toname: "<unknown>"
				};
				console.log("New call monitored: %s", JSON.stringify(bill[x.uniqueid]));
			}
		}
		if(x.event === 'Newstate'){
			try {
				if(x.channelstate === '6' && (!bill[x.uniqueid].answerdate)){
					bill[x.uniqueid].answerdate = date;
					bill[x.uniqueid].status = x.channelstate;
					console.log('Call was ANSWERED: %s', JSON.stringify(x));
				}
			}catch (err){
				//console.log("I don't know what is happing here! %s", err);
				//console.log("Event: %s", JSON.stringify(x));
			}
		}
		if(x.event === 'Hangup'){
			//console.log("Hanguping a channel: %s", JSON.stringify(x));
			try {
				bill[x.uniqueid].hangupdate = date;
				bill[x.uniqueid].status = x.channelstate;
				bill[x.uniqueid].duration = ((bill[x.uniqueid].hangupdate - bill[x.uniqueid].calldate) / 1000).toFixed(0);
				if(bill[x.uniqueid].answerdate){
					bill[x.uniqueid].billsec = ((bill[x.uniqueid].hangupdate - bill[x.uniqueid].answerdate) / 1000).toFixed(0);	
				}else{
					bill[x.uniqueid].billsec = '0';
				}
				savebill(bill[x.uniqueid]);	
			}catch (err){
				//console.log("Hanguping an unmonitoring channel: %s", JSON.stringify(x));
			}
			
		}
		
	},
	function(err){
		console.log('Error: %s', err);
	},
	function(){
		console.log("Done");
	});

function savebill(bill){
	if(bill.hangupdate){
		if(!bill.answerdate){ bill.answerdate = ''; };
		var savecdr = abilling.savecdr(bill);
		console.log("Closing billing:" + JSON.stringify(bill));	
		console.log("<=======================================================>");
	}
}

