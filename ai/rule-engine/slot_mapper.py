"""
Slot Mapper

Maps database categories to internal outfit slots.

Handles all real variants found in the StyleMate database:
  - Mixed case: 'Top', 'top', 'Tops', 'tops'
  - Plural forms: 'Accessories', 'Bottoms', 'Tops'
  - Compound: 'Full Body', 'full body', 'full_body'
  - Aliases: 'Dress', 'Dresses', 'Shoes', 'Jacket', 'Coat', 'linen_shirt', etc.
"""

# Primary lookup — canonical lowercase form → slot
CATEGORY_TO_SLOT = {
    # Top / Upper body
    "top":             "upper_body",
    "tops":            "upper_body",
    "shirt":           "upper_body",
    "shirts":          "upper_body",
    "blouse":          "upper_body",
    "blouses":         "upper_body",
    "t-shirt":         "upper_body",
    "tshirt":          "upper_body",
    "linen_shirt":     "upper_body",
    "linen shirt":     "upper_body",
    "kurti":           "upper_body",
    "kurta":           "upper_body",
    "sweater":         "upper_body",
    "sweatshirt":      "upper_body",
    "hoodie":          "upper_body",

    # Bottom / Lower body
    "bottom":          "lower_body",
    "bottoms":         "lower_body",
    "jeans":           "lower_body",
    "trousers":        "lower_body",
    "skirt":           "lower_body",
    "skirts":          "lower_body",
    "shorts":          "lower_body",
    "pants":           "lower_body",
    "leggings":        "lower_body",
    "palazzos":        "lower_body",
    "chinos":          "lower_body",

    # Full body
    "full body":       "full_body",
    "full_body":       "full_body",
    "dress":           "full_body",
    "dresses":         "full_body",
    "saree":           "full_body",
    "lehenga":         "full_body",
    "jumpsuit":        "full_body",
    "romper":          "full_body",
    "co-ord":          "full_body",
    "coord":           "full_body",
    "co-ords":         "full_body",
    "coords":          "full_body",
    "playsuit":        "full_body",

    # Footwear
    "footwear":        "footwear",
    "shoes":           "footwear",
    "shoe":            "footwear",
    "sneakers":        "footwear",
    "heels":           "footwear",
    "sandals":         "footwear",
    "boots":           "footwear",
    "loafers":         "footwear",
    "flats":           "footwear",
    "slippers":        "footwear",
    "kolhapuri":       "footwear",
    "juttis":          "footwear",

    # Outerwear
    "outerwear":       "outerwear",
    "jacket":          "outerwear",
    "jackets":         "outerwear",
    "coat":            "outerwear",
    "coats":           "outerwear",
    "blazer":          "outerwear",
    "blazers":         "outerwear",
    "cardigan":        "outerwear",
    "shrug":           "outerwear",
    "shrugs":          "outerwear",
    "bomber":          "outerwear",
    "windbreaker":     "outerwear",

    # Accessories
    "accessory":       "accessories",
    "accessories":     "accessories",
    "bag":             "accessories",
    "bags":            "accessories",
    "handbag":         "accessories",
    "clutch":          "accessories",
    "belt":            "accessories",
    "belts":           "accessories",
    "watch":           "accessories",
    "watches":         "accessories",
    "jewelry":         "accessories",
    "jewellery":       "accessories",
    "necklace":        "accessories",
    "earrings":        "accessories",
    "sunglasses":      "accessories",
    "scarf":           "accessories",
    "scarves":         "accessories",
    "hat":             "accessories",
    "cap":             "accessories",
    "caps":            "accessories",
}


def map_category_to_slot(category):
    """
    Converts a database category string to an internal outfit slot name.

    Normalizes the input (lowercase, strips underscores/hyphens to spaces)
    before lookup so that 'linen_shirt', 'Linen-Shirt', 'Linen Shirt' all
    map correctly. Returns None if no matching slot is found.
    """
    if not category:
        return None

    # Normalize: lowercase, replace underscores/hyphens with spaces, strip
    normalized = category.lower().replace("_", " ").replace("-", " ").strip()

    return CATEGORY_TO_SLOT.get(normalized, None)


def add_slots_to_clothes(clothes):
    """
    Adds a 'slot' key to each clothing item based on its category.

    Items whose category cannot be mapped to a known slot receive
    slot=None and will be silently skipped by the outfit generator.
    """
    for item in clothes:
        item["slot"] = map_category_to_slot(item.get("category", ""))

    return clothes
