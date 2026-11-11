"""
Clothing Filter

Applies hard constraints to the wardrobe before outfit generation.

Production Architecture:
  - Season: Hard physical constraint (e.g. excludes heavy winter coats in 35°C summer).
  - Occasion: INTENTIONALLY NOT a hard deletion filter here.
    Clothes do not have fixed innate occasions; ensembles do. A white shirt or black dress
    can be styled for work, date night, or casual outings depending on the pairing.
    Filtering out items by occasion beforehand deletes versatile basics and leaves slots
    (like footwear) empty. Occasion is instead scored as a soft ranking signal in
    recommendation.py and visually validated by the Stage 2 Multimodal Vision LLM.
"""

from weather_rules import filter_by_season


def filter_clothes(
    clothes,
    selected_season,
    selected_occasions=None,
):
    """
    Applies seasonal hard constraints to the wardrobe.

    Args:
        clothes (list): Full wardrobe item list.
        selected_season (str): The detected or user-provided season.
        selected_occasions (list[str], optional): Kept for signature compatibility.

    Returns:
        list: Items that pass the seasonal physical constraints.
    """
    if not selected_season:
        return clothes

    return filter_by_season(
        clothes,
        selected_season
    )
