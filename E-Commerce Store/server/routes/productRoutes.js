const express = require("express");
const router = express.Router();
const { readJSON } = require("../config/db");
 
router.get("/", (req, res) => {
  try {
    const products = readJSON("products.json");
    const { category, search, sort } = req.query;

    let result = [...products];

    // Filter by category
    if (category && category !== "All") {
      result = result.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Search by name or description
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }
 
    if (sort === "price-asc")  result.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") result.sort((a, b) => b.price - a.price);
    if (sort === "rating")     result.sort((a, b) => b.rating - a.rating);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});
 
router.get("/:id", (req, res) => {
  try {
    const products = readJSON("products.json");
    const product = products.find((p) => p.id === req.params.id);
    if (!product)
      return res.status(404).json({ message: "Product not found." });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

module.exports = router;