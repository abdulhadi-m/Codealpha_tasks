const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { readJSON, writeJSON } = require("../config/db");
const verifyToken = require("../middleware/auth");

const generateToken = (user) =>
  jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

// register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ message: "All fields are required." });

    const users = readJSON("users.json");

    if (users.find((u) => u.email === email.toLowerCase()))
      return res.status(409).json({ message: "Email already in use." });

    if (users.find((u) => u.username.toLowerCase() === username.toLowerCase()))
      return res.status(409).json({ message: "Username already taken." });

    const hashed = await bcrypt.hash(password, 10);

    const newUser = {
      id: Date.now().toString(),
      username: username.trim(),
      email: email.toLowerCase(),
      password: hashed,
      bio: "",
      avatar: `https://api.dicebear.com/7.x/thumbs/svg?seed=${username}`,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    writeJSON("users.json", users);

    const token = generateToken(newUser);
    res.status(201).json({
      message: "Account created!",
      token,
      user: { id: newUser.id, username: newUser.username, email: newUser.email, avatar: newUser.avatar },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password required." });

    const users = readJSON("users.json");
    const user = users.find((u) => u.email === email.toLowerCase());

    if (!user)
      return res.status(401).json({ message: "Invalid email or password." });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: "Invalid email or password." });

    const token = generateToken(user);
    res.json({
      message: "Logged in!",
      token,
      user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// get any user's profile by id
router.get("/:id", (req, res) => {
  try {
    const users = readJSON("users.json");
    const user = users.find((u) => u.id === req.params.id);

    if (!user)
      return res.status(404).json({ message: "User not found." });

    // don't send the password back
    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// update bio (protected)
router.put("/update/bio", verifyToken, (req, res) => {
  try {
    const { bio } = req.body;
    const users = readJSON("users.json");
    const idx = users.findIndex((u) => u.id === req.user.id);

    if (idx === -1)
      return res.status(404).json({ message: "User not found." });

    users[idx].bio = bio || "";
    writeJSON("users.json", users);

    res.json({ message: "Bio updated.", bio: users[idx].bio });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// follow a user (protected)
router.post("/:id/follow", verifyToken, (req, res) => {
  try {
    const targetId = req.params.id;
    const myId = req.user.id;

    if (targetId === myId)
      return res.status(400).json({ message: "You can't follow yourself." });

    const follows = readJSON("follows.json");
    const already = follows.find((f) => f.followerId === myId && f.followingId === targetId);

    if (already) {
      // unfollow
      const updated = follows.filter((f) => !(f.followerId === myId && f.followingId === targetId));
      writeJSON("follows.json", updated);
      return res.json({ message: "Unfollowed.", following: false });
    }

    // follow
    follows.push({
      id: Date.now().toString(),
      followerId: myId,
      followingId: targetId,
      createdAt: new Date().toISOString(),
    });
    writeJSON("follows.json", follows);
    res.json({ message: "Followed!", following: true });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// get follower/following counts for a user
router.get("/:id/follows", (req, res) => {
  try {
    const follows = readJSON("follows.json");
    const followers  = follows.filter((f) => f.followingId === req.params.id).length;
    const following  = follows.filter((f) => f.followerId  === req.params.id).length;
    res.json({ followers, following });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

router.get("/:id/is-following/:targetId", verifyToken, (req, res) => {
  try {
    const follows = readJSON("follows.json");
    const result  = follows.find(
      (f) => f.followerId === req.params.id && f.followingId === req.params.targetId
    );
    res.json({ following: !!result });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});
module.exports = router;