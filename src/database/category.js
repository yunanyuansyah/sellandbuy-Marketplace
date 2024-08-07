const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
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
