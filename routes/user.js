
const express = require('express');
const app = express();

/* GET user profile. */
app.get('/', function(req, res, next) {
    res.send(req.user);
});

module.exports = app;
