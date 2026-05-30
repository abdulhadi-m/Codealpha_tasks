// redirect to login if not logged in
(function () {
  if (!getUser()) window.location.href = "/auth.html";
})();

document.addEventListener("DOMContentLoaded", () => {
  updateNavbar();
  loadProjects();
});

// fetch and show all projects
async function loadProjects() {
  const container = document.getElementById("projects-container");
  container.innerHTML = '<div class="spinner"></div>';

  try {
    const projects = await apiFetch("/projects");

    if (projects.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">📋</div>
          <h3>No projects yet</h3>
          <p>Create your first project to get started.</p>
        </div>`;
      return;
    }

    container.innerHTML = `<div class="cards-grid">${projects.map(renderProjectCard).join("")}</div>`;

  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">⚠️</div>
        <h3>Failed to load projects</h3>
        <p>${err.message}</p>
      </div>`;
  }
}

// build a single project card
function renderProjectCard(project) {
  const user      = getUser();
  const isOwner   = project.ownerId === user.id;
  const memberCount = project.members.length;

  return `
    <div class="card" onclick="goToProject('${project.id}')">
      <div class="card-title">${escapeHtml(project.name)}</div>
      <div class="card-desc">
        ${project.description ? escapeHtml(project.description) : "No description."}
      </div>
      <div class="card-meta">
        <div class="card-owner">
          👤 ${escapeHtml(project.ownerName)}
          ${isOwner ? '<span style="color:var(--accent); margin-left:0.3rem;">(you)</span>' : ""}
        </div>
        <div>
          👥 ${memberCount} member${memberCount !== 1 ? "s" : ""}
        </div>
      </div>
      ${isOwner ? `
        <div style="margin-top:0.9rem; text-align:right;">
          <button
            class="btn btn-sm btn-outline"
            style="color:var(--danger); border-color:var(--danger);"
            onclick="deleteProject(event, '${project.id}')"
          >
            Delete
          </button>
        </div>` : ""}
    </div>`;
}

// go to the project board
function goToProject(projectId) {
  window.location.href = `/project.html?id=${projectId}`;
}

// create a new project
async function createProject() {
  const name = document.getElementById("project-name").value.trim();
  const desc = document.getElementById("project-desc").value.trim();

  if (!name) {
    showToast("Project name is required.", "error");
    return;
  }

  const btn = document.getElementById("btn-create");
  btn.disabled    = true;
  btn.textContent = "Creating...";

  try {
    await apiFetch("/projects", {
      method: "POST",
      body: JSON.stringify({ name, description: desc })
    });

    closeCreateModal();
    document.getElementById("project-name").value = "";
    document.getElementById("project-desc").value = "";
    showToast("Project created!", "success");
    await loadProjects();

  } catch (err) {
    showToast(err.message, "error");
  } finally {
    btn.disabled    = false;
    btn.textContent = "Create Project";
  }
}

// delete a project
async function deleteProject(event, projectId) {
  // stop the click from opening the project
  event.stopPropagation();

  if (!confirm("Delete this project? This will also delete all its tasks.")) return;

  try {
    await apiFetch(`/projects/${projectId}`, { method: "DELETE" });
    showToast("Project deleted.", "default");
    await loadProjects();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// modal open/close
function openCreateModal() {
  document.getElementById("create-modal").classList.add("open");
}

function closeCreateModal() {
  document.getElementById("create-modal").classList.remove("open");
}

// close modal if clicking the dark overlay
function handleOverlayClick(event) {
  if (event.target === document.getElementById("create-modal")) {
    closeCreateModal();
  }
}

// close modal on escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeCreateModal();
});

// prevent XSS
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}