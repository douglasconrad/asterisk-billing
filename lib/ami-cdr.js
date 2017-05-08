var Rx = require('rx');
var util = require('util');
var abilling = require('./index');
var config = require('config');
var log = require('./log');
var Webhooks = require('./webhooks');

var ami = require('./ami').ami;
var originateresponse = Rx.Observable.fromEvent(ami,'originateresponse');
var newchannel = Rx.Observable.fromEvent(ami,'newchannel');
var newstate = Rx.Observable.fromEvent(ami,'newstate');
var hangup = Rx.Observable.fromEvent(ami,'hangup');


var joining = Rx.Observable.merge(
	newchannel,
	newstate,
	originateresponse,
	hangup);

var bill = [];
var count = [];

var billing = joining.subscribe(
	function(x){
		var date = new Date();
		if(x.event === 'OriginateResponse'){
			log.info('DEBUG: Originate -> %s', JSON.stringify(x));
            bill[x.uniqueid].event = "originate";
            bill[x.uniqueid].callid = x.uniqueid;
            bill[x.uniqueid].from = x.calleridnum;
            bill[x.uniqueid].fromname = x.calleridname;
            bill[x.uniqueid].to = x.exten;
            bill[x.uniqueid].toname = "<unknown>";
            bill[x.uniqueid].route = 'local';
            bill[x.uniqueid].billsec = '0';

            log.info("[%s] New call monitored: %s", count[x.uniqueid].count, JSON.stringify(bill[x.uniqueid]));
		}
		if(x.event === 'Newchannel'){
			log.debug('DEBUG: Newchannel -> %s', JSON.stringify(x));
			if(bill[x.linkedid]){
				count[x.linkedid].count = ++count[x.linkedid].count;
				if(bill[x.linkedid].route === 'local'){
					bill[x.linkedid].route = x.channel.split('-')[0];
					bill[x.linkedid].dstchannel = x.channel;
				}
				bill[x.linkedid].linkedid = x.uniqueid;
				bill[x.linkedid].callflow.push({
					id: +count[x.linkedid].count,
					callid: x.uniqueid,
					from: x.calleridnum,
					to: x.exten,
					channel: x.channel,
					status: x.channelstate,
					statusdesc: x.channelstatedesc,
					calldate: date
				});
				log.debug("[%s] New channel in a already monitored call: %s", count[x.linkedid].count, JSON.stringify(bill[x.linkedid]));

			}else if(!bill[x.uniqueid]){
				count[x.uniqueid] = {
					count:1
				};
				bill[x.uniqueid] = {
					event: "manual",
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
					statusdesc: x.channelstatedesc,
					linkedid: x.linkedid,
					toname: "<unknown>",
					billsec: '0',
					callflow: []
				};
				log.debug("[%s] New call monitored: %s", count[x.uniqueid].count, JSON.stringify(bill[x.uniqueid]));
			}else{
				log.debug("DEBUG: Unmonitored Channel -> %s", JSON.stringify(x));
			}

		}
		if(x.event === 'Newstate'){
			try {
				if(bill[x.uniqueid]){
					if(x.channelstate === '6' && x.uniqueid !== x.linkedid){
						bill[x.uniqueid].answerdate = date;
						bill[x.uniqueid].status = x.channelstate;
						bill[x.uniqueid].statusdesc = x.channelstatedesc;
						log.debug('Call was ANSWERED by the caller: %s', JSON.stringify(x));
						Webhooks.webhook(bill);
					}
				}else if(x.channelstate === '6' && bill[x.linkedid] && x.calleridnum !== x.connectedlinenum){
					bill[x.linkedid].status = x.channelstate;
					bill[x.linkedid].answerdate = date;
					for (var i = bill[x.linkedid].callflow.length - 1; i >= 0; i--) {
						if(bill[x.linkedid].callflow[i].callid === x.uniqueid){
							bill[x.linkedid].callflow[i].status = x.channelstate;
							bill[x.linkedid].callflow[i].statusdesc = x.channelstatedesc;
							if(x.channelstate === '6'){
								bill[x.linkedid].callflow[i].answerdate = date;
								log.info('Call was ANSWERED by the called: %s', JSON.stringify(x));
								Webhooks.webhook(bill);
							}
						}
					}
				}
			}catch (err){
				log.error(err,"Error in a Newstate: %s", err);
				log.error(err, "DEBUG: Newstate Error -> %s", JSON.stringify(x));
			}
		}
		if(x.event === 'Hangup'){

				if(bill[x.uniqueid]){
					count[x.uniqueid].count = count[x.uniqueid].count - 1;
					bill[x.uniqueid].hangupdate = date;
					bill[x.uniqueid].duration = (
						(bill[x.uniqueid].hangupdate - bill[x.uniqueid].calldate) / 1000)
						.toFixed(0);
					if(bill[x.uniqueid].answerdate){
						bill[x.uniqueid].billsec = ((bill[x.uniqueid].hangupdate - bill[x.uniqueid].answerdate) / 1000).toFixed(0);
					}
					log.debug('DEBUG: call [%s][%s] Hanguping the caller channel on the bridge: %s',count[x.uniqueid].count, x.uniqueid, JSON.stringify(bill[x.uniqueid]));
					if(count[x.uniqueid].count === 0){
						log.debug('DEBUG: Saving billing on main call');
						savebill(bill[x.uniqueid]);
					}
				}else if(bill[x.linkedid]){
					count[x.linkedid].count = count[x.linkedid].count - 1;
					bill[x.linkedid].hangupdate = date;
					bill[x.linkedid].duration = (
						(bill[x.linkedid].hangupdate - bill[x.linkedid].calldate) / 1000)
						.toFixed(0);
					if(bill[x.linkedid].answerdate){
						bill[x.linkedid].billsec = ((bill[x.linkedid].hangupdate - bill[x.linkedid].answerdate) / 1000).toFixed(0);
					}
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
					log.debug('DEBUG: call [%s][%s] Hanguping the called channel on the bridge: %s',count[x.linkedid].count, x.uniqueid, JSON.stringify(bill[x.linkedid]));
					if(count[x.linkedid].count === 0){
						log.debug('DEBUG: Saving billing on slave call');
						savebill(bill[x.linkedid]);
					}
				}else{
					log.debug("DEBUG: Hanguping an unmonitoring channel: %s", JSON.stringify(x));
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
		log.info("Closing billing:"+JSON.stringify(bill));
		log.debug("<=======================================================>");
		return;
	}
}
