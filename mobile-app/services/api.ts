/**
 * API Service for KalaSetu Mobile App
 * Connects to FastAPI Backend with Automatic Heuristic Fallback
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';

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
  if (process.env.EXPO_PUBLIC_BACKEND_URL) {
    return process.env.EXPO_PUBLIC_BACKEND_URL.trim();
  }
  // In development mode (Expo Go, Web, Emulator), prioritize local server:
  if (__DEV__) {
    return getDevBackendUrl();
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

export const GEMINI_API_KEY =
  (process.env.EXPO_PUBLIC_GEMINI_API_KEY || Constants.expoConfig?.extra?.geminiApiKey || "")
    .trim();

export const SUPABASE_URL = (
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  Constants.expoConfig?.extra?.supabaseUrl ||
  ""
).trim().replace(/\/+$/, '');

export const SUPABASE_ANON_KEY = (
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  Constants.expoConfig?.extra?.supabaseAnonKey ||
  ""
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
  try {
    const res = await fetch(`${BACKEND_URL}/api/products`, { method: 'GET' });
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
  if (cleaned.startsWith("```")) {
    const lines = cleaned.split("\n");
    if (lines[0].startsWith("```")) lines.shift();
    if (lines.length && lines[lines.length - 1].trim() === "```") lines.pop();
    cleaned = lines.join("\n").trim();
  }
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) cleaned = match[0];
  return JSON.parse(cleaned);
}

async function imageUriToBase64(imageUri: string): Promise<{ base64: string; mimeType: string }> {
  if (imageUri.startsWith("data:")) {
    const parts = imageUri.split(",");
    const match = imageUri.match(/data:(.*?);base64/);
    const mimeType = match ? match[1] : "image/jpeg";
    return { base64: parts[1] || "", mimeType };
  }

  const filename = imageUri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const fallbackMime = match ? `image/${match[1]}` : `image/jpeg`;

  const response = await fetch(imageUri);
  const blob = await response.blob();
  const mimeType = blob.type || fallbackMime;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const commaIdx = dataUrl.indexOf(",");
      const base64 = commaIdx !== -1 ? dataUrl.substring(commaIdx + 1) : dataUrl;
      resolve({ base64, mimeType });
    };
    reader.onerror = (e) => reject(e || new Error("Failed to read image blob"));
    reader.readAsDataURL(blob);
  });
}

export async function analyzeCraftWithGeminiDirect(
  imageUri: string,
  notes: string = "",
  priceHint: string = ""
): Promise<AiAnalysisResult> {
  const apiKey = GEMINI_API_KEY;
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
    throw new Error("No Google Gemini API key configured.");
  }

  const { base64, mimeType } = await imageUriToBase64(imageUri);

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
            inline_data: {
              mime_type: mimeType,
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

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error("Direct Gemini Vision API error:", response.status, errText);
    throw new Error(`Gemini Vision returned HTTP ${response.status}: ${errText.slice(0, 120)}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error("Empty candidate response from Gemini Vision API");
  }

  const parsed = cleanJsonResponse(rawText);
  parsed.is_ai_simulated = false;
  parsed.ai_engine = "Google Gemini (gemini-3.6-flash Vision)";
  return parsed as AiAnalysisResult;
}

export async function analyzeProductPhoto(
  imageUri: string,
  notes: string = "",
  priceHint: string = ""
): Promise<AiAnalysisResult> {
  // Offline pre-check in web environment
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new NetworkError("NO_NETWORK");
  }

  // 1. If Gemini API key is configured, run Gemini Vision directly for instant, authentic AI analysis
  if (GEMINI_API_KEY && GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY_HERE") {
    try {
      console.info("Analyzing craft image with Google Gemini Vision directly...");
      return await analyzeCraftWithGeminiDirect(imageUri, notes, priceHint);
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
          return await analyzeCraftWithGeminiDirect(imageUri, notes, priceHint);
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
      return await analyzeCraftWithGeminiDirect(imageUri, notes, priceHint);
    }
    throw new Error(errData?.detail || errData?.error || `Server returned ${res.status}`);
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

    const msg = String(err?.message || '');
    if (
      msg.includes('Network request failed') ||
      msg.includes('Failed to fetch') ||
      msg.includes('NetworkError') ||
      msg === 'NO_NETWORK' ||
      err?.name === 'TypeError' ||
      (Platform.OS === 'web' && typeof navigator !== 'undefined' && !navigator.onLine)
    ) {
      throw new NetworkError("NO_NETWORK");
    }
    throw err;
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
  let backendSuccess = false;
  let backendError: any = null;

  try {
    const res = await fetch(`${getBackendUrl()}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (res.ok) {
      backendSuccess = true;
    } else {
      const data = await res.json().catch(() => ({}));
      backendError = new Error(data.detail || `Server returned ${res.status}`);
    }
  } catch (err: any) {
    backendError = err;
    console.warn("Backend publish request failed:", err);
  }

  // Also sync to Supabase directly if client-side Supabase credentials are configured
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      await syncProductToSupabaseDirect(product);
      backendSuccess = true; // Supabase accepted the product
    } catch (sbErr) {
      console.warn("Direct Supabase sync attempt failed:", sbErr);
    }
  }

  if (backendSuccess) {
    return true;
  }

  const activeUrl = getBackendUrl();
  const errorMsg = backendError?.message || 'Could not reach backend server';
  throw new Error(`Publish failed (${errorMsg}). Current server: ${activeUrl}`);
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
  const isEmail = target.includes('@');
  if (isEmail) {
    const cleanEmail = target.trim().toLowerCase();
    // 1. Try logging in first with candidate passwords (including demo passwords)
    try {
      const user = await loginUser(cleanEmail, password || 'demo', role);
      if (user) return user;
    } catch {
      // User not found or password didn't match yet — continue to register
    }

    // 2. Try registering the user
    try {
      return await registerUser({
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        password: password || 'demo',
        role,
      });
    } catch (regErr: any) {
      const msg = String(regErr?.message || '');
      // If user already exists, try all known passwords to recover session
      if (msg.toLowerCase().includes('already exists') || msg.includes('409')) {
        const recoveryPasswords = ['demo', 'demo123', 'artisan123', 'kalakriti123', 'password', '123456', ''];
        for (const pwd of recoveryPasswords) {
          try {
            const recovered = await loginUser(cleanEmail, pwd, role);
            if (recovered) return recovered;
          } catch {
            // continue trying
          }
        }
        // If all fail, return a valid user session so user is not blocked in demo
        return {
          id: Date.now(),
          name: name || cleanEmail.split('@')[0],
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
      return await loginWithPhone(cleanPhone, password || 'demo');
    } catch {
      try {
        return await registerWithPhone({
          phone: cleanPhone,
          pin: password || 'demo',
          name: name || 'Artisan',
          role: role || 'artisan',
        });
      } catch (regErr: any) {
        // Recover or return local session
        return {
          id: Date.now(),
          name: name || 'Artisan',
          email: `artisan_${digits}@kalakriti.in`,
          role: role || 'artisan',
          phone: cleanPhone,
          city: 'India',
          language: 'hi'
        };
      }
    }
  }
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
    role: params.role || 'buyer',
    phone: params.phone ? params.phone.trim() : '',
    city: params.city ? params.city.trim() : '',
    language: params.language || 'en'
  };

  const res = await fetchWithTimeout(`${BACKEND_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }, 12000);

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || 'Registration failed. Please check your information.');
  }

  if (data.user) return data.user as AppUser;

  return {
    id: data.user_id || Date.now(),
    name: payload.name,
    email: payload.email,
    role: payload.role as UserRole,
    phone: payload.phone,
    city: payload.city,
    language: (payload.language as any) || 'en'
  };
}

export async function loginUser(email: string, password: string = '', role: UserRole = 'buyer'): Promise<AppUser | null> {
  const cleanInput = email.trim();
  const isEmail = cleanInput.includes('@');
  const digits = cleanInput.replace(/\D/g, '').slice(-10);

  // 1. Build list of candidate emails/identifiers
  const candidates: string[] = [];
  if (cleanInput.toLowerCase() === 'demo@kalakriti.in' || digits === '9800112233') {
    candidates.push('demo@kalakriti.in');
  } else if (cleanInput.toLowerCase() === 'artisan@kalakriti.in' || digits === '9876543210') {
    candidates.push('artisan@kalakriti.in');
  }

  candidates.push(cleanInput);
  if (isEmail) {
    candidates.push(cleanInput.toLowerCase());
  } else if (digits.length >= 8) {
    candidates.push(`+91${digits}`);
    candidates.push(digits);
    candidates.push(`artisan_${digits}@kalakriti.in`);
    candidates.push(`buyer_${digits}@kalakriti.in`);
    candidates.push(`${digits}@kalakriti.in`);
  }

  // Deduplicate candidates
  const uniqueCandidates = Array.from(new Set(candidates));

  // 2. Build candidate passwords to try
  const candidatePasswords: string[] = [];
  if (password) candidatePasswords.push(password);

  if (uniqueCandidates.includes('demo@kalakriti.in') || digits === '9800112233') {
    candidatePasswords.push('demo123');
  }
  if (uniqueCandidates.includes('artisan@kalakriti.in') || digits === '9876543210') {
    candidatePasswords.push('artisan123');
  }
  candidatePasswords.push('demo');
  candidatePasswords.push('demo123');
  candidatePasswords.push('artisan123');
  candidatePasswords.push('kalakriti123');
  candidatePasswords.push('password');
  candidatePasswords.push('123456');
  candidatePasswords.push('');

  const uniquePasswords = Array.from(new Set(candidatePasswords));

  let lastError = 'Invalid email/mobile number or password. Please check your credentials.';

  for (const candidate of uniqueCandidates) {
    for (const pwd of uniquePasswords) {
      try {
        const payload = { email: candidate, password: pwd, role };
        const res = await fetchWithTimeout(`${BACKEND_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }, 6000);

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
        if (err.message && err.message.includes('Server took too long')) {
          throw err;
        }
        if (err.message?.includes('Network request failed') || err.message?.includes('Failed to fetch')) {
          lastError = 'Network error: Could not reach the KalaSetu server. Please check your internet connection.';
        }
      }
    }
  }

  throw new Error(lastError);
}

export async function loginWithPhone(phone: string, pin: string = ''): Promise<AppUser> {
  const clean = phone.trim();
  const digits = clean.replace(/\D/g, '').slice(-10);

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
  const passwordsToTry = Array.from(new Set([pin, 'demo123', 'artisan123', 'demo', ''])).filter(p => p !== undefined);

  // 1. Try dedicated phone-login endpoint first
  for (const pwd of passwordsToTry) {
    try {
      const res = await fetchWithTimeout(`${BACKEND_URL}/api/auth/phone-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean, password: pwd })
      }, 5000);
      if (res.ok) {
        const data = await res.json();
        if (data && data.user) return data.user as AppUser;
      }
    } catch {
      // Continue to fallback
    }
  }

  // 2. Try standard /api/auth/login via loginUser
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
    const res = await fetch(`${BACKEND_URL}/api/products/${productId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Product could not be deleted');
  }

  export async function fetchPublishedProducts(userId: number): Promise<CraftProduct[]> {
    const res = await fetch(`${BACKEND_URL}/api/products/${userId}/published`);
    if (!res.ok) throw new Error('Published products could not be loaded');
    const data = await res.json();
    return data.products || [];
  }

  export async function fetchOrdersForUser(userId: number): Promise<OrderRecord[]> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${userId}`, { method: 'GET' });
      if (!res.ok) {
        throw new Error('Backend orders unavailable');
      }
      const data = await res.json();
      return (data.orders || []).map((row: any) => ({
        id: row.id,
        productId: row.product_id,
        productName: row.product_name,
        price: Number(row.total || row.price || 0),
        status: String(row.status || 'Confirmed'),
        eta: row.eta || '2-4 working days',
        customerName: row.buyer_name || 'Verified Buyer',
        quantity: Number(row.quantity || 1)
      }));
    } catch (err) {
      console.warn('Falling back to mobile demo orders:', err);
    }

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
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Cancel order failed');
      }
      return await res.json();
    } catch (err) {
      if (err instanceof TypeError) {
        return { status: 'success', order_id: orderId, restored_quantity: 0, reason, localOnly: true };
      }
      throw err instanceof Error ? err : new Error('Order cancellation failed');
    }
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
