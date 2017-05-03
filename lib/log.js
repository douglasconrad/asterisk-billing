var bunyan = require('bunyan');

module.exports = bunyan.createLogger({
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
