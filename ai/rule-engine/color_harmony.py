"""
Color Harmony Engine

Evaluates color harmony between two outfits for coordinated couple/friend twinning.
"""

NEUTRALS = {
    "black", "white", "grey", "gray", "beige",
    "navy", "cream", "tan", "khaki", "brown",
    "charcoal", "ivory", "off-white"
}

COMPLEMENTARY_PAIRS = {
    frozenset(["navy", "mustard"]),
    frozenset(["burgundy", "cream"]),
    frozenset(["olive", "rust"]),
    frozenset(["blush", "grey"]),
    frozenset(["blush", "gray"]),
    frozenset(["blue", "orange"]),
    frozenset(["yellow", "purple"]),
    frozenset(["green", "pink"]),
    frozenset(["teal", "coral"]),
    frozenset(["brown", "blue"]),
    frozenset(["beige", "navy"]),
    frozenset(["black", "camel"]),
    frozenset(["olive", "cream"]),
}

CLASHING_BRIGHTS = {
    frozenset(["red", "orange"]),
    frozenset(["green", "purple"]),
    frozenset(["yellow", "red"]),
    frozenset(["pink", "orange"]),
}

COLOR_FAMILIES = {
    "blue": ["navy", "blue", "light blue", "sky blue", "denim", "indigo", "teal", "royal blue", "cobalt", "cyan"],
    "red": ["red", "burgundy", "maroon", "crimson", "wine", "ruby"],
    "green": ["green", "olive", "emerald", "sage", "mint", "forest green", "khaki", "army green"],
    "brown": ["brown", "tan", "beige", "khaki", "camel", "chocolate", "coffee", "mocha"],
    "yellow": ["yellow", "mustard", "gold", "amber", "ochre"],
    "pink": ["pink", "blush", "rose", "magenta", "coral", "salmon"],
    "purple": ["purple", "lavender", "violet", "plum", "lilac", "mauve"],
    "neutral": ["black", "white", "grey", "gray", "charcoal", "silver", "ivory", "cream", "off-white"],
    "orange": ["orange", "rust", "terracotta", "peach"],
}


def _clean_color_list(colors):
    """Normalize colors to a deduplicated lowercase list."""
    if not colors:
        return []
    if isinstance(colors, str):
        colors = [colors]
    cleaned = []
    for c in colors:
        if isinstance(c, str) and c.strip():
            cleaned.append(c.strip().lower())
    return list(set(cleaned))


def _same_color_family(c1, c2):
    """Checks if two colors belong to the same shade family."""
    if c1 == c2:
        return True
    for shades in COLOR_FAMILIES.values():
        if c1 in shades and c2 in shades:
            return True
    return False


def get_color_harmony_score(colors_a, colors_b):
    """
    Computes a color harmony score and descriptive reason between two outfits.

    Returns:
        (score: float, descriptor: str)
        - Both neutrals: 0.075, "complementary neutral"
        - In complementary pairs: 0.06, "complementary"
        - White/black + non-neutral: 0.06, "balanced contrast"
        - Neutral + any color: 0.05, "neutral-accented"
        - Same color family: 0.035, "monochromatic tonal"
        - In clashing brights: 0.0, "high-contrast"
        - Default: 0.04, "harmonious"
    """
    ca_list = _clean_color_list(colors_a)
    cb_list = _clean_color_list(colors_b)

    if not ca_list or not cb_list:
        return 0.04, "harmonious"

    # Separate neutrals and non-neutrals
    ca_neutrals = [c for c in ca_list if c in NEUTRALS]
    ca_non_neutrals = [c for c in ca_list if c not in NEUTRALS]

    cb_neutrals = [c for c in cb_list if c in NEUTRALS]
    cb_non_neutrals = [c for c in cb_list if c not in NEUTRALS]

    # Check for direct clashing brights among non-neutral colors first
    for ca in ca_non_neutrals:
        for cb in cb_non_neutrals:
            if frozenset([ca, cb]) in CLASHING_BRIGHTS:
                return 0.0, "high-contrast"

    # 1. Both outfits are entirely neutral
    if len(ca_non_neutrals) == 0 and len(cb_non_neutrals) == 0:
        return 0.075, "complementary neutral"

    # 2. Complementary pairs
    for ca in ca_list:
        for cb in cb_list:
            if frozenset([ca, cb]) in COMPLEMENTARY_PAIRS:
                return 0.06, "complementary"

    # 3. White/black + non-neutral
    wb_set = {"white", "black"}
    has_wb_contrast = any(
        (ca in wb_set and cb not in NEUTRALS) or (cb in wb_set and ca not in NEUTRALS)
        for ca in ca_list
        for cb in cb_list
    )
    if has_wb_contrast:
        return 0.06, "balanced contrast"

    # 4. Neutral + any non-neutral color
    has_neutral_accent = any(
        (ca in NEUTRALS and cb not in NEUTRALS) or (cb in NEUTRALS and ca not in NEUTRALS)
        for ca in ca_list
        for cb in cb_list
    )
    if has_neutral_accent:
        return 0.05, "neutral-accented"

    # 5. Same color family
    has_same_family = any(
        _same_color_family(ca, cb)
        for ca in ca_list
        for cb in cb_list
    )
    if has_same_family:
        return 0.035, "monochromatic tonal"

    # 6. Any other clash check
    for ca in ca_list:
        for cb in cb_list:
            if frozenset([ca, cb]) in CLASHING_BRIGHTS:
                return 0.0, "high-contrast"

    # 7. Default
    return 0.04, "harmonious"
