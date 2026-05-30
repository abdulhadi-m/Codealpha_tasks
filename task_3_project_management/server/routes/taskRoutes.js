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

// get all tasks for a project
router.get("/project/:projectId", verifyToken, (req, res) => {
  const tasks = readData("tasks.json");
  const projectTasks = tasks.filter(t => t.projectId === req.params.projectId);
  res.json(projectTasks);
});

// get a single task
router.get("/:id", verifyToken, (req, res) => {
  const tasks = readData("tasks.json");
  const task = tasks.find(t => t.id === req.params.id);

  if (!task) {
    return res.status(404).json({ message: "Task not found." });
  }

  res.json(task);
});

// create a task inside a project
router.post("/", verifyToken, (req, res) => {
  const { title, description, projectId, assignedTo, assignedName, status } = req.body;

  if (!title || !projectId) {
    return res.status(400).json({ message: "Title and projectId are required." });
  }

  // make sure the project exists
  const projects = readData("projects.json");
  const project = projects.find(p => p.id === projectId);
  if (!project) {
    return res.status(404).json({ message: "Project not found." });
  }

  const tasks = readData("tasks.json");

  const newTask = {
    id: Date.now().toString(),
    projectId,
    title: title.trim(),
    description: description || "",
    status: status || "todo",   // todo / in-progress / done
    assignedTo: assignedTo || null,
    assignedName: assignedName || "Unassigned",
    createdBy: req.user.id,
    createdByName: req.user.username,
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  writeData("tasks.json", tasks);

  res.status(201).json({ message: "Task created!", task: newTask });
});

// update a task (status, assignee, etc.)
router.put("/:id", verifyToken, (req, res) => {
  const tasks = readData("tasks.json");
  const idx = tasks.findIndex(t => t.id === req.params.id);

  if (idx === -1) {
    return res.status(404).json({ message: "Task not found." });
  }

  const { title, description, status, assignedTo, assignedName } = req.body;

  // only update the fields that were sent
  if (title)        tasks[idx].title       = title.trim();
  if (description !== undefined) tasks[idx].description = description;
  if (status)       tasks[idx].status      = status;
  if (assignedTo)   tasks[idx].assignedTo  = assignedTo;
  if (assignedName) tasks[idx].assignedName = assignedName;

  writeData("tasks.json", tasks);

  res.json({ message: "Task updated!", task: tasks[idx] });
});

// delete a task
router.delete("/:id", verifyToken, (req, res) => {
  const tasks = readData("tasks.json");
  const task = tasks.find(t => t.id === req.params.id);

  if (!task) {
    return res.status(404).json({ message: "Task not found." });
  }

  const updated = tasks.filter(t => t.id !== req.params.id);
  writeData("tasks.json", updated);

  // clean up comments for this task too
  const comments = readData("comments.json");
  const cleanedComments = comments.filter(c => c.taskId !== req.params.id);
  writeData("comments.json", cleanedComments);

  res.json({ message: "Task deleted." });
});

module.exports = router;