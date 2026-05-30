// redirect if not logged in
(function () {
  if (!getUser()) window.location.href = "/auth.html";
})();

// grab project id from the url
const params    = new URLSearchParams(window.location.search);
const projectId = params.get("id");

if (!projectId) window.location.href = "/dashboard.html";

let currentProject = null;

document.addEventListener("DOMContentLoaded", async () => {
  updateNavbar();
  await loadProject();
  await loadTasks();
});

// load project info
async function loadProject() {
  try {
    const project = await apiFetch(`/projects/${projectId}`);
    currentProject = project;

    document.getElementById("project-name").textContent =
      project.name;
    document.getElementById("project-desc").textContent =
      project.description || "No description.";

    // show members as chips
    const membersList = document.getElementById("members-list");
    membersList.innerHTML = project.memberNames
      .map(name => `<span class="member-chip">👤 ${name}</span>`)
      .join("");

    // only show add-member input if current user is the owner
    const user = getUser();
    if (project.ownerId === user.id) {
      document.getElementById("add-member-section").style.display = "block";
    }

    // fill assignee dropdown with project members
    const select = document.getElementById("task-assignee");
    project.memberNames.forEach((name, i) => {
      const opt   = document.createElement("option");
      opt.value   = project.members[i];
      opt.textContent = name;
      select.appendChild(opt);
    });

  } catch (err) {
    showToast("Could not load project.", "error");
    setTimeout(() => window.location.href = "/dashboard.html", 1500);
  }
}

// load and sort tasks into columns
async function loadTasks() {
  // clear columns first
  document.getElementById("col-todo").innerHTML        = "";
  document.getElementById("col-in-progress").innerHTML = "";
  document.getElementById("col-done").innerHTML         = "";

  try {
    const tasks = await apiFetch(`/tasks/project/${projectId}`);

    // split tasks by status
    const todo       = tasks.filter(t => t.status === "todo");
    const inProgress = tasks.filter(t => t.status === "in-progress");
    const done       = tasks.filter(t => t.status === "done");

    // update column counts
    document.getElementById("count-todo").textContent        = todo.length;
    document.getElementById("count-in-progress").textContent = inProgress.length;
    document.getElementById("count-done").textContent        = done.length;

    // render each group into its column
    renderColumn("col-todo",        todo);
    renderColumn("col-in-progress", inProgress);
    renderColumn("col-done",        done);

  } catch (err) {
    showToast("Could not load tasks.", "error");
  }
}

// put task cards into a column
function renderColumn(colId, tasks) {
  const col = document.getElementById(colId);

  if (tasks.length === 0) {
    col.innerHTML = `
      <div style="text-align:center; padding:1.5rem 0.5rem;
                  color:var(--text-muted); font-size:0.825rem;">
        No tasks here
      </div>`;
    return;
  }

  col.innerHTML = tasks.map(task => `
    <div
      class="task-card ${task.status}"
      onclick="goToTask('${task.id}')"
    >
      <div class="task-card-title">${escapeHtml(task.title)}</div>
      <div class="task-card-assigned">
        👤 ${escapeHtml(task.assignedName)}
      </div>
    </div>
  `).join("");
}

// go to the task detail page
function goToTask(taskId) {
  window.location.href = `/task.html?id=${taskId}&project=${projectId}`;
}

// create a new task
async function createTask() {
  const title      = document.getElementById("task-title").value.trim();
  const desc       = document.getElementById("task-desc").value.trim();
  const status     = document.getElementById("task-status").value;
  const selectEl   = document.getElementById("task-assignee");
  const assignedTo   = selectEl.value || null;
  const assignedName = assignedTo
    ? selectEl.options[selectEl.selectedIndex].text
    : "Unassigned";

  if (!title) {
    showToast("Task title is required.", "error");
    return;
  }

  const btn = document.getElementById("btn-add-task");
  btn.disabled    = true;
  btn.textContent = "Adding...";

  try {
    await apiFetch("/tasks", {
      method: "POST",
      body: JSON.stringify({
        title,
        description: desc,
        projectId,
        assignedTo,
        assignedName,
        status
      })
    });

    closeTaskModal();
    // reset the form
    document.getElementById("task-title").value = "";
    document.getElementById("task-desc").value  = "";
    document.getElementById("task-status").value = "todo";
    selectEl.selectedIndex = 0;

    showToast("Task added!", "success");
    await loadTasks();

  } catch (err) {
    showToast(err.message, "error");
  } finally {
    btn.disabled    = false;
    btn.textContent = "Add Task";
  }
}

// add a member to this project
async function addMember() {
  const input    = document.getElementById("member-username");
  const username = input.value.trim();

  if (!username) return;

  try {
    const res = await apiFetch(`/projects/${projectId}/members`, {
      method: "POST",
      body: JSON.stringify({ username })
    });

    input.value = "";
    showToast(`${username} added!`, "success");

    // reload project to update members list and dropdown
    await loadProject();

  } catch (err) {
    showToast(err.message, "error");
  }
}

// modal helpers
function openTaskModal() {
  document.getElementById("task-modal").classList.add("open");
}

function closeTaskModal() {
  document.getElementById("task-modal").classList.remove("open");
}

function handleTaskOverlay(event) {
  if (event.target === document.getElementById("task-modal")) {
    closeTaskModal();
  }
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeTaskModal();
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}