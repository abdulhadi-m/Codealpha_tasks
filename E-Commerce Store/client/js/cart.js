let cart = [];
// init  
document.addEventListener("DOMContentLoaded", () => {
  updateNavbar();
  loadCart();
});

// load & render cart  
function loadCart() {
  cart = JSON.parse(localStorage.getItem("cart") || "[]");

  const emptyEl  = document.getElementById("empty-cart");
  const layoutEl = document.getElementById("cart-layout");
  const subtitle = document.getElementById("cart-subtitle");

  if (cart.length === 0) {
    emptyEl.style.display  = "block";
    layoutEl.style.display = "none";
    subtitle.textContent   = "";
    return;
  }

  const totalQty = cart.reduce((s, i) => s + i.quantity, 0);
  subtitle.textContent   = `${totalQty} item${totalQty !== 1 ? "s" : ""} in your cart`;
  emptyEl.style.display  = "none";
  layoutEl.style.display = "grid";

  renderCartItems();
  renderSummary();
  renderCheckoutAccess();
}

// render cart item rows 
function renderCartItems() {
  const list = document.getElementById("cart-items-list");

  list.innerHTML = cart.map((item) => `
    <div class="cart-item" id="cart-item-${item.id}">
      <img
        src="${item.image}"
        alt="${item.name}"
        onerror="this.src='https://placehold.co/80x80?text=?'"
      />
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">
          $${(item.price * item.quantity).toFixed(2)}
          <span style="font-weight:400; color:var(--text-muted); font-size:0.8rem;">
            ($${item.price.toFixed(2)} each)
          </span>
        </div>
        <div class="cart-item-controls">
          <button class="cart-qty-btn" onclick="updateQty('${item.id}', -1)">−</button>
          <span class="cart-qty">${item.quantity}</span>
          <button class="cart-qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
          <span style="font-size:0.8rem; color:var(--text-muted); margin-left:0.25rem;">
            (max ${item.stock})
          </span>
        </div>
      </div>
      <button class="btn-remove" onclick="removeItem('${item.id}')" title="Remove">✕</button>
    </div>
  `).join("");
}

//render order summary 
function renderSummary() {
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalQty = cart.reduce((s, i) => s + i.quantity, 0);
  const shipping  = subtotal > 0 && subtotal < 50 ? 4.99 : 0;
  const tax       = subtotal * 0.08;
  const total     = subtotal + shipping + tax;

  document.getElementById("sum-qty").textContent      = totalQty;
  document.getElementById("sum-subtotal").textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById("sum-shipping").textContent = shipping === 0
    ? "FREE" : `$${shipping.toFixed(2)}`;
  document.getElementById("sum-tax").textContent      = `$${tax.toFixed(2)}`;
  document.getElementById("sum-total").textContent    = `$${total.toFixed(2)}`;
 
  window._orderTotal = total;
}

//Sshow/hide checkout button based on auth 
function renderCheckoutAccess() {
  const user        = getUser();
  const notice      = document.getElementById("login-notice");
  const btnCheckout = document.getElementById("btn-checkout");

  if (user) {
    notice.style.display      = "none";
    btnCheckout.style.display = "block";
    btnCheckout.disabled      = false;
  } else {
    notice.style.display      = "block";
    btnCheckout.style.display = "none";
  }
}

//update item quantity  
function updateQty(productId, delta) {
  const item = cart.find((i) => i.id === productId);
  if (!item) return;

  const newQty = item.quantity + delta;

  if (newQty < 1) {
    removeItem(productId);
    return;
  }

  if (newQty > item.stock) {
    showToast(`Max stock is ${item.stock}.`, "error");
    return;
  }

  item.quantity = newQty;
  saveCart();
  loadCart();
}

//remove item 
function removeItem(productId) {
  cart = cart.filter((i) => i.id !== productId);
  saveCart();
  showToast("Item removed.", "default");
  loadCart();
}

//clear entire cart 
function clearCart() {
  if (cart.length === 0) return;
  if (!confirm("Clear all items from your cart?")) return;
  cart = [];
  saveCart();
  loadCart();
  showToast("Cart cleared.", "default");
}

// persist to localStorage  
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateNavbar();
}