require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const mongoSanitize = require("express-mongo-sanitize");
const { User } = require("../../database/auth");
const app = express();

const publicDirectoryPath = path.join(__dirname, "../../../public");
const viewsPath = path.join(__dirname, "../../templates");

app.set("view engine", "ejs");
app.set("views", viewsPath);
app.use(express.static(publicDirectoryPath));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(mongoSanitize());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "defaultSecret",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
  })
);

// Middleware to check login status
async function checkLoginStatus(req, res, next) {
  try {
    if (req.session.userId) {
      const user = await User.findById(req.session.userId);
      res.locals.isLoggedIn = !!user;
      res.locals.user = user;
    } else {
      res.locals.isLoggedIn = false;
    }
  } catch (error) {
    console.error("Error checking login status:", error);
    res.locals.isLoggedIn = false;
  }
  next();
}

app.use(checkLoginStatus);

// Routes
app.get("/", (req, res) => {
  res.render("landing-page/index");
});

app.get("/faq", (req, res) => {
  res.render("landing-page/faq");
});

app.get("/privacy", (req, res) => {
  res.render("landing-page/privacy");
});

app.get("/tos", (req, res) => {
  res.render("landing-page/tos");
});

module.exports = app;
