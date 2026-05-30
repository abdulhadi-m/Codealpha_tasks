const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const verifyToken = require("../middleware/auth");

function readData(file) {
  const filePath = path.join(__dirname, "../data", file);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

function writeData(file, data) {
  const filePath = path.join(__dirname, "../data", file);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// get all comments for a task
router.get("/:taskId", verifyToken, (req, res) => {
  const comments = readData("comments.json");
  const taskComments = comments
    .filter(c => c.taskId === req.params.taskId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  res.json(taskComments);
});

// add a comment to a task
router.post("/:taskId", verifyToken, (req, res) => {
  const { text } = req.body;

  if (!text || text.trim() === "") {
    return res.status(400).json({ message: "Comment can't be empty." });
  }

  // make sure the task actually exists
  const tasks = readData("tasks.json");
  const task = tasks.find(t => t.id === req.params.taskId);
  if (!task) {
    return res.status(404).json({ message: "Task not found." });
  }

  const comments = readData("comments.json");

  const newComment = {
    id: Date.now().toString(),
    taskId: req.params.taskId,
    userId: req.user.id,
    username: req.user.username,
    text: text.trim(),
    createdAt: new Date().toISOString()
  };

  comments.push(newComment);
  writeData("comments.json", comments);

  res.status(201).json({ message: "Comment added!", comment: newComment });
});

// delete a comment (only the person who wrote it)
router.delete("/:commentId", verifyToken, (req, res) => {
  const comments = readData("comments.json");
  const comment = comments.find(c => c.id === req.params.commentId);

  if (!comment) {
    return res.status(404).json({ message: "Comment not found." });
  }

  if (comment.userId !== req.user.id) {
    return res.status(403).json({ message: "You can only delete your own comments." });
  }

  const updated = comments.filter(c => c.id !== req.params.commentId);
  writeData("comments.json", updated);

  res.json({ message: "Comment deleted." });
});

module.exports = router;