require("dotenv").config();
const express = require("express");
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
const app = express();
const path = require("path");
const db = require("./config/db");
const User = require("./models/User");
const ClothingItem = require("./models/ClothingItem");
const cors = require("cors");
const OutfitHistory = require("./models/OutfitHistory");
const OutfitFeedback = require("./models/OutfitFeedback");
const UserPreferences = require("./models/UserPreferences");
const TwinningSession = require("./models/TwinningSession");
const ChatInteractionLog = require("./models/ChatInteractionLog");
const CapsuleTrip = require("./models/CapsuleTrip");

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/history", historyRoutes);
app.use("/api/feedback", feedbackRoutes);
db.authenticate()
  .then(() => console.log("connection successful"))
  .catch((err) => console.log("error"));

db.sync()
  .then(() => console.log("Tables created"))
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("StyleMate backend is running");
});
app.listen(5000, () => {
  console.log("server is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/clothing", clothingRoutes);
app.use("/api/recommendation", recommendationRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/gap-analysis", gapAnalysisRoutes);
app.use("/api/preferences", preferenceRoutes);
app.use("/api/twinning", twinningRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/capsule", capsuleRoutes);
app.use("/api/shopping", shoppingRoutes);
