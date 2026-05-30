//  Redirect if already logged in
(function () {
  if (getUser()) window.location.href = "/index.html";
})();

// Tab switching 
function switchTab(tab) {
  const isLogin = tab === "login";

  document.getElementById("form-login").style.display    = isLogin ? "block" : "none";
  document.getElementById("form-register").style.display = isLogin ? "none"  : "block";

  document.getElementById("tab-login").classList.toggle("active",    isLogin);
  document.getElementById("tab-register").classList.toggle("active", !isLogin);

  hideError();
}

// Error helpers
function showError(msg) {
  const el = document.getElementById("auth-error");
  el.textContent = msg;
  el.style.display = "block";
}

function hideError() {
  const el = document.getElementById("auth-error");
  el.textContent = "";
  el.style.display = "none";
}

// Button loading state 
function setLoading(btnId, loading, defaultText) {
  const btn = document.getElementById(btnId);
  btn.disabled    = loading;
  btn.textContent = loading ? "Please wait…" : defaultText;
}

//LOGIN 
async function handleLogin() {
  hideError();

  const email    = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    showError("Please fill in all fields.");
    return;
  }

  setLoading("btn-login", true, "Login");

  try {
    const data = await authAPI.login({ email, password });
    saveAuth(data.token, data.user);
    showToast("Welcome back, " + data.user.name.split(" ")[0] + "! 👋", "success");
    setTimeout(() => (window.location.href = "/index.html"), 900);
  } catch (err) {
    showError(err.message);
    setLoading("btn-login", false, "Login");
  }
}

// REGISTER 
async function handleRegister() {
  hideError();

  const name     = document.getElementById("reg-name").value.trim();
  const email    = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;
  const confirm  = document.getElementById("reg-confirm").value;

  if (!name || !email || !password || !confirm) {
    showError("Please fill in all fields.");
    return;
  }

  if (password.length < 6) {
    showError("Password must be at least 6 characters.");
    return;
  }

  if (password !== confirm) {
    showError("Passwords do not match.");
    return;
  }

  setLoading("btn-register", true, "Create Account");

  try {
    const data = await authAPI.register({ name, email, password });
    saveAuth(data.token, data.user);
    showToast("Account created! Welcome, " + data.user.name.split(" ")[0] + "! 🎉", "success");
    setTimeout(() => (window.location.href = "/index.html"), 900);
  } catch (err) {
    showError(err.message);
    setLoading("btn-register", false, "Create Account");
  }
}
// Allow Enter key to submit 
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  const loginVisible = document.getElementById("form-login").style.display !== "none";
  if (loginVisible) handleLogin();
  else              handleRegister();
});