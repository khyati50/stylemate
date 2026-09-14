const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
require("dotenv").config();

const db = require("../config/db");
const ChatInteractionLog = require("../models/ChatInteractionLog");
const User = require("../models/User");
const { parseUserQuery } = require("../utils/queryParser");

const SAMPLE_QUERIES = [
  // 1. Office / Meetings
  "Need a sharp outfit for an executive client presentation tomorrow morning",
  "What should I wear to a final round job interview at a tech company?",
  "Casual Friday outfit for the office with navy chinos",
  "Professional yet comfortable attire for a 3-hour Zoom conference",
  "Client lunch meeting at an upscale bistro this afternoon",
  "Board meeting attire that looks authoritative and polished",
  "First day at my new corporate finance job next Monday",
  "Smart business meeting outfit suitable for hot summer weather",

  // 2. Weddings & Formal
  "Going to a wedding reception this Saturday evening, need something elegant",
  "What to wear for my best friend's Sangeet ceremony?",
  "Cocktail gala dress code outfit for an autumn charity event",
  "Black tie optional annual dinner outfit recommendation",
  "Traditional yet modern ethnic look for a daytime Haldi ceremony",
  "Destination wedding guest outfit in Goa for a beachside evening party",
  "Formal awards ceremony dinner attire that stands out",
  "Mehendi celebration outfit with vibrant festive colors",

  // 3. Casual & Daily
  "Lazy Sunday brunch outfit with friends at an outdoor cafe",
  "Cozy and relaxed look for studying all day in the campus library",
  "Quick errand run to the grocery store on a chilly morning",
  "Comfortable airport travel outfit for a 12-hour international flight",
  "Weekend stroll in the botanical gardens in warm spring weather",
  "Laid-back coffee meetup outfit with college classmates",
  "Casual Saturday afternoon outfit for visiting a modern art gallery",
  "Minimalist everyday outfit with clean neutral tones",

  // 4. Date Nights
  "First date at an intimate Italian restaurant tonight, want to look stylish but effortless",
  "Anniversary romantic candlelit rooftop dinner outfit",
  "Casual movie night and dessert date look for a Friday evening",
  "Outdoor evening concert date in early autumn",
  "Sunset beachside drinks date outfit",
  "Drinks at a speakeasy lounge on a Saturday date night",
  "Picnic date in the park on a warm sunny afternoon",

  // 5. Parties & Nightlife
  "Edgy outfit for clubbing with friends downtown tonight",
  "Housewarming party outfit with a relaxed festive vibe",
  "Rooftop birthday drinks with coworkers this Friday night",
  "New Year's Eve countdown party outfit that turns heads",
  "Underground techno club outfit in all black",
  "Casual bar hopping look for a Saturday night in the city",
  "Summer pool party outfit with stylish breezy vibes",

  // 6. Styling Advice questions
  "Can I wear white sneakers with navy chinos to a semi-formal dinner?",
  "How do I style an olive green bomber jacket for casual outings?",
  "Does a charcoal blazer match with black trousers?",
  "What colors go best with a mustard yellow sweater?",
  "Can I pull off Chelsea boots with distressed denim?",
  "Is it okay to wear a brown leather belt with black dress shoes?",
  "How can I layer a denim jacket under an overcoat in winter?",
  "What tie color should I wear with a light blue dress shirt?",

  // 7. Edge cases, typos, and conversational banter
  "hey stylemate! what's up",
  "wht shld i waer 2 wrk 2mrw morng",
  "dress me",
  "what should i wear?",
  "thanks so much, loved the outfit!",
  "need something warm freezing outside today winter vibes",
  "can u suggest smth for rainny day cafe chill",
  "make it more casual please",
  "good morning stylemate",
  "give me something sporty for the gym",
];

const OUTFIT_TEMPLATES = {
  office: {
    top: { name: "Slim Fit Oxford Cotton Shirt", category: "top", color: "light blue", styles: ["smart", "office"] },
    bottom: { name: "Tailored Navy Chinos", category: "bottom", color: "navy", styles: ["smart", "office"] },
    footwear: { name: "Burnished Leather Derby Shoes", category: "footwear", color: "brown", styles: ["smart", "formal"] },
    outerwear: { name: "Navy Structured Blazer", category: "outerwear", color: "navy", styles: ["formal", "smart"] },
    accessory: { name: "Minimalist Leather Watch", category: "accessory", color: "brown", styles: ["smart"] },
  },
  interview: {
    top: { name: "Crisp White Poplin Dress Shirt", category: "top", color: "white", styles: ["formal", "office"] },
    bottom: { name: "Charcoal Wool Trousers", category: "bottom", color: "charcoal", styles: ["formal", "office"] },
    footwear: { name: "Black Cap-Toe Oxfords", category: "footwear", color: "black", styles: ["formal"] },
    outerwear: { name: "Charcoal Tailored Suit Jacket", category: "outerwear", color: "charcoal", styles: ["formal"] },
    accessory: { name: "Silk Navy Tie", category: "accessory", color: "navy", styles: ["formal"] },
  },
  wedding: {
    top: { name: "Embroidered Silk Kurta", category: "top", color: "cream", styles: ["ethnic", "formal"] },
    bottom: { name: "Churidar Pyjama", category: "bottom", color: "white", styles: ["ethnic"] },
    footwear: { name: "Mojari Ethnic Loafers", category: "footwear", color: "tan", styles: ["ethnic"] },
    outerwear: { name: "Nehru Bandhgala Jacket", category: "outerwear", color: "burgundy", styles: ["ethnic", "formal"] },
    accessory: { name: "Pocket Square & Brooch", category: "accessory", color: "gold", styles: ["ethnic"] },
  },
  formal: {
    top: { name: "White Tuxedo Dress Shirt", category: "top", color: "white", styles: ["formal"] },
    bottom: { name: "Black Satin Trim Dress Trousers", category: "bottom", color: "black", styles: ["formal"] },
    footwear: { name: "Patent Leather Dress Shoes", category: "footwear", color: "black", styles: ["formal"] },
    outerwear: { name: "Midnight Navy Shawl Collar Tuxedo", category: "outerwear", color: "navy", styles: ["formal"] },
    accessory: { name: "Silk Bowtie & Cufflinks", category: "accessory", color: "black", styles: ["formal"] },
  },
  date: {
    top: { name: "Merino Wool Knit Polo", category: "top", color: "charcoal", styles: ["smart", "casual"] },
    bottom: { name: "Dark Indigo Slim Denim", category: "bottom", color: "navy", styles: ["casual", "smart"] },
    footwear: { name: "Suede Chelsea Boots", category: "footwear", color: "tan", styles: ["smart"] },
    outerwear: { name: "Suede Trucker Jacket", category: "outerwear", color: "brown", styles: ["smart"] },
    accessory: { name: "Silver Minimalist Cuff", category: "accessory", color: "silver", styles: ["smart"] },
  },
  party: {
    top: { name: "Silk Blend Camp Collar Shirt", category: "top", color: "black", styles: ["streetwear", "party"] },
    bottom: { name: "Relaxed Fit Pleated Trousers", category: "bottom", color: "charcoal", styles: ["streetwear"] },
    footwear: { name: "Chunky Sole Leather Loafers", category: "footwear", color: "black", styles: ["streetwear"] },
    outerwear: { name: "Leather Biker Jacket", category: "outerwear", color: "black", styles: ["streetwear"] },
    accessory: { name: "Layered Chain Necklace", category: "accessory", color: "silver", styles: ["streetwear"] },
  },
  casual: {
    top: { name: "Heavyweight Boxy White T-Shirt", category: "top", color: "white", styles: ["casual"] },
    bottom: { name: "Washed Olive Utility Pants", category: "bottom", color: "olive", styles: ["casual"] },
    footwear: { name: "Retro Suede Sneakers", category: "footwear", color: "grey", styles: ["casual", "sporty"] },
    outerwear: { name: "Canvas Overshirt", category: "outerwear", color: "beige", styles: ["casual"] },
    accessory: { name: "Canvas Tote Bag", category: "accessory", color: "cream", styles: ["casual"] },
  },
};

/**
 * Returns an appropriate outfit based on occasion or intent.
 */
function getOutfitForOccasion(occasion) {
  if (occasion && OUTFIT_TEMPLATES[occasion]) {
    return OUTFIT_TEMPLATES[occasion];
  }
  return OUTFIT_TEMPLATES.casual;
}

/**
 * Generates an engaging stylist response text for recommendations.
 */
function generateStylistResponse(parsed) {
  const occasion = parsed.occasion || "your day";
  const season = parsed.season ? ` suitable for ${parsed.season}` : "";
  const timeOfDay = parsed.time_of_day ? ` this ${parsed.time_of_day}` : "";

  return `Based on your wardrobe, here's a curated ${occasion} look${timeOfDay}${season}. We paired clean versatile staples tailored for a polished, comfortable silhouette that lets your personal style shine.`;
}

async function seedTrainingQueries() {
  try {
    console.log("Connecting to database...");
    await db.authenticate();
    await db.sync();

    // Check if target user exists (prefer userId: 8 or fallback to 1)
    let targetUserId = 8;
    const user = await User.findByPk(8);
    if (!user) {
      const firstUser = await User.findOne();
      targetUserId = firstUser ? firstUser.id : 1;
      console.log(`User 8 not found, using userId: ${targetUserId}`);
    } else {
      console.log(`Target user found: userId: ${targetUserId} (${user.email || user.username})`);
    }

    console.log(`Processing ${SAMPLE_QUERIES.length} real-world fashion queries...`);

    const summary = {
      total: SAMPLE_QUERIES.length,
      inserted: 0,
      intents: {},
      feedback: { liked: 0, worn: 0, disliked: 0, unrated: 0 },
      occasions: {},
    };

    // Feedback distribution targets: ~50% liked, ~35% worn, ~10% unrated (null), ~5% disliked
    const feedbackCycle = [
      "liked", "worn", "liked", "worn", "liked",
      "worn", "liked", "worn", "liked", "liked",
      null, "disliked", "liked", "worn", "liked",
      "worn", "liked", "worn", null, "liked"
    ];

    for (let i = 0; i < SAMPLE_QUERIES.length; i++) {
      const query = SAMPLE_QUERIES[i];
      const parsed = await parseUserQuery(query, []);

      // Intent counts
      const intent = parsed.intent || "outfit_recommendation";
      summary.intents[intent] = (summary.intents[intent] || 0) + 1;

      // Occasion counts
      if (parsed.occasion) {
        summary.occasions[parsed.occasion] = (summary.occasions[parsed.occasion] || 0) + 1;
      }

      // Latency: realistic generation (450ms - 1700ms)
      const latencyMs = Math.floor(Math.random() * (1700 - 450) + 450);

      // Feedback assignment based on target distribution
      let feedback = feedbackCycle[i % feedbackCycle.length];
      if (intent === "chit_chat" || intent === "clarification_needed") {
        feedback = Math.random() < 0.8 ? "liked" : null;
      }

      if (feedback === "liked") summary.feedback.liked++;
      else if (feedback === "worn") summary.feedback.worn++;
      else if (feedback === "disliked") summary.feedback.disliked++;
      else summary.feedback.unrated++;

      // Response text & outfit
      let responseText = null;
      let recommendedOutfit = null;

      if (intent === "outfit_recommendation") {
        responseText = generateStylistResponse(parsed);
        recommendedOutfit = getOutfitForOccasion(parsed.occasion);
      } else {
        responseText = parsed.conversational_response || "Here are some helpful styling insights tailored for you!";
        recommendedOutfit = null;
      }

      await ChatInteractionLog.create({
        userId: targetUserId,
        queryText: query,
        intent,
        parsedContext: parsed,
        modelUsed: "gemini",
        latencyMs,
        responseText,
        recommendedOutfit,
        feedback,
      });

      summary.inserted++;
      process.stdout.write(`\rSeeded query [${i + 1}/${SAMPLE_QUERIES.length}]: "${query.slice(0, 40)}..."`);
    }

    console.log("\n\n========================================");
    console.log("   TRAINING DATA SEEDING COMPLETE");
    console.log("========================================");
    console.log(`Total queries seeded: ${summary.inserted}`);
    console.log("Intent breakdown:", JSON.stringify(summary.intents, null, 2));
    console.log("Feedback breakdown:", JSON.stringify(summary.feedback, null, 2));
    console.log("Occasions parsed:", JSON.stringify(summary.occasions, null, 2));
    console.log("========================================\n");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding training queries:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedTrainingQueries();
}

module.exports = { seedTrainingQueries, SAMPLE_QUERIES };
