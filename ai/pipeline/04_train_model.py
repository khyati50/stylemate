"""
StyleMate AI — Model Training Showdown
=======================================
Trains 3 candidate models on the 20,000-outfit Polyvore dataset:
  1. LogisticRegression       (Linear Baseline)
  2. RandomForestClassifier   (Bagging Ensemble)
  3. HistGradientBoosting     (Modern Gradient Boosting)

Outputs:
  - Detailed metrics table (Accuracy, ROC-AUC, F1, Precision, Recall)
  - Confusion matrix plots (saved to ai/docs/)
  - ROC-AUC curve comparison plot (saved to ai/docs/)
  - Winning model saved to ai/models/outfit_model.pkl
"""

import os
import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score, roc_auc_score, f1_score,
    precision_score, recall_score, confusion_matrix, roc_curve
)

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
    # Slot presence features (binary 0/1) — model learns their weights
    "has_core", "has_shoes", "has_outer", "has_acc",
]
TARGET_COL = "is_compatible"

# ---------------------------------------------------------------------------
# 1. Load & Split Data
# ---------------------------------------------------------------------------
def load_data():
    df = pd.read_csv(DATA_PATH)
    X  = df[FEATURE_COLS]
    y  = df[TARGET_COL]

    # Stratified 80/20 split preserving 50/50 class ratio
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    return X_train, X_test, y_train, y_test


# ---------------------------------------------------------------------------
# 2. Model Definitions
# ---------------------------------------------------------------------------
def build_models(X_train, y_train):
    """Fit all 3 models and return a dict of {name: fitted_model}."""

    # Logistic Regression needs scaled features (mean=0, std=1)
    scaler        = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)

    print("  Training LogisticRegression...")
    lr = LogisticRegression(max_iter=1000, C=1.0, random_state=42, solver="lbfgs")
    lr.fit(X_train_scaled, y_train)

    print("  Training RandomForestClassifier...")
    rf = RandomForestClassifier(
        n_estimators=300,
        max_depth=12,
        min_samples_split=4,
        min_samples_leaf=2,
        max_features="sqrt",
        random_state=42,
        n_jobs=-1
    )
    rf.fit(X_train, y_train)

    print("  Training HistGradientBoostingClassifier...")
    hgb = HistGradientBoostingClassifier(
        max_iter=400,
        learning_rate=0.05,
        max_depth=6,
        min_samples_leaf=20,
        random_state=42
    )
    hgb.fit(X_train, y_train)

    return scaler, lr, rf, hgb


# ---------------------------------------------------------------------------
# 3. Evaluation
# ---------------------------------------------------------------------------
def evaluate(name, model, X_test, y_test, scaler=None):
    """Returns a dict of all evaluation metrics."""
    X_input = scaler.transform(X_test) if scaler else X_test
    y_pred  = model.predict(X_input)
    y_prob  = model.predict_proba(X_input)[:, 1]

    return {
        "Model"     : name,
        "Accuracy"  : round(accuracy_score(y_test, y_pred)  * 100, 2),
        "ROC-AUC"   : round(roc_auc_score(y_test, y_prob)   * 100, 2),
        "F1-Score"  : round(f1_score(y_test, y_pred)        * 100, 2),
        "Precision" : round(precision_score(y_test, y_pred) * 100, 2),
        "Recall"    : round(recall_score(y_test, y_pred)    * 100, 2),
        "_y_pred"   : y_pred,
        "_y_prob"   : y_prob,
    }


# ---------------------------------------------------------------------------
# 4. Cross-Validation (Generalization Check)
# ---------------------------------------------------------------------------
def cross_validate_models(scaler, lr, rf, hgb, X_train, y_train):
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    X_scaled = scaler.transform(X_train)

    print("\n  Running 5-Fold Cross-Validation...")
    lr_cv  = cross_val_score(lr,  X_scaled,     y_train, cv=cv, scoring="roc_auc")
    rf_cv  = cross_val_score(rf,  X_train,       y_train, cv=cv, scoring="roc_auc")
    hgb_cv = cross_val_score(hgb, X_train,       y_train, cv=cv, scoring="roc_auc")

    return {
        "LogisticRegression"         : lr_cv,
        "RandomForestClassifier"     : rf_cv,
        "HistGradientBoosting"       : hgb_cv,
    }


# ---------------------------------------------------------------------------
# 5. Plot Confusion Matrices
# ---------------------------------------------------------------------------
def plot_confusion_matrices(results, y_test):
    fig, axes = plt.subplots(1, 3, figsize=(16, 4))
    palettes  = ["Blues", "Greens", "Purples"]
    for ax, r, pal in zip(axes, results, palettes):
        cm = confusion_matrix(y_test, r["_y_pred"])
        sns.heatmap(
            cm, annot=True, fmt="d", cmap=pal,
            ax=ax,
            xticklabels=["Clashing", "Stylist"],
            yticklabels=["Clashing", "Stylist"],
            cbar=False
        )
        acc = r["Accuracy"]
        ax.set_title(f"{r['Model']}\nAccuracy: {acc}%", fontweight="bold", fontsize=10)
        ax.set_xlabel("Predicted Label")
        ax.set_ylabel("True Label")

    plt.suptitle("Confusion Matrices — StyleMate Outfit Compatibility Model", fontsize=13, fontweight="bold")
    plt.tight_layout()
    out = os.path.join(DOCS_DIR, "model_confusion_matrices.png")
    plt.savefig(out, dpi=200)
    plt.close()
    print(f"  Saved confusion matrices → {out}")


# ---------------------------------------------------------------------------
# 6. Plot ROC-AUC Curves
# ---------------------------------------------------------------------------
def plot_roc_curves(results, y_test):
    plt.figure(figsize=(8, 6))
    model_colors = ["#3B82F6", "#10B981", "#F59E0B"]
    for r, color in zip(results, model_colors):
        fpr, tpr, _ = roc_curve(y_test, r["_y_prob"])
        plt.plot(fpr, tpr, color=color, lw=2.5,
                 label=f"{r['Model']} (AUC = {r['ROC-AUC']}%)")
    plt.plot([0, 1], [0, 1], "k--", lw=1.5, label="Random Guess (AUC = 50%)")
    plt.xlabel("False Positive Rate  (Bad outfit marked as Stylish)")
    plt.ylabel("True Positive Rate  (Good outfit correctly identified)")
    plt.title("ROC-AUC Curves — All 3 Models", fontsize=13, fontweight="bold")
    plt.legend(loc="lower right", fontsize=9)
    plt.grid(alpha=0.3)
    plt.tight_layout()
    out = os.path.join(DOCS_DIR, "model_roc_auc_curves.png")
    plt.savefig(out, dpi=200)
    plt.close()
    print(f"  Saved ROC-AUC curves    → {out}")


# ---------------------------------------------------------------------------
# 7. Feature Importance (Random Forest & HGB)
# ---------------------------------------------------------------------------
def plot_feature_importance(rf, hgb, X_train, y_train, feature_names):
    """
    Random Forest exposes .feature_importances_ directly.
    HistGradientBoosting in scikit-learn requires permutation importance.
    """
    from sklearn.inspection import permutation_importance

    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    # --- RandomForest: built-in importances ---
    ax = axes[0]
    rf_imp = pd.Series(rf.feature_importances_, index=feature_names).sort_values(ascending=True)
    bars = ax.barh(rf_imp.index, rf_imp.values, color="#10B981", edgecolor="white")
    ax.set_xlabel("Importance Score")
    ax.set_title("RandomForest — Feature Importance", fontweight="bold", fontsize=10)
    for bar in bars:
        width = bar.get_width()
        ax.text(width + 0.001, bar.get_y() + bar.get_height() / 2,
                f"{width:.3f}", va="center", ha="left", fontsize=7.5)
    ax.set_xlim(0, rf_imp.max() * 1.25)

    # --- HistGradientBoosting: permutation importance on small training subset ---
    ax = axes[1]
    from sklearn.inspection import permutation_importance as perm_imp
    # Use a 2000-row subset for speed
    X_sub = X_train.iloc[:2000].reset_index(drop=True)
    y_sub = y_train.iloc[:2000].reset_index(drop=True)
    perm_result = perm_imp(hgb, X_sub, y_sub, n_repeats=5, random_state=42)
    hgb_imp = pd.Series(perm_result.importances_mean, index=feature_names).sort_values(ascending=True)
    bars = ax.barh(hgb_imp.index, hgb_imp.values, color="#F59E0B", edgecolor="white")
    ax.set_xlabel("Mean Accuracy Drop (Permutation)")
    ax.set_title("HistGradientBoosting — Permutation Importance", fontweight="bold", fontsize=10)
    for bar in bars:
        width = bar.get_width()
        ax.text(width + 0.0001, bar.get_y() + bar.get_height() / 2,
                f"{width:.4f}", va="center", ha="left", fontsize=7.5)
    ax.set_xlim(0, max(hgb_imp.max() * 1.3, 0.01))

    plt.suptitle("What the Models Actually Learned — Feature Importances", fontsize=12, fontweight="bold")
    plt.tight_layout()
    out = os.path.join(DOCS_DIR, "model_feature_importances.png")
    plt.savefig(out, dpi=200)
    plt.close()
    print(f"  Saved feature importances → {out}")


# ---------------------------------------------------------------------------
# 8. Main
# ---------------------------------------------------------------------------
def main():
    print("=" * 70)
    print("     STYLEMATE — MODEL TRAINING SHOWDOWN")
    print("=" * 70)

    # Load data
    print("\n[1] Loading dataset...")
    X_train, X_test, y_train, y_test = load_data()
    print(f"  Train set : {len(X_train):,} outfits ({y_train.sum():,} stylist / {(y_train==0).sum():,} clashing)")
    print(f"  Test set  : {len(X_test):,}  outfits ({y_test.sum():,}  stylist / {(y_test==0).sum():,}  clashing)")

    # Train
    print("\n[2] Training all 3 models...")
    scaler, lr, rf, hgb = build_models(X_train, y_train)

    # Evaluate on held-out test set
    print("\n[3] Evaluating on 4,000 held-out test outfits...")
    results = [
        evaluate("LogisticRegression",     lr,  X_test, y_test, scaler=scaler),
        evaluate("RandomForestClassifier", rf,  X_test, y_test),
        evaluate("HistGradientBoosting",   hgb, X_test, y_test),
    ]

    # Print comparison table
    print("\n[4] MODEL COMPARISON TABLE:")
    print(f"{'Model':<28} | {'Accuracy':>9} | {'ROC-AUC':>9} | {'F1-Score':>9} | {'Precision':>10} | {'Recall':>8}")
    print("-" * 82)
    for r in results:
        print(
            f"{r['Model']:<28} | {r['Accuracy']:>8}% | {r['ROC-AUC']:>8}% | "
            f"{r['F1-Score']:>8}% | {r['Precision']:>9}% | {r['Recall']:>7}%"
        )

    # Cross-validation
    print("\n[5] CROSS-VALIDATION RESULTS (5-Fold ROC-AUC):")
    cv_scores = cross_validate_models(scaler, lr, rf, hgb, X_train, y_train)
    for name, scores in cv_scores.items():
        print(f"  {name:<28}: Mean = {scores.mean()*100:.2f}% | Std = ±{scores.std()*100:.2f}%")

    # Plots
    print("\n[6] Generating evaluation plots...")
    plot_confusion_matrices(results, y_test)
    plot_roc_curves(results, y_test)
    plot_feature_importance(rf, hgb, X_train, y_train, FEATURE_COLS)

    # Pick winner (by ROC-AUC)
    winner_result = max(results, key=lambda r: r["ROC-AUC"])
    winner_name   = winner_result["Model"]

    if   winner_name == "LogisticRegression":
        winner_model = lr
        save_scaler  = scaler
    elif winner_name == "RandomForestClassifier":
        winner_model = rf
        save_scaler  = None
    else:
        winner_model = hgb
        save_scaler  = None

    # Save winning model
    print(f"\n[7] WINNER: {winner_name} (ROC-AUC = {winner_result['ROC-AUC']}%)")
    joblib.dump(
        {"model": winner_model, "scaler": save_scaler, "features": FEATURE_COLS, "version": "v2_polyvore"},
        MODEL_PATH
    )
    print(f"  Saved winning model → {MODEL_PATH}")

    print("\n" + "=" * 70)
    print("     TRAINING COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()
