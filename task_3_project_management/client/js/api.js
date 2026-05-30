// base url - switches between local and deployed
const BASE_URL = window.location.hostname === "localhost"
  ? "http://localhost:8081/api"
  : "/api";

// grab token from storage
function getToken() {
  return localStorage.getItem("token");
}

// grab logged in user object
function getUser() {
  return JSON.parse(localStorage.getItem("user") || "null");
}

// save after login/register
function saveAuth(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

// wipe on logout
function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

// main fetch wrapper - attaches token automatically
async function apiFetch(endpoint, options = {}) {
  const token = getToken();

  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Something went wrong.");

  return data;
}

// show a little toast message at the bottom
function showToast(message, type = "default") {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast ${type}`;
  void toast.offsetWidth;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// makes "2 hours ago" type strings
function timeAgo(dateStr) {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// update the navbar username display
function updateNavbar() {
  const user = getUser();
  const navUser   = document.getElementById("nav-user");
  const navLogout = document.getElementById("nav-logout");

  if (user) {
    if (navUser)   navUser.textContent = `👤 ${user.username}`;
    if (navLogout) {
      navLogout.style.display = "inline-block";
      navLogout.onclick = () => {
        clearAuth();
        window.location.href = "/auth.html";
      };
    }
  } else {
    if (navUser)   navUser.textContent = "";
    if (navLogout) navLogout.style.display = "none";
  }
}