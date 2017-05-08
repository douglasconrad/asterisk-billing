var bunyan = require('bunyan');
var config = require('config');

module.exports = bunyan.createLogger({
	name: "asterisk-billing",
	streams:
    [
    {
      stream: process.stdout,
      level: (process.env.LOG_LEVEL) ? process.env.LOG_LEVEL : config.log_level
    },
    {
      path: 'billing.log',
      level: (process.env.LOG_LEVEL) ? process.env.LOG_LEVEL : config.log_level
    }
    ]
});
