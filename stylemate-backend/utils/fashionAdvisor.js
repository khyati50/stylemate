/**
 * StyleMate Dynamic Fashion Advisor Utility
 * ==========================================
 * Provides dynamic, context-aware styling consultations based on user questions.
 * Used as high-quality fallback when offline or local inference is active.
 */

const COLOR_PROPERTIES = {
  olive: {
    name: "olive green",
    family: "earth",
    complementary: "cream, beige, crisp white, deep navy, and rich burgundy",
    pairing: "an off-white cotton tee, dark indigo raw denim, or warm cognac leather footwear",
    tip: "lean into tactile textures like corduroy, brushed twill, or waffle knits to showcase its natural depth"
  },
  green: {
    name: "green",
    family: "earth",
    complementary: "white, tan, beige, navy, and charcoal",
    pairing: "neutral beige chinos, clean white sneakers, or a navy overshirt",
    tip: "balance vibrant greens with muted earth tones to keep the palette grounded"
  },
  navy: {
    name: "navy",
    family: "neutral",
    complementary: "crisp white, soft grey, warm camel, tan, and burgundy",
    pairing: "an oatmeal knit sweater, crisp white shirting, or tan chinos",
    tip: "pair with rich brown leather accessories to naturally warm up the cool undertones"
  },
  charcoal: {
    name: "charcoal",
    family: "neutral",
    complementary: "crisp white, black, light grey, powder blue, and burgundy",
    pairing: "a crisp white dress shirt, black trousers, or a fine merino knit",
    tip: "introduce distinct textural contrast like wool flannel or hopsack to prevent dark tones from falling flat"
  },
  black: {
    name: "black",
    family: "neutral",
    complementary: "crisp white, heather grey, camel, tan, and olive",
    pairing: "a camel wool coat, clean white tee, or contrasting leather footwear",
    tip: "mix different fabric textures (like denim, leather, and knitwear) so an all-dark look feels dimensional"
  },
  white: {
    name: "white",
    family: "neutral",
    complementary: "navy, olive, charcoal, beige, and denim blue",
    pairing: "dark selvedge denim, olive chinos, or a navy blazer",
    tip: "keep pieces impeccably clean and use subtle off-white tones for a softer vintage feel"
  },
  beige: {
    name: "beige",
    family: "neutral",
    complementary: "white, cream, olive, navy, and terracotta",
    pairing: "an olive utility jacket, white linen shirt, or navy trousers",
    tip: "layer tonal shades of cream and tan together for an effortless quiet-luxury look"
  },
  tan: {
    name: "tan",
    family: "earth",
    complementary: "navy blue, white, forest green, and black",
    pairing: "navy chinos, a crisp white button-down, or dark denim",
    tip: "use tan leather footwear to add instant polish and warmth to neutral outfits"
  },
  brown: {
    name: "brown",
    family: "earth",
    complementary: "cream, sky blue, navy, forest green, and off-white",
    pairing: "light blue denim, an ivory cable-knit sweater, or navy tailoring",
    tip: "choose rich cognac or chocolate shades to elevate relaxed silhouettes"
  },
  burgundy: {
    name: "burgundy",
    family: "jewel",
    complementary: "navy, grey, charcoal, camel, and crisp white",
    pairing: "a charcoal blazer, grey flannel trousers, or dark indigo jeans",
    tip: "treat burgundy as a statement neutral that adds subtle luxury without overwhelming"
  },
  camel: {
    name: "camel",
    family: "earth",
    complementary: "black, white, navy, and light grey",
    pairing: "black tailored trousers, a white tee, or a dark charcoal turtleneck",
    tip: "a camel overcoat or blazer instantly elevates casual denim into high-end chic"
  }
};

/**
 * Extracts mentioned colors from text.
 */
function extractColors(text) {
  const t = text.toLowerCase();
  const colors = [];
  const colorList = [
    "charcoal", "olive green", "olive", "navy", "white", "black", "grey", "gray",
    "brown", "beige", "cream", "tan", "burgundy", "maroon", "camel", "khaki",
    "blue", "green", "red", "pink", "yellow", "mustard", "emerald", "rust"
  ];
  for (const c of colorList) {
    const regex = new RegExp(`\\b${c}\\b`, "i");
    if (regex.test(t)) {
      colors.push(c === "gray" ? "grey" : c);
    }
  }
  return [...new Set(colors)];
}

/**
 * Extracts mentioned garments from text.
 */
function extractGarments(text) {
  const t = text.toLowerCase();
  const garments = [];
  const garmentMap = {
    sneakers: ["sneakers", "trainers", "kicks", "running shoes"],
    chinos: ["chinos", "khakis"],
    blazer: ["blazer", "suit jacket", "sport coat", "sports coat"],
    trousers: ["trousers", "slacks", "pants", "dress pants"],
    jeans: ["jeans", "denim"],
    boots: ["boots", "chelsea boots", "ankle boots"],
    loafers: ["loafers", "penny loafers", "moccasins"],
    suit: ["suit", "tuxedo"],
    hoodie: ["hoodie", "sweatshirt"],
    coat: ["coat", "overcoat", "trench coat", "trench"],
    jacket: ["jacket", "leather jacket", "denim jacket", "bomber"],
    shirt: ["shirt", "button-down", "oxford", "button up"],
    tee: ["t-shirt", "tee", "tank top"],
    sweater: ["sweater", "knitwear", "jumper", "turtleneck", "cardigan"],
    dress: ["dress", "slip dress", "floral dress", "gown"],
    skirt: ["skirt", "midi skirt", "maxi skirt"]
  };

  for (const [key, syns] of Object.entries(garmentMap)) {
    for (const syn of syns) {
      const regex = new RegExp(`\\b${syn}\\b`, "i");
      if (regex.test(t)) {
        garments.push(key);
        break;
      }
    }
  }
  return garments;
}

/**
 * Generates dynamic, context-aware styling consultation advice.
 * Returns 3-4 flowing sentences with fashion rationale, pairings, and practical tip.
 */
function getDynamicFashionAdvice(userMessage) {
  const text = (userMessage || "").trim();
  const t = text.toLowerCase();
  const colors = extractColors(t);
  const garments = extractGarments(t);

  // 1. Specific Iconic Pairing: White sneakers + Navy chinos
  const hasSneakers = garments.includes("sneakers");
  const hasChinos = garments.includes("chinos") || garments.includes("trousers");
  const hasWhite = colors.includes("white");
  const hasNavy = colors.includes("navy") || colors.includes("blue");

  if (hasSneakers && hasChinos && (hasWhite || hasNavy || t.includes("sneaker"))) {
    return (
      "Pairing crisp white sneakers with navy chinos is a timeless smart-casual masterclass that effortlessly bridges the gap between athletic ease and tailored polish. " +
      "The high-contrast palette allows the bright white footwear to pop against the deep, grounded navy, giving the entire look a fresh and purposeful energy. " +
      "Team them with an untucked white Oxford cloth button-down or a relaxed grey crewneck sweater and a lightweight overshirt for an elevated weekend aesthetic. " +
      "For the sharpest silhouette, give your chinos a clean single or double cuff right at the ankle bone and wear no-show socks to showcase the clean sneaker profile."
    );
  }

  // 2. Specific Iconic Pairing: Charcoal blazer + Black trousers
  const hasBlazer = garments.includes("blazer") || garments.includes("suit");
  const hasTrousers = garments.includes("trousers") || garments.includes("chinos");
  const hasCharcoal = colors.includes("charcoal") || colors.includes("grey");
  const hasBlack = colors.includes("black");

  if (hasBlazer && hasTrousers && hasCharcoal && hasBlack) {
    return (
      "Yes, a charcoal blazer pairs handsomely with black trousers, provided there is noticeable texture differentiation so the combination looks intentional rather than like an almost-matching suit. " +
      "Because charcoal and black are neighboring dark neutrals, choosing a tactile fabric—such as a rich wool flannel, herringbone, or textured hopsack blazer against smooth black trousers—creates sophisticated depth and dimension. " +
      "Layer a crisp white poplin shirt or a fine black merino turtleneck underneath, and finish with buffed black leather Chelsea boots or dress shoes. " +
      "Add a clean white linen pocket square with a straight television fold to bring an intentional pop of brightness to your upper half."
    );
  }

  // 3. Specific Iconic Pairing: Olive Green color harmony
  const hasOlive = colors.includes("olive") || colors.includes("olive green") || colors.includes("green");
  const isColorHarmonyQuery =
    t.includes("what color") ||
    t.includes("which color") ||
    t.includes("go well with") ||
    t.includes("goes with") ||
    t.includes("match with") ||
    t.includes("pair with");

  if (hasOlive && isColorHarmonyQuery) {
    return (
      "Olive green is an exceptionally versatile earthy neutral that looks sublime when paired with warm neutrals like cream, beige, and tan for an organic, relaxed aesthetic. " +
      "For a sharper, contemporary edge, deep navy blue, charcoal, and black provide a rich, grounded contrast, while touches of burgundy or rust introduce luxurious warmth. " +
      "Try styling an olive overshirt or chinos with an off-white cotton t-shirt and dark raw indigo denim or rich cognac leather shoes. " +
      "As a practical styling tip, embrace tactile textures like corduroy, twill, or waffle knits to really showcase the natural visual depth of olive tones."
    );
  }

  // 4. Blazer + Denim / Jeans pairing
  if (hasBlazer && garments.includes("jeans")) {
    return (
      "Pairing a structured blazer with denim is the definitive smart-casual style formula that instantly elevates everyday casual wear. " +
      "The tailored structure of the jacket sharpens the relaxed nature of the jeans, especially when you opt for dark, clean-rinse selvedge denim without distressing. " +
      "Wear it over a crisp white crewneck tee or an untucked chambray shirt, paired with leather loafers or minimalist low-top sneakers. " +
      "Push the blazer sleeves slightly up your forearms to maintain an effortless, approachable drape."
    );
  }

  // 5. Brown shoes + Navy suit / trousers
  if (
    (colors.includes("brown") || colors.includes("tan")) &&
    hasNavy &&
    (garments.includes("boots") || garments.includes("loafers") || t.includes("shoe") || garments.includes("suit") || hasChinos)
  ) {
    return (
      "Wearing brown leather footwear with navy tailoring or chinos is a classic sartorial pairing that instantly feels richer and more approachable than stark black. " +
      "Warm cognac, walnut, or espresso leather naturally enriches the cool undertones of navy, creating a balanced and distinguished palette. " +
      "Pair with a crisp white or pale blue dress shirt, and add a subtle wool or knit tie if dressing for a formal setting. " +
      "Always remember to match your leather belt and watch strap to the brown shade of your footwear for a cohesive, polished finish."
    );
  }

  // 6. Black + Brown pairing
  if (hasBlack && (colors.includes("brown") || colors.includes("tan") || colors.includes("camel"))) {
    return (
      "Yes, black and brown work exceptionally well together when you choose deliberate, contrasting shades like warm cognac, camel, or tan rather than near-black dark brown. " +
      "The warm caramel tones break up the monochrome severity of black, resulting in an elevated, equestrian-inspired luxury feel. " +
      "Pair black trousers or denim with a camel wool coat or rich tan Chelsea boots and an ivory sweater. " +
      "Ensure your leather tones remain consistent to keep the contrast deliberate and polished."
    );
  }

  // 7. Navy + Black pairing
  if (hasNavy && hasBlack) {
    return (
      "Pairing navy with black is a modern, high-fashion styling technique that creates a sleek, nocturnal aesthetic when done with intentional texture contrast. " +
      "Contrast a textured navy piece, such as a brushed wool overcoat or cable-knit sweater, against smooth black leather boots or tailored black denim. " +
      "Keep the silhouette streamlined and minimalist to emphasize the subtle difference in depth between the two dark tones. " +
      "Add minimalist silver jewelry or a clean watch to provide a delicate focal point."
    );
  }

  // 8. Single Color Harmony Query (e.g. "what goes well with navy / burgundy / beige / camel")
  if (colors.length > 0 && isColorHarmonyQuery) {
    const primaryColor = colors[0];
    const info = COLOR_PROPERTIES[primaryColor];
    if (info) {
      return (
        `${info.name.charAt(0).toUpperCase() + info.name.slice(1)} is a versatile shade that harmonizes beautifully with ${info.complementary}. ` +
        `This combination balances tonal warmth and neutral grounding, preventing the outfit from feeling visually monotonous or overwhelming. ` +
        `Try pairing it with ${info.pairing} to let the core color naturally anchor the look. ` +
        `As a practical styling tip, ${info.tip}.`
      );
    }
  }

  // 9. Garment styling query (e.g. "how to style an oversized hoodie / dress / leather jacket")
  if (garments.length > 0) {
    const g = garments[0];
    if (g === "hoodie") {
      return (
        "Styling a hoodie with tailored pieces creates a high-low aesthetic that epitomizes modern smart-streetwear. " +
        "Layering a slim, unbranded hoodie underneath a structured wool overcoat, trench, or tailored blazer instantly balances casual comfort with sharp lines. " +
        "Pair with tapered chinos or straight-leg dark denim and minimalist leather sneakers or clean boots. " +
        "Let the hood rest neatly over the coat collar and keep the rest of the outfit fitted to prevent excess bulk."
      );
    }
    if (g === "dress") {
      return (
        "To give a dress a modern, dynamic edge, contrast its fluid silhouette with structured or casual elements to create visual tension. " +
        "Layering an oversized tailored blazer or a cropped leather jacket over a slip or floral dress grounds the look with contemporary attitude. " +
        "Pair with sleek ankle boots or minimalist white sneakers for effortless day-to-night versatility. " +
        "Cinch the waist with a subtle leather belt or drape an unbuttoned knit over your shoulders for practical, dimensional layering."
      );
    }
  }

  // 10. General rich fashion consultation fallback
  const firstColor = colors[0] || "neutral";
  return (
    `When styling ${firstColor} pieces, the key is balancing clean visual proportions with deliberate textural contrast. ` +
    "Pair your foundational piece with complementary neutrals—like crisp white, heather grey, or deep navy—to let the silhouette feel intentional and refined. " +
    "Complete the look with well-proportioned footwear like minimalist leather sneakers or sleek Chelsea boots. " +
    "For a practical finishing touch, use simple adjustments like cuffing the sleeves or doing a French tuck to instantly elevate the overall drape."
  );
}

module.exports = {
  getDynamicFashionAdvice,
  extractColors,
  extractGarments,
  COLOR_PROPERTIES
};
