const express = require("express");
const router = express.Router();
const weatherController = require("../controllers/weatherController");

router.get("/cities", weatherController.searchCities);
router.get("/forecast", weatherController.getForecast);

module.exports = router;
