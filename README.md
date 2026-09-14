# KalaSetu: Artisan Marketplace and Cataloging Platform

**Smart India Hackathon 2026** | **Problem Statement ID: SIH26090**  
**Organization**: Ministry of Social Justice and Empowerment (MoSJE)  
**Theme**: Heritage & Culture | **Category**: Software

---

## Executive Summary

Rural and marginalized micro-entrepreneurs, weavers, and traditional artisans in India face barriers in digital access, language support, and product presentation. KalaSetu supports artisans with a simple workflow for capturing product photos, describing craft details, reviewing catalog content, and publishing directly to a marketplace.

The platform includes:
1. A low-friction artisan studio with camera upload and voice or text notes.
2. Product analysis for category detection, catalog text generation, and pricing guidance.
3. A marketplace for publishing and browsing craft listings.
4. Direct buyer inquiry and order workflows.
5. Role-based access for artisans, buyers, and admin workflows.

---

## Environment Setup

The application reads the Gemini API key from the project environment:

### Method 1: In `.env`
Open the `.env` file in the project root directory:
```env
# artisan-market-linkage/.env
GEMINI_API_KEY=your_gemini_api_key_here
```

Use a local environment variable or a `.env` file and do not commit API keys to source control.

---

## Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 20+
- Expo Go on an Android or iOS device

### Run the mobile app
1. Start the backend and Expo together on Windows:
   ```powershell
   .\run_mobile.bat
   ```
2. Or run Expo manually:
   ```powershell
   cd mobile-app
   npm install
   npm start
   ```
3. Scan the QR code with Expo Go.

For mobile testing on a physical device, set the LAN address before starting Expo:
```powershell
$env:EXPO_PUBLIC_BACKEND_URL="http://192.168.1.5:8000"
npm start
```

### Run the web interface
```powershell
npm run web
```

### Run the backend manually
1. Open a terminal in the project folder:
   ```bash
   cd C:\Users\MALATESH\.gemini\antigravity\scratch\artisan-market-linkage
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the application:
   ```bash
   python app.py
   ```
4. Open the local URL shown in the terminal or visit `/docs` for the API documentation.

---

## Project Workflow

1. Sign in or create an artisan profile.
2. Capture or upload a clear image of the product.
3. Add product details using voice or text notes.
4. Review the generated title, category, tags, and description.
5. Check pricing guidance and edit the listing if needed.
6. Publish the product to the marketplace.
7. Manage orders, buyer inquiries, and profile data.

---

## Architecture and File Structure

```
artisan-market-linkage/
├── backend/
│   ├── __init__.py
│   ├── config.py             # Environment and API configuration
│   ├── database.py           # Database setup and persistence
│   ├── ai_service.py         # Product analysis and catalog generation
│   └── main.py               # FastAPI application and API routes
├── static/
│   ├── index.html            # Web app entry point
│   ├── css/
│   │   └── style.css         # Styling and layout
│   └── js/
│       ├── app.js            # Frontend logic
│       ├── i18n.js           # Translation data
│       └── voice.js          # Speech support
├── uploads/                  # Uploaded product images
├── app.py                    # Application entry point
├── run.bat                   # Windows launch script
├── requirements.txt          # Python dependencies
├── .env.example              # Environment template
├── .env                      # Local runtime config
└── README.md                 # Project documentation
```

---

## Alignment with MoSJE Goals

| Goal | How KalaSetu Addresses It |
| :--- | :--- |
| Year-round digital sales | Provides an online storefront for artisan products beyond local fairs. |
| Reduced literacy barriers | Supports voice and text-based product description input. |
| Better product presentation | Helps artisans prepare cleaner, clearer product listings. |
| Fairer pricing | Provides pricing guidance to reduce under-pricing and dependency on intermediaries. |
| Direct buyer access | Connects artisans with buyers through direct inquiry and marketplace workflows. |
