const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { recommendOutfit } = require("../controllers/recommendationController");
const router = express.Router();
router.post("/recommend", authMiddleware, recommendOutfit);
module.exports = router;
