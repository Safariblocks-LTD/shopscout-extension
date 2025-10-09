# 🚀 Deploy ShopScout to Production - Quick Guide

## Step 1: Get Supabase Database Password

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/mhzmxdgozfmrjezzpqzv
2. Click **Settings** → **Database**
3. Scroll to **Connection string** section
4. Copy the password from the connection string (or reset it if needed)

## Step 2: Deploy Main Backend Server

```bash
cd server

# Set the DATABASE_URL secret (replace YOUR_PASSWORD with actual password)
export PATH="/home/kcelestinomaria/.fly/bin:$PATH"
flyctl secrets set DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.mhzmxdgozfmrjezzpqzv.supabase.co:5432/postgres" --app shopscout-api

# Optional: Set SERP API key if you have one
# flyctl secrets set SERP_API_KEY="your_serp_key" --app shopscout-api

# Deploy!
flyctl deploy --app shopscout-api

# Check status
flyctl status --app shopscout-api

# View logs
flyctl logs --app shopscout-api
```

## Step 3: Deploy Auth Server

```bash
cd ../auth-server

# Create the app
export PATH="/home/kcelestinomaria/.fly/bin:$PATH"
flyctl launch --no-deploy --copy-config --name shopscout-auth

# Deploy!
flyctl deploy --app shopscout-auth

# Check status
flyctl status --app shopscout-auth
```

## Step 4: Test Deployments

```bash
# Test Main API
curl https://shopscout-api.fly.dev/health

# Test Auth Server
curl https://shopscout-auth.fly.dev/health
```

## Step 5: Build Chrome Extension

```bash
cd ..
npm run build
```

## Step 6: Load Extension in Chrome

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `dist/` folder
5. Test on an Amazon product page!

## Step 7: Update Firebase (Important!)

1. Go to Firebase Console: https://console.firebase.google.com/project/shopscout-9bb63
2. Click **Authentication** → **Settings** → **Authorized domains**
3. Add these domains:
   - `shopscout-api.fly.dev`
   - `shopscout-auth.fly.dev`

## Production URLs

- **Main API**: https://shopscout-api.fly.dev
- **Auth Server**: https://shopscout-auth.fly.dev

## Troubleshooting

### Database Connection Error
```bash
# Check if DATABASE_URL is set correctly
cd server
flyctl secrets list --app shopscout-api

# View logs for errors
flyctl logs --app shopscout-api
```

### Extension Not Connecting
- Check browser console for errors
- Verify production URLs in the extension
- Make sure Firebase authorized domains are updated

### Need to Rollback?
```bash
# Set USE_PRODUCTION = false in:
# - background.js (line 8)
# - src/services/api.ts (line 7)
# - src/contexts/AuthContext.tsx (line 45)

# Then rebuild
npm run build
```

## Quick Commands Reference

```bash
# View app status
flyctl status --app shopscout-api
flyctl status --app shopscout-auth

# View logs
flyctl logs --app shopscout-api
flyctl logs --app shopscout-auth

# SSH into machine
flyctl ssh console --app shopscout-api

# Scale up (if needed)
flyctl scale memory 512 --app shopscout-api

# Restart app
flyctl apps restart shopscout-api
```

## Cost Estimate

- Fly.io: **FREE** (within free tier limits)
- Supabase: **FREE** (500MB database)
- Firebase: **FREE** (generous free tier)

**Total: $0/month** for hackathon testing! 🎉
