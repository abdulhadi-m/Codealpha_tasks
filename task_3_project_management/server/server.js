require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// serve the client folder
app.use(express.static(path.join(__dirname, "../client")));

// all the routes
app.use("/api/auth",     require("./routes/authRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/tasks",    require("./routes/taskRoutes"));
app.use("/api/comments", require("./routes/commentRoutes"));

// anything else goes to dashboard
app.get("/{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dashboard.html"));
});

const PORT = process.env.PORT || 8081;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});