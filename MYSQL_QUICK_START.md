# ⚡ MySQL Setup - Quick Start (5 Minutes)

## 🎯 What You're Setting Up

**Firebase** → Authentication only (secure, reliable)  
**MySQL** → All your data (full control, fast queries)

---

## 🚀 Quick Setup

### 1. Install MySQL (2 min)

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt install mysql-server
sudo systemctl start mysql
```

**macOS:**
```bash
brew install mysql
brew services start mysql
```

**Windows:** Download from https://dev.mysql.com/downloads/mysql/

---

### 2. Create Database (1 min)

```bash
# Login to MySQL
sudo mysql -u root -p
# (Press Enter if no password set)

# Create database
CREATE DATABASE shopscout;
EXIT;
```

---

### 3. Configure Server (1 min)

**Edit:** `server/.env`

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=shopscout
DB_USER=root
DB_PASSWORD=
```

*Leave `DB_PASSWORD` empty if you haven't set a MySQL root password*

---

### 4. Start Server (1 min)

```bash
cd server
npm start
```

**Look for:**
```
✅ MySQL connection established successfully
✅ Database tables synchronized
Database: MySQL ✅
```

---

## ✅ That's It!

**Your setup is complete when you see:**
- ✅ MySQL connection successful
- ✅ Tables synchronized
- ✅ Server running on port 3001

---

## 🧪 Test It Works

### Test 1: Sign Up
1. Open extension
2. Sign up with test email
3. Check backend logs for: `[User] Created user: test@example.com`

### Test 2: Check Database
```bash
mysql -u root -p shopscout

SELECT * FROM users;
```

**Should see:** Your test user!

---

## 🚨 Troubleshooting

### "Can't connect to MySQL"
```bash
# Check if MySQL is running
sudo systemctl status mysql

# Start MySQL
sudo systemctl start mysql
```

### "Access denied"
```bash
# Reset root password
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';
FLUSH PRIVILEGES;
EXIT;
```

### "Database doesn't exist"
```bash
sudo mysql -u root -p
CREATE DATABASE shopscout;
EXIT;
```

---

## 📊 What Gets Stored in MySQL

- ✅ **Users** - Synced from Firebase (uid, email, etc.)
- ✅ **Wishlist** - User's saved products
- ✅ **Price Tracking** - Price alerts
- ✅ **Price History** - Historical price data
- ✅ **Search History** - User searches

**All tables created automatically!**

---

## 🎉 Success!

When server starts with `Database: MySQL ✅`, you're ready!

**Full documentation:** `MYSQL_SETUP_COMPLETE.md`

**Total time:** ~5 minutes
