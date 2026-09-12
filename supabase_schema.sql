-- =============================================================================
-- KalaSetu / KalaKriti - Supabase PostgreSQL Database Schema
-- Smart India Hackathon 2026 - Problem Statement SIH26090
-- Ministry of Social Justice and Empowerment (MoSJE)
-- =============================================================================
-- INSTRUCTIONS FOR ADMIN:
-- 1. Log in to your Supabase project (https://app.supabase.com).
-- 2. Go to "SQL Editor" in the left sidebar.
-- 3. Paste this entire file and click "Run" (Cmd+Enter / Ctrl+Enter).
-- 4. All tables, constraints, indexes, and demo data will be created instantly.
-- 5. You can view, search, and edit records anytime in the "Table Editor".
-- =============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    artisan_name TEXT NOT NULL,
    artisan_phone TEXT DEFAULT '+919876543210',
    artisan_location TEXT NOT NULL,
    category TEXT NOT NULL,
    price INTEGER NOT NULL,
    suggested_price_min INTEGER,
    suggested_price_max INTEGER,
    price_justification TEXT,
    description_en TEXT NOT NULL,
    description_hi TEXT,
    tags TEXT NOT NULL,
    image_url TEXT NOT NULL,
    image_gallery TEXT DEFAULT '[]',
    rating REAL DEFAULT 4.5,
    reviews TEXT DEFAULT '[]',
    is_enhanced INTEGER DEFAULT 0,
    mosje_verified INTEGER DEFAULT 1,
    quantity INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_artisan ON products(LOWER(artisan_name));

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'buyer',
    phone TEXT,
    city TEXT,
    language TEXT DEFAULT 'en',
    business_name TEXT,
    gst_number TEXT,
    udyam_number TEXT,
    document_verification_status TEXT DEFAULT 'pending',
    bank_status TEXT DEFAULT 'not_uploaded',
    profile_completion REAL DEFAULT 0.25,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));

-- 3. WISHLIST TABLE
CREATE TABLE IF NOT EXISTS wishlist (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- 4. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    status TEXT DEFAULT 'Confirmed',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_product ON orders(product_id);

-- 5. INSTITUTIONAL REQUESTS TABLE (Bulk B2B Moderation Queue)
CREATE TABLE IF NOT EXISTS institutional_requests (
    id SERIAL PRIMARY KEY,
    artisan_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    product_category TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    target_market TEXT DEFAULT 'Open to all',
    requirements TEXT,
    status TEXT DEFAULT 'New',
    admin_notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inst_requests_status ON institutional_requests(status);

-- =============================================================================
-- SEED DATA (Authentic Handicrafts & Demo Accounts)
-- =============================================================================

-- Seed Demo Users if not already present
INSERT INTO users (name, email, password, role, phone, city, language)
VALUES 
    ('Aarav Sharma', 'demo@kalakriti.in', 'pbkdf2$sha256$100000$87d19e4a3b2c1f0e$9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b', 'buyer', '+919800112233', 'Bhopal, Madhya Pradesh', 'en'),
    ('Seema Devi', 'artisan@kalakriti.in', 'pbkdf2$sha256$100000$1a2b3c4d5e6f7a8b$0f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0f1e', 'artisan', '+919876543210', 'Madhubani, Bihar', 'hi')
ON CONFLICT (email) DO NOTHING;

-- Seed Sample Handicraft Products
INSERT INTO products (name, artisan_name, artisan_phone, artisan_location, category, price, suggested_price_min, suggested_price_max, price_justification, description_en, description_hi, tags, image_url, image_gallery, rating, quantity)
VALUES 
(
    'Authentic Bastar Dhokra Bell Metal Elephant',
    'Budhram Baghel',
    '+919876543210',
    'Bastar, Chhattisgarh',
    'Brass & Metalcraft',
    1850,
    1600,
    2200,
    '4000-year-old lost-wax casting technique requiring 4 days of manual sculpting and bell metal smelting.',
    'Handcrafted Bastar Dhokra elephant figurine created using the ancient lost-wax brass casting technique. Natural antique brass patina finish.',
    'प्राचीन लॉस्ट-वैक्स धातु ढलाई तकनीक से बस्तर के जनजातीय कारीगरों द्वारा हस्तनिर्मित ढोकरा हाथी।',
    '["Dhokra", "BastarCraft", "LostWax", "Handmade", "TribalArt"]',
    'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80',
    '[]',
    4.9,
    8
),
(
    'Natural Indigo Bhagalpur Tussar Silk Saree',
    'Manjula Ansari',
    '+919811223344',
    'Bhagalpur, Bihar',
    'Handloom & Textiles',
    3450,
    3000,
    4200,
    'Handspun pure Tussar wild silk woven over 12 days with authentic fermented natural indigo plant dye.',
    'Pure handloom Bhagalpur Tussar wild silk saree naturally hand-dyed with organic indigo. Breathable texture with rich traditional border.',
    'भागलपुर की शुद्ध तसर रेशम साड़ी। प्राकृतिक नील से रंगी गई पारंपरिक हथकरघा बुनाई।',
    '["TussarSilk", "Bhagalpur", "Handloom", "NaturalIndigo", "Organic"]',
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    '[]',
    4.8,
    5
),
(
    'Khurja Hand-Painted Blue Pottery Tea Set',
    'Mohammad Aslam',
    '+919822334455',
    'Khurja, Uttar Pradesh',
    'Pottery & Terracotta',
    1250,
    1100,
    1600,
    'Fired in wood kilns at 1200°C with lead-free food-grade mineral glaze and hand-painted Persian motifs.',
    'Handcrafted ceramic tea pot with 4 matching cups hand-painted in traditional Khurja cobalt blue floral patterns. 100% lead-free and microwave-safe.',
    'खुर्जा के कुशल कुम्हारों द्वारा हस्तनिर्मित और प्राकृतिक खनिजों से रंगा हुआ सिरेमिक टी-सेट।',
    '["KhurjaPottery", "Ceramics", "BluePottery", "EcoFriendly"]',
    'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    '[]',
    4.7,
    12
)
ON CONFLICT DO NOTHING;
 
-- 8. SEED DEMO ACCOUNTS
INSERT INTO users (name, email, password, role, phone, city, language)
VALUES
    ('Aarav Sharma', 'demo@kalakriti.in', 'demo123', 'buyer', '+919800112233', 'Bhopal, Madhya Pradesh', 'en'),
    ('Seema Devi', 'artisan@kalakriti.in', 'artisan123', 'artisan', '+919876543210', 'Madhubani, Bihar', 'hi')
ON CONFLICT (email) DO NOTHING;

