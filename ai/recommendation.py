"""
Recommendation Pipeline

Main entry point for the StyleMate AI recommendation system.
"""

import json
import os
import sys
import traceback

# Ensure rule-engine is in path for module imports
sys.path.append(os.path.join(os.path.dirname(__file__), "rule-engine"))

from outfit_generator import group_clothes_by_slot, generate_outfits
from clothing_filter import filter_clothes
from ranker import rank_outfits


def recommend_outfits(
    wardrobe,
    weather,
    user_preferences,
    user_history
):
    """
    Generates and ranks outfit recommendations.

    Args:
        wardrobe (list)
        weather (dict)
        user_preferences (dict)
        user_history (dict)

    Returns:
        list
    """

    filtered_clothes = filter_clothes(
        clothes=wardrobe,
        selected_season=weather.get("season"),
        selected_occasions=[user_preferences.get("occasion")]
        if user_preferences.get("occasion")
        else [],
        # preferred_styles=[user_preferences.get("preferred_style")]
        # if user_preferences.get("preferred_style")
        # else [],
        )

    
    grouped_clothes = group_clothes_by_slot(filtered_clothes)

    outfits = generate_outfits(
        grouped_clothes,
        selected_season=weather.get("season"),
        selected_occasion=user_preferences.get("occasion"),
    )

    ranked_outfits = rank_outfits(
        outfits=outfits,
        weather=weather,
        user_preferences=user_preferences,
        user_history=user_history
    )

    return ranked_outfits


def main():
    try:
        raw_input = sys.stdin.read()
        if not raw_input.strip():
            raise ValueError("No input provided on stdin.")

        data = json.loads(raw_input)

        wardrobe = data.get("wardrobe", [])
        weather = data.get("weather", {})
        user_preferences = data.get("user_preferences", {})
        user_history = data.get("user_history", {})

        ranked_outfits = recommend_outfits(
            wardrobe=wardrobe,
            weather=weather,
            user_preferences=user_preferences,
            user_history=user_history
        )

        print(json.dumps(ranked_outfits, default=str))
    except Exception as e:
        traceback.print_exc()
        error_response = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(error_response))
        sys.exit(1)


if __name__ == "__main__":
    main()