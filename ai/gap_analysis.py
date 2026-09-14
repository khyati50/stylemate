"""
Gap Analysis Pipeline

Standalone analysis script for StyleMate wardrobe gap detection.
Reads JSON from stdin, writes JSON to stdout.

Analyses performed:
  1. Slot Coverage    — how many items exist per outfit slot
  2. Occasion Coverage — which occasions have fewer than 3 complete outfits
  3. Versatility Score — items that appear in ≤1 outfit across the whole wardrobe
  4. Suggestions       — ranked shopping recommendations for critical/weak slots
"""

import json
import sys
import os
import copy
import traceback
from collections import Counter

sys.path.append(os.path.join(os.path.dirname(__file__), "rule-engine"))

from slot_mapper import add_slots_to_clothes
from clothing_filter import filter_clothes
from outfit_generator import group_clothes_by_slot, generate_outfits

SLOTS = ["upper_body", "lower_body", "full_body", "footwear", "outerwear", "accessories"]

SLOT_READABLE = {
    "upper_body": "tops", "lower_body": "bottoms", "full_body": "full-body pieces",
    "footwear": "footwear", "outerwear": "outerwear", "accessories": "accessories"
}

SLOT_TO_QUERY_NOUN = {
    "upper_body": "shirt", "lower_body": "pants", "full_body": "dress",
    "footwear": "sneakers", "outerwear": "jacket", "accessories": "belt"
}

COMPLEMENTARY = {
    "black": "white", "white": "black", "navy": "beige", "beige": "navy",
    "grey": "burgundy", "brown": "cream", "red": "navy", "blue": "white", "green": "beige"
}

NEUTRAL_PRIORITY = ["white", "black", "navy", "beige", "grey"]


# ---------------------------------------------------------------------------
# Analysis helpers
# ---------------------------------------------------------------------------

def _analyze_slot_coverage(wardrobe):
    """
    Analysis 1 — Slot Coverage.

    Calls add_slots_to_clothes on a deep copy of the wardrobe, then counts
    items per slot. Assigns severity: 0→'critical', 1→'weak', >=2→'ok'.

    Returns:
        list[dict]: One entry per slot with keys slot, count, severity.
        dict:       Raw slot counts keyed by slot name.
    """
    working = copy.deepcopy(wardrobe)
    add_slots_to_clothes(working)

    counts = {slot: 0 for slot in SLOTS}
    for item in working:
        slot = item.get("slot")
        if slot in counts:
            counts[slot] += 1

    coverage = []
    for slot in SLOTS:
        count = counts[slot]
        if count == 0:
            severity = "critical"
        elif count == 1:
            severity = "weak"
        else:
            severity = "ok"
        coverage.append({"slot": slot, "count": count, "severity": severity})

    return coverage, counts


def _analyze_occasion_coverage(wardrobe):
    """
    Analysis 2 — Occasion Coverage.

    For every unique occasion found in the wardrobe, generates outfits using
    the full filter+group+generate pipeline. Only includes occasions where the
    resulting outfit count is fewer than 3.

    Returns:
        list[dict]: Entries with keys occasion, outfit_count.
    """
    # Collect all unique occasions
    occasions = set()
    for item in wardrobe:
        for occ in (item.get("occasions") or []):
            if occ:
                occasions.add(occ)

    gaps = []
    for occasion in sorted(occasions):
        filtered = filter_clothes(
            copy.deepcopy(wardrobe),
            selected_season=None,
            selected_occasions=[occasion],
        )
        grouped = group_clothes_by_slot(filtered)
        outfits = generate_outfits(grouped, selected_season=None, selected_occasion=occasion)
        outfit_count = len(outfits)
        if outfit_count < 3:
            gaps.append({"occasion": occasion, "outfit_count": outfit_count})

    return gaps


def _analyze_versatility(wardrobe):
    """
    Analysis 3 — Versatility Score.

    Generates all outfits with no filters and counts how many outfits each
    item appears in. Items that appear in <=1 outfit are flagged as
    low-versatility, sorted ascending by their outfit count.

    Returns:
        list[dict]: Entries with keys id, name, category, outfit_count.
    """
    filtered = filter_clothes(
        copy.deepcopy(wardrobe),
        selected_season=None,
        selected_occasions=[],
    )
    grouped = group_clothes_by_slot(filtered)
    outfits = generate_outfits(grouped, selected_season=None, selected_occasion=None)

    id_counter = Counter()
    for outfit in outfits:
        for key, value in outfit.items():
            if key == "accessories":
                for acc in (value or []):
                    if isinstance(acc, dict) and acc.get("id") is not None:
                        id_counter[acc["id"]] += 1
            elif isinstance(value, dict) and value.get("id") is not None:
                id_counter[value["id"]] += 1

    low_versatility = []
    for item in wardrobe:
        item_id = item.get("id")
        count = id_counter.get(item_id, 0)
        if count <= 1:
            low_versatility.append({
                "id": item_id,
                "name": item.get("name", ""),
                "category": item.get("category", ""),
                "outfit_count": count,
            })

    low_versatility.sort(key=lambda x: x["outfit_count"])
    return low_versatility


def _build_suggestions(wardrobe, slot_coverage, slot_counts):
    """
    Analysis 4 — Suggestions.

    For each critical or weak slot, generates a shopping suggestion with:
    - suggested_style: most common style tag in the wardrobe, default 'casual'
    - suggested_color: first neutral not already over-represented, or complementary
    - reason: human-readable string based on severity and slot
    - estimated_new_outfits: formula based on slot counts
    - shopping_query: "{color} {style} {noun}"
    - rank: 1-based, ordered by estimated_new_outfits descending

    Returns:
        list[dict]: Top 5 suggestions, ranked by estimated_new_outfits descending.
    """
    # Determine most common style tag across the whole wardrobe
    style_counter = Counter()
    for item in wardrobe:
        for s in (item.get("styles") or []):
            if s:
                style_counter[s.lower()] += 1
    suggested_style = style_counter.most_common(1)[0][0] if style_counter else "casual"

    # Determine color counts across the wardrobe
    color_counter = Counter()
    for item in wardrobe:
        for c in (item.get("colors") or []):
            if c:
                color_counter[c.lower()] += 1

    # Slot count shorthands for the formula
    upper_count = slot_counts.get("upper_body", 0)
    lower_count = slot_counts.get("lower_body", 0)
    full_body_count = slot_counts.get("full_body", 0)
    footwear_count = slot_counts.get("footwear", 0)

    ESTIMATED_FORMULAS = {
        "upper_body": lower_count * footwear_count,
        "lower_body": upper_count * footwear_count,
        "full_body": footwear_count,
        "footwear": (upper_count * lower_count) + full_body_count,
        "outerwear": (upper_count * lower_count + full_body_count) * footwear_count,
        "accessories": (upper_count * lower_count + full_body_count) * footwear_count,
    }

    raw_suggestions = []
    for entry in slot_coverage:
        severity = entry["severity"]
        if severity not in ("critical", "weak"):
            continue

        slot = entry["slot"]
        readable = SLOT_READABLE.get(slot, slot)

        # Determine suggested color
        suggested_color = None
        for neutral in NEUTRAL_PRIORITY:
            if color_counter.get(neutral, 0) < 2:
                suggested_color = neutral
                break
        if suggested_color is None:
            most_common_color = color_counter.most_common(1)[0][0] if color_counter else "black"
            suggested_color = COMPLEMENTARY.get(most_common_color, "neutral")

        # Reason template
        if severity == "critical":
            reason = (
                f"You have no {readable} in your wardrobe. "
                f"Adding one will unlock new complete outfit combinations."
            )
        else:
            reason = (
                f"You only have 1 item in {readable}. "
                f"Adding another will significantly expand your outfit options."
            )

        estimated_new_outfits = ESTIMATED_FORMULAS.get(slot, 0)
        shopping_query = f"{suggested_color} {suggested_style} {SLOT_TO_QUERY_NOUN[slot]}"

        raw_suggestions.append({
            "category": slot,
            "suggested_style": suggested_style,
            "suggested_color": suggested_color,
            "reason": reason,
            "estimated_new_outfits": estimated_new_outfits,
            "shopping_query": shopping_query,
        })

    # Rank by estimated_new_outfits descending, top 5, 1-based rank
    raw_suggestions.sort(key=lambda x: x["estimated_new_outfits"], reverse=True)
    suggestions = []
    for i, suggestion in enumerate(raw_suggestions[:5]):
        suggestion["rank"] = i + 1
        suggestions.append(suggestion)

    return suggestions


# ---------------------------------------------------------------------------
# Main analysis entry point
# ---------------------------------------------------------------------------

def analyze_wardrobe(wardrobe):
    """
    Runs all four gap analyses on the provided wardrobe and returns a
    consolidated result dict.

    Args:
        wardrobe (list): Raw clothing items from the database.

    Returns:
        dict: {slot_coverage, occasion_gaps, low_versatility_items, suggestions}
    """
    slot_coverage, slot_counts = _analyze_slot_coverage(wardrobe)
    occasion_gaps = _analyze_occasion_coverage(wardrobe)
    low_versatility_items = _analyze_versatility(wardrobe)
    suggestions = _build_suggestions(wardrobe, slot_coverage, slot_counts)

    all_unique_occasions = set(
        tag for item in wardrobe for tag in (item.get("occasions") or []) if tag
    )

    return {
        "slot_coverage": slot_coverage,
        "occasion_gaps": occasion_gaps,
        "low_versatility_items": low_versatility_items,
        "suggestions": suggestions,
        "total_occasions": len(all_unique_occasions),
        "total_items": len(wardrobe),
    }


def main():
    try:
        raw_input = sys.stdin.read()
        if not raw_input.strip():
            raise ValueError("No input provided on stdin.")
        data = json.loads(raw_input)
        wardrobe = data.get("wardrobe", [])
        result = analyze_wardrobe(wardrobe)
        print(json.dumps(result, default=str))
    except Exception as e:
        traceback.print_exc()
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
