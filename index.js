var request = require('superagent');
var connect = require('connect');
var http = require('http');
var bodyParser = require('body-parser');
var bunyan = require('bunyan');
global.q = require('q');
var port = 3100;
global.log = bunyan.createLogger({
	name: "asterisk-billing",
	streams:
    [
    {
      stream: process.stdout,
      level: 'debug'
    },
    {
      path: 'billing.log',
      level: 'info'
    }
    ]
});

var ami = new require('asterisk-manager')('5038','localhost', 'snep', 'sneppass', true);

var mysql = require('mysql');

global.abilling = require('./lib/');

global.connection = abilling.mysql(mysql);

var Rx = require('rx');
var util = require('util');

// In case of any connectiviy problems we got you coverd.
ami.keepConnected();

log.info("Starting the observer for now calls");
var app = connect()
app.use(bodyParser.json());
app.use('/report', function(req, res){
    log.info('Received request for: %s', JSON.stringify(req.body));
    if(req.body){
        promise = abilling.search(req.body);
        promise.then(
            function(result){
                res.end(JSON.stringify(result));
            },
            function(err){
                res.end(err);
            });    
    }else{
        result = {return: null};
        res.end(JSON.stringify(result));
    }
    
});

//create node.js http server and listen on port
http.createServer(app).listen(port);
log.info("server listening on http://*:%s/report", port);

var newchannel = Rx.Observable.fromEvent(ami,'newchannel');
var newstate = Rx.Observable.fromEvent(ami,'newstate');	
var hangup = Rx.Observable.fromEvent(ami,'hangup');			


var joining = Rx.Observable.merge(
	newchannel,
	newstate,
	hangup);

var bill = [];
var count = [];

var billing = joining.subscribe(
	function(x){
		var date = new Date();
		if(x.event === 'Newchannel'){
			//var uniqueid = x.uniqueid;
			log.info('DEBUG: Newchannel -> %s', JSON.stringify(x));
			if(bill[x.linkedid]){
				if(bill[x.linkedid].route === 'local'){
					bill[x.linkedid].route = x.channel.split('-')[0];
					bill[x.linkedid].dstchannel = x.channel;	
				}
				bill[x.linkedid].linkedid = x.uniqueid;
				bill[x.linkedid].callflow.push({
					id: ++count[x.linkedid].count,
					callid: x.uniqueid,
					from: x.calleridnum,
					to: x.exten,
					channel: x.channel,
					status: x.channelstate,
					calldate: date
				});
				log.info("New channel in a already monitored call: %s", JSON.stringify(bill[x.linkedid]));
				
			}else if(!bill[x.uniqueid]){
				count[x.uniqueid] = {
					count:1
				};
				bill[x.uniqueid] = {
					id: count[x.uniqueid].count,
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
					toname: "<unknown>",
					callflow: []
				};
				log.info("New call monitored: %s", JSON.stringify(bill[x.uniqueid]));
			}else{
				log.info("DEBUG: Unmonitored Channel -> %s", JSON.stringify(x));
			}
			
		}
		if(x.event === 'Newstate'){
			try {
				if(bill[x.uniqueid]){
					bill[x.uniqueid].answerdate = date;
					bill[x.uniqueid].status = x.channelstate;
					if(x.channelstate === '6'){
						log.info('Call was ANSWERED by the caller: %s', JSON.stringify(bill[x.uniqueid]));
					}
				}else if(bill[x.linkedid]){
					for (var i = bill[x.linkedid].callflow.length - 1; i >= 0; i--) {
						if(bill[x.linkedid].callflow[i].callid === x.uniqueid){
							bill[x.linkedid].callflow[i].status = x.channelstate;
							if(x.channelstate === '6'){
								bill[x.linkedid].callflow[i].answerdate = date;
								log.info('Call was ANSWERED by the called: %s', JSON.stringify(bill[x.linkedid]));
							}
						}
					}
				}
			}catch (err){
				log.info(err,"Error in a Newstate: %s", err);
				log.info(err, "DEBUG: Newstate Error -> %s", JSON.stringify(x));
			}
		}
		if(x.event === 'Hangup'){
			//try {
				if(bill[x.uniqueid]){
					count[x.uniqueid].count = count[x.uniqueid].count - 1;
					bill[x.uniqueid].status = x.channelstate;
					bill[x.uniqueid].hangupdate = date;
					bill[x.uniqueid].duration = (
						(bill[x.uniqueid].hangupdate - bill[x.uniqueid].calldate) / 1000)
						.toFixed(0);
					if(bill[x.uniqueid].answerdate){
						bill[x.uniqueid].billsec = ((bill[x.uniqueid].hangupdate - bill[x.uniqueid].answerdate) / 1000).toFixed(0);	
					}else{
						bill[x.uniqueid].billsec = '0';
					}
					log.info('DEBUG: call [%s] Hanguping the caller channel on the bridge: %s',count[x.uniqueid].count, JSON.stringify(bill[x.uniqueid]));
					if(count[x.uniqueid].count === 0){
						savebill(bill[x.uniqueid]);	
					}
				}else if(bill[x.linkedid]){
					//bill[x.linkedid].status = x.channelstate;
					count[x.linkedid].count = count[x.linkedid].count - 1;
					bill[x.linkedid].hangupdate = date;
					bill[x.linkedid].duration = (
						(bill[x.linkedid].hangupdate - bill[x.linkedid].calldate) / 1000)
						.toFixed(0);
					for (var i = bill[x.linkedid].callflow.length - 1; i >= 0; i--) {
						if(bill[x.linkedid].callflow[i].callid === x.uniqueid){
							bill[x.linkedid].callflow[i].duration = (
								(bill[x.linkedid].hangupdate - bill[x.linkedid].callflow[i].calldate) / 1000)
								.toFixed(0);
							if(bill[x.linkedid].callflow[i].answerdate){
								bill[x.linkedid].callflow[i].billsec = (
									(bill[x.linkedid].hangupdate - bill[x.linkedid].callflow[i].answerdate) / 1000)
								.toFixed(0);	
							}else{
								bill[x.linkedid].callflow[i].billsec = '0';
							}
						}
					}
					log.info('DEBUG: call [%s] Hanguping the called channel on the bridge: %s',count[x.linkedid].count, JSON.stringify(bill[x.linkedid]));
					if(count[x.linkedid].count === 0){
						savebill(bill[x.linkedid]);	
					}
				}else{
					log.info("DEBUG: Hanguping an unmonitoring channel: %s", JSON.stringify(x));	
				}
				
				
			//}catch (err){
			//	log.info('Error: %s', err);
			//	log.info("Hanguping an unmonitoring channel: %s", JSON.stringify(x));
			//}
			
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
		log.info("Closing billing:" + JSON.stringify(bill));	
		log.info("<=======================================================>");
		return;
	}
}


