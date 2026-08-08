"""
Color Rule Engine

Filters clothes based on user preferred colors.
"""

def filter_by_color(clothes, preferred_colors):
    """
    Returns clothes matching at least one preferred color.
    """

    if not preferred_colors:
        return clothes

    user_colors = set(c.lower() for c in preferred_colors)

    filtered_clothes = []

    for item in clothes:
        item_colors = set(c.lower() for c in item.get("colors", []))

        if user_colors.intersection(item_colors):
            filtered_clothes.append(item)

    return filtered_clothes