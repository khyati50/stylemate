"""
Dataset Exploration Script for Polyvore Outfits
Reads the raw JSON files and prints clean, readable summaries.
"""

import json
import os

POLYVORE_DIR = "/Users/khyatianand/Downloads/polyvore"

def explore():
    print("=" * 70)
    print("       STYLEMATE — POLYVORE OUTFITS DATASET EXPLORATION")
    print("=" * 70)

    # 1. Dataset Overview & File Sizes
    train_path = os.path.join(POLYVORE_DIR, "train_no_dup.json")
    valid_path = os.path.join(POLYVORE_DIR, "valid_no_dup.json")
    test_path = os.path.join(POLYVORE_DIR, "test_no_dup.json")
    compat_path = os.path.join(POLYVORE_DIR, "fashion_compatibility_prediction.txt")

    print("\n[1] DATASET SPLITS:")
    with open(train_path, "r") as f:
        train_data = json.load(f)
    print(f"  • Training Outfits   : {len(train_data):,} outfits")

    with open(valid_path, "r") as f:
        valid_data = json.load(f)
    print(f"  • Validation Outfits : {len(valid_data):,} outfits")

    with open(test_path, "r") as f:
        test_data = json.load(f)
    print(f"  • Test Outfits       : {len(test_data):,} outfits")

    total_outfits = len(train_data) + len(valid_data) + len(test_data)
    print(f"  • TOTAL REAL OUTFITS : {total_outfits:,} outfits")

    # 2. Outfits Structure & Statistics
    item_counts = [len(o.get("items", [])) for o in train_data]
    avg_items = sum(item_counts) / len(item_counts)
    print(f"\n[2] OUTFIT COMPOSITION:")
    print(f"  • Average items per outfit : {avg_items:.1f} items")
    print(f"  • Min items in an outfit   : {min(item_counts)} items")
    print(f"  • Max items in an outfit   : {max(item_counts)} items")

    # 3. Formatted Sample Outfits
    print("\n[3] REAL STYLIST OUTFIT SAMPLES:")
    # Pick 3 diverse outfits
    sample_indices = [0, 4, 12]
    for idx, sample_idx in enumerate(sample_indices, 1):
        outfit = train_data[sample_idx]
        name = outfit.get("name", "Untitled Outfit")
        desc = outfit.get("desc", "").strip() or "No description provided"
        views = outfit.get("views", 0)
        likes = outfit.get("likes", 0)
        items = outfit.get("items", [])

        print("\n" + "-" * 70)
        print(f"  OUTFIT #{idx}: \"{name}\"  (Likes: {likes:,} | Views: {views:,})")
        print(f"  Stylist Note: {desc[:100]}..." if len(desc) > 100 else f"  Stylist Note: {desc}")
        print("  Items Included:")
        for item in items:
            item_name = item.get("name", "").strip()
            if not item_name:
                continue
            cat_id = item.get("categoryid", "N/A")
            price = item.get("price")
            price_str = f"${price:.2f}" if (isinstance(price, (int, float)) and price > 0) else "Price N/A"
            print(f"    • {item_name:50} | Cat: {cat_id:<5} | {price_str}")
    print("-" * 70)

    # 4. Official Compatibility Benchmark File
    if os.path.exists(compat_path):
        print("\n[4] OFFICIAL GROUND-TRUTH COMPATIBILITY BENCHMARK (Preview):")
        pos_samples = []
        neg_samples = []
        with open(compat_path, "r") as f:
            for line in f:
                parts = line.strip().split()
                if not parts:
                    continue
                label = parts[0]
                if label == "1" and len(pos_samples) < 2:
                    pos_samples.append(parts)
                elif label == "0" and len(neg_samples) < 2:
                    neg_samples.append(parts)
                if len(pos_samples) >= 2 and len(neg_samples) >= 2:
                    break

        print("  • POSITIVE PAIRS (Label = 1, Stylist Cohesive Outfits):")
        for p in pos_samples:
            print(f"    Label {p[0]}: {len(p)-1} cohesive item IDs: {', '.join(p[1:5])}...")

        print("\n  • NEGATIVE PAIRS (Label = 0, Clashing Mismatched Outfits):")
        for n in neg_samples:
            print(f"    Label {n[0]}: {len(n)-1} clashing item IDs: {', '.join(n[1:5])}...")

    print("\n" + "=" * 70)
    print("                    EXPLORATION COMPLETE")
    print("=" * 70)

if __name__ == "__main__":
    explore()
