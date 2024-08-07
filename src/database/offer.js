const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose
  .connect("mongodb://127.0.0.1:27017/sellandbuy")
  .then(() => {
    console.log("mongoose connected for offer model");
  })
  .catch((e) => {
    console.log("failed to connect to MongoDB");
  });

// Offer Schema
const OfferSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  offerPrice: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Offer = mongoose.model("Offer", OfferSchema);

module.exports = {
  Offer,
};
