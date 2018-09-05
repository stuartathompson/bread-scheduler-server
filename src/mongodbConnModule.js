var mongoose = require('mongoose');

module.exports.connect = function() {
	//mongoose.connect('mongodb://localhost:27017/scheduler');
	mongoose.connect('mongodb://SuperAdmin:Kihshlb1@ds145072.mlab.com:45072/cityscheduler_test');
	var db = mongoose.connection;
	db.on("error", console.error.bind(console, "connection error"));
	db.once("open", function(callback){
	  console.log("Connection Succeeded");
	});
	return db;
}
