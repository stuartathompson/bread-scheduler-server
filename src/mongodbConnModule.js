var mongoose = require('mongoose');

module.exports.connect = function() {
	if(process.env.NODE_ENV === 'production'){
		mongoose.connect('mongodb://SuperAdmin:KetzaWicket1@ds113853.mlab.com:13853/breadsked');
	} else {
		mongoose.connect('mongodb://localhost:27017/bread-scheduler');
	}
	var db = mongoose.connection;
	db.on("error", console.error.bind(console, "connection error"));
	db.once("open", function(callback){
	  console.log("Connection Succeeded");
	});
	return db;
}
