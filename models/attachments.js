var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var AttachmentsSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  record: {
    type: Schema.Types.ObjectId,
    ref: 'records',
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  }
});

var Attachments = mongoose.model("Attachments", AttachmentsSchema);
module.exports = Attachments;
