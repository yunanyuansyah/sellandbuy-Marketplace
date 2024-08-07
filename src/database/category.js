const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose
  .connect("mongodb://127.0.0.1:27017/sellandbuy")
  .then(() => {
    console.log("mongoose connected for Category model");
  })
  .catch((e) => {
    console.log("failed to connect to MongoDB");
  });

const categorySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Category = mongoose.model("Category", categorySchema);

module.exports = {
  Category,
};
