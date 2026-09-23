const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const {
  addClothingItem,
  getMyWardrobe,
  deleteClothingItem,
  updateClothingItem,
  analyzeClothingImage,
} = require("../controllers/clothingController");
const router = express.Router();
router.post(
  "/addClothes",
  authMiddleware,
  upload.single("image"),
  addClothingItem,
);
router.post(
  "/analyze-image",
  authMiddleware,
  upload.single("image"),
  analyzeClothingImage,
);
router.get("/", authMiddleware, getMyWardrobe);
router.get("/my-wardrobe", authMiddleware, getMyWardrobe);
router.delete("/:id", authMiddleware, deleteClothingItem);
router.put("/:id", authMiddleware, updateClothingItem);
module.exports = router;
