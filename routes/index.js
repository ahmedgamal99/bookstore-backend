var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  return res.status(201).send("Bookburst Backend");
});

module.exports = router;
