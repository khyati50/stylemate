"""
Occasion Rule Engine

Handles semantic occasion mapping, fuzzy matching, and soft scoring.
Clothes do not have fixed innate occasions; ensembles do. This module provides
2-tier synonym-aware occasion matching to prevent brittle string failures
(e.g. 'date night' vs 'date') while cleanly separating primary intent from
loose secondary crossovers.
"""

# Tier 1: Primary direct semantic synonyms (exact intent match -> Weight: 1.0)
PRIMARY_OCCASION_SYNONYMS = {
    "date night": {"date", "date night", "datenight", "romantic", "dinner", "romantic dinner", "evening"},
    "date": {"date", "date night", "datenight", "romantic", "dinner", "romantic dinner", "evening"},
    "dinner": {"dinner", "date", "date night", "evening dinner"},
    "party": {"party", "club", "cocktail", "night out", "celebration", "gala"},
    "formal": {"formal", "office", "business", "meeting", "work", "interview"},
    "office": {"office", "work", "formal", "smart", "business"},
    "casual": {"casual", "everyday", "daily", "errands", "streetwear", "relaxed"},
    "cafe": {"cafe", "coffee", "brunch", "relaxed", "hangout", "lunch"},
    "college": {"college", "university", "campus"},
    "wedding": {"wedding", "marriage", "ceremony", "festival", "festive", "traditional", "ethnic", "gala"},
    "festival": {"festival", "festive", "traditional", "ethnic", "wedding"},
    "vacation": {"vacation", "holiday", "beach", "resort", "travel"},
}

# Tier 2: Secondary related synonyms (acceptable stylistic crossover -> Weight: 0.4)
SECONDARY_OCCASION_SYNONYMS = {
    "date night": {"cocktail", "drinks", "smart"},
    "date": {"cocktail", "drinks", "cafe", "smart"},
    "dinner": {"cocktail", "formal", "smart", "drinks"},
    "party": {"drinks", "festive", "night out"},
    "formal": {"dinner", "smart"},
    "office": {"meeting", "formal", "smart"},
    "casual": {"cafe", "college"},
    "cafe": {"casual", "college"},
    "college": {"casual", "cafe"},
}


def normalize_occasion(occ):
    """Normalizes an occasion string (lowercase, stripped, removes punctuation/underscores)."""
    if not occ:
        return ""
    return str(occ).strip().lower().replace("_", " ").replace("-", " ")


def get_occasion_match_weight(item_occasions, target_occasion):
    """
    Computes a semantic alignment weight (0.0 to 1.0) between an item's tags
    and the user's target occasion.

    Returns:
      1.0 -> Direct exact match or primary synonym (e.g. 'date' for 'date night')
      0.5 -> Secondary related synonym (e.g. 'party' for 'date night')
      0.2 -> Universal 'all' tag
      0.0 -> No semantic relationship
    """
    if not target_occasion:
        return 1.0
    if not item_occasions:
        return 0.0

    clean_target = normalize_occasion(target_occasion)
    primary_set = set(PRIMARY_OCCASION_SYNONYMS.get(clean_target, {clean_target}))
    primary_set.add(clean_target)
    for word in clean_target.split():
        if len(word) >= 4:
            primary_set.add(word)

    secondary_set = set(SECONDARY_OCCASION_SYNONYMS.get(clean_target, set()))

    best_weight = 0.0
    for raw_occ in item_occasions:
        clean_occ = normalize_occasion(raw_occ)
        if not clean_occ:
            continue

        if clean_occ == "all":
            best_weight = max(best_weight, 0.2)
            continue

        # Check Tier 1 direct match
        if (clean_occ in primary_set or
            clean_target in clean_occ or
            clean_occ in clean_target):
            return 1.0

        # Check Tier 2 secondary match
        if clean_occ in secondary_set:
            best_weight = max(best_weight, 0.5)

    return best_weight


def matches_occasion(item_occasions, target_occasion):
    """Returns True if the item has at least a secondary semantic match."""
    return get_occasion_match_weight(item_occasions, target_occasion) > 0.0


def filter_by_occasion(clothes, selected_occasions):
    """
    Returns clothes matching at least one selected occasion semantically.
    Backward-compatible with existing callers.
    """
    if not selected_occasions:
        return clothes

    clean_targets = [normalize_occasion(o) for o in selected_occasions if normalize_occasion(o)]
    if not clean_targets:
        return clothes

    filtered_clothes = []
    for item in clothes:
        item_occasions = item.get("occasions", []) or []
        if any(matches_occasion(item_occasions, target) for target in clean_targets):
            filtered_clothes.append(item)

    return filtered_clothes if filtered_clothes else clothes

