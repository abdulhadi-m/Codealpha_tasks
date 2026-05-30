async function handleCheckout() {
  const user = getUser();
  if (!user) {
    showToast("Please login to place an order.", "error");
    setTimeout(() => (window.location.href = "/auth.html"), 1000);
    return;
  }

  if (!cart || cart.length === 0) {
    showToast("Your cart is empty.", "error");
    return;
  }

  const btn = document.getElementById("btn-checkout");
  btn.disabled     = true;
  btn.textContent  = "Placing order…";

  try {
    const payload = {
      items: cart.map((i) => ({
        productId: i.id,
        name:      i.name,
        price:     i.price,
        quantity:  i.quantity,
        image:     i.image,
      })),
      total: window._orderTotal,
    };

    const data = await ordersAPI.place(payload);

    // Clear cart
    localStorage.setItem("cart", "[]");
    updateNavbar();

    // Show success UI
    showOrderSuccess(data.order);

  } catch (err) {
    showToast(err.message || "Order failed. Try again.", "error");
    btn.disabled    = false;
    btn.textContent = "✅ Place Order";
  }
} 
function showOrderSuccess(order) {
  document.getElementById("cart-section").style.display  = "none";
  document.getElementById("order-success").style.display = "block";

  document.getElementById("order-id").textContent =
    `#${order.id.slice(-8).toUpperCase()}`;
  document.getElementById("order-total-disp").textContent =
    `$${order.total.toFixed(2)}`;
  document.getElementById("success-msg").textContent =
    `Thank you, ${getUser().name.split(" ")[0]}! Your order has been received.`;
 
  simulateOrderStatus(order.id);
}
 
function simulateOrderStatus(orderId) {
  const badge    = document.getElementById("order-status-badge");
  const timeline = document.getElementById("status-timeline");

  const steps = [
    { status: "Processing", icon: "🕐", delay: 0,     color: "#854d0e", bg: "#fef9c3" },
    { status: "Confirmed",  icon: "✅", delay: 5000,  color: "#166534", bg: "#dcfce7" },
    { status: "Shipped",    icon: "🚚", delay: 10000, color: "#1e40af", bg: "#dbeafe" },
  ];
 
  addTimelineStep(timeline, steps[0]);
  updateBadge(badge, steps[0]); 
  steps.slice(1).forEach((step) => {
    setTimeout(async () => {
      addTimelineStep(timeline, step);
      updateBadge(badge, step); 
      try {
        await ordersAPI.getMine();
      } catch (_) {}

    }, step.delay);
  });
}

// timeline helper
function addTimelineStep(container, step) {
  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });

  const el = document.createElement("div");
  el.style.cssText = `
    display:flex; align-items:center; gap:0.75rem;
    padding:0.6rem 0.9rem;
    background:${step.bg};
    border-radius:8px;
    font-size:0.85rem;
    animation: slideUp 0.3s ease;
  `;
  el.innerHTML = `
    <span style="font-size:1.1rem;">${step.icon}</span>
    <div>
      <div style="font-weight:600; color:${step.color};">${step.status}</div>
      <div style="color:var(--text-muted); font-size:0.78rem;">${time}</div>
    </div>
  `;
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
}

// Badge helper 
function updateBadge(badge, step) {
  badge.textContent        = step.status;
  badge.style.background   = step.bg;
  badge.style.color        = step.color;
}