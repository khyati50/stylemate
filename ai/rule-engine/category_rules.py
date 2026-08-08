"""
Category Rule Engine

Filters clothes based on preferred category.
"""

def filter_by_category(clothes, preferred_category):
    """
    Returns clothes matching the preferred category.
    """

    if not preferred_category:
        return clothes

    preferred_category = preferred_category.lower()

    filtered_clothes = []

    for item in clothes:
        item_category = item.get("category", "")

        if item_category and item_category.lower() == preferred_category:
            filtered_clothes.append(item)

    return filtered_clothes