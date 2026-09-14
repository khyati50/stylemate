const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  recommendFromChat,
  clearChatHistory,
  submitChatFeedback,
  getChatAnalytics,
} = require("../controllers/chatController");

router.post("/recommend", authMiddleware, recommendFromChat);
router.delete("/clear", authMiddleware, clearChatHistory);
router.patch("/feedback/:logId", authMiddleware, submitChatFeedback);
router.get("/analytics", authMiddleware, getChatAnalytics);

module.exports = router;
