"""
Slot Mapper

Maps database categories to internal outfit slots.
"""

CATEGORY_TO_SLOT = {
    "top": "upper_body",
    "bottom": "lower_body",
    "full body": "full_body",
    "footwear": "footwear",
    "outerwear": "outerwear",
    "accessory": "accessories",
}


def map_category_to_slot(category):
    """
    Converts a database category to an outfit slot.
    """
    return CATEGORY_TO_SLOT.get(category.lower(), None)


def add_slots_to_clothes(clothes):
    """
    Adds a 'slot' key to each clothing item based on its category.
    """
    for item in clothes:
        item["slot"] = map_category_to_slot(item.get("category", ""))

    return clothes
