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
const getDevBackendUrl = () => {
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

const configuredBackendUrl =
  Constants.expoConfig?.extra?.backendUrl ||
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  (__DEV__ ? getDevBackendUrl() : 'https://kalakriti-api-nmnz.onrender.com');

export const BACKEND_URL = configuredBackendUrl;

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

export async function analyzeProductPhoto(
  imageUri: string,
  notes: string = "",
  priceHint: string = ""
): Promise<AiAnalysisResult> {
  // Offline pre-check in web environment
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new NetworkError("NO_NETWORK");
  }

  try {
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    if (Platform.OS === 'web' && (imageUri.startsWith('blob:') || imageUri.startsWith('data:'))) {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      formData.append('file', blob, filename);
    } else {
      // @ts-ignore: React Native FormData file format
      formData.append('file', { uri: imageUri, name: filename, type });
    }
    if (notes) formData.append('notes', notes);
    if (priceHint) formData.append('price_hint', priceHint);

    const res = await fetch(`${BACKEND_URL}/api/analyze-product`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      }
    });

    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json().catch(() => ({}));
    console.warn("Backend vision API returned HTTP error:", res.status, errData);
    throw new Error(errData?.detail || `Server returned ${res.status}`);
  } catch (err: any) {
    console.warn("Error calling backend vision API:", err);
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

export async function publishProductToApi(product: Omit<CraftProduct, 'id'>): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || 'Product could not be published');
    }
    return true;
  } catch (err) {
    if (err instanceof TypeError) {
      console.warn("Could not publish to backend, saved locally:", err);
      return true;
    }
    throw err instanceof Error ? err : new Error('Product could not be published');
  }
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

export async function sendOtpApi(identifier: string, name: string = ''): Promise<SendOtpResponse> {
  const isEmail = identifier.includes('@');
  const payload = isEmail ? { email: identifier.trim().toLowerCase(), name } : { phone: identifier.trim(), name };
  try {
    const res = await fetchWithTimeout(`${BACKEND_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, 12000);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.detail || 'Could not send verification code.');
    }
    return data as SendOtpResponse;
  } catch (err: any) {
    if (err.message?.includes('Not Found') || err.message?.includes('404')) {
      throw new Error('OTP service is updating. Please sign in or register directly using your password/PIN.');
    }
    throw err;
  }
}

export async function verifyOtpApi(
  target: string,
  otp: string,
  password: string = '1234',
  name: string = 'Artisan',
  role: UserRole = 'artisan'
): Promise<AppUser> {
  const isEmail = target.includes('@');
  const payload = {
    email: isEmail ? target.trim().toLowerCase() : '',
    phone: isEmail ? '' : target.trim(),
    otp: otp.trim(),
    password,
    name,
    role
  };
  const res = await fetchWithTimeout(`${BACKEND_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }, 10000);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.user) {
    throw new Error(data.detail || 'Invalid or expired verification code.');
  }
  return data.user as AppUser;
}

export async function registerUser(params: {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  phone?: string;
  city?: string;
  language?: string;
}): Promise<AppUser> {
  const payload = {
    name: params.name.trim(),
    email: params.email.trim().toLowerCase(),
    password: params.password,
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

  // After registration, log the user in immediately to get the complete AppUser profile
  const loggedIn = await loginUser(payload.email, payload.password, payload.role as UserRole);
  if (loggedIn) return loggedIn;

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

export async function loginUser(email: string, password: string, role: UserRole = 'buyer'): Promise<AppUser | null> {
  const cleanInput = email.trim();
  const isEmail = cleanInput.includes('@');
  const digits = cleanInput.replace(/\D/g, '').slice(-10);

  // Candidates to try (primary email, phone number variants, synthetic emails from web registrations)
  const candidates = [cleanInput];
  if (!isEmail && digits.length >= 8) {
    candidates.push(`+91${digits}`);
    candidates.push(digits);
    candidates.push(`artisan_${digits}@kalakriti.in`);
    candidates.push(`buyer_${digits}@kalakriti.in`);
    candidates.push(`${digits}@kalakriti.in`);
  }

  let lastError = 'Invalid email or password. If you signed up on the website, try using Gmail OTP tab to access your account.';

  for (const candidate of candidates) {
    try {
      const payload = { email: candidate, password, role };
      const res = await fetchWithTimeout(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }, 12000);

      if (res.ok) {
        const data = await res.json();
        if (data && data.user) {
          return data.user as AppUser;
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        if (errData.detail && typeof errData.detail === 'string') {
          lastError = errData.detail + '\n\nTip: Try the Gmail OTP tab if you forgot your password.';
        }
      }
    } catch (err: any) {
      if (err.message && err.message.includes('Server took too long')) {
        throw err;
      }
      // Network / CORS error — give a clear message
      if (err.message?.includes('Network request failed') || err.message?.includes('Failed to fetch')) {
        lastError = 'Network error: Could not reach the KalaSetu server. Please check your internet connection and try again.';
      } else {
        lastError = err.message || 'Network error during login.';
      }
    }
  }

  throw new Error(lastError || 'Invalid email or password.');
}

export async function loginWithPhone(phone: string, pin: string): Promise<AppUser> {
  const clean = phone.trim();
  const digits = clean.replace(/\D/g, '').slice(-10);

  // 1. Try dedicated phone-login endpoint first
  try {
    const res = await fetchWithTimeout(`${BACKEND_URL}/api/auth/phone-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: clean, password: pin })
    }, 8000);
    if (res.ok) {
      const data = await res.json();
      if (data && data.user) return data.user as AppUser;
    }
  } catch (err: any) {
    // If phone-login returned 404 or timed out, continue to fallback
  }

  // 2. Try standard /api/auth/login with normalized phone or synthetic email
  const candidates = [
    clean,
    `+91${digits}`,
    digits,
    `artisan_${digits}@kalakriti.in`,
    `buyer_${digits}@kalakriti.in`,
    `${digits}@kalakriti.in`
  ];

  for (const emailCandidate of candidates) {
    try {
      const res = await fetchWithTimeout(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailCandidate, password: pin })
      }, 7000);

      if (res.ok) {
        const data = await res.json();
        if (data && data.user) return data.user as AppUser;
      }
    } catch (err) {
      // Continue to next candidate
    }
  }

  throw new Error('Invalid mobile number or PIN. If you are a new user, please use "Create Account".');
}

export async function registerWithPhone(params: {
  phone: string;
  pin: string;
  name: string;
  role?: UserRole;
  city?: string;
  language?: string;
}): Promise<AppUser> {
  const cleanPhone = params.phone.trim();
  const digits = cleanPhone.replace(/\D/g, '').slice(-10);

  // 1. Try phone-register endpoint
  try {
    const res = await fetchWithTimeout(`${BACKEND_URL}/api/auth/phone-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: cleanPhone,
        password: params.pin,
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

  // 2. Fallback to standard /api/auth/register (supported on all backend versions)
  const syntheticEmail = `${params.role === 'buyer' ? 'buyer' : 'artisan'}_${digits}@kalakriti.in`;
  return await registerUser({
    name: params.name,
    email: syntheticEmail,
    password: params.pin,
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
