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

const getWeatherInfo = (code, isDay = 1, precipitationProbability = 0) => {
  const base = WEATHER_CODE_MAP[code] || { condition: "Clear Sky", icon: "☀️" };

  // Smart rain calibration:
  // If WMO code is drizzle or light rain shower (codes 51, 53, 55, 56, 57, 80)
  // but precipitation probability is under 35%, it is mostly dry with passing clouds.
  const isLightRainCode = [51, 53, 55, 56, 57, 80].includes(code);
  if (isLightRainCode && precipitationProbability < 35) {
    return {
      condition: precipitationProbability >= 15 ? "Passing Clouds (Low Rain Chance)" : "Partly Cloudy",
      icon: isDay ? "⛅" : "☁️",
    };
  }

  if (!isDay && (code === 0 || code === 1)) {
    return { condition: base.condition, icon: "🌙" };
  }
  if (!isDay && code === 2) {
    return { condition: base.condition, icon: "☁️" };
  }
  return base;
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

const getStylingTip = (temp, weatherCode, condition, precipitationProbability = 0) => {
  const isHeavyRain = [61, 63, 65, 66, 67, 81, 82].includes(weatherCode);
  const isDrizzle = [51, 53, 55, 56, 57, 80].includes(weatherCode);
  const isThunder = [95, 96, 99].includes(weatherCode);
  const isSnow = [71, 73, 75, 77, 85, 86].includes(weatherCode);

  if (isThunder) {
    return "Stormy skies — Pair water-resistant outerwear, sturdy footwear, and keep an umbrella close.";
  }
  if (isSnow) {
    return "Snowy & frosty — Bundle up in structured wool coats, cashmere knits, and insulated boots.";
  }
  if (isHeavyRain || (isDrizzle && precipitationProbability >= 35)) {
    return "Rainy weather — Great for waterproof trench coats, stylish boots, and a matching umbrella.";
  }
  if (isDrizzle && precipitationProbability < 35) {
    return "Passing clouds with low rain chance — Comfortable versatile separates, no heavy rain gear required.";
  }
  if (temp >= 30) {
    return "Warm & sunny — Great day for breathable linens, airy silhouettes, light cottons, and sun protection.";
  }
  if (temp >= 24) {
    return "Warm & pleasant — Ideal for lightweight shirts, relaxed tailoring, and breezy daytime layers.";
  }
  if (temp >= 18) {
    return "Mild & comfortable — Perfect for light layers, smart shackets, relaxed chinos, and loafers.";
  }
  if (temp >= 12) {
    return "Crisp & cool — Layer up with knit sweaters, structured blazers, or classic trench coats.";
  }
  return "Chilly day — Stay cozy with warm wool coats, thermal knits, scarves, and stylish boots.";
};

const getPhaseStylingAdvice = (phase, avgTemp, maxPrecip = 0) => {
  if (maxPrecip >= 45) {
    return "Keep an umbrella and waterproof layer handy for likely showers.";
  }
  if (maxPrecip >= 25) {
    return "Passing clouds with a small chance of showers — light versatile layers.";
  }
  if (phase === "Morning") {
    if (avgTemp >= 28) return "Crisp warm start. Breathable linen or lightweight tee.";
    if (avgTemp >= 20) return "Fresh & pleasant. Light shirt with an optional subtle layer.";
    if (avgTemp >= 14) return "Cool morning air. Pair with a knit cardigan or light blazer.";
    return "Chilly morning. Cozy sweater or structured jacket recommended.";
  }
  if (phase === "Afternoon") {
    if (avgTemp >= 32) return "Peak daytime heat. Relaxed airy fabrics, light tones & sunglasses.";
    if (avgTemp >= 24) return "Warm afternoon sun. Comfortable cottons and effortless tailoring.";
    if (avgTemp >= 16) return "Comfortable midday temps. Perfect for standard separates.";
    return "Crisp midday. Layered knitwear or trench coat.";
  }
  if (phase === "Evening") {
    if (avgTemp >= 28) return "Warm balmy breeze. Relaxed evening silhouettes and loafers.";
    if (avgTemp >= 20) return "Ideal golden hour. Versatile shirt with effortless trousers.";
    if (avgTemp >= 14) return "Cooling twilight. Layer with a blazer or denim jacket.";
    return "Chilly evening breeze. Warm coat or heavier knitwear.";
  }
  // Night
  if (avgTemp >= 26) return "Mild evening. Comfortable light eveningwear.";
  if (avgTemp >= 18) return "Cool and pleasant night. Light breathable layers.";
  return "Cold night. Warm outerwear and closed footwear.";
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
 * Returns current weather, 24-hour hourly progression, day-phase styling breakdown, and 7-day forecast
 */
const getForecast = async (req, res) => {
  try {
    let { city, lat, lon } = req.query;
    let cityName = city ? city.trim() : "";
    let countryName = "";
    let admin1Name = "";
    let latitude = lat ? parseFloat(lat) : null;
    let longitude = lon ? parseFloat(lon) : null;

    // If coordinates were passed but no city name, reverse geocode
    if (!isNaN(latitude) && !isNaN(longitude) && latitude !== null && longitude !== null) {
      if (!cityName || cityName === "Selected Location") {
        try {
          const revUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
          const revRes = await fetch(revUrl);
          if (revRes.ok) {
            const revData = await revRes.json();
            cityName = revData.city || revData.locality || "Current Location";
            countryName = revData.countryName || "";
            admin1Name = revData.principalSubdivision || "";
          }
        } catch (e) {
          cityName = cityName || "Current Location";
        }
      }
    } else {
      // If no valid coordinates, geocode city or default to New Delhi
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
        latitude = 28.6139;
        longitude = 77.209;
        cityName = cityName || "New Delhi";
        countryName = "India";
        admin1Name = "Delhi";
      }
    }

    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,apparent_temperature,precipitation_probability,weathercode,is_day,relativehumidity_2m,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max&current_weather=true&timezone=auto&forecast_days=7`;

    const forecastRes = await fetch(forecastUrl);
    if (!forecastRes.ok) {
      return res.status(502).json({ message: "Failed to retrieve weather data from provider" });
    }

    const data = await forecastRes.json();
    const currentWeather = data.current_weather || {};
    const daily = data.daily || { time: [] };
    const hourly = data.hourly || { time: [] };

    // Find current hour index in hourly array to compute next 24 hours
    const currentIsoHour = currentWeather.time ? currentWeather.time.slice(0, 13) : "";
    let startIndex = 0;
    if (hourly.time && hourly.time.length > 0) {
      const idx = hourly.time.findIndex((t) => t.startsWith(currentIsoHour));
      if (idx !== -1) startIndex = idx;
    }

    const currentApparent = hourly.apparent_temperature?.[startIndex] ?? currentWeather.temperature;
    const currentHumidity = hourly.relativehumidity_2m?.[startIndex] ?? null;
    const currentPrecip = hourly.precipitation_probability?.[startIndex] ?? (daily.precipitation_probability_max?.[0] || 0);

    const currentInfo = getWeatherInfo(currentWeather.weathercode, currentWeather.is_day, currentPrecip);
    const todayMax = daily.temperature_2m_max?.[0] ?? currentWeather.temperature;
    const todayMin = daily.temperature_2m_min?.[0] ?? currentWeather.temperature;
    const currentSeason = getSuggestedSeason(todayMax, currentWeather.weathercode);
    const currentTip = getStylingTip(currentWeather.temperature, currentWeather.weathercode, currentInfo.condition, currentPrecip);

    // 24-Hour Timeline
    const hourlyForecast = [];
    const maxHourlyIndex = Math.min(hourly.time?.length || 0, startIndex + 24);

    for (let i = startIndex; i < maxHourlyIndex; i++) {
      const timeStr = hourly.time[i];
      const temp = Math.round(hourly.temperature_2m[i]);
      const apparentTemp = Math.round(hourly.apparent_temperature ? hourly.apparent_temperature[i] : temp);
      const precip = hourly.precipitation_probability ? hourly.precipitation_probability[i] : 0;
      const wCode = hourly.weathercode[i];
      const isDay = hourly.is_day ? hourly.is_day[i] : 1;
      const hInfo = getWeatherInfo(wCode, isDay, precip);
      const humidity = hourly.relativehumidity_2m ? hourly.relativehumidity_2m[i] : null;

      const hourPart = parseInt(timeStr.split("T")[1].split(":")[0], 10);
      const isNow = i === startIndex;
      const label = isNow ? "Now" : `${hourPart % 12 === 0 ? 12 : hourPart % 12} ${hourPart >= 12 ? "PM" : "AM"}`;

      hourlyForecast.push({
        time: timeStr,
        label,
        temp,
        apparentTemp,
        precipitationProbability: precip,
        weatherCode: wCode,
        condition: hInfo.condition,
        icon: hInfo.icon,
        isDay,
        humidity,
      });
    }

    // Day Phases for Today (Morning, Afternoon, Evening, Night)
    const todayDate = daily.time[0] || (currentWeather.time ? currentWeather.time.split("T")[0] : "");
    const phaseRanges = [
      { name: "Morning", hours: [6, 7, 8, 9, 10, 11], defaultIcon: "🌅", timeRange: "6 AM – 12 PM" },
      { name: "Afternoon", hours: [12, 13, 14, 15, 16], defaultIcon: "☀️", timeRange: "12 PM – 5 PM" },
      { name: "Evening", hours: [17, 18, 19, 20], defaultIcon: "🌇", timeRange: "5 PM – 9 PM" },
      { name: "Night", hours: [21, 22, 23], defaultIcon: "🌙", timeRange: "9 PM – Midnight" },
    ];

    const dayPhases = phaseRanges.map((p) => {
      const matchingIndices = (hourly.time || [])
        .map((t, idx) => ({ t, idx }))
        .filter(
          ({ t }) =>
            t.startsWith(todayDate) &&
            p.hours.includes(parseInt(t.split("T")[1].split(":")[0], 10))
        )
        .map((o) => o.idx);

      if (matchingIndices.length === 0) return null;

      const temps = matchingIndices.map((i) => hourly.temperature_2m[i]);
      const avgTemp = Math.round(temps.reduce((a, b) => a + b, 0) / temps.length);
      const maxPrecip = Math.max(
        ...matchingIndices.map((i) => (hourly.precipitation_probability ? hourly.precipitation_probability[i] : 0))
      );
      const midIdx = matchingIndices[Math.floor(matchingIndices.length / 2)];
      const wInfo = getWeatherInfo(hourly.weathercode[midIdx], hourly.is_day[midIdx], maxPrecip);

      return {
        phase: p.name,
        timeRange: p.timeRange,
        icon: wInfo.icon || p.defaultIcon,
        condition: wInfo.condition,
        temp: avgTemp,
        precipitationProbability: maxPrecip,
        stylingAdvice: getPhaseStylingAdvice(p.name, avgTemp, maxPrecip),
      };
    }).filter(Boolean);

    // 7-Day Forecast (without crude summer/winter badges)
    const totalDays = Math.min(daily.time?.length || 0, 7);
    const dailyForecast = [];

    for (let i = 0; i < totalDays; i++) {
      const dateStr = daily.time[i];
      const maxT = daily.temperature_2m_max[i];
      const minT = daily.temperature_2m_min[i];
      const wCode = daily.weathercode[i];
      const precip = daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 0;
      const dayInfo = getWeatherInfo(wCode, 1, precip);
      const daySeason = getSuggestedSeason(maxT, wCode);
      const dayTip = getStylingTip(maxT, wCode, dayInfo.condition, precip);

      dailyForecast.push({
        date: dateStr,
        formattedDate: formatDate(dateStr),
        dayName: formatDayName(dateStr, i),
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
        apparentTemp: Math.round(currentApparent),
        tempMax: Math.round(todayMax),
        tempMin: Math.round(todayMin),
        weatherCode: currentWeather.weathercode,
        condition: currentInfo.condition,
        icon: currentInfo.icon,
        windSpeed: Math.round(currentWeather.windspeed),
        humidity: currentHumidity,
        precipitationProbability: currentPrecip,
        suggestedSeason: currentSeason,
        stylingTip: currentTip,
      },
      hourly: hourlyForecast,
      dayPhases,
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
