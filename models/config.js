// load the things we need
var mongoose = require('mongoose');

// define the schema for our uuid model
var ConfigSchema = mongoose.Schema({

  uuid: {
    type: String,
    required: true
  },
  webhooks: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    status: {
      type: String,
      required: true,
      default: "active"
    },
    method: {
      type: String,
      required: true,
      default: "POST"
    }    
  }]
});


// create the model for callflow and expose it to our app
module.exports = mongoose.model('Config', ConfigSchema);
