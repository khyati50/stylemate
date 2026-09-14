"""
Color Name Lookup Table

Maps RGB values to canonical color names using Euclidean distance.
"""

COLOR_MAP = {
    "black":   (20, 20, 20),
    "white":   (245, 245, 245),
    "grey":    (128, 128, 128),
    "navy":    (20, 30, 80),
    "blue":    (30, 100, 200),
    "beige":   (225, 210, 185),
    "brown":   (120, 70, 40),
    "red":     (200, 30, 30),
    "green":   (35, 130, 60),
    "yellow":  (230, 210, 40),
    "orange":  (230, 120, 30),
    "pink":    (235, 140, 170),
    "purple":  (110, 40, 140),
    "maroon":  (128, 20, 30),
    "olive":   (100, 115, 50),
    "mustard": (205, 150, 40),
}


def rgb_to_color_name(r, g=None, b=None) -> str:
    """
    Given an RGB value (either 3 integers or a tuple/list), computes the Euclidean distance
    to each canonical color in COLOR_MAP and returns the closest color name.
    """
    if g is None and b is None and isinstance(r, (tuple, list)):
        r, g, b = r[0], r[1], r[2]

    best_color = "black"
    min_dist = float("inf")

    for color_name, (r0, g0, b0) in COLOR_MAP.items():
        dist = (r - r0) ** 2 + (g - g0) ** 2 + (b - b0) ** 2
        if dist < min_dist:
            min_dist = dist
            best_color = color_name

    return best_color


if __name__ == "__main__":
    test_cases = [
        ((255, 255, 255), "white"),
        ((0, 0, 0), "black"),
        ((10, 25, 75), "navy"),
        ((35, 100, 200), "blue"),
        ((220, 210, 185), "beige"),
        ((120, 70, 40), "brown"),
        ((210, 25, 25), "red"),
        ((35, 140, 65), "green"),
    ]
    all_passed = True
    for rgb, expected in test_cases:
        res = rgb_to_color_name(*rgb)
        passed = res == expected
        if not passed:
            all_passed = False
        print(f"RGB {rgb} -> {res} (expected: {expected}) - {'PASS' if passed else 'FAIL'}")
    if all_passed:
        print("All color tests passed successfully!")
