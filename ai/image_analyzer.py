#!/usr/bin/env python3
"""
StyleMate AI Image Analyzer

Analyzes clothing photos to auto-detect:
1. Category ("Top", "Bottom", "Full Body", "Footwear", "Outerwear", "Accessory")
2. Garment item type (shirt, jeans, dress, etc.)
3. Dominant colors
4. Suggested styles, occasions, seasons
5. Clean descriptive name

Uses Gemini Vision as primary engine with Pillow dominant color extraction and rule-based fallback.
"""

import os
import sys
import json
import base64
import mimetypes
from pathlib import Path

# Add current directory to path for sibling imports
CURRENT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(CURRENT_DIR))

from color_names import rgb_to_color_name
from category_suggestions import get_suggestions, ITEM_MAPPINGS

VALID_CATEGORIES = {"Top", "Bottom", "Full Body", "Footwear", "Outerwear", "Accessory"}
CATEGORY_NORMALIZE = {
    "top": "Top",
    "upper": "Top",
    "upper body": "Top",
    "upper_body": "Top",
    "shirt": "Top",
    "bottom": "Bottom",
    "lower": "Bottom",
    "lower body": "Bottom",
    "lower_body": "Bottom",
    "pants": "Bottom",
    "trousers": "Bottom",
    "full body": "Full Body",
    "full_body": "Full Body",
    "fullbody": "Full Body",
    "dress": "Full Body",
    "footwear": "Footwear",
    "shoes": "Footwear",
    "outerwear": "Outerwear",
    "jacket": "Outerwear",
    "accessory": "Accessory",
    "accessories": "Accessory",
}


def load_env_variables():
    """
    Finds and loads GEMINI_API_KEY and HUGGINGFACE_API_KEY from environment or .env files.
    """
    candidate_paths = [
        CURRENT_DIR.parent / "stylemate-backend" / ".env",
        CURRENT_DIR / ".env",
        CURRENT_DIR.parent / ".env",
        Path.cwd() / "stylemate-backend" / ".env",
        Path.cwd() / ".env",
    ]

    for env_path in candidate_paths:
        if env_path.exists():
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if not line or line.startswith("#") or "=" not in line:
                            continue
                        key, val = line.split("=", 1)
                        key = key.strip()
                        val = val.strip().strip("\"'")
                        if key not in os.environ and val:
                            os.environ[key] = val
            except Exception:
                pass


def http_post_json(url: str, json_data: dict, headers: dict = None, timeout: int = 15):
    """
    Helper to send HTTP POST with JSON data using either requests or urllib.request.
    """
    if headers is None:
        headers = {}
    headers["Content-Type"] = "application/json"

    try:
        import requests
        resp = requests.post(url, json=json_data, headers=headers, timeout=timeout)
        return resp.status_code, resp.text
    except ImportError:
        import urllib.request
        import urllib.error

        req = urllib.request.Request(
            url,
            data=json.dumps(json_data).encode("utf-8"),
            headers=headers,
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.status, resp.read().decode("utf-8")
        except urllib.error.HTTPError as he:
            return he.code, he.read().decode("utf-8")
        except Exception as e:
            return 500, str(e)


def extract_colors_with_pillow(image_path: str, max_colors: int = 2) -> list:
    """
    Extracts dominant colors from the image using Pillow and maps to canonical color names.
    """
    try:
        from PIL import Image

        img = Image.open(image_path)
        if img.mode != "RGB":
            img = img.convert("RGB")

        # Focus towards the center of garment to minimize plain background influence
        w, h = img.size
        if w > 40 and h > 40:
            crop_box = (int(w * 0.15), int(h * 0.15), int(w * 0.85), int(h * 0.85))
            img = img.crop(crop_box)

        img = img.resize((100, 100))
        quantized = img.quantize(colors=6, method=Image.Quantize.MEDIANCUT)
        palette = quantized.getpalette()
        color_counts = quantized.getcolors()

        if not color_counts or not palette:
            return ["black"]

        color_counts.sort(key=lambda x: x[0], reverse=True)

        named_colors = []
        for count, idx in color_counts:
            r = palette[idx * 3]
            g = palette[idx * 3 + 1]
            b = palette[idx * 3 + 2]
            cname = rgb_to_color_name(r, g, b)
            if cname not in named_colors:
                named_colors.append(cname)
            if len(named_colors) >= max_colors:
                break

        return named_colors if named_colors else ["black"]
    except Exception:
        return ["black"]


def infer_item_from_filename(filename: str) -> str:
    """
    Infers garment item type from file name if possible.
    """
    name_lower = filename.lower().replace("-", " ").replace("_", " ")
    known_items = [
        "t-shirt", "tshirt", "shirt", "jeans", "trousers", "chinos", "shorts",
        "skirt", "dress", "saree", "kurta", "lehenga", "blazer", "jacket",
        "hoodie", "sweater", "coat", "sneakers", "heels", "sandals", "boots",
        "loafers", "watch", "belt", "handbag", "bag", "sunglasses", "scarf", "jumpsuit"
    ]
    for item in known_items:
        if item in name_lower:
            return "t-shirt" if item == "tshirt" else item
    return "shirt"


def normalize_category(raw_category: str, item_type: str) -> str:
    """
    Normalizes category to one of the 6 canonical database values:
    Top, Bottom, Full Body, Footwear, Outerwear, Accessory.
    """
    if raw_category and isinstance(raw_category, str):
        clean_cat = raw_category.strip()
        if clean_cat in VALID_CATEGORIES:
            return clean_cat
        lower_cat = clean_cat.lower()
        if lower_cat in CATEGORY_NORMALIZE:
            return CATEGORY_NORMALIZE[lower_cat]

    # Fall back to category_suggestions slot
    suggestions = get_suggestions(item_type)
    return suggestions.get("slot", "Top")


def analyze_with_gemini(image_path: str, api_key: str):
    """
    Calls Gemini Vision model with image inline data.
    """
    mime_type, _ = mimetypes.guess_type(image_path)
    if not mime_type or not mime_type.startswith("image/"):
        ext = Path(image_path).suffix.lower()
        mime_type = "image/png" if ext == ".png" else "image/webp" if ext == ".webp" else "image/jpeg"

    with open(image_path, "rb") as f:
        img_b64 = base64.b64encode(f.read()).decode("utf-8")

    prompt = """Analyze this clothing item photo for a fashion styling app.
Return ONLY valid JSON matching this schema:
{
  "detected_category": "Top" | "Bottom" | "Full Body" | "Footwear" | "Outerwear" | "Accessory",
  "detected_item": string (e.g. "shirt", "t-shirt", "kurta", "jeans", "trousers", "blazer", "sneakers", "dress"),
  "confidence": float (0.0 to 1.0),
  "detected_colors": [string, string],
  "suggested_styles": [string],
  "suggested_occasions": [string],
  "suggested_seasons": [string],
  "suggested_name": string (e.g. "Beige Silk Kurta", "Classic White T-Shirt", "Black Formal Trousers")
}"""

    models_to_try = [
        "gemini-flash-lite-latest",
        "gemini-2.5-flash",
        "gemini-1.5-flash",
        "gemini-2.0-flash",
    ]

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": img_b64,
                        }
                    },
                ]
            }
        ],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.2,
        },
    }

    last_error = None
    for model in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        try:
            status, text = http_post_json(url, payload, timeout=15)
            if status == 200:
                data = json.loads(text)
                candidate_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                if candidate_text.startswith("```"):
                    lines = candidate_text.splitlines()
                    if lines[0].startswith("```"):
                        lines = lines[1:]
                    if lines and lines[-1].startswith("```"):
                        lines = lines[:-1]
                    candidate_text = "\n".join(lines).strip()
                parsed = json.loads(candidate_text)
                return parsed
            else:
                last_error = f"Gemini HTTP {status}: {text[:150]}"
        except Exception as e:
            last_error = str(e)
            continue

    raise RuntimeError(last_error or "All Gemini models failed")


def analyze_with_huggingface(image_path: str, hf_key: str):
    """
    Calls Hugging Face zero-shot image classification API if available.
    """
    import urllib.request
    import urllib.error

    candidate_labels = [
        "shirt", "t-shirt", "dress", "jeans", "trousers", "jacket", "blazer",
        "hoodie", "saree", "kurta", "lehenga", "skirt", "shorts", "coat",
        "sweater", "sneakers", "heels", "sandals", "boots", "scarf", "watch", "bag"
    ]

    url = "https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32"

    with open(image_path, "rb") as f:
        img_bytes = f.read()

    headers = {"Authorization": f"Bearer {hf_key}"}

    try:
        import requests
        resp = requests.post(
            url,
            headers=headers,
            data=img_bytes,
            params={"candidate_labels": ",".join(candidate_labels)},
            timeout=15,
        )
        if resp.status_code == 200:
            results = resp.json()
            if isinstance(results, list) and len(results) > 0:
                top_prediction = results[0]
                detected_item = top_prediction.get("label", "shirt")
                confidence = float(top_prediction.get("score", 0.8))
                suggestions = get_suggestions(detected_item)
                colors = extract_colors_with_pillow(image_path, max_colors=2)
                color_str = colors[0].capitalize() if colors else ""
                item_str = detected_item.capitalize()
                suggested_name = f"{color_str} {item_str}".strip()

                return {
                    "detected_category": suggestions["slot"],
                    "detected_item": detected_item,
                    "confidence": confidence,
                    "detected_colors": colors,
                    "suggested_styles": suggestions["suggested_styles"],
                    "suggested_occasions": suggestions["suggested_occasions"],
                    "suggested_seasons": suggestions["suggested_seasons"],
                    "suggested_name": suggested_name,
                }
    except Exception as e:
        raise RuntimeError(f"HuggingFace API error: {e}")

    raise RuntimeError("HuggingFace API failed")


def build_fallback_result(image_path: str, error_msg: str = None) -> dict:
    """
    Constructs a robust rule-based result using Pillow color extraction and filename heuristics.
    """
    filename = Path(image_path).name
    detected_item = infer_item_from_filename(filename)
    suggestions = get_suggestions(detected_item)
    colors = extract_colors_with_pillow(image_path, max_colors=2)

    has_filename_match = detected_item in filename.lower().replace("-", " ").replace("_", " ")
    confidence = 0.65 if has_filename_match else 0.45

    color_prefix = colors[0].capitalize() if colors else ""
    suggested_name = f"{color_prefix} {detected_item.capitalize()}".strip()

    res = {
        "detected_category": suggestions["slot"],
        "detected_item": detected_item,
        "detected_name": suggested_name,
        "suggested_name": suggested_name,
        "confidence": confidence,
        "detected_colors": colors,
        "suggested_styles": suggestions["suggested_styles"],
        "suggested_occasions": suggestions["suggested_occasions"],
        "suggested_seasons": suggestions["suggested_seasons"],
        "auto_fill": False,
    }
    if error_msg:
        res["note"] = f"Fallback used: {error_msg}"
    return res


def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "detected_category": "Top",
            "detected_item": "shirt",
            "detected_name": "Clothing Item",
            "suggested_name": "Clothing Item",
            "confidence": 0.0,
            "detected_colors": [],
            "suggested_styles": ["casual"],
            "suggested_occasions": ["casual"],
            "suggested_seasons": ["all"],
            "auto_fill": False,
            "error": "No image path provided",
        }))
        sys.exit(0)

    image_path = sys.argv[1]
    if not os.path.exists(image_path):
        print(json.dumps({
            "detected_category": "Top",
            "detected_item": "shirt",
            "detected_name": "Clothing Item",
            "suggested_name": "Clothing Item",
            "confidence": 0.0,
            "detected_colors": [],
            "suggested_styles": ["casual"],
            "suggested_occasions": ["casual"],
            "suggested_seasons": ["all"],
            "auto_fill": False,
            "error": f"Image file not found: {image_path}",
        }))
        sys.exit(0)

    load_env_variables()
    gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()
    hf_key = os.environ.get("HUGGINGFACE_API_KEY", "").strip()

    result_data = None
    error_detail = None

    # 1. Try Gemini Vision if key exists
    if gemini_key and gemini_key != "your_key_here":
        try:
            gemini_result = analyze_with_gemini(image_path, gemini_key)
            if gemini_result and isinstance(gemini_result, dict):
                result_data = gemini_result
        except Exception as e:
            error_detail = f"Gemini error: {e}"

    # 2. Try Hugging Face if Gemini not available or failed
    if not result_data and hf_key and hf_key != "your_key_here":
        try:
            hf_result = analyze_with_huggingface(image_path, hf_key)
            if hf_result and isinstance(hf_result, dict):
                result_data = hf_result
        except Exception as e:
            error_detail = f"HF error: {e}"

    # 3. If both failed or unavailable, use Pillow & rule fallback
    if not result_data:
        result_data = build_fallback_result(image_path, error_detail)

    # Clean & normalize output schema
    item_name = str(result_data.get("detected_item", "shirt")).strip().lower()
    raw_category = result_data.get("detected_category", "")
    category = normalize_category(raw_category, item_name)

    conf = float(result_data.get("confidence", 0.85))
    conf = max(0.0, min(1.0, conf))

    colors = result_data.get("detected_colors") or []
    if not isinstance(colors, list) or len(colors) == 0:
        colors = extract_colors_with_pillow(image_path, max_colors=2)
    colors = [str(c).strip().lower() for c in colors if str(c).strip()][:3]

    rule_sug = get_suggestions(item_name)
    styles = result_data.get("suggested_styles") or rule_sug["suggested_styles"]
    if not isinstance(styles, list) or len(styles) == 0:
        styles = rule_sug["suggested_styles"]
    styles = [str(s).strip().lower() for s in styles if str(s).strip()]

    occasions = result_data.get("suggested_occasions") or rule_sug["suggested_occasions"]
    if not isinstance(occasions, list) or len(occasions) == 0:
        occasions = rule_sug["suggested_occasions"]
    occasions = [str(o).strip().lower() for o in occasions if str(o).strip()]

    seasons = result_data.get("suggested_seasons") or rule_sug["suggested_seasons"]
    if not isinstance(seasons, list) or len(seasons) == 0:
        seasons = rule_sug["suggested_seasons"]
    seasons = [str(sn).strip().lower() for sn in seasons if str(sn).strip()]

    sug_name = result_data.get("suggested_name") or result_data.get("detected_name")
    if not sug_name:
        c_prefix = colors[0].capitalize() if colors else ""
        sug_name = f"{c_prefix} {item_name.capitalize()}".strip()

    final_output = {
        "detected_category": category,
        "detected_item": item_name,
        "detected_name": sug_name,
        "suggested_name": sug_name,
        "confidence": round(conf, 2),
        "detected_colors": colors,
        "suggested_styles": styles,
        "suggested_occasions": occasions,
        "suggested_seasons": seasons,
        "auto_fill": bool(conf >= 0.70),
    }

    print(json.dumps(final_output, indent=2))


if __name__ == "__main__":
    main()
