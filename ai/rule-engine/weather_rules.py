"""
Weather Rule Engine

Filters clothes based on current weather conditions.
"""

WEATHER_RULES = {
    "Hot": {
        "allowed_seasons": {"summer", "spring"}
    },
    "Moderate": {
        "allowed_seasons": {"spring", "autumn"}
    },
    "Cold": {
        "allowed_seasons": {"winter"}
    }
}


def get_weather_type(temperature):
    """
    Converts temperature into a weather category.
    """

    if temperature >= 30:
        return "Hot"

    elif temperature <= 15:
        return "Cold"

    return "Moderate"


def filter_by_season(clothes, selected_season):

    if not selected_season:
        return clothes

    filtered = []

    for item in clothes:

        item_seasons = set(
            season.lower()
            for season in item.get("seasons", [])
        )

        # "all" means the item is appropriate for every season
        if "all" in item_seasons or selected_season.lower() in item_seasons:
            filtered.append(item)

    return filtered