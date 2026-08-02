"""
Occasion Rule Engine

Filters clothes based on the occasions selected by the user.
"""


def filter_by_occasion(clothes, selected_occasions):
    """
    Returns clothes matching at least one selected occasion.
    """

    if not selected_occasions:
        return clothes

    user_occasions = set(o.lower() for o in selected_occasions)

    filtered_clothes = []

    for item in clothes:

        item_occasions = set(o.lower() for o in item.get("occasions", []))

        if user_occasions.intersection(item_occasions):
            filtered_clothes.append(item)

    return filtered_clothes