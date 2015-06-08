var express = require('express');
var api = require('../lib/github');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  api.getRenderedPullRequests().then(function(data) {
    res.render('index', { title: 'Express', data: data });
  }, function(e) {
    res.render('error', {
      message: "Woah! Could not get pull requests because",
      error: e
    });
  });
});

module.exports = router;
