"""
Outfit Generator

Creates valid outfit combinations from filtered wardrobe items.
"""

from itertools import product
from slot_mapper import add_slots_to_clothes
from outfit_validator import filter_valid_outfits


def group_clothes_by_slot(clothes):
    """
    Groups clothes according to their outfit slot.
    """

    clothes = add_slots_to_clothes(clothes)

    grouped = {
        "upper_body": [],
        "lower_body": [],
        "full_body": [],
        "footwear": [],
        "outerwear": [],
        "accessories": []
    }

    for item in clothes:

        slot = item.get("slot")

        if slot in grouped:
            grouped[slot].append(item)

    return grouped


def generate_outfits(grouped_clothes, selected_season=None, selected_occasion=None):
    """
    Generates unique core outfit combinations and bundles matching accessories.

    Outerwear is optional: None is prepended so outfits without outerwear
    are also generated.

    Accessories are bundled together as a list for each unique core look
    rather than multiplying the combinations via Cartesian product. This
    ensures every recommended outfit in the UI is a distinct ensemble,
    with all compatible accessories attached directly to it.

    Args:
        grouped_clothes   (dict): Wardrobe items grouped by slot.
        selected_season   (str):  User-selected season for validation (optional).
        selected_occasion (str):  User-selected occasion for validation (optional).

    Returns:
        list[dict]: Only outfits that passed all hard rules.
    """
    outfits = []

    outerwear_options = [None] + grouped_clothes.get("outerwear", [])
    available_accessories = grouped_clothes.get("accessories", [])

    # ---------- Full Body Outfits ----------
    for full_body_item, footwear, outerwear in product(
        grouped_clothes.get("full_body", []),
        grouped_clothes.get("footwear", []),
        outerwear_options,
    ):
        full_styles = {s.lower() for s in (full_body_item.get("styles") or []) if s}
        is_ethnic = "ethnic" in full_styles
        matching_accs = [
            acc for acc in available_accessories
            if not (is_ethnic and "belt" in (acc.get("name") or "").lower())
        ]
        outfits.append({
            "upper_body": None,
            "lower_body": None,
            "full_body": full_body_item,
            "footwear": footwear,
            "outerwear": outerwear,
            "accessories": matching_accs,
        })

    # ---------- Upper + Lower Outfits ----------
    for upper, lower, footwear, outerwear in product(
        grouped_clothes.get("upper_body", []),
        grouped_clothes.get("lower_body", []),
        grouped_clothes.get("footwear", []),
        outerwear_options,
    ):
        upper_styles = {s.lower() for s in (upper.get("styles") or []) if s}
        is_ethnic = "ethnic" in upper_styles
        matching_accs = [
            acc for acc in available_accessories
            if not (is_ethnic and "belt" in (acc.get("name") or "").lower())
        ]
        outfits.append({
            "upper_body": upper,
            "lower_body": lower,
            "full_body": None,
            "footwear": footwear,
            "outerwear": outerwear,
            "accessories": matching_accs,
        })

    return filter_valid_outfits(outfits, selected_season, selected_occasion)