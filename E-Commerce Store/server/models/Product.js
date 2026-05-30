const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  price:       { type: Number, required: true },
  category:    { type: String },
  image:       { type: String },
  description: { type: String },
  stock:       { type: Number, default: 0 },
  rating:      { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);