// load the things we need
var mongoose = require('mongoose');

// define the schema for our callflow model
var CallflowSchema = mongoose.Schema({

  uuid: String,
  uniqueid: {
    type: String,
    required: true
  },
  callid: {
    type: String,
    required: true
  },
  calldate: {
    type: Date,
    required: true
  },
  src: {
    type: String,
    required: true,
    default: ""
  },
  dst: {
    type: String,
    required: true,
    default: ""
  },
  status: {
    type: Number,
    required: true,
    default: "0"
  },
  statusdesc: {
    type: String,
    required: true,
    default: "NO ANSWER"
  },
  duration: {
    type: Number,
    required: true,
    default: "0"
  },
  billsec: {
    type: Number,
    required: true,
    default: "0"
  }

});


// create the model for callflow and expose it to our app
module.exports = mongoose.model('CallFlow', CallflowSchema);
