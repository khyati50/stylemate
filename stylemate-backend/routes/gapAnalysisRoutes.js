const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { getGapAnalysis } = require("../controllers/gapAnalysisController");
router.get("/", authMiddleware, getGapAnalysis);
module.exports = router;
