const express = require("express");
const router = express.Router();
const { readJSON, writeJSON } = require("../config/db");
const verifyToken = require("../middleware/auth");

// create a post (protected)
router.post("/", verifyToken, (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim() === "")
      return res.status(400).json({ message: "Post can't be empty." });

    if (content.length > 500)
      return res.status(400).json({ message: "Post too long (max 500 chars)." });

    const posts = readJSON("posts.json");

    const newPost = {
      id: Date.now().toString(),
      userId: req.user.id,
      username: req.user.username,
      content: content.trim(),
      likes: [],
      image: "",
      createdAt: new Date().toISOString(),
    };

    posts.unshift(newPost); // newest first
    writeJSON("posts.json", posts);

    res.status(201).json({ message: "Post created!", post: newPost });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// get all posts (public feed)
router.get("/", (req, res) => {
  const posts    = readJSON("posts.json");
  const comments = readJSON("comments.json");
  const enriched = posts.map((p) => ({
    ...p,
    commentCount: comments.filter((c) => c.postId === p.id).length,
  }));
  res.json(enriched);
});

// get posts by a specific user
router.get("/user/:userId", (req, res) => {
  try {
    const posts = readJSON("posts.json");
    const comments = readJSON("comments.json");

    const userPosts = posts
      .filter((p) => p.userId === req.params.userId)
      .map((p) => ({
        ...p,
        commentCount: comments.filter((c) => c.postId === p.id).length,
      }));

    res.json(userPosts);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// like or unlike a post (protected)
router.post("/:id/like", verifyToken, (req, res) => {
  try {
    const posts = readJSON("posts.json");
    const idx = posts.findIndex((p) => p.id === req.params.id);

    if (idx === -1)
      return res.status(404).json({ message: "Post not found." });

    const post = posts[idx];
    const alreadyLiked = post.likes.includes(req.user.id);

    if (alreadyLiked) {
      // unlike
      post.likes = post.likes.filter((id) => id !== req.user.id);
    } else {
      // like
      post.likes.push(req.user.id);
    }

    writeJSON("posts.json", posts);
    res.json({ liked: !alreadyLiked, likeCount: post.likes.length });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// delete a post (protected, only owner)
router.delete("/:id", verifyToken, (req, res) => {
  try {
    const posts = readJSON("posts.json");
    const post = posts.find((p) => p.id === req.params.id);

    if (!post)
      return res.status(404).json({ message: "Post not found." });

    if (post.userId !== req.user.id)
      return res.status(403).json({ message: "Not your post." });

    const updated = posts.filter((p) => p.id !== req.params.id);
    writeJSON("posts.json", updated);

    // also delete its comments
    const comments = readJSON("comments.json");
    const cleanedComments = comments.filter((c) => c.postId !== req.params.id);
    writeJSON("comments.json", cleanedComments);

    res.json({ message: "Post deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

module.exports = router;