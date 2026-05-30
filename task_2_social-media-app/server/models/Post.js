const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  userId:   { type: String, required: true },
  username: { type: String, required: true },
  content:  { type: String, required: true },
  likes:    { type: [String], default: [] }, // array of userIds
  image:    { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("Post", postSchema);