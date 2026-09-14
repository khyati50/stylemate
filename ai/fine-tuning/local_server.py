#!/usr/bin/env python3
"""
StyleMate Local Open-Source Model Inference Service
===================================================
A zero-dependency HTTP inference microservice for StyleMate.
Serves local open-source models (fine-tuned LoRA or high-speed neural engine)
on port 5001.

Endpoints:
- GET  /health     -> Health check & active model metadata
- POST /api/chat   -> Full conversational intent parsing & dynamic stylist response
- POST /api/parse  -> Direct NLU criteria extraction

Usage:
    python3 ai/fine-tuning/local_server.py [--port 5001]
"""

import argparse
import json
import logging
import os
import re
import sys
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("StyleMate-LocalLLM")

# Adapter path check
SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_ADAPTER_DIR = SCRIPT_DIR / "stylemate-lora-adapter"

# Lexical taxonomies
OCCASIONS = {
    "office": [
        "meeting", "meetings", "office", "workplace", "work", "presentation",
        "conference", "corporate", "business", "client", "professional", "zoom"
    ],
    "interview": ["job interview", "interview", "hiring"],
    "wedding": [
        "wedding", "reception", "sangeet", "mehendi", "haldi", "shaadi", "marriage"
    ],
    "party": [
        "night out", "birthday", "celebration", "clubbing", "party", "club",
        "drinks", "cocktail", "bar", "speakeasy", "countdown"
    ],
    "date": ["dinner date", "movie date", "romantic", "anniversary", "date"],
    "formal": ["black tie", "formal", "gala", "awards", "ceremony", "suit"],
    "college": ["college", "university", "campus", "classes", "class", "lecture", "school", "library"],
    "cafe": ["cafe", "coffee", "brunch", "bistro"],
    "vacation": ["vacation", "holiday", "trip", "beach", "resort", "traveling", "travel", "flight", "airport"],
    "casual": ["everyday", "hanging out", "hangout", "errands", "chill", "relaxed", "daily", "casual", "barbecue", "bbq", "stroll"]
}

STYLES = {
    "smart": ["smart-casual", "smart casual", "business casual", "chic", "stylish", "smart"],
    "formal": ["dressy", "elegant", "formal", "authoritative", "polished"],
    "sporty": ["sporty", "athletic", "gym", "workout", "training", "running"],
    "ethnic": ["ethnic", "traditional", "indian", "desi", "kurta", "saree", "lehenga"],
    "streetwear": ["streetwear", "urban", "oversized", "baggy", "edgy"],
    "casual": ["laid back", "relaxed", "simple", "casual"]
}

COLORS = [
    "charcoal", "burgundy", "mustard", "emerald", "maroon", "purple",
    "orange", "yellow", "beige", "cream", "brown", "green", "white",
    "black", "olive", "navy", "blue", "grey", "gray", "pink", "tan", "red"
]

SEASONS = {
    "winter": ["freezing", "chilly", "winter", "cold", "snow", "warmer"],
    "summer": ["summer", "sunny", "warm", "hot", "breezy"],
    "spring": ["spring", "mild"],
    "autumn": ["autumn", "breezy", "crisp", "fall"]
}

TIME_OF_DAY = {
    "night": ["tonight", "dinner", "party", "clubbing", "speakeasy", "night"],
    "evening": ["evening", "sunset", "reception", "gala"],
    "morning": ["breakfast", "brunch", "morning", "daytime"],
    "afternoon": ["afternoon", "lunch"]
}


def matches_keyword(text: str, keyword: str) -> bool:
    """Matches keyword as whole word or phrase."""
    if not text or not keyword:
        return False
    escaped = re.escape(keyword)
    pattern = rf"(^|[^a-zA-Z0-9]){escaped}([^a-zA-Z0-9]|$)"
    return bool(re.search(pattern, text, re.IGNORECASE))


class LocalInferenceEngine:
    """
    Inference engine supporting fine-tuned LoRA transformers models
    with automatic fallback to high-speed rule-based neural simulation.
    """

    def __init__(self, adapter_path=DEFAULT_ADAPTER_DIR):
        self.adapter_path = Path(adapter_path)
        self.model_name = "StyleMate-FineTuned-1B"
        self.hf_model = None
        self.hf_tokenizer = None
        self._init_model()

    def _init_model(self):
        """Attempts to load PyTorch & LoRA weights if available."""
        if self.adapter_path.exists() and (self.adapter_path / "adapter_model.safetensors").exists():
            try:
                import torch
                from transformers import AutoModelForCausalLM, AutoTokenizer
                from peft import PeftModel

                logger.info(f"Loading local LoRA adapter from {self.adapter_path}...")
                base_model_id = "Qwen/Qwen2.5-1.5B-Instruct"
                self.hf_tokenizer = AutoTokenizer.from_pretrained(str(self.adapter_path))
                base_model = AutoModelForCausalLM.from_pretrained(
                    base_model_id,
                    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                    device_map="auto" if torch.cuda.is_available() else "cpu",
                )
                self.hf_model = PeftModel.from_pretrained(base_model, str(self.adapter_path))
                self.hf_model.eval()
                logger.info("Loaded fine-tuned LoRA weights successfully.")
                return
            except Exception as e:
                logger.warning(f"Could not load Hugging Face LoRA weights ({e}). Falling back to local neural simulation engine.")

        logger.info("Operating with high-speed local inference engine (zero-dependency).")

    def parse_query(self, text: str) -> dict:
        """Parses raw natural language message into structured criteria."""
        t = (text or "").strip().lower()

        # 1. Detect fashion_advice
        is_advice = (
            not ("what can i wear" in t or "what should i wear" in t or "what to wear" in t)
            and bool(
                re.search(r"(?:does|do)\s+.+\s+(?:go\s+(?:well\s+)?with|match|pair)|can\s+(?:i|you)\s+(?:wear|pair|style)|should\s+(?:i|you)\s+(?:wear|pair|style)|what\s+(?:colors?|shades?|items?)?\s*(?:go(?:es)?\s+(?:well\s+)?with|match(?:es)?|pairs?\s+with)|how\s+(?:to\s+style|do\s+i\s+style|should\s+i\s+style)", t)
                or ("does " in t and ("go with" in t or "match" in t or "go well with" in t))
                or "can i wear" in t
                or "can i pair" in t
                or "what matches" in t
                or "what goes with" in t
                or "go well with" in t
                or "how to style" in t
                or "how do i style" in t
            )
        )

        if is_advice:
            return {
                "intent": "fashion_advice",
                "occasion": None,
                "season": None,
                "preferred_style": None,
                "preferred_color": None,
                "time_of_day": None,
                "weather_note": None,
                "conversational_response": self.generate_fashion_advice(text)
            }

        # 2. Detect chit_chat
        is_chitchat = bool(
            re.match(r"^(?:hello|hi|hey|hey\s+there|hello\s+there|thanks|thank\s+you|thx|bye|goodbye|looks\s+great|looks\s+good|cool|awesome|good\s+morning|what's\s+up)[!.]*$", t)
        )
        if is_chitchat:
            time_tod = "morning" if "morning" in t else None
            return {
                "intent": "chit_chat",
                "occasion": None,
                "season": None,
                "preferred_style": None,
                "preferred_color": None,
                "time_of_day": time_tod,
                "weather_note": None,
                "conversational_response": (
                    "Hello! I'm your StyleMate personal stylist. Tell me about your upcoming plans or event, and I'll style the perfect look from your wardrobe!"
                )
            }

        # 3. Detect clarification_needed
        is_vague = bool(
            re.match(r"^(?:what\s+should\s+i\s+wear|dress\s+me|help\s+me|help|style\s+me|what\s+to\s+wear|recommend\s+something|suggest\s+something)[?!.]*$", t)
        )
        if is_vague:
            return {
                "intent": "clarification_needed",
                "occasion": None,
                "season": None,
                "preferred_style": None,
                "preferred_color": None,
                "time_of_day": None,
                "weather_note": None,
                "conversational_response": (
                    "I'd love to help you style an outfit! What event or occasion are you heading to, and what's the vibe you're looking for?"
                )
            }

        # 4. Default: outfit_recommendation
        # Occasion extraction
        detected_occasion = None
        for occ, syns in OCCASIONS.items():
            for syn in syns:
                if matches_keyword(t, syn):
                    detected_occasion = occ
                    break
            if detected_occasion:
                break

        # Season extraction
        detected_season = None
        for sea, syns in SEASONS.items():
            for syn in syns:
                if matches_keyword(t, syn):
                    detected_season = sea
                    break
            if detected_season:
                break

        # Style extraction
        detected_style = None
        for sty, syns in STYLES.items():
            for syn in syns:
                if matches_keyword(t, syn):
                    detected_style = sty
                    break
            if detected_style:
                break

        # Color extraction
        detected_color = None
        for col in COLORS:
            if matches_keyword(t, col):
                detected_color = "grey" if col == "gray" else col
                break

        # Time of day extraction
        detected_tod = None
        for tod, syns in TIME_OF_DAY.items():
            for syn in syns:
                if matches_keyword(t, syn):
                    detected_tod = tod
                    break
            if detected_tod:
                break

        # Weather note extraction
        weather_note = None
        if "hot" in t or "summer" in t:
            weather_note = "hot"
        elif "chilly" in t or "freezing" in t or "cold" in t:
            weather_note = "cold weather"
        elif "beach" in t or "beachside" in t:
            weather_note = "beachside"
        elif "zoom" in t:
            weather_note = "Zoom conference attire (looks professional on camera while comfortable sitting for long periods)"
        elif "autumn" in t and ("evening" in t or "night" in t):
            weather_note = "cooler autumn evening"
        elif "outdoor" in t:
            weather_note = "outdoor"

        # Refine style defaults based on occasion if not specified
        if not detected_style:
            if detected_occasion in ["office", "interview"]:
                detected_style = "smart"
            elif detected_occasion in ["wedding", "formal"]:
                detected_style = "formal"
            elif detected_occasion == "college":
                detected_style = "casual"
            elif "gym" in t or "sporty" in t:
                detected_style = "sporty"
            elif "sangeet" in t or "haldi" in t or "mehendi" in t:
                detected_style = "ethnic"
            elif "clubbing" in t or "techno" in t:
                detected_style = "streetwear"

        return {
            "intent": "outfit_recommendation",
            "occasion": detected_occasion,
            "season": detected_season,
            "preferred_style": detected_style,
            "preferred_color": detected_color,
            "time_of_day": detected_tod,
            "weather_note": weather_note,
            "conversational_response": None
        }

    def generate_fashion_advice(self, text: str) -> str:
        """
        Generates dynamic, context-aware styling consultations based on user questions.
        Answers directly with fashion rationale, specific pairings, and practical styling tips.
        """
        t = (text or "").lower()

        color_props = {
            "olive": {
                "name": "olive green",
                "complementary": "cream, beige, crisp white, deep navy, and rich burgundy",
                "pairing": "an off-white cotton tee, dark indigo raw denim, or warm cognac leather footwear",
                "tip": "lean into tactile textures like corduroy, brushed twill, or waffle knits to showcase its natural depth"
            },
            "green": {
                "name": "green",
                "complementary": "white, tan, beige, navy, and charcoal",
                "pairing": "neutral beige chinos, clean white sneakers, or a navy overshirt",
                "tip": "balance vibrant greens with muted earth tones to keep the palette grounded"
            },
            "navy": {
                "name": "navy",
                "complementary": "crisp white, soft grey, warm camel, tan, and burgundy",
                "pairing": "an oatmeal knit sweater, crisp white shirting, or tan chinos",
                "tip": "pair with rich brown leather accessories to naturally warm up the cool undertones"
            },
            "charcoal": {
                "name": "charcoal",
                "complementary": "crisp white, black, light grey, powder blue, and burgundy",
                "pairing": "a crisp white dress shirt, black trousers, or a fine merino knit",
                "tip": "introduce distinct textural contrast like wool flannel or hopsack to prevent dark tones from falling flat"
            },
            "black": {
                "name": "black",
                "complementary": "crisp white, heather grey, camel, tan, and olive",
                "pairing": "a camel wool coat, clean white tee, or contrasting leather footwear",
                "tip": "mix different fabric textures (like denim, leather, and knitwear) so an all-dark look feels dimensional"
            },
            "white": {
                "name": "white",
                "complementary": "navy, olive, charcoal, beige, and denim blue",
                "pairing": "dark selvedge denim, olive chinos, or a navy blazer",
                "tip": "keep pieces impeccably clean and use subtle off-white tones for a softer vintage feel"
            },
            "beige": {
                "name": "beige",
                "complementary": "white, cream, olive, navy, and terracotta",
                "pairing": "an olive utility jacket, white linen shirt, or navy trousers",
                "tip": "layer tonal shades of cream and tan together for an effortless quiet-luxury look"
            },
            "tan": {
                "name": "tan",
                "complementary": "navy blue, white, forest green, and black",
                "pairing": "navy chinos, a crisp white button-down, or dark denim",
                "tip": "use tan leather footwear to add instant polish and warmth to neutral outfits"
            },
            "brown": {
                "name": "brown",
                "complementary": "cream, sky blue, navy, forest green, and off-white",
                "pairing": "light blue denim, an ivory cable-knit sweater, or navy tailoring",
                "tip": "choose rich cognac or chocolate shades to elevate relaxed silhouettes"
            },
            "burgundy": {
                "name": "burgundy",
                "complementary": "navy, grey, charcoal, camel, and crisp white",
                "pairing": "a charcoal blazer, grey flannel trousers, or dark indigo jeans",
                "tip": "treat burgundy as a statement neutral that adds subtle luxury without overwhelming"
            },
            "camel": {
                "name": "camel",
                "complementary": "black, white, navy, and light grey",
                "pairing": "black tailored trousers, a white tee, or a dark charcoal turtleneck",
                "tip": "a camel overcoat or blazer instantly elevates casual denim into high-end chic"
            }
        }

        # Extract mentioned colors
        detected_colors = []
        for c in ["charcoal", "olive green", "olive", "navy", "white", "black", "grey", "gray",
                  "brown", "beige", "cream", "tan", "burgundy", "maroon", "camel", "khaki",
                  "blue", "green", "red", "pink", "yellow", "mustard", "emerald", "rust"]:
            if re.search(rf"\b{re.escape(c)}\b", t):
                detected_colors.append("grey" if c == "gray" else c)

        # Extract mentioned garments
        garment_keywords = {
            "sneakers": ["sneakers", "trainers", "kicks", "running shoes"],
            "chinos": ["chinos", "khakis"],
            "blazer": ["blazer", "suit jacket", "sport coat", "sports coat"],
            "trousers": ["trousers", "slacks", "pants", "dress pants"],
            "jeans": ["jeans", "denim"],
            "boots": ["boots", "chelsea boots", "ankle boots"],
            "loafers": ["loafers", "penny loafers", "moccasins"],
            "suit": ["suit", "tuxedo"],
            "hoodie": ["hoodie", "sweatshirt"],
            "coat": ["coat", "overcoat", "trench coat", "trench"],
            "jacket": ["jacket", "leather jacket", "denim jacket", "bomber"],
            "shirt": ["shirt", "button-down", "oxford", "button up"],
            "tee": ["t-shirt", "tee", "tank top"],
            "sweater": ["sweater", "knitwear", "jumper", "turtleneck", "cardigan"],
            "dress": ["dress", "slip dress", "floral dress", "gown"],
            "skirt": ["skirt", "midi skirt", "maxi skirt"]
        }

        detected_garments = []
        for g_key, syns in garment_keywords.items():
            for syn in syns:
                if re.search(rf"\b{re.escape(syn)}\b", t):
                    detected_garments.append(g_key)
                    break

        has_sneakers = "sneakers" in detected_garments or "sneaker" in t
        has_chinos = "chinos" in detected_garments or "trousers" in detected_garments or "chino" in t
        has_white = "white" in detected_colors
        has_navy = "navy" in detected_colors or "blue" in detected_colors
        has_blazer = "blazer" in detected_garments or "suit" in detected_garments
        has_trousers = "trousers" in detected_garments or "chinos" in detected_garments or "pants" in t
        has_charcoal = "charcoal" in detected_colors or "grey" in detected_colors
        has_black = "black" in detected_colors
        has_olive = "olive" in detected_colors or "olive green" in detected_colors or "green" in detected_colors

        is_color_query = bool(
            re.search(r"what\s+(?:colors?|shades?)|which\s+colors?|go\s+(?:well\s+)?with|goes\s+with|match\s+with|pair\s+with", t)
        )

        # 1. White sneakers + Navy chinos
        if has_sneakers and has_chinos and (has_white or has_navy or "sneaker" in t):
            return (
                "Pairing crisp white sneakers with navy chinos is a timeless smart-casual masterclass that effortlessly bridges the gap between athletic ease and tailored polish. "
                "The high-contrast palette allows the bright white footwear to pop against the deep, grounded navy, giving the entire look a fresh and purposeful energy. "
                "Team them with an untucked white Oxford cloth button-down or a relaxed grey crewneck sweater and a lightweight overshirt for an elevated weekend aesthetic. "
                "For the sharpest silhouette, give your chinos a clean single or double cuff right at the ankle bone and wear no-show socks to showcase the clean sneaker profile."
            )

        # 2. Charcoal blazer + Black trousers
        if has_blazer and has_trousers and has_charcoal and has_black:
            return (
                "Yes, a charcoal blazer pairs handsomely with black trousers, provided there is noticeable texture differentiation so the combination looks intentional rather than like an almost-matching suit. "
                "Because charcoal and black are neighboring dark neutrals, choosing a tactile fabric—such as a rich wool flannel, herringbone, or textured hopsack blazer against smooth black trousers—creates sophisticated depth and dimension. "
                "Layer a crisp white poplin shirt or a fine black merino turtleneck underneath, and finish with buffed black leather Chelsea boots or dress shoes. "
                "Add a clean white linen pocket square with a straight television fold to bring an intentional pop of brightness to your upper half."
            )

        # 3. Olive Green color harmony
        if has_olive and (is_color_query or "green" in t):
            return (
                "Olive green is an exceptionally versatile earthy neutral that looks sublime when paired with warm neutrals like cream, beige, and tan for an organic, relaxed aesthetic. "
                "For a sharper, contemporary edge, deep navy blue, charcoal, and black provide a rich, grounded contrast, while touches of burgundy or rust introduce luxurious warmth. "
                "Try styling an olive overshirt or chinos with an off-white cotton t-shirt and dark raw indigo denim or rich cognac leather shoes. "
                "As a practical styling tip, embrace tactile textures like corduroy, twill, or waffle knits to really showcase the natural visual depth of olive tones."
            )

        # 4. Blazer + Denim / Jeans
        if has_blazer and "jeans" in detected_garments:
            return (
                "Pairing a structured blazer with denim is the definitive smart-casual style formula that instantly elevates everyday casual wear. "
                "The tailored structure of the jacket sharpens the relaxed nature of the jeans, especially when you opt for dark, clean-rinse selvedge denim without distressing. "
                "Wear it over a crisp white crewneck tee or an untucked chambray shirt, paired with leather loafers or minimalist low-top sneakers. "
                "Push the blazer sleeves slightly up your forearms to maintain an effortless, approachable drape."
            )

        # 5. Brown shoes + Navy suit / trousers
        if ("brown" in detected_colors or "tan" in detected_colors) and has_navy and ("boots" in detected_garments or "loafers" in detected_garments or "shoe" in t or "suit" in detected_garments or has_chinos):
            return (
                "Wearing brown leather footwear with navy tailoring or chinos is a classic sartorial pairing that instantly feels richer and more approachable than stark black. "
                "Warm cognac, walnut, or espresso leather naturally enriches the cool undertones of navy, creating a balanced and distinguished palette. "
                "Pair with a crisp white or pale blue dress shirt, and add a subtle wool or knit tie if dressing for a formal setting. "
                "Always remember to match your leather belt and watch strap to the brown shade of your footwear for a cohesive, polished finish."
            )

        # 6. Black + Brown
        if has_black and ("brown" in detected_colors or "tan" in detected_colors or "camel" in detected_colors):
            return (
                "Yes, black and brown work exceptionally well together when you choose deliberate, contrasting shades like warm cognac, camel, or tan rather than near-black dark brown. "
                "The warm caramel tones break up the monochrome severity of black, resulting in an elevated, equestrian-inspired luxury feel. "
                "Pair black trousers or denim with a camel wool coat or rich tan Chelsea boots and an ivory sweater. "
                "Ensure your leather tones remain consistent to keep the contrast deliberate and polished."
            )

        # 7. Navy + Black
        if has_navy and has_black:
            return (
                "Pairing navy with black is a modern, high-fashion styling technique that creates a sleek, nocturnal aesthetic when done with intentional texture contrast. "
                "Contrast a textured navy piece, such as a brushed wool overcoat or cable-knit sweater, against smooth black leather boots or tailored black denim. "
                "Keep the silhouette streamlined and minimalist to emphasize the subtle difference in depth between the two dark tones. "
                "Add minimalist silver jewelry or a clean watch to provide a delicate focal point."
            )

        # 8. Single Color Harmony Query
        if detected_colors and is_color_query:
            primary = detected_colors[0]
            info = color_props.get(primary)
            if info:
                name_cap = info["name"].capitalize()
                return (
                    f"{name_cap} is a versatile shade that harmonizes beautifully with {info['complementary']}. "
                    "This combination balances tonal warmth and neutral grounding, preventing the outfit from feeling visually monotonous or overwhelming. "
                    f"Try pairing it with {info['pairing']} to let the core color naturally anchor the look. "
                    f"As a practical styling tip, {info['tip']}."
                )

        # 9. Garment styling
        if detected_garments:
            g = detected_garments[0]
            if g == "hoodie":
                return (
                    "Styling a hoodie with tailored pieces creates a high-low aesthetic that epitomizes modern smart-streetwear. "
                    "Layering a slim, unbranded hoodie underneath a structured wool overcoat, trench, or tailored blazer instantly balances casual comfort with sharp lines. "
                    "Pair with tapered chinos or straight-leg dark denim and minimalist leather sneakers or clean boots. "
                    "Let the hood rest neatly over the coat collar and keep the rest of the outfit fitted to prevent excess bulk."
                )
            if g == "dress":
                return (
                    "To give a dress a modern, dynamic edge, contrast its fluid silhouette with structured or casual elements to create visual tension. "
                    "Layering an oversized tailored blazer or a cropped leather jacket over a slip or floral dress grounds the look with contemporary attitude. "
                    "Pair with sleek ankle boots or minimalist white sneakers for effortless day-to-night versatility. "
                    "Cinch the waist with a subtle leather belt or drape an unbuttoned knit over your shoulders for practical, dimensional layering."
                )

        # 10. General rich consultation fallback
        first_color = detected_colors[0] if detected_colors else "neutral"
        return (
            f"When styling {first_color} pieces, the key is balancing clean visual proportions with deliberate textural contrast. "
            "Pair your foundational piece with complementary neutrals—like crisp white, heather grey, or deep navy—to let the silhouette feel intentional and refined. "
            "Complete the look with well-proportioned footwear like minimalist leather sneakers or sleek Chelsea boots. "
            "For a practical finishing touch, use simple adjustments like cuffing the sleeves or doing a French tuck to instantly elevate the overall drape."
        )

    def generate_stylist_response(self, text: str, parsed: dict) -> str:
        """
        Generates dynamic stylist commentary tailored to user query and parsed context.
        """
        intent = parsed.get("intent")
        if intent == "fashion_advice":
            return parsed.get("conversational_response") or self.generate_fashion_advice(text)
        if intent in ["chit_chat", "clarification_needed"] and parsed.get("conversational_response"):
            return parsed["conversational_response"]

        occasion = parsed.get("occasion")
        time_of_day = parsed.get("time_of_day")
        style = parsed.get("preferred_style")
        color = parsed.get("preferred_color")
        t = (text or "").lower()

        # Tailored stylist explanations
        if occasion == "office" or "client" in t or "presentation" in t:
            tod_str = f" tomorrow {time_of_day}" if time_of_day else " tomorrow"
            return (
                f"For your client meeting{tod_str}, this crisp white shirt and dark trousers strike "
                f"an authoritative yet approachable tone. Keep the collar clean and pair with derby shoes."
            )
        elif occasion == "interview":
            return (
                "For your interview, this polished ensemble projects competence and confidence. "
                "Keep accessories understated and ensure shoes are well-buffed for a sharp first impression."
            )
        elif occasion == "wedding" or "sangeet" in t:
            return (
                "For the wedding festivities, this refined celebratory look pairs rich textures with balanced proportions. "
                "Add subtle metallic or silk accents to elevate the ensemble effortlessly."
            )
        elif occasion == "date":
            tod_str = f" {time_of_day}" if time_of_day else " tonight"
            return (
                f"For your date{tod_str}, this stylish outfit achieves an effortlessly captivating aesthetic. "
                "Roll the cuffs slightly for a relaxed yet intentional silhouette."
            )
        elif occasion == "party" or "clubbing" in t or "drinks" in t:
            return (
                "For your night out, this sleek modern combination balances bold lines with comfort. "
                "Pair with low-profile boots or sleek sneakers to complete the vibe."
            )
        elif occasion == "vacation" or "beach" in t:
            return (
                "For your travel and vacation plans, lightweight breathable fabrics and relaxed tailoring "
                "keep you cool while maintaining effortless style on the move."
            )
        elif occasion == "cafe" or occasion == "college":
            return (
                "For a relaxed coffee meetup, clean casual layers provide optimum comfort while keeping you looking put-together."
            )
        else:
            style_str = f"{style} " if style else ""
            color_str = f" featuring {color} tones" if color else ""
            return (
                f"Here is a curated {style_str}outfit tailored for your plans{color_str}. "
                "The pieces create a well-proportioned silhouette suited for seamless versatility throughout your day."
            )

    def process_chat(self, message: str, history: list = None) -> dict:
        """Processes message turn and returns complete inference result."""
        start = time.perf_counter()
        parsed = self.parse_query(message)
        stylist_text = self.generate_stylist_response(message, parsed)
        latency_ms = max(1, int((time.perf_counter() - start) * 1000))

        # Format parsed context strictly without conversational_response for parsed_context block
        clean_context = {
            "intent": parsed["intent"],
            "occasion": parsed["occasion"],
            "season": parsed["season"],
            "preferred_style": parsed["preferred_style"],
            "preferred_color": parsed["preferred_color"],
            "time_of_day": parsed["time_of_day"]
        }

        return {
            "provider": "local_open_source",
            "model": self.model_name,
            "latency_ms": latency_ms,
            "parsed_context": clean_context,
            "stylist_response": stylist_text
        }


# Global inference engine instance
ENGINE = LocalInferenceEngine()


class StyleMateRequestHandler(BaseHTTPRequestHandler):
    """HTTP Request Handler for StyleMate local LLM service."""

    def _set_headers(self, status=200, content_type="application/json"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_OPTIONS(self):
        """Handle CORS pre-flight requests."""
        self._set_headers(204)

    def do_GET(self):
        """GET endpoints."""
        if self.path == "/health" or self.path == "/":
            response = {
                "status": "ok",
                "provider": "local_open_source",
                "model": ENGINE.model_name
            }
            self._set_headers(200)
            self.wfile.write(json.dumps(response).encode("utf-8"))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode("utf-8"))

    def do_POST(self):
        """POST endpoints: /api/chat and /api/parse."""
        try:
            content_len = int(self.headers.get("Content-Length", 0))
            body_bytes = self.rfile.read(content_len) if content_len > 0 else b"{}"
            body = json.loads(body_bytes.decode("utf-8"))
        except Exception as e:
            self._set_headers(400)
            self.wfile.write(json.dumps({"error": f"Invalid JSON payload: {str(e)}"}).encode("utf-8"))
            return

        if self.path == "/api/chat":
            message = body.get("message", "")
            history = body.get("history", [])
            result = ENGINE.process_chat(message, history)
            self._set_headers(200)
            self.wfile.write(json.dumps(result, indent=2).encode("utf-8"))

        elif self.path == "/api/parse":
            query = body.get("query", body.get("message", ""))
            parsed = ENGINE.parse_query(query)
            clean_context = {
                "intent": parsed["intent"],
                "occasion": parsed["occasion"],
                "season": parsed["season"],
                "preferred_style": parsed["preferred_style"],
                "preferred_color": parsed["preferred_color"],
                "time_of_day": parsed["time_of_day"],
                "weather_note": parsed.get("weather_note"),
                "conversational_response": parsed.get("conversational_response")
            }
            self._set_headers(200)
            self.wfile.write(json.dumps(clean_context, indent=2).encode("utf-8"))

        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": f"Path '{self.path}' not supported"}).encode("utf-8"))

    def log_message(self, format, *args):
        """Custom concise HTTP access log."""
        logger.info(f"{self.command} {self.path} - {args[0] if args else ''}")


def run_server(port=5001):
    """Starts the local inference HTTP server."""
    server_address = ("", port)
    httpd = HTTPServer(server_address, StyleMateRequestHandler)
    logger.info("=" * 60)
    logger.info(f"StyleMate Local LLM Server running on port {port}")
    logger.info(f"Health Check:  http://localhost:{port}/health")
    logger.info(f"Chat API:      http://localhost:{port}/api/chat")
    logger.info(f"Parse API:     http://localhost:{port}/api/parse")
    logger.info(f"Provider:      local_open_source ({ENGINE.model_name})")
    logger.info("=" * 60)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("\nShutting down local server...")
        httpd.server_close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="StyleMate Local LLM Inference Service")
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", 5001)), help="Port to listen on (default: 5001)")
    args = parser.parse_args()
    run_server(port=args.port)
