// toggle comment section open/closed
async function toggleComments(postId) {
  const section = document.getElementById(`comments-${postId}`);
  const isOpen  = section.classList.contains("open");

  if (isOpen) {
    section.classList.remove("open");
    return;
  }

  section.classList.add("open");  

    // check if comments already loaded so we dont fetch twice
    const alreadyLoaded = section.dataset.loaded;
    if (!alreadyLoaded) {
  await loadComments(postId);
}
}

// fetch and render comments for a post
async function loadComments(postId) {
  const section = document.getElementById(`comments-${postId}`);
  section.innerHTML = '<div class="spinner" style="padding:1rem;"></div>';

  try {
    const comments = await commentsAPI.get(postId);
    section.dataset.loaded = "true";
    renderComments(postId, comments);
  } catch (err) {
    section.innerHTML = `<p style="color:#ef4444; font-size:0.85rem;">${err.message}</p>`;
  }
}

// build the comment section HTML
function renderComments(postId, comments) {
  const section = document.getElementById(`comments-${postId}`);
  const user    = getUser();

  // comment input row (only if logged in)
  const inputRow = user ? `
    <div class="comment-input-row">
      <img
        src="${user.avatar || `https://api.dicebear.com/7.x/thumbs/svg?seed=${user.username}`}"
        alt="you"
      />
      <input
        type="text"
        class="comment-input"
        id="comment-input-${postId}"
        placeholder="Write a comment…"
        onkeydown="handleCommentKey(event, '${postId}')"
      />
      <button class="btn-send-comment" onclick="submitComment('${postId}')">Send</button>
    </div>` : `
    <p style="font-size:0.825rem; color:var(--text-muted); margin-bottom:0.75rem;">
      <a href="/auth.html" style="color:var(--primary); font-weight:600;">Login</a>
      to comment.
    </p>`;

  // individual comment items
  const commentItems = comments.length === 0
    ? `<p style="font-size:0.825rem; color:var(--text-muted); margin-bottom:0.5rem;">
         No comments yet.
       </p>`
    : comments.map((c) => renderCommentItem(c)).join("");

  section.innerHTML = inputRow + `<div id="comment-list-${postId}">${commentItems}</div>`;
}

// single comment HTML
function renderCommentItem(comment) {
  const user   = getUser();
  const avatar = `https://api.dicebear.com/7.x/thumbs/svg?seed=${comment.username}`;
  const isOwner = user && user.id === comment.userId;

  return `
    <div class="comment-item" id="comment-${comment.id}">
      <img src="${avatar}" alt="${comment.username}" />
      <div class="comment-bubble">
        <div class="comment-username" onclick="goToProfile('${comment.userId}')">
          @${comment.username}
        </div>
        <div class="comment-text">${escapeHTML(comment.content)}</div>
        <div class="comment-time">
          ${timeAgo(comment.createdAt)}
          ${isOwner ? `
            <button
              onclick="deleteComment('${comment.id}', '${comment.postId}')"
              style="margin-left:0.5rem; background:none; border:none;
                     color:#ef4444; cursor:pointer; font-size:0.75rem;"
            >delete</button>` : ""}
        </div>
      </div>
    </div>`;
}

// submit a new comment
async function submitComment(postId) {
  const input   = document.getElementById(`comment-input-${postId}`);
  const content = input.value.trim();
  if (!content) return;

  input.value    = "";
  input.disabled = true;

  try {
    const res     = await commentsAPI.add(postId, content);
    const list    = document.getElementById(`comment-list-${postId}`);

    // remove "no comments" message if it's there
    if (list.querySelector("p")) list.innerHTML = "";

    list.insertAdjacentHTML("beforeend", renderCommentItem(res.comment));

    // update comment count in post action bar
    const countEl = document.getElementById(`comment-count-${postId}`);
    if (countEl) countEl.textContent = parseInt(countEl.textContent || "0") + 1;

  } catch (err) {
    showToast(err.message, "error");
  } finally {
    input.disabled = false;
    input.focus();
  }
}

// press Enter to send comment
function handleCommentKey(event, postId) {
  if (event.key === "Enter") submitComment(postId);
}

// delete a comment
async function deleteComment(commentId, postId) {
  try {
    await commentsAPI.delete(commentId);
    document.getElementById(`comment-${commentId}`).remove();

    const countEl = document.getElementById(`comment-count-${postId}`);
    if (countEl) {
      const current = parseInt(countEl.textContent || "0");
      countEl.textContent = Math.max(0, current - 1);
    }
  } catch (err) {
    showToast(err.message, "error");
  }
}