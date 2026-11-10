"""
Outfit Ranker  (v2 — Polyvore Real-Data Model)

Ranks candidate outfits using the trained HistGradientBoosting
compatibility classifier.

Key changes from v1:
  - Model bundle is now a dict: {"model", "scaler", "features", "version"}
  - Scoring uses predict_proba()[:, 1] — a true probability in [0.0, 1.0]
    representing the model's confidence that an outfit is stylist-compatible.
  - SHAP explanation hook exposed via explain_outfit() for in-app feedback.
"""

import os
import joblib
import pandas as pd

from feature_extractor import extract_features


# ── Model version switch ──────────────────────────────────────────────────
# Change ACTIVE_MODEL_VERSION to switch between model generations.
# "v2_polyvore"  → HistGradientBoosting trained on 20,000 real Polyvore outfits (ACTIVE)
# "v1_synthetic" → RandomForest trained on synthetic formula data (legacy, archived)
ACTIVE_MODEL_VERSION = "v2_polyvore"

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "models",
    ACTIVE_MODEL_VERSION,
    "outfit_model.pkl"
)

# ── Load model (handles both v2 bundle dict and v1 raw model) ─────────────
_RAW_LOADED = joblib.load(MODEL_PATH)

if isinstance(_RAW_LOADED, dict):
    _MODEL         = _RAW_LOADED["model"]
    _SCALER        = _RAW_LOADED.get("scaler")        # None for tree models
    _FEATURE_COLS  = _RAW_LOADED.get("features", [
        "neutral_ratio", "color_harmony", "color_count",
        "style_compatibility", "formality_consistency",
        "occasion_suitability", "seasonal_suitability",
        "layering_score", "garment_compatibility", "outfit_completeness"
    ])
    _MODEL_VERSION = _RAW_LOADED.get("version", ACTIVE_MODEL_VERSION)
else:
    # v1 legacy raw model (RandomForestRegressor)
    _MODEL         = _RAW_LOADED
    _SCALER        = None
    _FEATURE_COLS  = [
        "neutral_ratio", "color_harmony", "color_count",
        "style_compatibility", "formality_consistency",
        "occasion_suitability", "seasonal_suitability",
        "layering_score", "garment_compatibility", "outfit_completeness"
    ]
    _MODEL_VERSION = "v1_synthetic"

# Expose backward-compatible alias for any legacy scripts importing MODEL directly
MODEL = _MODEL


def _predict_proba(feature_df: pd.DataFrame) -> list[float]:
    """
    Returns compatibility scores in [0.0, 1.0] for each outfit row.
    - For v2 classifiers: uses predict_proba()[:, 1]
    - For v1 regressors: uses predict()
    """
    X = _SCALER.transform(feature_df) if _SCALER is not None else feature_df
    if hasattr(_MODEL, "predict_proba"):
        return _MODEL.predict_proba(X)[:, 1].tolist()
    # Fallback for legacy regressor
    return [max(0.0, min(1.0, float(s))) for s in _MODEL.predict(X)]


def score_outfit(
    outfit,
    weather,
    user_preferences,
    user_history
):
    """
    Scores a single outfit.

    Returns:
        dict with keys:
            "outfit"  — the original outfit dict
            "score"   — float in [0.0, 1.0], model's compatibility probability
            "version" — model version string for traceability
    """
    features = extract_features(
        outfit=outfit,
        weather=weather,
        user_preferences=user_preferences,
        user_history=user_history
    )

    feature_df = pd.DataFrame([features])[_FEATURE_COLS]
    score = round(_predict_proba(feature_df)[0], 4)

    return {
        "outfit":   outfit,
        "score":    score,
        "version":  _MODEL_VERSION,
    }


def rank_outfits(
    outfits,
    weather,
    user_preferences,
    user_history
):
    """
    Ranks all outfits from best to worst using batch inference.

    Returns:
        list[dict] sorted descending by "score" (compatibility probability).
    """
    outfits = list(outfits) if outfits else []
    if not outfits:
        return []

    feature_rows = [
        extract_features(
            outfit=outfit,
            weather=weather,
            user_preferences=user_preferences,
            user_history=user_history
        )
        for outfit in outfits
    ]

    batch_df = pd.DataFrame(feature_rows)[_FEATURE_COLS]
    scores   = _predict_proba(batch_df)

    ranked_outfits = [
        {
            "outfit":  outfit,
            "score":   round(float(score), 4),
            "version": _MODEL_VERSION,
        }
        for outfit, score in zip(outfits, scores)
    ]

    ranked_outfits.sort(key=lambda x: x["score"], reverse=True)
    return ranked_outfits


def explain_outfit(
    outfit,
    weather,
    user_preferences,
    user_history
):
    """
    Returns a human-readable SHAP-style explanation for why an outfit
    scored the way it did, using the extracted feature values directly.

    This is a lightweight rule-based explanation that mirrors the
    top SHAP drivers discovered during analysis (formality > color > garment).
    For full SHAP waterfall plots, run shap_analysis.py separately.

    Returns:
        dict with keys:
            "score"       — compatibility probability
            "verdict"     — "Stylish Match" | "Needs Work" | "Clashing"
            "top_reason"  — primary reason string
            "tips"        — list of actionable improvement tips
    """
    features = extract_features(
        outfit=outfit,
        weather=weather,
        user_preferences=user_preferences,
        user_history=user_history
    )

    feature_df = pd.DataFrame([features])[_FEATURE_COLS]
    score = round(_predict_proba(feature_df)[0], 4)

    tips = []
    drivers = []

    # Ranked by SHAP importance: formality > color_harmony > garment > style > neutral
    if features["formality_consistency"] < 0.50:
        drivers.append("formality mismatch")
        tips.append("Mix pieces at the same formality level — avoid pairing gym wear with formal attire.")
    if features["color_harmony"] < 0.75:
        drivers.append("color clash")
        tips.append("Stick to a monochromatic or analogous colour palette for a cohesive look.")
    if features["garment_compatibility"] < 0.60:
        drivers.append("garment incompatibility")
        tips.append("Ensure your top, bottom, and footwear work together as a category group.")
    if features["style_compatibility"] < 0.60:
        drivers.append("style conflict")
        tips.append("Avoid mixing streetwear and formal styles in the same outfit.")
    if features["neutral_ratio"] < 0.40:
        drivers.append("too many bold colors")
        tips.append("Anchor the look with at least one neutral piece (black, white, navy, grey).")
    if features["color_count"] < 0.67:
        tips.append("Try to keep the palette to 3 colors or fewer.")

    if score >= 0.70:
        verdict = "Stylish Match"
        top_reason = "This outfit scores well on formality consistency and colour harmony."
    elif score >= 0.45:
        verdict = "Needs Work"
        top_reason = f"The outfit has potential but suffers from: {', '.join(drivers[:2]) or 'minor balance issues'}."
    else:
        verdict = "Clashing"
        top_reason = f"Strong compatibility issues detected: {', '.join(drivers[:2]) or 'multiple clashes'}."

    return {
        "score":      score,
        "verdict":    verdict,
        "top_reason": top_reason,
        "tips":       tips if tips else ["This outfit looks great — no major issues found!"],
        "features":   features,
        "version":    _MODEL_VERSION,
    }