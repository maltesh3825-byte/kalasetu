# KalaSetu: AI-Driven Market Linkage & Smart Cataloging for Artisans

> **Smart India Hackathon 2026** | **Problem Statement ID: SIH26090**  
> **Ministry / Organization:** Ministry of Social Justice & Empowerment (MoSJE)  
> **Theme:** Heritage & Culture | **Category:** Software  
> **Target Audience:** Rural Micro-Entrepreneurs, Traditional Weavers, & Marginalized Craft Clusters

---

##  Executive Summary & Problem Fit

Traditional Indian artisans face steep digital barriers:
- **Literacy & Language:** Inability to write optimized product titles, English/Hindi descriptions, and SEO tags.
- **Fair Pricing & Exploitation:** Lack of market visibility leads to exploitation by middlemen.
- **Digital Access & Commerce:** Fragmented channels prevent direct connections with urban retail buyers and institutional bulk procurement (GeM, ONDC, Corporate Gifting).

**KalaSetu (कलासेतु)** bridges this gap with an intuitive, multimodal AI studio and unified marketplace. Artisans simply photograph their craft and speak in their native tongue. Google Gemini Vision immediately analyzes the craftsmanship, identifies the cultural heritage cluster, generates multilingual catalogs, suggests fair market pricing, and lists the product for retail and institutional buyers across India.

---

##  Key Platform Capabilities

| Capability | How KalaSetu Solves It |
| :--- | :--- |
| **Multimodal AI Cataloging** | Snaps craft photos and runs Google Gemini Vision to generate titles, dual-language descriptions (English & Hindi), tags, and material breakdown in under 5 seconds. |
| **Voice-First Input** | Artisans describe crafts naturally in regional Indian languages (Kannada, Hindi, etc.) with real-time speech-to-text. |
| **Fair Pricing Engine** | AI estimates fair retail & wholesale price bands based on craft technique, labor time, and material value. |
| **Direct Buyer Marketplace** | Consumers browse verified craft clusters, view artisan story cards, and place orders directly with 100% transparent proceeds. |
| **Institutional & Bulk RFQs** | Corporate buyers and government bodies submit bulk RFQs with lead times and target pricing, with GeM/ONDC export readiness. |
| **Zero-Friction Authentication** | Passwordless login via Gmail OTP, SMS OTP, or 1-click demo accounts with persistent sessions. |
| **Offline-First Resilience** | Catalog drafts and RFQs are stored locally in areas with low connectivity and auto-synced upon reconnect. |
| **Full Lifecycle Account Portal** | Artisans and buyers share a unified workspace to track live inventory, customer orders, buyer requests, wishlist, and notifications. |

---

## 🏗️ Architecture & Technology Stack

```
                                  ┌───────────────────────────┐
                                  │   Expo / React Native     │
                                  │   Android Mobile App      │
                                  └─────────────┬─────────────┘
                                                │
┌───────────────────────────┐                   │ REST / Supabase API
│    Static Web Frontend    │                   ▼
│   HTML5 / Tailwind / JS   ├─────────► ┌───────────────────────────┐
└───────────────────────────┘           │     FastAPI Backend       │
                                        │  (Render / Local Python)  │
                                        └─────────────┬─────────────┘
                                                      │
                       ┌──────────────────────────────┼──────────────────────────────┐
                       ▼                              ▼                              ▼
             ┌───────────────────┐          ┌───────────────────┐          ┌───────────────────┐
             │  Google Gemini    │          │     Supabase      │          │   SQLite Local    │
             │   Vision 1.5/2.0  │          │   Cloud Database  │          │    Persistence    │
             └───────────────────┘          └───────────────────┘          └───────────────────┘
```

- **Mobile App:** React Native, Expo SDK 52, TypeScript, EAS Build (APK target).
- **Web App:** Semantic HTML5, Tailwind CSS, Vanilla JS, Web Speech API.
- **Backend API:** FastAPI (Python 3.10+), Pydantic v2, Uvicorn.
- **AI Vision Engine:** Google Gemini Vision (gemini-1.5-flash / gemini-2.5) with direct cloud fallback.
- **Cloud & Data:** Supabase PostgreSQL + SQLite local store, instant sync.

---

##  Project Repository Structure

```
artisan-market-linkage/
├── backend/
│   ├── main.py               # FastAPI application, auth, marketplace & order routes
│   ├── ai_service.py         # Google Gemini Vision craft analysis engine
│   ├── config.py             # App configuration, credentials, and model selector
│   ├── database.py           # SQLite initialization & schema definitions
│   └── email_service.py      # Resend & Brevo transactional email/OTP dispatch
├── mobile-app/
│   ├── App.tsx               # Main mobile application (tabs, camera, offline store)
│   ├── app.json              # Expo configuration & EAS project metadata
│   ├── eas.json              # EAS cloud build profiles (APK preview & production)
│   └── services/
│       └── api.ts            # Mobile API client, Gemini vision client & Supabase sync
├── static/
│   ├── index.html            # Web responsive single-page application
│   ├── css/style.css         # Heritage Terracotta & Sandstone design system
│   └── js/
│       ├── app.js            # Frontend application controller & state store
│       ├── i18n.js           # Multi-language dictionary (8 Indian languages)
│       └── voice.js          # Speech recognition and audio guide engine
├── app.py                    # Root backend launcher
├── requirements.txt          # Python dependencies
└── README.md                 # Judge & developer evaluation documentation
```

---

## 🚀 Quick Start & Evaluation Guide

### 1. Web Application & Backend

1. **Clone repository & enter directory:**
   ```bash
   git clone https://github.com/maltesh3825-byte/kalasetu.git
   cd kalasetu
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment (`.env`):**
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Launch Local Server:**
   ```bash
   python app.py
   ```
   * Open `http://localhost:8000` in your web browser.
   * Interactive OpenAPI documentation: `http://localhost:8000/docs`.

### 2. Android Mobile Application

1. **Navigate to mobile app directory:**
   ```bash
   cd mobile-app
   npm install
   ```

2. **Start Expo development server:**
   ```bash
   npx expo start
   ```
   * Scan the displayed QR code with the **Expo Go** app on Android or iOS.
   * Or download the compiled standalone APK from EAS cloud builds.

---

##  Demo Test Credentials

To quickly evaluate user journeys without registering:

| Role | Identifier / Email | Password | Features Accessible |
| :--- | :--- | :--- | :--- |
| **🎨 Artisan** | `artisan@kalakriti.in` | `artisan123` | AI Studio cataloging, stock management, incoming order fulfillment |
| **🛍️ Buyer** | `demo@kalakriti.in` | `demo123` | Marketplace browsing, direct purchasing, custom orders, wishlist |
| **🏛️ Admin** | `admin@kalakriti.in` | `admin123` | Institutional RFQ review queue, GeM/ONDC export staging |

*You can also verify any custom email or mobile number using the built-in instant OTP flow.*

---

## 🏛️ Alignment with Ministry (MoSJE) Goals

1. **Economic Empowerment:** Converts seasonal rural fair participation into 365-day year-round direct retail & B2B sales.
2. **Preserving Craft Heritage:** AI recognizes traditional techniques (e.g., Madhubani, Dhokra, Terracotta, Channapatna) and documents their GI & cultural origin.
3. **Inclusive Technology:** Voice recognition and AI descriptions dismantle literacy barriers for elderly and rural craftspeople.
4. **Transparent Supply Chain:** Direct artisan-to-buyer transactions eliminate exploitative intermediaries.
