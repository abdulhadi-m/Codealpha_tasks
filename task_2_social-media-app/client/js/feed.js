let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
  currentUser = getUser();
  updateNavbar();
  setupUI();
  loadFeed();
});

function setupUI() {
  const createBox  = document.getElementById("create-post-box");
  const guestNudge = document.getElementById("guest-nudge");
  const navAvatar  = document.getElementById("nav-avatar");

  if (currentUser) {
    createBox.style.display  = "block";
    guestNudge.style.display = "none";
    navAvatar.style.display  = "block";

    // set avatar in create box
    const avatar = document.getElementById("create-avatar");
    avatar.src = currentUser.avatar ||
      `https://api.dicebear.com/7.x/thumbs/svg?seed=${currentUser.username}`;
  } else {
    createBox.style.display  = "none";
    guestNudge.style.display = "block";
  }
}

// char counter for the post textarea
function handleCharCount() {
  const input     = document.getElementById("post-input");
  const counter   = document.getElementById("char-count");
  const btn       = document.getElementById("btn-post");
  const len       = input.value.length;

  counter.textContent = `${len} / 500`;
  counter.className   = "char-count";

  if (len > 450) counter.classList.add("warn");
  if (len > 500) counter.classList.add("over");

  btn.disabled = len === 0 || len > 500;
}

// load all posts
async function loadFeed() {
  const feed = document.getElementById("feed");
  feed.innerHTML = '<div class="spinner"></div>';

  console.log("loading feed...") 
  
  try {
    const posts = await postsAPI.getFeed();

    if (posts.length === 0) {
      feed.innerHTML = `
        <div class="empty-state">
          <div class="icon">📭</div>
          <h3>No posts yet</h3>
          <p>Be the first to post something!</p>
        </div>`;
      return;
    }

    feed.innerHTML = posts.map((p) => renderPost(p)).join("");
  } catch (err) {
    feed.innerHTML = `
      <div class="empty-state">
        <div class="icon">⚠️</div>
        <h3>Couldn't load feed</h3>
        <p>${err.message}</p>
      </div>`;
  }
}

// build post card HTML
function renderPost(post) {
  const user      = getUser();
  const isOwner   = user && user.id === post.userId;
  const liked     = user && post.likes.includes(user.id);
  const likeCount = post.likes.length;
  const avatar    = `https://api.dicebear.com/7.x/thumbs/svg?seed=${post.username}`;

  return `
    <div class="post-card" id="post-${post.id}">

      <div class="post-header">
        <img
          src="${avatar}"
          alt="${post.username}"
          class="post-avatar"
          onclick="goToProfile('${post.userId}')"
        />
        <div class="post-meta">
          <div class="post-username" onclick="goToProfile('${post.userId}')">
            @${post.username}
          </div>
          <div class="post-time">${timeAgo(post.createdAt)}</div>
        </div>
        ${isOwner ? `
          <button class="btn-delete-post" onclick="deletePost('${post.id}')">
            Delete
          </button>` : ""}
      </div>

      <div class="post-content">${escapeHTML(post.content)}</div>

      <div class="post-actions">
        <button
          class="action-btn ${liked ? "liked" : ""}"
          id="like-btn-${post.id}"
          onclick="toggleLike('${post.id}')"
        >
          <span class="icon">${liked ? "❤️" : "🤍"}</span>
          <span id="like-count-${post.id}">${likeCount}</span>
        </button>

        <button class="action-btn" onclick="toggleComments('${post.id}')">
          <span class="icon">💬</span>
          <span id="comment-count-${post.id}">${post.commentCount || 0}</span>
        </button>
      </div>

      <!-- comments section (hidden by default) -->
      <div class="comments-section" id="comments-${post.id}"></div>

    </div>
  `;
}

// create a new post
async function createPost() {
  const input   = document.getElementById("post-input");
  const content = input.value.trim();

  if (!content) return;

  const btn     = document.getElementById("btn-post");
  btn.disabled  = true;
  btn.textContent = "Posting…";

  try {
    await postsAPI.create(content);
    input.value = "";
    document.getElementById("char-count").textContent = "0 / 500";
    await loadFeed();
    showToast("Post shared!", "success");
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    btn.disabled    = false;
    btn.textContent = "Post";
  }
}

// like or unlike
async function toggleLike(postId) {
  if (!currentUser) {
    showToast("Login to like posts.", "error"); return;
  }

  try {
    const res       = await postsAPI.like(postId);
    const btn       = document.getElementById(`like-btn-${postId}`);
    const countEl   = document.getElementById(`like-count-${postId}`);

    countEl.textContent = res.likeCount;

    if (res.liked) {
      btn.classList.add("liked");
      btn.querySelector(".icon").textContent = "❤️";
    } else {
      btn.classList.remove("liked");
      btn.querySelector(".icon").textContent = "🤍";
    }
  } catch (err) {
    showToast(err.message, "error");
  }
}

// delete a post
async function deletePost(postId) {
  if (!confirm("Delete this post?")) return;

  try {
    await postsAPI.delete(postId);
    document.getElementById(`post-${postId}`).remove();
    showToast("Post deleted.", "default");
  } catch (err) {
    showToast(err.message, "error");
  }
}

// navigate to a user's profile
function goToProfile(userId) {
  window.location.href = `/profile.html?id=${userId}`;
}

function goToMyProfile() {
  if (currentUser) goToProfile(currentUser.id);
}

// escape HTML to prevent XSS
function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}