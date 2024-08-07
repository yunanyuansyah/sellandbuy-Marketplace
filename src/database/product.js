const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose
  .connect("mongodb://127.0.0.1:27017/sellandbuy")
  .then(() => {
    console.log("mongoose connected for product model");
  })
  .catch((e) => {
    console.log("failed to connect to MongoDB");
  });

// Product Schema
const ProductSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  reasonForSelling: {
    type: String,
    required: true,
  },
  condition: {
    type: String,
    enum: ["Baru", "Bekas"],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  fullAddress: {
    type: String,
    required: true,
  },
  images: {
    type: [String],
    validate: {
      validator: function (array) {
        return array.length <= 4;
      },
      message: "You can upload a maximum of 4 images",
    },
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  paymentProof: {
    type: String,
  },
});

const Product = mongoose.model("Product", ProductSchema);

module.exports = {
  Product,
};
