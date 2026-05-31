const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  addClothingItem,
  getMyWardrobe,
} = require("../controllers/clothingController");
const router = express.Router();
router.post("/addClothes", authMiddleware, addClothingItem);
router.get("/my-wardrobe", authMiddleware, getMyWardrobe);
module.exports = router;
