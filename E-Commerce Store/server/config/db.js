const fs = require("fs");
const path = require("path");
 
const dataPath = (file) => path.join(__dirname, "../data", file);

const readJSON = (file) => {
  try {
    const raw = fs.readFileSync(dataPath(file), "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const writeJSON = (file, data) => {
  fs.writeFileSync(dataPath(file), JSON.stringify(data, null, 2));
};
 
const connectDB = async () => {
  if (process.env.USE_MONGO !== "true") {
    console.log("📁 Running in JSON file mode (no MongoDB)");
    return;
  }
  try {
    const mongoose = require("mongoose");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = { connectDB, readJSON, writeJSON };