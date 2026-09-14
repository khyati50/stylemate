"""
Feature Extractor — StyleMate Layer 2

Implements the 10 ML features defined in
docs/StyleMate_Layer2_Design_Specification.md.

All features output a Float in [0.0, 1.0] and are organized into four
sections exactly as the specification prescribes:

    Color Features
        1. neutral_ratio
        2. color_harmony
        3. color_count

    Style Features
        4. style_compatibility
        5. formality_consistency

    Context Features
        6. occasion_suitability
        7. seasonal_suitability
        8. layering_score

    Outfit Features
        9.  garment_compatibility
        10. outfit_completeness

The function signature retains user_preferences, weather, and user_history
to keep the calling interface stable across generate_data.py and ranker.py.
"""


# ===========================================================================
# Constants — Color
# ===========================================================================

NEUTRAL_COLORS = {"black", "white", "grey", "beige", "brown", "navy"}
WARM_COLORS    = {"red", "orange", "yellow", "pink", "beige", "brown"}
COOL_COLORS    = {"blue", "green", "purple", "navy"}

# Color harmony quality scores (0.0–1.0) for each harmony type.
# Used by _compute_color_harmony() to produce the final float score.
_HARMONY_SCORES = {
    "neutral_only":   1.00,  # All neutral — always safe
    "monochromatic":  0.90,  # Single non-neutral hue repeated — very cohesive
    "analogous":      0.80,  # Same temperature family — harmonious
    "complementary":  0.70,  # Warm + cool mix within limit — works with care
    "clashing":       0.10,  # Too many distinct hues — visually noisy
}


# ===========================================================================
# Constants — Style
# ===========================================================================

# Pairwise style compatibility matrix.
# 1.0 = strong pairing, 0.5 = neutral/acceptable, 0.0 = hard conflict.
STYLE_COMPATIBILITY = {
    frozenset({"casual",     "casual"}):     1.0,
    frozenset({"casual",     "streetwear"}): 1.0,
    frozenset({"casual",     "ethnic"}):     0.75,
    frozenset({"casual",     "formal"}):     0.5,
    frozenset({"casual",     "sporty"}):     0.5,
    frozenset({"formal",     "formal"}):     1.0,
    frozenset({"formal",     "ethnic"}):     0.1,
    frozenset({"formal",     "streetwear"}): 0.25,
    frozenset({"formal",     "sporty"}):     0.0,
    frozenset({"streetwear", "streetwear"}): 1.0,
    frozenset({"streetwear", "ethnic"}):     0.5,
    frozenset({"streetwear", "sporty"}):     0.75,
    frozenset({"ethnic",     "ethnic"}):     1.0,
    frozenset({"ethnic",     "sporty"}):     0.25,
    frozenset({"sporty",     "sporty"}):     1.0,
}

# Formality rank for each style tag (0 = most casual, 3 = most formal).
# "ethnic" is its own class and is assigned a neutral midpoint rank of 2
# so it does not conflict with formal or casual scoring.
_FORMALITY_RANK = {
    "sporty":     0,
    "athletic":   0,
    "casual":     1,
    "streetwear": 1,
    "ethnic":     2,
    "smart":      2,
    "formal":     3,
}


# ===========================================================================
# Constants — Context
# ===========================================================================

# Seasons that demand outerwear for warmth (layering_score).
_COLD_SEASONS = {"winter", "autumn"}

# Slots treated as "core garments" for occasion/season suitability checks.
_CORE_SLOTS = ("upper_body", "lower_body", "full_body")


# ===========================================================================
# Shared utility helpers
# ===========================================================================

def _get_all_items(outfit):
    """
    Returns a flat list of all non-null clothing item dicts in the outfit.
    Handles the fact that 'accessories' is a list; everything else is a
    dict or None.
    """
    items = []
    for key, value in outfit.items():
        if key == "accessories":
            if isinstance(value, list):
                items.extend(v for v in value if isinstance(v, dict))
        elif isinstance(value, dict):
            items.append(value)
    return items


def _get_styles(item):
    """Returns a set of lowercase style tags for one item."""
    if item is None:
        return set()
    return {s.lower() for s in item.get("styles", []) if s}


def _get_occasions(item):
    """Returns a set of lowercase occasion tags for one item."""
    if item is None:
        return set()
    return {o.lower() for o in item.get("occasions", []) if o}


def _get_seasons(item):
    """Returns a set of lowercase season tags for one item."""
    if item is None:
        return set()
    return {s.lower() for s in item.get("seasons", []) if s}


def _collect_unique_colors(items):
    """Returns a set of lowercased unique color strings across all items."""
    colors = set()
    for item in items:
        for c in item.get("colors", []):
            if c:
                colors.add(c.lower())
    return colors


def _get_color_temperature(color):
    """Maps a named color to 'warm', 'cool', or 'neutral'."""
    if color in WARM_COLORS:
        return "warm"
    if color in COOL_COLORS:
        return "cool"
    return "neutral"


# ===========================================================================
# Section 1 — Color Features
# ===========================================================================

def _compute_neutral_ratio(unique_colors):
    """
    Feature 1 — neutral_ratio.
    Formula: Neutral colors / Total unique colors.
    Output:  0.0–1.0 (1.0 = fully neutral palette, safe default when empty)
    """
    if not unique_colors:
        return 1.0
    neutral_count = sum(1 for c in unique_colors if c in NEUTRAL_COLORS)
    return round(neutral_count / len(unique_colors), 4)


def _compute_color_harmony(unique_colors):
    """
    Feature 2 — color_harmony.
    Formula: Harmony matrix → Monochromatic / Analogous / Complementary /
             Neutral-only / Clashing → mapped to a 0.0–1.0 quality float.
    Output:  0.0–1.0
    """
    if not unique_colors:
        return _HARMONY_SCORES["neutral_only"]

    non_neutral = {c for c in unique_colors if c not in NEUTRAL_COLORS}

    if not non_neutral:
        return _HARMONY_SCORES["neutral_only"]

    if len(non_neutral) > 3:
        return _HARMONY_SCORES["clashing"]

    if len(non_neutral) == 1:
        return _HARMONY_SCORES["monochromatic"]

    temperatures = {_get_color_temperature(c) for c in non_neutral}

    if len(temperatures) == 1:
        return _HARMONY_SCORES["analogous"]

    return _HARMONY_SCORES["complementary"]


def _compute_color_count(unique_colors):
    """
    Feature 3 — color_count.
    Formula: Penalize outfits with more than 3 distinct colors.
    Output:  1.0 for ≤3 colors, decreasing linearly toward 0.0 at 6+ colors.
    """
    total = len(unique_colors)

    if total <= 3:
        return 1.0

    # Linear penalty: each color above 3 subtracts 1/3 from the score,
    # floored at 0.0 (reached at 6 or more distinct colors).
    penalty = (total - 3) / 3.0
    return round(max(0.0, 1.0 - penalty), 4)


# ===========================================================================
# Section 2 — Style Features
# ===========================================================================

def _compute_style_compatibility(items):
    """
    Feature 4 — style_compatibility.
    Formula: Style compatibility matrix — average pairwise score across
             all unique style tags present in the outfit.
    Output:  0.0–1.0 (1.0 = no conflict, single style or empty)
    """
    all_styles = []
    for item in items:
        for s in item.get("styles", []):
            if s:
                all_styles.append(s.lower())

    unique_styles = list(set(all_styles))

    if len(unique_styles) <= 1:
        return 1.0

    scores = []
    for i in range(len(unique_styles)):
        for j in range(i + 1, len(unique_styles)):
            pair = frozenset({unique_styles[i], unique_styles[j]})
            scores.append(STYLE_COMPATIBILITY.get(pair, 0.5))

    return round(sum(scores) / len(scores), 4) if scores else 1.0


def _compute_formality_consistency(outfit):
    """
    Feature 5 — formality_consistency.
    Formula: Measure consistency of formality across core garments.
             Computed as 1 − (formality_range / max_possible_range).
             A range of 0 (all items at same rank) → 1.0 (perfectly consistent).
             A range of 3 (sporty + formal in same outfit) → 0.0.
    Output:  0.0–1.0

    Only core garments (upper_body, lower_body, full_body, footwear) are
    evaluated. Accessories are excluded because they naturally bridge
    formality levels.
    """
    MAX_RANGE = 3.0  # max distance between sporty (0) and formal (3)

    core_slots = ("upper_body", "lower_body", "full_body", "footwear")
    ranks = []

    for slot in core_slots:
        item = outfit.get(slot)
        if item is None:
            continue
        item_styles = _get_styles(item)
        slot_ranks = [_FORMALITY_RANK.get(s, 1) for s in item_styles
                      if s in _FORMALITY_RANK]
        if slot_ranks:
            # Use the dominant (max) formality rank for this item
            ranks.append(max(slot_ranks))

    if len(ranks) < 2:
        return 1.0  # Can't measure inconsistency with fewer than 2 ranked items

    formality_range = max(ranks) - min(ranks)
    return round(1.0 - (formality_range / MAX_RANGE), 4)


# ===========================================================================
# Section 3 — Context Features
# ===========================================================================

def _compute_occasion_suitability(outfit, selected_occasion):
    """
    Feature 6 — occasion_suitability.
    Formula: Fraction of core garments that match the selected occasion.
             Items tagged 'all' always match.
    Output:  0.0–1.0 (1.0 if no occasion selected — full benefit of the doubt)
    """
    if not selected_occasion:
        return 1.0

    occasion = selected_occasion.lower()
    total    = 0
    matched  = 0

    for slot in _CORE_SLOTS:
        item = outfit.get(slot)
        if item is None:
            continue
        total += 1
        item_occasions = _get_occasions(item)
        if "all" in item_occasions or occasion in item_occasions:
            matched += 1

    return round(matched / total, 4) if total > 0 else 1.0


def _compute_seasonal_suitability(outfit, selected_season):
    """
    Feature 7 — seasonal_suitability.
    Formula: Fraction of core garments appropriate for the selected season.
             Items tagged 'all' always match.
    Output:  0.0–1.0 (1.0 if no season selected)
    """
    if not selected_season:
        return 1.0

    season = selected_season.lower()
    total  = 0
    matched = 0

    for slot in _CORE_SLOTS + ("footwear",):
        item = outfit.get(slot)
        if item is None:
            continue
        total += 1
        item_seasons = _get_seasons(item)
        if "all" in item_seasons or season in item_seasons:
            matched += 1

    return round(matched / total, 4) if total > 0 else 1.0


def _compute_layering_score(outfit, selected_season):
    """
    Feature 8 — layering_score.
    Formula: Evaluate whether layering is appropriate for the selected season.
             - Cold season (winter/autumn) with outerwear → 1.0
             - Cold season without outerwear             → 0.4
             - Warm season with outerwear                → 0.6 (slight penalty)
             - Warm season without outerwear             → 1.0
             - No season context                         → 0.8 (neutral)
    Output:  0.0–1.0
    """
    if not selected_season:
        return 0.8

    season         = selected_season.lower()
    has_outerwear  = bool(outfit.get("outerwear"))
    is_cold_season = season in _COLD_SEASONS

    if is_cold_season and has_outerwear:
        return 1.0
    if is_cold_season and not has_outerwear:
        return 0.4
    if not is_cold_season and has_outerwear:
        return 0.6
    return 1.0  # warm season, no outerwear — ideal


# ===========================================================================
# Section 4 — Outfit Features
# ===========================================================================

def _compute_garment_compatibility(outfit):
    """
    Feature 9 — garment_compatibility.
    Formula: Overall compatibility of Top ↔ Bottom ↔ Footwear ↔ Outerwear ↔
             Accessories, computed as the average pairwise style compatibility
             score between each slot pairing.
    Output:  0.0–1.0 (1.0 = single item or empty, no conflict possible)

    Unlike style_compatibility (which operates on the flat union of all style
    tags), garment_compatibility compares the dominant style of each
    slot/garment against every other slot — capturing inter-garment coherence
    rather than intra-outfit tag diversity.
    """
    def dominant_style(item):
        """Returns the single most formal style tag for an item."""
        if item is None:
            return None
        styles = _get_styles(item)
        if not styles:
            return None
        return max(styles, key=lambda s: _FORMALITY_RANK.get(s, 1))

    # Build one representative style per slot (accessories take first item)
    slot_styles = []
    for slot in ("upper_body", "lower_body", "full_body", "footwear", "outerwear"):
        ds = dominant_style(outfit.get(slot))
        if ds:
            slot_styles.append(ds)

    for acc in outfit.get("accessories", []):
        if isinstance(acc, dict):
            ds = dominant_style(acc)
            if ds:
                slot_styles.append(ds)

    if len(slot_styles) <= 1:
        return 1.0

    scores = []
    for i in range(len(slot_styles)):
        for j in range(i + 1, len(slot_styles)):
            pair = frozenset({slot_styles[i], slot_styles[j]})
            scores.append(STYLE_COMPATIBILITY.get(pair, 0.5))

    return round(sum(scores) / len(scores), 4) if scores else 1.0


def _compute_outfit_completeness(outfit):
    """
    Feature 10 — outfit_completeness.
    Formula: Check whether all required outfit pieces are present.
             Scored additively:
                 core (Top+Bottom or Full Body) → 0.50
                 footwear                        → 0.30
                 outerwear                       → 0.10
                 at least one accessory          → 0.10
    Output:  0.0–1.0
    """
    score = 0.0

    has_core = bool(outfit.get("full_body")) or (
        bool(outfit.get("upper_body")) and bool(outfit.get("lower_body"))
    )
    if has_core:
        score += 0.50

    if outfit.get("footwear"):
        score += 0.30

    if outfit.get("outerwear"):
        score += 0.10

    if outfit.get("accessories") and len(outfit["accessories"]) > 0:
        score += 0.10

    return round(score, 4)


# ===========================================================================
# Public API
# ===========================================================================

def extract_features(outfit, user_preferences, weather, user_history):
    """
    Extracts the 10 Layer 2 ML features from an outfit.

    All features output a Float in [0.0, 1.0] as specified in
    docs/StyleMate_Layer2_Design_Specification.md.

    Args:
        outfit           (dict): Outfit dict with slot keys and item dicts as values.
        user_preferences (dict): Must contain 'occasion' for context features.
        weather          (dict): Must contain 'season' for context features.
        user_history     (dict): Reserved for V2 wear-history features (unused here).

    Returns:
        dict: Exactly 10 feature keys, all float values in [0.0, 1.0].
    """
    items            = _get_all_items(outfit)
    unique_colors    = _collect_unique_colors(items)
    selected_occasion = user_preferences.get("occasion") if user_preferences else None
    selected_season   = weather.get("season") if weather else None

    return {

        # ------ Color Features ------

        "neutral_ratio":
            _compute_neutral_ratio(unique_colors),

        "color_harmony":
            _compute_color_harmony(unique_colors),

        "color_count":
            _compute_color_count(unique_colors),

        # ------ Style Features ------

        "style_compatibility":
            _compute_style_compatibility(items),

        "formality_consistency":
            _compute_formality_consistency(outfit),

        # ------ Context Features ------

        "occasion_suitability":
            _compute_occasion_suitability(outfit, selected_occasion),

        "seasonal_suitability":
            _compute_seasonal_suitability(outfit, selected_season),

        "layering_score":
            _compute_layering_score(outfit, selected_season),

        # ------ Outfit Features ------

        "garment_compatibility":
            _compute_garment_compatibility(outfit),

        "outfit_completeness":
            _compute_outfit_completeness(outfit),
    }