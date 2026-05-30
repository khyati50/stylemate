const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  testAuth,
  registerUser,
  loginUser,
} = require("../controllers/authController");
const router = express.Router();
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/test", authMiddleware, (req, res) => {
  res.status(200).json({
    message: "protected route accessed",
    user: req.user,
  });
});
module.exports = router;
