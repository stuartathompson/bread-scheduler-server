var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var RecordChildrenSchema = new Schema({
  record_id: String,
  title: String,
  date: Date,
  child_order: Number,
  description: String,
  notes: String,
  attachments: {
    type: Schema.Types.ObjectId,
    ref: 'attachments'
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'users'
  },
  attachments: [{
    secure_url: String,
    filename: String,
    resource_type: String,
    format: String
  }]
});

var RecordChildren = mongoose.model("RecordChildren", RecordChildrenSchema);
module.exports = RecordChildren;
