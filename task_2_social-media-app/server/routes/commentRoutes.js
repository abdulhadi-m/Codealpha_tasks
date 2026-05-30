const express = require("express");
const router = express.Router();
const { readJSON, writeJSON } = require("../config/db");
const verifyToken = require("../middleware/auth");

// add a comment (protected)
router.post("/:postId", verifyToken, (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim() === "")
      return res.status(400).json({ message: "Comment can't be empty." });

    // make sure the post exists
    const posts = readJSON("posts.json");
    const post = posts.find((p) => p.id === req.params.postId);
    if (!post)
      return res.status(404).json({ message: "Post not found." });

    const comments = readJSON("comments.json");

    const newComment = {
      id: Date.now().toString(),
      postId: req.params.postId,
      userId: req.user.id,
      username: req.user.username,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    comments.push(newComment);
    writeJSON("comments.json", comments);

    res.status(201).json({ message: "Comment added!", comment: newComment });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// get all comments for a post
router.get("/:postId", (req, res) => {
  try {
    const comments = readJSON("comments.json");
    const postComments = comments
      .filter((c) => c.postId === req.params.postId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    res.json(postComments);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// delete a comment (protected, only owner)
router.delete("/:commentId", verifyToken, (req, res) => {
  try {
    const comments = readJSON("comments.json");
    const comment = comments.find((c) => c.id === req.params.commentId);

    if (!comment)
      return res.status(404).json({ message: "Comment not found." });

    if (comment.userId !== req.user.id)
      return res.status(403).json({ message: "Not your comment." });

    const updated = comments.filter((c) => c.id !== req.params.commentId);
    writeJSON("comments.json", updated);

    res.json({ message: "Comment deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

module.exports = router;