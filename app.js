const express = require("express");
const session = require("express-session");
const passport = require("passport");
const mongoose = require("mongoose");
var cors = require("cors");

require("dotenv").config();

const app = express();

app.use(express.json());
app.use(cors());

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var cartRouter = require("./routes/carts");
var booklistRouter = require("./routes/booklists");
var transactionRouter = require("./routes/transactions");
var adminRouter = require("./routes/admins");

app.use(
  session({
    secret: "cats",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/", indexRouter);
app.use("/auth", usersRouter);
app.use("/cart", cartRouter);
app.use("/booklist", booklistRouter);
app.use("/transaction", transactionRouter);
app.use("/admin", adminRouter);

let db_conn_url = null;

if (process.env.ENV === "DEV") db_conn_url = "mongodb://localhost/bookstore";
if (process.env.ENV === "PROD") db_conn_url = process.env.PROD_MONGO;

mongoose
  .connect(db_conn_url)
  .then(() => console.log("Connected to MongoDB..."))
  .catch((err) => console.error("Could not connect to MongoDB..."));

var server = app.listen(process.env.PORT || 5001, function () {
  console.log("Listening on port " + server.address().port);
});

module.exports = app;
