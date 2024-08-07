const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose
  .connect("mongodb://127.0.0.1:27017/sellandbuy")
  .then(() => {
    console.log("mongoose connected for authentication model");
  })
  .catch((e) => {
    console.log("failed to connect to MongoDB");
  });

// User Schema
const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  birthdate: {
    type: Date,
    required: true,
  },
  membership: {
    type: String,
    enum: ["none", "bronze", "silver", "gold"],
    default: "none",
  },
  membershipExpiresAt: {
    type: Date,
    default: null,
  },
  profilePicturePath: {
    type: String,
    default: "images/pictures/default.png",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Session Schema
const SessionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: "30d",
  },
});

// Password Reset Token Schema
const PasswordResetTokenSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: "1h",
  },
});

const User = mongoose.model("User", UserSchema);
const Session = mongoose.model("Session", SessionSchema);
const PasswordResetToken = mongoose.model(
  "PasswordResetToken",
  PasswordResetTokenSchema
);

module.exports = {
  User,
  Session,
  PasswordResetToken,
};
