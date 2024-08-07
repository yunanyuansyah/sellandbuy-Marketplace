require("dotenv").config();
const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const mongoSanitize = require("express-mongo-sanitize");
const session = require("express-session");
const flash = require("express-flash");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { User, PasswordResetToken } = require("../../database/auth");
const { authenticateSession } = require("../middleware/middleware");
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
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 },
  })
);

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = new User({
            googleId: profile.id,
            username: profile.displayName,
            email: profile.emails[0].value,
          });
          await user.save();
        }
        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Function to create or update the admin account
async function createOrUpdateAdminAccount() {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      console.error(
        "Admin email or password is not set in environment variables."
      );
      return;
    }

    let admin = await User.findOne({ email });

    const hashedPassword = await bcrypt.hash(password, 10);

    if (!admin) {
      admin = new User({
        username: "Admin",
        email,
        password: hashedPassword,
        isAdmin: true,
        phone: "0000000000",
        address: "Admin Address",
        birthdate: new Date(),
        membership: "gold",
      });

      await admin.save();
      console.log("Admin account created successfully.");
    } else {
      const isPasswordMatch = await bcrypt.compare(password, admin.password);

      if (!isPasswordMatch) {
        admin.password = hashedPassword;
        await admin.save();
        console.log("Admin password updated successfully.");
      } else {
        console.log("Admin account already exists and password is up to date.");
      }
    }
  } catch (error) {
    console.error("Error creating or updating admin account:", error);
  }
}

// Call the function to ensure the admin account is created or updated
createOrUpdateAdminAccount();

// Routes
app.get("/login", (req, res) => {
  if (req.session.userId) {
    return res.redirect("/profile");
  }

  const error = req.flash("error");
  res.render("login/login", { error });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    req.flash("error", "User not found!");
    return res.redirect("/login");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    req.flash("error", "Invalid password!");
    return res.redirect("/login");
  }

  req.session.userId = user._id;

  if (user.isAdmin === true) {
    return res.redirect("/admin-dashboard");
  }
  res.redirect("/profile");
});

app.get("/register", (req, res) => {
  if (req.session.userId) {
    return res.redirect("/profile");
  }
  const error = req.flash("error");
  res.render("login/register", { error });
});

app.post("/register", async (req, res) => {
  const {
    username,
    email,
    password,
    confirm_password,
    phone,
    address,
    birthdate,
  } = req.body;

  if (password !== confirm_password) {
    req.flash("error", "Passwords do not match");
    return res.redirect("/register");
  }

  const findEmail = await User.findOne({ email });

  if (findEmail) {
    req.flash("error", "Email already exists");
    return res.redirect("/register");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({
    username,
    email,
    password: hashedPassword,
    phone,
    address,
    birthdate,
    membership: "none",
  });
  await user.save();
  res.redirect("/login");
});

app.get("/forgot-password", (req, res) => {
  const success = req.flash("success");
  const error = req.flash("error");
  res.render("login/forgot-password", { success, error });
});

app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    req.flash("error", "User not found");
    return res.redirect("/forgot-password");
  }
  const token = Math.random().toString(36).substr(2);
  const resetToken = new PasswordResetToken({ userId: user._id, token });
  await resetToken.save();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset",
    text: `To reset your password, please click the link: ${req.headers.origin}/reset/${token}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      req.flash("error", "Error sending email. Please try again.");
      return res.redirect("/forgot-password");
    }
    req.flash("success", "Password reset email sent");
    res.redirect("/forgot-password");
  });
});

app.get("/reset/:token", async (req, res) => {
  const { token } = req.params;
  const resetToken = await PasswordResetToken.findOne({ token });
  if (!resetToken) {
    res.status(400).send("Invalid token");
    return;
  }
  res.render("login/reset", { token });
});

app.post("/reset/:token", async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;
  if (password !== confirmPassword) {
    res.status(400).send("Passwords do not match");
    return;
  }
  const resetToken = await PasswordResetToken.findOne({ token });
  if (!resetToken) {
    res.status(400).send("Invalid token");
    return;
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.findById(resetToken.userId);
  user.password = hashedPassword;
  await user.save();
  await resetToken.delete();
  res.redirect("/login");
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect("/profile");
    }
    res.clearCookie("connect.sid");
    res.redirect("/login");
  });
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    req.session.userId = req.user._id;
    res.redirect("/profile");
  }
);

module.exports = app;
