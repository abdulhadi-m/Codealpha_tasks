let profileUser  = null;  // the user whose profile we're viewing
let isOwnProfile = false;
let isFollowing  = false;

document.addEventListener("DOMContentLoaded", async () => {
  currentUser = getUser();
  updateNavbar();

  // show nav avatar if logged in
  const navAvatar = document.getElementById("nav-avatar");
  if (currentUser && navAvatar) {
    navAvatar.style.display = "block";
    navAvatar.src = currentUser.avatar ||
      `https://api.dicebear.com/7.x/thumbs/svg?seed=${currentUser.username}`;
  }

  // get the ?id= from the URL
  const params   = new URLSearchParams(window.location.search);
  const targetId = params.get("id");

  // if no id in URL, show own profile or redirect to login
  if (!targetId) {
    if (currentUser) {
      window.location.href = `/profile.html?id=${currentUser.id}`;
    } else {
      window.location.href = "/auth.html";
    }
    return;
  }

  await loadProfile(targetId);
});

async function loadProfile(userId) {
  try { 
    
    const userInfo   = await usersAPI.getProfile(userId);
    const followData = await usersAPI.getFollows(userId);
    const user       = userInfo;

    profileUser  = user;
    isOwnProfile = currentUser && currentUser.id === user.id;

    renderProfileCard(user, followData);
    await loadUserPosts(user.id);

    document.getElementById("profile-loading").style.display  = "none";
    document.getElementById("profile-content").style.display  = "block";

  } catch (err) {
    document.getElementById("profile-loading").style.display = "none";
    document.getElementById("profile-error").style.display   = "block";
  }
}

function renderProfileCard(user, followData) {
  const avatar = user.avatar ||
    `https://api.dicebear.com/7.x/thumbs/svg?seed=${user.username}`;

  document.getElementById("profile-avatar").src       = avatar;
  document.getElementById("profile-username").textContent = `@${user.username}`;
  document.getElementById("profile-bio").textContent  = user.bio || "No bio yet.";
  document.getElementById("stat-followers").textContent = followData.followers;
  document.getElementById("stat-following").textContent = followData.following;
  document.title = `@${user.username} — SocialSpark`;

  if (isOwnProfile) {
    // show edit bio button, hide follow button
    document.getElementById("btn-edit-bio").style.display = "inline-block";
    document.getElementById("btn-follow").style.display   = "none";
    document.getElementById("bio-input").value = user.bio || "";
  } else if (currentUser) {
    // show follow button for other users
    document.getElementById("btn-follow").style.display   = "inline-block";
    document.getElementById("btn-edit-bio").style.display = "none";
    checkIfFollowing(user.id);
  }
}

// check if current user already follows this profile
async function checkIfFollowing(targetId) {
  try {
    const res   = await usersAPI.isFollowing(currentUser.id, targetId);
    isFollowing = res.following;
    updateFollowButton();
  } catch (err) {
    isFollowing = false;
    updateFollowButton();
  }
}

function updateFollowButton() {
  const btn = document.getElementById("btn-follow");
  if (isFollowing) {
    btn.textContent = "Following";
    btn.classList.add("following");
  } else {
    btn.textContent = "Follow";
    btn.classList.remove("following");
  }
}

async function toggleFollow() {
  if (!currentUser) {
    showToast("Login to follow users.", "error");
    window.location.href = "/auth.html";
    return;
  }

  const btn = document.getElementById("btn-follow");
  btn.disabled = true;

  try {
    const res   = await usersAPI.toggleFollow(profileUser.id);
    isFollowing = res.following;
    updateFollowButton();

    // update follower count on screen
    const followerEl  = document.getElementById("stat-followers");
    const current     = parseInt(followerEl.textContent || "0");
    followerEl.textContent = isFollowing ? current + 1 : Math.max(0, current - 1);

    showToast(isFollowing ? `Following @${profileUser.username}` : "Unfollowed.", "success");
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    btn.disabled = false;
  }
}

// load posts made by this user
async function loadUserPosts(userId) {
  const container = document.getElementById("profile-posts");

  try {
    const posts = await postsAPI.getUserPosts(userId);

    // update post count stat
    document.getElementById("stat-posts").textContent = posts.length;

    if (posts.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">📝</div>
          <h3>No posts yet</h3>
          <p>${isOwnProfile ? "Share something!" : "Nothing posted yet."}</p>
        </div>`;
      return;
    }

    container.innerHTML = posts.map((p) => renderPost(p)).join("");

  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">⚠️</div>
        <h3>Couldn't load posts</h3>
        <p>${err.message}</p>
      </div>`;
  }
}

// toggle bio edit box
function toggleBioEdit() {
  const box = document.getElementById("bio-edit-box");
  const isVisible = box.style.display === "block";
  box.style.display = isVisible ? "none" : "block";
}

// save updated bio
async function saveBio() {
  const bio = document.getElementById("bio-input").value.trim();

  try {
    await usersAPI.updateBio(bio);
    document.getElementById("profile-bio").textContent = bio || "No bio yet.";
    document.getElementById("bio-edit-box").style.display = "none";
    showToast("Bio updated!", "success");
  } catch (err) {
    showToast(err.message, "error");
  }
}