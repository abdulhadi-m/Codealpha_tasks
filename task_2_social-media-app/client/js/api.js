const BASE_URL = window.location.hostname === "localhost"
  ? "http://localhost:5000/api"
  : "/api";

// auth helpers
const getToken  = ()             => localStorage.getItem("token");
const getUser   = ()             => JSON.parse(localStorage.getItem("user") || "null");
const saveAuth  = (token, user)  => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};
const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// core fetch wrapper
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}

// api modules
const authAPI = {
  register: (payload) => apiFetch("/users/register", { method: "POST", body: JSON.stringify(payload) }),
  login:    (payload) => apiFetch("/users/login",    { method: "POST", body: JSON.stringify(payload) }),
};

const usersAPI = {
  getProfile:     (id)  => apiFetch(`/users/${id}`),
  getFollows:     (id)  => apiFetch(`/users/${id}/follows`),
  toggleFollow:   (id)  => apiFetch(`/users/${id}/follow`,     { method: "POST" }),
  updateBio:      (bio) => apiFetch("/users/update/bio",        { method: "PUT", body: JSON.stringify({ bio }) }),
  isFollowing: (id, targetId) => apiFetch(`/users/${id}/is-following/${targetId}`), // added
};

const postsAPI = {
  getFeed:    ()       => apiFetch("/posts"),
  getUserPosts: (id)   => apiFetch(`/posts/user/${id}`),
  create:     (content)=> apiFetch("/posts", { method: "POST", body: JSON.stringify({ content }) }),
  like:       (id)     => apiFetch(`/posts/${id}/like`, { method: "POST" }),
  delete:     (id)     => apiFetch(`/posts/${id}`,      { method: "DELETE" }),
};

const commentsAPI = {
  get:    (postId)          => apiFetch(`/comments/${postId}`),
  add:    (postId, content) => apiFetch(`/comments/${postId}`, { method: "POST", body: JSON.stringify({ content }) }),
  delete: (commentId)       => apiFetch(`/comments/${commentId}`, { method: "DELETE" }),
};

// toast notification
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

// relative time helper  e.g. "2 hours ago"
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// update navbar based on login state
function updateNavbar() {
  const user      = getUser();
  const authLink  = document.getElementById("nav-auth");
  const profileEl = document.getElementById("nav-profile");
  const avatarEl  = document.getElementById("nav-avatar");

  if (user) {
    if (authLink)  authLink.textContent = "Logout";
    if (profileEl) profileEl.href = `/profile.html?id=${user.id}`;
    if (avatarEl)  avatarEl.src   = user.avatar || `https://api.dicebear.com/7.x/thumbs/svg?seed=${user.username}`;
    if (authLink) {
      authLink.onclick = (e) => {
        e.preventDefault();
        clearAuth();
        window.location.href = "/auth.html";
      };
    }
  } else {
    if (authLink)  authLink.textContent = "Login";
    if (profileEl) profileEl.style.display = "none";
    if (authLink)  authLink.href = "/auth.html";
  }
}