const express = require("express");
const router = express.Router();

const {
  saveOutfitFeedback,
  getOutfitFeedback,
} = require("../controllers/feedbackController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, saveOutfitFeedback);

router.get("/", authMiddleware, getOutfitFeedback);

module.exports = router;
