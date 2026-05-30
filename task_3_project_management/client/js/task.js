 // send to login if not logged in
(function () {
  if (!getUser()) window.location.href = "/auth.html";
})();

// get task id and project id from url
const urlParams = new URLSearchParams(window.location.search);
const taskId    = urlParams.get("id");
const projectId = urlParams.get("project");

if (!taskId) window.location.href = "/dashboard.html";

let currentTask = null;

document.addEventListener("DOMContentLoaded", async () => {
  updateNavbar();
  await loadTask();
  await loadComments();
});

// go back to the project board
function goBack() {
  if (projectId) {
    window.location.href = `/project.html?id=${projectId}`;
  } else {
    window.location.href = "/dashboard.html";
  }
}

// load the task details
async function loadTask() {
  try {
    const task    = await apiFetch(`/tasks/${taskId}`);
    currentTask   = task;

    document.getElementById("task-loading").style.display = "none";
    document.getElementById("task-content").style.display = "block";

    // fill in all the task info
    document.getElementById("task-title").textContent =
      task.title;
    document.getElementById("task-assigned").textContent =
      task.assignedName;
    document.getElementById("task-created-by").textContent =
      task.createdByName;
    document.getElementById("task-time").textContent =
      timeAgo(task.createdAt);
    document.getElementById("task-desc").textContent =
      task.description || "No description provided.";

    // set the status dropdown to match current status
    document.getElementById("status-select").value = task.status;

    // show delete button only if current user created this task
    const user = getUser();
    if (user && user.id === task.createdBy) {
      document.getElementById("task-actions").innerHTML = `
        <button class="btn btn-sm btn-danger" onclick="deleteTask()">
          Delete Task
        </button>`;
    }

  } catch (err) {
    document.getElementById("task-loading").style.display = "none";
    document.getElementById("task-error").style.display   = "block";
  }
}

// update task status when dropdown changes
async function updateStatus() {
  const newStatus = document.getElementById("status-select").value;

  try {
    await apiFetch(`/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify({ status: newStatus })
    });
    showToast("Status updated!", "success");
  } catch (err) {
    showToast(err.message, "error");
  }
}

// delete the task and go back
async function deleteTask() {
  if (!confirm("Delete this task? Comments will also be removed.")) return;

  try {
    await apiFetch(`/tasks/${taskId}`, { method: "DELETE" });
    showToast("Task deleted.", "default");
    setTimeout(goBack, 800);
  } catch (err) {
    showToast(err.message, "error");
  }
}

// load all comments for this task
async function loadComments() {
  const list = document.getElementById("comments-list");
  list.innerHTML = '<div class="spinner" style="padding:1.5rem;"></div>';

  try {
    const comments = await apiFetch(`/comments/${taskId}`);

    if (comments.length === 0) {
      list.innerHTML = `
        <div style="color:var(--text-muted); font-size:0.875rem;
                    padding:0.5rem 0; margin-bottom:0.5rem;">
          No comments yet. Be the first to comment!
        </div>`;
      return;
    }

    list.innerHTML = comments.map(c => renderComment(c)).join("");

  } catch (err) {
    list.innerHTML = `
      <div style="color:var(--danger); font-size:0.85rem;">
        Could not load comments.
      </div>`;
  }
}

// build a single comment's HTML
function renderComment(comment) {
  const user      = getUser();
  const isOwner   = user && user.id === comment.userId;
  // first letter of username for the avatar circle
  const initial   = comment.username.charAt(0).toUpperCase();

  return `
    <div class="comment-item" id="comment-${comment.id}">
      <div class="comment-avatar">${initial}</div>
      <div class="comment-body">
        <div class="comment-username">@${escapeHtml(comment.username)}</div>
        <div class="comment-text">${escapeHtml(comment.text)}</div>
        <div class="comment-time">
          ${timeAgo(comment.createdAt)}
          ${isOwner ? `
            <button
              onclick="deleteComment('${comment.id}')"
              style="margin-left:0.5rem; background:none; border:none;
                     color:var(--danger); cursor:pointer; font-size:0.75rem;"
            >delete</button>` : ""}
        </div>
      </div>
    </div>`;
}

// post a new comment
async function submitComment() {
  const input = document.getElementById("comment-input");
  const text  = input.value.trim();

  if (!text) return;

  input.disabled = true;
  input.value    = "";

  try {
    const res = await apiFetch(`/comments/${taskId}`, {
      method: "POST",
      body: JSON.stringify({ text })
    });

    const list = document.getElementById("comments-list");

    // if the "no comments" message is there, clear it
    if (list.querySelector("div") &&
        list.querySelector("div").style.color === "") {
      list.innerHTML = "";
    }

    // just remove the empty message and append new comment
    const emptyMsg = list.querySelector("div");
    if (emptyMsg && !emptyMsg.id) list.innerHTML = "";

    list.insertAdjacentHTML("beforeend", renderComment(res.comment));

  } catch (err) {
    showToast(err.message, "error");
  } finally {
    input.disabled = false;
    input.focus();
  }
}

// delete a comment
async function deleteComment(commentId) {
  try {
    await apiFetch(`/comments/${commentId}`, { method: "DELETE" });
    const el = document.getElementById(`comment-${commentId}`);
    if (el) el.remove();
    showToast("Comment deleted.", "default");
  } catch (err) {
    showToast(err.message, "error");
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}