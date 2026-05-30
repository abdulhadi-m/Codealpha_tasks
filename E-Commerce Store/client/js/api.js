const BASE_URL = window.location.hostname === "localhost"
  ? "http://localhost:5000/api"
  : "/api";

// Token helpers 
const getToken  = ()        => localStorage.getItem("token");
const getUser   = ()        => JSON.parse(localStorage.getItem("user") || "null");
const saveAuth  = (token, user) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};
const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};
// core fetch wraper  
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed.");
  return data;
}

//  Auth API  
const authAPI = {
  register: (payload) =>
    apiFetch("/users/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) =>
    apiFetch("/users/login", { method: "POST", body: JSON.stringify(payload) }),
};

//  Products API  
const productsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/products${query ? "?" + query : ""}`);
  },
  getOne: (id) => apiFetch(`/products/${id}`),
};

// Orders API 
const ordersAPI = {
  place:  (payload) =>
    apiFetch("/orders", { method: "POST", body: JSON.stringify(payload) }),
  getMine: () => apiFetch("/orders/my"),
};

//  Toast utility  
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

// navbar: update cart badge + auth link 
function updateNavbar() {
  const badge = document.getElementById("cart-badge");
  const authLink = document.getElementById("auth-link");
  const userGreet = document.getElementById("user-greet");

  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const totalQty = cart.reduce((s, i) => s + i.quantity, 0);

  if (badge) badge.textContent = totalQty || "";

  const user = getUser();
  if (authLink) authLink.textContent = user ? "Logout" : "Login";
  if (userGreet) userGreet.textContent = user ? `Hi, ${user.name.split(" ")[0]}` : "";

  if (authLink) {
    authLink.onclick = (e) => {
      if (user) {
        e.preventDefault();
        clearAuth();
        showToast("Logged out.", "default");
        setTimeout(() => window.location.href = "/auth.html", 800);
      }
    };
  }
}