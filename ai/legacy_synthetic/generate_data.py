"""
Synthetic Training Data Generator — StyleMate Layer 2

Orchestrates the offline data generation pipeline:
1. Generate fake wardrobes (fake_wardrobe_generator.py)
2. Generate valid outfit combinations (outfit_generator.py)
3. Pass each outfit through feature_extractor.py
4. Compute the training label (rule_based_quality_score) using the
   10 Layer 2 feature weights from
   docs/StyleMate_Layer2_Design_Specification.md
5. Save the complete dataset to data/outfit_history.csv
"""

import os
import random
import sys
import pandas as pd

# Ensure rule-engine modules can be imported
sys.path.append(os.path.join(os.path.dirname(__file__), "rule-engine"))

from fake_wardrobe_generator import generate_fake_wardrobe
from feature_extractor import extract_features
from outfit_generator import generate_outfits, group_clothes_by_slot


# ---------------------------------------------------------------------------
# Context generators (satisfy extract_features() interface)
# ---------------------------------------------------------------------------

def generate_realistic_weather():
    """
    Generates synthetic weather/season context.
    The 'season' key is used by the Layer 2 context features.

    Returns:
        dict
    """
    season = random.choice(["summer", "winter", "spring", "autumn"])
    return {
        "temperature": random.randint(15, 40),
        "condition":   random.choice(["sunny", "cloudy", "rainy", "cold"]),
        "season":      season,
    }


def generate_user_preferences():
    """
    Generates synthetic user preference context.
    The 'occasion' key is used by the Layer 2 context features.

    Returns:
        dict
    """
    return {
        "preferred_style": random.choice(
            ["casual", "formal", "streetwear", "ethnic", "sporty"]
        ),
        "preferred_colors": random.sample(
            ["black", "white", "blue", "green", "pink", "red", "beige", "grey"],
            k=random.randint(1, 3),
        ),
        "occasion": random.choice(
            ["college", "office", "party", "wedding", "casual", "gym"]
        ),
    }


def generate_user_history():
    """
    Generates placeholder user history context.
    Kept to satisfy the extract_features() interface;
    wear-history features are deferred to V2.

    Returns:
        dict
    """
    return {
        "average_rating":      round(random.uniform(1.0, 5.0), 2),
        "times_worn":          random.randint(0, 25),
        "days_since_last_worn": random.randint(0, 365),
        "accepted_before":     random.choice([True, False]),
    }


# ---------------------------------------------------------------------------
# Training label — rule_based_quality_score
# ---------------------------------------------------------------------------

# Feature weights from docs/StyleMate_Layer2_Design_Specification.md.
# All 10 features output [0.0, 1.0], so no pre-normalization is needed.
_FEATURE_WEIGHTS = {
    "color_harmony":        0.20,
    "style_compatibility":  0.15,
    "formality_consistency": 0.15,
    "neutral_ratio":        0.10,
    "occasion_suitability": 0.10,
    "seasonal_suitability": 0.10,
    "color_count":          0.05,
    "layering_score":       0.05,
    "garment_compatibility": 0.05,
    "outfit_completeness":  0.05,
}

# Compile-time check — weights must sum to exactly 1.0
assert abs(sum(_FEATURE_WEIGHTS.values()) - 1.0) < 1e-9, \
    "Layer 2 feature weights must sum to 1.0"


def compute_rule_based_quality_score(features):
    """
    Computes the training label as a weighted sum of the 10 Layer 2 features.

    All features are already in [0.0, 1.0], so no normalization is required
    before weighting. Weights match the specification exactly.

    Args:
        features (dict): Feature dict from extract_features().

    Returns:
        float: Quality score in [0.0, 1.0], rounded to 4 decimal places.
    """
    score = sum(
        _FEATURE_WEIGHTS[feature] * features.get(feature, 0.0)
        for feature in _FEATURE_WEIGHTS
    )
    return round(score, 4)


# ---------------------------------------------------------------------------
# Dataset generation
# ---------------------------------------------------------------------------

def generate_dataset(target_rows=500, max_outfits_per_wardrobe=5):
    """
    Runs the offline pipeline to produce at least target_rows training samples.

    Each row contains:
        - 10 Layer 2 ML features from feature_extractor.py
        - rule_based_quality_score  (training target)

    Sampling optimization: randomly selects up to max_outfits_per_wardrobe
    outfits per wardrobe before feature extraction so generation is fast
    without modifying outfit_generator.py.

    The selected occasion and season are passed into extract_features() so
    Layer 2 context features (occasion_suitability, seasonal_suitability,
    layering_score) have meaningful values in the training data.

    Args:
        target_rows (int): Minimum number of dataset rows to generate.
        max_outfits_per_wardrobe (int): Outfits sampled per wardrobe iteration.

    Returns:
        pd.DataFrame: Complete training dataset.
    """
    rows = []

    while len(rows) < target_rows:

        # Step 1: Generate a synthetic wardrobe
        wardrobe = generate_fake_wardrobe()

        # Step 2: Generate and validate outfit combinations
        grouped_clothes = group_clothes_by_slot(wardrobe)

        # Step 3: Simulate context — occasion and season affect feature values
        weather          = generate_realistic_weather()
        user_preferences = generate_user_preferences()
        user_history     = generate_user_history()

        # Pass season and occasion through the generator for validator context
        outfits = generate_outfits(
            grouped_clothes,
            selected_season=weather.get("season"),
            selected_occasion=user_preferences.get("occasion"),
        )

        # Step 4: Sample to control generation speed
        if len(outfits) > max_outfits_per_wardrobe:
            outfits = random.sample(outfits, max_outfits_per_wardrobe)

        # Step 5: Extract features and compute training label per outfit
        for outfit in outfits:

            # Extract the 10 Layer 2 features
            features = extract_features(
                outfit=outfit,
                user_preferences=user_preferences,
                weather=weather,
                user_history=user_history,
            )

            # Compute training target
            quality_score = compute_rule_based_quality_score(features)

            # Assemble row: 10 features + 1 label
            row = features.copy()
            row["rule_based_quality_score"] = quality_score

            rows.append(row)

            if len(rows) >= target_rows:
                break

    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    """Main execution entrypoint for offline dataset generation."""
    print("Starting StyleMate Layer 2 data generation pipeline...")

    df = generate_dataset(target_rows=500, max_outfits_per_wardrobe=5)

    os.makedirs("data", exist_ok=True)
    output_path = "data/outfit_history.csv"
    df.to_csv(output_path, index=False)

    print("Dataset created successfully!")
    print(f"Total rows generated  : {len(df)}")
    print(f"Columns ({len(df.columns)})         : {list(df.columns)}")
    print(f"Quality score range   : {df['rule_based_quality_score'].min():.4f} – "
          f"{df['rule_based_quality_score'].max():.4f}")
    print(f"Quality score mean    : {df['rule_based_quality_score'].mean():.4f}")
    print()
    print(df.head())


if __name__ == "__main__":
    main()