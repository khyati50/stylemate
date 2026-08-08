"""
Clothing Filter

Applies hard constraints to the wardrobe before outfit generation.

Hard constraints (per StyleMate_Layer2_Design_Specification.md):
  - Season  — items that don't match the selected season are excluded
  - Occasion — items that don't match the selected occasion are excluded

Soft preferences (style, color) are NOT applied here.
They affect outfit RANKING in recommendation.py, not item eligibility.
"""

from weather_rules import filter_by_season
from occasion_rules import filter_by_occasion


def filter_clothes(
    clothes,
    selected_season,
    selected_occasions,
):
    """
    Applies season and occasion hard filters.

    Style and color preferences are intentionally excluded from this
    function. Filtering individual items by preferred style or color
    before outfit generation destroys otherwise valid complete outfits
    (e.g., removing footwear because it doesn't match the user's
    preferred color). These preferences are applied as outfit-level
    ranking signals instead.

    Args:
        clothes (list): Full wardrobe item list.
        selected_season (str): The detected or user-provided season.
        selected_occasions (list[str]): The selected occasions.

    Returns:
        list: Items that pass season and occasion hard filters.
    """

    clothes = filter_by_season(
        clothes,
        selected_season
    )

    clothes = filter_by_occasion(
        clothes,
        selected_occasions
    )

    return clothes