# 🚀 ShopScout Quick Start Guide

Get ShopScout running in **5 minutes**!

## Prerequisites

- Node.js 18+ installed
- Chrome browser
- Terminal/Command line access

## Step-by-Step Installation

### 1️⃣ Install Dependencies (2 minutes)

```bash
# Navigate to project
cd shopscout

# Install extension dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### 2️⃣ Build Extension (1 minute)

```bash
npm run build
```

This creates a `dist/` folder with your extension files.

### 3️⃣ Start Backend Server (30 seconds)

```bash
cd server
npm start
```

You should see:
```
╔═══════════════════════════════════════════════════════╗
║   🛍️  ShopScout Backend Server v1.0                  ║
║   Status: Running                                     ║
║   Port: 3001                                          ║
╚═══════════════════════════════════════════════════════╝
```

**Keep this terminal window open!**

### 4️⃣ Load Extension in Chrome (1 minute)

1. Open Chrome
2. Go to `chrome://extensions/`
3. Toggle **Developer mode** ON (top-right corner)
4. Click **Load unpacked**
5. Select the `dist/` folder
6. Done! 🎉

### 5️⃣ Configure Firebase Authentication (2 minutes)

**Important**: Before using the extension, you need to enable authentication in Firebase Console.

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **shopscout-9bb63**
3. Navigate to **Authentication** → **Sign-in method**
4. Enable **Google** provider
5. Enable **Email/Password** provider and check **Email link (passwordless sign-in)**
6. Go to **Settings** → **Authorized domains**
7. Add your extension ID (found at `chrome://extensions/` after loading)

📖 See [AUTHENTICATION.md](AUTHENTICATION.md) for detailed setup instructions.

### 6️⃣ Test It Out (30 seconds)

1. Click the ShopScout icon in your toolbar
2. **Sign in** using Google or Magic Link
3. Navigate to any Amazon product: https://www.amazon.com/dp/B08N5WRWNW
4. Watch the magic happen! ✨

## What You Should See

- ✅ Authentication screen on first launch
- ✅ Side panel opens automatically after sign-in
- ✅ Product information displayed
- ✅ Price comparison from multiple retailers
- ✅ Trust score badge
- ✅ Price history chart
- ✅ Review summary
- ✅ Sign-out button in header

## Troubleshooting

**Side panel doesn't open?**
- Refresh the product page
- Make sure you're on a product page (not search results)

**No price comparisons?**
- Check that the server is running (Step 3)
- Look for server output in the terminal

**Build errors?**
- Delete `node_modules` and run `npm install` again
- Make sure you're using Node.js 18+

**Authentication issues?**
- Check Firebase Console configuration
- Verify authorized domains include your extension ID
- See [AUTHENTICATION.md](AUTHENTICATION.md) for troubleshooting

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Review [AUTHENTICATION.md](AUTHENTICATION.md) for auth setup details
- Configure SERP API key for production use (optional)
- Explore supported retailers
- Customize the extension

## Need Help?

- Check [README.md](README.md#troubleshooting) for common issues
- Open an issue on GitHub
- Review the [REQUIREMENTS.md](REQUIREMENTS.md) for technical details

---

**Happy Shopping! 🛍️**
