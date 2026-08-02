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
    Generates all valid outfit combinations and applies hard-rule validation.

    Outerwear and accessories are optional: a sentinel value of None
    is included in each list so that combinations without them are
    also generated.

    After combinatorial generation, outfit_validator.filter_valid_outfits()
    removes any outfit that violates structural, availability, season,
    occasion, or compatibility rules.

    Args:
        grouped_clothes   (dict): Wardrobe items grouped by slot.
        selected_season   (str):  User-selected season for validation (optional).
        selected_occasion (str):  User-selected occasion for validation (optional).

    Returns:
        list[dict]: Only outfits that passed all hard rules.
    """

    outfits = []

    # Optional slots: prepend None so combinations without them are included
    outerwear_options = [None] + grouped_clothes["outerwear"]
    accessory_options = [None] + grouped_clothes["accessories"]

    # ---------- Full Body Outfits ----------

    for full_body_item, footwear, outerwear, accessory in product(
        grouped_clothes["full_body"],
        grouped_clothes["footwear"],
        outerwear_options,
        accessory_options,
    ):

        outfits.append({

            "upper_body": None,

            "lower_body": None,

            "full_body": full_body_item,

            "footwear": footwear,

            "outerwear": outerwear,

            "accessories": [accessory] if accessory else [],

        })

    # ---------- Upper + Lower Outfits ----------

    for upper, lower, footwear, outerwear, accessory in product(
        grouped_clothes["upper_body"],
        grouped_clothes["lower_body"],
        grouped_clothes["footwear"],
        outerwear_options,
        accessory_options,
    ):

        outfits.append({

            "upper_body": upper,

            "lower_body": lower,

            "full_body": None,

            "footwear": footwear,

            "outerwear": outerwear,

            "accessories": [accessory] if accessory else [],

        })

    return filter_valid_outfits(outfits, selected_season, selected_occasion)