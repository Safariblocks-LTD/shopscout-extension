# 🚀 Deploy Backend to Fly.io - CRITICAL STEP

## ⚠️ IMPORTANT: Your Serper.dev API is NOT working because the backend needs to be deployed!

The extension is trying to call: `https://shopscout-api.fly.dev/api/search`
But the server needs to be deployed with the SERP_API_KEY configured.

---

## 📋 Prerequisites

1. **Fly.io CLI installed** (if not, install it):
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Serper.dev API Key** - Get it from https://serper.dev/
   - Sign up for free account
   - Copy your API key

---

## 🔧 Step 1: Configure Environment Variables

```bash
cd /home/kcelestinomaria/startuprojects/shopscout/server

# Set your Serper.dev API key
fly secrets set SERP_API_KEY="your_actual_serper_dev_api_key_here"

# Set database URL (if using MySQL)
fly secrets set DATABASE_URL="your_database_url_here"
```

---

## 🚀 Step 2: Deploy to Fly.io

```bash
cd /home/kcelestinomaria/startuprojects/shopscout/server

# Deploy the backend
fly deploy --ha=false
```

**Expected output:**
```
==> Verifying app config
--> Verified app config
==> Building image
...
==> Deploying shopscout-api
...
--> v2 deployed successfully
```

---

## ✅ Step 3: Verify Deployment

### Test the API:
```bash
# Test health endpoint
curl https://shopscout-api.fly.dev/health

# Test search endpoint (should return results)
curl "https://shopscout-api.fly.dev/api/search?query=usb+cable"
```

**Expected response:**
```json
{
  "success": true,
  "results": [
    {
      "title": "USB Cable...",
      "price": 9.99,
      "source": "Amazon",
      "url": "https://..."
    }
  ]
}
```

---

## 🔍 Step 4: Check Logs

```bash
# View real-time logs
fly logs -a shopscout-api

# You should see:
# [Search] Query: "usb cable"
# [Search] ✅ Using Serper.dev API with key: abc123...
# [Search] Serper.dev API response received, status: 200
# [Search] ✅ Found 10 results
```

---

## 🐛 Troubleshooting

### Issue: "SERP API key not configured"

**Solution:**
```bash
cd server
fly secrets set SERP_API_KEY="your_key_here"
fly deploy --ha=false
```

### Issue: "No results found"

**Check:**
1. API key is valid: https://serper.dev/dashboard
2. API key has credits remaining
3. Check logs: `fly logs -a shopscout-api`

### Issue: "Connection refused"

**Solution:**
```bash
# Check if app is running
fly status -a shopscout-api

# Restart if needed
fly apps restart shopscout-api
```

---

## 📊 Current Status

### ✅ What's Working:
- Extension built successfully
- Refresh button restored
- Accurate product scraping
- No mock data

### ❌ What's NOT Working:
- **Backend not deployed** - Serper.dev API calls failing
- No deals showing in extension

### 🎯 Next Steps:

1. **Deploy backend NOW** (commands above)
2. **Test API endpoint** (curl command above)
3. **Reload extension** in Chrome
4. **Scan product** - should now show deals!

---

## 🔑 Get Your Serper.dev API Key

1. Go to https://serper.dev/
2. Sign up (free account)
3. Go to Dashboard
4. Copy your API key
5. Run: `fly secrets set SERP_API_KEY="your_key"`
6. Deploy: `fly deploy --ha=false`

---

## 📝 Quick Deploy Commands (Copy-Paste)

```bash
# 1. Navigate to server directory
cd /home/kcelestinomaria/startuprojects/shopscout/server

# 2. Set API key (replace with your actual key)
fly secrets set SERP_API_KEY="your_serper_dev_api_key_here"

# 3. Deploy
fly deploy --ha=false

# 4. Test
curl "https://shopscout-api.fly.dev/api/search?query=usb+cable"

# 5. Check logs
fly logs -a shopscout-api
```

---

## ✅ After Deployment

1. **Reload Chrome extension**
2. **Go to Amazon product page**
3. **Click "Scan This Product Page"**
4. **You should now see:**
   - ✅ Product details (accurate)
   - ✅ Price comparison with deals from other stores
   - ✅ Trust score
   - ✅ Refresh button working

---

## 🎉 Success Indicators

### In Extension Console:
```
[ShopScout] 🌐 Calling Serper.dev API...
[ShopScout] 📡 Full URL: https://shopscout-api.fly.dev/api/search?query=...
[ShopScout] 📥 Response received!
[ShopScout] Status: 200 OK
[ShopScout] ✅ Serper.dev found 5 deals
```

### In Fly.io Logs:
```
[Search] Query: "SAMSUNG Galaxy Tab..."
[Search] ✅ Using Serper.dev API
[Search] Serper.dev API response received, status: 200
[Search] ✅ Found 10 results
```

---

## 🚨 CRITICAL: Deploy NOW!

**The extension is complete and working, but it needs the backend deployed to show deals!**

Run these commands:
```bash
cd /home/kcelestinomaria/startuprojects/shopscout/server
fly secrets set SERP_API_KEY="your_key"
fly deploy --ha=false
```

Then reload the extension and test! 🚀
