const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  recommendOutfit,
  getRecommendationFilters,
} = require("../controllers/recommendationController");
const router = express.Router();
router.get("/filters", authMiddleware, getRecommendationFilters);
router.post("/recommend", authMiddleware, recommendOutfit);
router.post("/", authMiddleware, recommendOutfit);
module.exports = router;
