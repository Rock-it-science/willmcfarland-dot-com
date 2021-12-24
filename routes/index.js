var express = require('express');
const { append } = require('express/lib/response');
var path = require('path');
var router = express.Router();
router.use(express.static("public/home"));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.sendFile(path.resolve('public/home/index.html'));
});

module.exports = router;
