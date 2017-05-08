// load the things we need
var mongoose = require('mongoose');

// define the schema for our cdr model
var cdrSchema = mongoose.Schema({

    uuid: {
        type: String,
        required:false
    },
    callid: {
      type: String,
      required: true
    },
    calldate: {
      type: Date,
      required: true
    },
    srcname: {
      type: String,
      required: true
    },
    src: {
      type: String,
      required: true
    },
    dst: {
      type: String,
      required: true
    },
    dstname: {
      type: String,
      required: true
    },
    route: {
      type: String,
      required: true,
      default: "local"
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


// create the model for cdr and expose it to our app
module.exports = mongoose.model('Cdr', cdrSchema);
