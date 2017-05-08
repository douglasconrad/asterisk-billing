# asterisk-billing

### Description ###
A billing to PBX Systems based on Asterisk.

The Billing Daemon will be compatible with any Asterisk System over 10+ version and work independent from the Manager Interface, having an API to communicate with it.

The Billing API allow you developer your own frontend for any PBX Frontend Systems, reading the data directly from the database, getting CDR from the API or developing one webservice to receive the webhook from the daemon after every call with a JSON bill.

The Billing Daemon has the capacity to send to an external Webhook all bills, creating the capability to intergrate with any Application.


### Preparing the Environment ###

#### Requirements ####

- node
- mongo
- mysql (optional)

#### Installing ####
To run it you will need install node and some dependecies.

If you use Debian based systems, just do this:
```
apt-get insall node
```

After that, download this code to your work directory, like this:
```
git clone git@github.com:douglasconrad/asterisk-billing.git
```

Now enter into directory and adjust the Asterisk Manager Interface credentials:
```
cd asterisk-billing
```

Edit config/default.json and set your asterisk and database credentials:
**PS.: You can use as database: mongo, mysql**
```
"asterisk": {
  "amihost": "127.0.0.1",
  "amiport": 5038,
  "amiuser": "snep",
  "amipassword": "sneppass"
},
"database":"mongo",
"mysql": {
  "host": "localhost",
  "user": "snep",
  "password": "sneppass",
  "database": "abilling"
},
"mongo": {
  "host":"localhost",
  "port":"27017",
  "db": "abilling",
  "collections": {
    "cdr": "cdr",
    "callflow": "callflow"
  }
}
```


Create you Database and Schema:
```
mysql -uusername -ppassword < install/schema.sql
```

It's DONE.

### Running ###

Into work diretory, run:
```
npm start
```

The logs will be saved into "$HOME/.forever/billing.log"

### Stoping process ###

Into work directory, run:
```
npm stop
```

### Listing Running process ###

Into work directory, run:
```
npm run-script status
```

### Billing format ###

The billing format that will be send to webhook have this structure:
```
{'id':'1','main call informations keys':'main call information values',callflow:[
        {'id':'2','calls on the bridge informations keys':'calls on the bridge informations value'},
        {'id':'N','calls on the bridge informations keys':'calls on the bridge informations value'},
]}
```

You can see the complete structure in the samples/bill.json

### Asterisk-billing in Action ###

root@snep-3-demo:/var/www/html/asterisk-billing# node index.js

```
Starting the observer for now calls

New call monitored: {"callid":"1453484354.47","calldate":"2016-01-22T17:39:14.629Z","from":"1008","fromname":"Ramal 1008","to":"4891613166","route":"local","dstchannel":"","channel":"SIP/1008-0000002d","status":"0","linkedid":"1453484354.47","toname":"<unknown>"}

New channel in a already monitored call: {"callid":"1453484354.47","calldate":"2016-01-22T17:39:14.629Z","from":"1008","fromname":"Ramal 1008","to":"4891613166","route":"SIP/192.168.10.252","dstchannel":"SIP/192.168.10.252-0000002e","channel":"SIP/1008-0000002d","status":"0","linkedid":"1453484354.48","toname":"<unknown>"}

Call was ANSWERED: {"event":"Newstate","privilege":"call,all","channel":"SIP/1008-0000002d","channelstate":"6","channelstatedesc":"Up","calleridnum":"1008","calleridname":"Ramal 1008","connectedlinenum":"<unknown>","connectedlinename":"<unknown>","language":"pt_BR","accountcode":"2","context":"default","exten":"4891613166","priority":"9","uniqueid":"1453484354.47","linkedid":"1453484354.47"}

Getting all Webhooks configured...

Closing billing:{"callid":"1453484354.47","calldate":"2016-01-22T17:39:14.629Z","from":"1008","fromname":"Ramal 1008","to":"4891613166","route":"SIP/192.168.10.252","dstchannel":"SIP/192.168.10.252-0000002e","channel":"SIP/1008-0000002d","status":"6","linkedid":"1453484354.48","toname":"<unknown>","answerdate":"2016-01-22T17:39:28.602Z","hangupdate":"2016-01-22T17:39:36.530Z","duration":"22","billsec":"8"}
<=======================================================>
Sending to webhook Opens Cloud through URL http://demo.opens.com.br/post2/ METHOD POST
{"statusCode":200,"body":{"status":"Ok"},"headers":{"date":"Fri, 22 Jan 2016 17:39:36 GMT","server":"Apache/2.2.22 (Debian)","x-powered-by":"PHP/5.4.45-0+deb7u1","vary":"Accept-Encoding","content-length":"15","connection":"close","content-type":"text/html"},"request":{"uri":{"protocol":"http:","slashes":true,"auth":null,"host":"demo.opens.com.br","port":80,"hostname":"demo.opens.com.br","hash":null,"search":null,"query":null,"pathname":"/post2/","path":"/post2/","href":"http://demo.opens.com.br/post2/"},"method":"POST","headers":{"accept":"application/json","content-type":"application/json","content-length":393}}}
```
