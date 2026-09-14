const WEATHER_CODE_MAP = {
  0: { condition: "Clear Sky", icon: "☀️" },
  1: { condition: "Mainly Clear", icon: "☀️" },
  2: { condition: "Partly Cloudy", icon: "⛅" },
  3: { condition: "Overcast", icon: "☁️" },
  45: { condition: "Foggy", icon: "🌫️" },
  48: { condition: "Rime Fog", icon: "🌫️" },
  51: { condition: "Light Drizzle", icon: "🌧️" },
  53: { condition: "Moderate Drizzle", icon: "🌧️" },
  55: { condition: "Dense Drizzle", icon: "🌧️" },
  56: { condition: "Light Freezing Drizzle", icon: "🌧️" },
  57: { condition: "Dense Freezing Drizzle", icon: "🌧️" },
  61: { condition: "Slight Rain", icon: "🌧️" },
  63: { condition: "Moderate Rain", icon: "🌧️" },
  65: { condition: "Heavy Rain", icon: "🌧️" },
  66: { condition: "Light Freezing Rain", icon: "🌧️" },
  67: { condition: "Heavy Freezing Rain", icon: "🌧️" },
  71: { condition: "Slight Snowfall", icon: "❄️" },
  73: { condition: "Moderate Snowfall", icon: "❄️" },
  75: { condition: "Heavy Snowfall", icon: "❄️" },
  77: { condition: "Snow Grains", icon: "❄️" },
  80: { condition: "Slight Rain Showers", icon: "🌧️" },
  81: { condition: "Moderate Rain Showers", icon: "🌧️" },
  82: { condition: "Violent Rain Showers", icon: "🌧️" },
  85: { condition: "Slight Snow Showers", icon: "❄️" },
  86: { condition: "Heavy Snow Showers", icon: "❄️" },
  95: { condition: "Thunderstorm", icon: "⛈️" },
  96: { condition: "Thunderstorm with Hail", icon: "⛈️" },
  99: { condition: "Severe Thunderstorm", icon: "⛈️" },
};

const getWeatherInfo = (code) => {
  return WEATHER_CODE_MAP[code] || { condition: "Clear", icon: "☀️" };
};

const getSuggestedSeason = (tempMax, weatherCode) => {
  const winterCodes = [71, 73, 75, 77, 85, 86, 56, 57, 66, 67];
  if (winterCodes.includes(weatherCode)) {
    return "winter";
  }
  if (tempMax >= 26) {
    return "summer";
  }
  if (tempMax <= 14) {
    return "winter";
  }
  if (tempMax > 14 && tempMax <= 20) {
    return "autumn";
  }
  return "spring";
};

const getStylingTip = (temp, weatherCode, condition) => {
  const isRain = [51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode);
  const isThunder = [95, 96, 99].includes(weatherCode);
  const isSnow = [71, 73, 75, 77, 85, 86].includes(weatherCode);

  if (isThunder) {
    return "Stormy skies — Pair water-resistant outerwear, sturdy footwear, and keep an umbrella close.";
  }
  if (isSnow) {
    return "Snowy & frosty — Bundle up in structured wool coats, cashmere knits, and insulated boots.";
  }
  if (isRain) {
    return "Rainy weather — Great for waterproof trench coats, stylish boots, and a matching umbrella.";
  }
  if (temp >= 30) {
    return "Warm & sunny — Great day for breathable linens, airy silhouettes, and light tones.";
  }
  if (temp >= 24) {
    return "Warm & pleasant — Ideal for lightweight cottons, relaxed tailoring, and breezy daytime layers.";
  }
  if (temp >= 18) {
    return "Mild & breezy — Perfect for light layers, smart shackets, relaxed chinos, and loafers.";
  }
  if (temp >= 12) {
    return "Crisp & cool — Layer up with knit sweaters, structured blazers, or classic trench coats.";
  }
  return "Chilly day — Stay cozy with warm wool coats, thermal knits, scarves, and stylish boots.";
};

const formatDayName = (dateStr, index) => {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString("en-US", { weekday: "short" });
  } catch (_) {
    return `Day ${index + 1}`;
  }
};

const formatDate = (dateStr) => {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch (_) {
    return dateStr;
  }
};

/**
 * GET /api/weather/cities?q=...
 * Returns matching cities with { name, country, latitude, longitude, admin1 }
 */
const searchCities = async (req, res) => {
  try {
    const query = req.query.q || req.query.city || "";
    if (!query.trim()) {
      return res.status(200).json({ cities: [] });
    }

    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query.trim()
    )}&count=5&language=en&format=json`;

    const response = await fetch(url);
    if (!response.ok) {
      return res.status(200).json({ cities: [] });
    }

    const data = await response.json();
    const cities = (data.results || []).map((item) => ({
      name: item.name,
      country: item.country || "",
      latitude: item.latitude,
      longitude: item.longitude,
      admin1: item.admin1 || "",
    }));

    return res.status(200).json({ cities });
  } catch (error) {
    console.error("searchCities error:", error);
    return res.status(500).json({ message: "Failed to search cities", cities: [] });
  }
};

/**
 * GET /api/weather/forecast?city=...&lat=...&lon=...
 * Returns current weather and 6-day forecast with styling tips and suggested season
 */
const getForecast = async (req, res) => {
  try {
    let { city, lat, lon } = req.query;
    let cityName = city ? city.trim() : "";
    let countryName = "";
    let admin1Name = "";
    let latitude = lat ? parseFloat(lat) : null;
    let longitude = lon ? parseFloat(lon) : null;

    // If lat or lon are not valid numbers, geocode city or default to "New Delhi"
    if (isNaN(latitude) || isNaN(longitude) || latitude === null || longitude === null) {
      const searchTarget = cityName || "New Delhi";
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        searchTarget
      )}&count=5&language=en&format=json`;

      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();

      if (geoData.results && geoData.results.length > 0) {
        const exactMatch = geoData.results.find(
          (r) => r.name.toLowerCase() === searchTarget.toLowerCase()
        );
        const topResult = exactMatch || geoData.results[0];
        latitude = topResult.latitude;
        longitude = topResult.longitude;
        cityName = exactMatch ? topResult.name : (cityName || topResult.name);
        countryName = topResult.country || "";
        admin1Name = topResult.admin1 || "";
      } else {
        // Fallback default coordinates for New Delhi
        latitude = 28.6139;
        longitude = 77.209;
        cityName = cityName || "New Delhi";
        countryName = "India";
        admin1Name = "Delhi";
      }
    } else if (!cityName) {
      cityName = "Selected Location";
    }

    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max&current_weather=true&timezone=auto`;

    const forecastRes = await fetch(forecastUrl);
    if (!forecastRes.ok) {
      return res.status(502).json({ message: "Failed to retrieve weather data from provider" });
    }

    const data = await forecastRes.json();
    const currentWeather = data.current_weather || {};
    const daily = data.daily || { time: [] };

    const currentInfo = getWeatherInfo(currentWeather.weathercode);
    const todayMax = daily.temperature_2m_max?.[0] ?? currentWeather.temperature;
    const todayMin = daily.temperature_2m_min?.[0] ?? currentWeather.temperature;
    const currentSeason = getSuggestedSeason(todayMax, currentWeather.weathercode);
    const currentTip = getStylingTip(currentWeather.temperature, currentWeather.weathercode, currentInfo.condition);

    const totalDays = Math.min(daily.time?.length || 0, 6);
    const dailyForecast = [];

    for (let i = 0; i < totalDays; i++) {
      const dateStr = daily.time[i];
      const maxT = daily.temperature_2m_max[i];
      const minT = daily.temperature_2m_min[i];
      const wCode = daily.weathercode[i];
      const precip = daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 0;
      const dayInfo = getWeatherInfo(wCode);
      const daySeason = getSuggestedSeason(maxT, wCode);
      const dayTip = getStylingTip(maxT, wCode, dayInfo.condition);

      dailyForecast.push({
        date: dateStr,
        formattedDate: formatDate(dateStr),
        dayName: formatDayName(dateStr, i),
        dayOfWeek: formatDayName(dateStr, i),
        weatherCode: wCode,
        condition: dayInfo.condition,
        icon: dayInfo.icon,
        tempMax: Math.round(maxT),
        tempMin: Math.round(minT),
        precipitationProbability: precip,
        suggestedSeason: daySeason,
        stylingTip: dayTip,
      });
    }

    return res.status(200).json({
      location: {
        city: cityName,
        name: cityName,
        country: countryName,
        admin1: admin1Name,
        latitude,
        longitude,
      },
      current: {
        temp: Math.round(currentWeather.temperature),
        temperature: Math.round(currentWeather.temperature),
        tempMax: Math.round(todayMax),
        tempMin: Math.round(todayMin),
        weatherCode: currentWeather.weathercode,
        condition: currentInfo.condition,
        icon: currentInfo.icon,
        windSpeed: currentWeather.windspeed,
        suggestedSeason: currentSeason,
        stylingTip: currentTip,
      },
      daily: dailyForecast,
      forecast: dailyForecast,
    });
  } catch (error) {
    console.error("getForecast error:", error);
    return res.status(500).json({ message: "Internal server error fetching forecast" });
  }
};

module.exports = {
  searchCities,
  getForecast,
};
