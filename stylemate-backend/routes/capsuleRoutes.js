const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  generateCapsule,
  rerollSlot,
  swapPiece,
  saveTrip,
  getMyTrips,
  deleteTrip,
} = require("../controllers/capsuleController");

const router = express.Router();

router.post("/generate", authMiddleware, generateCapsule);
router.post("/plan", authMiddleware, generateCapsule);
router.post("/reroll", authMiddleware, rerollSlot);
router.post("/swap-piece", authMiddleware, swapPiece);
router.post("/save", authMiddleware, saveTrip);
router.get("/my-trips", authMiddleware, getMyTrips);
router.get("/trips", authMiddleware, getMyTrips);
router.delete("/:id", authMiddleware, deleteTrip);

module.exports = router;
