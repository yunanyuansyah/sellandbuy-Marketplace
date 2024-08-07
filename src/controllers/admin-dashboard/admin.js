require("dotenv").config();
const express = require("express");
const path = require("path");
const { User } = require("../../database/auth");
const { Product } = require("../../database/product");
const { PembayaranMember } = require("../../database/pembayaranMembership");
const { Offer } = require("../../database/offer");
const { Category } = require("../../database/category");
const { authenticateAdmin } = require("../middleware/middleware");

const app = express();

const publicDirectoryPath = path.join(__dirname, "../../../public");
const viewsPath = path.join(__dirname, "../../templates");

app.set("view engine", "ejs");
app.set("views", viewsPath);
app.use(express.static(publicDirectoryPath));

app.get("/admin-dashboard", authenticateAdmin, (req, res) => {
  res.render("admin-dashboard/main", { user: req.user });
});

// Admin Dashboard - View Products
app.get("/admin-dashboard/products", authenticateAdmin, async (req, res) => {
  try {
    const products = await Product.find()
      .populate("userId", "username")
      .populate("category", "name");
    res.render("admin-dashboard/products", {
      user: req.user,
      products,
      messages: req.flash(),
    });
  } catch (error) {
    console.error("Error loading products:", error);
    req.flash("error", "An error occurred while loading products.");
    res.redirect("/admin-dashboard");
  }
});

// Admin Dashboard - Verify Product
app.post(
  "/admin-dashboard/products/verify/:id",
  authenticateAdmin,
  async (req, res) => {
    try {
      await Product.findByIdAndUpdate(req.params.id, { isVerified: true });
      req.flash("success", "Product verified successfully.");
      res.redirect("/admin-dashboard/products");
    } catch (error) {
      console.error("Error verifying product:", error);
      req.flash("error", "An error occurred while verifying the product.");
      res.redirect("/admin-dashboard/products");
    }
  }
);

// Admin Dashboard - Delete Product
app.post(
  "/admin-dashboard/products/delete/:id",
  authenticateAdmin,
  async (req, res) => {
    try {
      await Product.findByIdAndDelete(req.params.id);
      req.flash("success", "Product deleted successfully.");
      res.redirect("/admin-dashboard/products");
    } catch (error) {
      console.error("Error deleting product:", error);
      req.flash("error", "An error occurred while deleting the product.");
      res.redirect("/admin-dashboard/products");
    }
  }
);

// Admin Dashboard - View Membership Payments
app.get("/admin-dashboard/memberships", authenticateAdmin, async (req, res) => {
  try {
    const memberships = await PembayaranMember.find().populate(
      "userId",
      "username email"
    );
    res.render("admin-dashboard/memberships", {
      user: req.user,
      memberships,
      messages: req.flash(),
    });
  } catch (error) {
    console.error("Error loading memberships:", error);
    req.flash("error", "An error occurred while loading memberships.");
    res.redirect("/admin-dashboard");
  }
});

// Admin Dashboard - Approve Membership
app.post(
  "/admin-dashboard/memberships/approve/:id",
  authenticateAdmin,
  async (req, res) => {
    const { membershipType, duration } = req.body;

    try {
      const payment = await PembayaranMember.findById(req.params.id).populate(
        "userId"
      );
      const user = await User.findById(payment.userId);
      if (user) {
        user.membership = membershipType;

        if (duration === "1 month") {
          user.membershipExpiresAt = new Date(
            new Date().setMonth(new Date().getMonth() + 1)
          ); // Add 1 month
        } else if (duration === "permanent") {
          user.membershipExpiresAt = null;
        }

        await user.save();
        req.flash("success", "Membership approved successfully.");
      }
      res.redirect("/admin-dashboard/memberships");
    } catch (error) {
      console.error("Error approving membership:", error);
      req.flash("error", "An error occurred while approving the membership.");
      res.redirect("/admin-dashboard/memberships");
    }
  }
);

// Admin Dashboard - Delete Membership Payment
app.post(
  "/admin-dashboard/memberships/delete/:id",
  authenticateAdmin,
  async (req, res) => {
    try {
      await PembayaranMember.findByIdAndDelete(req.params.id);
      req.flash("success", "Membership payment deleted successfully.");
      res.redirect("/admin-dashboard/memberships");
    } catch (error) {
      console.error("Error deleting membership payment:", error);
      req.flash(
        "error",
        "An error occurred while deleting the membership payment."
      );
      res.redirect("/admin-dashboard/memberships");
    }
  }
);

// Admin Dashboard - Manage Users
app.get("/admin-dashboard/users", authenticateAdmin, async (req, res) => {
  try {
    const users = await User.find();
    res.render("admin-dashboard/users", {
      user: req.user,
      users,
      messages: req.flash(),
    });
  } catch (error) {
    console.error("Error loading users:", error);
    req.flash("error", "An error occurred while loading users.");
    res.redirect("/admin-dashboard");
  }
});

// Admin Dashboard - Delete User
app.post(
  "/admin-dashboard/users/delete/:id",
  authenticateAdmin,
  async (req, res) => {
    try {
      const userId = req.params.id;
      await User.findByIdAndDelete(userId);
      await Product.deleteMany({ userId });
      await Offer.deleteMany({ user: userId });
      await PembayaranMember.deleteMany({ userId });
      req.flash("success", "User and associated data deleted successfully.");
      res.redirect("/admin-dashboard/users");
    } catch (error) {
      console.error("Error deleting user:", error);
      req.flash("error", "An error occurred while deleting the user.");
      res.redirect("/admin-dashboard/users");
    }
  }
);

// Admin Dashboard - Manage Categories
app.get("/admin-dashboard/categories", authenticateAdmin, async (req, res) => {
  try {
    const categories = await Category.find();
    res.render("admin-dashboard/categories", {
      user: req.user,
      categories,
      messages: req.flash(),
    });
  } catch (error) {
    console.error("Error loading categories:", error);
    req.flash("error", "An error occurred while loading categories.");
    res.redirect("/admin-dashboard");
  }
});

// Admin Dashboard - Create Category
app.post(
  "/admin-dashboard/categories/create",
  authenticateAdmin,
  async (req, res) => {
    try {
      const { name } = req.body;
      const category = new Category({ name });
      await category.save();
      req.flash("success", "Category created successfully.");
      res.redirect("/admin-dashboard/categories");
    } catch (error) {
      console.error("Error creating category:", error);
      req.flash("error", "An error occurred while creating the category.");
      res.redirect("/admin-dashboard/categories");
    }
  }
);

// Admin Dashboard - Edit Category
app.post(
  "/admin-dashboard/categories/edit/:id",
  authenticateAdmin,
  async (req, res) => {
    try {
      const { name } = req.body;
      await Category.findByIdAndUpdate(req.params.id, { name });
      req.flash("success", "Category updated successfully.");
      res.redirect("/admin-dashboard/categories");
    } catch (error) {
      console.error("Error updating category:", error);
      req.flash("error", "An error occurred while updating the category.");
      res.redirect("/admin-dashboard/categories");
    }
  }
);

// Admin Dashboard - Delete Category
app.post(
  "/admin-dashboard/categories/delete/:id",
  authenticateAdmin,
  async (req, res) => {
    try {
      await Category.findByIdAndDelete(req.params.id);
      req.flash("success", "Category deleted successfully.");
      res.redirect("/admin-dashboard/categories");
    } catch (error) {
      console.error("Error deleting category:", error);
      req.flash("error", "An error occurred while deleting the category.");
      res.redirect("/admin-dashboard/categories");
    }
  }
);

module.exports = app;
