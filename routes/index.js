const express = require("express");
const router = express.Router();

router.get("/", function (req, res, next) {
  res.render("index");
  //res.send("toto");
});

module.exports = router;
