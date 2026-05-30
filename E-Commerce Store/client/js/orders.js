document.addEventListener("DOMContentLoaded", () => {
  updateNavbar();

  const user = getUser();
  if (!user) {
    document.getElementById("not-logged-in").style.display = "block";
    return;
  }

  document.getElementById("orders-section").style.display = "block";
  fetchOrders();
});
 
async function fetchOrders() {
  try {
    const orders = await ordersAPI.getMine();

    document.getElementById("orders-spinner").style.display = "none";

    if (!orders.length) {
      document.getElementById("orders-empty").style.display = "block";
      document.getElementById("orders-subtitle").textContent = "No orders placed yet.";
      return;
    }

    document.getElementById("orders-subtitle").textContent =
      `${orders.length} order${orders.length !== 1 ? "s" : ""} placed`;

    renderOrders(orders);
  } catch (err) {
    document.getElementById("orders-spinner").style.display = "none";
    document.getElementById("orders-subtitle").textContent  = "Failed to load orders.";
    showToast(err.message, "error");
  }
}
 
function renderOrders(orders) {
  const list = document.getElementById("orders-list");
  list.style.display = "flex";

  list.innerHTML = orders.map((order) => {
    const date     = new Date(order.createdAt).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric"
    });
    const time     = new Date(order.createdAt).toLocaleTimeString([], {
      hour: "2-digit", minute: "2-digit"
    });
    const badge    = statusBadgeHTML(order.status);
    const preview  = order.items.slice(0, 3);
    const more     = order.items.length - preview.length;

    return `
      <div class="order-card" onclick="openOrderModal(${JSON.stringify(order).replace(/"/g, "&quot;")})">

        <!-- Top row -->
        <div class="order-card-header">
          <div>
            <div class="order-card-id">
              📦 Order #${order.id.slice(-8).toUpperCase()}
            </div>
            <div class="order-card-date">${date} at ${time}</div>
          </div>
          <div style="text-align:right;">
            ${badge}
            <div class="order-card-total">$${order.total.toFixed(2)}</div>
          </div>
        </div>

        <!-- Items preview -->
        <div class="order-items-preview">
          ${preview.map((item) => `
            <div class="order-item-chip">
              <img
                src="${item.image || ''}"
                alt="${item.name}"
                onerror="this.style.display='none'"
              />
              <div class="order-item-chip-info">
                <div class="order-item-chip-name">${item.name}</div>
                <div class="order-item-chip-qty">Qty: ${item.quantity} · $${(item.price * item.quantity).toFixed(2)}</div>
              </div>
            </div>
          `).join("")}
          ${more > 0 ? `<div class="order-more">+${more} more item${more > 1 ? "s" : ""}</div>` : ""}
        </div>

        <div class="order-card-footer">
          <span style="font-size:0.8rem; color:var(--text-muted);">
            ${order.items.reduce((s, i) => s + i.quantity, 0)} item(s)
          </span>
          <span style="font-size:0.8rem; color:var(--primary); font-weight:600;">
            View Details →
          </span>
        </div>

      </div>
    `;
  }).join("");
}
 
function statusBadgeHTML(status) {
  const map = {
    Processing: { bg: "#fef9c3", color: "#854d0e", icon: "🕐" },
    Confirmed:  { bg: "#dcfce7", color: "#166534", icon: "✅" },
    Shipped:    { bg: "#dbeafe", color: "#1e40af", icon: "🚚" },
  };
  const s = map[status] || { bg: "#f1f5f9", color: "#475569", icon: "📋" };
  return `
    <span style="display:inline-block; padding:0.25rem 0.75rem;
                 background:${s.bg}; color:${s.color};
                 border-radius:999px; font-size:0.75rem; font-weight:700;">
      ${s.icon} ${status}
    </span>`;
}
 
function openOrderModal(order) {
  const date = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  });

  document.getElementById("omd-id").textContent    =
    `Order #${order.id.slice(-8).toUpperCase()}`;
  document.getElementById("omd-date").textContent  = date;
  document.getElementById("omd-total").textContent = `$${order.total.toFixed(2)}`;
  document.getElementById("omd-status").innerHTML  = statusBadgeHTML(order.status);

  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  document.getElementById("omd-subtotal").textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById("omd-grand").textContent    = `$${order.total.toFixed(2)}`;

  document.getElementById("omd-items").innerHTML = order.items.map((item) => `
    <div style="display:flex; gap:0.75rem; align-items:center;
                padding:0.75rem; background:var(--bg);
                border-radius:var(--radius-sm);">
      <img
        src="${item.image || ''}"
        alt="${item.name}"
        style="width:56px; height:56px; object-fit:cover;
               border-radius:6px; flex-shrink:0;"
        onerror="this.style.display='none'"
      />
      <div style="flex:1; min-width:0;">
        <div style="font-weight:600; font-size:0.9rem;
                    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
          ${item.name}
        </div>
        <div style="font-size:0.82rem; color:var(--text-muted); margin-top:0.2rem;">
          $${item.price.toFixed(2)} × ${item.quantity}
        </div>
      </div>
      <div style="font-weight:700; color:var(--primary); font-size:0.95rem; flex-shrink:0;">
        $${(item.price * item.quantity).toFixed(2)}
      </div>
    </div>
  `).join("");

  document.getElementById("order-modal-overlay").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeOrderModal(event) {
  if (event.target === document.getElementById("order-modal-overlay")) {
    closeOrderModalDirect();
  }
}

function closeOrderModalDirect() {
  document.getElementById("order-modal-overlay").classList.remove("open");
  document.body.style.overflow = "";
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeOrderModalDirect();
});