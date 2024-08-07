require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const layouts = require("express-ejs-layouts");
const mongoSanitize = require("express-mongo-sanitize");
const flash = require("express-flash");

const app = express();
const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../../public");
const viewsPath = path.join(__dirname, "../templates");

// Controllers and Routes
const landing = require("../controllers/landing-page/landing");
const auth = require("../controllers/authentication/auth");
const profile = require("../controllers/profile/profile");
const formJual = require("../controllers/form-jual/jual");
const membership = require("../controllers/membership/member");
const katalog = require("../controllers/market/katalog");
const admin = require("../controllers/admin-dashboard/admin");

app.set("view engine", "ejs");
app.set("views", viewsPath);
app.use(express.static(publicDirectoryPath));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(mongoSanitize());

const oneWeek = 1000 * 60 * 60 * 24 * 7;

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: oneWeek },
  })
);
app.use(flash());

// Routes
app.use(landing);
app.use(auth);
app.use(profile);
app.use(formJual);
app.use(membership);
app.use(katalog);
app.use(admin);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
