const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

// helper to read/write json files
function readData(file) {
  const filePath = path.join(__dirname, "../data", file);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

function writeData(file, data) {
  const filePath = path.join(__dirname, "../data", file);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// register a new user
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const users = readData("users.json");

  // check if email already used
  const exists = users.find(u => u.email === email.toLowerCase());
  if (exists) {
    return res.status(409).json({ message: "Email already registered." });
  }

  const hashed = await bcrypt.hash(password, 10);

  const newUser = {
    id: Date.now().toString(),
    username: username.trim(),
    email: email.toLowerCase(),
    password: hashed,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeData("users.json", users);

  // sign a token right away so they're logged in after register
  const token = jwt.sign(
    { id: newUser.id, username: newUser.username, email: newUser.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.status(201).json({
    message: "Account created!",
    token,
    user: { id: newUser.id, username: newUser.username, email: newUser.email }
  });
});

// login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required." });
  }

  const users = readData("users.json");
  const user = users.find(u => u.email === email.toLowerCase());

  if (!user) {
    return res.status(401).json({ message: "Wrong email or password." });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ message: "Wrong email or password." });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    message: "Logged in!",
    token,
    user: { id: user.id, username: user.username, email: user.email }
  });
});

module.exports = router;