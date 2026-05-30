require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { connectDB } = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

// serve the client folder as static files
app.use(express.static(path.join(__dirname, "../client")));

app.use("/api/users",    require("./routes/userRoutes"));
app.use("/api/posts",    require("./routes/postRoutes"));
app.use("/api/comments", require("./routes/commentRoutes"));

// fallback to index.html
app.get("/{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
});