"""
Exploratory Data Analysis (EDA) for StyleMate Polyvore Dataset
Calculates summary statistics, correlation matrices, and generates
visualizations for feature distributions and multicollinearity.
"""

import os
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend for headless image saving
import matplotlib.pyplot as plt
import seaborn as sns

DATA_PATH   = "/Users/khyatianand/Documents/stylemate/ai/data/polyvore_outfits_features.csv"
DOCS_DIR    = "/Users/khyatianand/Documents/stylemate/ai/docs"
os.makedirs(DOCS_DIR    = "/Users/khyatianand/Documents/stylemate/ai/docs")

def run_eda():
    df = pd.read_csv(DATA_PATH)
    print("=" * 70)
    print("      STYLEMATE — EXPLORATORY DATA ANALYSIS (EDA) REPORT")
    print("=" * 70)

    # 1. Dataset Dimensions & Class Balance
    total_rows = len(df)
    n_pos = sum(df["is_compatible"] == 1)
    n_neg = sum(df["is_compatible"] == 0)
    print(f"\n[1] DATASET OVERVIEW:")
    print(f"  • Total Samples       : {total_rows:,} outfits")
    print(f"  • Compatible (y = 1)  : {n_pos:,} ({n_pos/total_rows*100:.1f}%)")
    print(f"  • Clashing   (y = 0)  : {n_neg:,} ({n_neg/total_rows*100:.1f}%)")
    print(f"  • Total Features      : 10 numerical features")
    print(f"  • Missing / Nulls     : {df.isnull().sum().sum()} missing values")

    # 2. Detailed Feature Statistics
    feature_cols = [c for c in df.columns if c != "is_compatible"]
    stats_df = df[feature_cols].describe().T[["mean", "std", "min", "50%", "max"]]
    stats_df["variance"] = df[feature_cols].var()
    print("\n[2] FEATURE STATISTICAL SUMMARY:")
    print(f"{'Feature':<25} | {'Mean':<7} | {'Std':<7} | {'Median':<7} | {'Min':<5} | {'Max':<5} | {'Variance':<8}")
    print("-" * 75)
    for feat, row in stats_df.iterrows():
        print(f"{feat:<25} | {row['mean']:<7.4f} | {row['std']:<7.4f} | {row['50%']:<7.4f} | {row['min']:<5.2f} | {row['max']:<5.2f} | {row['variance']:<8.4f}")

    # 3. Class-Separation Analysis (Signal Strength)
    print("\n[3] FEATURE SIGNAL STRENGTH (Class 1 vs Class 0):")
    means_pos = df[df["is_compatible"] == 1][feature_cols].mean()
    means_neg = df[df["is_compatible"] == 0][feature_cols].mean()
    stds_pooled = np.sqrt((df[df["is_compatible"] == 1][feature_cols].var() + df[df["is_compatible"] == 0][feature_cols].var()) / 2)
    
    # Cohen's d effect size
    cohens_d = (means_pos - means_neg) / stds_pooled
    signal_ranking = cohens_d.sort_values(ascending=False)

    print(f"{'Feature':<25} | {'Mean(y=1)':<9} | {'Mean(y=0)':<9} | {'Delta':<7} | {'Effect Size (Cohen d)':<20}")
    print("-" * 78)
    for feat in signal_ranking.index:
        delta = means_pos[feat] - means_neg[feat]
        d_val = signal_ranking[feat]
        interpretation = "Very Strong" if abs(d_val) > 0.6 else ("Moderate" if abs(d_val) > 0.3 else "Weak / Flat")
        print(f"{feat:<25} | {means_pos[feat]:<9.4f} | {means_neg[feat]:<9.4f} | {delta:<+7.4f} | {d_val:<+6.3f} ({interpretation})")

    # 4. Correlation with Target & Multicollinearity
    corr_matrix = df.corr()
    target_corr = corr_matrix["is_compatible"].drop("is_compatible").sort_values(ascending=False)

    print("\n[4] CORRELATION WITH TARGET (is_compatible):")
    for feat, corr_val in target_corr.items():
        print(f"  • {feat:<25}: {corr_val:+.4f}")

    # Check for collinear pairs (> 0.70)
    print("\n[5] MULTICOLLINEARITY CHECK (Feature-to-Feature Correlation > 0.70):")
    collinear_pairs = []
    for i in range(len(feature_cols)):
        for j in range(i + 1, len(feature_cols)):
            f1, f2 = feature_cols[i], feature_cols[j]
            r = corr_matrix.loc[f1, f2]
            if abs(r) > 0.70:
                collinear_pairs.append((f1, f2, r))

    if collinear_pairs:
        for f1, f2, r in collinear_pairs:
            print(f"  ⚠️ Collinear Pair: {f1} <--> {f2} (r = {r:.4f})")
    else:
        print("  ✅ All features are independent (no pairs with |r| > 0.70). High feature diversity!")

    # 5. Generate and Save Visualizations
    print("\n[6] GENERATING VISUALIZATIONS...")

    # Plot 1: Correlation Heatmap
    plt.figure(figsize=(10, 8))
    sns.set_theme(style="white")
    mask = np.triu(np.ones_like(corr_matrix, dtype=bool))
    cmap = sns.diverging_palette(230, 20, as_cmap=True)
    sns.heatmap(corr_matrix, mask=mask, cmap=cmap, vmin=-1.0, vmax=1.0, annot=True, fmt=".2f",
                square=True, linewidths=.5, cbar_kws={"shrink": .8})
    plt.title("StyleMate Feature Correlation Matrix", fontsize=14, fontweight="bold", pad=15)
    heatmap_path = os.path.join(DOCS_DIR, "eda_correlation_heatmap.png")
    plt.tight_layout()
    plt.savefig(heatmap_path, dpi=200)
    plt.close()
    print(f"  • Saved Correlation Heatmap : {heatmap_path}")

    # Plot 2: Feature Distributions by Class
    fig, axes = plt.subplots(5, 2, figsize=(14, 18))
    axes = axes.flatten()

    for idx, feat in enumerate(feature_cols):
        ax = axes[idx]
        sns.histplot(data=df, x=feat, hue="is_compatible", kde=True, ax=ax,
                     palette={1: "#10B981", 0: "#EF4444"}, common_norm=False, bins=25, alpha=0.4)
        ax.set_title(f"{feat}", fontsize=11, fontweight="bold")
        ax.set_xlabel("Feature Value [0.0 - 1.0]")
        ax.legend(labels=["Compatible (Stylist)", "Clashing"], loc="upper left", fontsize=8)

    plt.suptitle("Feature Distributions: Stylist Curated (Green) vs. Clashing (Red)", fontsize=16, fontweight="bold", y=1.00)
    dist_path = os.path.join(DOCS_DIR, "eda_feature_distributions.png")
    plt.tight_layout()
    plt.savefig(dist_path, dpi=200)
    plt.close()
    print(f"  • Saved Distribution Plots  : {dist_path}")

    print("\n" + "=" * 70)
    print("                     EDA COMPLETE")
    print("=" * 70)

if __name__ == "__main__":
    run_eda()
