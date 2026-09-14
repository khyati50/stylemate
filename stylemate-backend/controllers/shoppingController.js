const ClothingItem = require("../models/ClothingItem");
const UserPreferences = require("../models/UserPreferences");
const https = require("https");

const fs = require("fs");
const path = require("path");

// Persistent + In-Memory Cache: saves SerpAPI results to disk and memory
// 7-day TTL protects your 100 free SerpAPI searches/month from being depleted.
// Identical queries across all users and page refreshes use 0 API credits!
const CACHE_FILE = path.join(__dirname, "../data/serpapi_cache.json");
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const queryCache = new Map();

// Initialize cache from disk on startup
try {
  if (fs.existsSync(CACHE_FILE)) {
    const raw = fs.readFileSync(CACHE_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    const now = Date.now();
    for (const [k, v] of Object.entries(parsed)) {
      if (v && v.expiresAt && v.expiresAt > now) {
        queryCache.set(k.toLowerCase(), v);
      }
    }
    console.log(`[ShoppingAdvisor] Loaded ${queryCache.size} cached search queries from disk.`);
  }
} catch (e) {
  console.warn("[ShoppingAdvisor] Could not load serpapi cache from disk:", e.message);
}

function saveCacheToDisk() {
  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const obj = {};
    for (const [k, v] of queryCache.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(obj, null, 2), "utf-8");
  } catch (e) {
    console.warn("[ShoppingAdvisor] Could not save cache to disk:", e.message);
  }
}


/**
 * Detects user gender based on wardrobe items
 * - Feminine indicators:
 *   - category === 'full_body' or 'Full Body'
 *   - name contains: dress, skirt, heel, saree, lehenga, blouse, gown, strappy, earrings
 * - Masculine indicators:
 *   - name contains: cuban, polo, boxers, men, derby, mojari
 * If feminineCount > masculineCount return 'women', otherwise return 'men'.
 */
function detectUserGender(wardrobe) {
  if (!wardrobe || wardrobe.length === 0) return "women";

  let feminineCount = 0;
  let masculineCount = 0;

  const feminineKeywords = [
    "dress",
    "skirt",
    "heel",
    "saree",
    "lehenga",
    "blouse",
    "gown",
    "strappy",
    "earrings",
  ];
  const masculineKeywords = [
    "cuban",
    "polo",
    "boxers",
    "men",
    "derby",
    "mojari",
  ];

  for (const item of wardrobe) {
    const cat = (item.category || "").toLowerCase();
    const name = (item.name || "").toLowerCase();

    if (cat === "full_body" || cat === "full body") {
      feminineCount++;
    }

    if (feminineKeywords.some((kw) => name.includes(kw))) {
      feminineCount++;
    }

    if (masculineKeywords.some((kw) => name.includes(kw))) {
      masculineCount++;
    }
  }

  if (feminineCount > masculineCount) {
    return "women";
  }
  return "men";
}

// Helper: parse JSON arrays from DB
function ensureArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return val.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    }
  }
  return [val];
}

/** Parses "Rs.4,999" -> 4999 for price cap filtering */
function parsePrice(priceStr) {
  if (!priceStr) return 0;
  const num = parseFloat(String(priceStr).replace(/[^0-9.]/g, ""));
  return isNaN(num) ? 0 : num;
}

/**
 * Calls SerpAPI Google Shopping with persistent 7-day caching.
 * If query was executed previously, returns results instantly with 0 SerpAPI credits used!
 */
function serpApiSearch(query, maxResults = 3) {
  const normalizedKey = query.trim().toLowerCase();
  const cached = queryCache.get(normalizedKey);

  // Cache HIT: return cached results immediately, burning 0 credits
  if (cached && cached.expiresAt > Date.now() && Array.isArray(cached.results) && cached.results.length > 0) {
    console.log(`[SerpAPI Cache HIT] 0 credits used for: "${query}"`);
    return Promise.resolve(cached.results.slice(0, maxResults));
  }

  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) throw new Error("SERPAPI_KEY is not configured in .env");

  const params = new URLSearchParams({
    engine: "google_shopping",
    q: query,
    gl: "in",
    hl: "en",
    num: "10",
    api_key: apiKey,
  });

  const url = "https://serpapi.com/search.json?" + params.toString();

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(raw);
          if (json.error) {
            // If API errored (e.g. rate limit/quota reached) but we have stale cache, use it!
            if (cached && Array.isArray(cached.results) && cached.results.length > 0) {
              console.warn(`[SerpAPI Warning] API error (${json.error}), falling back to cached results for: "${query}"`);
              return resolve(cached.results.slice(0, maxResults));
            }
            return reject(new Error(json.error));
          }

          const results = (json.shopping_results || [])
            .filter(
              (item) =>
                item.thumbnail &&
                item.title &&
                parsePrice(item.price) <= 15000
            )
            .slice(0, 6) // store up to 6 in cache for future depth
            .map((item) => ({
              title: item.title,
              source: item.source || "Online Store",
              link: item.product_link || item.link || null,
              price: item.price || "Price not listed",
              thumbnail: item.thumbnail,
              rating: item.rating || null,
              reviews: item.reviews || null,
            }));

          if (results.length > 0) {
            // Save to persistent cache
            queryCache.set(normalizedKey, {
              results,
              expiresAt: Date.now() + CACHE_TTL_MS,
            });
            saveCacheToDisk();
            console.log(`[SerpAPI Live Call] Cached ${results.length} items for: "${query}"`);
          } else if (cached && Array.isArray(cached.results)) {
            return resolve(cached.results.slice(0, maxResults));
          }

          resolve(results.slice(0, maxResults));
        } catch (e) {
          if (cached && Array.isArray(cached.results) && cached.results.length > 0) {
            return resolve(cached.results.slice(0, maxResults));
          }
          reject(e);
        }
      });
      res.on("error", (err) => {
        if (cached && Array.isArray(cached.results) && cached.results.length > 0) {
          console.warn(`[SerpAPI Network Error] Falling back to cached results for: "${query}"`);
          return resolve(cached.results.slice(0, maxResults));
        }
        reject(err);
      });
    }).on("error", (err) => {
      if (cached && Array.isArray(cached.results) && cached.results.length > 0) {
        return resolve(cached.results.slice(0, maxResults));
      }
      reject(err);
    });
  });
}


/**
 * Each gap:
 *   id          - unique string key
 *   label       - human-readable label shown in UI
 *   type        - matches filter pill: "layers" | "shoes" | "staples" | "occasions"
 *   detectGap   - (wardrobe, gender) => boolean. True = user is MISSING this item.
 *   buildQuery  - (gender, favoriteColors) => string. Returns SerpAPI search query.
 */
const GAP_DEFINITIONS = [
  // LAYERS
  {
    id: "blazer",
    label: "Blazers & Structure",
    type: "layers",
    detectGap: (w, _g) => !w.some((i) => /blazer|suit jacket/i.test(i.name)),
    buildQuery: (gender, colors) => {
      const safeColors = ["black", "white", "beige", "navy", "grey", "cream"];
      const color = colors.find((c) => safeColors.includes(c.toLowerCase())) || "beige";
      return gender === "women" ? `women ${color} blazer` : `men ${color} blazer`;
    },
  },
  {
    id: "bomber_jacket",
    label: "Casual Outerwear",
    type: "layers",
    detectGap: (w, _g) => !w.some((i) => /bomber|jacket|cardigan|coat/i.test(i.name)),
    buildQuery: (gender, _colors) =>
      gender === "women" ? "women bomber jacket" : "men bomber jacket",
  },

  // SHOES
  {
    id: "white_sneakers",
    label: "Everyday Sneakers",
    type: "shoes",
    detectGap: (w, _g) =>
      !w.some(
        (i) =>
          /sneaker/i.test(i.name) &&
          (i.colors || []).some((c) => /white/i.test(c))
      ),
    buildQuery: (gender, _colors) =>
      gender === "women" ? "women white sneakers" : "men white sneakers",
  },
  {
    id: "loafers",
    label: "Smart Loafers",
    type: "shoes",
    detectGap: (w, _g) => !w.some((i) => /loafer|mojari/i.test(i.name)),
    buildQuery: (gender, _colors) =>
      gender === "women" ? "women loafers" : "men loafers",
  },
  {
    id: "heels",
    label: "Evening Heels",
    type: "shoes",
    detectGap: (w, gender) =>
      gender === "women" && !w.some((i) => /heel/i.test(i.name)),
    buildQuery: (_gender, _colors) => "women block heels",
  },

  // STAPLES
  {
    id: "linen_shirt",
    label: "Linen Shirt",
    type: "staples",
    detectGap: (w, _g) =>
      !w.some((i) => /linen/i.test(i.name) && /shirt/i.test(i.name)),
    buildQuery: (gender, _colors) =>
      gender === "women" ? "women linen shirt" : "men linen shirt",
  },
  {
    id: "chinos_trousers",
    label: "Tailored Trousers",
    type: "staples",
    detectGap: (w, _g) => !w.some((i) => /chino|trouser/i.test(i.name)),
    buildQuery: (gender, _colors) =>
      gender === "women" ? "women wide leg trousers" : "men chinos",
  },
  {
    id: "dark_jeans",
    label: "Dark Denim Jeans",
    type: "staples",
    detectGap: (w, _g) => !w.some((i) => /jean/i.test(i.name)),
    buildQuery: (gender, _colors) =>
      gender === "women" ? "women dark blue jeans" : "men dark blue jeans",
  },

  // OCCASIONS
  {
    id: "slip_dress",
    label: "Slip Dress",
    type: "occasions",
    detectGap: (w, gender) =>
      gender === "women" && !w.some((i) => /dress|slip/i.test(i.name)),
    buildQuery: (_gender, colors) => {
      const safeColors = ["black", "white", "beige", "red", "pink", "green", "blue", "grey"];
      const color = colors.find((c) => safeColors.includes(c.toLowerCase())) || "black";
      return `women ${color} satin slip dress`;
    },
  },
  {
    id: "crossbody_bag",
    label: "Everyday Bag",
    type: "occasions",
    detectGap: (w, _g) => !w.some((i) => /bag/i.test(i.name)),
    buildQuery: (gender, _colors) =>
      gender === "women" ? "women crossbody bag" : "men sling bag",
  },
];

/**
 * GET /api/shopping/recommendations
 * Returns SerpAPI-powered real product recommendations grouped by wardrobe gap.
 */
const getShoppingRecommendations = async (req, res) => {
  try {
    // Guard: SERPAPI_KEY
    if (!process.env.SERPAPI_KEY) {
      return res.status(503).json({
        message:
          "SERPAPI_KEY is not configured. Please add it to the .env file and restart the server.",
        missingKey: true,
      });
    }

    const userId = req.user.id;
    const filter = (req.query.filter || "all").toLowerCase();
    const naturalFabricsOnly =
      req.query.naturalFabricsOnly === "true" ||
      req.query.qualityTier === "natural_fabrics";

    // 1. Fetch wardrobe
    let wardrobeModels = await ClothingItem.findAll({
      where: { userId, status: "available" },
    });
    let wardrobe = wardrobeModels.map((i) => (i.toJSON ? i.toJSON() : i));
    if (wardrobe.length === 0) {
      wardrobeModels = await ClothingItem.findAll({ where: { userId } });
      wardrobe = wardrobeModels.map((i) => (i.toJSON ? i.toJSON() : i));
    }

    // 2. Fetch preferences
    const userPrefs = await UserPreferences.findOne({ where: { userId } });
    const favoriteColors = ensureArray(userPrefs?.favoriteColors);

    // 3. Gender detection
    const detectedGender = detectUserGender(wardrobe);
    let selectedGender = (req.query.gender || "").toLowerCase();
    if (selectedGender !== "women" && selectedGender !== "men") {
      selectedGender = detectedGender;
    }

    // 4. Wardrobe audit booleans
    const hasBlazer = wardrobe.some((i) => /blazer|suit jacket/i.test(i.name));
    const hasWhiteSneakers = wardrobe.some(
      (i) =>
        /sneaker/i.test(i.name) &&
        (i.colors || []).some((c) => /white/i.test(c))
    );
    const hasLoafers = wardrobe.some((i) => /loafer|mojari/i.test(i.name));
    const hasLinenShirt = wardrobe.some(
      (i) => /linen/i.test(i.name) && /shirt/i.test(i.name)
    );
    const hasChinos = wardrobe.some((i) => /chino|trouser/i.test(i.name));
    const hasDarkJeans = wardrobe.some((i) => /jean/i.test(i.name));
    const hasDress = wardrobe.some((i) => /dress|slip/i.test(i.name));
    const hasHeels = wardrobe.some((i) => /heel/i.test(i.name));
    const hasBag = wardrobe.some((i) => /bag/i.test(i.name));

    const wardrobeAudit = {
      totalItems: wardrobe.length,
      hasBlazer,
      hasWhiteSneakers,
      hasLoafers,
      hasLinenShirt,
      hasChinos,
      hasDarkJeans,
      hasDress,
      hasHeels,
      hasBag,
    };

    // 5. Determine active gaps
    let activeGaps = GAP_DEFINITIONS.filter((gap) => {
      if (filter !== "all" && gap.type !== filter) return false;
      return gap.detectGap(wardrobe, selectedGender);
    });

    // Fallback: if user has everything, show all items for the selected filter
    if (activeGaps.length === 0) {
      activeGaps = GAP_DEFINITIONS.filter((gap) => {
        if (filter !== "all" && gap.type !== filter) return false;
        return true;
      });
    }

    // Cap at top 4 gaps max to conserve SerpAPI free tier quota
    activeGaps = activeGaps.slice(0, 4);

    // 6. Build queries and fetch from SerpAPI in parallel
    const gapQueries = activeGaps.map((gap) => ({
      gap,
      query: gap.buildQuery(selectedGender, favoriteColors),
    }));

    const searchResults = await Promise.allSettled(
      gapQueries.map(({ query }) => serpApiSearch(query, 3))
    );

    // 7. Assemble response
    const recommendations = [];
    for (let i = 0; i < gapQueries.length; i++) {
      const { gap, query } = gapQueries[i];
      const result = searchResults[i];

      let products = [];
      if (result.status === "fulfilled") {
        products = result.value;
      }
      // Skip gaps where SerpAPI returned no valid products
      if (products.length === 0) continue;

      recommendations.push({
        gapCategory: gap.id,
        gapLabel: gap.label,
        gapType: gap.type,
        searchQuery: query,
        products,
      });
    }

    return res.status(200).json({
      gender: selectedGender,
      detectedGender,
      selectedGender,
      wardrobeAudit,
      totalWardrobeCount: wardrobe.length,
      recommendations,
      filtersApplied: {
        filter,
        naturalFabricsOnly,
        gender: selectedGender,
      },
    });
  } catch (error) {
    console.error("Shopping Recommendations Error:", error);
    return res.status(500).json({
      message: error.message || "Failed to load shopping recommendations",
    });
  }
};

/**
 * POST /api/shopping/mark-bought
 * 1-Click Wardrobe Addition when user marks an item as purchased
 */
const markBought = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      category = "tops",
      colors = [],
      styles = [],
      seasons = [],
      occasions = [],
      imageUrl,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Item name is required.",
      });
    }

    // Ensure array format for JSON fields
    const toArray = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val === "string") {
        return val
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);
      }
      return [val];
    };

    const colorsArray = toArray(colors);
    const stylesArray = toArray(styles);
    const seasonsArray = toArray(seasons);
    const occasionsArray = toArray(occasions);

    const safeImageUrl =
      imageUrl && imageUrl.trim().length > 0
        ? imageUrl.trim()
        : "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=80";

    const newItem = await ClothingItem.create({
      userId,
      name,
      category,
      colors: colorsArray,
      styles: stylesArray,
      seasons: seasonsArray,
      occasions: occasionsArray,
      imageUrl: safeImageUrl,
      status: "available",
    });

    return res.status(201).json({
      message: "Item successfully added to your wardrobe!",
      item: newItem,
    });
  } catch (error) {
    console.error("Mark Bought Error:", error);
    return res.status(500).json({
      message: error.message || "Failed to add purchased item to wardrobe",
    });
  }
};

module.exports = {
  getShoppingRecommendations,
  markBought,
};
