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
const { Offer } = require("../../database/offer");
const { Category } = require("../../database/category");
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
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
  })
);

app.use(flash());

const storagePictures = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images/pictures");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const storageProducts = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images/products");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const uploadPictures = multer({
  storage: storagePictures,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadProducts = multer({
  storage: storageProducts,
  limits: { fileSize: 10 * 1024 * 1024 },
});

app.get("/profile", authenticateSession, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/login");
    }
    const products = await Product.find({ userId: user._id });
    res.render("profile/profil-pengguna", {
      user,
      products,
      messages: req.flash(),
    });
  } catch (error) {
    req.flash("error", "An error occurred");
    res.redirect("/login");
  }
});

app.get("/profile/:id", authenticateSession, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/profile");
    }
    const products = await Product.find({ userId: user._id });

    if (req.session.userId === user._id) {
      res.redirect("/profile");
    }

    res.render("profile/profil-pengguna-lain", {
      user,
      products,
      messages: req.flash(),
    });
  } catch (error) {
    req.flash("error", "An error occurred");
    res.redirect("/profile");
  }
});

app.post("/profile/update", authenticateSession, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.session.userId, req.body, { new: true });
    req.flash("success", "Profile updated successfully");
    res.redirect("/profile");
  } catch (error) {
    req.flash("error", "An error occurred");
    res.redirect("/profile");
  }
});

app.post(
  "/profile/update-picture",
  authenticateSession,
  uploadPictures.single("profilePicture"),
  async (req, res) => {
    try {
      const user = await User.findById(req.session.userId);
      if (!user) {
        req.flash("error", "User not found");
        return res.redirect("/profile");
      }

      const oldPicturePath = path.join(
        publicDirectoryPath,
        user.profilePicturePath
      );

      if (
        user.profilePicturePath &&
        user.profilePicturePath !== "images/pictures/default.png" &&
        fs.existsSync(oldPicturePath)
      ) {
        fs.unlinkSync(oldPicturePath);
      }

      user.profilePicturePath = path.join("images/pictures", req.file.filename);
      await user.save();
      req.flash("success", "Profile picture updated successfully");
      res.redirect("/profile");
    } catch (error) {
      console.error(error);
      req.flash("error", "An error occurred");
      res.redirect("/profile");
    }
  }
);

app.get("/profile/product/:id", authenticateSession, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/login");
    }
    const product = await Product.findById(req.params.id).populate("category");
    if (!product) {
      req.flash("error", "Product not found");
      return res.redirect("/profile");
    }

    if (product.userId.toString() !== user._id.toString()) {
      req.flash("error", "You do not have permission to access this product");
      return res.redirect("/profile");
    }

    res.render("profile/item/detail-item", {
      product,
      user,
      messages: req.flash(),
    });
  } catch (error) {
    console.log(error);
    req.flash("error", "An error occurred");
    res.redirect("/profile");
  }
});

app.get("/profile/product/edit/:id", authenticateSession, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/login");
    }

    const product = await Product.findById(req.params.id).populate("category");
    if (!product) {
      req.flash("error", "Product not found");
      return res.redirect("/profile");
    }

    if (product.userId.toString() !== user._id.toString()) {
      req.flash("error", "You do not have permission to access this product");
      return res.redirect("/profile");
    }

    const categories = await Category.find();

    res.render("profile/item/edit-item", {
      product,
      categories,
      messages: req.flash(),
    });
  } catch (error) {
    req.flash("error", "An error occurred");
    res.redirect("/profile");
  }
});

app.post(
  "/profile/product/edit/:id",
  authenticateSession,
  uploadProducts.array("productImages", 4),
  async (req, res) => {
    try {
      const user = await User.findById(req.session.userId);
      if (!user) {
        req.flash("error", "User not found");
        return res.redirect("/login");
      }
      const product = await Product.findById(req.params.id);
      if (!product) {
        req.flash("error", "Product not found");
        return res.redirect("/profile");
      }
      if (product.userId.toString() !== user._id.toString()) {
        req.flash("error", "You do not have permission to access this product");
        return res.redirect("/profile");
      }

      if (req.files && req.files.length > 0) {
        product.images.forEach((image) => {
          const filePath = path.join(publicDirectoryPath, image);
          if (
            fs.existsSync(filePath) &&
            image !== "images/products/default.png"
          ) {
            fs.unlinkSync(filePath);
          }
        });
        product.images = req.files.map((file) =>
          path.join("images/products", path.basename(file.path))
        );
      }

      product.category = req.body.category;
      product.condition = req.body.condition;
      product.productName = req.body.productName;
      product.price = req.body.price;
      product.reasonForSelling = req.body.reasonForSelling;
      product.description = req.body.description;

      await product.save();
      req.flash("success", "Product updated successfully");
      res.redirect(`/profile/product/${product._id}`);
    } catch (error) {
      console.log(error);
      req.flash("error", "An error occurred");
      res.redirect("/profile");
    }
  }
);

app.get(
  "/profile/product/:id/daftar-penawaran",
  authenticateSession,
  async (req, res) => {
    try {
      const user = await User.findById(req.session.userId);
      if (!user) {
        req.flash("error", "User not found");
        return res.redirect("/login");
      }

      const product = await Product.findById(req.params.id);

      if (!product) {
        req.flash("error", "Product not found");
        return res.redirect("/profile");
      }

      if (product.userId.toString() !== user._id.toString()) {
        req.flash("error", "You do not have permission to access this product");
        return res.redirect("/profile");
      }

      const offers = await Offer.find({
        product: product._id,
      })
        .populate("user", "username profilePicturePath phone")
        .populate("product", "productName");

      res.render("profile/item/penawaran", {
        user,
        product,
        offers,
        messages: req.flash(),
      });
    } catch (error) {
      console.log(error);
      req.flash("error", "An error occurred");
      res.redirect("/profile");
    }
  }
);

module.exports = app;
