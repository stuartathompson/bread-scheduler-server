var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var RecordChildren = require("../models/record_children");

var RecordsSchema = new Schema({
  record_id: {
    type: String,
    required: true
  },
  date: Date,
  children: [ RecordChildren.schema ],
  description: String,
  notes: String,
  attachments: {
    type: Schema.Types.ObjectId,
    ref: 'attachments'
  },
  last_edited: Date,
  owner: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'Users'
    },
    username: {
      type: String,
      required: true
    }
  }
});

var Records = mongoose.model("Records", RecordsSchema);
module.exports = Records;
