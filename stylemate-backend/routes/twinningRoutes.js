const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  createSession,
  joinSession,
  generateTwinning,
  getSessionByCode,
  getMySessions,
  deleteSession,
  updateSessionSettings,
} = require("../controllers/twinningController");

// All twinning routes are protected with authMiddleware
router.use(authMiddleware);

router.post("/create", createSession);
router.post("/join", joinSession);
router.post("/generate", generateTwinning);
router.get("/my-sessions", getMySessions);
router.get("/:sessionCode", getSessionByCode);
router.patch("/:sessionCode/settings", updateSessionSettings);
router.delete("/:sessionCode", authMiddleware, deleteSession);

module.exports = router;
