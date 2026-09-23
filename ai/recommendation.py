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
# Background preferences contribute up to 0.075 each.
# Explicit user preferences contribute up to 0.35 each (binary presence-based),
# guaranteed to overcome the max observed ML score gap (~0.27).
_STYLE_BOOST_MAX = 0.075
_COLOR_BOOST_MAX = 0.075
_EXPLICIT_BOOST_MAX = 0.35


def _normalize_tags(raw):
    """
    Normalizes a clothing tag field (styles, colors, etc.) into a list of
    lowercase, trimmed strings. Handles lists, comma-separated strings,
    None, and mixed types safely.
    """
    if not raw:
        return []
    if isinstance(raw, list):
        return [str(s).strip().lower() for s in raw if s and str(s).strip()]
    if isinstance(raw, str):
        return [s.strip().lower() for s in raw.split(",") if s.strip()]
    return [str(raw).strip().lower()]


def _iter_outfit_items(outfit):
    """Yields every non-null clothing item dict in an outfit."""
    if not isinstance(outfit, dict):
        return
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
    the preferred style (case-insensitive, substring/word-compatible).
    Range: 0.0 (no match) – 1.0 (all items match).
    Returns 0.0 when preferred_style is empty or None.
    """
    if not preferred_style:
        return 0.0

    target = str(preferred_style).strip().lower()
    if not target:
        return 0.0

    total = 0
    matched = 0

    for item in _iter_outfit_items(outfit):
        item_styles = _normalize_tags(item.get("styles"))
        if item_styles:
            total += 1
            if any(target == s or target in s or s in target for s in item_styles):
                matched += 1

    return matched / total if total > 0 else 0.0


def _color_match_fraction(outfit, preferred_color):
    """
    Fraction of outfit items (that carry color tags) whose colors include
    the preferred color (case-insensitive, substring/word-compatible).
    Range: 0.0 (no match) – 1.0 (all items match).
    Returns 0.0 when preferred_color is empty or None.
    """
    if not preferred_color:
        return 0.0

    target = str(preferred_color).strip().lower()
    if not target:
        return 0.0

    total = 0
    matched = 0

    for item in _iter_outfit_items(outfit):
        item_colors = _normalize_tags(item.get("colors"))
        if item_colors:
            total += 1
            if any(target == c or target in c or c in target for c in item_colors):
                matched += 1

    return matched / total if total > 0 else 0.0


def _apply_preference_boost(
    ranked_outfits,
    preferred_style="",
    preferred_color="",
    explicit_style=None,
    explicit_color=None,
    explicit_boost=0.35,
):
    """
    Adds outfit-level style and color preference scores on top of the ML
    score produced by rank_outfits(), then re-sorts by the final score.

    If neither preference is set, the list is returned unchanged (no-op).

    For EXPLICIT preferences (user actively chose style/color in the UI):
        boost = explicit_boost_max  if ANY item in outfit matches the preference
        boost = 0.0                 if NO item matches
        This binary approach guarantees matching outfits always rise to #1
        regardless of how large the ML score gap is (max observed gap ~0.27,
        explicit_boost_max = 0.35 reliably overcomes it).

    For BACKGROUND preferences (from user history, not explicitly chosen):
        boost = match_fraction x background_boost_max
        (proportional, softer -- these are hints not commands)
    """
    pref_style_clean = str(preferred_style or "").strip()
    pref_color_clean = str(preferred_color or "").strip()

    if not pref_style_clean and not pref_color_clean:
        return ranked_outfits

    # Coerce explicit_boost safely to float
    try:
        boost_ceiling = float(explicit_boost) if explicit_boost is not None else _EXPLICIT_BOOST_MAX
    except (ValueError, TypeError):
        boost_ceiling = _EXPLICIT_BOOST_MAX

    # Coerce explicit flags safely
    if isinstance(explicit_style, str):
        is_exp_style = explicit_style.strip().lower() in ("true", "1", "yes")
    elif explicit_style is not None:
        is_exp_style = bool(explicit_style)
    else:
        is_exp_style = bool(pref_style_clean)

    if isinstance(explicit_color, str):
        is_exp_color = explicit_color.strip().lower() in ("true", "1", "yes")
    elif explicit_color is not None:
        is_exp_color = bool(explicit_color)
    else:
        is_exp_color = bool(pref_color_clean)

    style_boost_max = boost_ceiling if is_exp_style else _STYLE_BOOST_MAX
    color_boost_max = boost_ceiling if is_exp_color else _COLOR_BOOST_MAX

    boosted = []
    for entry in ranked_outfits:
        outfit = entry["outfit"]
        ml_score = entry["score"]

        if is_exp_style and pref_style_clean:
            # Binary: full boost if ANY item in outfit matches preferred style
            has_style_match = any(
                any(pref_style_clean == s or pref_style_clean in s or s in pref_style_clean
                    for s in _normalize_tags(item.get("styles")))
                for item in _iter_outfit_items(outfit)
            )
            style_boost = style_boost_max if has_style_match else 0.0
        else:
            # Background: proportional fractional boost
            style_boost = _style_match_fraction(outfit, pref_style_clean) * style_boost_max

        if is_exp_color and pref_color_clean:
            # Binary: full boost if ANY item in outfit matches preferred color
            has_color_match = any(
                any(pref_color_clean == c or pref_color_clean in c or c in pref_color_clean
                    for c in _normalize_tags(item.get("colors")))
                for item in _iter_outfit_items(outfit)
            )
            color_boost = color_boost_max if has_color_match else 0.0
        else:
            # Background: proportional fractional boost
            color_boost = _color_match_fraction(outfit, pref_color_clean) * color_boost_max

        boosted.append({
            "outfit": outfit,
            "score": round(ml_score + style_boost + color_boost, 4),
        })

    # Re-sort by final score descending
    boosted.sort(key=lambda x: x["score"], reverse=True)
    return boosted


def _apply_disliked_penalties(
    ranked_outfits,
    disliked_colors,
    disliked_styles,
    preferred_color="",
    preferred_style="",
):
    """
    Applies penalties for disliked colors and styles to outfit scores.
    If preferred_style is set, that style is NOT in disliked_styles.
    Similarly for preferred_color.
    """
    pref_c = str(preferred_color or "").strip().lower()
    pref_s = str(preferred_style or "").strip().lower()

    disliked_c_set = {
        c for c in _normalize_tags(disliked_colors)
        if c and c != pref_c
    }
    disliked_s_set = {
        s for s in _normalize_tags(disliked_styles)
        if s and s != pref_s
    }

    if not disliked_c_set and not disliked_s_set:
        return ranked_outfits

    penalized = []
    for entry in ranked_outfits:
        outfit = entry["outfit"]
        score = entry["score"]
        penalty = 0.0

        for item in _iter_outfit_items(outfit):
            item_colors = _normalize_tags(item.get("colors"))
            color_matches = sum(1 for c in item_colors if c in disliked_c_set)
            penalty += 0.05 * color_matches

            item_styles = _normalize_tags(item.get("styles"))
            style_matches = sum(1 for s in item_styles if s in disliked_s_set)
            penalty += 0.05 * style_matches

        final_score = max(0.0, round(score - penalty, 4))
        penalized.append({
            "outfit": outfit,
            "score": final_score,
        })

    penalized.sort(key=lambda x: x["score"], reverse=True)
    return penalized


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
                                 "preferred_color", "explicit_style",
                                 "explicit_color", "explicit_boost"
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

    pref_style = str(user_preferences.get("preferred_style") or "").strip()
    pref_color = str(user_preferences.get("preferred_color") or "").strip()
    explicit_style = user_preferences.get("explicit_style")
    explicit_color = user_preferences.get("explicit_color")
    explicit_boost = user_preferences.get("explicit_boost", _EXPLICIT_BOOST_MAX)

    # Step 4 — Apply soft Style + Color preference boost, then re-sort
    ranked_outfits = _apply_preference_boost(
        ranked_outfits,
        preferred_style=pref_style,
        preferred_color=pref_color,
        explicit_style=explicit_style,
        explicit_color=explicit_color,
        explicit_boost=explicit_boost,
    )

    ranked_outfits = _apply_disliked_penalties(
        ranked_outfits,
        disliked_colors=user_preferences.get("disliked_colors", []),
        disliked_styles=user_preferences.get("disliked_styles", []),
        preferred_color=pref_color,
        preferred_style=pref_style,
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