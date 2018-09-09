var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');
var uniqueValidator = require('mongoose-unique-validator');

var UsersSchema = new Schema({
  passwordHash: {
    type: String,
    required: true
  },
  username: {
    type: String,
    unique: true,
    required: true
  },
  role: {
    type: String
  }
});


UsersSchema.plugin(uniqueValidator);

UsersSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.passwordHash);
};

UsersSchema.virtual("password").set(function(value) {
  this.passwordHash = bcrypt.hashSync(value, 12);
});

var Users = mongoose.model("Users", UsersSchema);
module.exports = Users;
