require("dotenv").config();
const express = require("express");
const authRoutes = require("./routes/authRoutes");
const app = express();
const db = require("./config/db");
const User = require("./models/User");
app.use(express.json());
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
