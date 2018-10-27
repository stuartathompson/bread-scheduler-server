console.log(process.env.BREADCOOKIE)

const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const path = require('path')
const morgan = require('morgan')
const history = require('connect-history-api-fallback')
const serveStatic = require('serve-static')
const staticFileMiddleware = express.static('http://city-scheduler-demo.herokuapp.com/');
const ObjectId = require('mongoose').Types.ObjectId

// Multer/Cloudinary file upload
const cloudinary = require('cloudinary')
const cloudinaryStorage = require('multer-storage-cloudinary')
const multer = require('multer')
// const fileUpload = require('express-fileupload')

// Passport/authentication
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const session = require('express-session')
const cookieParser = require('cookie-parser')

const app = express();

// app.use(fileUpload());

app.use(staticFileMiddleware);
app.use(history({
  verbose: true,
  disableDotRule: true
}));
app.use(staticFileMiddleware);

app.use(morgan('combined'))
app.use(bodyParser.json())
app.use(cors())
const uniqueCookieKey = process.env.BREADCOOKIE
app.use(cookieParser(uniqueCookieKey));
app.use(session({ cookie: { maxAge: 60000 }}));
app.use(passport.initialize())
app.use(passport.session())

app.use(express.static('stylesheets'))

const mongodb_conn_module = require('./mongodbConnModule');
var db = mongodb_conn_module.connect();

var Recipe = require("../models/recipe");
var Users = require("../models/users");

/* - Begin app - */
passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(userId, done) {
  User.findById(userId, (err, user) => done(err, user));
});

const local = new LocalStrategy( (username, password, next) => {
    Users.findOne({ username })
        .then(user => {
            if (!user || !user.validPassword(password)) {
              next(true, false, {message: 'Incorrect email or password.'});
            } else {
              next(null, user, {message: 'Logged In Successfully'});
            }
       })
       .catch(err => next(err));
});

passport.use("local",local);

const loggedInOnly = (req, res, next) => {
  var token = req.header('Authorization').split(' ')[1];
  var payload = jwt.decode(token, process.env.JWTSECRET);
  if (payload) {
    // res.send({success: true});
    // console.log('going next true', next)
    next(null, req, res)
  } else {
    res.send({success: false, redirect: '/login'});
    // console.log('going next false', next)
    // next(null, {success: false})
  }
};

const loggedOutOnly = (req, res, next) => {
  if (req.isUnauthenticated()) next();
  else res.send({success: false, redirect: "/"});
};


/* STORAGE */
cloudinary.config({
  cloud_name: 'stuartathompson',
  api_key: process.env.CLOUDINARYAPIKEY,
  api_secret: process.env.CLOUDINARYSECRET
})

const storage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: 'bread_scheduler',
  allowedFormats: ['jpg', 'png', 'pdf', 'jpeg', 'gif'],
  filename: function (req, file, cb) {
    console.log('filename')
    cb(undefined, file.originalname)
  }
})

const parser = multer({ storage: storage })

/* POST login */
app.post('/login', function(req, res, next){
  passport.authenticate('local', function(err, user, info){
    if(err || !user){
      res.send({success: false})
    } else {
      var token = jwt.sign({ id: user._id }, process.env.JWTSECRET, {
        expiresIn: 86400 // expires in 24 hours
      });
      res.send({success: true, redirect: '/', token: token, username: user.username})
    }
  })(req, res, next);
});

app.post("/register", loggedInOnly, (req, res, next) => {
  const { username, password } = req.body;
  console.log(username, password)
  Users.create({ username, password })
    .then(user => {
      // create a token
      var token = jwt.sign({ id: user._id }, process.env.JWTSECRET, {
        expiresIn: 86400 // expires in 24 hours
      });
      res.status(200).send({ success: true, redirect: '/', token: token });
    })
    .catch(err => {
      if (err.name === "ValidationError") {
        req.flash("Sorry, that email is already registered.");
        res.redirect("/register");
      } else next(err);
    });
});

app.all("/logout", function(req, res) {
  req.logout();
  res.send({success: true, redirect: '/login'})
});

app.all("/login", function(req, res) {
});

app.post("/auth", loggedInOnly, function(req, res) {
  res.send({success: true})
});

const user = require('../routes/user');

// Get records
app.post('/recipes', (req, res) => {
  var page = parseInt(req.body.page) || 0;
  var limit = parseInt(req.body.limit) || 15;
  var username = req.body.username;
  var fields = req.body.fields
  var startDate = req.body.startDate;
  var endDate = req.body.endDate;

  var query = {} //'owner.username': username}
  //
  // // Reset skip and limit if dates are set
  // if(startDate){
  //   limit = 9999
  //   skip = 0
  //   query['date'] = { $gt: startDate, $lt: endDate }
  // }

  // Users.findById(uid)
  //   .populate()
  Recipe.find(query, 'title description images shortDescription totalRecipeLength', {sort: {'last_edited':-1}, limit: limit, skip : page * limit}, function (err, recipes) {
    console.log('response', recipes)
      res.send({
        success: true,
        recipes: recipes
      })
    })
});

app.post('/search', (req, res) => {
  query = req.body.record_id == '' ? {} : {record_id: new RegExp(req.body.record_id,'gi')}
  Recipe.find(query, 'record_id description date notes', function (error, records) {
	  if (error) { console.error('ERROR',error); }
	  res.send({
      success: true,
			records: records
		})
	}).sort({date:-1})
});

app.get('/recipe/:id', (req, res) => {
	var db = req.db;
	Recipe.findById(req.params.id, function (error, recipe) {
	  if (error) { console.error(error); }
    console.log('ok', recipe)
	  res.send({
      success: true,
      recipe: recipe
    })
	})
})

app.post('/add_image', parser.array('file', 10), (req, res) => {
  console.log('uplaods')
  var response = {
    success: true,
    files: req.files
  }
  res.send(response)
})

app.post('/add_record', (req, res) => {
  req.body.last_edited = new Date()
  var db = req.db;
	var new_record = new Recipe(req.body);

	new_record.save(function (error) {
		if (error) {
			console.log(error)
		}
    res.send({
			success: true
		})
	})
})

// Update record
app.put('/recipe/:id', (req, res) => {
	var db = req.db;
  console.log(req.params.id, req.body.title)

  // Update this record
	Recipe.findById(req.params.id, function (error, recipe) {
	  if (error) { console.error(error); }
    // Reassign
    for(var param in req.body){
      if (param.match(/^\_/) === null) {
        recipe[param] = req.body[param]
      }
    }
    console.log(recipe)
    // recipe = req.body
    // // Change last edited
    recipe.last_edited = new Date()
    // Save
	  recipe.save(function (error) {
			if (error) {
				console.log(error)
			}
			res.send({
				success: true,
        recipe: recipe
			})
		})
	})
})

app.delete('/records/:id', (req, res) => {
	var db = req.db;
	Recipe.remove({
		_id: req.params.id
	}, function(err, post){
		if (err) res.send(err)
		res.send({
			success: true
		})
	})
})

app.get('*', function(req, res){
  res.status(404);
});

app.listen(process.env.PORT || 8081)
