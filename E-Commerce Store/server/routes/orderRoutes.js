const express = require("express");
const router = express.Router();
const { readJSON, writeJSON } = require("../config/db");
const verifyToken = require("../middleware/auth");
 
router.post("/", verifyToken, (req, res) => {
  try {
    const { items, total } = req.body;

    if (!items || items.length === 0)
      return res.status(400).json({ message: "Cart is empty." });

    const orders = readJSON("orders.json");

    const newOrder = {
      id: Date.now().toString(),
      userId: req.user.id,
      userName: req.user.name,
      items,
      total: parseFloat(total.toFixed(2)),
      status: "Processing",
      createdAt: new Date().toISOString(),
    };

    orders.push(newOrder);
    writeJSON("orders.json", orders);
 
    setTimeout(() => {
      const all = readJSON("orders.json");
      const idx = all.findIndex((o) => o.id === newOrder.id);
      if (idx !== -1) {
        all[idx].status = "Confirmed";
        writeJSON("orders.json", all);
        console.log(`📦 Order ${newOrder.id} → Confirmed`);
      }
    }, 5000);

    setTimeout(() => {
      const all = readJSON("orders.json");
      const idx = all.findIndex((o) => o.id === newOrder.id);
      if (idx !== -1) {
        all[idx].status = "Shipped";
        writeJSON("orders.json", all);
        console.log(`🚚 Order ${newOrder.id} → Shipped`);
      }
    }, 10000);

    res.status(201).json({
      message: "Order placed successfully!",
      order: newOrder,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});
 
router.get("/my", verifyToken, (req, res) => {
  try {
    const orders = readJSON("orders.json");
    const userOrders = orders
      .filter((o) => o.userId === req.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(userOrders);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});
 
router.get("/:id", verifyToken, (req, res) => {
  try {
    const orders = readJSON("orders.json");
    const order = orders.find(
      (o) => o.id === req.params.id && o.userId === req.user.id
    );
    if (!order)
      return res.status(404).json({ message: "Order not found." });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

module.exports = router;