const express = require("express");
const router = express.Router();

const {
  saveOutfitHistory,
  getOutfitHistory,
} = require("../controllers/historyController");
const authMiddleware = require("../middleware/authMiddleware");
router.get("/", authMiddleware, getOutfitHistory);
router.post("/", authMiddleware, saveOutfitHistory);

module.exports = router;
