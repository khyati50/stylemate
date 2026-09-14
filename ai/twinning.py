"""
Couple / Friend Twinning AI Engine

Generates harmonized, coordinated outfit pairs for two users from their respective wardrobes.
"""

import json
import os
import sys
import traceback

# Ensure current dir and rule-engine are in Python path
AI_DIR = os.path.dirname(__file__)
sys.path.append(AI_DIR)
sys.path.append(os.path.join(AI_DIR, "rule-engine"))

from recommendation import recommend_outfits, _iter_outfit_items
from color_harmony import get_color_harmony_score


INCOMPATIBLE_STYLE_PAIRS = {
    frozenset(["formal", "sporty"]),
    frozenset(["ethnic", "sporty"]),
    frozenset(["formal", "ethnic"]),
}

COMPATIBLE_STYLE_PAIRS = {
    frozenset(["casual", "smart-casual"]),
    frozenset(["formal", "smart-casual"]),
    frozenset(["casual", "sporty"]),
}

SEMI_COMPATIBLE_STYLE_PAIRS = {
    frozenset(["casual", "ethnic"]),
    frozenset(["smart-casual", "ethnic"]),
    frozenset(["smart-casual", "sporty"]),
}


def classify_dominant_style(outfit):
    """
    Classifies the dominant style category of an outfit into:
    casual, formal, smart-casual, sporty, ethnic.
    """
    style_counts = {
        "casual": 0,
        "formal": 0,
        "smart-casual": 0,
        "sporty": 0,
        "ethnic": 0,
    }

    style_map = {
        "formal": "formal",
        "office": "formal",
        "business": "formal",
        "professional": "formal",
        "smart-casual": "smart-casual",
        "smart casual": "smart-casual",
        "semi-formal": "smart-casual",
        "chic": "smart-casual",
        "party": "smart-casual",
        "sporty": "sporty",
        "athletic": "sporty",
        "athleisure": "sporty",
        "gym": "sporty",
        "active": "sporty",
        "ethnic": "ethnic",
        "traditional": "ethnic",
        "desi": "ethnic",
        "indian": "ethnic",
        "festive": "ethnic",
        "casual": "casual",
        "streetwear": "casual",
        "everyday": "casual",
        "relaxed": "casual",
        "grunge": "casual",
        "boho": "casual",
        "vintage": "casual",
    }

    found_any = False
    for item in _iter_outfit_items(outfit):
        for raw_style in item.get("styles", []):
            if isinstance(raw_style, str):
                cleaned = raw_style.strip().lower()
                mapped = style_map.get(cleaned)
                if mapped:
                    style_counts[mapped] += 1
                    found_any = True

    if not found_any:
        return "casual"

    return max(style_counts, key=style_counts.get)


def get_style_alignment_score(style_a, style_b):
    """
    Evaluates style compatibility between two outfits.
    Range: 0.0 to 0.075
    """
    if style_a == style_b:
        return 0.075

    pair = frozenset([style_a, style_b])
    if pair in INCOMPATIBLE_STYLE_PAIRS:
        return 0.0
    if pair in COMPATIBLE_STYLE_PAIRS:
        return 0.04
    if pair in SEMI_COMPATIBLE_STYLE_PAIRS:
        return 0.03

    return 0.02


def extract_outfit_colors(outfit):
    """Extracts all color strings from outfit items."""
    colors = []
    for item in _iter_outfit_items(outfit):
        for c in item.get("colors", []):
            if isinstance(c, str) and c.strip():
                colors.append(c.strip().lower())
    return colors


def build_coordination_reason(style_a, style_b, color_descriptor, style_score):
    """Generates a human-friendly coordination description."""
    color_phrase = {
        "complementary neutral": "harmonious neutral tones",
        "complementary": "complementary color accents",
        "balanced contrast": "balanced contrasting tones",
        "neutral-accented": "neutral-accented palette",
        "monochromatic tonal": "monochromatic tonal shades",
        "high-contrast": "striking high-contrast elements",
        "harmonious": "harmonious color tones",
    }.get(color_descriptor, f"{color_descriptor} tones")

    if style_a == style_b:
        return f"Both outfits share a {style_a} style with {color_phrase}."
    else:
        if style_score >= 0.04:
            return f"Coordinated {style_a} and {style_b} looks paired with {color_phrase}."
        elif style_score > 0.0:
            return f"Eclectic blend of {style_a} and {style_b} pieces accented by {color_phrase}."
        else:
            return f"Contrasting {style_a} and {style_b} ensembles with {color_phrase}."


def generate_twinning_pairs(wardrobe_a, wardrobe_b, weather, occasion, season):
    """
    Generates and scores pairs of outfits for User A and User B.
    """
    weather_dict = weather or {"season": season or "summer", "temperature": 25, "condition": "sunny"}
    if "season" not in weather_dict and season:
        weather_dict["season"] = season

    user_pref = {"occasion": occasion or "casual"}

    # Generate top 8 outfits for Person A and top 8 for Person B
    outfits_a = recommend_outfits(
        wardrobe=wardrobe_a,
        weather=weather_dict,
        user_preferences=user_pref,
        user_history={}
    )[:8]

    outfits_b = recommend_outfits(
        wardrobe=wardrobe_b,
        weather=weather_dict,
        user_preferences=user_pref,
        user_history={}
    )[:8]

    if not outfits_a or not outfits_b:
        return []

    scored_pairs = []

    for solo_a in outfits_a:
        outfit_a = solo_a["outfit"]
        style_a = classify_dominant_style(outfit_a)
        colors_a = extract_outfit_colors(outfit_a)

        for solo_b in outfits_b:
            outfit_b = solo_b["outfit"]
            style_b = classify_dominant_style(outfit_b)
            colors_b = extract_outfit_colors(outfit_b)

            style_score = get_style_alignment_score(style_a, style_b)
            color_score, color_descriptor = get_color_harmony_score(colors_a, colors_b)

            coordination_bonus = min(0.15, style_score + color_score)
            pair_score = round(((solo_a["score"] + solo_b["score"]) / 2.0) + coordination_bonus, 4)

            coordination_reason = build_coordination_reason(
                style_a, style_b, color_descriptor, style_score
            )

            scored_pairs.append({
                "outfit_a": outfit_a,
                "outfit_b": outfit_b,
                "pair_score": pair_score,
                "solo_a_score": solo_a["score"],
                "solo_b_score": solo_b["score"],
                "style_score": round(style_score, 4),
                "color_score": round(color_score, 4),
                "coordination_bonus": round(coordination_bonus, 4),
                "style_a": style_a,
                "style_b": style_b,
                "color_descriptor": color_descriptor,
                "coordination_reason": coordination_reason,
            })

    # Sort all pairs descending by pair_score and take top 3
    scored_pairs.sort(key=lambda x: x["pair_score"], reverse=True)
    return scored_pairs[:3]


def main():
    try:
        raw_input = sys.stdin.read()
        if not raw_input.strip():
            raise ValueError("No input provided on stdin.")

        data = json.loads(raw_input)

        wardrobe_a = data.get("wardrobe_a", [])
        wardrobe_b = data.get("wardrobe_b", [])
        weather    = data.get("weather", {})
        occasion   = data.get("occasion", "casual")
        season     = data.get("season", "summer")

        pairs = generate_twinning_pairs(
            wardrobe_a=wardrobe_a,
            wardrobe_b=wardrobe_b,
            weather=weather,
            occasion=occasion,
            season=season,
        )

        print(json.dumps(pairs, default=str))

    except Exception as e:
        traceback.print_exc()
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
