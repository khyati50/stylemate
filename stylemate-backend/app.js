require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const db = require("./config/db");

// Route imports
const authRoutes = require("./routes/authRoutes");
const clothingRoutes = require("./routes/clothingRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const historyRoutes = require("./routes/historyRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const gapAnalysisRoutes = require("./routes/gapAnalysisRoutes");
const preferenceRoutes = require("./routes/preferenceRoutes");
const twinningRoutes = require("./routes/twinningRoutes");
const chatRoutes = require("./routes/chatRoutes");
const weatherRoutes = require("./routes/weatherRoutes");
const capsuleRoutes = require("./routes/capsuleRoutes");
const shoppingRoutes = require("./routes/shoppingRoutes");

// Model imports (for db.sync and associations)
const {
  User,
  ClothingItem,
  OutfitHistory,
  OutfitFeedback,
  UserPreferences,
  TwinningSession,
  ChatInteractionLog,
  CapsuleTrip,
} = require("./models");

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("StyleMate backend is running");
});
app.use("/api/auth", authRoutes);
app.use("/api/clothing", clothingRoutes);
app.use("/api/recommendation", recommendationRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/recommendation/history", historyRoutes);
app.use("/api/recommendations/history", historyRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/gap-analysis", gapAnalysisRoutes);
app.use("/api/preferences", preferenceRoutes);
app.use("/api/twinning", twinningRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/capsule", capsuleRoutes);
app.use("/api/shopping", shoppingRoutes);

// ─── Database ─────────────────────────────────────────────────────────────────
db.authenticate()
  .then(() => console.log("Database connection successful"))
  .catch((err) => console.error("Database connection error:", err));

db.sync()
  .then(() => console.log("Database tables synced"))
  .catch((err) => console.error("Database sync error:", err));

// ─── Server ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`StyleMate backend is running on port ${PORT}`);
});
