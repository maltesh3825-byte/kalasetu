# AI-Powered Artisan Marketplace

| Field | Details |
|-------|---------|
| **Smart India Hackathon** | 2026 |
| **Problem Statement ID** | SIH26090 |
| **Problem Statement Title** | AI-Driven Market Linkage & Cataloging App for Marginalized Artisans |
| **Theme** | Heritage & Culture |
| **PS Category** | Software |
| **Team ID** | [Enter Team ID] |
| **Team Name** | KalaSetu |

---

## Idea Title

### KalaSetu: AI-Powered Voice-First Marketplace for Rural Artisans

---

## Proposed Solution

KalaSetu is a mobile-first artisan marketplace that helps rural and marginalized artisans convert handmade products into professional digital listings using photographs, voice input and multimodal AI.

An artisan can capture or upload a product image, describe the craft using voice or text, and receive an editable listing containing the product name, category, tags, English description, Hindi description and suggested price range. The artisan reviews and approves the content before publishing it directly to the marketplace.

Customers can discover handmade products, save crafts, submit ratings and reviews without a mandatory purchase, contact artisans directly and place orders.

> **From a craft photo to a market-ready listing in minutes.**

---

## Core Workflow

1. **Sign in** — Select an artisan, seller or buyer account.
2. **Capture** — Take a product photograph or select one from the gallery.
3. **Add voice or text notes** — Describe the product in Kannada or another supported language.
4. **Analyze** — Gemini Vision analyzes the image and artisan notes.
5. **Generate catalog** — Create the title, category, tags, descriptions and price guidance.
6. **Review and edit** — The artisan verifies and edits the AI-generated content.
7. **Publish** — Publish the approved product with quantity and pricing details.
8. **Sell** — Customers discover products, review them and submit orders.
9. **Manage** — Artisans manage listings, orders and customer requests.

---

## Key Features

- ✅ AI-powered product catalog generation
- ✅ Kannada voice-to-text input for artisan descriptions
- ✅ English catalog generation from regional-language notes
- ✅ Support for English, Hindi, Kannada, Telugu, Malayalam, Marathi, Tamil, Bihari and Bhojpuri
- ✅ Offline catalog and bulk-request drafts
- ✅ Direct artisan-to-customer marketplace access
- ✅ Product quantity controls and order limits
- ✅ Dynamic bulk pricing and quantity tiers
- ✅ Product ratings and reviews without mandatory purchase
- ✅ Artisan listing management and deletion
- ✅ Customer wishlist and activity history
- ✅ Admin login and institutional request moderation
- ✅ Order status tracking and cancellation
- ✅ WhatsApp contact option for direct artisan communication

---

## Problem Fit

KalaSetu addresses:

- Limited digital access among rural artisans
- Difficulty creating professional product descriptions
- Dependence on intermediaries
- Weak product presentation and inconsistent pricing
- Language and literacy barriers
- Limited access to direct customers and institutional buyers
- Poor connectivity in rural areas

The application provides a guided, voice-enabled and image-first workflow that reduces the effort required to participate in digital commerce.

---

## Innovation

KalaSetu combines image understanding, voice input, multilingual support, pricing assistance, offline drafts and marketplace publishing in one mobile workflow.

```
IMAGE + ARTISAN VOICE/TEXT NOTES
        ↓
EDITABLE DIGITAL CATALOG
        ↓
PRICE GUIDANCE
        ↓
DIRECT MARKETPLACE LISTING
```

---

## Uniqueness

KalaSetu gives artisans control over the complete journey:

1. Capture the product
2. Describe it using voice or text
3. Generate professional catalog content
4. Review and edit the AI result
5. Publish directly
6. Receive and manage customer orders

The platform is designed for low-literacy, regional-language and rural artisan communities.

---

## Target Users

### Primary Users
- Marginalized and rural artisans
- Traditional craft workers
- Handloom and textile producers
- Pottery, metal, bamboo and wood artisans

### Secondary Users
- Customers seeking authentic handmade products
- Retail buyers
- Institutional and bulk buyers
- Government and social-sector procurement teams

---

## Technical Approach

### Technology Stack

#### Frontend

| Technology | Purpose |
|-----------|---------|
| React Native | Cross-platform mobile framework |
| Expo SDK | Mobile development toolkit |
| TypeScript | Type-safe development |
| React Native Web | Browser-based access |

#### Mobile Capabilities

| Technology | Purpose |
|-----------|---------|
| Expo Image Picker | Camera and gallery input |
| Expo Speech | Text-to-speech assistance |
| Expo Speech Recognition | Voice-to-text input |
| AsyncStorage | Offline drafts and local preferences |

#### Backend

| Technology | Purpose |
|-----------|---------|
| Python | Server-side language |
| FastAPI | REST API framework |
| SQLite | Relational database |
| Render | Backend hosting and deployment |

#### Artificial Intelligence

| Technology | Purpose |
|-----------|---------|
| Google Gemini Vision API | Image understanding and catalog generation |
| Heuristic fallback | Catalog generation when AI is unavailable |
| Human review | Artisan approval before publishing |

#### Data and Storage

| Layer | Details |
|-------|---------|
| SQLite | Users, products, orders, reviews and institutional requests |
| Local mobile storage | Offline catalog and bulk-request drafts |
| Backend upload storage | Product images |

#### Integrations and Deployment

| Service | Purpose |
|---------|---------|
| Render | Public FastAPI backend hosting |
| Expo Application Services | Android preview and production builds |
| WhatsApp | Direct artisan-to-customer contact links |
| REST APIs | Authentication, product, order, review and moderation |

> **Implementation note:** The current project uses React Native with Expo, FastAPI, SQLite and Render. It does not currently use Flutter, Dart or Firebase.

---

## AI Output

### Input
- Product photograph
- Artisan voice notes
- Artisan text notes
- Optional artisan price idea

### Output
- AI-generated product title
- Product category
- Searchable tags
- English product description
- Hindi product description
- Suggested fair-price range
- Pricing justification
- Craft heritage story
- Care instructions

---

## Human-in-the-Loop Design

AI-generated content is **not published automatically**. The artisan reviews, edits and approves the listing before it becomes visible in the marketplace. This reduces the risk of:

- Incorrect product classification
- Inaccurate descriptions
- Unsuitable pricing

---

## Feasibility and Viability

| Dimension | Assessment | Rationale |
|-----------|-----------|-----------|
| **Technical Feasibility** | 🟢 High | React Native, Expo, FastAPI, SQLite, Render and multimodal AI APIs are mature technologies. Supports Android and browser via React Native Web. |
| **Economic Feasibility** | 🟡 Medium-High | Low initial infrastructure cost using SQLite and Render. AI, storage and hosting costs scale with adoption. |
| **Operational Feasibility** | 🟢 High | Photo-first and voice-assisted workflow minimizes typing and reduces onboarding effort for artisans with limited digital experience. |
| **Market Feasibility** | 🟢 High | Clear demand for authentic handmade products, artisan discovery and direct-to-customer commerce. Institutional procurement expands market further. |

---

## Risks and Mitigation

| Risk | Mitigation |
|------|-----------|
| AI inaccuracies | Human review and editing are required before publishing. |
| Low digital literacy | Icon-led navigation, guided steps, voice input and regional-language support. |
| Limited connectivity | Offline catalog and bulk-request drafts with local device storage. |
| Language barriers | Multilingual interface and Kannada voice-to-text support with English catalog generation. |
| Trust and marketplace quality | Artisan profiles, product reviews, seller ownership controls and order tracking. |
| Backend or AI service unavailability | API error handling, local drafts and heuristic catalog fallback. |

---

## Impact and Benefits

```
TRADITIONAL SKILL
        ↓
DIGITAL VISIBILITY
        ↓
DIRECT MARKET ACCESS
        ↓
INCOME OPPORTUNITY
```

| Dimension | Impact |
|-----------|--------|
| **Artisans** | Improved digital access and product visibility |
| **Better listings** | Professional descriptions, tags and pricing guidance |
| **Customers** | Better product discovery, information and trust |
| **Market linkage** | Direct access to retail and institutional buyers |
| **Livelihood** | Greater sales opportunities and income potential |
| **Social impact** | Empowerment of underrepresented artisans and preservation of craft identity |
| **Economic impact** | Improved market reach and direct-to-customer opportunities |
| **Cultural impact** | Documentation and promotion of traditional Indian crafts |
| **Environmental impact** | Encouragement of local, handmade and sustainable consumption |

---

## UN Sustainable Development Goals

### Primary Goal
- 🎯 **SDG 8:** Decent Work and Economic Growth

### Supporting Goals
- **SDG 1:** No Poverty
- **SDG 9:** Industry, Innovation and Infrastructure
- **SDG 10:** Reduced Inequalities

---

## Research Basis and References

1. [India Handmade Portal](https://www.indiahandmade.com)
2. [Indian Handicrafts Portal](https://handicrafts.nic.in)
3. [Google Gemini API: Image Understanding](https://ai.google.dev/gemini-api/docs/vision)
4. [Expo Documentation](https://docs.expo.dev)
5. [React Native Documentation](https://reactnative.dev/docs/getting-started)
6. [FastAPI Documentation](https://fastapi.tiangolo.com)
7. [SQLite Documentation](https://www.sqlite.org/docs.html)
8. [Render Documentation](https://render.com/docs)

---

## Conclusion

KalaSetu is an AI-powered, voice-first and multilingual artisan marketplace that reduces the digital barriers faced by rural craft communities.

By combining:
- 📸 Product photography
- 🎤 Voice input
- 🤖 Multimodal AI
- 👁️ Human review
- 📴 Offline drafts
- ☁️ Render-hosted backend services
- 🛒 Direct marketplace access

...KalaSetu helps traditional artisans convert their skills into professional digital commerce opportunities while **preserving their craft identity and cultural heritage**.

---

*KalaSetu — Bridging Tradition with Technology*
