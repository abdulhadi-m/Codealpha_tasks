const mongoose = require("mongoose"); 
const orderSchema = new mongoose.Schema({
  userId:  { type: String, required: true },
  items: [
    {
      productId: String,
      name:      String,
      price:     Number,
      quantity:  Number,
    }
  ],
  total:   { type: Number, required: true },
  status:  { type: String, default: "Processing" },
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);