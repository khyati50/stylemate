"""
Build Polyvore Features Dataset
-------------------------------
Reads real stylist outfits from train_no_dup.json,
extracts complete outfits (y = 1), generates realistic negative
sampled clashing outfits (y = 0), and extracts the 13 compatibility
features for each outfit into a clean CSV for EDA and ML training.

Features (13 total):
  9 continuous floats — color, style, context, garment
  4 binary slot flags — has_core, has_shoes, has_outer, has_acc
  (replaces old single hardcoded 'outfit_completeness' score)
"""

import json
import os
import re
import random
import pandas as pd
from feature_extractor import extract_features

random.seed(42)

POLYVORE_PATH = "/Users/khyatianand/Downloads/polyvore/train_no_dup.json"
OUTPUT_CSV_PATH = "/Users/khyatianand/Documents/stylemate/ai/data/polyvore_outfits_features.csv"

# Category mappings from Polyvore category IDs
TOP_CATS = {11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 104, 4495}
BOTTOM_CATS = {9, 27, 28, 29, 30, 236, 237, 238, 239}
FULL_CATS = {4, 5, 6, 7, 8, 31, 32}
OUTER_CATS = {23, 24, 25, 26, 103}
SHOE_CATS = {41, 42, 43, 44, 45, 46, 47, 48, 49, 261, 262}
ACCESSORY_CATS = {37, 38, 55, 57, 58, 62, 64, 65, 106, 259, 318}

# Regex title fallback patterns
SLOT_PATTERNS = {
    "outerwear": re.compile(r"\b(jacket|coat|blazer|parka|cardigan|vest|windbreaker|trench|bomber)\b", re.I),
    "full_body": re.compile(r"\b(dress|jumpsuit|romper|gown)\b", re.I),
    "lower_body": re.compile(r"\b(jean|jeans|pants|trousers|skirt|shorts|leggings|joggers)\b", re.I),
    "footwear": re.compile(r"\b(shoes|boots|booties|sneakers|pumps|heels|sandals|flats|loafers|trainers|oxfords)\b", re.I),
    "upper_body": re.compile(r"\b(top|shirt|blouse|t-shirt|tee|sweater|sweatshirt|hoodie|pullover|tank|camisole|singlet)\b", re.I),
    "accessories": re.compile(r"\b(bag|tote|backpack|satchel|clutch|purse|necklace|earrings|ring|bracelet|sunglasses|hat|fedora|belt)\b", re.I),
}

# Color vocabulary
COLOR_WORDS = [
    "black", "white", "grey", "gray", "navy", "blue", "red", "green", "pink",
    "brown", "beige", "yellow", "purple", "gold", "silver", "tan", "burgundy",
    "olive", "coral", "teal", "orange", "denim"
]

def extract_colors_from_name(name):
    """Extracts known colors from item title."""
    name_lower = name.lower()
    found = []
    for c in COLOR_WORDS:
        if re.search(r"\b" + c + r"\b", name_lower):
            normalized = "grey" if c == "gray" else ("navy" if c == "denim" else c)
            if normalized not in found:
                found.append(normalized)
    return found if found else ["black"]  # safe neutral fallback if unmentioned

def infer_styles_from_name(name, slot):
    """Infers style tags (casual, formal, streetwear, sporty, smart) from item title and category."""
    name_lower = name.lower()
    styles = []
    if re.search(r"\b(formal|tuxedo|blazer|gown|suit|oxford|pencil|silk|evening)\b", name_lower):
        styles.append("formal")
    if re.search(r"\b(hoodie|graphic|distressed|raw|denim|oversized|ripped|crop)\b", name_lower):
        styles.append("streetwear")
    if re.search(r"\b(sport|athletic|runner|running|sneaker|trainer|track|jogger|gym)\b", name_lower):
        styles.append("sporty")
    if re.search(r"\b(chinos|loafer|knit|turtleneck|cashmere|cardigan|smart)\b", name_lower):
        styles.append("smart")
    if not styles:
        styles.append("casual")
    return styles

def infer_season(name):
    """Infers seasonal suitability tags."""
    name_lower = name.lower()
    if re.search(r"\b(wool|fleece|sweater|coat|parka|boots|booties|knit|down|winter|warm)\b", name_lower):
        return ["winter", "autumn"]
    if re.search(r"\b(linen|sandals|shorts|tank|sleeveless|swim|summer|straw)\b", name_lower):
        return ["summer", "spring"]
    return ["all"]

def infer_occasion(styles):
    """Infers occasion tags from styles."""
    if "formal" in styles:
        return ["formal", "work"]
    if "sporty" in styles:
        return ["workout", "casual"]
    if "smart" in styles:
        return ["work", "casual"]
    return ["casual"]

def parse_item(raw_item):
    """Converts a raw Polyvore item into StyleMate structured dictionary."""
    name = raw_item.get("name", "").strip()
    cid = raw_item.get("categoryid")

    # Determine slot
    slot = None
    if cid in TOP_CATS: slot = "upper_body"
    elif cid in BOTTOM_CATS: slot = "lower_body"
    elif cid in FULL_CATS: slot = "full_body"
    elif cid in OUTER_CATS: slot = "outerwear"
    elif cid in SHOE_CATS: slot = "footwear"
    elif cid in ACCESSORY_CATS: slot = "accessories"
    else:
        for s, pattern in SLOT_PATTERNS.items():
            if pattern.search(name):
                slot = s
                break

    if not slot or not name or name.lower() == "polyvore":
        return None, None

    colors = extract_colors_from_name(name)
    styles = infer_styles_from_name(name, slot)
    seasons = infer_season(name)
    occasions = infer_occasion(styles)

    parsed = {
        "name": name,
        "clothing_category": slot,
        "colors": colors,
        "styles": styles,
        "occasions": occasions,
        "seasons": seasons
    }
    return slot, parsed

def build_dataset():
    print("Loading Polyvore raw JSON...")
    with open(POLYVORE_PATH, "r") as f:
        raw_outfits = json.load(f)
    print(f"Loaded {len(raw_outfits):,} total raw outfits.")

    positive_outfits = []
    pool_by_slot = {
        "upper_body": [],
        "lower_body": [],
        "full_body": [],
        "footwear": [],
        "outerwear": [],
        "accessories": []
    }

    # Extract clean wearable outfits
    for raw in raw_outfits:
        outfit_dict = {
            "upper_body": None,
            "lower_body": None,
            "full_body": None,
            "footwear": None,
            "outerwear": None,
            "accessories": []
        }
        for item in raw.get("items", []):
            slot, parsed = parse_item(item)
            if not slot or not parsed:
                continue
            if slot == "accessories":
                outfit_dict["accessories"].append(parsed)
                pool_by_slot["accessories"].append(parsed)
            elif outfit_dict[slot] is None:
                outfit_dict[slot] = parsed
                pool_by_slot[slot].append(parsed)

        # Check if complete: must have footwear AND (top+bottom OR full_body)
        has_wearable_base = (
            outfit_dict["footwear"] is not None and
            (
                (outfit_dict["upper_body"] is not None and outfit_dict["lower_body"] is not None) or
                (outfit_dict["full_body"] is not None)
            )
        )
        if has_wearable_base:
            positive_outfits.append(outfit_dict)

    print(f"Extracted {len(positive_outfits):,} complete wearable stylist outfits (y = 1).")

    # Limit to maximum 10,000 for balanced high-speed processing
    MAX_SAMPLES = min(10000, len(positive_outfits))
    positive_outfits = positive_outfits[:MAX_SAMPLES]
    print(f"Using {MAX_SAMPLES:,} positive outfits.")

    # Generate negative sampled clashing outfits (y = 0)
    print(f"Generating {MAX_SAMPLES:,} negative clashing outfits (y = 0)...")
    negative_outfits = []

    for pos in positive_outfits:
        neg = {k: (v.copy() if isinstance(v, dict) else (list(v) if isinstance(v, list) else None))
               for k, v in pos.items()}

        mode = random.choice(["swap_footwear", "swap_bottom", "swap_top", "hard_formality_clash"])

        if mode == "swap_footwear" and pool_by_slot["footwear"]:
            neg["footwear"] = random.choice(pool_by_slot["footwear"])
        elif mode == "swap_bottom" and neg["lower_body"] is not None and pool_by_slot["lower_body"]:
            neg["lower_body"] = random.choice(pool_by_slot["lower_body"])
        elif mode == "swap_top" and neg["upper_body"] is not None and pool_by_slot["upper_body"]:
            neg["upper_body"] = random.choice(pool_by_slot["upper_body"])
        else:
            # Formality clash: inject sporty gym shoes into formal or formal heels into casual
            if random.random() < 0.5:
                neg["footwear"] = {
                    "name": "Athletic Running Gym Shoes",
                    "clothing_category": "footwear",
                    "colors": ["red", "yellow"],
                    "styles": ["sporty"],
                    "occasions": ["workout"],
                    "seasons": ["all"]
                }
            else:
                neg["footwear"] = {
                    "name": "Patent Leather High Stiletto Pumps",
                    "clothing_category": "footwear",
                    "colors": ["black"],
                    "styles": ["formal"],
                    "occasions": ["formal"],
                    "seasons": ["all"]
                }
                if neg["upper_body"]:
                    neg["upper_body"]["styles"] = ["streetwear"]
                    neg["upper_body"]["colors"] = ["green", "orange"]

        negative_outfits.append(neg)

    # Extract 13 features for all outfits (9 continuous + 4 binary slot flags)
    print("Extracting features across all positive and negative outfits...")
    rows = []

    # Process Positives (y = 1)
    for outfit in positive_outfits:
        feats = extract_features(outfit, {"occasion": "casual"}, {"season": "all"}, {})
        feats["is_compatible"] = 1
        rows.append(feats)

    # Process Negatives (y = 0)
    for outfit in negative_outfits:
        feats = extract_features(outfit, {"occasion": "casual"}, {"season": "all"}, {})
        feats["is_compatible"] = 0
        rows.append(feats)

    df = pd.DataFrame(rows)
    # Shuffle dataset
    df = df.sample(frac=1.0, random_state=42).reset_index(drop=True)

    os.makedirs(os.path.dirname(OUTPUT_CSV_PATH), exist_ok=True)
    df.to_csv(OUTPUT_CSV_PATH, index=False)

    print(f"\nSUCCESS! Created dataset at:\n  {OUTPUT_CSV_PATH}")
    print(f"Total Rows : {len(df):,} (Positives: {sum(df['is_compatible']==1):,}, Negatives: {sum(df['is_compatible']==0):,})")
    print(f"Columns    : {list(df.columns)}")
    print("\nFirst 3 rows:")
    print(df.head(3))

if __name__ == "__main__":
    build_dataset()
