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

// get all projects the logged in user is part of
router.get("/", verifyToken, (req, res) => {
  const projects = readData("projects.json");

  // only return projects where user is owner or a member
  const myProjects = projects.filter(p =>
    p.ownerId === req.user.id || p.members.includes(req.user.id)
  );

  res.json(myProjects);
});

// get a single project by id
router.get("/:id", verifyToken, (req, res) => {
  const projects = readData("projects.json");
  const project = projects.find(p => p.id === req.params.id);

  if (!project) {
    return res.status(404).json({ message: "Project not found." });
  }

  res.json(project);
});

// create a new project
router.post("/", verifyToken, (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Project name is required." });
  }

  const projects = readData("projects.json");

  const newProject = {
    id: Date.now().toString(),
    name: name.trim(),
    description: description || "",
    ownerId: req.user.id,
    ownerName: req.user.username,
    // members list starts with just the creator
    members: [req.user.id],
    memberNames: [req.user.username],
    createdAt: new Date().toISOString()
  };

  projects.push(newProject);
  writeData("projects.json", projects);

  res.status(201).json({ message: "Project created!", project: newProject });
});

// add a member to a project (owner only)
router.post("/:id/members", verifyToken, (req, res) => {
  const { username } = req.body;
  const projects = readData("projects.json");
  const users = readData("users.json");

  const projectIdx = projects.findIndex(p => p.id === req.params.id);
  if (projectIdx === -1) {
    return res.status(404).json({ message: "Project not found." });
  }

  const project = projects[projectIdx];

  // only the owner can add members
  if (project.ownerId !== req.user.id) {
    return res.status(403).json({ message: "Only the project owner can add members." });
  }

  // find the user by username
  const userToAdd = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!userToAdd) {
    return res.status(404).json({ message: "User not found." });
  }

  // don't add them twice
  if (project.members.includes(userToAdd.id)) {
    return res.status(409).json({ message: "User is already a member." });
  }

  project.members.push(userToAdd.id);
  project.memberNames.push(userToAdd.username);
  writeData("projects.json", projects);

  res.json({ message: `${userToAdd.username} added to project!`, project });
});

// delete a project (owner only)
router.delete("/:id", verifyToken, (req, res) => {
  const projects = readData("projects.json");
  const project = projects.find(p => p.id === req.params.id);

  if (!project) {
    return res.status(404).json({ message: "Project not found." });
  }

  if (project.ownerId !== req.user.id) {
    return res.status(403).json({ message: "Only the owner can delete this project." });
  }

  const updated = projects.filter(p => p.id !== req.params.id);
  writeData("projects.json", updated);

  // also clean up tasks for this project
  const tasks = readData("tasks.json");
  const cleanedTasks = tasks.filter(t => t.projectId !== req.params.id);
  writeData("tasks.json", cleanedTasks);

  res.json({ message: "Project deleted." });
});

module.exports = router;