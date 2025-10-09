# 🚀 Quick Start - Load Extension Now!

## ✅ Deployment Complete!

Both backend servers are live and the extension is built. Follow these 3 simple steps:

---

## Step 1: Load Extension in Chrome (2 minutes)

1. Open Chrome and go to: `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **"Load unpacked"**
4. Navigate to: `/home/kcelestinomaria/startuprojects/shopscout/dist/`
5. Click **"Select Folder"**

✅ Done! The ShopScout icon should appear in your toolbar.

---

## Step 2: Update Firebase (CRITICAL - 2 minutes)

1. Go to: https://console.firebase.google.com/project/shopscout-9bb63/authentication/settings
2. Scroll to **Authorized domains**
3. Click **"Add domain"** and add these two:
   - `shopscout-api.fly.dev`
   - `shopscout-auth.fly.dev`
4. Click **Save**

✅ Done! Authentication will now work.

---

## Step 3: Test It! (1 minute)

1. Go to any Amazon product: https://www.amazon.com/dp/B08N5WRWNW
2. Click the **ShopScout icon** in your toolbar
3. Sign in with Google when prompted
4. See the magic! ✨

---

## 🌐 Your Production URLs

- **Main API**: https://shopscout-api.fly.dev
- **Auth Server**: https://shopscout-auth.fly.dev
- **Extension**: Loaded from `dist/` folder

---

## 🧪 Quick Health Check

Run this to verify everything is working:

```bash
curl https://shopscout-api.fly.dev/health
curl https://shopscout-auth.fly.dev/health
```

Both should return JSON responses.

---

## 🎉 That's It!

Your app is now running in production. Ready for the hackathon!

**Need help?** Check `PRODUCTION_DEPLOYMENT_COMPLETE.md` for detailed docs.

**View logs**: `flyctl logs --app shopscout-api`
