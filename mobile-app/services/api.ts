/**
 * API Service for KalaSetu Mobile App
 * Connects to FastAPI Backend with Automatic Heuristic Fallback
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Determine local vs production backend URL:
// In development, automatically point to local server:
// - Web: http://localhost:8000
// - Phone (Expo Go): http://<YOUR_LOCAL_IP>:8000
// - Android Emulator: http://10.0.2.2:8000
export const getDevBackendUrl = (): string => {
  if (Platform.OS === 'web') {
    return 'http://localhost:8000';
  }
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:8000`;
  }
  return 'http://10.0.2.2:8000';
};

export const CLOUD_BACKEND_URL =
  Constants.expoConfig?.extra?.backendUrl || 'https://kalakriti-api-nmnz.onrender.com';

const resolveInitialBackendUrl = (): string => {
  // In development mode (Expo Go, Web, Emulator), prioritize local server:
  if (__DEV__) {
    return getDevBackendUrl();
  }
  if (process.env.EXPO_PUBLIC_BACKEND_URL) {
    return process.env.EXPO_PUBLIC_BACKEND_URL.trim();
  }
  return CLOUD_BACKEND_URL;
};

let activeBackendUrl = resolveInitialBackendUrl();

export function getBackendUrl(): string {
  return activeBackendUrl;
}

export function setBackendUrl(url: string): void {
  activeBackendUrl = url.trim().replace(/\/+$/, '');
}

export const BACKEND_URL = activeBackendUrl;

const FALLBACK_GEMINI_KEY = "";

export const GEMINI_API_KEY = (
  process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
  Constants.expoConfig?.extra?.geminiApiKey ||
  FALLBACK_GEMINI_KEY
).trim();

export const SUPABASE_URL = (
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  Constants.expoConfig?.extra?.supabaseUrl ||
  "https://fcabjzylxzdcqzrloaqr.supabase.co"
).trim().replace(/\/+$/, '');

export const SUPABASE_ANON_KEY = (
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  Constants.expoConfig?.extra?.supabaseAnonKey ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjYWJqenlseHpkY3F6cmxvYXFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMDA4NTAsImV4cCI6MjEwNDc3Njg1MH0.z7-C5sww2E6GRqip6HBJmLdoTHJAWZl70TYXqCJaiBg"
).trim();

export interface ProductReview {
  user_name?: string;
  rating?: number;
  comment?: string;
  created_at?: string;
}

export interface CraftProduct {
  id: number;
  name: string;
  artisan_name: string;
  artisan_phone?: string;
  artisan_location: string;
  category: string;
  price: number;
  quantity?: number;
  suggested_price_min?: number;
  suggested_price_max?: number;
  price_justification?: string;
  description_en: string;
  description_hi?: string;
  tags: string[];
  image_url: string;
  image_gallery?: string[];
  rating?: number;
  reviews?: ProductReview[];
  is_enhanced?: boolean;
  mosje_verified?: boolean;
  owner_user_id?: number;
}

export interface AiAnalysisResult {
  category: string;
  suggested_title: string;
  tags: string[];
  description_en: string;
  description_hi: string;
  pricing: {
    fair_min: number;
    fair_max: number;
    suggested: number;
    justification: string;
  };
  craft_heritage_story?: string;
  care_instructions?: string;
  is_ai_simulated?: boolean;
  ai_engine?: string;
  saved_image_url?: string;
}

export type UserRole = 'artisan' | 'buyer' | 'seller' | 'both' | 'buyer-seller' | 'seller-buyer';

export interface AppUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  city: string;
  language: 'en' | 'hi' | 'ta' | 'kn';
}

export interface OrderRecord {
  id: number;
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  status: string;
  eta: string;
  customerName: string;
  customerPhone?: string;
  buyerEmail?: string;
  deliveryAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
  cancelReason?: string;
  createdAt?: string;
}

export interface CancelOrderResponse {
  status: string;
  order_id: number;
  restored_quantity: number;
  reason: string;
  localOnly?: boolean;
}

export interface AdminRequest {
  id: number;
  artisan_name: string;
  email: string;
  product_category?: string;
  quantity?: number;
  target_market?: string;
  status?: string;
  requirements?: string;
  admin_notes?: string;
}

// Fallback seed catalog for offline mobile demo
export const SEED_PRODUCTS: CraftProduct[] = [
  {
    id: 1,
    name: "Terracotta Hand-Painted Surahi (Clay Pitcher)",
    artisan_name: "Rameshwar Prajapati",
    artisan_phone: "+919876543210",
    artisan_location: "Gorakhpur, Uttar Pradesh",
    category: "Pottery & Terracotta",
    price: 650,
    suggested_price_min: 550,
    suggested_price_max: 750,
    price_justification: "Hand-thrown on traditional wheel, red clay kiln fired with herbal motif painting.",
    description_en: "Traditional Indian terracotta clay pitcher crafted from alluvial riverbank clay. Naturally cools water and features exquisite handcrafted floral folk patterns.",
    description_hi: "पारंपरिक भारतीय टेराकोटा मिट्टी की सुराही जो प्राकृतिक रूप से पानी को ठंडा रखती है। इस पर सुंदर लोक चित्रकारी उकेरी गई है।",
    tags: ["Terracotta", "Clay Pitcher", "Eco-Friendly", "Handmade"],
    image_url: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
    image_gallery: [
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.8,
    reviews: [
      { user_name: "Aarav", rating: 5, comment: "Beautiful terracotta piece and great artisan story." },
      { user_name: "Ritika", rating: 4.7, comment: "Lovely finish and authentic clay texture." }
    ],
    mosje_verified: true
  },
  {
    id: 2,
    name: "Authentic Bastar Dhokra Bell Metal Elephant",
    artisan_name: "Mangli Bai",
    artisan_phone: "+919876543211",
    artisan_location: "Bastar, Chhattisgarh",
    category: "Brass & Metalcraft",
    price: 1850,
    suggested_price_min: 1600,
    suggested_price_max: 2200,
    price_justification: "Ancient 4000-year-old lost-wax (Cire-perdue) brass casting by tribal artisans; 3 days of labor.",
    description_en: "Authentic Dhokra bell-metal elephant figurine handcrafted by Bastar tribal artisans using the ancient lost-wax casting technique. Auspicious heritage centerpiece.",
    description_hi: "प्राचीन लॉस्ट-वैक्स तकनीक का उपयोग करके बस्तर के जनजातीय कारीगरों द्वारा हस्तनिर्मित प्रामाणिक ढोकरा बेल-मेटल हाथी।",
    tags: ["Dhokra Art", "Bastar Craft", "Brass Metal", "Tribal Art"],
    image_url: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80",
    image_gallery: [
      "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.7,
    reviews: [
      { user_name: "Priya", rating: 4.8, comment: "Beautifully cast and carefully finished." }
    ],
    mosje_verified: true
  },
  {
    id: 3,
    name: "Kachchhi Hand-Embroidered Mirrorwork Wall Hanging",
    artisan_name: "Jiviben Rabari",
    artisan_phone: "+919876543212",
    artisan_location: "Bhuj, Gujarat",
    category: "Handloom & Textiles",
    price: 1400,
    suggested_price_min: 1200,
    suggested_price_max: 1650,
    price_justification: "Traditional Rabari needlework with embedded glass mirrors, silk thread on handspun organic cotton.",
    description_en: "Vibrant Kutchi mirror-work tapestry meticulously stitched by rural women weavers. Centuries-old tribal folklore patterns with sparkling glass reflections.",
    description_hi: "कच्छ की ग्रामीण महिला कारीगरों द्वारा हाथ से काढ़ा गया जीवंत आभला (दर्पण) वर्क वॉल हैंगिंग।",
    tags: ["Kutch Embroidery", "Mirror Work", "Handloom", "Tapestry"],
    image_url: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80",
    image_gallery: [
      "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.9,
    reviews: [
      { user_name: "Meera", rating: 5, comment: "Stunning mirrorwork and authentic craft story." }
    ],
    mosje_verified: true
  }
];

export async function fetchMarketplaceProducts(): Promise<CraftProduct[]> {
  // 1. Try Supabase REST directly (instant cloud catalog, never sleeps)
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*&order=id.desc`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (sbRes.ok) {
        const rows = await sbRes.json();
        if (Array.isArray(rows) && rows.length > 0) {
          return rows.map((r: any) => {
            let parsedTags: string[] = [];
            try {
              parsedTags = typeof r.tags === 'string' ? JSON.parse(r.tags) : (r.tags || []);
            } catch {
              parsedTags = [r.category || 'Handicraft'];
            }
            let parsedGallery: string[] = [];
            try {
              parsedGallery = typeof r.image_gallery === 'string' ? JSON.parse(r.image_gallery) : (r.image_gallery || [r.image_url]);
            } catch {
              parsedGallery = [r.image_url];
            }
            let parsedReviews: ProductReview[] = [];
            try {
              parsedReviews = typeof r.reviews === 'string' ? JSON.parse(r.reviews) : (r.reviews || []);
            } catch {
              parsedReviews = [];
            }
            return {
              id: r.id,
              name: r.name,
              artisan_name: r.artisan_name,
              artisan_phone: r.artisan_phone,
              artisan_location: r.artisan_location,
              category: r.category,
              price: Number(r.price),
              quantity: Number(r.quantity || 1),
              suggested_price_min: r.suggested_price_min ? Number(r.suggested_price_min) : undefined,
              suggested_price_max: r.suggested_price_max ? Number(r.suggested_price_max) : undefined,
              price_justification: r.price_justification,
              description_en: r.description_en,
              description_hi: r.description_hi,
              tags: parsedTags,
              image_url: r.image_url,
              image_gallery: parsedGallery,
              rating: r.rating ? Number(r.rating) : 4.8,
              reviews: parsedReviews,
              is_enhanced: Boolean(r.is_enhanced),
              mosje_verified: Boolean(r.mosje_verified),
              owner_user_id: r.owner_user_id
            };
          });
        }
      }
    } catch (sbErr) {
      console.warn("Supabase direct product fetch error:", sbErr);
    }
  }

  // 2. Fallback to Backend API
  try {
    const res = await fetch(`${getBackendUrl()}/api/products`, { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      return data.products || SEED_PRODUCTS;
    }
  } catch (err) {
    console.warn("Backend not reachable, loading local seed catalog:", err);
  }
  return SEED_PRODUCTS;
}

export async function addProductReview(
  productId: number,
  userName: string,
  rating: number,
  comment: string
): Promise<{ rating: number; reviews: ProductReview[] }> {
  const res = await fetch(`${BACKEND_URL}/api/products/${productId}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_name: userName, rating, comment })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Review could not be submitted');
  return { rating: data.rating, reviews: data.reviews || [] };
}

export class NetworkError extends Error {
  isNetworkError: boolean;
  constructor(message: string = "NO_NETWORK") {
    super(message);
    this.name = "NetworkError";
    this.isNetworkError = true;
  }
}

function cleanJsonResponse(text: string): any {
  let cleaned = text.trim();
  // Strip markdown code fences ```json ... ``` or ``` ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned);
}

// Hermes-safe base64 encoder with 32KB chunking to prevent heap exhaustion
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chunks: string[] = [];
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    let chunkStr = '';
    const len = chunk.length;
    for (let j = 0; j < len; j += 3) {
      const b0 = chunk[j];
      const b1 = j + 1 < len ? chunk[j + 1] : 0;
      const b2 = j + 2 < len ? chunk[j + 2] : 0;
      chunkStr += BASE64_CHARS[b0 >> 2];
      chunkStr += BASE64_CHARS[((b0 & 3) << 4) | (b1 >> 4)];
      chunkStr += j + 1 < len ? BASE64_CHARS[((b1 & 15) << 2) | (b2 >> 6)] : '=';
      chunkStr += j + 2 < len ? BASE64_CHARS[b2 & 63] : '=';
    }
    chunks.push(chunkStr);
  }
  return chunks.join('');
}

async function imageUriToBase64(imageUri: string): Promise<{ base64: string; mimeType: string }> {
  // 1. Data URIs (e.g. data:image/jpeg;base64,... from ImagePicker)
  // CRITICAL: Must not use regex /data:(.*?);base64,(.+)/ because (.) does not match \n
  // and base64 strings contain newlines, causing premature truncation!
  if (imageUri.startsWith('data:')) {
    const commaIdx = imageUri.indexOf(',');
    if (commaIdx !== -1) {
      const header = imageUri.slice(5, commaIdx);
      const mimeType = header.split(';')[0] || 'image/jpeg';
      const base64 = imageUri.slice(commaIdx + 1).replace(/[\r\n\s]/g, '');
      if (base64) {
        return { base64, mimeType };
      }
    }
  }

  const cleanUri = imageUri.split('?')[0];
  const filename = cleanUri.split('/').pop() || 'photo.jpg';
  const extMatch = /\.(\w+)$/.exec(filename);
  const ext = (extMatch ? extMatch[1] : 'jpg').toLowerCase();
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  // 2. Fetch/XHR blob and FileReader conversion — works on Web, Android, and iOS
  try {
    let blob: Blob;
    try {
      const response = await fetch(imageUri);
      blob = await response.blob();
    } catch {
      // Fallback to XMLHttpRequest for React Native Android local schemes if fetch fails
      blob = await new Promise<Blob>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => resolve(xhr.response as Blob);
        xhr.onerror = (e) => reject(new Error('Local file XHR failed: ' + String(e)));
        xhr.responseType = 'blob';
        xhr.open('GET', imageUri, true);
        xhr.send(null);
      });
    }

    const resolvedMime = blob.type || mimeType;

    if (typeof FileReader !== 'undefined') {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result as string;
          const comma = res.indexOf(',');
          resolve(comma !== -1 ? res.slice(comma + 1).replace(/[\r\n\s]/g, '') : res);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      if (base64) {
        return { base64, mimeType: resolvedMime };
      }
    }

    const buffer = await (blob as any).arrayBuffer?.() || await (await fetch(imageUri)).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const base64 = uint8ArrayToBase64(bytes);
    if (!base64) {
      throw new Error('Failed to convert image to base64');
    }
    return { base64, mimeType: resolvedMime };
  } catch (fetchErr) {
    console.warn("Fetch base64 conversion failed:", fetchErr);
    throw new Error(`Failed to convert image to base64: ${fetchErr}`);
  }
}

export async function analyzeCraftWithGeminiDirect(
  imageUri: string,
  notes: string = "",
  priceHint: string = "",
  preloadedBase64?: string
): Promise<AiAnalysisResult> {
  const apiKey = GEMINI_API_KEY;
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
    throw new Error("No Google Gemini API key configured.");
  }

  let base64: string;
  let mimeType: string = 'image/jpeg';
  if (preloadedBase64) {
    base64 = preloadedBase64.replace(/[\r\n\s]/g, '');
  } else {
    const res = await imageUriToBase64(imageUri);
    base64 = res.base64;
    mimeType = res.mimeType;
  }

  const prompt = `You are the AI Virtual Business Manager for rural and marginalized Indian artisans and weavers under the Ministry of Social Justice and Empowerment (MoSJE).
Your mission is to empower low-literacy artisans by analyzing their handmade craft photo and auto-generating an e-commerce catalog entry that commands fair market value.

Context from artisan (if any):
- Artisan Voice/Text Notes: "${notes || 'None provided'}"
- Artisan Self-Price Idea: "${priceHint || 'Not specified'}"
If the artisan notes are spoken or written in Kannada (or another Indian language), interpret and translate them into natural English before using them in the English catalog title and description.

Analyze the product image with high attention to Indian heritage craftsmanship (handloom, terracotta, metal, bamboo, wood, embroidery, etc.).

Return ONLY a valid JSON object matching this exact schema:
{
  "category": "Pick exactly one from: Handloom & Textiles, Pottery & Terracotta, Brass & Metalcraft, Cane & Bamboo, Woodcraft, Tribal Jewelry, Leather Craft, Folk Art & Painting, Stone Carving",
  "suggested_title": "Concise, SEO-optimized title in English (e.g., 'Hand-Carved Sheesham Wood Elephant Figurine')",
  "tags": ["3 to 5 relevant tags like 'Handmade', 'EcoFriendly', 'BastarArt', 'Terracotta']",
  "description_en": "2-3 sentences. Highlighting traditional craftsmanship, natural materials, authentic cultural technique, and home utility.",
  "description_hi": "A warm, natural Hindi translation of the description in Devanagari script for local and regional reach.",
  "pricing": {
    "fair_min": 450,
    "fair_max": 750,
    "suggested": 600,
    "justification": "Clear, simple explanation of why this price is fair based on craftsmanship complexity, estimated labor hours, and raw material value."
  },
  "craft_heritage_story": "A single sentence celebrating the cultural tradition or artisan lineage behind this work.",
  "care_instructions": "One simple sentence advising the buyer on how to care for this handmade product."
}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      maxOutputTokens: 2048,
      responseMimeType: "application/json"
    }
  };

  // gemini-2.5-flash is the premier active model; fallback to gemini-flash-latest or gemini-2.5-flash-lite
  const modelsToTry = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.5-flash-lite"];
  let lastErrText = "";

  for (const model of modelsToTry) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = cleanJsonResponse(rawText);
          parsed.is_ai_simulated = false;
          parsed.ai_engine = `Google Gemini (${model} Vision)`;
          return parsed as AiAnalysisResult;
        }
      } else {
        lastErrText = await response.text();
        console.warn(`Gemini Vision (${model}) HTTP ${response.status}:`, lastErrText.slice(0, 150));
      }
    } catch (e: any) {
      console.warn(`Gemini Vision (${model}) fetch error:`, e?.message || e);
      lastErrText = e?.message || String(e);
    }
  }

  throw new Error(`Gemini Vision failed across models: ${lastErrText.slice(0, 120)}`);
}

// ── Smart Local Heuristic Fallback ────────────────────────────────────────────
// Generates a realistic catalog entry from artisan notes + price hint.
// Used when Gemini API is unavailable so the artisan can ALWAYS publish.
function generateLocalFallbackAnalysis(notes: string, priceHint: string, imageUri: string): AiAnalysisResult {
  const lowerNotes = (notes || '').toLowerCase();
  const lowerUri = (imageUri || '').toLowerCase();
  const combined = lowerNotes + ' ' + lowerUri;

  // Detect category from keywords
  let category = 'Handloom & Textiles';
  let title = 'Handcrafted Indian Artisan Product';
  let descEn = 'A beautiful handcrafted product made with traditional techniques passed down through generations of Indian artisans.';
  let descHi = 'परंपरागत तकनीकों से बनाया गया एक सुंदर हस्तनिर्मित उत्पाद।';
  let tags = ['Handmade', 'Indian Craft', 'Artisan', 'Traditional'];
  let heritage = 'This craft reflects centuries of traditional Indian artisanship.';
  let care = 'Handle gently and store in a cool, dry place away from direct sunlight.';
  let baseMin = 450, baseMax = 900;

  if (/terracotta|clay|pottery|ceramic|kumbha|mitti|pot|pitcher|surahi/.test(combined)) {
    category = 'Pottery & Terracotta'; title = 'Hand-Thrown Terracotta Clay Craft';
    descEn = 'Authentic terracotta craft hand-thrown on a traditional wheel and kiln-fired by skilled artisans. Naturally eco-friendly.'; descHi = 'परंपरागत चाक पर हाथ से बनाई गई प्रामाणिक टेराकोटा कलाकृति।';
    tags = ['Terracotta', 'Clay', 'EcoFriendly', 'Handthrown', 'KilnFired']; baseMin = 350; baseMax = 750;
    heritage = 'Rooted in the 5000-year-old Harappan pottery tradition of South Asia.';
    care = 'Avoid sudden temperature changes. Rinse with lukewarm water only.';
  } else if (/brass|metal|dhokra|bronze|copper|bell.*metal|loha|steel/.test(combined)) {
    category = 'Brass & Metalcraft'; title = 'Hand-Crafted Dhokra Metal Art Piece';
    descEn = 'Exquisite bell-metal craft made using the ancient Dhokra lost-wax casting technique by tribal artisans.'; descHi = 'प्राचीन ढोकरा तकनीक से बना धातु शिल्प।';
    tags = ['Dhokra', 'BrassCraft', 'TribalArt', 'LostWax', 'MetalCraft']; baseMin = 800; baseMax = 2500;
    heritage = 'Dhokra metal casting is one of the world\'s oldest known metal-working techniques, dating back 4,000 years.';
    care = 'Wipe with a soft dry cloth. Avoid harsh chemicals. Polish with metal polish occasionally.';
  } else if (/bamboo|cane|basket|baans|rattan|wicke/.test(combined)) {
    category = 'Cane & Bamboo'; title = 'Hand-Woven Bamboo & Cane Craft';
    descEn = 'Eco-friendly bamboo craft hand-woven by skilled tribal artisans using sustainably sourced natural materials.'; descHi = 'टिकाऊ बांस से हाथ से बुनी गई पर्यावरण-अनुकूल कलाकृति।';
    tags = ['Bamboo', 'EcoFriendly', 'Handwoven', 'Sustainable', 'TribalCraft']; baseMin = 300; baseMax = 900;
    heritage = 'Bamboo weaving traditions in India date back thousands of years and support indigenous livelihoods.';
    care = 'Keep dry and away from moisture. Apply a light coat of varnish to extend life.';
  } else if (/wood|teak|sheesham|sandalwood|lacquer|lacquerware|carving|nakkashi/.test(combined)) {
    category = 'Woodcraft'; title = 'Hand-Carved Indian Woodcraft';
    descEn = 'Intricately hand-carved wooden craft made from sustainably sourced hardwood by master artisans.'; descHi = 'उत्कृष्ट हाथ से नक्काशी की गई लकड़ी की कलाकृति।';
    tags = ['Woodcraft', 'HandCarved', 'Sustainable', 'IndianCraft', 'Lacquerware']; baseMin = 500; baseMax = 2000;
    heritage = 'Wood carving traditions in India span over 3,000 years across regions like Rajasthan, Kashmir, and Kerala.';
    care = 'Polish with furniture wax or teak oil annually. Avoid water exposure.';
  } else if (/embroidery|silk|cotton|handloom|weave|saree|dupatta|shawl|zari|block.*print/.test(combined)) {
    category = 'Handloom & Textiles'; title = 'Handloom Woven Textile – Indian Heritage';
    descEn = 'Premium handloom textile woven on a traditional loom with natural yarns by certified artisan weavers.'; descHi = 'पारंपरिक करघे पर बुना गया हस्तशिल्प कपड़ा।';
    tags = ['Handloom', 'NaturalFibre', 'Weaving', 'IndianTextile', 'GITagged']; baseMin = 600; baseMax = 3000;
    heritage = 'India\'s handloom tradition is a 5,000-year heritage weaving culture, home to iconic textiles like Banarasi, Kanjeevaram, and Pochampally.';
    care = 'Hand wash gently in cold water. Dry in shade. Iron on low heat.';
  } else if (/jewel|necklace|bracelet|earring|beads|tribal.*jewel|payal/.test(combined)) {
    category = 'Tribal Jewelry'; title = 'Handcrafted Tribal Artisan Jewelry';
    descEn = 'Stunning tribal jewelry handcrafted by indigenous artisans using traditional metalwork and natural gemstone beads.'; descHi = 'देशज कारीगरों द्वारा हस्तनिर्मित आदिवासी आभूषण।';
    tags = ['TribalJewelry', 'Handcrafted', 'IndigenousArt', 'NaturalGems', 'BohoStyle']; baseMin = 400; baseMax = 1800;
    heritage = 'Tribal jewelry traditions carry the cultural identity and spiritual symbols of India\'s indigenous communities.';
    care = 'Store in a soft cloth pouch. Avoid moisture and perfumes. Clean with a dry soft cloth.';
  } else if (/leather|chappals|bag.*leather|jutti/.test(combined)) {
    category = 'Leather Craft'; title = 'Handcrafted Indian Leather Article';
    descEn = 'Premium hand-stitched leather craft made using traditional techniques by skilled artisans.'; descHi = 'पारंपरिक तकनीक से बना उत्कृष्ट हस्तनिर्मित चमड़े का उत्पाद।';
    tags = ['LeatherCraft', 'Handstitched', 'Artisan', 'Traditional', 'Durable']; baseMin = 500; baseMax = 2500;
    heritage = 'Indian leather craft spans thousands of years, with iconic styles like Kolhapuri and Punjabi Jutti known worldwide.';
    care = 'Condition with leather balm. Keep away from water. Store stuffed to retain shape.';
  } else if (/painting|folk.*art|warli|madhubani|pattachitra|kalamkari|miniature/.test(combined)) {
    category = 'Folk Art & Painting'; title = 'Traditional Indian Folk Art Painting';
    descEn = 'Authentic Indian folk art painting hand-painted using natural pigments and traditional motifs by a master artist.'; descHi = 'प्राकृतिक रंगों से हाथ से बनाई गई लोक चित्रकारी।';
    tags = ['FolkArt', 'Handpainted', 'IndianArt', 'NaturalPigments', 'WallDecor']; baseMin = 700; baseMax = 4000;
    heritage = 'India\'s folk painting traditions — Madhubani, Warli, Pattachitra — are UNESCO-recognized living art forms.';
    care = 'Frame under UV-protective glass. Keep away from moisture and direct sunlight.';
  }

  // Adjust pricing from user\'s hint if provided
  const hintNum = parseFloat(priceHint);
  let basePrice = 600;
  if (!isNaN(hintNum) && hintNum > 0) {
    basePrice = Math.round(hintNum);
    baseMin = Math.round(hintNum * 0.75);
    baseMax = Math.round(hintNum * 1.35);
  } else {
    basePrice = Math.round((baseMin + baseMax) / 2);
  }

  // Inject artisan notes into title and description if provided
  if (notes && notes.trim().length > 3) {
    const noteWords = notes.trim().split(/\s+/).slice(0, 4).join(' ');
    title = `${noteWords} – ${category}`;
    descEn = `${notes.trim()}. Handcrafted with natural materials by local heritage artisans with generational expertise.`;
    descHi = `${notes.trim()}। पारंपरिक कारीगरों द्वारा हस्तनिर्मित उत्कृष्ट उत्पाद।`;
  }

  return {
    category,
    suggested_title: title,
    tags,
    description_en: descEn,
    description_hi: descHi,
    pricing: {
      fair_min: baseMin,
      fair_max: baseMax,
      suggested: basePrice,
      justification: `Fair price based on traditional handcraft complexity, estimated ${Math.ceil(basePrice / 80)}-${Math.ceil(basePrice / 50)} hours of skilled labour, and raw material costs. Price range ₹${baseMin}–₹${baseMax} reflects current artisan market rates.`
    },
    craft_heritage_story: heritage,
    care_instructions: care,
    is_ai_simulated: true,
    ai_engine: 'KalaSetu Heuristic Engine (offline mode)'
  };
}
// ────────────────────────────────────────────────────────────────────────────

export async function analyzeProductPhoto(
  imageUri: string,
  notes: string = "",
  priceHint: string = "",
  preloadedBase64?: string
): Promise<AiAnalysisResult> {
  // Offline pre-check in web environment
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new NetworkError("NO_NETWORK");
  }

  // 1. If Gemini API key is configured, run Gemini Vision directly for instant, authentic AI analysis
  if (GEMINI_API_KEY && GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY_HERE") {
    try {
      console.info("Analyzing craft image with Google Gemini Vision directly...");
      return await analyzeCraftWithGeminiDirect(imageUri, notes, priceHint, preloadedBase64);
    } catch (directErr) {
      console.warn("Direct Gemini Vision encountered an issue, trying backend endpoint:", directErr);
    }
  }

  try {
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    let fileAppended = false;

    // 1. Universal Blob/File creation (Web and modern React Native / Expo 54-57+)
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      if (typeof File !== 'undefined') {
        try {
          const fileObj = new File([blob], filename, { type });
          formData.append('file', fileObj);
          fileAppended = true;
        } catch {
          formData.append('file', blob, filename);
          fileAppended = true;
        }
      } else {
        formData.append('file', blob, filename);
        fileAppended = true;
      }
    } catch (fetchErr) {
      console.warn("Could not fetch image as blob, trying fallback:", fetchErr);
    }

    // 2. Fallback for legacy React Native runtime if Blob conversion failed
    if (!fileAppended) {
      try {
        const formattedUri =
          Platform.OS === 'android' && !imageUri.startsWith('file://') && !imageUri.startsWith('content://') && !imageUri.startsWith('data:')
            ? `file://${imageUri}`
            : imageUri;

        // @ts-ignore: React Native legacy FormData file format
        formData.append('file', {
          uri: formattedUri,
          name: filename,
          type
        });
        fileAppended = true;
      } catch (legacyErr) {
        console.warn("Legacy FormData append failed:", legacyErr);
      }
    }

    if (notes) formData.append('notes', notes);
    if (priceHint) formData.append('price_hint', String(priceHint));

    const res = await fetch(`${getBackendUrl()}/api/analyze-product`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      }
    });

    if (res.ok) {
      const result: AiAnalysisResult = await res.json();
      // If backend returned simulated fallback (e.g. Render with no API key),
      // seamlessly elevate to direct Gemini Vision for real AI results!
      if (result.is_ai_simulated && GEMINI_API_KEY) {
        console.info("Backend in simulation mode. Elevating to direct Gemini Vision...");
        try {
          return await analyzeCraftWithGeminiDirect(imageUri, notes, priceHint, preloadedBase64);
        } catch (directErr) {
          console.warn("Direct Gemini Vision fallback failed, returning backend result:", directErr);
          return result;
        }
      }
      return result;
    }

    const errData = await res.json().catch(() => ({}));
    console.warn("Backend vision API returned HTTP error:", res.status, errData);
    // If backend returned error, attempt direct Gemini Vision before failing:
    if (GEMINI_API_KEY) {
      console.info("Backend vision returned error. Attempting direct Gemini Vision...");
      try {
        return await analyzeCraftWithGeminiDirect(imageUri, notes, priceHint, preloadedBase64);
      } catch { /* fall through to local fallback */ }
    }
    // Use local heuristic fallback so artisan can always publish
    console.info("Using local heuristic fallback for catalog generation.");
    return generateLocalFallbackAnalysis(notes, priceHint, imageUri);
  } catch (err: any) {
    console.warn("Error calling backend vision API:", err);

    // If backend is down or unreachable, attempt direct Gemini Vision API call:
    if (GEMINI_API_KEY) {
      try {
        console.info("Backend unreachable. Calling Gemini Vision directly...");
        return await analyzeCraftWithGeminiDirect(imageUri, notes, priceHint);
      } catch (directErr) {
        console.warn("Direct Gemini Vision also failed:", directErr);
      }
    }

    // ✅ GUARANTEED FALLBACK — never throw an error to the user.
    // If everything fails (no API key, backend down, network issue),
    // return smart heuristic catalog data so the artisan can always publish.
    const msg = String(err?.message || '');
    const isHardOffline =
      msg === 'NO_NETWORK' ||
      (Platform.OS === 'web' && typeof navigator !== 'undefined' && !navigator.onLine);
    if (isHardOffline) {
      throw new NetworkError("NO_NETWORK");
    }

    console.info("All AI methods failed. Returning local heuristic catalog for artisan.");
    return generateLocalFallbackAnalysis(notes, priceHint, imageUri);
  }
}

export async function syncProductToSupabaseDirect(product: Omit<CraftProduct, 'id'>): Promise<any> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }

  const payload = {
    name: product.name,
    artisan_name: product.artisan_name,
    artisan_phone: product.artisan_phone || "+919876543210",
    artisan_location: product.artisan_location || "Rural Cluster, India",
    category: product.category || "Handloom & Textiles",
    price: Number(product.price),
    quantity: Number(product.quantity || 1),
    suggested_price_min: product.suggested_price_min,
    suggested_price_max: product.suggested_price_max,
    price_justification: product.price_justification || "",
    description_en: product.description_en || product.name,
    description_hi: product.description_hi || "",
    tags: JSON.stringify(product.tags || ["Handmade", "Artisan"]),
    image_url: product.image_url || "",
    image_gallery: JSON.stringify(product.image_gallery || [product.image_url || ""]),
    rating: Number(product.rating || 4.5),
    reviews: JSON.stringify(product.reviews || []),
    is_enhanced: product.is_enhanced ? 1 : 0,
    mosje_verified: 1,
    owner_user_id: product.owner_user_id
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const txt = await res.text();
    console.warn("Direct Supabase sync response status:", res.status, txt);
    throw new Error(`Supabase returned ${res.status}: ${txt}`);
  }
  return await res.json();
}

export async function publishProductToApi(product: Omit<CraftProduct, 'id'>): Promise<boolean> {
  let cloudSuccess = false;
  let lastErrorMsg = '';

  // 1. Direct Cloud Upload to Supabase REST (instant, never sleeps)
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      await syncProductToSupabaseDirect(product);
      cloudSuccess = true;
      console.info("Direct Supabase product upload succeeded!");
    } catch (sbErr: any) {
      console.warn("Direct Supabase sync attempt failed:", sbErr);
      lastErrorMsg = sbErr?.message || String(sbErr);
    }
  }

  // 2. Dual Sync to Backend API if running/accessible
  try {
    const res = await fetchWithTimeout(`${getBackendUrl()}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    }, 4000);
    if (res.ok) {
      cloudSuccess = true;
    }
  } catch (err: any) {
    console.warn("Backend publish notification skipped/timed out:", err?.message);
    if (!lastErrorMsg) lastErrorMsg = err?.message || 'Backend unreachable';
  }

  if (cloudSuccess) {
    return true;
  }

  throw new Error(`Publish to cloud failed: ${lastErrorMsg || 'Please check your internet connection.'}`);
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 12000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return res;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Server took too long to respond. The free cloud backend may be waking up from sleep, please try again.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export interface SendOtpResponse {
  status: string;
  message: string;
  target?: string;
  target_type?: 'email' | 'phone';
  sent_via_smtp?: boolean;
  sent_via_sms?: boolean;
  dev_otp?: string;
  notice?: string;
  expires_in?: number;
}

/**
 * Passwordless OTP: always generates a dummy 6-digit OTP locally and returns it.
 * No backend call needed — the OTP is shown on-screen and auto-filled.
 */
export async function sendOtpApi(identifier: string, name: string = ''): Promise<SendOtpResponse> {
  const isEmail = identifier.includes('@');
  // Generate dummy OTP locally — no backend needed
  const dummyOtp = String(Math.floor(100000 + Math.random() * 900000));
  return {
    status: 'success',
    message: `OTP generated for ${identifier}`,
    target: identifier,
    target_type: isEmail ? 'email' : 'phone',
    sent_via_smtp: false,
    sent_via_sms: false,
    dev_otp: dummyOtp,
    notice: 'Passwordless mode: Use the OTP shown on-screen to continue.',
    expires_in: 600,
  };
}

/**
 * Passwordless verify: skips backend OTP check entirely.
 * Just registers (or logs in) the user by email/phone.
 */
export async function verifyOtpApi(
  target: string,
  otp: string,
  password: string = '',
  name: string = 'KalaSetu User',
  role: UserRole = 'buyer'
): Promise<AppUser> {
  // Always use the name the user typed — never let backend override it
  const enteredName = (name || '').trim();

  const isEmail = target.includes('@');
  if (isEmail) {
    const cleanEmail = target.trim().toLowerCase();
    // 1. Try logging in first with candidate passwords (including demo passwords)
    try {
      const user = await loginUser(cleanEmail, password || 'demo', role);
      if (user) {
        // Override name with what the user typed at login, if provided
        if (enteredName) user.name = enteredName;
        return user;
      }
    } catch {
      // User not found or password didn't match yet — continue to register
    }

    // 2. Try registering the user
    try {
      const registered = await registerUser({
        name: enteredName || cleanEmail.split('@')[0],
        email: cleanEmail,
        password: password || 'demo',
        role,
      });
      if (enteredName) registered.name = enteredName;
      return registered;
    } catch (regErr: any) {
      const msg = String(regErr?.message || '');
      // If user already exists, try all known passwords to recover session
      if (msg.toLowerCase().includes('already exists') || msg.includes('409')) {
        const recoveryPasswords = ['demo', 'demo123', 'artisan123', 'kalakriti123', 'password', '123456', ''];
        for (const pwd of recoveryPasswords) {
          try {
            const recovered = await loginUser(cleanEmail, pwd, role);
            if (recovered) {
              if (enteredName) recovered.name = enteredName;
              return recovered;
            }
          } catch {
            // continue trying
          }
        }
        // If all fail, return a valid user session so user is not blocked in demo
        return {
          id: Date.now(),
          name: enteredName || cleanEmail.split('@')[0],
          email: cleanEmail,
          role,
          phone: '',
          city: 'India',
          language: 'en'
        };
      }
      throw regErr;
    }
  } else {
    // Phone flow
    const cleanPhone = target.trim();
    const digits = cleanPhone.replace(/\D/g, '').slice(-10);

    // Fast-path demo phones
    if (digits === '9800112233') {
      const user = await loginUser('demo@kalakriti.in', 'demo123', 'buyer');
      if (user) return user;
    }
    if (digits === '9876543210') {
      const user = await loginUser('artisan@kalakriti.in', 'artisan123', 'artisan');
      if (user) return user;
    }

    try {
      const phoneUser = await loginWithPhone(cleanPhone, password || 'demo');
      if (phoneUser) {
        if (enteredName) phoneUser.name = enteredName;
        return phoneUser;
      }
    } catch {
      try {
        const registered = await registerWithPhone({
          phone: cleanPhone,
          pin: password || 'demo',
          name: enteredName || 'Artisan',
          role: role || 'artisan',
        });
        if (enteredName) registered.name = enteredName;
        return registered;
      } catch (regErr: any) {
        // Recover or return local session
        return {
          id: Date.now(),
          name: enteredName || 'Artisan',
          email: `artisan_${digits}@kalakriti.in`,
          role: role || 'artisan',
          phone: cleanPhone,
          city: 'India',
          language: 'hi'
        };
      }
    }
  }

  return {
    id: Date.now(),
    name: enteredName || (target.includes('@') ? target.split('@')[0] : 'Artisan'),
    email: target.includes('@') ? target.trim().toLowerCase() : `user_${target.replace(/\D/g, '').slice(-10)}@kalakriti.in`,
    role,
    phone: target.includes('@') ? '' : target.trim(),
    city: 'India',
    language: 'en'
  };
}

export async function fetchUserFromSupabaseDirect(identifier: string): Promise<AppUser | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const clean = identifier.trim();
  const isEmail = clean.includes('@');
  const digits = clean.replace(/\D/g, '').slice(-10);

  const filters: string[] = [];
  if (isEmail) {
    filters.push(`email=eq.${encodeURIComponent(clean.toLowerCase())}`);
  }
  if (digits.length >= 8) {
    filters.push(`phone=eq.${encodeURIComponent('+91' + digits)}`);
    filters.push(`phone=like.*${digits}`);
    filters.push(`email=like.*${digits}*`);
  }

  for (const f of filters) {
    try {
      const url = `${SUPABASE_URL}/rest/v1/users?${f}&limit=1`;
      const res = await fetch(url, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const u = rows[0];
          return {
            id: u.id,
            name: u.name || 'KalaSetu Artisan',
            email: u.email || '',
            role: (u.role || 'artisan') as UserRole,
            phone: u.phone || '',
            city: u.city || 'India',
            language: (u.language || 'en') as 'en' | 'hi' | 'ta' | 'kn'
          };
        }
      }
    } catch {
      // Continue trying next filter
    }
  }
  return null;
}

export async function registerUser(params: {
  name: string;
  email: string;
  password?: string;
  role?: UserRole;
  phone?: string;
  city?: string;
  language?: string;
}): Promise<AppUser> {
  const pwd = params.password || 'demo';
  const payload = {
    name: params.name.trim(),
    email: params.email.trim().toLowerCase(),
    password: pwd,
    role: params.role || 'artisan',
    phone: params.phone ? params.phone.trim() : '',
    city: params.city ? params.city.trim() : '',
    language: params.language || 'en'
  };

  // 1. Direct Supabase User creation
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });
      if (sbRes.ok) {
        const rows = await sbRes.json();
        if (Array.isArray(rows) && rows[0]) {
          return {
            id: rows[0].id,
            name: rows[0].name,
            email: rows[0].email,
            role: rows[0].role as UserRole,
            phone: rows[0].phone,
            city: rows[0].city,
            language: rows[0].language as any
          };
        }
      }
    } catch (sbErr) {
      console.warn("Direct Supabase user registration attempt failed:", sbErr);
    }
  }

  // 2. Try Backend API
  try {
    const res = await fetchWithTimeout(`${getBackendUrl()}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, 6000);

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.user) return data.user as AppUser;
  } catch (err) {
    console.warn("Backend register unreachable:", err);
  }

  return {
    id: Date.now(),
    name: payload.name,
    email: payload.email,
    role: payload.role as UserRole,
    phone: payload.phone,
    city: payload.city,
    language: (payload.language as any) || 'en'
  };
}

export async function loginUser(email: string, password: string = '', role: UserRole = 'artisan'): Promise<AppUser | null> {
  const cleanInput = email.trim();
  const isEmail = cleanInput.includes('@');
  const digits = cleanInput.replace(/\D/g, '').slice(-10);

  // 1. Direct Cloud Lookup via Supabase (instant, zero cold-start delay)
  try {
    const sbUser = await fetchUserFromSupabaseDirect(cleanInput);
    if (sbUser) {
      console.info("Authenticated instantly via Supabase cloud user record:", sbUser.email || sbUser.phone);
      return sbUser;
    }
  } catch (sbErr) {
    console.warn("Direct Supabase user lookup skipped:", sbErr);
  }

  // 2. Build list of candidate identifiers
  const candidates: string[] = [];
  if (cleanInput.toLowerCase() === 'artisan@kalakriti.in' || digits === '9876543210') {
    candidates.push('artisan@kalakriti.in');
  } else if (cleanInput.toLowerCase() === 'demo@kalakriti.in' || digits === '9800112233') {
    candidates.push('demo@kalakriti.in');
  }

  candidates.push(cleanInput);
  if (isEmail) {
    candidates.push(cleanInput.toLowerCase());
  } else if (digits.length >= 8) {
    candidates.push(`+91${digits}`);
    candidates.push(digits);
    candidates.push(`artisan_${digits}@kalakriti.in`);
  }

  const uniqueCandidates = Array.from(new Set(candidates));

  // 3. Build candidate passwords to try
  const candidatePasswords: string[] = [];
  if (password) candidatePasswords.push(password);
  candidatePasswords.push('artisan123');
  candidatePasswords.push('demo123');
  candidatePasswords.push('demo');
  candidatePasswords.push('kalakriti123');
  candidatePasswords.push('');

  const uniquePasswords = Array.from(new Set(candidatePasswords));
  let lastError = 'Invalid email/mobile number or password. Please check your credentials.';

  for (const candidate of uniqueCandidates) {
    for (const pwd of uniquePasswords) {
      try {
        const payload = { email: candidate, password: pwd, role };
        const res = await fetchWithTimeout(`${getBackendUrl()}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }, 4000);

        if (res.ok) {
          const data = await res.json();
          if (data && data.user) {
            return data.user as AppUser;
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          if (errData.detail && typeof errData.detail === 'string') {
            lastError = errData.detail;
          }
        }
      } catch (err: any) {
        // Continue to next password or fallback
      }
    }
  }

  // 4. If credentials exist in Supabase by name or phone match
  const fallbackUser = await fetchUserFromSupabaseDirect(cleanInput);
  if (fallbackUser) return fallbackUser;

  throw new Error(lastError);
}

export async function loginWithPhone(phone: string, pin: string = ''): Promise<AppUser> {
  const clean = phone.trim();
  const digits = clean.replace(/\D/g, '').slice(-10);

  // 1. Direct cloud lookup via Supabase (instant, zero cold-start delay)
  try {
    const sbUser = await fetchUserFromSupabaseDirect(clean);
    if (sbUser) {
      console.info("Phone authenticated via Supabase cloud user record:", sbUser.phone || sbUser.name);
      return sbUser;
    }
  } catch (sbErr) {
    console.warn("Direct Supabase user lookup skipped:", sbErr);
  }

  // Fast path for demo phone numbers
  if (digits === '9800112233') {
    const user = await loginUser('demo@kalakriti.in', 'demo123', 'buyer');
    if (user) return user;
  }
  if (digits === '9876543210') {
    const user = await loginUser('artisan@kalakriti.in', 'artisan123', 'artisan');
    if (user) return user;
  }

  // Passwords to try
  const passwordsToTry = Array.from(new Set([pin, 'artisan123', 'demo123', 'demo', ''])).filter(p => p !== undefined);

  // 2. Try dedicated phone-login endpoint
  for (const pwd of passwordsToTry) {
    try {
      const res = await fetchWithTimeout(`${getBackendUrl()}/api/auth/phone-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean, password: pwd })
      }, 4000);
      if (res.ok) {
        const data = await res.json();
        if (data && data.user) return data.user as AppUser;
      }
    } catch {
      // Continue to fallback
    }
  }

  // 3. Try standard /api/auth/login via loginUser
  return await loginUser(clean, pin, 'artisan') as AppUser;
}

export async function registerWithPhone(params: {
  phone: string;
  pin?: string;
  name: string;
  role?: UserRole;
  city?: string;
  language?: string;
}): Promise<AppUser> {
  const cleanPhone = params.phone.trim();
  const digits = cleanPhone.replace(/\D/g, '').slice(-10);
  const pwd = params.pin || 'demo';

  // 1. Try phone-register endpoint
  try {
    const res = await fetchWithTimeout(`${BACKEND_URL}/api/auth/phone-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: cleanPhone,
        password: pwd,
        name: params.name,
        role: params.role || 'artisan',
        city: params.city || '',
        language: params.language || 'hi'
      })
    }, 8000);
    if (res.ok) {
      const data = await res.json();
      if (data && data.user) return data.user as AppUser;
    }
  } catch (err) {
    // Continue to standard register fallback
  }

  // 2. Fallback to standard /api/auth/register
  const syntheticEmail = `${params.role === 'buyer' ? 'buyer' : 'artisan'}_${digits}@kalakriti.in`;
  return await registerUser({
    name: params.name,
    email: syntheticEmail,
    password: pwd,
    role: params.role || 'artisan',
    phone: cleanPhone,
    city: params.city,
    language: params.language || 'hi'
  });
}

export async function loginAdmin(email: string, password: string): Promise<string> {
    const res = await fetch(`${BACKEND_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.admin_token) throw new Error(data.detail || 'Invalid admin credentials');
    return data.admin_token;
  }

  export async function fetchAdminRequests(token: string): Promise<AdminRequest[]> {
    const res = await fetch(`${BACKEND_URL}/api/admin/institutional-requests`, {
      headers: { 'X-Admin-Token': token }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || 'Admin review queue could not be loaded');
    return data.requests || [];
  }

  export async function updateAdminRequest(token: string, requestId: number, status: string, adminNotes: string): Promise<void> {
    const res = await fetch(`${BACKEND_URL}/api/admin/institutional-requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
      body: JSON.stringify({ status, admin_notes: adminNotes })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || 'Admin review could not be saved');
  }

  export async function createOrder(input: {
    userId: number;
    productId: number;
    productName: string;
    price: number;
    quantity: number;
    customerName: string;
    recipientName: string;
    recipientPhone: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
  }): Promise<OrderRecord> {
    const order: OrderRecord = {
      id: Date.now(),
      productId: input.productId,
      productName: input.productName,
      price: input.price,
      quantity: input.quantity,
      status: 'Confirmed',
      eta: '2-4 working days',
      customerName: input.customerName
    };

    try {
      const res = await fetch(`${BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: input.userId,
          product_id: input.productId,
          product_name: input.productName,
          quantity: input.quantity,
          total: input.price * input.quantity,
          status: order.status,
          eta: order.eta,
          recipient_name: input.recipientName,
          recipient_phone: input.recipientPhone,
          address_line: input.addressLine,
          city: input.city,
          state: input.state,
          pincode: input.pincode
        })
      });

      if (res.ok) {
        const data = await res.json();
        return { ...order, id: Number(data.order_id) || order.id, quantity: input.quantity };
      }
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || 'Could not place the order request.');

    } catch (err) {
      if (!(err instanceof Error) || err.message === 'Failed to fetch') {
        console.warn('Order API unavailable, saved in app state only:', err);
      } else {
        throw err;
      }
    }

    return { ...order, quantity: input.quantity };
  }

  export async function deleteProduct(productId: number, userId: number): Promise<void> {
    // 1. Delete from Supabase REST directly (so marketplace doesn't reload it)
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${productId}`, {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });
        console.info(`Product ${productId} deleted directly from Supabase`);
      } catch (sbErr) {
        console.warn("Supabase direct product delete error:", sbErr);
      }
    }

    // 2. Dual Delete from Backend API
    try {
      const res = await fetch(`${getBackendUrl()}/api/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      if (res.ok) {
        console.info(`Product ${productId} deleted from backend API`);
      }
    } catch (backendErr) {
      console.warn("Backend product delete error:", backendErr);
    }
  }

  export async function fetchPublishedProducts(userId: number, userName?: string, userPhone?: string): Promise<CraftProduct[]> {
    const publishedList: CraftProduct[] = [];
    const seenIds = new Set<number>();

    // 1. Fetch from Supabase direct REST (never sleeps, persists across devices)
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const queries = [`owner_user_id=eq.${userId}`];
      if (userName && userName.trim()) {
        queries.push(`artisan_name=eq.${encodeURIComponent(userName.trim())}`);
      }
      for (const query of queries) {
        try {
          const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/products?${query}&order=id.desc`, {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
          });
          if (sbRes.ok) {
            const rows = await sbRes.json();
            if (Array.isArray(rows)) {
              for (const r of rows) {
                if (!seenIds.has(r.id)) {
                  seenIds.add(r.id);
                  let parsedTags: string[] = [];
                  try {
                    parsedTags = typeof r.tags === 'string' ? JSON.parse(r.tags) : (r.tags || []);
                  } catch {
                    parsedTags = [r.category || 'Handicraft'];
                  }
                  publishedList.push({
                    id: r.id,
                    name: r.name,
                    artisan_name: r.artisan_name,
                    artisan_phone: r.artisan_phone,
                    artisan_location: r.artisan_location,
                    category: r.category,
                    price: Number(r.price),
                    quantity: Number(r.quantity || 1),
                    suggested_price_min: r.suggested_price_min ? Number(r.suggested_price_min) : undefined,
                    suggested_price_max: r.suggested_price_max ? Number(r.suggested_price_max) : undefined,
                    price_justification: r.price_justification,
                    description_en: r.description_en,
                    description_hi: r.description_hi,
                    tags: parsedTags,
                    image_url: r.image_url,
                    image_gallery: typeof r.image_gallery === 'string' ? JSON.parse(r.image_gallery) : (r.image_gallery || [r.image_url]),
                    rating: r.rating ? Number(r.rating) : 4.8,
                    reviews: typeof r.reviews === 'string' ? JSON.parse(r.reviews) : (r.reviews || []),
                    is_enhanced: Boolean(r.is_enhanced),
                    mosje_verified: Boolean(r.mosje_verified),
                    owner_user_id: r.owner_user_id || userId
                  });
                }
              }
            }
          }
        } catch (subErr) {
          // ignore individual subquery error
        }
      }
    }

    // 2. Dual check Backend API
    try {
      const res = await fetch(`${getBackendUrl()}/api/products/${userId}/published`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.products)) {
          for (const p of data.products) {
            if (!seenIds.has(p.id)) {
              seenIds.add(p.id);
              publishedList.push(p);
            }
          }
        }
      }
    } catch (err) {
      console.warn("Backend fetch published error:", err);
    }

    // 3. Merge locally stored published products from AsyncStorage
    try {
      const localSaved = await AsyncStorage.getItem(`@kalasetu_my_published_${userId}`);
      if (localSaved) {
        const parsed: CraftProduct[] = JSON.parse(localSaved);
        if (Array.isArray(parsed)) {
          for (const p of parsed) {
            if (!seenIds.has(p.id)) {
              seenIds.add(p.id);
              publishedList.push(p);
            }
          }
        }
      }
    } catch (e) {
      console.warn("Local storage published error:", e);
    }

    // Save back to AsyncStorage for instant offline reload
    try {
      if (publishedList.length > 0) {
        await AsyncStorage.setItem(`@kalasetu_my_published_${userId}`, JSON.stringify(publishedList));
      }
    } catch {}

    return publishedList;
  }

  export async function fetchOrdersForUser(userId: number): Promise<OrderRecord[]> {
    try {
      const res = await fetch(`${getBackendUrl()}/api/orders/${userId}`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        const serverOrders: OrderRecord[] = (data.orders || []).map((row: any) => ({
          id: row.id,
          productId: row.product_id,
          productName: row.product_name,
          price: Number(row.total || row.price || 0),
          status: String(row.status || 'Confirmed'),
          eta: row.eta || '2-4 working days',
          customerName: row.buyer_name || 'Verified Buyer',
          quantity: Number(row.quantity || 1)
        }));
        await AsyncStorage.setItem(`@kalasetu_orders_${userId}`, JSON.stringify(serverOrders)).catch(() => {});
        return serverOrders;
      }
    } catch (err) {
      console.warn('Falling back to local cached orders:', err);
    }

    // Check local storage for persistent orders on this device
    try {
      const cached = await AsyncStorage.getItem(`@kalasetu_orders_${userId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}

    return [
      {
        id: 101,
        productId: 1,
        productName: 'Terracotta Hand-Painted Surahi',
        price: 650,
        status: 'In Transit',
        eta: 'Tomorrow',
        customerName: 'Aarav Sharma',
        quantity: 1
      },
      {
        id: 102,
        productId: 3,
        productName: 'Mirrorwork Wall Hanging',
        price: 1400,
        status: 'Packed',
        eta: '2 days',
        customerName: 'Aarav Sharma',
        quantity: 1
      }
    ];
  }

  export async function cancelOrderApi(orderId: number, reason: string): Promise<CancelOrderResponse | null> {
    const cleanReason = reason.trim() || 'Cancelled by buyer';
    try {
      const res = await fetch(`${getBackendUrl()}/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cleanReason })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn("Backend cancel order error:", err);
    }
    return { status: 'success', order_id: orderId, restored_quantity: 1, reason: cleanReason, localOnly: true };
  }

  export async function deleteOrderApi(orderId: number, userId?: number): Promise<boolean> {
    // 1. Delete from Backend API
    try {
      await fetch(`${getBackendUrl()}/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      console.warn("Backend delete order error:", err);
    }

    // 2. Delete from Supabase if table exists
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });
      } catch {}
    }

    // 3. Update local AsyncStorage cache
    if (userId) {
      try {
        const cached = await AsyncStorage.getItem(`@kalasetu_orders_${userId}`);
        if (cached) {
          const list: OrderRecord[] = JSON.parse(cached);
          const filtered = list.filter(o => o.id !== orderId);
          await AsyncStorage.setItem(`@kalasetu_orders_${userId}`, JSON.stringify(filtered));
        }
      } catch {}
    }

    return true;
  }

  export async function fetchIncomingOrders(userId: number): Promise<OrderRecord[]> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${userId}/incoming`, { method: 'GET' });
      if (!res.ok) {
        throw new Error('Incoming orders unavailable');
      }
      const data = await res.json();
      return (data.orders || []).map((row: any) => ({
        id: row.id,
        productId: row.product_id,
        productName: row.product_name,
        price: Number(row.total || row.price || 0),
        quantity: Number(row.quantity || 1),
        status: String(row.status || 'Confirmed'),
        eta: row.eta || '2-4 working days',
        customerName: row.recipient_name || row.buyer_name || 'Verified Buyer',
        customerPhone: row.recipient_phone || row.buyer_phone || '',
        buyerEmail: row.buyer_email || '',
        deliveryAddress: row.address_line || '',
        city: row.city || '',
        state: row.state || '',
        pincode: row.pincode || '',
        cancelReason: row.cancel_reason || '',
        createdAt: row.created_at || ''
      }));
    } catch (err) {
      console.warn('Could not load incoming orders:', err);
      return [];
    }
  }

  export async function updateOrderStatusApi(
    orderId: number,
    userId: number,
    status: 'Accepted' | 'Rejected' | 'Dispatched' | 'Delivered',
    note: string = ''
  ): Promise<{ status: string; order_id: number; new_status: string }> {
    const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, status, note })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || 'Could not update order status');
    }
    return await res.json();
  }

  export interface InstitutionalRfqAiResult {
    product_name: string;
    category: string;
    hsn_code: string;
    gst_rate: string;
    institutional_description: string;
    packaging_and_customization: string;
    quality_assurance: string;
    suggested_unit_price: number;
    suggested_lead_time: string;
    ai_engine?: string;
    is_ai_simulated?: boolean;
  }

  export async function generateInstitutionalRfqApi(
    craftHint: string,
    category: string = '',
    targetBuyer: string = 'Corporate & Government',
    imageBase64?: string
  ): Promise<InstitutionalRfqAiResult> {
    const res = await fetch(`${getBackendUrl()}/api/ai/institutional-rfq`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        craft_hint: craftHint,
        category,
        target_buyer: targetBuyer,
        image_base64: imageBase64
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to generate institutional RFQ');
    }
    return await res.json();
  }
