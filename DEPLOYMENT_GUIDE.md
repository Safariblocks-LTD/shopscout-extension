# ShopScout Production Deployment Guide

## Overview
This guide covers deploying ShopScout to production using:
- **Fly.io** - For hosting backend servers
- **Supabase** - For PostgreSQL database (free tier)
- **Firebase** - For authentication (already configured)

## Architecture
```
Chrome Extension (Local)
    ↓
    ├─→ Auth Server (Fly.io: shopscout-auth.fly.dev)
    ├─→ Main API Server (Fly.io: shopscout-api.fly.dev)
    └─→ Supabase PostgreSQL Database
```

## Prerequisites
- [x] Fly.io account (logged in)
- [x] Supabase project created
- [ ] Supabase database password

## Deployment Steps

### 1. Set Up Supabase Database Connection

Your Supabase connection details:
- **Project URL**: https://mhzmxdgozfmrjezzpqzv.supabase.co
- **Project Ref**: mhzmxdgozfmrjezzpqzv
- **Connection String Format**: 
  ```
  postgresql://postgres:[YOUR-PASSWORD]@db.mhzmxdgozfmrjezzpqzv.supabase.co:5432/postgres
  ```

### 2. Deploy Main Backend Server

```bash
cd server

# Create the Fly.io app (first time only)
flyctl apps create shopscout-api

# Set environment secrets
flyctl secrets set DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.mhzmxdgozfmrjezzpqzv.supabase.co:5432/postgres"
flyctl secrets set SERP_API_KEY="your_serp_api_key_here"
flyctl secrets set SUPABASE_URL="https://mhzmxdgozfmrjezzpqzv.supabase.co"
flyctl secrets set SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oem14ZGdvemZtcmplenpwcXp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NjA1NDIsImV4cCI6MjA3NTUzNjU0Mn0._b8GodKnkYRrfnEbgt_e-is7FnIlnR8k2ay1IazZt-Y"

# Deploy
flyctl deploy

# Check status
flyctl status

# View logs
flyctl logs
```

### 3. Deploy Auth Server

```bash
cd ../auth-server

# Create the Fly.io app (first time only)
flyctl apps create shopscout-auth

# Deploy
flyctl deploy

# Check status
flyctl status
```

### 4. Update Chrome Extension Configuration

After deployment, update the extension to use production URLs:

**File: `background.js`**
- Change `http://localhost:3001` → `https://shopscout-api.fly.dev`
- Change `http://localhost:8000` → `https://shopscout-auth.fly.dev`

**File: `src/App.tsx` or auth configuration**
- Update auth server URL to production

### 5. Update Firebase Configuration

Add production domains to Firebase:
1. Go to Firebase Console → Authentication → Settings
2. Add authorized domains:
   - `shopscout-api.fly.dev`
   - `shopscout-auth.fly.dev`

### 6. Build Chrome Extension

```bash
cd ..
npm run build
```

The extension will be in the `dist/` folder, ready to load in Chrome.

## Production URLs

After deployment, your services will be available at:
- **Main API**: https://shopscout-api.fly.dev
- **Auth Server**: https://shopscout-auth.fly.dev

## Testing Production Deployment

1. **Test API Health**:
   ```bash
   curl https://shopscout-api.fly.dev/health
   ```

2. **Test Auth Server**:
   ```bash
   curl https://shopscout-auth.fly.dev/health
   ```

3. **Load Extension**:
   - Open Chrome → `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select the `dist/` folder

4. **Test Full Flow**:
   - Navigate to an Amazon product page
   - Open ShopScout extension
   - Sign in with Google or Magic Link
   - Verify product detection and price comparison

## Monitoring & Logs

```bash
# View API server logs
cd server
flyctl logs

# View auth server logs
cd auth-server
flyctl logs

# Check app status
flyctl status

# SSH into machine (if needed)
flyctl ssh console
```

## Troubleshooting

### Database Connection Issues
- Verify Supabase password is correct
- Check DATABASE_URL secret: `flyctl secrets list`
- View logs: `flyctl logs`

### CORS Issues
- Ensure `ALLOWED_ORIGINS` includes Chrome extension ID
- Update after getting extension ID from Chrome Web Store

### Extension Not Connecting
- Check production URLs in `background.js`
- Verify Firebase authorized domains
- Check browser console for errors

## Scaling

Fly.io will auto-scale based on traffic. Current configuration:
- **Memory**: 256MB per machine
- **CPU**: 1 shared vCPU
- **Auto-stop**: Machines stop when idle
- **Auto-start**: Machines start on request

To scale manually:
```bash
flyctl scale count 2  # Run 2 machines
flyctl scale memory 512  # Increase to 512MB
```

## Cost Estimate

- **Fly.io**: ~$0-5/month (free tier covers basic usage)
- **Supabase**: Free tier (500MB database, 2GB bandwidth)
- **Firebase**: Free tier (50K reads/day, 20K writes/day)

**Total**: $0-5/month for hackathon/testing

## Next Steps

1. Get Supabase database password
2. Deploy both servers
3. Update extension configuration
4. Test end-to-end
5. Submit to Chrome Web Store (optional)
