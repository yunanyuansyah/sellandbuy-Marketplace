require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoSanitize = require("express-mongo-sanitize");
const session = require("express-session");
const flash = require("express-flash");
const multer = require("multer");
const fs = require("fs");
const { User } = require("../../database/auth");
const { Product } = require("../../database/product");
const { PembayaranMember } = require("../../database/pembayaranMembership");
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
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }, // 1 week
  })
);

app.use(flash());

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(publicDirectoryPath, "images/payments");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

app.get("/membership", authenticateSession, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/login");
    }

    res.render("membership/membership", { user });
  } catch (error) {
    req.flash("error", "An error occurred");
    res.redirect("/membership");
  }
});

app.get("/membership/bronze", authenticateSession, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const badges = "Bronze";
    const price = "Rp24.900";
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/login");
    }
    res.render("membership/form-awal", { user, badges, price });
  } catch (error) {
    req.flash("error", "An error occurred");
    res.redirect("/membership");
  }
});

app.get("/membership/silver", authenticateSession, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const badges = "Silver";
    const price = "Rp49.900";
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/login");
    }
    res.render("membership/form-awal", { user, badges, price });
  } catch (error) {
    req.flash("error", "An error occurred");
    res.redirect("/membership");
  }
});

app.get("/membership/gold", authenticateSession, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const badges = "Gold";
    const price = "Rp59.900";
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/login");
    }
    res.render("membership/form-awal", { user, badges, price });
  } catch (error) {
    req.flash("error", "An error occurred");
    res.redirect("/membership");
  }
});

// Handle form submission and redirect to payment page
app.post("/membership/:badge", authenticateSession, async (req, res) => {
  try {
    const { badge } = req.params;
    const {
      namaDepan,
      namaBelakang,
      nomorTelepon,
      alamatDomisili,
      provinsiDomisili,
      kotaKabupatenDomisili,
      kecamatanDomisili,
      kodePosDomisili,
    } = req.body;

    // Find user
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/login");
    }

    // Create a new membership payment entry
    const newPayment = new PembayaranMember({
      userId: user._id,
      productName: `${badge} Membership`,
      namaDepan,
      nomorTelepon,
      alamatDomisili,
      provinsiDomisili,
      kotaKabupatenDomisili,
      kecamatanDomisili,
      kodePosDomisili: kodePosDomisili || null, // Optional field
    });

    await newPayment.save();

    req.session.paymentId = newPayment._id;

    res.redirect("/membership/pembayaran");
  } catch (error) {
    console.error("Error processing membership form:", error);
    req.flash("error", "An error occurred during the process");
    res.redirect("/membership");
  }
});

// Payment page
app.get("/membership/pembayaran", authenticateSession, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const payment = await PembayaranMember.findById(req.session.paymentId);

    if (!user || !payment) {
      req.flash("error", "Unable to process payment");
      return res.redirect("/membership");
    }

    res.render("membership/pembayaran", { user, payment });
  } catch (error) {
    req.flash("error", "An error occurred");
    res.redirect("/membership");
  }
});

// Handle payment proof upload
app.post(
  "/membership/pembayaran/upload",
  authenticateSession,
  upload.single("paymentProof"),
  async (req, res) => {
    try {
      const payment = await PembayaranMember.findById(req.session.paymentId);

      if (!payment) {
        req.flash("error", "Payment not found");
        return res.redirect("/membership");
      }

      if (req.file) {
        payment.paymentProof = req.file.path.replace(publicDirectoryPath, "");
        payment.updatedAt = Date.now();
        await payment.save();
      }

      req.flash("success", "Payment proof uploaded successfully");
      res.redirect("/membership/invoice");
    } catch (error) {
      console.error("Error uploading payment proof:", error);
      req.flash("error", "An error occurred during the upload");
      res.redirect("/membership/pembayaran");
    }
  }
);

// Invoice page
app.get("/membership/invoice", authenticateSession, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const payment = await PembayaranMember.findById(req.session.paymentId);

    if (!user || !payment) {
      req.flash("error", "Unable to generate invoice");
      return res.redirect("/membership");
    }

    res.render("membership/invoice", { user, payment });
  } catch (error) {
    req.flash("error", "An error occurred");
    res.redirect("/membership");
  }
});

module.exports = app;
