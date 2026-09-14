const { callLocalLlm, isLocalLlmAvailable } = require("./localLlmProvider");
const { getDynamicFashionAdvice } = require("./fashionAdvisor");

const SYSTEM_INSTRUCTION = `You are an expert AI fashion stylist and intent parser for StyleMate.
Extract structured outfit criteria from the user's message and prior conversation history.
Return ONLY valid JSON matching this schema:
{
  "intent": "outfit_recommendation" | "fashion_advice" | "chit_chat" | "clarification_needed",
  "conversational_response": string or null,
  "occasion": "casual" | "formal" | "office" | "party" | "wedding" | "college" | "date" | "interview" | "vacation" | null,
  "season": "summer" | "winter" | "spring" | "autumn" | null,
  "preferred_style": "casual" | "formal" | "smart" | "sporty" | "ethnic" | "streetwear" | null,
  "preferred_color": string or null,
  "time_of_day": "morning" | "afternoon" | "evening" | "night" | null,
  "weather_note": string or null
}

Intent Classification & Response Rules:
1. "outfit_recommendation": User asks for an outfit ("what should I wear to...", "outfit for tomorrow", "give me something casual", "style me for a date", "make it warmer"). Set "conversational_response": null.
2. "fashion_advice": User asks a general styling/fashion question ("can I wear sneakers with chinos?", "does navy go with black?", "what colors look good with olive?"). Provide a friendly, knowledgeable, concise response (2-3 sentences max) directly in "conversational_response"!
3. "chit_chat": User says friendly banter/greetings ("hello", "thanks", "looks great", "bye"). Provide a friendly, warm, concise response (1-2 sentences) directly in "conversational_response"!
4. "clarification_needed": User message is extremely vague with 0 context ("what should I wear?", "dress me", "help"). Provide a friendly prompt asking what occasion or vibe they are dressing for (1-2 sentences) directly in "conversational_response"!

Few-shot parsing rules:
- "I have a meeting tomorrow" -> intent: "outfit_recommendation", occasion: "office", preferred_style: "smart", conversational_response: null
- "Meeting friends for coffee" -> intent: "outfit_recommendation", occasion: "casual", preferred_style: "casual", conversational_response: null
- "Client presentation tomorrow morning" -> intent: "outfit_recommendation", occasion: "office", time_of_day: "morning", preferred_style: "formal", conversational_response: null
- "Wedding reception this weekend" -> intent: "outfit_recommendation", occasion: "wedding", preferred_style: "formal", conversational_response: null
- "Going on a date tonight" -> intent: "outfit_recommendation", occasion: "date", time_of_day: "night", preferred_style: "smart", conversational_response: null
- "Something comfortable for class/college" -> intent: "outfit_recommendation", occasion: "college", preferred_style: "casual", conversational_response: null
- "Can I wear sneakers with chinos?" -> intent: "fashion_advice", occasion: null, conversational_response: "Yes, absolutely! Low-profile, clean white or neutral sneakers pair great with chinos for a clean smart-casual look. Just keep the cuffs slightly tapered or rolled at the ankle."
- "Hello!" -> intent: "chit_chat", occasion: null, conversational_response: "Hello! I'm your StyleMate personal stylist. Tell me about your upcoming plans or event, and I'll style the perfect look from your wardrobe!"
- "What should I wear?" -> intent: "clarification_needed", occasion: null, conversational_response: "I'd love to help you style an outfit! What event or occasion are you heading to, and what's the vibe you're looking for?"
- If a field is not mentioned or inferred with high confidence, set it to null.`;

const OCCASIONS = {
  office: [
    "meeting",
    "meetings",
    "office",
    "workplace",
    "work",
    "presentation",
    "conference",
    "corporate",
    "business",
    "client",
    "professional",
    "zoom",
  ],
  interview: ["job interview", "interview", "hiring"],
  wedding: [
    "wedding",
    "reception",
    "sangeet",
    "mehendi",
    "haldi",
    "shaadi",
    "marriage",
  ],
  college: [
    "college",
    "university",
    "campus",
    "classes",
    "class",
    "lecture",
    "school",
  ],
  party: [
    "night out",
    "birthday",
    "celebration",
    "clubbing",
    "party",
    "club",
    "drinks",
    "cocktail",
    "bar",
  ],
  date: ["dinner date", "movie date", "romantic", "anniversary", "date"],
  formal: ["black tie", "formal", "gala", "ceremony", "suit"],
  vacation: [
    "vacation",
    "holiday",
    "trip",
    "beach",
    "resort",
    "traveling",
    "travel",
  ],
  cafe: ["cafe", "coffee", "brunch"],
  "get together": ["family gathering", "get together", "gettogether", "reunion"],
  casual: [
    "everyday",
    "hanging out",
    "hangout",
    "errands",
    "chill",
    "relaxed",
    "daily",
    "casual",
  ],
};

const STYLES = {
  smart: [
    "smart-casual",
    "smart casual",
    "business casual",
    "chic",
    "stylish",
    "smart",
  ],
  formal: ["dressy", "elegant", "formal"],
  sporty: ["sporty", "athletic", "gym", "workout", "training", "running"],
  ethnic: [
    "ethnic",
    "traditional",
    "indian",
    "desi",
    "kurta",
    "saree",
    "lehenga",
  ],
  streetwear: ["streetwear", "urban", "oversized", "baggy", "edgy"],
  casual: ["laid back", "relaxed", "simple", "casual"],
};

const COLORS = [
  "charcoal",
  "burgundy",
  "mustard",
  "emerald",
  "maroon",
  "purple",
  "orange",
  "yellow",
  "beige",
  "cream",
  "brown",
  "green",
  "white",
  "black",
  "olive",
  "navy",
  "blue",
  "grey",
  "gray",
  "pink",
  "tan",
  "red",
];

const SEASONS = {
  winter: ["freezing", "chilly", "winter", "cold", "snow", "warmer"],
  summer: ["summer", "sunny", "warm", "hot"],
  spring: ["spring", "mild"],
  autumn: ["autumn", "breezy", "crisp", "fall"],
};

const TIME_OF_DAY = {
  night: ["tonight", "evening", "dinner", "party", "night"],
  morning: ["breakfast", "brunch", "morning"],
  afternoon: ["afternoon", "lunch"],
};

const STARTING_INTENT_PHRASES = [
  "i have a",
  "i have an",
  "i am going to",
  "i'm going to",
  "what should i wear",
  "what can i wear",
  "what do i wear",
  "what to wear",
  "outfit for",
  "suggest an outfit",
  "give me an outfit",
  "recommend an outfit",
  "need an outfit",
  "find me an outfit",
  "how should i dress",
  "looking for an outfit",
];

/**
 * Checks if text contains a keyword with proper word boundaries.
 * @param {string} text - Normalized query string
 * @param {string} keyword - Word or phrase to match
 * @returns {boolean}
 */
function matchesKeyword(text, keyword) {
  if (!text || !keyword) return false;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, "i");
  return regex.test(text);
}

/**
 * Normalizes an occasion value to a system-valid occasion.
 */
function normalizeOccasion(occ) {
  if (!occ) return null;
  const o = occ.toLowerCase().trim();
  for (const [canonical, synonyms] of Object.entries(OCCASIONS)) {
    if (canonical === o || synonyms.includes(o)) {
      return canonical;
    }
  }
  return o;
}

/**
 * Normalizes a style value to a system-valid style.
 */
function normalizeStyle(sty) {
  if (!sty) return null;
  const s = sty.toLowerCase().trim();
  for (const [canonical, synonyms] of Object.entries(STYLES)) {
    if (canonical === s || synonyms.includes(s)) {
      return canonical;
    }
  }
  return s;
}

/**
 * Normalizes a season value to a system-valid season.
 */
function normalizeSeason(sea) {
  if (!sea) return null;
  const s = sea.toLowerCase().trim();
  for (const [canonical, synonyms] of Object.entries(SEASONS)) {
    if (canonical === s || synonyms.includes(s)) {
      return canonical;
    }
  }
  return s;
}

/**
 * Keyword-based fallback parser if Gemini API is unavailable or fails.
 * @param {string} text - User message text
 * @returns {Object} Structured context
 */
function fallbackParse(text) {
  const t = (text || "").toLowerCase().trim();

  // 1. Check fashion_advice
  // If text has question words like "does ... go with", "can i wear", "what matches", "how to style"
  const isFashionAdvice =
    !t.includes("what can i wear") &&
    !t.includes("what should i wear") &&
    !t.includes("what to wear") &&
    (/(?:does|do)\s+.+\s+(?:go\s+(?:well\s+)?with|match|pair)|can\s+(?:i|you)\s+(?:wear|pair|style)|should\s+(?:i|you)\s+(?:wear|pair|style)|what\s+(?:colors?|shades?|items?)?\s*(?:go(?:es)?\s+(?:well\s+)?with|match(?:es)?|pairs?\s+with)|how\s+(?:to\s+style|do\s+i\s+style|should\s+i\s+style)/i.test(
      t
    ) ||
      (t.includes("does ") &&
        (t.includes("go with") ||
          t.includes("match") ||
          t.includes("go well with"))) ||
      t.includes("can i wear") ||
      t.includes("can i pair") ||
      t.includes("what matches") ||
      t.includes("what goes with") ||
      t.includes("go well with") ||
      t.includes("how to style") ||
      t.includes("how do i style"));

  if (isFashionAdvice) {
    return {
      intent: "fashion_advice",
      conversational_response: getDynamicFashionAdvice(text),
      occasion: null,
      season: null,
      preferred_style: null,
      preferred_color: null,
      time_of_day: null,
      weather_note: null,
    };
  }

  // 2. Check chit_chat
  // If text is "hello", "hi", "hey", "thanks", "thank you"
  const isChitChat =
    /^(?:hello|hi|hey|hey\s+there|hello\s+there|thanks|thank\s+you|thx|bye|goodbye|looks\s+great|looks\s+good|cool|awesome)[!.]*$/i.test(
      t
    );

  if (isChitChat) {
    return {
      intent: "chit_chat",
      conversational_response:
        "Hello! I'm your StyleMate personal stylist. Tell me about your upcoming plans or event, and I'll style the perfect look from your wardrobe!",
      occasion: null,
      season: null,
      preferred_style: null,
      preferred_color: null,
      time_of_day: null,
      weather_note: null,
    };
  }

  // 3. Check clarification_needed
  // If text is very short/vague ("what should i wear", "dress me", "help me")
  const isClarificationNeeded =
    /^(?:what\s+should\s+i\s+wear|dress\s+me|help\s+me|help|style\s+me|what\s+to\s+wear|recommend\s+something|suggest\s+something)[?!.]*$/i.test(
      t
    );

  if (isClarificationNeeded) {
    return {
      intent: "clarification_needed",
      conversational_response:
        "I'd love to help you style an outfit! What event or occasion are you heading to, and what's the vibe you're looking for?",
      occasion: null,
      season: null,
      preferred_style: null,
      preferred_color: null,
      time_of_day: null,
      weather_note: null,
    };
  }

  // 4. Default to outfit_recommendation
  // Detect style modification phrases like "more casual please" or "make it formal"
  const isStyleModifier =
    /(?:more|make it|look|style|switch to)\s+(?:more\s+)?(casual|formal|smart|sporty|ethnic|streetwear)/i.test(
      t
    );

  let occasion = null;
  // If it's a style modifier modifying formality/casualness, don't treat the word as an occasion
  for (const [occ, synonyms] of Object.entries(OCCASIONS)) {
    if (isStyleModifier && (occ === "casual" || occ === "formal")) {
      continue;
    }
    for (const syn of synonyms) {
      if (matchesKeyword(t, syn)) {
        occasion = occ;
        break;
      }
    }
    if (occasion) break;
  }

  let season = null;
  for (const [sea, synonyms] of Object.entries(SEASONS)) {
    for (const syn of synonyms) {
      if (matchesKeyword(t, syn)) {
        season = sea;
        break;
      }
    }
    if (season) break;
  }

  let preferred_style = null;
  for (const [sty, synonyms] of Object.entries(STYLES)) {
    for (const syn of synonyms) {
      if (matchesKeyword(t, syn)) {
        preferred_style = sty;
        break;
      }
    }
    if (preferred_style) break;
  }

  let preferred_color = null;
  for (const col of COLORS) {
    if (matchesKeyword(t, col)) {
      preferred_color = col === "gray" ? "grey" : col;
      break;
    }
  }

  let time_of_day = null;
  for (const [tod, synonyms] of Object.entries(TIME_OF_DAY)) {
    for (const syn of synonyms) {
      if (matchesKeyword(t, syn)) {
        time_of_day = tod;
        break;
      }
    }
    if (time_of_day) break;
  }

  return {
    intent: "outfit_recommendation",
    conversational_response: null,
    occasion,
    season,
    preferred_style,
    preferred_color,
    time_of_day,
    weather_note: null,
  };
}

/**
 * Carry forward missing context fields from prior conversation turns.
 * Distinguishes between new primary intents and follow-up modifiers.
 *
 * @param {Object} current - Current parsed query object
 * @param {Array} history - Prior conversation history
 * @param {string} queryText - Raw user query message
 * @returns {Object} Enriched query object
 */
function carryForwardContext(current, history = [], queryText = "") {
  if (!Array.isArray(history) || history.length === 0) {
    return { ...current };
  }

  // If intent is not outfit_recommendation (e.g. fashion_advice, chit_chat, clarification_needed), do NOT carry forward outfit context
  if (current.intent && current.intent !== "outfit_recommendation") {
    return { ...current };
  }

  const q = (queryText || "").toLowerCase().trim();

  // Check if query is an explicit follow-up modifier
  const isExplicitFollowUp =
    /^(?:make it|more\b|less\b|try\b|something in|can you|could you|what about|how about|change\b|switch\b|just\b)/i.test(
      q
    ) ||
    /\binstead\b/i.test(q) ||
    /\bwarmer\b/i.test(q) ||
    /\bcooler\b/i.test(q);

  const hasStartingIntentPhrase = STARTING_INTENT_PHRASES.some((phrase) =>
    q.includes(phrase)
  );

  // A query is a new primary intent if:
  // 1. current.occasion is non-null (user specified a new occasion like meeting/office, wedding, party - NEVER carry forward previous occasion!)
  // 2. OR query text contains starting intent phrases ('i have a', 'what should i wear', etc.)
  // EXCEPT when it is clearly an explicit follow-up without a new occasion
  const isNewPrimaryIntent =
    (current.occasion !== null || hasStartingIntentPhrase) &&
    (!isExplicitFollowUp || current.occasion !== null);

  if (isNewPrimaryIntent) {
    // New primary intent: start fresh with the new query's context.
    // Do NOT carry forward occasion, preferred_style, or preferred_color!
    // Do NOT blindly pull previous query's winter/summer season!
    return {
      intent: current.intent || "outfit_recommendation",
      conversational_response: current.conversational_response || null,
      occasion: current.occasion || null,
      season: current.season || null,
      preferred_style: current.preferred_style || null,
      preferred_color: current.preferred_color || null,
      time_of_day: current.time_of_day || null,
      weather_note: current.weather_note || null,
    };
  }

  // Follow-up modifier: carry forward prior occasion and relevant context, updating only modified fields
  const result = {
    intent: current.intent || "outfit_recommendation",
    conversational_response: current.conversational_response || null,
    ...current,
  };
  const fields = [
    "occasion",
    "season",
    "preferred_style",
    "preferred_color",
    "time_of_day",
  ];

  for (const field of fields) {
    if (!result[field]) {
      for (let i = history.length - 1; i >= 0; i--) {
        const turn = history[i];
        if (turn?.parsed && turn.parsed[field]) {
          result[field] = turn.parsed[field];
          break;
        }
      }
    }
  }

  return result;
}

/**
 * Parses user query into structured fashion context using Gemini API with fallback.
 * @param {string} queryText - User's input message
 * @param {Array} history - Previous conversation turns
 * @returns {Promise<Object>} Structured query object
 */
async function parseUserQuery(queryText, history = []) {
  const provider = (process.env.LLM_PROVIDER || "gemini").toLowerCase().trim();
  let parsed = null;
  let isLocal = false;

  // 1. Check local open-source LLM if configured
  if (provider === "local") {
    try {
      const available = await isLocalLlmAvailable();
      if (available) {
        const localResult = await callLocalLlm(queryText, history);
        if (localResult && localResult.parsed_context) {
          const ctx = localResult.parsed_context;
          const validIntents = [
            "outfit_recommendation",
            "fashion_advice",
            "chit_chat",
            "clarification_needed",
          ];
          const parsedIntent = validIntents.includes(ctx.intent)
            ? ctx.intent
            : "outfit_recommendation";

          const conversationalResponse =
            parsedIntent !== "outfit_recommendation"
              ? localResult.stylist_response || ctx.conversational_response || null
              : null;

          parsed = {
            intent: parsedIntent,
            conversational_response: conversationalResponse,
            occasion: normalizeOccasion(
              ctx.occasion ? String(ctx.occasion).toLowerCase().trim() : null
            ),
            season: normalizeSeason(
              ctx.season ? String(ctx.season).toLowerCase().trim() : null
            ),
            preferred_style: normalizeStyle(
              ctx.preferred_style
                ? String(ctx.preferred_style).toLowerCase().trim()
                : null
            ),
            preferred_color: ctx.preferred_color
              ? String(ctx.preferred_color).toLowerCase().trim() === "gray"
                ? "grey"
                : String(ctx.preferred_color).toLowerCase().trim()
              : null,
            time_of_day: ctx.time_of_day
              ? String(ctx.time_of_day).toLowerCase().trim()
              : null,
            weather_note: ctx.weather_note || null,
            stylistResponse: localResult.stylist_response || null,
            modelUsed: "local_open_source",
          };
          isLocal = true;
        }
      } else {
        console.warn(
          "[queryParser] LLM_PROVIDER is 'local' but local LLM server is unreachable. Falling back to Gemini."
        );
      }
    } catch (err) {
      console.warn("[queryParser] Local LLM error:", err.message);
    }
  }

  // 2. If provider is gemini (or local LLM was unavailable/failed), use Gemini
  if (!parsed) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey.trim() && apiKey !== "your_key_here") {
      const contents = [];

      // Include recent turns as conversation context for Gemini if available
      if (Array.isArray(history) && history.length > 0) {
        const recentTurns = history.slice(-4);
        for (const turn of recentTurns) {
          const role = turn.role === "assistant" ? "model" : "user";
          const text = (turn.content || "").trim();
          if (text) {
            if (contents.length === 0 && role === "model") {
              continue;
            }
            if (contents.length > 0 && contents[contents.length - 1].role === role) {
              contents[contents.length - 1].parts.push({ text });
            } else {
              contents.push({
                role,
                parts: [{ text }],
              });
            }
          }
        }
      }

      if (contents.length > 0 && contents[contents.length - 1].role === "user") {
        contents[contents.length - 1].parts.push({ text: queryText });
      } else {
        contents.push({
          role: "user",
          parts: [{ text: queryText }],
        });
      }

      const models = ["gemini-flash-lite-latest", "gemini-3.6-flash"];

      for (const model of models) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                system_instruction: {
                  parts: [{ text: SYSTEM_INSTRUCTION }],
                },
                contents,
                generationConfig: {
                  response_mime_type: "application/json",
                },
              }),
            }
          );

          if (!response.ok) {
            console.warn(
              `Gemini API (${model}) returned non-OK status:`,
              response.status,
              await response.text().catch(() => "")
            );
            continue;
          }

          const data = await response.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (rawText) {
            const cleaned = rawText
              .replace(/```(?:json)?/gi, "")
              .replace(/```/g, "")
              .trim();

            if (cleaned) {
              const json = JSON.parse(cleaned);
              const validIntents = [
                "outfit_recommendation",
                "fashion_advice",
                "chit_chat",
                "clarification_needed",
              ];
              const parsedIntent = validIntents.includes(json.intent)
                ? json.intent
                : "outfit_recommendation";

              parsed = {
                intent: parsedIntent,
                conversational_response:
                  json.conversational_response &&
                  typeof json.conversational_response === "string"
                    ? json.conversational_response.trim()
                    : null,
                occasion: normalizeOccasion(
                  json.occasion ? String(json.occasion).toLowerCase().trim() : null
                ),
                season: normalizeSeason(
                  json.season ? String(json.season).toLowerCase().trim() : null
                ),
                preferred_style: normalizeStyle(
                  json.preferred_style
                    ? String(json.preferred_style).toLowerCase().trim()
                    : null
                ),
                preferred_color: json.preferred_color
                  ? String(json.preferred_color).toLowerCase().trim() === "gray"
                    ? "grey"
                    : String(json.preferred_color).toLowerCase().trim()
                  : null,
                time_of_day: json.time_of_day
                  ? String(json.time_of_day).toLowerCase().trim()
                  : null,
                weather_note: json.weather_note || null,
              };
              break;
            }
          }
        } catch (err) {
          console.warn(`Gemini API (${model}) call failed:`, err.message);
        }
      }
    }
  }

  if (!parsed) {
    parsed = fallbackParse(queryText);
  }

  parsed.modelUsed = isLocal ? "local_open_source" : "gemini";

  const enriched = carryForwardContext(parsed, history, queryText);
  enriched.modelUsed = parsed.modelUsed;
  if (parsed.stylistResponse) {
    enriched.stylistResponse = parsed.stylistResponse;
  }
  return enriched;
}

module.exports = {
  parseUserQuery,
  fallbackParse,
  carryForwardContext,
  normalizeOccasion,
  normalizeStyle,
  normalizeSeason,
};
