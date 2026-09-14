const { Op } = require("sequelize");
const ClothingItem = require("../models/ClothingItem");
const CapsuleTrip = require("../models/CapsuleTrip");

/**
 * Normalizes item category into one of:
 * 'top', 'bottom', 'footwear', 'outerwear', 'fullBody', 'accessory'
 */
function categorizeItem(item) {
  const cat = (item.category || "").toLowerCase().trim();
  const name = (item.name || "").toLowerCase().trim();
  const combined = `${cat} ${name}`;

  if (cat === "accessory") return "accessory";
  if (cat === "full body" || cat === "fullbody") return "fullBody";
  if (cat === "outerwear") return "outerwear";
  if (cat === "footwear") return "footwear";
  if (cat === "bottom" || cat === "bottoms") return "bottom";
  if (cat === "top" || cat === "tops") return "top";

  if (/full\s*body|dress|jumpsuit|romper|gown/i.test(combined)) return "fullBody";
  if (/accessory|accessories|bag|hat|belt|scarf|jewelry|sunglasses|watch|\btie\b|bowtie|cufflinks|brooch|pocket square/i.test(combined)) return "accessory";
  if (/footwear|shoe|shoes|sneaker|sneakers|boots|boot|loafer|loafers|sandals|sandal|heels|heel|flats|flat|mojari/i.test(combined)) return "footwear";
  if (/outerwear|outer|jacket|coat|blazer|cardigan|overcoat|parka|trench|bandhgala|suit jacket|tuxedo/i.test(combined)) return "outerwear";
  if (/bottom|bottoms|lower|pants|pant|trousers|trouser|jeans|jean|shorts|short|skirt|leggings|chinos|chino|pyjama/i.test(combined)) return "bottom";
  if (/top|tops|upper|shirt|t-shirt|tshirt|\btees?\b|polo|sweater|sweatshirt|hoodie|tank|blouse|kurta/i.test(combined)) return "top";
  
  // Default fallback based on common fields
  if (/upper/i.test(cat)) return "top";
  if (/lower/i.test(cat)) return "bottom";
  return "top";
}

/**
 * Calculates a compatibility score for a garment given trip vibe, season, destination archetype, and temperature
 */
function scoreItem(
  item,
  vibe = "vacation",
  season = "summer",
  archetype = "general_city",
  destinationTemp = null
) {
  let score = 0;
  const targetSeason = (season || "summer").toLowerCase();
  const targetVibe = (vibe || "vacation").toLowerCase();

  // 1. Season Scoring
  const itemSeasons = Array.isArray(item.seasons)
    ? item.seasons.map((s) => String(s).toLowerCase())
    : typeof item.seasons === "string"
    ? item.seasons.toLowerCase().split(/[\s,]+/)
    : [];

  if (
    itemSeasons.length === 0 ||
    itemSeasons.some((s) => s.includes("all") || s.includes(targetSeason))
  ) {
    score += 10;
  } else if (
    (targetSeason === "spring" && itemSeasons.some((s) => s.includes("summer") || s.includes("autumn"))) ||
    (targetSeason === "autumn" && itemSeasons.some((s) => s.includes("winter") || s.includes("spring")))
  ) {
    score += 4;
  }

  // 2. Vibe & Occasion Scoring
  const itemOccasions = Array.isArray(item.occasions)
    ? item.occasions.map((o) => String(o).toLowerCase())
    : typeof item.occasions === "string"
    ? item.occasions.toLowerCase().split(/[\s,]+/)
    : [];

  const itemStyles = Array.isArray(item.styles)
    ? item.styles.map((s) => String(s).toLowerCase())
    : typeof item.styles === "string"
    ? item.styles.toLowerCase().split(/[\s,]+/)
    : [];

  const combinedTraits = [...itemOccasions, ...itemStyles];

  const vibeKeywords = {
    vacation: ["vacation", "resort", "casual", "beach", "summer", "leisure", "relaxed", "holiday", "travel"],
    business: ["business", "formal", "smart", "office", "work", "city", "chic", "tailored"],
    romantic: ["romantic", "date", "party", "evening", "chic", "formal", "night", "dinner"],
    casual: ["casual", "everyday", "streetwear", "lounge", "basic", "relaxed", "minimal", "leisure"],
  };

  const keywords = vibeKeywords[targetVibe] || vibeKeywords.vacation;
  for (const kw of keywords) {
    if (combinedTraits.some((trait) => trait.includes(kw))) {
      score += 6;
      break;
    }
  }

  // 3. Color Versatility Bonus (capsule friendly neutrals)
  const itemColors = Array.isArray(item.colors)
    ? item.colors.map((c) => String(c).toLowerCase())
    : typeof item.colors === "string"
    ? item.colors.toLowerCase().split(/[\s,]+/)
    : [];

  if (itemColors.some((c) => /black|white|grey|gray|navy|beige|tan|cream|khaki|denim|brown|charcoal|olive/.test(c))) {
    score += 3;
  }

  // 4. Destination Archetype Styling Bias
  const itemText = [
    item.name || "",
    item.category || "",
    ...itemStyles,
    ...itemOccasions,
    ...itemColors,
  ].join(" ").toLowerCase();

  if (archetype === "tropical_beach") {
    // Boost (+8): linen shirts, cotton tees, polos, shorts, sandals, loafers, sunglasses
    if (/linen|cotton|tees?|t-shirt|\bpolo\b|shorts?|sandals?|flip-flop|loafers?|sunglasses|swim|beach|tank|breezy|resort/.test(itemText)) {
      score += 8;
    }
    // Penalty (-15): wool, heavy blazers, suits, parkas, heavy coats, thick boots
    if (/wool|blazer|suit|parka|heavy|coat|overcoat|trench|sweater|hoodie|sweatshirt|thick|boots?|leather jacket/.test(itemText)) {
      score -= 15;
    }
    // Heavy temperature penalty if hot (temp >= 26) on heavy outerwear
    if (destinationTemp !== null && destinationTemp >= 26) {
      if (/outerwear|jacket|blazer|coat|hoodie|sweatshirt/.test(itemText)) {
        score -= 10;
      }
    }
  } else if (archetype === "fashion_capital") {
    // Boost (+6): tailored chinos, crisp white/black linen or oxford shirts, chic blazers/bombers, elegant dresses, sleek loafers/heels/minimalist sneakers
    if (/tailored|chino|chinos|oxford|blazer|bomber|dress|trench|loafers?|heels?|minimalist|trousers?|leather|chic|smart|crisp/.test(itemText)) {
      score += 6;
    }
  } else if (archetype === "alpine_cold") {
    // Boost (+8): warm knits, hoodies, bombers, jackets, dark trousers, sturdy boots
    if (/knit|sweater|hoodie|sweatshirt|bomber|jacket|coat|parka|boots?|fleece|wool|trousers?|denim|dark|heavy/.test(itemText)) {
      score += 8;
    }
    // Penalty (-10): beach shorts, sandals, flip-flops
    if (/shorts?|sandals?|flip-flop|tank top|swim|slides/.test(itemText)) {
      score -= 10;
    }
    // Low temperature bonus
    if (destinationTemp !== null && destinationTemp <= 15) {
      if (/outerwear|jacket|coat|sweater|knit|boots/.test(itemText)) {
        score += 5;
      }
    }
  } else if (archetype === "modern_metropolis") {
    // Boost (+6): clean streetwear, minimalist sneakers, dark denim, crisp polos/tees, lightweight bombers
    if (/streetwear|sneakers?|denim|jeans|\bpolo\b|tees?|t-shirt|bomber|oversized|contemporary|minimal/.test(itemText)) {
      score += 6;
    }
  } else if (archetype === "heritage_culture") {
    // Boost (+6): breathable cotton/linen, comfortable trousers/kurta, walking-friendly shoes
    if (/linen|cotton|kurta|trousers?|chinos?|loafers?|flats?|sneakers?|scarf|shawl|shirt/.test(itemText)) {
      score += 6;
    }
  }

  return score;
}

/**
 * Determines formality rank:
 * 0: Sporty / Athletic / Loungewear
 * 1: Casual / Streetwear
 * 2: Smart / Smart-Casual
 * 3: Formal / Black Tie
 */
function getFormalityRank(item) {
  if (!item) return 1;
  const styles = Array.isArray(item.styles)
    ? item.styles.map((s) => String(s).toLowerCase())
    : typeof item.styles === "string"
    ? item.styles.toLowerCase().split(/[\s,]+/)
    : [];
  const name = (item.name || "").toLowerCase();
  if (styles.includes("formal") || /suit|tuxedo|blazer|oxford|trousers|formal|derby/i.test(name)) return 3;
  if (styles.includes("smart") || /chino|polo|linen|loafer|blouse|smart/i.test(name)) return 2;
  if (styles.includes("sporty") || styles.includes("athletic") || /hoodie|sweatshirt|sweatpant|jogger|track/i.test(name)) return 0;
  return 1; // casual / streetwear
}

function isCompatibleOutfit(top, bottom, fullBody, footwear, outerwear, season, vibe) {
  const seasonStr = (season || "summer").toLowerCase();
  const isSummer = seasonStr === "summer" || seasonStr === "spring";

  // 1. Hoodie Guardrail: A hoodie / sweatshirt is a bulky top layer.
  // NEVER put a denim jacket, structured blazer, or casual jacket over a hoodie!
  if (top && /hoodie|sweatshirt/i.test(top.name)) {
    if (outerwear) return false;
  }

  // 2. Blazer Guardrails:
  if (outerwear && /blazer|suit|tailored/i.test(outerwear.name)) {
    // Formal blazer CANNOT be worn with denim shirts or graphic tees or casual hoodies
    if (top && (/denim/i.test(top.name) || /hoodie|tank|graphic/i.test(top.name))) {
      return false;
    }
    // Formal blazer must pair with smart or formal tops
    if (top) {
      const topFormality = getFormalityRank(top);
      if (topFormality < 2) return false;
    }
    // Formal blazer must pair with smart/formal bottoms (chinos, trousers, skirts)
    if (bottom && /sweatpant|track|jogger|distressed/i.test(bottom.name)) {
      return false;
    }
  }

  // 3. Denim on Denim Guardrail:
  if (top && /denim/i.test(top.name)) {
    if (outerwear && /denim/i.test(outerwear.name)) return false;
  }

  // 4. Outerwear in Summer / Warm Vacation:
  // If summer/vacation, do not force heavy outerwear (blazers, thick jackets)
  if (isSummer && outerwear && /blazer|wool|heavy|coat|parka/i.test(outerwear.name)) {
    return false;
  }

  // 5. Formality distance between Top and Bottom:
  if (top && bottom) {
    const topRank = getFormalityRank(top);
    const bottomRank = getFormalityRank(bottom);
    if (Math.abs(topRank - bottomRank) > 1) {
      // E.g. gym top (0) + formal trousers (3) is rejected
      return false;
    }
  }

  // 6. Footwear compatibility:
  if (footwear && (bottom || fullBody)) {
    const shoeName = (footwear.name || "").toLowerCase();
    const isFormalShoe = /derby|oxford|heels|stiletto/i.test(shoeName);
    const isSportShoe = /sneaker|running|trainer/i.test(shoeName);

    if (bottom && /sweatpant|jogger|track/i.test(bottom.name) && isFormalShoe) {
      return false;
    }
  }

  return true;
}

const ARCHETYPE_CONFIG = {
  tropical_beach: {
    archetypeLabel: "Tropical Coastal Resort",
    styleDna: "Curated for warm beach & resort weather with breathable linens, relaxed separates, and sunset lounge looks.",
    defaultWeather: { temp: 29, condition: "Sunny & Warm", icon: "☀️" },
    dayThemes: [
      "Arrival & Coastal Sunset Stroll",
      "Beach Club, Seaside Walk & Cafe",
      "Island Boat Cruise & Waterside Dining",
      "Old Coastal Heritage Walk & Sunset Cocktails",
      "Tropical Flea Market & Al Fresco Seafood Dinner",
      "Catamaran Sailing & Beachside Lounge",
      "Farewell Seaside Brunch & Departure",
    ],
  },
  fashion_capital: {
    archetypeLabel: "Chic Fashion Capital",
    styleDna: "Curated with elevated minimalism, tailored silhouettes, crisp layering, and refined footwear.",
    defaultWeather: { temp: 18, condition: "Mild & Pleasant", icon: "⛅" },
    dayThemes: [
      "Arrival & Grand Boulevard Promenade",
      "Historic Art Museums & Sidewalk Cafe",
      "Boutique Fashion District & Art Galleries",
      "Iconic Landmarks & Fine Dining Experience",
      "Bohemian Quarter & Rooftop Wine Bar",
      "Historic Palace Gardens & High Tea",
      "Farewell Gourmet Bistro & Departure",
    ],
  },
  modern_metropolis: {
    archetypeLabel: "Modern Metropolis",
    styleDna: "Curated with contemporary smart streetwear, sleek dark tones, versatile shackets, and walking comfort.",
    defaultWeather: { temp: 22, condition: "Clear & Urban", icon: "🏙️" },
    dayThemes: [
      "Arrival & Neon City Skyline Walk",
      "Historic Shrines & Artisan Coffee Roasters",
      "Trendsetting Fashion & Streetwear Discovery",
      "Panoramic Observation Deck & Rooftop Dining",
      "Modern Art Museum & Hidden Izakaya Lounge",
      "Architectural Wonders & Night Market",
      "Farewell Skyline Brunch & Departure",
    ],
  },
  heritage_culture: {
    archetypeLabel: "Heritage & Cultural Wonder",
    styleDna: "Curated with breathable artisan fabrics, modest comfortable elegance, and walking-friendly shoes.",
    defaultWeather: { temp: 27, condition: "Sunny & Dry", icon: "🏛️" },
    dayThemes: [
      "Arrival & Historic Bazaars",
      "Royal Palaces & Courtyard Lunch",
      "Lakeside Promenade & Traditional Dining",
      "Artisan Workshops & Sunset Fort Views",
      "Cultural Monuments & Musical Evening",
      "Heritage Garden Walk & Local Delicacies",
      "Farewell Artisan Market & Departure",
    ],
  },
  alpine_cold: {
    archetypeLabel: "Alpine Mountain Escape",
    styleDna: "Curated for mountain chill with insulating knits, cozy outerwear, structured trousers, and warm footwear.",
    defaultWeather: { temp: 10, condition: "Crisp & Chilly", icon: "❄️" },
    dayThemes: [
      "Arrival & Mountain Lodge Check-in",
      "Scenic Valley Trail & Warm Hearth Cafe",
      "High-Altitude Viewpoint & Fireside Evening",
      "Alpine Village Stroll & Warm Fondue Dining",
      "Mountain Spa & Panoramic Lounge",
      "Snow Pine Walk & Cozy Bistro",
      "Farewell Mountain Breakfast & Departure",
    ],
  },
  general_city: {
    archetypeLabel: "Cosmopolitan City",
    styleDna: "Curated for versatile urban exploration with polished casual staples and comfortable layering.",
    defaultWeather: { temp: 20, condition: "Mild & Clear", icon: "🌤️" },
    dayThemes: [
      "Arrival & City Center Promenade",
      "Historic District & Artisan Cafes",
      "Modern Art Galleries & Boutique Stroll",
      "Iconic Landmarks & Panoramic Dining",
      "Cultural Quarter & Evening Cocktails",
      "Scenic Parks & Gourmet Food Market",
      "Farewell Brunch & Departure",
    ],
  },
};

const ARCHETYPE_KEYWORDS = {
  tropical_beach: [
    "goa", "bali", "miami", "beach", "cancun", "phuket", "maldives", "hawaii",
    "ibiza", "santorini", "caribbean", "pattaya", "boracay", "cochin",
    "pondicherry", "alibaug", "tulum", "borabora", "mykonos", "seychelles"
  ],
  fashion_capital: [
    "paris", "milan", "new york", "nyc", "london", "rome", "florence",
    "barcelona", "madrid", "berlin", "amsterdam", "vienna"
  ],
  modern_metropolis: [
    "tokyo", "seoul", "singapore", "hong kong", "bangkok", "shanghai",
    "dubai", "sydney", "toronto"
  ],
  heritage_culture: [
    "jaipur", "udaipur", "jodhpur", "varanasi", "agra", "delhi",
    "kyoto", "athens", "cairo", "hampi"
  ],
  alpine_cold: [
    "alps", "aspen", "manali", "shimla", "leh", "ladakh", "banff",
    "switzerland", "kashmir", "himalayas", "zermatt"
  ],
};

const KNOWN_COORDINATES = {
  goa: { lat: 15.2993, lon: 74.1240, country: "India", name: "Goa" },
  manali: { lat: 32.2432, lon: 77.1892, country: "India", name: "Manali" },
  paris: { lat: 48.8566, lon: 2.3522, country: "France", name: "Paris" },
  london: { lat: 51.5074, lon: -0.1278, country: "United Kingdom", name: "London" },
  tokyo: { lat: 35.6762, lon: 139.6503, country: "Japan", name: "Tokyo" },
  bali: { lat: -8.4095, lon: 115.1889, country: "Indonesia", name: "Bali" },
  "new york": { lat: 40.7128, lon: -74.0060, country: "United States", name: "New York" },
  nyc: { lat: 40.7128, lon: -74.0060, country: "United States", name: "New York" },
  barcelona: { lat: 41.3879, lon: 2.1699, country: "Spain", name: "Barcelona" },
  milan: { lat: 45.4642, lon: 9.1900, country: "Italy", name: "Milan" },
  rome: { lat: 41.9028, lon: 12.4964, country: "Italy", name: "Rome" },
  jaipur: { lat: 26.9124, lon: 75.7873, country: "India", name: "Jaipur" },
  udaipur: { lat: 24.5854, lon: 73.7125, country: "India", name: "Udaipur" },
  shimla: { lat: 31.1048, lon: 77.1734, country: "India", name: "Shimla" },
  leh: { lat: 34.1526, lon: 77.5771, country: "India", name: "Leh Ladakh" },
  dubai: { lat: 25.2048, lon: 55.2708, country: "United Arab Emirates", name: "Dubai" },
  singapore: { lat: 1.3521, lon: 103.8198, country: "Singapore", name: "Singapore" },
  bangkok: { lat: 13.7563, lon: 100.5018, country: "Thailand", name: "Bangkok" },
  kyoto: { lat: 35.0116, lon: 135.7681, country: "Japan", name: "Kyoto" },
  amsterdam: { lat: 52.3676, lon: 4.9041, country: "Netherlands", name: "Amsterdam" },
};

function getWeatherDetails(weathercode, temp) {
  if (weathercode === 0) {
    return { condition: temp > 25 ? "Sunny & Warm" : "Clear Sky", icon: "☀️" };
  }
  if (weathercode === 1 || weathercode === 2) {
    return { condition: "Partly Cloudy", icon: "⛅" };
  }
  if (weathercode === 3) {
    return { condition: "Overcast", icon: "☁️" };
  }
  if (weathercode === 45 || weathercode === 48) {
    return { condition: "Foggy & Misty", icon: "🌫️" };
  }
  if ([51, 53, 55, 56, 57].includes(weathercode)) {
    return { condition: "Light Drizzle", icon: "🌦️" };
  }
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(weathercode)) {
    return { condition: "Rainy Showers", icon: "🌧️" };
  }
  if ([71, 73, 75, 77, 85, 86].includes(weathercode)) {
    return { condition: "Snow & Crisp", icon: "❄️" };
  }
  if ([95, 96, 99].includes(weathercode)) {
    return { condition: "Thunderstorm", icon: "⛈️" };
  }
  return {
    condition: temp > 24 ? "Warm & Pleasant" : temp < 14 ? "Chilly & Crisp" : "Mild",
    icon: temp > 24 ? "☀️" : temp < 14 ? "❄️" : "⛅",
  };
}

/**
 * Derives the destination profile, archetypes, live weather, and itinerary themes
 */
async function getDestinationProfile(destination) {
  const destClean = (destination || "").trim();
  const destLower = destClean.toLowerCase();

  let archetype = "general_city";
  for (const [archKey, kws] of Object.entries(ARCHETYPE_KEYWORDS)) {
    if (kws.some((kw) => destLower.includes(kw))) {
      archetype = archKey;
      break;
    }
  }

  const archConfig = ARCHETYPE_CONFIG[archetype] || ARCHETYPE_CONFIG.general_city;
  let destinationName = destClean;
  let country = "";
  let lat = null;
  let lon = null;

  // Check known coordinates for instant accurate resolution
  for (const [key, info] of Object.entries(KNOWN_COORDINATES)) {
    if (destLower.includes(key) || key.includes(destLower)) {
      lat = info.lat;
      lon = info.lon;
      country = info.country;
      destinationName = info.name;
      break;
    }
  }

  // If not found in known coordinates, geocode via Open-Meteo
  if (lat === null && destClean) {
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destClean)}&count=1&language=en&format=json`;
      const geoRes = await fetch(geoUrl, { signal: AbortSignal.timeout(3000) });
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.results && geoData.results.length > 0) {
          const top = geoData.results[0];
          lat = top.latitude;
          lon = top.longitude;
          destinationName = top.name || destinationName;
          country = top.country || "";
        }
      }
    } catch (err) {
      // geocoding timed out or network error
    }
  }

  // Fetch live weather if lat/lon resolved
  let weather = null;
  if (lat !== null && lon !== null) {
    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
      const wRes = await fetch(weatherUrl, { signal: AbortSignal.timeout(3000) });
      if (wRes.ok) {
        const wData = await wRes.json();
        if (wData.current_weather) {
          const temp = Math.round(wData.current_weather.temperature);
          const weathercode = wData.current_weather.weathercode;
          const { condition, icon } = getWeatherDetails(weathercode, temp);
          weather = { temp, condition, icon };
        }
      }
    } catch (err) {
      // weather timed out or network error
    }
  }

  // Realistic archetype fallbacks if live weather is unreachable
  if (!weather) {
    if (destLower.includes("goa")) {
      weather = { temp: 29, condition: "Sunny & Warm", icon: "☀️" };
    } else if (destLower.includes("paris")) {
      weather = { temp: 18, condition: "Mild & Pleasant", icon: "⛅" };
    } else if (destLower.includes("london")) {
      weather = { temp: 13, condition: "Overcast & Cool", icon: "☁️" };
    } else if (destLower.includes("manali")) {
      weather = { temp: 10, condition: "Crisp & Chilly", icon: "❄️" };
    } else {
      weather = { ...archConfig.defaultWeather };
    }
  }

  return {
    destinationName,
    country,
    archetype,
    archetypeLabel: archConfig.archetypeLabel,
    weather,
    styleDna: archConfig.styleDna,
    dayThemes: archConfig.dayThemes,
  };
}

const DAY_THEMES = ARCHETYPE_CONFIG.general_city.dayThemes;

const cleanItem = (item) => {
  const json = typeof item.toJSON === "function" ? item.toJSON() : item;
  return {
    id: json.id,
    name: json.name,
    category: json.category,
    imageUrl: json.imageUrl,
    colors: json.colors,
    styles: json.styles,
    seasons: json.seasons,
    occasions: json.occasions,
    status: json.status || "available",
    packed: false,
  };
};

/**
 * Generates an optimized travel packing capsule and day-by-day itinerary
 */
const generateCapsule = async (req, res) => {
  try {
    const { destination, vibe = "vacation", season = "summer" } = req.body;
    let days = parseInt(req.body.days, 10);

    if (!destination || !destination.trim()) {
      return res.status(400).json({ message: "Destination is required." });
    }

    if (isNaN(days)) days = 4;
    days = Math.min(14, Math.max(2, days));

    const userId = req.user.id;

    // 1. Resolve Destination Profile (Archetype, Live Weather, Climate, Localized Themes)
    const destinationProfile = await getDestinationProfile(destination);
    const isHotClimate =
      destinationProfile.archetype === "tropical_beach" ||
      (destinationProfile.weather && destinationProfile.weather.temp >= 26);

    // Fetch user items (check available first, fallback to all user items)
    let wardrobeModels = await ClothingItem.findAll({
      where: { userId, status: "available" },
    });

    if (wardrobeModels.length < 3) {
      wardrobeModels = await ClothingItem.findAll({
        where: { userId },
      });
    }

    if (wardrobeModels.length < 3) {
      return res.status(400).json({
        message: "You need at least 3 items in your wardrobe to generate a travel capsule.",
      });
    }

    const allItems = wardrobeModels.map(cleanItem);

    // Group items by category
    const categorized = {
      tops: [],
      bottoms: [],
      shoes: [],
      outers: [],
      fullBodies: [],
      accessories: [],
    };

    for (const item of allItems) {
      const cat = categorizeItem(item);
      if (cat === "top") categorized.tops.push(item);
      else if (cat === "bottom") categorized.bottoms.push(item);
      else if (cat === "footwear") categorized.shoes.push(item);
      else if (cat === "outerwear") categorized.outers.push(item);
      else if (cat === "fullBody") categorized.fullBodies.push(item);
      else if (cat === "accessory") categorized.accessories.push(item);
    }

    // Sort items within each category by relevance score with destination archetype bias
    for (const catKey of Object.keys(categorized)) {
      categorized[catKey].sort(
        (a, b) =>
          scoreItem(
            b,
            vibe,
            season,
            destinationProfile.archetype,
            destinationProfile.weather?.temp
          ) -
          scoreItem(
            a,
            vibe,
            season,
            destinationProfile.archetype,
            destinationProfile.weather?.temp
          )
      );
    }

    // Allocation ratios
    const targetTopsCount = Math.min(Math.max(2, Math.ceil(days * 0.7)), categorized.tops.length);
    const targetBottomsCount = Math.min(Math.max(2, Math.ceil(days * 0.4)), categorized.bottoms.length);
    const targetShoesCount = Math.min(2, categorized.shoes.length);

    // For tropical beach or warm weather, don't force outerwear if user outer pieces are heavy coats/blazers
    let targetOutersCount = Math.min(Math.max(1, Math.ceil(days / 4)), categorized.outers.length);
    if (isHotClimate && categorized.outers.length > 0) {
      const topOuterScore = scoreItem(
        categorized.outers[0],
        vibe,
        season,
        destinationProfile.archetype,
        destinationProfile.weather?.temp
      );
      if (destinationProfile.archetype === "tropical_beach" || topOuterScore < 0) {
        targetOutersCount = 0;
      }
    }

    const targetFullBodiesCount = categorized.fullBodies.length > 0 ? 1 : 0;
    const targetAccessoriesCount = Math.min(2, categorized.accessories.length);

    const capsuleTops = categorized.tops.slice(0, Math.max(1, targetTopsCount));
    const capsuleBottoms = categorized.bottoms.slice(0, Math.max(1, targetBottomsCount));
    const capsuleShoes = categorized.shoes.slice(0, targetShoesCount);
    const capsuleOuters = categorized.outers.slice(0, targetOutersCount);
    const capsuleFullBodies = categorized.fullBodies.slice(0, targetFullBodiesCount);
    const capsuleAccessories = categorized.accessories.slice(0, targetAccessoriesCount);

    // If user has no tops/bottoms but has dresses, ensure dress is selected
    if (capsuleTops.length === 0 && capsuleBottoms.length === 0 && categorized.fullBodies.length > 0) {
      capsuleFullBodies.push(...categorized.fullBodies.slice(0, Math.min(days, categorized.fullBodies.length)));
    }

    // Combine all packed items
    const capsuleMap = new Map();
    [
      ...capsuleTops,
      ...capsuleBottoms,
      ...capsuleShoes,
      ...capsuleOuters,
      ...capsuleFullBodies,
      ...capsuleAccessories,
    ].forEach((item) => {
      capsuleMap.set(item.id, { ...item, packed: false });
    });

    const capsuleItems = Array.from(capsuleMap.values());

    // Build Day 1 to Day `days` Itinerary
    const itineraryThemes =
      destinationProfile.dayThemes && destinationProfile.dayThemes.length > 0
        ? destinationProfile.dayThemes
        : DAY_THEMES;

    const itinerary = [];
    for (let i = 0; i < days; i++) {
      const dayNum = i + 1;
      const theme = itineraryThemes[i % itineraryThemes.length];

      // Outerwear layering: only consider if cool season or evening event
      const isEvening = /sunset|evening|night/i.test(theme);
      const isCoolSeason = ["winter", "autumn"].includes((season || "").toLowerCase());
      // For tropical_beach or when weather.temp >= 26: Default outerwear to null for daytime looks (no hot jackets in Goa!)
      const shouldConsiderOuterwear = isHotClimate
        ? false
        : (isCoolSeason || isEvening) && capsuleOuters.length > 0;

      // Decide if day features a full body dress/jumpsuit
      const useFullBody =
        capsuleFullBodies.length > 0 &&
        (capsuleTops.length === 0 ||
          capsuleBottoms.length === 0 ||
          dayNum === 4 ||
          (days > 4 && dayNum % 4 === 0));

      let chosenTop = null;
      let chosenBottom = null;
      let chosenFullBody = null;
      let chosenFootwear = null;
      let chosenOuterwear = null;

      if (useFullBody && capsuleFullBodies.length > 0) {
        const shoeCandidates = capsuleShoes.length > 0 ? capsuleShoes : [null];
        const outerCandidates = shouldConsiderOuterwear ? [...capsuleOuters, null] : [null];

        let found = false;
        for (let fi = 0; fi < capsuleFullBodies.length; fi++) {
          const fb = capsuleFullBodies[(i + fi) % capsuleFullBodies.length];
          for (let si = 0; si < shoeCandidates.length; si++) {
            const sh = shoeCandidates[(i + si) % shoeCandidates.length];
            for (let oi = 0; oi < outerCandidates.length; oi++) {
              const ot = outerCandidates[(i + oi) % outerCandidates.length];
              if (isCompatibleOutfit(null, null, fb, sh, ot, season, vibe)) {
                chosenFullBody = fb;
                chosenFootwear = sh;
                chosenOuterwear = ot;
                found = true;
                break;
              }
            }
            if (found) break;
          }
          if (found) break;
        }

        if (!found) {
          chosenFullBody = capsuleFullBodies[i % capsuleFullBodies.length];
          chosenFootwear = capsuleShoes.length > 0 ? capsuleShoes[i % capsuleShoes.length] : null;
          chosenOuterwear = null;
        }
      } else {
        const topCandidates = capsuleTops.length > 0 ? capsuleTops : [null];
        const bottomCandidates = capsuleBottoms.length > 0 ? capsuleBottoms : [null];
        const shoeCandidates = capsuleShoes.length > 0 ? capsuleShoes : [null];
        const outerCandidates = shouldConsiderOuterwear ? [...capsuleOuters, null] : [null];

        let found = false;
        for (let ti = 0; ti < topCandidates.length; ti++) {
          const tp = topCandidates[(i + ti) % topCandidates.length];
          for (let bi = 0; bi < bottomCandidates.length; bi++) {
            const bt = bottomCandidates[(Math.floor(i / 2) + bi) % bottomCandidates.length];
            for (let si = 0; si < shoeCandidates.length; si++) {
              const sh = shoeCandidates[(i + si) % shoeCandidates.length];
              for (let oi = 0; oi < outerCandidates.length; oi++) {
                const ot = outerCandidates[(i + oi) % outerCandidates.length];
                if (isCompatibleOutfit(tp, bt, null, sh, ot, season, vibe)) {
                  chosenTop = tp;
                  chosenBottom = bt;
                  chosenFootwear = sh;
                  chosenOuterwear = ot;
                  found = true;
                  break;
                }
              }
              if (found) break;
            }
            if (found) break;
          }
          if (found) break;
        }

        // Fallback without outerwear if no combination with outer was compatible
        if (!found) {
          for (let ti = 0; ti < topCandidates.length; ti++) {
            const tp = topCandidates[(i + ti) % topCandidates.length];
            for (let bi = 0; bi < bottomCandidates.length; bi++) {
              const bt = bottomCandidates[(Math.floor(i / 2) + bi) % bottomCandidates.length];
              for (let si = 0; si < shoeCandidates.length; si++) {
                const sh = shoeCandidates[(i + si) % shoeCandidates.length];
                if (isCompatibleOutfit(tp, bt, null, sh, null, season, vibe)) {
                  chosenTop = tp;
                  chosenBottom = bt;
                  chosenFootwear = sh;
                  chosenOuterwear = null;
                  found = true;
                  break;
                }
              }
              if (found) break;
            }
            if (found) break;
          }
        }

        // Ultimate fallback
        if (!found) {
          chosenTop = capsuleTops.length > 0 ? capsuleTops[i % capsuleTops.length] : null;
          chosenBottom = capsuleBottoms.length > 0 ? capsuleBottoms[Math.floor(i / 2) % capsuleBottoms.length] : null;
          chosenFootwear = capsuleShoes.length > 0 ? capsuleShoes[i % capsuleShoes.length] : null;
          chosenOuterwear = null;
          if (!chosenTop && !chosenBottom && capsuleFullBodies.length > 0) {
            chosenFullBody = capsuleFullBodies[i % capsuleFullBodies.length];
          }
        }
      }

      // Default outerwear to null for tropical beach and warm daytime looks
      if (isHotClimate || destinationProfile.archetype === "tropical_beach") {
        chosenOuterwear = null;
      }

      const accessory =
        capsuleAccessories.length > 0
          ? capsuleAccessories[i % capsuleAccessories.length]
          : null;

      itinerary.push({
        day: dayNum,
        theme,
        outfit: {
          top: chosenTop,
          bottom: chosenBottom,
          fullBody: chosenFullBody,
          footwear: chosenFootwear,
          outerwear: chosenOuterwear,
          accessory,
        },
      });
    }

    // Compute versatility metrics
    const sepCombos =
      capsuleTops.length * capsuleBottoms.length * Math.max(1, capsuleShoes.length);
    const fullCombos = capsuleFullBodies.length * Math.max(1, capsuleShoes.length);
    const possibleOutfits = Math.max(1, sepCombos + fullCombos);

    const metrics = {
      totalPacked: capsuleItems.length,
      totalDays: days,
      possibleOutfits,
      destinationProfile,
    };

    return res.status(200).json({
      destination: destination.trim(),
      destinationProfile,
      days,
      vibe,
      season,
      capsuleItems,
      itinerary,
      metrics,
    });
  } catch (error) {
    console.error("generateCapsule error:", error);
    return res.status(500).json({
      message: error.message || "Failed to generate travel capsule.",
    });
  }
};

/**
 * Rerolls an outfit for a specific day strictly using items in the suitcase capsule
 */
const rerollSlot = async (req, res) => {
  try {
    const {
      capsuleItemIds,
      currentOutfit = {},
      dayIndex = 0,
      vibe = "vacation",
      season = "summer",
      destination = "",
    } = req.body;
    let availableItems = [];

    const destinationProfile = destination ? await getDestinationProfile(destination) : null;
    const isHotClimate =
      destinationProfile &&
      (destinationProfile.archetype === "tropical_beach" ||
        (destinationProfile.weather && destinationProfile.weather.temp >= 26));

    if (Array.isArray(capsuleItemIds) && capsuleItemIds.length > 0) {
      const fetched = await ClothingItem.findAll({
        where: {
          id: { [Op.in]: capsuleItemIds },
          userId: req.user.id,
        },
      });
      availableItems = fetched.map(cleanItem);
    } else if (Array.isArray(req.body.capsuleItems) && req.body.capsuleItems.length > 0) {
      availableItems = req.body.capsuleItems.map(cleanItem);
    }

    if (availableItems.length === 0) {
      return res.status(400).json({ message: "No capsule items provided for reroll." });
    }

    const tops = [];
    const bottoms = [];
    const shoes = [];
    const outers = [];
    const fullBodies = [];
    const accessories = [];

    for (const item of availableItems) {
      const cat = categorizeItem(item);
      if (cat === "top") tops.push(item);
      else if (cat === "bottom") bottoms.push(item);
      else if (cat === "footwear") shoes.push(item);
      else if (cat === "outerwear") outers.push(item);
      else if (cat === "fullBody") fullBodies.push(item);
      else if (cat === "accessory") accessories.push(item);
    }

    const currentTopId = currentOutfit?.top?.id;
    const currentBottomId = currentOutfit?.bottom?.id;
    const currentFullId = currentOutfit?.fullBody?.id;
    const currentShoeId = currentOutfit?.footwear?.id;
    const currentOuterId = currentOutfit?.outerwear?.id;
    const currentAccId = currentOutfit?.accessory?.id;

    let newTop = null;
    let newBottom = null;
    let newFullBody = null;
    let newFootwear = null;
    let newOuterwear = null;
    let newAccessory = null;

    const hasFull = fullBodies.length > 0;
    const hasSeparates = tops.length > 0 && bottoms.length > 0;

    // Helper to shuffle array shallowly
    const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

    // Filter prioritizing items different from current
    const prioritizeAlts = (list, currentId) => {
      const alts = list.filter((x) => x.id !== currentId);
      return alts.length > 0 ? [...shuffle(alts), ...list.filter((x) => x.id === currentId)] : list;
    };

    const tryDresses = hasFull && (currentTopId || Math.random() > 0.6);
    let matched = false;

    if (tryDresses || !hasSeparates) {
      const fbList = prioritizeAlts(fullBodies, currentFullId);
      const shList = prioritizeAlts(shoes, currentShoeId);
      const otList = prioritizeAlts(outers, currentOuterId);
      const outerOptions = isHotClimate ? [null] : [...otList, null];

      for (const fb of fbList) {
        for (const sh of (shList.length > 0 ? shList : [null])) {
          for (const ot of outerOptions) {
            if (isCompatibleOutfit(null, null, fb, sh, ot, season, vibe)) {
              newFullBody = fb;
              newFootwear = sh;
              newOuterwear = isHotClimate ? null : ot;
              matched = true;
              break;
            }
          }
          if (matched) break;
        }
        if (matched) break;
      }
    }

    if (!matched && hasSeparates) {
      const tpList = prioritizeAlts(tops, currentTopId);
      const btList = prioritizeAlts(bottoms, currentBottomId);
      const shList = prioritizeAlts(shoes, currentShoeId);
      const otList = prioritizeAlts(outers, currentOuterId);
      const outerOptions = isHotClimate ? [null] : [...otList, null];

      for (const tp of tpList) {
        for (const bt of btList) {
          for (const sh of (shList.length > 0 ? shList : [null])) {
            for (const ot of outerOptions) {
              if (isCompatibleOutfit(tp, bt, null, sh, ot, season, vibe)) {
                newTop = tp;
                newBottom = bt;
                newFootwear = sh;
                newOuterwear = isHotClimate ? null : ot;
                matched = true;
                break;
              }
            }
            if (matched) break;
          }
          if (matched) break;
        }
        if (matched) break;
      }
    }

    if (!matched) {
      // Fallback: pick base pieces with null outerwear
      newTop = tops[0] || null;
      newBottom = bottoms[0] || null;
      newFullBody = (!newTop && !newBottom && fullBodies[0]) ? fullBodies[0] : null;
      newFootwear = shoes[0] || null;
      newOuterwear = null;
    }

    if (isHotClimate) {
      newOuterwear = null;
    }

    // Accessory
    if (accessories.length > 0) {
      const altAccs = accessories.filter((a) => a.id !== currentAccId);
      newAccessory = altAccs.length > 0 ? altAccs[Math.floor(Math.random() * altAccs.length)] : accessories[0];
    }

    const updatedOutfit = {
      top: newTop,
      bottom: newBottom,
      fullBody: newFullBody,
      footwear: newFootwear,
      outerwear: newOuterwear,
      accessory: newAccessory,
    };

    return res.status(200).json({ updatedOutfit });
  } catch (error) {
    console.error("rerollSlot error:", error);
    return res.status(500).json({ message: "Failed to reroll outfit." });
  }
};

/**
 * Swaps a single garment slot in an outfit with a selected piece or clears the slot
 */
const swapPiece = async (req, res) => {
  try {
    const { currentOutfit, slotName, newItemId, remove } = req.body;

    if (remove === true || newItemId === null) {
      const updatedOutfit = { ...currentOutfit, [slotName]: null };
      return res.status(200).json({ updatedOutfit });
    }

    if (!newItemId) {
      return res.status(400).json({ message: "newItemId is required." });
    }

    const itemModel = await ClothingItem.findOne({
      where: { id: newItemId, userId: req.user.id },
    });

    if (!itemModel) {
      return res.status(404).json({ message: "Item not found in wardrobe." });
    }

    const newItem = cleanItem(itemModel);
    const cat = categorizeItem(newItem);
    const updatedOutfit = { ...currentOutfit };

    if (cat === "fullBody") {
      updatedOutfit.fullBody = newItem;
      updatedOutfit.top = null;
      updatedOutfit.bottom = null;
    } else if (slotName === "fullBody" && cat === "top") {
      updatedOutfit.top = newItem;
      updatedOutfit.fullBody = null;
    } else if (slotName === "fullBody" && cat === "bottom") {
      updatedOutfit.bottom = newItem;
      updatedOutfit.fullBody = null;
    } else {
      updatedOutfit[slotName] = newItem;
    }

    return res.status(200).json({ updatedOutfit });
  } catch (error) {
    console.error("swapPiece error:", error);
    return res.status(500).json({ message: "Failed to swap item." });
  }
};

/**
 * Persists a capsule trip into the database
 */
const saveTrip = async (req, res) => {
  try {
    const {
      destination,
      days,
      vibe,
      season,
      capsuleItems,
      itinerary,
      metrics,
      destinationProfile,
    } = req.body;

    if (!destination || !days || !capsuleItems || !itinerary) {
      return res.status(400).json({ message: "Missing required trip fields." });
    }

    const tripMetrics = {
      ...(metrics || {
        totalPacked: capsuleItems.length,
        totalDays: days,
        possibleOutfits: 0,
      }),
      destinationProfile: destinationProfile || metrics?.destinationProfile || null,
    };

    const trip = await CapsuleTrip.create({
      userId: req.user.id,
      destination: String(destination).trim(),
      days: parseInt(days, 10),
      vibe: String(vibe || "vacation").trim(),
      season: String(season || "summer").trim(),
      capsuleItems,
      itinerary,
      metrics: tripMetrics,
    });

    return res.status(201).json({
      message: "Trip saved successfully",
      trip,
    });
  } catch (error) {
    console.error("saveTrip error:", error);
    return res.status(500).json({ message: "Failed to save trip." });
  }
};

/**
 * Retrieves all saved trips for the authenticated user
 */
const getMyTrips = async (req, res) => {
  try {
    const trips = await CapsuleTrip.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({ trips });
  } catch (error) {
    console.error("getMyTrips error:", error);
    return res.status(500).json({ message: "Failed to fetch saved trips." });
  }
};

/**
 * Deletes a saved trip by id
 */
const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;

    const count = await CapsuleTrip.destroy({
      where: { id, userId: req.user.id },
    });

    if (!count) {
      return res.status(404).json({ message: "Trip not found." });
    }

    return res.status(200).json({ message: "Trip deleted successfully." });
  } catch (error) {
    console.error("deleteTrip error:", error);
    return res.status(500).json({ message: "Failed to delete trip." });
  }
};

module.exports = {
  getDestinationProfile,
  generateCapsule,
  rerollSlot,
  swapPiece,
  saveTrip,
  getMyTrips,
  deleteTrip,
};
