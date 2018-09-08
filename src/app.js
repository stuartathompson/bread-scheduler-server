const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const path = require('path')
const morgan = require('morgan')
const history = require('connect-history-api-fallback')

// Passport/authentication
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const session = require('express-session')
const cookieParser = require('cookie-parser')

const app = express();
const staticFileMiddleware = express.static(path.join(__dirname + '/dist'));

app.use(staticFileMiddleware);
app.use(history());
app.use(staticFileMiddleware);

app.use(morgan('combined'))
app.use(bodyParser.json())
app.use(cors())
app.use(cookieParser('$2b$10$7ztOGXwtoFJHIRbGz3GTTedQaadosUxCY0xkRPOh10HHO620VqCB.'));
app.use(session({ cookie: { maxAge: 60000 }}));
app.use(passport.initialize())
app.use(passport.session())

app.use(express.static('stylesheets'))

const mongodb_conn_module = require('./mongodbConnModule');
var db = mongodb_conn_module.connect();

var RecordChildren = require("../models/record_children");
var Records = require("../models/records");
var Users = require("../models/users");


/* - Begin app - */

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(userId, done) {
  User.findById(userId, (err, user) => done(err, user));
});

const local = new LocalStrategy( (username, password, next) => {
  console.log('ok, looking?')
    Users.findOne({ username })
        .then(user => {
          console.log('found undersname');
            if (!user || !user.validPassword(password)) {
                console.log('fail')
                next(true, false, {message: 'Incorrect email or password.'});
            } else {
              console.log('success, valid')

              next(null, user, {message: 'Logged In Successfully'});
            }
       })
       .catch(err => next(err));
});

passport.use("local",local);

const loggedInOnly = (req, res, next) => {
  var token = req.header('Authorization').split(' ')[1];
  var payload = jwt.decode(token, 'supersecret');
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


/* POST login */
app.post('/login', function(req, res, next){
  passport.authenticate('local', function(err, user, info){
    if(err || !user){
      res.send({success: false})
    } else {
      var token = jwt.sign({ id: user._id }, 'supersecret', {
        expiresIn: 86400 // expires in 24 hours
      });
      res.send({success: true, redirect: '/', token: token})
    }
})(req, res, next);
  console.log('outtie');
});

// function (req, res, next){
//   console.log('reached sign in post')
//   console.log(req.body)
//   passport.authenticate('local',{session: false}, (err, user, info) => {
//     console.log('fail??',err, user, info)
//     if( err || !user ){
//       return res.status(400).json({
//         message: 'Your email or password was wrong.',
//         user: user
//       });
//     }
//
//     req.login(user, {session: false}, (err) => {
//       if (err) {
//         res.send(err);
//       }
//
//       // generate signed json web token
//       const token = jwt.sign(user, 'your_jwt_secret');
//       return res.json({user, token});
//     });
//   })(req, res);
// });

app.post("/register", (req, res, next) => {
  const { username, password } = req.body;
  Users.create({ username, password })
    .then(user => {
      // create a token
      var token = jwt.sign({ id: user._id }, 'supersecret', {
        expiresIn: 86400 // expires in 24 hours
      });
      res.status(200).send({ success: true, redirect: '/', token: token });

      // req.login(user, err => {
      //   if (err) next(err);
      //   else res.redirect("/");
      // });
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
  console.log('Logging in....')
});

app.post("/auth", loggedInOnly, function(req, res) {
  console.log('Made it to auth ....')
  res.send({success: true})
});


// app.post('/register', function(req, res, next) {
//   bcrypt.genSalt(10, function(err, salt){
//     if (err) return next(err);
//     bcrypt.hash(req.body.password, salt, function(err, hash) {
//
//       var newUser = new Users({
//         username: req.body.username,
//         password: hash
//       });
//
//       newUser.save(function (error) {
//         if (error) {
//           console.log(error)
//         }
//         res.send({
//           success: true
//         });
//       });
//     });
//   });
// });

// const auth = require('../routes/auth');
const user = require('../routes/user');

// app.use('/auth', auth);
// app.use('/', passport.authenticate('jwt', {session: false}), user);


app.get('/records', loggedInOnly, (req, res) => {
  Records.find({}, 'record_id description date notes', function (error, records) {
	  if (error) { console.error('ERROR',error); }
	  res.send({
      success: true,
			records: records
		})
	}).sort({date:-1}).limit(10)
});

app.post('/search', (req, res) => {
  query = req.body.record_id == '' ? {} : {record_id: new RegExp(req.body.record_id,'gi')}
  Records.find(query, 'record_id description date notes', function (error, records) {
	  if (error) { console.error('ERROR',error); }
	  res.send({
      success: true,
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


app.get('*', function(req, res){
  res.status(404);
});

app.listen(process.env.PORT || 8081)
