"""
Recommendation Pipeline

Combines all rule engines.
"""

from weather_rules import filter_by_season
from occasion_rules import filter_by_occasion
# from style_rules import filter_by_style


def filter_clothes(
    clothes,
    selected_season,
    selected_occasions,
    # preferred_styles,
):
    """
    Applies all rule-based filters.
    """

    clothes = filter_by_season(
        clothes,
        selected_season
    )

    clothes = filter_by_occasion(
        clothes,
        selected_occasions
    )

    # clothes = filter_by_style(
    #     clothes,
    #     preferred_styles
    # )

    return clothes