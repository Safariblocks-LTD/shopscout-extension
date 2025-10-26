# ShopScout Real Price Tracking System - Deployment Guide

## ✅ **System Overview**
The new real price tracking system replaces mock data with actual scraped prices from:
- **Amazon** products
- **eBay** listings  
- **Walmart** items
- **Target** products
- **Best Buy** electronics

## 🚀 **New Features Added**

### **1. Real Price Recording**
- **Automatic capture** when users view product pages
- **Price change detection** every 30 seconds
- **Multi-source tracking** (Amazon, eBay, Walmart, etc.)
- **Duplicate prevention** (only records new prices)

### **2. Enhanced API Endpoints**
- `POST /api/price-track/record` - Record real prices
- `GET /api/price-history/:productId` - Get real price history
- `GET /api/price-stats/:productId` - Get price analytics
- `GET /api/price-drops` - Find products with price drops
- `POST /api/price-track/bulk` - Track multiple products

### **3. Real-time Monitoring**
- **Page load detection** - Records price on page visit
- **Dynamic price monitoring** - Tracks price changes
- **URL-based product identification** - Consistent tracking across sessions

## 📊 **Database Schema**
```sql
CREATE TABLE price_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  productId VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  source VARCHAR(100),
  recordedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (productId),
  INDEX (recordedAt)
);
```

## 🔧 **Deployment Steps**

### **Step 1: Database Migration**
```bash
cd /home/kcelestinomaria/startuprojects/shopscout/server

# Ensure database is up to date
npm run db:migrate

# Or manually create table if needed
node -e "
const { sequelize, PriceHistory } = require('./database');
sequelize.sync({ alter: true }).then(() => {
  console.log('✅ Price History table created/updated');
  process.exit(0);
});
"
```

### **Step 2: Restart Server**
```bash
# Stop existing server
pm2 stop shopscout-server

# Start with new code
npm start
```

### **Step 3: Test Price Recording**
1. **Visit any product page** on Amazon, eBay, Walmart, etc.
2. **Check browser console** for `[ShopScout] Recording real price:` messages
3. **Verify database** contains real prices:
   ```bash
   curl https://shopscout-api.fly.dev/api/price-drops
   ```

### **Step 4: Verify Price History**
```bash
# Test with a real product ID
curl https://shopscout-api.fly.dev/api/price-history/amazon-iphone15-128gb
```

## 📈 **Testing the System**

### **Manual Testing**
1. **Navigate to product page** (e.g., Amazon iPhone)
2. **Check console** for price recording logs
3. **Refresh page** - should capture price again
4. **Change price** (if possible) - should detect change

### **API Testing**
```bash
# Record a test price
curl -X POST https://shopscout-api.fly.dev/api/price-track/record \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "test-iphone-15",
    "price": 899.99,
    "source": "amazon",
    "productUrl": "https://amazon.com/iphone-15",
    "productName": "iPhone 15 128GB"
  }'

# Get price history
curl https://shopscout-api.fly.dev/api/price-history/test-iphone-15

# Get price stats
curl https://shopscout-api.fly.dev/api/price-stats/test-iphone-15
```

## 🔍 **Debugging**

### **Common Issues & Solutions**

#### **1. No prices being recorded**
- **Check**: Browser console for errors
- **Solution**: Ensure content script is running and scraper is detecting prices

#### **2. Duplicate prices**
- **Check**: Database for existing records
- **Solution**: System prevents duplicates for same day/source

#### **3. API errors**
- **Check**: Server logs with `pm2 logs`
- **Solution**: Verify database connection and endpoints

### **Debug Commands**
```bash
# Check database
sqlite3 shopscout.db "SELECT * FROM price_history ORDER BY recordedAt DESC LIMIT 10;"

# Check server logs
pm2 logs shopscout-server

# Test scraper manually
node -e "
const scraper = require('./server/scrapers/amazon');
scraper.scrape('https://amazon.com/dp/B0CHX1W1XY').then(console.log);
"
```

## 📊 **Monitoring**

### **Key Metrics to Track**
- **Products tracked** per day
- **Price changes detected**
- **Data accuracy** (compare with actual prices)
- **API response times**

### **Health Check Endpoints**
```bash
# System health
curl https://shopscout-api.fly.dev/api/health

# Price tracking health
curl https://shopscout-api.fly.dev/api/price-drops?days=1
```

## ✅ **Verification Checklist**

- [ ] **Database table** `price_history` exists
- [ ] **API endpoints** return real data (not mock)
- [ ] **Content script** records prices on page visits
- [ ] **Price changes** are detected and recorded
- [ ] **No duplicate** prices for same day/source
- [ ] **All supported sites** (Amazon, eBay, Walmart, etc.) work
- [ ] **Price history** shows actual timestamps and values

## 🎯 **Expected Behavior**

1. **User visits product page** → Price recorded immediately
2. **Price changes** → New price recorded within 30 seconds
3. **Price history** shows real data with actual timestamps
4. **No mock data** - only real scraped prices
5. **Consistent product tracking** across sessions

## 🚨 **Rollback Plan**

If issues arise, revert to previous version:
```bash
git checkout HEAD~1 -- server/index.js server/database.js content.js
git checkout HEAD~1 -- server/price-tracker.js
npm restart
```

## 📞 **Support**

For issues with the new price tracking system:
1. Check browser console logs
2. Verify server logs
3. Test API endpoints directly
4. Ensure database connectivity

**Status**: ✅ **Ready for deployment** - All components tested and integrated.
