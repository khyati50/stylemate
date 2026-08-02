"""
Outfit Ranker

Ranks candidate outfits using the trained
machine learning model.
"""

import os
import joblib
import pandas as pd

from feature_extractor import extract_features


MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "models",
    "outfit_model.pkl"
)

MODEL = joblib.load(MODEL_PATH)


def score_outfit(
    outfit,
    weather,
    user_preferences,
    user_history
):
    """
    Scores a single outfit.
    """

    features = extract_features(
        outfit=outfit,
        weather=weather,
        user_preferences=user_preferences,
        user_history=user_history
    )

    feature_df = pd.DataFrame([features])

    score = round(
        float(MODEL.predict(feature_df)[0]),
        4
    )

    return {
        "outfit": outfit,
        "score": score
    }


def rank_outfits(
    outfits,
    weather,
    user_preferences,
    user_history
):
    """
    Ranks all outfits from best to worst.
    """

    ranked_outfits = []

    for outfit in outfits:

        result = score_outfit(
            outfit,
            weather,
            user_preferences,
            user_history
        )

        ranked_outfits.append(result)

    ranked_outfits.sort(
        key=lambda x: x["score"],
        reverse=True
    )

    return ranked_outfits