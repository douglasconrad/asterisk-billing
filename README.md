# asterisk-billing

### Goals ###
Development a billing to PBX Systems based on Asterisk. It will have at least two elements in Software Structure: a billing daemon and a Manager Iterface.

The Billing Daemon will be compatible with any Asterisk System over 1X version and work independent from the Manager Interface, having an API to communicate with it.

The Manager Interface will be compatible with SNEP 3.X version and works like a SNEP module.

The Billing Daemon will have the capacity to send to an external Webhook all bills, creating the capability to intergrate with any Application.


### Preparing the Environment ###


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

Edit index.js and set credentials:
```
// set the credentials to access Asterism Manager Interface
var ami = new require('asterisk-manager')('5038','localhost', 'snep', 'sneppass', true);
```

Set your database. By default asterisk-billing create one database called "billing", if you need change it, edit "lib/index.js" and adjust it.

You will need adjust MySQL access too in the same file.

```
export.smysql = function(mysql){
        var connection = mysql.createConnection({
                host     : 'localhost',
                user     : 'snep',
                password : 'sneppass',
                database : 'billing'
        })
        return connection;
}
```

Create you Database and Schema:
```
mysql -uusername -ppassword billing < install/schema.sql
```

It's DONE.

### Running ###

Into work diretory, run:
```
node index.js
```

If you want run it in background mode, you can use nohup:
```
nohup node index.js &
```

### Asterisk-billing in Action ###

root@snep-3-demo:/var/www/html/asterisk-billing# node index.js 

```
Starting the observer for now calls

New call detected: {from:"1008" , name:"Ramal 1008", to:"191"}

Call Answered at: {"newstatedate":"2016-01-15T14:18:48.157Z","answerdate":"2016-01-15T14:18:48.157Z","from":"1008"}
Newstate in a monitored channel: {"newstatedate":"2016-01-15T14:18:48.157Z","answerdate":"2016-01-15T14:18:48.157Z","from":"1008"}

Call Ended: {"uniqueid":"1452867523.89","from":"1008","fromname":"Ramal 1008","to":"<unknown>","toname":"<unknown>","hangupdate":"2016-01-15T14:18:54.989Z","status":"6"}

Joined: [{"event":"Newchannel","privilege":"call,all","channel":"SIP/1008-00000059","channelstate":"0","channelstatedesc":"Down","calleridnum":"1008","calleridname":"Ramal 1008","connectedlinenum":"<unknown>","connectedlinename":"<unknown>","language":"en","accountcode":"","context":"default","exten":"191","priority":"1","uniqueid":"1452867523.89","linkedid":"1452867523.89","to":"191","date":"2016-01-15T14:18:43.687Z"},{"uniqueid":"1452867523.89","from":"1008","fromname":"Ramal 1008","to":"<unknown>","toname":"<unknown>","hangupdate":"2016-01-15T14:18:54.989Z","status":"6"},{"newstatedate":"2016-01-15T14:18:48.157Z","answerdate":"2016-01-15T14:18:48.157Z","from":"1008"}]

Hangup in subscribe:{"from":"1008","fromname":"Ramal 1008","to":"191","toname":"<unknown>","hangupdate":"2016-01-15T14:18:54.989Z","date":"2016-01-15T14:18:43.687Z","answerdate":"2016-01-15T14:18:48.157Z","uniqueid":"1452867523.89","linkedid":"1452867523.89","status":"6","billsec":6.832,"duration":11.302}

Sending to Webhook: http://demo.opens.com.br/post2/

{"statusCode":200,"body":{"status":"Ok"},"headers":{"date":"Fri, 15 Jan 2016 14:18:55 GMT","server":"Apache/2.2.22 (Debian)","x-powered-by":"PHP/5.4.45-0+deb7u1","vary":"Accept-Encoding","content-length":"15","connection":"close","content-type":"text/html"},"request":{"uri":{"protocol":"http:","slashes":true,"auth":null,"host":"demo.opens.com.br","port":80,"hostname":"demo.opens.com.br","hash":null,"search":null,"query":null,"pathname":"/post2/","path":"/post2/","href":"http://demo.opens.com.br/post2/"},"method":"GET","headers":{"accept":"application/json","content-type":"application/json","content-length":181}}}
```
