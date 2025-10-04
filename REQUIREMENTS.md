# ShopScout – AI Shopping Agent (Chrome Extension, Side Panel UI)
## Requirements Document (v1.0 — Sidebar Format)

### Version & Purpose
- **Version:** v1.0
- **Purpose:** A handoff-ready requirements document for developers & designers to build ShopScout: a Chrome-extension side-panel that proactively finds better deals, summarizes reviews, and vets sellers — all while the user shops — with a focus on convenience, trust, and outstanding UI/UX.

---

## 1. Project Overview

ShopScout is a Chrome Extension with a persistent right-hand side panel UI. It detects products on shopping pages (Amazon, eBay, Walmart, Temu, Shopify stores, etc.), scrapes structured product metadata + primary product image, runs cross-site searches (SERP API) and AI analysis (Chrome Built-In AI APIs / Gemini Nano), and returns a compact, explainable comparison + trust summary — without the user leaving the page.

**Primary hackathon goal:** Win Best Multimodal AI Application (and be competitive for Most Helpful – Chrome Extension) by delivering an integrated, privacy-first, multimodal shopping assistant.

---

## 2. Goals & Objectives

- ✅ Deliver instant, zero-effort shopping assistance: user requires no uploads — ShopScout scrapes page image/title/price automatically.
- ✅ Provide multimodal insights: combine DOM text, product image, and marketplace results to improve match quality.
- ✅ Maximize helpfulness: save money, reduce scam risk, and reduce cognitive load (fewer tabs, faster decisions).
- ✅ Provide explainable results (why a seller is trusted, why a deal is better).
- ✅ Maintain privacy-first behavior: run AI locally where possible, minimal data retention, explicit opt-ins.

---

## 3. Target Users

- Online shoppers (Amazon, Walmart, eBay, Temu, Shopify buyers)
- Bargain hunters and time-pressed shoppers (students, professionals)
- Users who want to avoid scams or fake reviews
- International users who need translation and cross-region price visibility

---

## 4. Key Features (Focused & UX-first)

### 4.1 Core (Must-have for v1.0)

#### ✅ Automatic Product Scrape (content script)
- Detect product page; extract title, price, SKU/ASIN (if present), seller, and primary product image URL (highest-res)
- Use robust fallback selectors + MutationObserver for dynamically loaded pages

#### ✅ Cross-Site Deal Search (SERP API)
- Send normalized query AND image URL to SERP API (Google Shopping engine) to retrieve structured shopping results (retailer, price, link, thumbnail)
- Backend (Node.js + Axios GET requests) proxies queries (keeps API key safe)

#### ✅ Visual Similarity Match (auto)
- Use scraped image URL for image-based search; combine with title to improve match scoring
- Show visually-similar items from other retailers and rank by (price + match score + trust score)

#### ✅ Review Summarizer (Summarizer API)
- Summarize long review threads into concise pros/cons and surface top reviewer quotes
- Run locally via Gemini Nano when possible

#### ✅ Trust Badge System
- Score sellers by factors: verified storefront, review patterns, return policy, price anomalies
- Display badges: Verified Seller / High Trust / Low Risk / Caution with short explainers

#### ✅ Price History & Prediction
- Store recent price points (backend DB) and show simple chart (last 30/90 days)
- Use lightweight prediction (trend + seasonal heuristics)

#### ✅ One-Click Best Deal CTA
- Highlight best deal card (price + trust). Clicking redirects to retailer via affiliate link if applicable

#### ✅ Sidebar-first UI
- Right-hand persistent panel with stacked cards: Product Snapshot → Price Comparison → Review Summary → Trust Badge → Actions (Save, Track, Best Deal)

### 4.2 Nice-to-have (post-MVP)
- Wishlist + push price-drop alerts
- Multilingual review translation (Translator API)
- Personalization (preferred stores, price thresholds)
- "Why this suggestion" modal with model explanation (transparency)

---

## 5. User Flow (Sidebar Context)

1. Install → brief onboarding (permissions explained, privacy note: AI runs local when possible)
2. Browse product page → content script scrapes metadata + image
3. Sidebar auto-opens (or user opens it)
4. Background service assembles request: normalized title + image URL → sends to backend SERP API proxy and local Prompt API (multimodal)
5. AI + SERP results arrive: sidebar renders Product Snapshot + top 4 competitor cards sorted by composite score (price + match + trust)
6. User sees summary + trust reasoning → clicks Best Deal or saves to Wishlist

---

## 6. Technical Requirements & Implementation Details

### 6.1 Chrome Extension Structure (Manifest v3)
- ✅ manifest.json with side_panel.default_path set to sidepanel.html
- ✅ Permissions: activeTab, scripting, storage, notifications, alarms
- ✅ Content script(s): content.js (site-specific scraping logic with selectors & fallbacks)
- ✅ Background service worker: background.js (manages messages, API orchestration, caching)
- ✅ Side panel app: React + TypeScript + Tailwind (app is served from extension bundle)

### 6.2 Backend (Lightweight)
- ✅ Node.js server (Express) that:
  - Proxies SERP API calls (secure API key handling)
  - Stores price history, wishlist items, and alert schedules
  - Provides endpoints:
    - GET /search?query=...&image=... → calls SERP API google_shopping engine
    - POST /track → save wishlist/alert
    - GET /price-history?productId=... → returns time series

### 6.3 API Choices & Patterns
- **SERP API:** Use GET requests to https://serpapi.com/search.json
- **Chrome Built-In AI APIs:**
  - Prompt API (multimodal) for fusing text + image input locally (Gemini Nano)
  - Summarizer API for review condensation
  - Translator API for cross-language reviews
  - Proofreader / Rewriter for friendly wishlist copy

### 6.4 Data Flow (high-level)
```
content.js (DOM) → background.js (normalize + cache) → Node.js proxy (SERP API) + local multimodal Prompt API → background.js → sidepanel UI
```

### 6.5 Caching & Rate Limits
- ✅ Cache SERP results per product (TTL ~12 hours) to reduce API usage
- ✅ Implement exponential backoff for API errors
- ✅ Use user-configurable frequency for auto-search

---

## 7. UI/UX & Design Requirements

### 7.1 Sidebar Layout (mandatory)
- ✅ Header: product title, primary image, source site, price, trust badge (small line)
- ✅ Price Comparison Panel: horizontal list or table of top 3–5 competitor offers
- ✅ Price History Chart: sparkline + small toggle (30/90 days)
- ✅ Review Summary Card: 3 bullet pros, 3 bullet cons, short quote + "Read more" expands
- ✅ Trust Badge Card: score (0–100) + 1-sentence reason; link "Explain why"
- ✅ Action Bar (sticky bottom): Best Deal (primary CTA), Save/Track, Share

### 7.2 UI Principles
- ✅ Minimal cognitive load; prioritize clarity and speed
- ✅ Use small modular cards, consistent paddings, 2–3 accent colors only
- ✅ Animations: subtle micro-interactions for state changes (loading, saved)
- ✅ Accessibility: keyboard focus states, semantic markup, color contrast

### 7.3 Visual Tokens
- ✅ Colors: Blue #1E88E5 (trust), Green #43A047 (savings), Neutral #F7F8FA background
- ✅ Typography: Inter/Roboto, sizes scaled for legibility in narrow panels
- ✅ Icons: Lucide icons

---

## 8. Security, Privacy & Compliance

- ✅ Privacy-first: run summarization and light inference locally using Gemini Nano when possible
- ✅ User consent: explicit onboarding acceptance to access page data and send requests
- ✅ No payment storage: never store card data
- ✅ Encryption: encrypt user wishlist & alerts at rest
- ✅ GDPR/CCPA: provide data deletion and export options
- ✅ Rate-limited & audited API use

---

## 9. Success Metrics & KPIs

**Hackathon primary KPIs:**
- Demonstration of multimodal fusion
- Latency (< 2s for initial analysis)
- Usability of side panel

**Long-term product KPIs:**
- Extension installs & active installs
- DAU and session length with sidebar opened
- Deals discovered / session
- CTR on "Best Deal"
- % users enabling price alerts and wishlist saves
- Retention curve (7 / 30 day)

---

## 10. Developer Handoff Checklist

- ✅ manifest.json (v3) with side_panel entry
- ✅ content.js: site-specific scraping modules with clear selector fallbacks + MutationObserver
- ✅ background.js: message broker + API orchestration + caching layer
- ✅ sidepanel app: React + TypeScript build (component library + styles)
- ✅ Node.js proxy: search endpoint using Axios
- ✅ README: setup, build, load unpacked, and test scenarios
- ✅ Environment configuration examples

---

## 11. How this wins "Most Helpful" & "Best Multimodal"

**Most Helpful:**
- Zero-effort product understanding (auto-scrape)
- Immediate cross-retailer price-finding
- Trust-badges that reduce risk
- All directly save time/money and reduce anxiety

**Best Multimodal:**
- Combines DOM text, product images (visual similarity), and AI summarization/translation (text + vision fusion)
- Local-first side-panel experience
- Directly aligned with Chrome's judging criteria

---

**Document Version:** v1.0  
**Last Updated:** 2025-10-03  
**Status:** ✅ Complete - Ready for Development
