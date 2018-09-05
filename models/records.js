var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var RecordChildren = require("../models/record_children");

var RecordsSchema = new Schema({
  record_id: String,
  date: Date,
  children: [ RecordChildren.schema ],
  description: String,
  notes: String,
  associations: Array,
  attachments: {
    type: Schema.Types.ObjectId,
    ref: 'attachments'
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'users'
  }
});

var Records = mongoose.model("Records", RecordsSchema);
module.exports = Records;
