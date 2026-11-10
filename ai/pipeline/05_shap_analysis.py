"""
StyleMate AI — SHAP Explainability Analysis
============================================
Uses SHAP (SHapley Additive exPlanations) on the winning
HistGradientBoosting model to answer two key questions:

  GLOBAL:  Which features matter most across ALL 20,000 outfits?
  LOCAL:   For a specific outfit, WHY did the model accept or reject it?

Outputs (all saved to ai/docs/):
  shap_global_summary.png     — Global feature importance (beeswarm)
  shap_global_bar.png         — Sorted mean |SHAP| bar chart
  shap_local_accepted.png     — Waterfall for a Stylist-Approved outfit
  shap_local_rejected.png     — Waterfall for a Clashing outfit
"""

import os
import joblib
import numpy as np
import pandas as pd
import shap
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
DATA_PATH   = "/Users/khyatianand/Documents/stylemate/ai/data/polyvore_outfits_features.csv"
MODEL_PATH  = "/Users/khyatianand/Documents/stylemate/ai/models/v2_polyvore/outfit_model.pkl"
DOCS_DIR    = "/Users/khyatianand/Documents/stylemate/ai/docs"
os.makedirs(DOCS_DIR, exist_ok=True)

FEATURE_COLS = [
    "neutral_ratio", "color_harmony", "color_count",
    "style_compatibility", "formality_consistency",
    "occasion_suitability", "seasonal_suitability",
    "layering_score", "garment_compatibility",
    "has_core", "has_shoes", "has_outer", "has_acc",
]

# Human-readable display names for axes
FEATURE_LABELS = {
    "neutral_ratio":         "Neutral Color Ratio",
    "color_harmony":         "Color Harmony",
    "color_count":           "Color Count Score",
    "style_compatibility":   "Style Compatibility",
    "formality_consistency": "Formality Consistency",
    "occasion_suitability":  "Occasion Suitability",
    "seasonal_suitability":  "Seasonal Suitability",
    "layering_score":        "Layering Score",
    "garment_compatibility": "Garment Compatibility",
    # Slot presence features (replaced outfit_completeness)
    "has_core":              "Has Core (Top+Bottom/Dress)",
    "has_shoes":             "Has Shoes",
    "has_outer":             "Has Outerwear",
    "has_acc":               "Has Accessories",
}


def main():
    print("=" * 70)
    print("     STYLEMATE — SHAP EXPLAINABILITY ANALYSIS")
    print("=" * 70)

    # ----------------------------------------------------------------
    # 1. Load dataset & model
    # ----------------------------------------------------------------
    print("\n[1] Loading dataset and model...")
    df    = pd.read_csv(DATA_PATH)
    X     = df[FEATURE_COLS]
    y     = df["is_compatible"]

    _, X_test, _, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)

    bundle = joblib.load(MODEL_PATH)
    model  = bundle["model"]

    print(f"  Model type    : {type(model).__name__}")
    print(f"  Test samples  : {len(X_test):,}")

    # ----------------------------------------------------------------
    # 2. Build SHAP Explainer
    # ----------------------------------------------------------------
    print("\n[2] Building SHAP TreeExplainer...")
    # Use a background sample of 500 rows for fast computation
    background = shap.sample(X_test, 500, random_state=42)
    explainer  = shap.Explainer(model, background)

    # Compute SHAP values on the full test set (4,000 outfits)
    print("  Computing SHAP values on 4,000 test outfits (this takes ~30s)...")
    shap_values = explainer(X_test, check_additivity=False)
    print("  Done!")

    # ----------------------------------------------------------------
    # 3. GLOBAL — Summary Beeswarm Plot
    # ----------------------------------------------------------------
    print("\n[3] Generating GLOBAL SHAP Summary (Beeswarm)...")
    plt.figure(figsize=(10, 6))
    shap.summary_plot(
        shap_values,
        X_test,
        feature_names=[FEATURE_LABELS[f] for f in FEATURE_COLS],
        show=False,
        plot_size=None,
        color_bar_label="Feature Value (Low → High)"
    )
    plt.title("SHAP Beeswarm — Global Feature Impact on Outfit Compatibility",
              fontsize=12, fontweight="bold", pad=12)
    plt.tight_layout()
    beeswarm_path = os.path.join(DOCS_DIR, "shap_global_summary.png")
    plt.savefig(beeswarm_path, dpi=200, bbox_inches="tight")
    plt.close()
    print(f"  Saved → {beeswarm_path}")

    # ----------------------------------------------------------------
    # 4. GLOBAL — Mean |SHAP| Bar Chart (ranked importance)
    # ----------------------------------------------------------------
    print("\n[4] Generating GLOBAL SHAP Bar Chart (Mean Absolute Importance)...")
    mean_shap = np.abs(shap_values.values).mean(axis=0)
    importance_df = pd.DataFrame({
        "feature": [FEATURE_LABELS[f] for f in FEATURE_COLS],
        "mean_shap": mean_shap
    }).sort_values("mean_shap", ascending=True)

    fig, ax = plt.subplots(figsize=(9, 5))
    colors = ["#2563EB" if v >= importance_df["mean_shap"].median() else "#93C5FD"
              for v in importance_df["mean_shap"]]
    bars = ax.barh(importance_df["feature"], importance_df["mean_shap"],
                   color=colors, edgecolor="white", height=0.65)
    for bar in bars:
        w = bar.get_width()
        ax.text(w + 0.0005, bar.get_y() + bar.get_height() / 2,
                f"{w:.4f}", va="center", ha="left", fontsize=8)

    ax.set_xlabel("Mean |SHAP Value|  (Average Impact on Model Output)")
    ax.set_title("SHAP Global Feature Importance — StyleMate Outfit Compatibility Model",
                 fontsize=11, fontweight="bold")
    ax.set_xlim(0, importance_df["mean_shap"].max() * 1.25)
    ax.axvline(x=importance_df["mean_shap"].median(), color="#EF4444",
               linestyle="--", linewidth=1.2, alpha=0.7, label="Median Importance")
    ax.legend(fontsize=8)
    plt.tight_layout()
    bar_path = os.path.join(DOCS_DIR, "shap_global_bar.png")
    plt.savefig(bar_path, dpi=200, bbox_inches="tight")
    plt.close()
    print(f"  Saved → {bar_path}")

    # Print the ranking in the console
    print("\n  SHAP Feature Importance Ranking:")
    ranked = importance_df.sort_values("mean_shap", ascending=False)
    for _, row in ranked.iterrows():
        bar_len = int(row["mean_shap"] / ranked["mean_shap"].max() * 25)
        bar_str = "█" * bar_len
        print(f"    {row['feature']:<28}: {bar_str:<25} ({row['mean_shap']:.4f})")

    # ----------------------------------------------------------------
    # 5. LOCAL — Waterfall for a HIGH-SCORING (Accepted) Outfit
    # ----------------------------------------------------------------
    print("\n[5] Finding a high-confidence STYLIST-APPROVED outfit for local explanation...")
    probs      = model.predict_proba(X_test)[:, 1]
    test_reset = X_test.reset_index(drop=True)
    y_reset    = y_test.reset_index(drop=True)

    # Best predicted positive that is actually positive (y=1)
    pos_mask   = y_reset == 1
    best_pos_idx = np.argmax(np.where(pos_mask, probs, -1))
    best_pos_prob = probs[best_pos_idx]

    print(f"  Outfit #{best_pos_idx}: Predicted prob = {best_pos_prob:.4f} | True label = Stylist (y=1)")
    print("  Feature values:")
    for feat in FEATURE_COLS:
        print(f"    {FEATURE_LABELS[feat]:<28}: {test_reset.iloc[best_pos_idx][feat]:.4f}")

    fig, ax = plt.subplots(figsize=(10, 6))
    shap.waterfall_plot(shap_values[best_pos_idx], show=False, max_display=10)
    plt.title(f"SHAP Local Explanation — Stylist Approved Outfit\n"
              f"Model Confidence: {best_pos_prob*100:.1f}% Compatible",
              fontsize=11, fontweight="bold")
    plt.tight_layout()
    accepted_path = os.path.join(DOCS_DIR, "shap_local_accepted.png")
    plt.savefig(accepted_path, dpi=200, bbox_inches="tight")
    plt.close()
    print(f"  Saved → {accepted_path}")

    # ----------------------------------------------------------------
    # 6. LOCAL — Waterfall for a LOW-SCORING (Rejected) Outfit
    # ----------------------------------------------------------------
    print("\n[6] Finding a high-confidence CLASHING outfit for local explanation...")
    # Worst predicted outfit that is actually clashing (y=0)
    neg_mask     = y_reset == 0
    worst_neg_idx = np.argmin(np.where(neg_mask, probs, 2))
    worst_neg_prob = probs[worst_neg_idx]

    print(f"  Outfit #{worst_neg_idx}: Predicted prob = {worst_neg_prob:.4f} | True label = Clashing (y=0)")
    print("  Feature values:")
    for feat in FEATURE_COLS:
        print(f"    {FEATURE_LABELS[feat]:<28}: {test_reset.iloc[worst_neg_idx][feat]:.4f}")

    fig, ax = plt.subplots(figsize=(10, 6))
    shap.waterfall_plot(shap_values[worst_neg_idx], show=False, max_display=10)
    plt.title(f"SHAP Local Explanation — Clashing / Rejected Outfit\n"
              f"Model Confidence: {worst_neg_prob*100:.1f}% Compatible (Rejected)",
              fontsize=11, fontweight="bold")
    plt.tight_layout()
    rejected_path = os.path.join(DOCS_DIR, "shap_local_rejected.png")
    plt.savefig(rejected_path, dpi=200, bbox_inches="tight")
    plt.close()
    print(f"  Saved → {rejected_path}")

    # ----------------------------------------------------------------
    # 7. Console Summary
    # ----------------------------------------------------------------
    print("\n" + "=" * 70)
    print("     SHAP ANALYSIS COMPLETE — SUMMARY")
    print("=" * 70)
    print(f"\n  4 SHAP plots saved to: {DOCS_DIR}")
    print("  ┌─────────────────────────────────────────────────────────┐")
    print("  │  shap_global_summary.png   — Beeswarm: all 4000 outfits │")
    print("  │  shap_global_bar.png       — Ranked importance bar chart │")
    print("  │  shap_local_accepted.png   — Why a good outfit was kept  │")
    print("  │  shap_local_rejected.png   — Why a bad outfit was flagged│")
    print("  └─────────────────────────────────────────────────────────┘")

if __name__ == "__main__":
    main()
