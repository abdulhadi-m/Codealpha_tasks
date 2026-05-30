// if already logged in just go to dashboard
(function () {
  if (getUser()) window.location.href = "/dashboard.html";
})();

function switchTab(tab) {
  const isLogin = tab === "login";
  document.getElementById("form-login").style.display    = isLogin ? "block" : "none";
  document.getElementById("form-register").style.display = isLogin ? "none"  : "block";
  document.getElementById("tab-login").classList.toggle("active",     isLogin);
  document.getElementById("tab-register").classList.toggle("active", !isLogin);
  hideError();
}

function showError(msg) {
  const el = document.getElementById("auth-error");
  el.textContent   = msg;
  el.style.display = "block";
}

function hideError() {
  const el = document.getElementById("auth-error");
  el.textContent   = "";
  el.style.display = "none";
}

function setLoading(btnId, loading, label) {
  const btn       = document.getElementById(btnId);
  btn.disabled    = loading;
  btn.textContent = loading ? "Please wait..." : label;
}

async function handleLogin() {
  hideError();
  const email    = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    showError("Please fill in both fields.");
    return;
  }

  setLoading("btn-login", true, "Login");

  try {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    saveAuth(data.token, data.user);
    window.location.href = "/dashboard.html";
  } catch (err) {
    showError(err.message);
    setLoading("btn-login", false, "Login");
  }
}

async function handleRegister() {
  hideError();
  const username = document.getElementById("reg-username").value.trim();
  const email    = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;
  const confirm  = document.getElementById("reg-confirm").value;

  if (!username || !email || !password || !confirm) {
    showError("All fields are required.");
    return;
  }

  if (password.length < 6) {
    showError("Password needs to be at least 6 characters.");
    return;
  }

  if (password !== confirm) {
    showError("Passwords don't match.");
    return;
  }

  setLoading("btn-register", true, "Create Account");

  try {
    const data = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password })
    });
    saveAuth(data.token, data.user);
    window.location.href = "/dashboard.html";
  } catch (err) {
    showError(err.message);
    setLoading("btn-register", false, "Create Account");
  }
}

// let them hit Enter to submit
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  const loginVisible = document.getElementById("form-login").style.display !== "none";
  if (loginVisible) handleLogin();
  else handleRegister();
});