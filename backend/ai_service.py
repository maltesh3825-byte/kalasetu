"""
AI Vision & Smart Cataloging Engine
Smart India Hackathon 2026 - SIH26090
Powered by Google Gemini Vision with Fallback Heuristic Engine
"""
import base64
import hashlib
import json
import logging
import re
from pathlib import Path
from typing import Dict, Any, Optional, List
import requests
from PIL import Image
import io
import time

from backend.config import GEMINI_API_KEY, GEMINI_API_URL, GEMINI_MODEL

logger = logging.getLogger("artisan_ai")
logging.basicConfig(level=logging.INFO)

# Canonical Handicraft Categories (aligned with Ministry of Social Justice & Empowerment / TRIFED)
CATEGORIES = [
    "Handloom & Textiles",
    "Pottery & Terracotta",
    "Brass & Metalcraft",
    "Cane & Bamboo",
    "Woodcraft",
    "Tribal Jewelry",
    "Leather Craft",
    "Folk Art & Painting",
    "Stone Carving"
]


def translate_text_with_gemini(text: str, source_language: str = "Kannada", target_language: str = "English") -> str:
    """Translate artisan voice notes without exposing the provider key to the client."""
    if not GEMINI_API_KEY or GEMINI_API_KEY == "YOUR_GEMINI_API_KEY_HERE":
        raise RuntimeError("Translation service is not configured")

    prompt = (
        f"Translate the following artisan product description from {source_language} to {target_language}. "
        "Preserve craft names, materials, techniques and cultural meaning. Return only the translated text.\n\n"
        f"{text.strip()}"
    )
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
    }
    response = requests.post(
        GEMINI_API_URL,
        headers=headers,
        json={
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.1, "maxOutputTokens": 512},
        },
        timeout=20,
    )
    response.raise_for_status()
    data = response.json()
    translated = data["candidates"][0]["content"]["parts"][0]["text"].strip()
    if not translated:
        raise RuntimeError("Translation service returned empty text")
    return translated

def encode_image_to_base64(image_bytes: bytes) -> str:
    """Encodes raw image bytes to base64 string."""
    return base64.b64encode(image_bytes).decode("utf-8")

def detect_mime_type(image_bytes: bytes) -> str:
    """Determine MIME type using PIL or signature header."""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        fmt = (img.format or "JPEG").lower()
        if fmt in ["jpg", "jpeg"]:
            return "image/jpeg"
        elif fmt == "png":
            return "image/png"
        elif fmt == "webp":
            return "image/webp"
        return f"image/{fmt}"
    except Exception:
        return "image/jpeg"

def clean_json_response(raw_text: str) -> Dict[str, Any]:
    """Strip markdown code blocks and parse JSON safely."""
    cleaned = raw_text.strip()
    # Remove markdown ```json and ```
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()
    
    # Extract first JSON object if surrounded by prose
    json_match = re.search(r'(\{[\s\S]*\})', cleaned)
    if json_match:
        cleaned = json_match.group(1)

    return json.loads(cleaned)

def analyze_craft_image_with_gemini(
    image_bytes: bytes,
    artisan_notes: Optional[str] = None,
    artisan_input_price: Optional[float] = None
) -> Dict[str, Any]:
    """
    Main AI Vision analyzer.
    1. Checks if GEMINI_API_KEY is configured.
    2. Calls Gemini Vision API.
    3. If unavailable, gracefully falls back to Heuristic Engine.
    """
    if not GEMINI_API_KEY or GEMINI_API_KEY == "YOUR_GEMINI_API_KEY_HERE":
        logger.warning("No valid GEMINI_API_KEY found. Falling back to Smart Cataloging Engine.")
        return generate_heuristic_craft_catalog(image_bytes, artisan_notes, artisan_input_price, "API Key not configured in .env")

    mime_type = detect_mime_type(image_bytes)
    base64_data = encode_image_to_base64(image_bytes)

    prompt = f"""
You are the AI Virtual Business Manager for rural and marginalized Indian artisans and weavers under the Ministry of Social Justice and Empowerment (MoSJE).
Your mission is to empower low-literacy artisans by analyzing their handmade craft photo and auto-generating an e-commerce catalog entry that commands fair market value.

Context from artisan (if any):
- Artisan Voice/Text Notes: "{artisan_notes or 'None provided'}"
- Artisan Self-Price Idea: "{artisan_input_price or 'Not specified'}"
If the artisan notes are spoken or written in Kannada (or another Indian language), interpret and translate them into natural English before using them in the English catalog title and description.

Analyze the product image with high attention to Indian heritage craftsmanship (handloom, terracotta, metal, bamboo, wood, embroidery, etc.).

Return ONLY a valid JSON object matching this exact schema:
{{
  "category": "Pick exactly one from: {', '.join(CATEGORIES)}",
  "suggested_title": "Concise, SEO-optimized title in English (e.g., 'Hand-Carved Sheesham Wood Elephant Figurine')",
  "tags": ["3 to 5 relevant tags like 'Handmade', 'EcoFriendly', 'BastarArt', 'Terracotta']",
  "description_en": "2-3 sentences. Highlighting traditional craftsmanship, natural materials, authentic cultural technique, and home utility.",
  "description_hi": "A warm, natural Hindi translation of the description in Devanagari script for local and regional reach.",
  "pricing": {{
    "fair_min": 450,
    "fair_max": 750,
    "suggested": 600,
    "justification": "Clear, simple explanation of why this price is fair based on craftsmanship complexity, estimated labor hours, and raw material value."
  }},
  "craft_heritage_story": "A single sentence celebrating the cultural tradition or artisan lineage behind this work.",
  "care_instructions": "One simple sentence advising the buyer on how to care for this handmade product."
}}
"""
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
    }

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": base64_data
                        }
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "topP": 0.8,
            "maxOutputTokens": 2048,
            "responseMimeType": "application/json"
        }
    }

    candidate_models = ["gemini-flash-lite-latest", "gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.6-flash", "gemini-2.5-flash"]
    last_error = ""

    for model_name in candidate_models:
        try:
            model_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
            response = requests.post(
                model_url,
                headers=headers,
                json=payload,
                timeout=25
            )

            if response.status_code == 200:
                res_json = response.json()
                candidates = res_json.get("candidates", [])
                if candidates:
                    content_parts = candidates[0].get("content", {}).get("parts", [])
                    if content_parts:
                        raw_text = content_parts[0].get("text", "")
                        parsed = clean_json_response(raw_text)
                        parsed["is_ai_simulated"] = False
                        parsed["ai_engine"] = f"Google Gemini ({model_name} Vision)"
                        return parsed
                raise ValueError("Empty candidate response from Gemini API")
            else:
                last_error = f"HTTP {response.status_code}: {response.text[:120]}"
                logger.warning(f"Gemini API ({model_name}) returned {last_error}")
        except Exception as e:
            last_error = str(e)
            logger.warning(f"Error calling Gemini Vision model {model_name}: {e}")

    logger.error(f"All Gemini Vision models exhausted: {last_error}")
    return generate_heuristic_craft_catalog(
        image_bytes, artisan_notes, artisan_input_price,
        f"Gemini Vision fallback ({last_error})"
    )

def generate_heuristic_craft_catalog(
    image_bytes: bytes,
    artisan_notes: Optional[str] = None,
    artisan_input_price: Optional[float] = None,
    fallback_reason: str = ""
) -> Dict[str, Any]:
    """
    Intelligent heuristic fallback analyzer.
    Ensures that during hackathon judging or offline demos, the app remains 100% functional.
    Derives category, tags, pricing, and descriptions using keyword recognition and visual aspect analysis.
    """
    notes = (artisan_notes or "").lower()
    # Keep offline/fallback listings distinct even when no artisan notes or
    # Gemini key are available. The image itself is part of the catalog input.
    image_digest = hashlib.sha256(image_bytes).hexdigest()[:6].upper()
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        width, height = image.size
        sample = image.resize((1, 1)).getpixel((0, 0))
        if sample[0] >= sample[1] + 25 and sample[0] >= sample[2] + 25:
            palette = "warm red and earthy"
        elif sample[1] >= sample[0] + 20 and sample[1] >= sample[2] + 10:
            palette = "natural green"
        elif max(sample) - min(sample) < 22:
            palette = "neutral-toned"
        else:
            palette = "multi-coloured"
        visual_note = f"Photograph profile {image_digest}: {palette} palette, {width}x{height} framing."
    except Exception:
        visual_note = f"Photograph profile {image_digest}: individually captured artisan piece."
    
    # Heuristic keyword matching
    if any(k in notes for k in ["sari", "saree", "kurta", "cloth", "textile", "weave", "thread", "cotton", "silk", "dupatta", "embroidery", "कपड़ा", "साड़ी"]):
        category = "Handloom & Textiles"
        title = f"Artisan Handwoven Heritage Textile {image_digest}"
        tags = ["Handloom", "Organic Cotton", "Traditional Weave", "Ethnic", "Artisan Made"]
        desc_en = f"Masterfully woven on traditional pit looms by heritage artisans. Made with pure natural fibers that offer exceptional comfort and longevity. {visual_note}"
        desc_hi = "पारंपरिक करघे पर हस्तनिर्मित शुद्ध प्राकृतिक धागों से बुना गया वस्त्र। यह आरामदायक, पर्यावरण-अनुकूल और टिकाऊ है।"
        suggested = artisan_input_price if artisan_input_price else 1250
        min_p = round(suggested * 0.85)
        max_p = round(suggested * 1.30)
        justification = "Pricing covers 16-20 hours of manual loom warping and weft insertion, natural dye extraction, and fair artisan wage."
        story = "Preserves the ancient weaving traditions passed down across four generations of village weavers."
        care = "Hand wash gently in cold water with mild organic detergent and dry in shade."

    elif any(k in notes for k in ["clay", "pot", "terracotta", "surahi", "diya", "pitcher", "ceramic", "मिट्टी", "बर्तन", "घड़ा"]):
        category = "Pottery & Terracotta"
        title = f"Handcrafted Terracotta Clay Artefact {image_digest}"
        tags = ["Terracotta", "Natural Clay", "Eco-Friendly", "Handmade", "Home Decor"]
        desc_en = f"Handcrafted on a traditional potter's wheel using natural riverbed clay and baked in open wood kilns. Naturally porous and chemical-free. {visual_note}"
        desc_hi = "पारंपरिक कुम्हार के चाक पर शुद्ध नदी की मिट्टी से बना हस्तनिर्मित उत्पाद। पूरी तरह प्राकृतिक, रसायन मुक्त और पर्यावरण अनुकूल।"
        suggested = artisan_input_price if artisan_input_price else 550
        min_p = round(suggested * 0.80)
        max_p = round(suggested * 1.35)
        justification = "Reflects artisanal clay refinement, manual wheel throwing, solar drying, and traditional firewood firing."
        story = "Crafted by generational potters upholding the sacred Vedic terracotta arts of rural India."
        care = "Clean with clean water and soft sponge; avoid harsh chemical detergents."

    elif any(k in notes for k in ["brass", "metal", "dhokra", "bronze", "copper", "पीतल", "धातु"]):
        category = "Brass & Metalcraft"
        title = f"Tribal Bell-Metal Heritage Figurine {image_digest}"
        tags = ["Dhokra", "Brass Craft", "Tribal Art", "Heritage", "Lost Wax"]
        desc_en = f"Created using the ancient 4,000-year-old lost-wax casting technique. Every piece is unique, featuring rustic geometric tribal engravings. {visual_note}"
        desc_hi = "प्राचीन लॉस्ट-वैक्स धातु ढलाई तकनीक से जनजातीय कारीगरों द्वारा हस्तनिर्मित अनूठी कृति। प्रत्येक वस्तु अपने आप में विशिष्ट है।"
        suggested = artisan_input_price if artisan_input_price else 1650
        min_p = round(suggested * 0.85)
        max_p = round(suggested * 1.25)
        justification = "High metal density, multiple stages of clay modeling, wax threading, furnace smelting, and fine manual chiseling."
        story = "Rooted in the timeless Harappan metal-crafting lineage of central Indian tribal heartlands."
        care = "Wipe with a dry cotton cloth; apply natural brass polish sparingly if extra shine is desired."

    elif any(k in notes for k in ["bamboo", "cane", "basket", "tokri", "बांस", "टोकरी"]):
        category = "Cane & Bamboo"
        title = f"Artisanal Woven Bamboo Utility Ware {image_digest}"
        tags = ["Bamboo Craft", "Zero Plastic", "Sustainable", "Handwoven", "Eco Storage"]
        desc_en = f"Splinted and hand-woven from seasoned natural bamboo. Lightweight, high tensile strength, and 100% biodegradable. {visual_note}"
        desc_hi = "प्राकृतिक बांस की तीलियों से हाथ से बुनी गई टिकाऊ टोकरी। हल्की, मजबूत और प्लास्टिक मुक्त जीवनशैली के लिए उत्तम।"
        suggested = artisan_input_price if artisan_input_price else 680
        min_p = round(suggested * 0.80)
        max_p = round(suggested * 1.30)
        justification = "Includes manual forest bamboo harvesting, seasoning, thin splint peeling, and intricate multi-strand weaving."
        story = "Celebrates the indigenous sustainable forest craftsmanship of Northeast and Eastern India."
        care = "Keep in dry, aerated conditions; wipe clean with a slightly damp cloth."

    elif any(k in notes for k in ["wood", "toy", "carving", "sheesham", "teak", "लकड़ी", "खिलौना"]):
        category = "Woodcraft"
        title = f"Hand-Carved Artisan Wooden Craft {image_digest}"
        tags = ["Woodcraft", "Natural Polish", "Hand Carved", "Traditional", "GI Craft"]
        desc_en = f"Handcrafted from sustainably sourced seasoned timber with smooth lacquer finish and child-safe organic tints. {visual_note}"
        desc_hi = "प्राकृतिक लकड़ी पर नक्काशी कर सुरक्षित वनस्पति रंगों और लाख की पॉलिश से तैयार किया गया सुंदर हस्तशिल्प।"
        suggested = artisan_input_price if artisan_input_price else 750
        min_p = round(suggested * 0.80)
        max_p = round(suggested * 1.25)
        justification = "Hand-lathe shaping, natural vegetal pigment burnishing, and safe lacquer glossing."
        story = "Carries forward historical timber carving legacies recognized under India's Geographical Indication (GI)."
        care = "Avoid prolonged direct water exposure; polish occasionally with a drop of coconut oil."

    else:
        # Default smart handicraft preset
        category = "Folk Art & Painting"
        title = f"Authentic Handcrafted Folk Art Creation {image_digest}"
        tags = ["Folk Art", "Handmade", "Cultural Heritage", "Indigenous", "Artisan Direct"]
        desc_en = f"Exquisitely hand-crafted by indigenous artisans using traditional techniques and natural pigments. Celebrates rich cultural folklore. {visual_note}"
        desc_hi = "पारंपरिक तकनीकों और प्राकृतिक रंगों का उपयोग करके स्थानीय कारीगरों द्वारा हाथ से बनाई गई अनूठी कलाकृति।"
        suggested = artisan_input_price if artisan_input_price else 850
        min_p = round(suggested * 0.80)
        max_p = round(suggested * 1.30)
        justification = "Estimated 8 to 12 hours of specialized manual craftsmanship, locally sourced raw materials, and fair living wage."
        story = "Represents indigenous craft traditions promoted by the Ministry of Social Justice and Empowerment."
        care = "Handle with care, keep away from dampness and direct harsh sunlight."

    desc_hi = f"{desc_hi} चित्र पहचान: {image_digest}।"

    return {
        "category": category,
        "suggested_title": title,
        "tags": tags,
        "description_en": desc_en,
        "description_hi": desc_hi,
        "pricing": {
            "fair_min": min_p,
            "fair_max": max_p,
            "suggested": suggested,
            "justification": justification
        },
        "craft_heritage_story": story,
        "care_instructions": care,
        "is_ai_simulated": True,
        "ai_engine": "Smart Cataloging Heuristic Engine (SIH Studio)",
        "fallback_note": fallback_reason
    }


def generate_institutional_rfq_ai(
    craft_hint: str = "",
    category: Optional[str] = None,
    target_buyer: Optional[str] = None,
    image_bytes: Optional[bytes] = None
) -> Dict[str, Any]:
    """
    AI Generator for Institutional & Bulk RFQ Procurement Packages.
    Analyzes craft prompt/image and auto-fills formal institutional listings:
    product title, HSN, GST, institutional pitch, packaging/customization specs,
    and suggested wholesale price/lead time.
    """
    hsn_presets = {
        "Handloom & Textiles": {
            "hsn": "5208", "gst": "5%",
            "title": "Pure Handloom Chanderi / Khadi Institutional Gift Stoles (Pack of 50)",
            "desc": "Master weaver handloom fabric woven from natural certified cotton and silk yarns. Breathable, AZO-free skin-friendly natural dyes, ideal for institutional conferences, dignitary shawls, and corporate felicitations.",
            "pack": "Individual recycled handmade paper sleeves with gold foil embossing option. Custom woven institutional logo tags available on minimum order.",
            "qa": "Handloom Mark & MoSJE artisan cluster certified; color-fastness laboratory tested.",
            "price": 380, "lead": "12-15 working days",
            "tags": ["Handloom", "NaturalSilk", "TussarWeave", "GeMEligible", "CorporateShawl"]
        },
        "Pottery & Terracotta": {
            "hsn": "6912", "gst": "12%",
            "title": "Artisanal Terracotta Tableware & Kulhar Banquet Set",
            "desc": "Kiln-fired earthenware crafted from purified alluvial river clay. Completely lead-free, microwave safe, and 100% biodegradable. Perfect for eco-friendly hospitality, institutional cafeterias, and cultural events.",
            "pack": "Biodegradable corrugated partitions with shredded straw cushioning. Customized stamped emblem on base available.",
            "qa": "100% non-toxic, food-grade verified, pre-dispatch thermal shock tested.",
            "price": 120, "lead": "10-14 working days",
            "tags": ["Terracotta", "ClayCraft", "EcoFriendly", "LeadFree", "Hospitality"]
        },
        "Brass & Metalcraft": {
            "hsn": "7419", "gst": "12%",
            "title": "Lost-Wax Cast Dhokra Brass Heritage Memento & Desk Stand",
            "desc": "Ancient bell-metal casting handcrafted by indigenous metalsmiths. Uniquely antiqued patina celebrating tribal heritage. Ideal for prestigious government awards, corporate summits, and cultural gifts.",
            "pack": "Velvet-lined rigid gift box with magnetic catch. Optional laser-engraved institutional brass nameplate.",
            "qa": "Solid virgin brass/bell-metal alloy; hand-polished with microcrystalline protective wax.",
            "price": 550, "lead": "15-20 working days",
            "tags": ["DhokraArt", "BellMetal", "TribalHeritage", "Memento", "GeMEligible"]
        },
        "Woodcraft": {
            "hsn": "4420", "gst": "12%",
            "title": "Hand-Carved Sheesham Wood Desk Organizer & Corporate Gift Caddy",
            "desc": "Carved from sustainably seasoned hardwood with natural grain wax finish. Functional compartments for executive stationery and tablets. Premium institutional memento for executive gifting.",
            "pack": "Individual kraft paper gift carton with eco-friendly protective sleeves. Laser engraving of organization logo on front panel.",
            "qa": "Moisture-content below 10% to prevent warping; non-toxic natural beeswax polish.",
            "price": 420, "lead": "14-18 working days",
            "tags": ["SheeshamWood", "HandCarved", "DeskOrganizer", "CorporateGifting", "MoSJE"]
        },
        "Cane & Bamboo": {
            "hsn": "4602", "gst": "5%",
            "title": "Hand-Woven Treated Bamboo Executive Folder & Conference Kit",
            "desc": "Ultra-lightweight indigenous bamboo weave treated against moisture and borers. Clean minimalist finish designed for eco-conscious symposiums and corporate kits.",
            "pack": "Flat-pack bundles of 25 with eco-twine wrap. Custom screen-printed branding on inner flap.",
            "qa": "Non-chemical borax treatment; splinter-free fine edge burnishing.",
            "price": 280, "lead": "10-12 working days",
            "tags": ["BambooCraft", "EcoStationery", "HandWoven", "Sustainable", "ConferenceKit"]
        },
        "Folk Art & Painting": {
            "hsn": "9701", "gst": "12%",
            "title": "Framed Authentic Madhubani / Warli Folk Art Diplomatic Keepsake",
            "desc": "Hand-painted by certified master artisans on handmade acid-free paper using natural mineral and vegetal pigments. Celebrates indigenous Indian living traditions.",
            "pack": "Corner-cushioned wooden frame with shatter-proof acrylic and gift envelope with artisan bio card.",
            "qa": "Original hand-rendered artwork; authenticated MoSJE artisan signoff.",
            "price": 650, "lead": "15-20 working days",
            "tags": ["Madhubani", "FolkPainting", "NaturalPigments", "HandmadePaper", "CulturalGift"]
        }
    }

    selected_category = category if category in hsn_presets else "Brass & Metalcraft"
    for cat_name in hsn_presets:
        if cat_name.lower() in (craft_hint + " " + (category or "")).lower():
            selected_category = cat_name
            break

    preset = hsn_presets[selected_category]

    if GEMINI_API_KEY and GEMINI_API_KEY != "YOUR_GEMINI_API_KEY_HERE":
        prompt = f"""
You are the Senior Institutional Procurement Manager for rural Indian artisans under the Ministry of Social Justice and Empowerment (MoSJE).
An artisan wants to offer their craft in bulk for institutional procurement (e.g., Government GeM tenders, Corporate Gifting, TRIFED, or Retail Chains).

Artisan Input / Craft details: "{craft_hint or 'Traditional handmade craft'}"
Preferred Category: "{category or 'Auto-detect'}"
Target Buyer: "{target_buyer or 'Government & Corporate Procurement'}"

CRITICAL INSTRUCTIONS FOR VISUAL ANALYSIS:
If an image of the craft is provided, inspect the visual craft style, medium, and materials shown in the photo.
Accurately identify the true craft category (e.g., Folk Art & Painting, Pottery & Terracotta, Brass & Metalcraft, Cane & Bamboo, Woodcraft, Handloom & Textiles).
Do NOT assume Handloom or Textiles unless the image actually shows handloom fabric!
If the photo depicts a painting (e.g., Madhubani, Warli, Pattachitra, canvas, or paper painting), you MUST classify it as "Folk Art & Painting", suggest HSN "9701", and detail the painting materials, pigments, and protective packaging.

Analyze this craft and output a high-standard, professional institutional procurement listing that will appeal to corporate procurement heads and government tender committees.

Return ONLY a valid JSON object matching this schema:
{{
  "product_name": "Professional, formal procurement title in English (e.g., 'Handcrafted Authentic Folk Art Painting (Archival Mount)')",
  "category": "Pick exact match: Handloom & Textiles, Pottery & Terracotta, Brass & Metalcraft, Cane & Bamboo, Woodcraft, Folk Art & Painting",
  "hsn_code": "Realistic 4 or 8 digit Indian HSN code (e.g., 9701 for paintings, 6912 for terracotta, 7419 for brass, 5208 for handloom, 4420 for wood, 4602 for cane/bamboo)",
  "gst_rate": "5% or 12%",
  "institutional_description": "2-3 sentences of formal procurement copy highlighting craftsmanship, material purity, cultural authenticity, and utility.",
  "packaging_and_customization": "Detailed specification of packaging (e.g., individual kraft gift box) and custom branding options (e.g., corporate logo engraving, artisan story card).",
  "quality_assurance": "Quality standard declaration (e.g., MoSJE verified, lead-free, batch quality testing).",
  "suggested_unit_price": 450,
  "suggested_lead_time": "12-15 working days",
  "tags": ["Handcrafted", "HeritageCraft", "GeMEligible", "BulkGifting", "EcoFriendly"]
}}
"""
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY,
        }
        parts = [{"text": prompt}]
        if image_bytes:
            mime_type = detect_mime_type(image_bytes)
            parts.append({
                "inline_data": {
                    "mime_type": mime_type,
                    "data": encode_image_to_base64(image_bytes)
                }
            })

        gen_config = {
            "temperature": 0.2,
            "maxOutputTokens": 2048,
            "responseMimeType": "application/json",
        }

        candidate_rfq_models = ["gemini-flash-lite-latest", "gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.6-flash", "gemini-2.5-flash"]
        for model_name in candidate_rfq_models:
            try:
                model_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
                resp = requests.post(
                    model_url,
                    headers=headers,
                    json={
                        "contents": [{"parts": parts}],
                        "generationConfig": gen_config
                    },
                    timeout=22
                )
                if resp.status_code == 200:
                    raw_json = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
                    parsed = clean_json_response(raw_json)
                    parsed["product_category"] = parsed.get("category", selected_category)
                    desc = parsed.get("institutional_description", "")
                    pack = parsed.get("packaging_and_customization", "")
                    qa = parsed.get("quality_assurance", "")
                    specs = []
                    if pack: specs.append(f"Packaging: {pack}")
                    if qa: specs.append(f"Quality Assurance: {qa}")
                    parsed["requirements"] = f"{desc}\n\n" + "\n• ".join(["Specifications:"] + specs) if specs else desc
                    parsed["lead_time"] = parsed.get("suggested_lead_time", "12-15 working days")
                    parsed["tags"] = parsed.get("tags") or preset.get("tags", ["Handcrafted", "HeritageCraft", "GeMEligible"])
                    parsed["ai_engine"] = f"Google Gemini ({model_name} Institutional Intelligence)"
                    parsed["is_ai_simulated"] = False
                    return parsed
            except Exception as e:
                logger.warning(f"Gemini RFQ generation ({model_name}) fallback: {e}")

    # Fallback to intelligent heuristic preset
    derived_title = craft_hint.strip() if len(craft_hint.strip()) > 5 else preset["title"]
    desc = preset["desc"]
    pack = preset["pack"]
    qa = preset["qa"]
    return {
        "product_name": derived_title if "Pack" in derived_title or "Set" in derived_title else f"{derived_title} (Institutional Batch)",
        "category": selected_category,
        "product_category": selected_category,
        "hsn_code": preset["hsn"],
        "gst_rate": preset["gst"],
        "institutional_description": desc,
        "packaging_and_customization": pack,
        "quality_assurance": qa,
        "requirements": f"{desc}\n\nSpecifications:\n• Packaging: {pack}\n• Quality Assurance: {qa}",
        "suggested_unit_price": preset["price"],
        "suggested_lead_time": preset["lead"],
        "lead_time": preset["lead"],
        "tags": preset.get("tags", ["Handcrafted", "HeritageCraft", "GeMEligible"]),
        "ai_engine": "Smart Institutional Cataloging Engine (Heuristic)",
        "is_ai_simulated": True
    }


# =========================================================================
# 💬 KALASETU AI ASSISTANT (GEMINI CONVERSATIONAL CHATBOT WITH PRODUCT CATALOG)
# =========================================================================

_CATALOG_CACHE: Dict[str, Any] = {"text": "", "expires_at": 0}


def get_catalog_context_for_ai() -> str:
    """
    Fetch all active published products from KalaSetu database
    and summarize them into structured context for Gemini.
    Cached for 300 seconds (5 min) to optimize DB query frequency.
    """
    now = time.time()
    if _CATALOG_CACHE["text"] and now < _CATALOG_CACHE["expires_at"]:
        return _CATALOG_CACHE["text"]

    try:
        from backend.database import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, name, category, price, artisan_name, artisan_location, description_en, tags "
            "FROM products WHERE quantity > 0 ORDER BY id ASC LIMIT 50"
        )
        rows = cursor.fetchall()
        conn.close()

        if not rows:
            return "No products currently listed in catalog."

        lines = ["KALASETU VERIFIED HANDICRAFT PRODUCT CATALOG:"]
        for r in rows:
            p = dict(r)
            tags_val = p.get("tags") or ""
            if isinstance(tags_val, (list, tuple)):
                tags_str = ", ".join(str(t) for t in tags_val)
            else:
                tags_str = str(tags_val)
            lines.append(
                f"- Product #{p.get('id')}: \"{p.get('name')}\"\n"
                f"  Category: {p.get('category')} | Price: Rs.{p.get('price')} | Artisan: {p.get('artisan_name')}, {p.get('artisan_location')}\n"
                f"  Description: {p.get('description_en')}\n"
                f"  Tags: {tags_str}"
            )
        catalog_text = "\n\n".join(lines)
        _CATALOG_CACHE["text"] = catalog_text
        _CATALOG_CACHE["expires_at"] = now + 300  # 5-minute cache
        return catalog_text
    except Exception as e:
        logger.warning(f"Error fetching catalog context: {e}")
        return "KalaSetu authentic crafts: Silk Sarees, Terracotta Pottery, Dhokra Brassware, Wooden Toys & Carvings, Folk Paintings."


def build_kalasetu_system_prompt() -> str:
    """Constructs dynamic Gemini system instructions including product catalog and strict domain guardrails."""
    catalog_context = get_catalog_context_for_ai()
    return f"""You are KalaSetu Assistant (कलासेतु सहायक), the dedicated AI assistant for the KalaSetu platform — an AI-driven initiative for marginalized Indian artisans, weavers, and craft buyers under MoSJE (SIH26090).

CRITICAL DOMAIN & RELEVANCE POLICY:
1. You ONLY answer queries related to:
   - KalaSetu's authentic Indian handicraft products, descriptions, prices, materials, artisan backgrounds, and origins.
   - Craft making techniques and traditional Indian arts (handloom weaving, terracotta pottery, Bastar Dhokra lost-wax casting, wood carving, folk painting).
   - KalaSetu platform features: AI Studio (how to photograph and analyze crafts with multimodal AI to auto-generate bilingual titles, descriptions, and fair prices), Buyer Marketplace, and Institutional Bulk Procurement (RFQs).
   - Fair craft pricing calculation formulas and artisan economics.
   - Government artisan welfare schemes (PM Vishwakarma Scheme, MoSJE subsidies, Pehchan Artisan Card, GeM portal).

2. UNRELATED QUERIES STRICTLY FORBIDDEN:
   If the user asks ANY question unrelated to KalaSetu, our products, crafts, pricing, artisan schemes, or platform services (for example: software coding, generic math, movie trivia, sports, stock market, world history, politics, unrelated general knowledge), you MUST REFUSE and answer strictly with:
   "Please ask related queries only."
   (Or in Hindi if the user asked in Hindi: "कृपया केवल कलासेतु उत्पादों और हस्तशिल्प से संबंधित प्रश्न ही पूछें। / Please ask related queries only.")
   Do NOT answer unrelated queries under any circumstances.

KALASETU PRODUCT CATALOG REFERENCE:
When answering questions about available items, recommendations, prices, craft materials, care tips, or artisan stories, REFER DIRECTLY to our verified product catalog below:

{catalog_context}

HOW USERS USE KALASETU FEATURES:
- AI Studio Analysis: If the user asks how to analyze or catalog with AI:
  1. Click on the 'Artisan Studio' tab in KalaSetu.
  2. Upload an image of the handmade craft.
  3. Speak or type details in your mother tongue.
  4. Click 'Analyze with AI Studio'. Gemini Vision will automatically detect craft category, materials, generate bilingual English/Hindi product descriptions, suggest tags, and calculate fair retail pricing!
- Fair Pricing: Fair Price = (Raw Materials + [Crafting Hours × Fair Hourly Wage] + Packaging) × 1.20 (20% Fair Profit Margin).
- PM Vishwakarma: Collateral-free loans up to ₹3 Lakh at 5%, ₹15,000 toolkit voucher, ₹500/day training stipend, Pehchan card.
- Bulk RFQ: Use the Institutional tab to generate B2B orders with HSN codes and GST invoices.

TONE & STYLE:
- Warm, respectful, helpful, and concise.
- Use clean formatting with bullet points and tasteful emojis.
- Match the language of the user (English, Hindi, Kannada, Tamil, etc.)."""


def generate_heuristic_chat_response(last_user_message: str, language: str = "en") -> str:
    """Intelligent fallback response checking catalog and domain rules when offline."""
    msg = (last_user_message or "").lower().strip()

    # Domain check for unrelated queries
    unrelated_keywords = [
        "code", "python", "javascript", "html", "css", "sql", "bug", "program",
        "movie", "actor", "actress", "cinema", "cricket", "football", "world cup",
        "stock", "crypto", "bitcoin", "weather", "capital of", "president", "prime minister of",
        "math", "calculate 2", "solve", "essay", "physics", "chemistry"
    ]
    if any(k in msg for k in unrelated_keywords):
        return "Please ask related queries only."

    if any(k in msg for k in ["analyze", "analysis", "ai studio", "how to use", "how to analyze", "स्कैन", "विश्लेषण"]):
        return (
            "✨ **How to Analyze Your Craft with KalaSetu AI**\n\n"
            "1. Switch to the **Artisan Studio** tab.\n"
            "2. Upload a clear photograph of your handmade craft.\n"
            "3. Speak or type details in your mother tongue.\n"
            "4. Click **'Analyze with AI Studio'** — Gemini Vision will automatically detect the craft category, materials, generate bilingual English & Hindi descriptions, suggest tags, and calculate fair pricing!"
        )

    if any(k in msg for k in ["saree", "silk", "handloom", "साड़ी", "सिल्क"]):
        return (
            "🧵 **KalaSetu Handloom Silk Sarees**\n\n"
            "• **Natural Indigo Bhagalpur Tussar Silk Saree** (₹3,450) by Manjula Ansari, Bhagalpur, Bihar — Pure handloom wild silk hand-dyed with organic indigo.\n"
            "• **Traditional Purple Kanchi Silk Saree with Golden Zari** (₹6,000) by Rukmini, Mysore — Festive pure silk adorned with elephant and peacock motifs."
        )

    if any(k in msg for k in ["pottery", "terracotta", "planter", "pot", "बर्तन", "मिट्टी"]):
        return (
            "🏺 **KalaSetu Pottery & Terracotta Collection**\n\n"
            "• **Turquoise Blue Floral Painted Ceramic Planter Pot** (₹680) — Glazed ceramic with drainage hole.\n"
            "• **Khurja Hand-Painted Blue Pottery Tea Set** (₹1,250) — Ceramic teapot with 4 matching cups.\n"
            "• **Hand-Painted Tribal Dot Art Clay Planter** (₹490) — Traditional terracotta with earthen breathability."
        )

    if any(k in msg for k in ["dhokra", "metal", "brass", "bull", "ढोकरा", "धातु"]):
        return (
            "🐂 **Bastar Lost-Wax Dhokra Bell Metal Bull** (₹2,100)\n\n"
            "Handcrafted by Suresh Baghel in Bastar, Chhattisgarh using the 4,000-year-old lost-wax casting technique with non-ferrous brass and bell metal alloy."
        )

    if any(k in msg for k in ["wood", "wooden", "elephant", "लकड़ी", "हाथी"]):
        return (
            "🐘 **Traditional Hand-Carved Wooden Elephant Sculpture** (₹950)\n\n"
            "Carved from single-block seasoned Sheesham wood by master artisan Ramesh Sharma in Saharanpur, Uttar Pradesh with traditional floral jaali fretwork."
        )

    if any(k in msg for k in ["price", "pricing", "cost", "rate", "मूल्य", "कीमत", "दाम"]):
        return (
            "💰 **KalaSetu Fair Pricing Guidance**\n\n"
            "• **Formula**: `Fair Price = (Raw Materials + [Crafting Hours × Fair Hourly Wage] + Packaging) × 1.20 (20% Profit Margin)`\n"
            "• Never sell below your raw material cost and labor time.\n"
            "• KalaSetu's AI Studio auto-calculates regional fair prices upon photo upload!"
        )

    if any(k in msg for k in ["vishwakarma", "scheme", "loan", "subsidy", "योजना", "विश्वकर्मा"]):
        return (
            "🏛️ **PM Vishwakarma Scheme Benefits**\n\n"
            "• Collateral-free loans up to **₹3,00,000** at 5% interest (Tranche 1: ₹1 Lakh, Tranche 2: ₹2 Lakh).\n"
            "• **₹15,000 modern toolkit voucher**.\n"
            "• Free 5–7 days skill training with a **₹500/day stipend** and Pehchan ID card."
        )

    return (
        "🙏 **Namaste! I am KalaSetu Assistant (कलासेतु सहायक)**.\n\n"
        "I can help you explore our verified handcrafted products, artisan stories, fair pricing, and AI Studio cataloging.\n\n"
        "Ask me about any craft, product details, or how to analyze your crafts with AI!"
    )


def chat_with_gemini(
    messages: List[Dict[str, str]],
    language: str = "en"
) -> Dict[str, Any]:
    """
    Conversational AI Chatbot powered by Google Gemini API.
    Injects KalaSetu product descriptions and strictly enforces domain relevance.
    Falls back across fast candidate models to prevent 429 quota exhaustion.
    """
    if not messages:
        return {
            "reply": generate_heuristic_chat_response("", language),
            "engine": "KalaSetu Assistant (Heuristic)",
            "is_ai_simulated": True
        }

    # Extract the last user question
    last_user_msg = ""
    for m in reversed(messages):
        if m.get("role") in ("user", "human"):
            last_user_msg = m.get("content", "")
            break
    if not last_user_msg and messages:
        last_user_msg = messages[-1].get("content", "")

    # Check for Gemini API key
    if not GEMINI_API_KEY or GEMINI_API_KEY == "YOUR_GEMINI_API_KEY_HERE":
        logger.info("Gemini API key not configured. Using KalaSetu heuristic chat assistant.")
        return {
            "reply": generate_heuristic_chat_response(last_user_msg, language),
            "engine": "KalaSetu Assistant (Offline / Heuristic)",
            "is_ai_simulated": True
        }

    # Build formatted conversation turns alternating between user and model
    formatted_contents = []
    current_role = None
    accumulated_parts = []

    for msg in messages:
        role = "user" if msg.get("role") in ("user", "human") else "model"
        text = str(msg.get("content", "")).strip()
        if not text:
            continue

        if role == current_role:
            accumulated_parts.append(text)
        else:
            if current_role is not None and accumulated_parts:
                formatted_contents.append({
                    "role": current_role,
                    "parts": [{"text": "\n\n".join(accumulated_parts)}]
                })
            current_role = role
            accumulated_parts = [text]

    if current_role is not None and accumulated_parts:
        formatted_contents.append({
            "role": current_role,
            "parts": [{"text": "\n\n".join(accumulated_parts)}]
        })

    # Gemini API requires the first turn to be 'user'
    while formatted_contents and formatted_contents[0]["role"] != "user":
        formatted_contents.pop(0)

    if not formatted_contents:
        formatted_contents = [{"role": "user", "parts": [{"text": last_user_msg or "Hello"}]}]

    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
    }

    system_prompt = build_kalasetu_system_prompt()
    payload = {
        "system_instruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": formatted_contents,
        "generationConfig": {
            "temperature": 0.5,
            "topP": 0.9,
            "maxOutputTokens": 1024,
        }
    }

    # Candidate models in priority order for high quota reliability
    candidate_models = ["gemini-flash-lite-latest", "gemini-3-flash-preview", "gemini-3.1-flash-lite-preview", GEMINI_MODEL]
    # Deduplicate while preserving order
    seen_models = set()
    ordered_models = []
    for cm in candidate_models:
        if cm and cm not in seen_models:
            seen_models.add(cm)
            ordered_models.append(cm)

    for model_name in ordered_models:
        api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
        try:
            response = requests.post(
                api_url,
                headers=headers,
                json=payload,
                timeout=18
            )

            if response.status_code == 200:
                res_json = response.json()
                candidates = res_json.get("candidates", [])
                if candidates:
                    content_parts = candidates[0].get("content", {}).get("parts", [])
                    if content_parts:
                        reply_text = content_parts[0].get("text", "").strip()
                        if reply_text:
                            return {
                                "reply": reply_text,
                                "engine": f"Google Gemini ({model_name})",
                                "is_ai_simulated": False
                            }
            else:
                logger.warning(f"Model {model_name} returned HTTP {response.status_code}: {response.text[:120]}")
        except Exception as exc:
            logger.warning(f"Connection error trying {model_name}: {exc}")

    # Fallback to intelligent heuristic response if all API endpoints fail
    return {
        "reply": generate_heuristic_chat_response(last_user_msg, language),
        "engine": "KalaSetu Assistant (Intelligent Fallback)",
        "is_ai_simulated": True
    }

