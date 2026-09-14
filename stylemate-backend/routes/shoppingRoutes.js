const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getShoppingRecommendations,
  markBought,
} = require("../controllers/shoppingController");

router.get("/recommendations", authMiddleware, getShoppingRecommendations);
router.post("/mark-bought", authMiddleware, markBought);

module.exports = router;
