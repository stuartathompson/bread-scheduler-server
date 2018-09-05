var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var UsersSchema = new Schema({
  name: String,
  email: String,
  id: Schema.Types.ObjectId
});

var Users = mongoose.model("Users", UsersSchema);
module.exports = Users;
