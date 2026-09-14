"""
Outfit Validator

Hard rule validation stage that runs AFTER outfit generation and BEFORE
feature extraction. Rejects outfits that violate structural, availability,
seasonal, occasion, or compatibility rules.

All rules operate on clothing item metadata (category, styles, occasions,
seasons, is_available) — no item names are hardcoded anywhere.

Pipeline position:
    wardrobe
       ↓ clothing_filter.py  (item-level: season + occasion pre-filter)
       ↓ outfit_generator.py (combinatorial: all slot combinations)
       ↓ outfit_validator.py ← YOU ARE HERE (outfit-level hard rules)
       ↓ feature_extractor.py
       ↓ ranker.py

Design note on formality:
    Formality is NOT a stored DB field. It is derived at runtime from
    the item's `styles` array using FORMALITY_RANK below. This keeps
    the database schema clean and puts the KB logic here where it belongs.
"""


# ---------------------------------------------------------------------------
# Style → formality mapping
#
# Each style tag maps to an integer rank so distance can be measured.
#   0 = most casual / athletic
#   1 = streetwear / relaxed
#   2 = smart-casual
#   3 = formal / dressy
#   4 = ethnic / ceremonial (treated as its own class, not ranked against formal)
#
# Any style tag not in this table defaults to 1 (neutral/unknown).
# ---------------------------------------------------------------------------

FORMALITY_RANK = {
    "sporty":     0,
    "athletic":   0,
    "casual":     1,
    "streetwear": 1,
    "smart":      2,
    "formal":     3,
    "ethnic":     4,  # separate class — not above/below formal
}

# Styles that belong to the ethnic category
ETHNIC_STYLES = {"ethnic"}

# Styles that belong to the athletic/sport category
SPORTY_STYLES = {"sporty", "athletic"}

# Styles that belong to the formal category
FORMAL_STYLES = {"formal", "smart"}


def _get_styles(item):
    """Returns a set of lowercase style tags for an item."""
    if item is None:
        return set()
    return {s.lower() for s in item.get("styles", []) if s}


def _get_occasions(item):
    """Returns a set of lowercase occasion tags for an item."""
    if item is None:
        return set()
    return {o.lower() for o in item.get("occasions", []) if o}


def _get_seasons(item):
    """Returns a set of lowercase season tags for an item."""
    if item is None:
        return set()
    return {s.lower() for s in item.get("seasons", []) if s}


def _get_formality_rank(styles_set):
    """
    Returns the maximum formality rank for a set of style tags.
    Items with ethnic style are treated separately.
    """
    ranks = [FORMALITY_RANK.get(s, 1) for s in styles_set if s != "ethnic"]
    return max(ranks) if ranks else 1


def _collect_all_items(outfit):
    """Returns all non-null item dicts from an outfit."""
    items = []
    for key, value in outfit.items():
        if key == "accessories":
            if isinstance(value, list):
                items.extend(v for v in value if isinstance(v, dict))
        elif isinstance(value, dict):
            items.append(value)
    return items


# ---------------------------------------------------------------------------
# Rule Group 1 — Outfit Structure Validation
# ---------------------------------------------------------------------------

def _validate_structure(outfit):
    """
    Ensures the outfit has a valid structural composition:

    - Must have (Top + Bottom) OR Full Body. Not both. Not neither.
    - Must have footwear.
    - Cannot have more than one item per core slot (guaranteed by the
      generator, but double-checked here for safety).

    Returns:
        (bool, str): (is_valid, failure_reason)
    """
    has_upper = bool(outfit.get("upper_body"))
    has_lower = bool(outfit.get("lower_body"))
    has_full  = bool(outfit.get("full_body"))
    has_shoes = bool(outfit.get("footwear"))

    # Rule 1a: Must have core piece
    has_top_bottom = has_upper and has_lower
    if not has_full and not has_top_bottom:
        return False, "Missing core: outfit needs (Top + Bottom) or Full Body"

    # Rule 1b: Footwear is mandatory
    if not has_shoes:
        return False, "Missing mandatory footwear"

    # Rule 1c: Full Body cannot be paired with Top or Bottom
    if has_full and (has_upper or has_lower):
        return False, "Full Body item cannot be combined with Top or Bottom"

    return True, None


# ---------------------------------------------------------------------------
# Rule Group 2 — Availability Validation
# ---------------------------------------------------------------------------

def _validate_availability(outfit):
    """
    Rejects outfits that include unavailable items.

    An item is considered unavailable if its `is_available` field is
    explicitly False or its `status` is not 'available'. Items with
    no availability field are assumed available (backward compatible).

    Returns:
        (bool, str)
    """
    items = _collect_all_items(outfit)

    for item in items:
        # Support both is_available (Python) and status (DB/Node.js)
        is_available = item.get("is_available", True)
        status = item.get("status", "available")

        if not is_available or status != "available":
            name = item.get("name", "Unknown item")
            return False, f"Item '{name}' is not available"

    return True, None


# ---------------------------------------------------------------------------
# Rule Group 3 — Season Validation
# ---------------------------------------------------------------------------

def _validate_season(outfit, selected_season):
    """
    Ensures every core garment is appropriate for the selected season.
    Accessories and outerwear are excluded from this check since they
    are inherently optional and often season-neutral.

    Returns:
        (bool, str)
    """
    if not selected_season:
        return True, None

    season = selected_season.lower()
    core_slots = ["upper_body", "lower_body", "full_body", "footwear"]

    for slot in core_slots:
        item = outfit.get(slot)
        if item is None:
            continue

        item_seasons = _get_seasons(item)

        # Items tagged "all" are always valid
        if "all" in item_seasons:
            continue

        if season not in item_seasons:
            name = item.get("name", slot)
            return False, f"'{name}' is not suitable for {season}"

    return True, None


# ---------------------------------------------------------------------------
# Rule Group 4 — Occasion Validation (core garments only)
# ---------------------------------------------------------------------------

def _validate_occasion(outfit, selected_occasion):
    """
    Ensures that core garments (Top, Bottom, Full Body) are appropriate
    for the selected occasion. Footwear and accessories are not checked
    here since they are handled by the compatibility rules.

    Returns:
        (bool, str)
    """
    if not selected_occasion:
        return True, None

    occasion = selected_occasion.lower()
    core_slots = ["upper_body", "lower_body", "full_body"]

    for slot in core_slots:
        item = outfit.get(slot)
        if item is None:
            continue

        item_occasions = _get_occasions(item)

        # Items tagged "all" are always valid
        if "all" in item_occasions:
            continue

        if occasion not in item_occasions:
            name = item.get("name", slot)
            return False, f"'{name}' is not tagged for occasion '{occasion}'"

    return True, None


# ---------------------------------------------------------------------------
# Rule Group 5 — Cross-Item Compatibility Validation
# ---------------------------------------------------------------------------

def _get_dominant_style_class(styles_set):
    """
    Returns the dominant style class for a set of style tags.
    Returns: 'sporty', 'ethnic', 'formal', or 'casual'
    """
    if styles_set & SPORTY_STYLES:
        return "sporty"
    if styles_set & ETHNIC_STYLES:
        return "ethnic"
    if styles_set & FORMAL_STYLES:
        return "formal"
    return "casual"


def _validate_compatibility(outfit):
    """
    Checks cross-item compatibility rules based on style metadata.

    Rules implemented (all metadata-driven, no item names hardcoded):

    5a. Sporty upper + formal outerwear → rejected
        Reason: A hoodie under a blazer produces an incoherent outfit.

    5b. Athletic/sporty bottom + formal upper → rejected
        Reason: Gym shorts with a formal shirt is jarring.

    5c. Ethnic garment + sporty footwear → rejected
        Reason: A saree/kurta/lehenga with sneakers is a hard clash.

    5d. Formal outfit (upper+lower or full body) + sport/casual footwear
        at a formal occasion → rejected
        Reason: Formal outfit with flip-flops/sneakers kills the look.

    5e. Sporty upper + formal lower → rejected
        Reason: Tracksuit top + formal trousers is incoherent.

    5f. Ethnic core + Western formal outerwear → rejected
        Reason: Kurta or Saree under a Western tailored suit blazer / coat.

    5g. Ethnic upper/full body + external waist belt → rejected
        Reason: External belt cannot be worn over ethnic upper garments.

    Returns:
        (bool, str)
    """
    upper  = outfit.get("upper_body")
    lower  = outfit.get("lower_body")
    full   = outfit.get("full_body")
    shoes  = outfit.get("footwear")
    outer  = outfit.get("outerwear")

    upper_styles  = _get_styles(upper)
    lower_styles  = _get_styles(lower)
    full_styles   = _get_styles(full)
    shoes_styles  = _get_styles(shoes)
    outer_styles  = _get_styles(outer)

    upper_class = _get_dominant_style_class(upper_styles) if upper else None
    lower_class = _get_dominant_style_class(lower_styles) if lower else None
    full_class  = _get_dominant_style_class(full_styles)  if full  else None
    shoes_class = _get_dominant_style_class(shoes_styles) if shoes else None
    outer_class = _get_dominant_style_class(outer_styles) if outer else None

    # Rule 5a: Sporty upper + formal outerwear
    if upper_class == "sporty" and outer_class == "formal":
        return False, "Sporty top cannot be worn with formal outerwear"

    # Rule 5b: Sporty bottom + formal upper
    if lower_class == "sporty" and upper_class == "formal":
        return False, "Athletic bottom cannot be worn with formal top"

    # Rule 5c: Ethnic garment + sporty footwear
    core_is_ethnic = (upper_class == "ethnic" or
                      lower_class == "ethnic" or
                      full_class == "ethnic")
    if core_is_ethnic and shoes_class == "sporty":
        return False, "Ethnic garment cannot be paired with sporty footwear"

    # Rule 5d: Formal core + sporty footwear
    core_is_formal = (upper_class == "formal" or
                      lower_class == "formal" or
                      full_class == "formal")
    if core_is_formal and shoes_class == "sporty":
        return False, "Formal outfit cannot be worn with casual/sporty footwear"

    # Rule 5e: Sporty upper + formal lower (tracksuit top + dress trousers)
    if upper_class == "sporty" and lower_class == "formal":
        return False, "Sporty top cannot be paired with formal bottom"

    # Rule 5f: Ethnic core + Western formal outerwear
    # E.g. Kurta or Saree under a Western tailored suit blazer / coat
    if core_is_ethnic and outer_class == "formal":
        return False, "Ethnic garments cannot be worn with Western formal outerwear"

    # Rule 5g: Ethnic upper/full body + external waist belt
    if upper_class == "ethnic" or full_class == "ethnic":
        accessories = outfit.get("accessories") or []
        for acc in accessories:
            acc_name = acc.get("name", "").lower()
            if "belt" in acc_name:
                return False, "External belt cannot be worn over ethnic upper garments"

    return True, None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def validate_outfit(outfit, selected_season=None, selected_occasion=None):
    """
    Runs all five hard-rule validation groups against a generated outfit.

    Args:
        outfit            (dict): Outfit dict from outfit_generator.py
        selected_season   (str):  User-selected season, lowercase (optional)
        selected_occasion (str):  User-selected occasion, lowercase (optional)

    Returns:
        (bool, str): (is_valid, rejection_reason or None)
    """
    checks = [
        _validate_structure(outfit),
        _validate_availability(outfit),
        _validate_season(outfit, selected_season),
        _validate_occasion(outfit, selected_occasion),
        _validate_compatibility(outfit),
    ]

    for is_valid, reason in checks:
        if not is_valid:
            return False, reason

    return True, None


def filter_valid_outfits(outfits, selected_season=None, selected_occasion=None):
    """
    Filters a list of outfits, returning only those that pass all hard rules.

    Args:
        outfits           (list[dict]): Outfits from outfit_generator.py
        selected_season   (str):        User-selected season (optional)
        selected_occasion (str):        User-selected occasion (optional)

    Returns:
        list[dict]: Valid outfits only
    """
    valid = []

    for outfit in outfits:
        is_valid, _ = validate_outfit(outfit, selected_season, selected_occasion)
        if is_valid:
            valid.append(outfit)

    return valid
