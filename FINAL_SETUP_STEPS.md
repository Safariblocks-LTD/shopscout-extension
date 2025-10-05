# 🚀 ShopScout - Final Setup Steps

## Current Issue

The backend server is running the OLD code without the `/api/user/create` endpoint. You need to restart it with the NEW code.

---

## ✅ Complete Setup (5 Minutes)

### Step 1: Stop Old Server & Start New One

```bash
# Kill any process on port 3001
lsof -ti:3001 | xargs kill -9

# Go to server directory
cd ~/startuprojects/shopscout/server

# Start the updated server
npm start
```

**Expected output:**
```
✅ MySQL connection established successfully
✅ Database tables synchronized

╔═══════════════════════════════════════════════════════╗
║   🛍️  ShopScout Backend Server v2.0                  ║
║   Database: MySQL ✅                                  ║
║   Port: 3001                                          ║
╚═══════════════════════════════════════════════════════╝
```

---

### Step 2: Verify Server is Working

Open a new terminal and test:

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test user creation endpoint
curl -X POST http://localhost:3001/api/user/create \
  -H "Content-Type: application/json" \
  -d '{"nickname":"TestUser","email":"test@example.com"}'
```

**Expected response:**
```json
{
  "success": true,
  "userId": "user_1234567890_abc123",
  "nickname": "TestUser",
  "email": "test@example.com"
}
```

---

### Step 3: Load Extension in Chrome

```
1. Open Chrome
2. Go to: chrome://extensions/
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select: ~/startuprojects/shopscout/dist
```

---

### Step 4: Test the Extension

```
1. Click the ShopScout icon in Chrome
2. You should see the welcome screen
3. Enter nickname: "YourName"
4. Enter email: "your@email.com"
5. Click "Start Shopping Smarter"
6. ✅ Should enter the app instantly!
```

---

## 🐛 Troubleshooting

### Issue: "Something went wrong. Please try again"

**Cause:** Backend server not running or running old code

**Fix:**
```bash
# Kill old server
lsof -ti:3001 | xargs kill -9

# Start new server
cd ~/startuprojects/shopscout/server
npm start
```

---

### Issue: "Cannot POST /api/user/create"

**Cause:** Server running old code without the endpoint

**Fix:** Restart server (see above)

---

### Issue: Port 3001 already in use

**Fix:**
```bash
lsof -ti:3001 | xargs kill -9
```

---

### Issue: MySQL connection failed

**Fix:**
```bash
# Start MySQL
sudo systemctl start mysql

# Verify it's running
sudo systemctl status mysql
```

---

## 📊 Verify Everything Works

### 1. Check Server Logs

When you create a user in the extension, you should see in server logs:
```
[User] Created user: YourName (your@email.com)
```

### 2. Check MySQL Database

```bash
mysql -u root shopscout -e "SELECT * FROM users;"
```

Should show your user!

### 3. Check Chrome Storage

In extension console:
```javascript
chrome.storage.local.get(console.log)
```

Should show:
```json
{
  "userId": "user_...",
  "nickname": "YourName",
  "email": "your@email.com",
  "onboarded": true
}
```

---

## ✅ Complete Checklist

Before testing extension:

- [ ] MySQL is running (`sudo systemctl status mysql`)
- [ ] Server is running (`npm start` in server directory)
- [ ] Server shows "MySQL ✅"
- [ ] Health endpoint works (`curl http://localhost:3001/health`)
- [ ] User create endpoint works (test with curl above)
- [ ] Extension is built (`npm run build:extension`)
- [ ] Extension is loaded in Chrome

---

## 🎯 Quick Commands

**Terminal 1 - Start Server:**
```bash
cd ~/startuprojects/shopscout/server
lsof -ti:3001 | xargs kill -9  # Kill old server
npm start                       # Start new server
```

**Terminal 2 - Test:**
```bash
# Test health
curl http://localhost:3001/health

# Test user creation
curl -X POST http://localhost:3001/api/user/create \
  -H "Content-Type: application/json" \
  -d '{"nickname":"Test","email":"test@test.com"}'
```

---

## 🎉 Success Indicators

**Server Running Correctly:**
- ✅ Shows "MySQL ✅"
- ✅ Shows "Port: 3001"
- ✅ Health endpoint returns `{"status":"ok"}`
- ✅ User create endpoint returns `{"success":true}`

**Extension Working Correctly:**
- ✅ Welcome screen loads
- ✅ Can enter nickname + email
- ✅ Clicking button shows "Setting up..."
- ✅ Enters main app (shows ShopScout header)
- ✅ Profile shows your nickname

---

## 📝 Notes

- Server must be running BEFORE using extension
- If you make code changes, rebuild extension: `npm run build:extension`
- If you change server code, restart server: `npm start`
- MySQL must be running for database features

---

**Your extension is ready! Just follow the 4 steps above.** 🚀
