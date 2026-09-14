const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getUserPreferences,
  updateUserPreferences,
} = require("../controllers/preferenceController");

router.use(authMiddleware);

router.get("/", getUserPreferences);
router.put("/", updateUserPreferences);

module.exports = router;
