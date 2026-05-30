let allProducts   = [];
let currentProduct = null;
let modalQty       = 1;
 
document.addEventListener("DOMContentLoaded", () => {
  updateNavbar();
  loadProducts();
});
 
async function loadProducts(params = {}) {
  const grid = document.getElementById("product-grid");
  grid.innerHTML = '<div class="spinner"></div>';

  try {
    allProducts = await productsAPI.getAll(params);
    renderGrid(allProducts);
  } catch (err) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="icon">⚠️</div>
        <h3>Failed to load products</h3>
        <p>${err.message}</p>
      </div>`;
  }
} 
function renderGrid(products) {
  const grid = document.getElementById("product-grid");

  if (products.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="icon">🔍</div>
        <h3>No products found</h3>
        <p>Try a different search or category.</p>
      </div>`;
    return;
  }

  grid.innerHTML = products.map((p) => `
    <div class="product-card" onclick="openModal('${p.id}')">
      <img
        src="${p.image}"
        alt="${p.name}"
        onerror="this.src='https://placehold.co/400x200?text=No+Image'"
      />
      <div class="product-info">
        <div class="product-category">${p.category}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-rating">${renderStars(p.rating)} (${p.rating})</div>
        <div class="product-price">$${p.price.toFixed(2)}</div>
      </div>
      <button
        class="btn-add-cart"
        onclick="quickAdd(event, '${p.id}')"
      >+ Add to Cart</button>
    </div>
  `).join("");
}
  
function renderStars(rating) {
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    stars += i <= Math.round(rating) ? "★" : "☆";
  }
  return stars;
}
let searchTimer = null;

function handleSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(applyFilters, 300);
}

function handleFilter() {
  applyFilters();
}

function applyFilters() {
  const search   = document.getElementById("search-input").value.trim();
  const category = document.getElementById("category-filter").value;
  const sort     = document.getElementById("sort-filter").value; 
  const params = {};
  if (search)             params.search   = search;
  if (category !== "All") params.category = category;
  if (sort)               params.sort     = sort;

  loadProducts(params);
}
 
function quickAdd(event, productId) {
  event.stopPropagation(); 
  const product = allProducts.find((p) => p.id === productId);
  if (!product) return;
  addToCart(product, 1);
  showToast(`"${product.name}" added to cart! 🛒`, "success");
}
 
function openModal(productId) {
  const product = allProducts.find((p) => p.id === productId);
  if (!product) return;

  currentProduct = product;
  modalQty       = 1;

  document.getElementById("modal-img").src          = product.image;
  document.getElementById("modal-img").alt          = product.name;
  document.getElementById("modal-name").textContent = product.name;
  document.getElementById("modal-price").textContent = `$${product.price.toFixed(2)}`;
  document.getElementById("modal-desc").textContent  = product.description;
  document.getElementById("modal-rating").textContent = product.rating;
  document.getElementById("modal-stock").textContent  = product.stock;
  document.getElementById("modal-category").textContent     = product.category;
  document.getElementById("modal-category-tag").textContent = product.category;
  document.getElementById("modal-qty").textContent   = modalQty;

  document.getElementById("modal-overlay").classList.add("open");
  document.body.style.overflow = "hidden";
} 
function closeModal(event) { 
  if (event.target === document.getElementById("modal-overlay")) {
    closeModalDirect();
  }
}

function closeModalDirect() {
  document.getElementById("modal-overlay").classList.remove("open");
  document.body.style.overflow = "";
  currentProduct = null;
  modalQty = 1;
}
 
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModalDirect();
});
 
function changeQty(delta) {
  if (!currentProduct) return;
  modalQty = Math.max(1, Math.min(currentProduct.stock, modalQty + delta));
  document.getElementById("modal-qty").textContent = modalQty;
}
 
function addToCartFromModal() {
  if (!currentProduct) return;
  addToCart(currentProduct, modalQty);
  showToast(`${modalQty}× "${currentProduct.name}" added to cart! 🛒`, "success");
  closeModalDirect();
}
 
function addToCart(product, qty) {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");

  const existing = cart.find((i) => i.id === product.id);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + qty, product.stock);
  } else {
    cart.push({
      id:       product.id,
      name:     product.name,
      price:    product.price,
      image:    product.image,
      quantity: qty,
      stock:    product.stock,
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateNavbar();
}