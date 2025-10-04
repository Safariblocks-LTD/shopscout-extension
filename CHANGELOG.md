# Changelog

All notable changes to ShopScout will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-03

### 🎉 Initial Release

#### Added
- **Automatic Product Detection**: Scrapes product data from Amazon, eBay, Walmart, Temu, Target, Best Buy, Shopify stores
- **Cross-Site Price Comparison**: Finds better deals across multiple retailers using SERP API
- **Price History Charts**: 30/90-day price trends with interactive charts
- **AI Review Summarization**: Local AI-powered review analysis using Chrome Built-In AI (Gemini Nano)
- **Trust Badge System**: Intelligent seller verification with 0-100 trust scores
- **Price Tracking**: Set target prices and receive alerts when prices drop
- **Wishlist**: Save products for later viewing
- **Beautiful Side Panel UI**: Modern React + Tailwind design with smooth animations
- **Privacy-First Architecture**: Local AI processing, minimal data collection
- **Backend API Server**: Node.js + Express proxy for SERP API
- **Caching System**: 12-hour TTL for search results to reduce API calls
- **Responsive Design**: Works perfectly in Chrome's side panel
- **Accessibility Features**: Keyboard navigation, ARIA labels, high contrast

#### Technical Features
- Manifest V3 Chrome Extension
- React 18 + TypeScript
- Tailwind CSS for styling
- Vite build system
- Chrome Side Panel API
- Chrome Built-In AI APIs integration
- MutationObserver for dynamic content
- Robust selector fallbacks for scraping
- Express.js backend server
- CORS-enabled API proxy

#### Supported Retailers
- Amazon (all regions)
- eBay
- Walmart
- Temu
- Target
- Best Buy
- Shopify stores
- AliExpress

### Developer Experience
- Comprehensive documentation
- Development and production builds
- Hot module replacement in dev mode
- TypeScript type safety
- ESLint configuration
- Build scripts for extension packaging

---

## [Unreleased]

### Planned for v1.1
- Browser notifications for price drops
- Wishlist sync across devices
- Dark mode support
- Additional retailer support (Etsy, Newegg)
- Performance optimizations

### Planned for v1.2
- Multi-language support
- Enhanced AI features
- Firefox and Edge support
- Mobile companion app

---

**Legend:**
- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` for vulnerability fixes
