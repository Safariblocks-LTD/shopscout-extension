# 🔧 Fix MySQL Authentication Error

## Problem

```
❌ Unable to connect to MySQL database: Access denied for user 'root'@'localhost'
```

## Solution: Configure MySQL Authentication

### Option 1: Use MySQL Without Password (Quickest)

```bash
# 1. Login to MySQL
sudo mysql

# 2. Change authentication method
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';
FLUSH PRIVILEGES;
EXIT;
```

**Then update your `.env` file:**
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=shopscout
DB_USER=root
DB_PASSWORD=
```
*(Leave password empty)*

---

### Option 2: Set a Password (Recommended for Production)

```bash
# 1. Login to MySQL
sudo mysql

# 2. Set a password
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_secure_password';
FLUSH PRIVILEGES;
EXIT;
```

**Then update your `.env` file:**
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=shopscout
DB_USER=root
DB_PASSWORD=your_secure_password
```

---

### Option 3: Create Dedicated User (Best Practice)

```bash
# 1. Login to MySQL
sudo mysql

# 2. Create user
CREATE USER 'shopscout_user'@'localhost' IDENTIFIED BY 'shopscout_password';

# 3. Grant privileges
GRANT ALL PRIVILEGES ON shopscout.* TO 'shopscout_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**Then update your `.env` file:**
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=shopscout
DB_USER=shopscout_user
DB_PASSWORD=shopscout_password
```

---

## Quick Fix (Recommended)

**Run these commands:**

```bash
# Kill old server process (already done)
# lsof -ti:3001 | xargs kill -9

# Configure MySQL
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';"
sudo mysql -e "FLUSH PRIVILEGES;"

# Update .env file
cd ~/startuprojects/shopscout/server
cat > .env << 'EOF'
# Server Configuration
PORT=3001
NODE_ENV=development

# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=shopscout
DB_USER=root
DB_PASSWORD=

# SERP API Configuration
SERP_API_KEY=your_serpapi_key_here
EOF

# Start server
npm start
```

---

## Expected Output

```
✅ MySQL connection established successfully
✅ Database tables synchronized

╔═══════════════════════════════════════════════════════╗
║   🛍️  ShopScout Backend Server v2.0                  ║
║   Status: Running                                     ║
║   Port: 3001                                          ║
║   Database: MySQL ✅                                  ║
╚═══════════════════════════════════════════════════════╝
```

---

## Verify It Works

```bash
# Test MySQL connection
mysql -u root shopscout -e "SHOW TABLES;"

# Should show:
# +----------------------+
# | Tables_in_shopscout  |
# +----------------------+
# | price_history        |
# | price_tracking       |
# | search_history       |
# | users                |
# | wishlist             |
# +----------------------+
```

---

## Still Having Issues?

### Check MySQL is Running
```bash
sudo systemctl status mysql
# If not running:
sudo systemctl start mysql
```

### Check Database Exists
```bash
mysql -u root -e "SHOW DATABASES LIKE 'shopscout';"
```

### Test Connection Manually
```bash
mysql -u root shopscout
# If this works, your .env credentials are wrong
```

---

## Summary

1. ✅ **Port issue fixed** - Killed process on 3001
2. ⏳ **MySQL auth** - Choose one option above
3. 🚀 **Start server** - `npm start`

**Choose Option 1 (no password) for quickest setup!**
