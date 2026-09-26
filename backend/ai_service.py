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
from typing import Dict, Any, Optional
import requests
from PIL import Image
import io

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

    try:
        response = requests.post(
            GEMINI_API_URL,
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
                    parsed["ai_engine"] = f"Google Gemini ({GEMINI_MODEL})"
                    return parsed
            raise ValueError("Empty or invalid candidate response from Gemini API")
        else:
            logger.error(f"Gemini API returned error {response.status_code}: {response.text}")
            return generate_heuristic_craft_catalog(
                image_bytes, artisan_notes, artisan_input_price,
                f"Gemini API returned HTTP {response.status_code}. Using intelligent fallback."
            )

    except Exception as e:
        logger.exception(f"Error calling Gemini Vision API: {e}")
        return generate_heuristic_craft_catalog(
            image_bytes, artisan_notes, artisan_input_price,
            f"AI Vision service fallback: {str(e)}"
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

Analyze this craft and output a high-standard, professional institutional procurement listing that will appeal to corporate procurement heads and government tender committees.

Return ONLY a valid JSON object matching this schema:
{{
  "product_name": "Professional, formal procurement title in English (e.g., 'Handcrafted Brass Dhokra Table Lamp & Pen Stand')",
  "category": "Pick one: Handloom & Textiles, Pottery & Terracotta, Brass & Metalcraft, Cane & Bamboo, Woodcraft, Folk Art & Painting",
  "hsn_code": "Realistic 4 or 8 digit Indian HSN code (e.g., 7419, 5208, 6912, 4420, 4602, 9701)",
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

        try:
            resp = requests.post(
                GEMINI_API_URL,
                headers=headers,
                json={
                    "contents": [{"parts": parts}],
                    "generationConfig": {
                        "temperature": 0.2,
                        "maxOutputTokens": 1024,
                        "responseMimeType": "application/json"
                    }
                },
                timeout=20
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
                parsed["ai_engine"] = f"Google Gemini ({GEMINI_MODEL}) Institutional Intelligence"
                parsed["is_ai_simulated"] = False
                return parsed
        except Exception as e:
            logger.warning(f"Gemini RFQ generation fallback: {e}")

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
