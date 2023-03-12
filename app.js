// console.log("first")
const express = require("express");
const app = express();
const bodyParser = require('body-parser');

const dbConnect = require("./database/dbConnect");

// body parser configuration
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

dbConnect();

app.get("/", (request, response, next) => {
  response.json({ message: "Hey! Thiasdsds is your server response!" });
  next();
});



module.exports = app;

