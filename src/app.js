const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const morgan = require('morgan')

const app = express()
app.use(morgan('combined'))
app.use(bodyParser.json())
app.use(cors())

app.use(express.static('stylesheets'))

const mongodb_conn_module = require('./mongodbConnModule');
var db = mongodb_conn_module.connect();

var RecordChildren = require("../models/record_children");
var Records = require("../models/records");
var Users = require("../models/users");

// var Attachments = require("../models/attachments");
app.get('/records', (req, res) => {
  Records.find({}, 'record_id description date notes', function (error, records) {
	  if (error) { console.error('ERROR',error); }
	  res.send({
			records: records
		})
	}).sort({date:-1}).limit(10)
});

app.post('/search', (req, res) => {
  query = req.body.record_id == '' ? {} : {record_id: new RegExp(req.body.record_id,'gi')}
  Records.find(query, 'record_id description date notes', function (error, records) {
	  if (error) { console.error('ERROR',error); }
	  res.send({
			records: records
		})
	}).sort({date:-1})
});

app.get('/records/:id', (req, res) => {
	var db = req.db;
	Records.findById(req.params.id, 'record_id description children date notes', function (error, record) {
	  if (error) { console.error(error); }
	  res.send(record)
	})
})

app.post('/add_record', (req, res) => {
	var db = req.db;
	var record_id = req.body.record_id;
	var description = req.body.description;
  var notes = req.body.notes;
  var date = req.body.date;
	var new_record = new Records({
		record_id: record_id,
		description: description,
    notes: notes,
    date: date
	});

	new_record.save(function (error) {
		if (error) {
			console.log(error)
		}
    res.send({
			success: true
		})
	})
})


// app.post('/add_post', (req, res) => {
// 	var db = req.db;
// 	var title = req.body.title;
// 	var description = req.body.description;
// 	var new_post = new Post({
// 		title: title,
// 		description: description
// 	})
//
// 	new_post.save(function (error) {
// 		if (error) {
// 			console.log(error)
// 		}
// 		res.send({
// 			success: true
// 		})
// 	})
// })

// Update record
app.put('/records/:id', (req, res) => {
	var db = req.db;

  // Update this record
	Records.findById(req.params.id, 'record_id description', function (error, record) {
	  if (error) { console.error(error); }
	  record.record_id = req.body.record_id
	  record.description = req.body.description
    record.notes = req.body.notes
    record.children = req.body.children
	  record.save(function (error) {
			if (error) {
				console.log(error)
			}
			res.send({
				success: true
			})
		})
	})
})

app.delete('/records/:id', (req, res) => {
	var db = req.db;
  console.log(req.params.id)
	Records.remove({
		_id: req.params.id
	}, function(err, post){
		if (err) res.send(err)
    console.log('ok')
		res.send({
			success: true
		})
	})
})

app.get('/post/:id', (req, res) => {
	var db = req.db;
	Post.findById(req.params.id, 'title description', function (error, post) {
	  if (error) { console.error(error); }
	  res.send(post)
	})
})

app.listen(process.env.PORT || 8081)
