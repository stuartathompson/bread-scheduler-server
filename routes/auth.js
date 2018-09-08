const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const passport = require('passport');

/* POST login */
app.post('/signin',function (req, res, next){
  console.log('reached post')
  passport.authenticate('local',{session: false}, (err, user, info) => {
    if( err || !user ){
      return res.status(400).json({
        message: 'Your email or password was wrong.',
        user: user
      });
    }

    req.login(user, {session: false}, (err) => {
      if (err) {
        res.send(err);
      }

      // generate signed json web token
      const token = jwt.sign(user, 'your_jwt_secret');
      return res.json({user, token});
    });
  })(req, res);
});

module.exports = app;
