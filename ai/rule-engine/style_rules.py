"""
Style Rule Engine

Filters clothes based on user preferred styles.
"""


def filter_by_style(clothes, preferred_styles):
    """
    Returns clothes matching at least one preferred style.
    """

    if not preferred_styles:
        return clothes

    user_styles = set(s.lower() for s in preferred_styles)

    filtered_clothes = []

    for item in clothes:

        item_styles = set(s.lower() for s in item.get("styles", []))

        if user_styles.intersection(item_styles):
            filtered_clothes.append(item)

    return filtered_clothes