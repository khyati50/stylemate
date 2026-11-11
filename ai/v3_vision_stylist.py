"""
StyleMate AI — v3 Vision LLM Stylist Service
============================================
Evaluates top candidate outfits using Google Gemini Multimodal Vision.

Analyzes actual garment photographs to assess:
  1. Texture & fabric harmony (detects clashing materials like unlined double-denim)
  2. Silhouette & proportional balance
  3. Real-world weather appropriateness (e.g. thermal warmth for winter)
  4. Curates personalized, actionable styling tips & critiques

Production Architecture:
  - 2-Stage Funnel: Stage 1 (v2 tabular ML) ranks hundreds of combinations in 2ms.
  - Stage 2 (v3 Vision LLM) evaluates only the Top 3 unique candidates.
  - Fault Tolerant: If offline or API fails, automatically falls back to v2.
"""

import os
import json
import base64
import mimetypes
import urllib.request
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

# Paths
BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent
BACKEND_DIR = PROJECT_DIR / "stylemate-backend"
ENV_PATH = BACKEND_DIR / ".env"
UPLOADS_DIR = BACKEND_DIR / "uploads"

# Models to attempt in order of priority (fastest lightweight models first)
GEMINI_MODELS = [
    "gemini-flash-lite-latest",
    "gemini-3.5-flash",
    "gemini-flash-latest",
]


def get_api_key() -> str:
    """Retrieves GEMINI_API_KEY from environment or backend .env file."""
    key = os.environ.get("GEMINI_API_KEY")
    if key and key.strip() and key != "your_gemini_api_key_here":
        return key.strip()

    if ENV_PATH.exists():
        with open(ENV_PATH, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("GEMINI_API_KEY="):
                    val = line.split("=", 1)[1].strip()
                    if val and val != "your_gemini_api_key_here":
                        return val
    return ""


def resolve_image_path(image_url: str) -> Path | None:
    """Resolves local absolute file path for a clothing item's imageUrl."""
    if not image_url or not isinstance(image_url, str):
        return None

    clean_path = image_url.strip()
    if clean_path.startswith("http://") or clean_path.startswith("https://"):
        return None

    # Check 1: Direct backend relative path
    direct = BACKEND_DIR / clean_path
    if direct.is_file():
        return direct

    # Check 2: Filename directly inside uploads/
    filename = Path(clean_path).name
    in_uploads = UPLOADS_DIR / filename
    if in_uploads.is_file():
        return in_uploads

    return None


def encode_image(filepath: Path) -> dict | None:
    """Encodes and compresses an image to max 512px Base64 for fast Gemini API transfer."""
    try:
        from PIL import Image
        import io
        with Image.open(filepath) as img:
            img = img.convert("RGB")
            img.thumbnail((512, 512), Image.Resampling.LANCZOS)
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=80, optimize=True)
            b64_data = base64.b64encode(buf.getvalue()).decode("utf-8")
        return {
            "inline_data": {
                "mime_type": "image/jpeg",
                "data": b64_data,
            }
        }
    except Exception:
        try:
            with open(filepath, "rb") as f:
                b64_data = base64.b64encode(f.read()).decode("utf-8")
            return {
                "inline_data": {
                    "mime_type": "image/jpeg",
                    "data": b64_data,
                }
            }
        except Exception:
            return None


def evaluate_single_outfit_vision(outfit: dict, occasion: str, season: str, temp_c: float, api_key: str) -> dict | None:
    """
    Sends clothing photos of a single candidate outfit to Gemini Vision
    for multi-garment compatibility, texture, and styling evaluation.
    """
    if not api_key:
        return None

    # Collect garments with valid local images
    garments = []
    slots = [
        ("Full Body", outfit.get("full_body")),
        ("Top", outfit.get("upper_body")),
        ("Bottom", outfit.get("lower_body")),
        ("Outerwear", outfit.get("outerwear")),
        ("Footwear", outfit.get("footwear")),
    ]

    for slot_name, item in slots:
        if item and isinstance(item, dict):
            img_path = resolve_image_path(item.get("imageUrl"))
            if img_path:
                garments.append({
                    "slot": slot_name,
                    "name": item.get("name", slot_name),
                    "path": img_path
                })

    # If fewer than 2 items have photos, vision evaluation is not viable
    if len(garments) < 2:
        return None

    is_closet_match = bool(outfit.get("is_closet_best_match"))
    closet_context = ""
    if is_closet_match:
        closet_context = f"""
REAL-WORLD CLOSET STYLING CONTEXT:
The user does not own textbook footwear specifically tagged for '{occasion}'.
We paired this look with the best available footwear ({outfit.get('footwear', {}).get('name', 'shoes')}) in their wardrobe.
- Do NOT reject this outfit solely because the shoes are non-traditional for {occasion}.
- Highlight this high-low pairing positively (e.g. effortless European chic or smart-casual elegance).
- Provide an honest, encouraging stylist explanation in 'closet_pairing_note'.
"""

    prompt = f"""You are an elite personal fashion stylist and image consultant.
The user wants to wear this outfit for:
- Occasion: {occasion or 'Casual'}
- Season: {season or 'All'}
- Temperature: {temp_c}°C
{closet_context}
Attached are the actual photographs of the clothing items in this complete look.
Analyze the images as a cohesive outfit:
1. Fabric & texture harmony (identify materials like satin, twill denim, heavy knit, leather; detect clashing textures like unlined double-denim)
2. Color palette & tonal balance
3. Silhouette & proportional balance
4. Thermal and weather comfort for {temp_c}°C

Respond ONLY in valid JSON matching this schema:
{{
  "compatibility_score": float (between 0.0 and 1.0, where 1.0 is runway perfection),
  "verdict": "APPROVED" | "NEEDS_ADJUSTMENT" | "REJECTED",
  "texture_assessment": string (1-2 sentences on material contrast and fabric interplay),
  "weather_assessment": string (is this outfit thermally suited for {temp_c}°C?),
  "stylist_critique": string (2-3 sentences explaining why this look works or where it clashes),
  "actionable_styling_tip": string (1 concrete styling tip to elevate this specific outfit),
  "is_closet_best_match": bool,
  "closet_pairing_note": string (encouraging stylist note on the pairing, or empty string)
}}"""

    parts = [{"text": prompt}]

    for g in garments:
        encoded = encode_image(g["path"])
        if encoded:
            parts.append({"text": f"\n[Item Slot: {g['slot']} — Name: {g['name']}]"})
            parts.append(encoded)

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.2,
        }
    }

    for model in GEMINI_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                if resp.status == 200:
                    raw_text = resp.read().decode("utf-8")
                    data = json.loads(raw_text)
                    content_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                    parsed = json.loads(content_text)
                    return parsed
        except Exception:
            continue

    return None


def get_heuristic_fallback_notes(outfit: dict, occasion: str, season: str, v2_score: float) -> dict:
    """Generates clean stylist fallback notes when Vision API is offline."""
    has_outer = bool(outfit.get("outerwear"))
    score_pct = int(round(v2_score * 100))

    if v2_score >= 0.60:
        verdict = "APPROVED"
        texture = "Cohesive fabric textures with balanced visual weight."
        critique = f"A polished {occasion or 'everyday'} look. The core garments pair naturally with harmonized styling lines."
        tip = "Add a classic timepiece or structured leather bag to anchor the ensemble."
    elif v2_score >= 0.35:
        verdict = "NEEDS_ADJUSTMENT"
        texture = "Mixed textures that could benefit from clearer focal contrast."
        critique = f"A wearable combination for {season or 'casual'} wear, though color contrast or layering could be refined."
        tip = "Try a partial front tuck or layer a neutral overshirt to refine the silhouette."
    else:
        verdict = "REJECTED"
        texture = "Noticeable style or texture contrast between pieces."
        critique = "These pieces have conflicting design directions and may feel mismatched when worn together."
        tip = "Anchor the look with neutral foundational pieces before introducing statement textures."

    is_closet = bool(outfit.get("is_closet_best_match"))
    closet_note = outfit.get("closet_pairing_reason") if is_closet else None

    return {
        "compatibility_score": round(v2_score, 4),
        "verdict": verdict,
        "texture_assessment": texture,
        "weather_assessment": f"Layering is suited for {season or 'moderate'} conditions." if has_outer else f"Suitable for mild {season or 'everyday'} wear.",
        "stylist_critique": critique,
        "actionable_styling_tip": tip,
        "is_closet_best_match": is_closet,
        "closet_pairing_note": closet_note,
        "source": "v2_heuristic_fallback"
    }


def enrich_outfits_with_v3(
    ranked_outfits: list[dict],
    weather: dict,
    user_preferences: dict,
    max_to_evaluate: int = 2
) -> list[dict]:
    """
    Takes the v2-ranked candidate outfits and enriches the Top N outfits
    with multimodal Gemini Vision styling assessments in parallel.

    Reranks the top candidates by blending the v2 tabular score (30%)
    with the v3 vision compatibility score (70%).
    """
    if not ranked_outfits:
        return []

    api_key = get_api_key()
    occasion = (user_preferences.get("occasion") or "casual").title()
    season = (weather.get("season") or "all").title()
    temp_c = weather.get("temperature", 20)

    top_entries = ranked_outfits[:max_to_evaluate]
    remaining = ranked_outfits[max_to_evaluate:]

    def process_entry(entry):
        outfit = entry["outfit"]
        v2_score = entry["score"]
        is_closet = bool(outfit.get("is_closet_best_match"))

        vision_result = None
        if api_key:
            try:
                vision_result = evaluate_single_outfit_vision(outfit, occasion, season, temp_c, api_key)
            except Exception:
                vision_result = None

        if vision_result and isinstance(vision_result, dict):
            v3_score = float(vision_result.get("compatibility_score", v2_score))
            blended_score = round(v2_score * 0.30 + v3_score * 0.70, 4)

            closet_note = (
                vision_result.get("closet_pairing_note")
                or outfit.get("closet_pairing_reason")
                if is_closet else None
            )

            entry_copy = dict(entry)
            entry_copy["score"] = blended_score
            entry_copy["stylist_notes"] = {
                "compatibility_score": v3_score,
                "verdict": vision_result.get("verdict", "APPROVED"),
                "texture_assessment": vision_result.get("texture_assessment", ""),
                "weather_assessment": vision_result.get("weather_assessment", ""),
                "stylist_critique": vision_result.get("stylist_critique", ""),
                "actionable_styling_tip": vision_result.get("actionable_styling_tip", ""),
                "is_closet_best_match": is_closet,
                "closet_pairing_note": closet_note,
                "model_version": "v3_vision_gemini",
            }
            return entry_copy
        else:
            entry_copy = dict(entry)
            entry_copy["stylist_notes"] = get_heuristic_fallback_notes(outfit, occasion, season, v2_score)
            entry_copy["stylist_notes"]["model_version"] = "v2_polyvore_fallback"
            return entry_copy

    # Execute in parallel threads to minimize latency
    with ThreadPoolExecutor(max_workers=min(max_to_evaluate, 3)) as executor:
        evaluated_top = list(executor.map(process_entry, top_entries))

    # Sort evaluated top candidates by final blended score descending
    evaluated_top.sort(key=lambda x: x["score"], reverse=True)

    # Attach fallback notes to remaining outfits
    formatted_remaining = []
    for entry in remaining:
        entry_copy = dict(entry)
        entry_copy["stylist_notes"] = get_heuristic_fallback_notes(
            entry["outfit"], occasion, season, entry["score"]
        )
        formatted_remaining.append(entry_copy)

    combined = evaluated_top + formatted_remaining

    # Filter out REJECTED outfits so the user is only recommended approved looks
    # or looks with actionable styling adjustments ("NEEDS_ADJUSTMENT")
    wearable_outfits = [
        e for e in combined
        if e.get("stylist_notes", {}).get("verdict") != "REJECTED"
    ]

    # If every outfit was rejected due to a very limited closet, keep the
    # highest-scoring one as a graceful fallback rather than showing an empty screen.
    return wearable_outfits if wearable_outfits else combined[:1]
