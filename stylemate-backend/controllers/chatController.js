const ClothingItem = require("../models/ClothingItem");
const UserPreferences = require("../models/UserPreferences");
const ChatInteractionLog = require("../models/ChatInteractionLog");
const { computeUserPreferences } = require("../utils/preferenceEngine");
const { runPythonRecommendation } = require("../utils/pythonRunner");
const { parseUserQuery } = require("../utils/queryParser");
const { getDynamicFashionAdvice } = require("../utils/fashionAdvisor");

// In-memory conversation memory: maps userId -> array of up to 5 turns
const conversationMemory = {};

/**
 * Normalizes Python raw outfit into standard frontend shape.
 */
const normalizeOutfit = (raw) => ({
  top: raw.upper_body || null,
  bottom: raw.lower_body || null,
  fullBody: raw.full_body || null,
  footwear: raw.footwear || null,
  outerwear: raw.outerwear || null,
  accessory: Array.isArray(raw.accessories)
    ? raw.accessories[0] || null
    : raw.accessories || null,
});

/**
 * Determines dominant style across outfit item slots.
 */
const getDominantStyle = (outfit) => {
  if (!outfit) return null;
  const slots = [
    outfit.fullBody,
    outfit.top,
    outfit.bottom,
    outfit.footwear,
    outfit.outerwear,
    outfit.accessory,
  ].filter(Boolean);

  const allStyles = slots.flatMap((item) =>
    Array.isArray(item.styles) ? item.styles : item.styles ? [item.styles] : []
  );

  const styleFreq = allStyles.reduce((acc, s) => {
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  return (
    Object.keys(styleFreq).sort((a, b) => styleFreq[b] - styleFreq[a])[0] || null
  );
};

/**
 * Helper to generate a dynamic, personalized stylist explanation using Gemini or template fallback.
 */
const generateStylistNote = async (
  userMessage,
  outfit,
  occasion,
  season,
  apiKey,
  time_of_day,
  localStylistNote = null
) => {
  if (
    localStylistNote &&
    (process.env.LLM_PROVIDER === "local" || !apiKey || apiKey === "your_key_here")
  ) {
    return localStylistNote;
  }
  if (apiKey && apiKey.trim() && apiKey !== "your_key_here") {
    const topDesc = outfit.top
      ? `${outfit.top.name} (${(outfit.top?.styles || []).join(", ")})`
      : outfit.fullBody
      ? `${outfit.fullBody.name} (${(outfit.fullBody?.styles || []).join(", ")})`
      : "N/A";
    const bottomDesc = outfit.bottom
      ? `${outfit.bottom.name} (${(outfit.bottom?.styles || []).join(", ")})`
      : outfit.fullBody
      ? "N/A (One-piece outfit)"
      : "N/A";
    const footwearDesc = outfit.footwear ? outfit.footwear.name : "N/A";
    const outerwearDesc = outfit.outerwear ? outfit.outerwear.name : "None";
    const accessoryDesc = outfit.accessory ? outfit.accessory.name : "None";

    const promptText = `You are StyleMate's personal fashion stylist.
The user asked: "${userMessage}"
Our AI engine selected this outfit from their wardrobe:
- Top: ${topDesc}
- Bottom: ${bottomDesc}
- Footwear: ${footwearDesc}
- Outerwear: ${outerwearDesc}
- Accessory: ${accessoryDesc}

Write a stylish, warm 2-3 sentence personalized stylist note:
1. Explain specifically why these pieces coordinate well for their ${occasion || "plans"}.
2. Give one practical styling tip (e.g. tucking, sleeve cuffing, or accessorizing).
Keep it concise, encouraging, and natural. No markdown headings or bullet points.`;

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
              contents: [
                {
                  role: "user",
                  parts: [{ text: promptText }],
                },
              ],
            }),
          }
        );

        if (!response.ok) {
          console.warn(
            `Gemini generateStylistNote (${model}) returned non-OK status:`,
            response.status
          );
          continue;
        }

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText && rawText.trim()) {
          return rawText.trim();
        }
      } catch (err) {
        console.warn(`Gemini generateStylistNote (${model}) failed:`, err.message);
      }
    }
  }

  // Fallback template generation
  const topName = outfit.top?.name || outfit.fullBody?.name || "these pieces";
  const bottomName = outfit.bottom?.name || "clean styling";
  return `Based on your wardrobe, here's a curated ${
    occasion ? occasion + " " : ""
  }look for ${time_of_day || "you"}. This outfit combines ${topName} with ${bottomName} for a balanced aesthetic.`;
};

/**
 * Dedicated fashion advice generator using Gemini (with fallback to local dynamic advisor).
 */
const generateFashionAdvice = async (
  userMessage,
  apiKey,
  fallbackAdvice = null
) => {
  if (apiKey && apiKey.trim() && apiKey !== "your_key_here") {
    const promptText = `You are StyleMate's senior fashion director and personal stylist.
The user is asking a fashion styling question: "${userMessage}"
Provide an expert, stylish, and engaging consultation:
1. Answer their question directly with clear fashion rationale (color theory, balance, textures, proportions).
2. Give 1 or 2 specific pairing ideas (e.g. exact garment styles, colors, or footwear).
3. Give one practical styling tip (e.g. cuffing, tucking, layering, or accessories).
Keep your tone chic, approachable, and encouraging (3 to 4 flowing sentences). No markdown headers or bullet points.`;

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
              contents: [
                {
                  role: "user",
                  parts: [{ text: promptText }],
                },
              ],
            }),
          }
        );

        if (!response.ok) {
          console.warn(
            `Gemini generateFashionAdvice (${model}) returned non-OK status:`,
            response.status
          );
          continue;
        }

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText && rawText.trim()) {
          return rawText.trim();
        }
      } catch (err) {
        console.warn(
          `Gemini generateFashionAdvice (${model}) failed:`,
          err.message
        );
      }
    }
  }

  // If local server or parser already provided dynamic advice (and not the static canned sentence), use it
  const isCanned =
    fallbackAdvice &&
    fallbackAdvice.includes("pairing neutral tones with one statement color");
  if (fallbackAdvice && !isCanned) {
    return fallbackAdvice;
  }

  return getDynamicFashionAdvice(userMessage);
};

/**
 * POST /api/chat/recommend
 * Receives natural language query, extracts context, and runs recommendation.
 */
const recommendFromChat = async (req, res) => {
  const startTime = Date.now();
  try {
    const userId = req.user.id;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        message: "Please enter a message to ask StyleMate.",
      });
    }

    const userHistory = conversationMemory[userId] || [];
    const parsed = await parseUserQuery(message.trim(), userHistory);

    // When intent is fashion advice, generate dedicated fashion consultation advice
    if (parsed.intent === "fashion_advice") {
      const advice = await generateFashionAdvice(
        message.trim(),
        process.env.GEMINI_API_KEY,
        parsed.conversational_response
      );
      const response_text = advice;

      // Update in-memory conversation memory (keep last 5 turns)
      if (!conversationMemory[userId]) {
        conversationMemory[userId] = [];
      }
      conversationMemory[userId].push({
        role: "user",
        content: message.trim(),
        parsed,
      });
      conversationMemory[userId].push({
        role: "assistant",
        content: response_text,
      });
      if (conversationMemory[userId].length > 5) {
        conversationMemory[userId] = conversationMemory[userId].slice(-5);
      }

      const latencyMs = Date.now() - startTime;
      let logId = null;
      try {
        const logRecord = await ChatInteractionLog.create({
          userId,
          queryText: message.trim(),
          intent: "fashion_advice",
          parsedContext: parsed,
          modelUsed: parsed?.modelUsed || (process.env.LLM_PROVIDER === "local" ? "local_open_source" : "gemini"),
          latencyMs,
          responseText: response_text,
          recommendedOutfit: null,
          feedback: null,
        });
        logId = logRecord.id;
      } catch (logErr) {
        console.error("Failed to log chat interaction:", logErr);
      }

      return res.status(200).json({
        logId,
        response_text,
        outfit: null,
        all_outfits: [],
        parsed_context: parsed,
      });
    }

    // If intent is chit chat or clarification needed, return directly without running Python pipeline
    if (
      parsed.intent === "chit_chat" ||
      parsed.intent === "clarification_needed"
    ) {
      const response_text =
        parsed.conversational_response ||
        "I'm here to help style your outfits! Tell me what occasion you are dressing for.";

      // Update in-memory conversation memory (keep last 5 turns)
      if (!conversationMemory[userId]) {
        conversationMemory[userId] = [];
      }
      conversationMemory[userId].push({
        role: "user",
        content: message.trim(),
        parsed,
      });
      conversationMemory[userId].push({
        role: "assistant",
        content: response_text,
      });
      if (conversationMemory[userId].length > 5) {
        conversationMemory[userId] = conversationMemory[userId].slice(-5);
      }

      const latencyMs = Date.now() - startTime;
      let logId = null;
      try {
        const logRecord = await ChatInteractionLog.create({
          userId,
          queryText: message.trim(),
          intent: parsed?.intent || "outfit_recommendation",
          parsedContext: parsed,
          modelUsed: parsed?.modelUsed || "gemini",
          latencyMs,
          responseText: response_text,
          recommendedOutfit: null,
          feedback: null,
        });
        logId = logRecord.id;
      } catch (logErr) {
        console.error("Failed to log chat interaction:", logErr);
      }

      return res.status(200).json({
        logId,
        response_text,
        outfit: null,
        all_outfits: [],
        parsed_context: parsed,
      });
    }

    const wardrobeModels = await ClothingItem.findAll({
      where: { userId, status: "available" },
    });

    if (wardrobeModels.length === 0) {
      return res.status(404).json({
        message: "Your wardrobe is empty. Add some clothes first.",
      });
    }

    const wardrobe = wardrobeModels.map((item) => item.toJSON());

    let userPrefs = await UserPreferences.findOne({ where: { userId } });
    const ONE_HOUR = 60 * 60 * 1000;
    if (
      !userPrefs ||
      !userPrefs.lastComputedAt ||
      Date.now() - new Date(userPrefs.lastComputedAt).getTime() > ONE_HOUR
    ) {
      userPrefs = await computeUserPreferences(userId);
    }

    const inputData = {
      wardrobe,
      weather: {
        season: parsed.season || "summer",
        temperature: 25,
        condition: "sunny",
      },
      user_preferences: {
        occasion: parsed.occasion || "casual",
        preferred_style:
          parsed.preferred_style || userPrefs?.favoriteStyles?.[0] || "",
        preferred_color:
          parsed.preferred_color || userPrefs?.favoriteColors?.[0] || "",
        disliked_colors: userPrefs?.dislikedColors || [],
        disliked_styles: userPrefs?.dislikedStyles || [],
      },
      user_history: {
        average_rating: userPrefs?.averageRating || 4.0,
        times_worn: userPrefs?.totalOutfitsWorn || 0,
        days_since_last_worn: 30,
        accepted_before: (userPrefs?.totalOutfitsWorn || 0) > 0,
      },
    };

    const rankedOutfits = await runPythonRecommendation(inputData);

    if (!rankedOutfits || rankedOutfits.length === 0) {
      return res.status(404).json({
        message:
          "No matching outfit found for your request. Try giving more details or adding more items to your wardrobe.",
      });
    }

    const formattedAllOutfits = rankedOutfits.map((entry) =>
      normalizeOutfit(entry.outfit)
    );
    const formattedTopOutfit = formattedAllOutfits[0];

    const apiKey = process.env.GEMINI_API_KEY;
    const stylistNote = await generateStylistNote(
      message.trim(),
      formattedTopOutfit,
      parsed.occasion,
      parsed.season,
      apiKey,
      parsed.time_of_day,
      parsed.stylistResponse
    );

    // Update in-memory conversation memory (keep last 5 turns)
    if (!conversationMemory[userId]) {
      conversationMemory[userId] = [];
    }
    conversationMemory[userId].push({
      role: "user",
      content: message.trim(),
      parsed,
    });
    conversationMemory[userId].push({
      role: "assistant",
      content: stylistNote,
    });
    if (conversationMemory[userId].length > 5) {
      conversationMemory[userId] = conversationMemory[userId].slice(-5);
    }

    const response_text = stylistNote;
    const latencyMs = Date.now() - startTime;
    let logId = null;
    try {
      const logRecord = await ChatInteractionLog.create({
        userId,
        queryText: message.trim(),
        intent: parsed?.intent || "outfit_recommendation",
        parsedContext: parsed,
        modelUsed: parsed?.modelUsed || "gemini",
        latencyMs,
        responseText: response_text,
        recommendedOutfit: formattedTopOutfit || null,
        feedback: null,
      });
      logId = logRecord.id;
    } catch (logErr) {
      console.error("Failed to log chat interaction:", logErr);
    }

    return res.status(200).json({
      logId,
      response_text,
      outfit: formattedTopOutfit,
      all_outfits: formattedAllOutfits,
      parsed_context: parsed,
    });
  } catch (error) {
    console.error("Chat recommendation error:", error);
    return res.status(500).json({
      message: error.message || "Failed to generate recommendation from chat",
    });
  }
};

/**
 * PATCH /api/chat/feedback/:logId
 * Saves user feedback ('liked', 'disliked', 'worn') for a specific chat interaction.
 */
const submitChatFeedback = async (req, res) => {
  try {
    const { logId } = req.params;
    const { feedback } = req.body;
    const validFeedback = ["liked", "disliked", "worn"];

    if (!feedback || !validFeedback.includes(feedback)) {
      return res.status(400).json({
        message: "Invalid feedback value. Must be 'liked', 'disliked', or 'worn'.",
      });
    }

    const log = await ChatInteractionLog.findOne({
      where: { id: logId, userId: req.user.id },
    });

    if (!log) {
      return res.status(404).json({
        message: "Chat interaction log not found.",
      });
    }

    log.feedback = feedback;
    await log.save();

    return res.status(200).json({
      message: "Feedback saved",
      feedback,
    });
  } catch (error) {
    console.error("Submit chat feedback error:", error);
    return res.status(500).json({
      message: error.message || "Failed to submit chat feedback",
    });
  }
};

/**
 * GET /api/chat/analytics
 * Aggregates chat query logs, intent distribution, latencies, and user feedback metrics.
 */
const getChatAnalytics = async (req, res) => {
  try {
    const logs = await ChatInteractionLog.findAll({
      order: [["createdAt", "DESC"]],
    });

    const totalQueries = logs.length;
    const intentDistribution = {};
    const topOccasions = {};
    let totalLatency = 0;
    const feedbackStats = {
      liked: 0,
      disliked: 0,
      worn: 0,
      null: 0,
    };

    for (const log of logs) {
      const intent = log.intent || "outfit_recommendation";
      intentDistribution[intent] = (intentDistribution[intent] || 0) + 1;

      let occ = null;
      if (log.parsedContext) {
        const ctx =
          typeof log.parsedContext === "string"
            ? JSON.parse(log.parsedContext)
            : log.parsedContext;
        occ = ctx?.occasion;
      }
      if (occ) {
        topOccasions[occ] = (topOccasions[occ] || 0) + 1;
      }

      totalLatency += log.latencyMs || 0;

      const fb = log.feedback;
      if (fb === "liked" || fb === "disliked" || fb === "worn") {
        feedbackStats[fb] = (feedbackStats[fb] || 0) + 1;
      } else {
        feedbackStats.null = (feedbackStats.null || 0) + 1;
      }
    }

    const avgLatencyMs =
      totalQueries > 0 ? Math.round(totalLatency / totalQueries) : 0;
    const ratedCount = feedbackStats.liked + feedbackStats.disliked;
    const satisfactionRate =
      ratedCount > 0
        ? Math.round((feedbackStats.liked / ratedCount) * 100)
        : 100;

    const recentLogs = logs.slice(0, 15).map((l) => ({
      id: l.id,
      queryText: l.queryText,
      intent: l.intent,
      feedback: l.feedback,
      latencyMs: l.latencyMs,
      createdAt: l.createdAt,
    }));

    return res.status(200).json({
      analytics: {
        totalQueries,
        intentDistribution,
        topOccasions,
        avgLatencyMs,
        feedbackStats,
        satisfactionRate,
        recentLogs,
      },
    });
  } catch (error) {
    console.error("Get chat analytics error:", error);
    return res.status(500).json({
      message: error.message || "Failed to get chat analytics",
    });
  }
};

/**
 * DELETE /api/chat/clear
 * Resets in-memory conversation history for the authenticated user.
 */
const clearChatHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    delete conversationMemory[userId];
    return res.status(200).json({
      message: "Conversation reset successfully",
    });
  } catch (error) {
    console.error("Clear chat error:", error);
    return res.status(500).json({
      message: error.message || "Failed to clear chat history",
    });
  }
};

module.exports = {
  recommendFromChat,
  clearChatHistory,
  generateStylistNote,
  conversationMemory,
  submitChatFeedback,
  getChatAnalytics,
};
