"""
Category to Style/Occasion Suggestion Table

Maps clothing items to outfit slot categories, style suggestions, occasion suggestions,
and seasonal suitability.
"""

ITEM_MAPPINGS = {
    "shirt": {
        "slot": "Top",
        "suggested_styles": ["casual", "formal"],
        "suggested_occasions": ["casual", "office", "college"],
        "suggested_seasons": ["all"],
    },
    "t-shirt": {
        "slot": "Top",
        "suggested_styles": ["casual", "streetwear"],
        "suggested_occasions": ["casual", "college"],
        "suggested_seasons": ["summer", "spring"],
    },
    "tshirt": {
        "slot": "Top",
        "suggested_styles": ["casual", "streetwear"],
        "suggested_occasions": ["casual", "college"],
        "suggested_seasons": ["summer", "spring"],
    },
    "jeans": {
        "slot": "Bottom",
        "suggested_styles": ["casual"],
        "suggested_occasions": ["casual", "college"],
        "suggested_seasons": ["all"],
    },
    "trousers": {
        "slot": "Bottom",
        "suggested_styles": ["formal", "smart"],
        "suggested_occasions": ["office", "formal"],
        "suggested_seasons": ["all"],
    },
    "dress": {
        "slot": "Full Body",
        "suggested_styles": ["casual", "formal"],
        "suggested_occasions": ["party", "casual", "date"],
        "suggested_seasons": ["summer", "spring"],
    },
    "saree": {
        "slot": "Full Body",
        "suggested_styles": ["ethnic"],
        "suggested_occasions": ["wedding", "party", "formal"],
        "suggested_seasons": ["all"],
    },
    "kurta": {
        "slot": "Top",
        "suggested_styles": ["ethnic", "casual"],
        "suggested_occasions": ["casual", "wedding", "formal"],
        "suggested_seasons": ["all"],
    },
    "lehenga": {
        "slot": "Full Body",
        "suggested_styles": ["ethnic"],
        "suggested_occasions": ["wedding", "party"],
        "suggested_seasons": ["all"],
    },
    "blazer": {
        "slot": "Outerwear",
        "suggested_styles": ["formal", "smart"],
        "suggested_occasions": ["office", "formal", "party"],
        "suggested_seasons": ["all"],
    },
    "jacket": {
        "slot": "Outerwear",
        "suggested_styles": ["casual", "streetwear"],
        "suggested_occasions": ["casual", "college"],
        "suggested_seasons": ["winter", "autumn"],
    },
    "hoodie": {
        "slot": "Outerwear",
        "suggested_styles": ["casual", "streetwear"],
        "suggested_occasions": ["casual", "college"],
        "suggested_seasons": ["winter", "autumn"],
    },
    "sneakers": {
        "slot": "Footwear",
        "suggested_styles": ["casual", "sporty"],
        "suggested_occasions": ["casual", "college"],
        "suggested_seasons": ["all"],
    },
    "heels": {
        "slot": "Footwear",
        "suggested_styles": ["formal", "smart"],
        "suggested_occasions": ["formal", "party", "date"],
        "suggested_seasons": ["all"],
    },
    "sandals": {
        "slot": "Footwear",
        "suggested_styles": ["casual"],
        "suggested_occasions": ["casual"],
        "suggested_seasons": ["summer", "spring"],
    },
    "boots": {
        "slot": "Footwear",
        "suggested_styles": ["casual", "streetwear"],
        "suggested_occasions": ["casual", "college"],
        "suggested_seasons": ["winter", "autumn"],
    },
    "watch": {
        "slot": "Accessory",
        "suggested_styles": ["smart", "casual", "formal"],
        "suggested_occasions": ["office", "casual", "formal"],
        "suggested_seasons": ["all"],
    },
    "belt": {
        "slot": "Accessory",
        "suggested_styles": ["formal", "casual", "smart"],
        "suggested_occasions": ["office", "casual", "formal"],
        "suggested_seasons": ["all"],
    },
    "shorts": {
        "slot": "Bottom",
        "suggested_styles": ["casual", "sporty"],
        "suggested_occasions": ["casual"],
        "suggested_seasons": ["summer", "spring"],
    },
    "skirt": {
        "slot": "Bottom",
        "suggested_styles": ["casual", "smart"],
        "suggested_occasions": ["casual", "party", "date"],
        "suggested_seasons": ["summer", "spring", "all"],
    },
    "sweater": {
        "slot": "Outerwear",
        "suggested_styles": ["casual", "smart"],
        "suggested_occasions": ["casual", "college"],
        "suggested_seasons": ["winter", "autumn"],
    },
    "coat": {
        "slot": "Outerwear",
        "suggested_styles": ["formal", "smart"],
        "suggested_occasions": ["office", "formal"],
        "suggested_seasons": ["winter", "autumn"],
    },
    "scarf": {
        "slot": "Accessory",
        "suggested_styles": ["casual", "smart"],
        "suggested_occasions": ["casual"],
        "suggested_seasons": ["winter", "autumn"],
    },
    "bag": {
        "slot": "Accessory",
        "suggested_styles": ["casual", "formal"],
        "suggested_occasions": ["office", "casual", "college"],
        "suggested_seasons": ["all"],
    },
    "handbag": {
        "slot": "Accessory",
        "suggested_styles": ["casual", "formal"],
        "suggested_occasions": ["office", "casual", "party"],
        "suggested_seasons": ["all"],
    },
    "sunglasses": {
        "slot": "Accessory",
        "suggested_styles": ["casual"],
        "suggested_occasions": ["casual"],
        "suggested_seasons": ["summer", "spring"],
    },
    "chinos": {
        "slot": "Bottom",
        "suggested_styles": ["smart", "casual"],
        "suggested_occasions": ["casual", "office"],
        "suggested_seasons": ["all"],
    },
    "loafers": {
        "slot": "Footwear",
        "suggested_styles": ["smart", "formal"],
        "suggested_occasions": ["office", "casual"],
        "suggested_seasons": ["all"],
    },
    "jumpsuit": {
        "slot": "Full Body",
        "suggested_styles": ["casual", "smart"],
        "suggested_occasions": ["casual", "party"],
        "suggested_seasons": ["all"],
    },
}

FALLBACK_SUGGESTION = {
    "slot": "Top",
    "suggested_styles": ["casual"],
    "suggested_occasions": ["casual"],
    "suggested_seasons": ["all"],
}


def get_suggestions(item_type: str) -> dict:
    """
    Returns slot, suggested styles, occasions, and seasons for the given item type.
    Falls back gracefully if the item type is unknown.
    """
    if not item_type or not isinstance(item_type, str):
        result = dict(FALLBACK_SUGGESTION)
        result["styles"] = list(result["suggested_styles"])
        result["occasions"] = list(result["suggested_occasions"])
        result["seasons"] = list(result["suggested_seasons"])
        return result

    cleaned = item_type.strip().lower()

    # 1. Exact match
    if cleaned in ITEM_MAPPINGS:
        data = ITEM_MAPPINGS[cleaned]
        result = {
            "slot": data["slot"],
            "suggested_styles": list(data["suggested_styles"]),
            "suggested_occasions": list(data["suggested_occasions"]),
            "suggested_seasons": list(data["suggested_seasons"]),
            "styles": list(data["suggested_styles"]),
            "occasions": list(data["suggested_occasions"]),
            "seasons": list(data["suggested_seasons"]),
        }
        return result

    # 2. Substring matching (e.g. "silk kurta", "denim jacket", "t-shirt")
    for key, data in ITEM_MAPPINGS.items():
        if key in cleaned or cleaned in key:
            result = {
                "slot": data["slot"],
                "suggested_styles": list(data["suggested_styles"]),
                "suggested_occasions": list(data["suggested_occasions"]),
                "suggested_seasons": list(data["suggested_seasons"]),
                "styles": list(data["suggested_styles"]),
                "occasions": list(data["suggested_occasions"]),
                "seasons": list(data["suggested_seasons"]),
            }
            return result

    # 3. Fallback
    result = dict(FALLBACK_SUGGESTION)
    result["styles"] = list(result["suggested_styles"])
    result["occasions"] = list(result["suggested_occasions"])
    result["seasons"] = list(result["suggested_seasons"])
    return result


if __name__ == "__main__":
    items_to_test = [
        "shirt", "t-shirt", "jeans", "trousers", "dress", "saree", "kurta",
        "lehenga", "blazer", "jacket", "hoodie", "sneakers", "heels", "sandals",
        "boots", "watch", "belt", "shorts", "skirt", "unknown_xyz"
    ]
    for itm in items_to_test:
        sug = get_suggestions(itm)
        print(f"{itm:15} -> Slot: {sug['slot']:10} Styles: {sug['suggested_styles']}")
