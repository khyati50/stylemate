# StyleMate AI — Model Versions

This folder contains all trained model versions. Each version is in its own
sub-directory with a clear name so old and new models are never mixed up.

## Versions

### `v2_polyvore/` ← ACTIVE (Current Production Model)
- **Model:** `HistGradientBoostingClassifier`
- **Training Data:** 20,000 real Polyvore stylist outfits (10k positive + 10k negative-sampled)
- **Performance:** ROC-AUC 74.38% | Recall 96.1% | F1 76.16%
- **Scoring:** Returns `predict_proba()[:, 1]` — a true probability in [0.0, 1.0]
- **Trained on:** November 2026

### `v1_synthetic/` ← LEGACY (Archived, Not In Use)
- **Model:** `RandomForestRegressor`
- **Training Data:** 500 synthetically generated outfits scored by a hardcoded formula (`sum(weight * feature)`)
- **Problem:** Was not learning real fashion — only memorizing a Python equation
- **Scoring:** Returned an arbitrary float, not a probability
- **Why Archived:** Replaced by v2 which trains on real human stylist data

## Switching Between Versions

In [`ranker.py`](../ranker.py), change the `ACTIVE_MODEL_VERSION` constant:

```python
# Active model (line 21 in ranker.py)
ACTIVE_MODEL_VERSION = "v2_polyvore"   # ← Change to "v1_synthetic" to rollback
```

## Model Bundle Format (v2)

The `.pkl` file is a Python dict with these keys:

```python
{
    "model":    <HistGradientBoostingClassifier>,   # fitted sklearn model
    "scaler":   None,                               # None for tree models
    "features": ["neutral_ratio", "color_harmony", ...],  # exact column order
    "version":  "v2_polyvore"                       # version string
}
```
