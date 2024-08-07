const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose
  .connect("mongodb://127.0.0.1:27017/sellandbuy")
  .then(() => {
    console.log("mongoose connected for pembayaran membership model");
  })
  .catch((e) => {
    console.log("failed to connect to MongoDB");
  });

const pembayaranMembership = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  namaDepan: {
    type: String,
    required: true,
  },
  nomorTelepon: {
    type: Number,
    required: true,
  },
  alamatDomisili: {
    type: String,
  },
  provinsiDomisili: {
    type: String,
    required: true,
  },
  kotaKabupatenDomisili: {
    type: String,
    required: true,
  },
  kecamatanDomisili: {
    type: String,
    required: true,
  },
  kodePosDomisili: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  paymentProof: {
    type: String,
  },
});

const PembayaranMember = mongoose.model(
  "pembayaranMembership",
  pembayaranMembership
);

module.exports = {
  PembayaranMember,
};
