"""
Fake Wardrobe Generator

Generates realistic synthetic wardrobes for training
the recommendation model.
"""

import random

CLOTHING_CATALOG = [

    # ---------- TOPS ----------

    {
        "name": "Black T-Shirt",
        "category": "Top",
        "colors": ["black"],
        "styles": ["casual", "streetwear"],
        "occasions": ["college", "casual"],
        "seasons": ["summer", "spring"]
    },

    {
        "name": "White Shirt",
        "category": "Top",
        "colors": ["white"],
        "styles": ["formal", "casual"],
        "occasions": ["office", "party"],
        "seasons": ["summer", "spring"]
    },

    {
        "name": "Blue Denim Shirt",
        "category": "Top",
        "colors": ["blue"],
        "styles": ["casual"],
        "occasions": ["college", "casual"],
        "seasons": ["winter", "spring"]
    },

    {
        "name": "Kurta",
        "category": "Top",
        "colors": ["beige"],
        "styles": ["ethnic"],
        "occasions": ["festival", "wedding"],
        "seasons": ["summer"]
    },

    # ---------- BOTTOM ----------

    {
        "name": "Blue Jeans",
        "category": "Bottom",
        "colors": ["blue"],
        "styles": ["casual"],
        "occasions": ["college", "casual"],
        "seasons": ["all"]
    },

    {
        "name": "Black Trouser",
        "category": "Bottom",
        "colors": ["black"],
        "styles": ["formal"],
        "occasions": ["office", "party"],
        "seasons": ["all"]
    },

    {
        "name": "Cargo Pants",
        "category": "Bottom",
        "colors": ["green"],
        "styles": ["streetwear"],
        "occasions": ["casual"],
        "seasons": ["winter", "autumn"]
    },

    # ---------- FULL BODY ----------

    {
        "name": "Black Dress",
        "category": "Full Body",
        "colors": ["black"],
        "styles": ["formal"],
        "occasions": ["party"],
        "seasons": ["summer"]
    },

    {
        "name": "Saree",
        "category": "Full Body",
        "colors": ["red"],
        "styles": ["ethnic"],
        "occasions": ["wedding", "festival"],
        "seasons": ["all"]
    },

    {
        "name": "Jumpsuit",
        "category": "Full Body",
        "colors": ["grey"],
        "styles": ["casual"],
        "occasions": ["casual", "party"],
        "seasons": ["summer"]
    },

    # ---------- FOOTWEAR ----------

    {
        "name": "White Sneakers",
        "category": "Footwear",
        "colors": ["white"],
        "styles": ["casual", "sporty"],
        "occasions": ["college", "casual"],
        "seasons": ["all"]
    },

    {
        "name": "Black Loafers",
        "category": "Footwear",
        "colors": ["black"],
        "styles": ["formal"],
        "occasions": ["office", "party"],
        "seasons": ["all"]
    },

    {
        "name": "Heels",
        "category": "Footwear",
        "colors": ["beige"],
        "styles": ["formal"],
        "occasions": ["party", "wedding"],
        "seasons": ["all"]
    },

    # ---------- OUTERWEAR ----------

    {
        "name": "Denim Jacket",
        "category": "Outerwear",
        "colors": ["blue"],
        "styles": ["casual"],
        "occasions": ["casual"],
        "seasons": ["winter", "autumn"]
    },

    {
        "name": "Black Blazer",
        "category": "Outerwear",
        "colors": ["black"],
        "styles": ["formal"],
        "occasions": ["office", "party"],
        "seasons": ["winter"]
    },

    # ---------- ACCESSORIES ----------

    {
        "name": "Watch",
        "category": "Accessory",
        "colors": ["black"],
        "styles": ["formal", "casual"],
        "occasions": ["all"],
        "seasons": ["all"]
    },

    {
        "name": "Handbag",
        "category": "Accessory",
        "colors": ["beige"],
        "styles": ["casual"],
        "occasions": ["party", "casual"],
        "seasons": ["all"]
    },

    {
        "name": "Sunglasses",
        "category": "Accessory",
        "colors": ["black"],
        "styles": ["casual"],
        "occasions": ["casual"],
        "seasons": ["summer"]
    }
]


def generate_fake_wardrobe():

    wardrobe = []

    for item in CLOTHING_CATALOG:

        if random.random() < 0.75:
            entry = item.copy()
            # ~10% chance an item is in the laundry / unavailable
            entry["is_available"] = random.random() > 0.10
            entry["status"] = "available" if entry["is_available"] else "unavailable"
            wardrobe.append(entry)

    return wardrobe