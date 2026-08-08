"""
Recommendation Pipeline

Main entry point for the StyleMate AI recommendation system.

Architecture (per StyleMate_Final_Recommendation_Spec.md):
  1. Hard filter: Occasion + Season (item-level)
  2. Generate complete valid outfits
  3. ML ranking via ranker.py
  4. Soft preference scoring: Style + Color (outfit-level, additive)
  5. Final re-sort by combined score
"""

import json
import os
import sys
import traceback

# Ensure rule-engine is in path for module imports
sys.path.append(os.path.join(os.path.dirname(__file__), "rule-engine"))

from outfit_generator import group_clothes_by_slot, generate_outfits
from clothing_filter import filter_clothes
from ranker import rank_outfits


# ---------------------------------------------------------------------------
# Soft preference scoring helpers
# ---------------------------------------------------------------------------

# ML score range observed: ~0.67–0.94, std ~0.07.
# Each preference contributes up to 0.075, so combined max boost = 0.15.
# This is ~2× the typical std — enough to reorder outfits when there is a
# meaningful preference match, without overriding the ML quality signal.
_STYLE_BOOST_MAX = 0.075
_COLOR_BOOST_MAX = 0.075


def _iter_outfit_items(outfit):
    """Yields every non-null clothing item dict in an outfit."""
    for key, value in outfit.items():
        if key == "accessories":
            for acc in (value or []):
                if isinstance(acc, dict):
                    yield acc
        elif isinstance(value, dict):
            yield value


def _style_match_fraction(outfit, preferred_style):
    """
    Fraction of outfit items (that carry style tags) whose styles include
    the preferred style. Range: 0.0 (no match) – 1.0 (all items match).
    Returns 0.0 when preferred_style is empty.
    """
    if not preferred_style:
        return 0.0

    target = preferred_style.lower()
    total = 0
    matched = 0

    for item in _iter_outfit_items(outfit):
        item_styles = [s.lower() for s in item.get("styles", []) if s]
        if item_styles:
            total += 1
            if target in item_styles:
                matched += 1

    return matched / total if total > 0 else 0.0


def _color_match_fraction(outfit, preferred_color):
    """
    Fraction of outfit items (that carry color tags) whose colors include
    the preferred color. Range: 0.0 (no match) – 1.0 (all items match).
    Returns 0.0 when preferred_color is empty.
    """
    if not preferred_color:
        return 0.0

    target = preferred_color.lower()
    total = 0
    matched = 0

    for item in _iter_outfit_items(outfit):
        item_colors = [c.lower() for c in item.get("colors", []) if c]
        if item_colors:
            total += 1
            if target in item_colors:
                matched += 1

    return matched / total if total > 0 else 0.0


def _apply_preference_boost(ranked_outfits, preferred_style, preferred_color):
    """
    Adds outfit-level style and color preference scores on top of the ML
    score produced by rank_outfits(), then re-sorts by the final score.

    If neither preference is set, the list is returned unchanged (no-op).

    Formula:
        style_boost = _style_match_fraction(outfit) * _STYLE_BOOST_MAX
        color_boost = _color_match_fraction(outfit) * _COLOR_BOOST_MAX
        final_score = ml_score + style_boost + color_boost

    Boosts are proportional to how strongly the complete outfit matches the
    preference, so partial matches still rise above no-match outfits.

    Args:
        ranked_outfits (list[dict]): Output of rank_outfits() — each entry
            has keys "outfit" and "score".
        preferred_style (str): User's preferred style tag, or empty string.
        preferred_color (str): User's preferred color tag, or empty string.

    Returns:
        list[dict]: Re-sorted list with final scores. Order is the true
            recommendation order.
    """
    if not preferred_style and not preferred_color:
        return ranked_outfits

    boosted = []
    for entry in ranked_outfits:
        outfit = entry["outfit"]
        ml_score = entry["score"]

        style_boost = _style_match_fraction(outfit, preferred_style) * _STYLE_BOOST_MAX
        color_boost = _color_match_fraction(outfit, preferred_color) * _COLOR_BOOST_MAX

        boosted.append({
            "outfit": outfit,
            "score": round(ml_score + style_boost + color_boost, 4),
        })

    # Re-sort by final score descending — this IS the final recommendation order
    boosted.sort(key=lambda x: x["score"], reverse=True)
    return boosted


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def recommend_outfits(wardrobe, weather, user_preferences, user_history):
    """
    Generates and ranks outfit recommendations.

    Hard constraints : Occasion + Season  (item-level filter)
    Soft preferences : Style + Color      (outfit-level scoring, post-ML)

    Args:
        wardrobe         (list)
        weather          (dict): must contain "season"
        user_preferences (dict): may contain "occasion", "preferred_style",
                                 "preferred_color"
        user_history     (dict)

    Returns:
        list[dict]: Ranked outfits, each {"outfit": ..., "score": ...}
    """

    # Step 1 — Hard filter: Occasion + Season only
    filtered_clothes = filter_clothes(
        clothes=wardrobe,
        selected_season=weather.get("season"),
        selected_occasions=(
            [user_preferences.get("occasion")]
            if user_preferences.get("occasion")
            else []
        ),
    )

    # Step 2 — Generate complete valid outfits
    grouped_clothes = group_clothes_by_slot(filtered_clothes)

    outfits = generate_outfits(
        grouped_clothes,
        selected_season=weather.get("season"),
        selected_occasion=user_preferences.get("occasion"),
    )

    # Step 3 — ML ranking (feature extraction + model predict + sort)
    ranked_outfits = rank_outfits(
        outfits=outfits,
        weather=weather,
        user_preferences=user_preferences,
        user_history=user_history,
    )

    # Step 4 — Apply soft Style + Color preference boost, then re-sort
    ranked_outfits = _apply_preference_boost(
        ranked_outfits,
        preferred_style=user_preferences.get("preferred_style", ""),
        preferred_color=user_preferences.get("preferred_color", ""),
    )

    return ranked_outfits


def main():
    try:
        raw_input = sys.stdin.read()
        if not raw_input.strip():
            raise ValueError("No input provided on stdin.")

        data = json.loads(raw_input)

        wardrobe         = data.get("wardrobe", [])
        weather          = data.get("weather", {})
        user_preferences = data.get("user_preferences", {})
        user_history     = data.get("user_history", {})

        ranked_outfits = recommend_outfits(
            wardrobe=wardrobe,
            weather=weather,
            user_preferences=user_preferences,
            user_history=user_history,
        )

        print(json.dumps(ranked_outfits, default=str))

    except Exception as e:
        traceback.print_exc()
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()