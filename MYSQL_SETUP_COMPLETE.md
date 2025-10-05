# 🗄️ MySQL Database Setup - Complete Guide

## 🎯 Architecture Overview

Your ShopScout now uses a **hybrid approach** for maximum performance and control:

```
┌─────────────────────────────────────────────────────────┐
│                     SHOPSCOUT                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Firebase Auth          MySQL Database                  │
│  ├─ Authentication     ├─ Users (synced from Firebase)  │
│  ├─ Email verification ├─ Wishlist                      │
│  └─ Session tokens     ├─ Price Tracking                │
│                        ├─ Price History                  │
│                        └─ Search History                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Why This Approach?**
- ✅ Firebase: Best for authentication (secure, reliable, email handling)
- ✅ MySQL: Full control over your data, better for complex queries
- ✅ Automatic sync: Users created in Firebase are synced to MySQL
- ✅ Performance: Fast local database queries

---

## 📦 Step 1: Install MySQL

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### macOS
```bash
brew install mysql
brew services start mysql
```

### Windows
Download from: https://dev.mysql.com/downloads/mysql/

---

## 🔐 Step 2: Secure MySQL Installation

```bash
sudo mysql_secure_installation
```

**Recommended settings:**
- Set root password: **YES** (choose a strong password)
- Remove anonymous users: **YES**
- Disallow root login remotely: **YES**
- Remove test database: **YES**
- Reload privilege tables: **YES**

---

## 🗄️ Step 3: Create ShopScout Database

```bash
# Login to MySQL
sudo mysql -u root -p

# Create database
CREATE DATABASE shopscout CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create user (optional, for better security)
CREATE USER 'shopscout_user'@'localhost' IDENTIFIED BY 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON shopscout.* TO 'shopscout_user'@'localhost';
FLUSH PRIVILEGES;

# Exit
EXIT;
```

---

## ⚙️ Step 4: Configure Server Environment

**Edit:** `server/.env`

```env
# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=shopscout
DB_USER=root
DB_PASSWORD=your_mysql_password

# Or if you created a dedicated user:
# DB_USER=shopscout_user
# DB_PASSWORD=your_secure_password
```

---

## 🚀 Step 5: Start the Server

```bash
cd server
npm start
```

**Expected output:**
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

## 📊 Database Schema

### Tables Created Automatically

**1. users**
```sql
CREATE TABLE users (
  id VARCHAR(128) PRIMARY KEY,  -- Firebase UID
  email VARCHAR(255) NOT NULL UNIQUE,
  displayName VARCHAR(255),
  photoURL TEXT,
  emailVerified BOOLEAN DEFAULT FALSE,
  authMethod ENUM('email-password', 'magic-link', 'google'),
  lastLoginAt DATETIME,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  INDEX idx_email (email),
  INDEX idx_createdAt (createdAt)
);
```

**2. wishlist**
```sql
CREATE TABLE wishlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId VARCHAR(128) NOT NULL,
  productId VARCHAR(255),
  title VARCHAR(500) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  url TEXT NOT NULL,
  image TEXT,
  source VARCHAR(100),
  savedAt DATETIME NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_savedAt (savedAt)
);
```

**3. price_tracking**
```sql
CREATE TABLE price_tracking (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId VARCHAR(128) NOT NULL,
  productId VARCHAR(255) NOT NULL,
  productTitle VARCHAR(500),
  productUrl TEXT,
  currentPrice DECIMAL(10, 2) NOT NULL,
  targetPrice DECIMAL(10, 2) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  notified BOOLEAN DEFAULT FALSE,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_active (active),
  INDEX idx_productId (productId)
);
```

**4. price_history**
```sql
CREATE TABLE price_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  productId VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  source VARCHAR(100),
  recordedAt DATETIME NOT NULL,
  INDEX idx_productId (productId),
  INDEX idx_recordedAt (recordedAt)
);
```

**5. search_history**
```sql
CREATE TABLE search_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId VARCHAR(128) NOT NULL,
  query VARCHAR(500) NOT NULL,
  resultsCount INT DEFAULT 0,
  searchedAt DATETIME NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_searchedAt (searchedAt)
);
```

---

## 🔄 How User Sync Works

### Automatic Sync Flow

```
1. User signs up/in via Firebase
    ↓
2. Extension receives Firebase user data
    ↓
3. Extension calls: POST /api/user/sync
    ↓
4. Backend creates/updates user in MySQL
    ↓
5. User data now in both Firebase & MySQL
```

### What Gets Synced

- ✅ Firebase UID (primary key)
- ✅ Email
- ✅ Display name
- ✅ Photo URL
- ✅ Email verified status
- ✅ Auth method (email-password, magic-link)
- ✅ Last login timestamp

---

## 🧪 Testing the Setup

### Test 1: Check MySQL Connection

```bash
cd server
npm start
```

**Look for:**
```
✅ MySQL connection established successfully
✅ Database tables synchronized
```

### Test 2: Verify Tables Created

```bash
mysql -u root -p shopscout

SHOW TABLES;
```

**Expected output:**
```
+----------------------+
| Tables_in_shopscout  |
+----------------------+
| price_history        |
| price_tracking       |
| search_history       |
| users                |
| wishlist             |
+----------------------+
```

### Test 3: Sign Up and Check Database

1. **Sign up in extension**
   ```
   Email: test@example.com
   Password: testpass123
   ```

2. **Check MySQL**
   ```sql
   SELECT * FROM users;
   ```

3. **Expected:**
   ```
   User record with Firebase UID, email, etc.
   ```

### Test 4: Add to Wishlist

1. **In extension:** Add a product to wishlist
2. **Check MySQL:**
   ```sql
   SELECT * FROM wishlist WHERE userId = 'your-firebase-uid';
   ```

---

## 🔍 Useful MySQL Commands

### View all users
```sql
SELECT id, email, displayName, emailVerified, authMethod, createdAt 
FROM users 
ORDER BY createdAt DESC;
```

### View user's wishlist
```sql
SELECT w.*, u.email 
FROM wishlist w
JOIN users u ON w.userId = u.id
WHERE u.email = 'test@example.com';
```

### View price tracking
```sql
SELECT pt.*, u.email 
FROM price_tracking pt
JOIN users u ON pt.userId = u.id
WHERE pt.active = TRUE;
```

### Count items per user
```sql
SELECT u.email, COUNT(w.id) as wishlist_items
FROM users u
LEFT JOIN wishlist w ON u.id = w.userId
GROUP BY u.id, u.email;
```

### Delete test data
```sql
DELETE FROM users WHERE email LIKE '%test%';
-- Wishlist items will be auto-deleted due to CASCADE
```

---

## 🚨 Troubleshooting

### Issue: "Unable to connect to MySQL database"

**Solutions:**
1. Check MySQL is running:
   ```bash
   sudo systemctl status mysql
   ```

2. Verify credentials in `.env`:
   ```
   DB_USER=root
   DB_PASSWORD=your_password
   ```

3. Test connection manually:
   ```bash
   mysql -u root -p
   ```

### Issue: "Access denied for user"

**Solution:**
```sql
-- Login as root
sudo mysql

-- Grant privileges
GRANT ALL PRIVILEGES ON shopscout.* TO 'root'@'localhost' IDENTIFIED BY 'your_password';
FLUSH PRIVILEGES;
```

### Issue: "Table doesn't exist"

**Solution:**
Tables are created automatically. If missing:
```bash
# Restart server - it will create tables
cd server
npm start
```

### Issue: "User not syncing to MySQL"

**Check:**
1. Backend server is running
2. Extension console for sync errors
3. Backend logs for sync confirmation

---

## 📊 Performance Optimization

### Add Indexes (Already included)
```sql
-- Users
CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_createdAt ON users(createdAt);

-- Wishlist
CREATE INDEX idx_userId ON wishlist(userId);
CREATE INDEX idx_savedAt ON wishlist(savedAt);

-- Price Tracking
CREATE INDEX idx_userId ON price_tracking(userId);
CREATE INDEX idx_active ON price_tracking(active);
CREATE INDEX idx_productId ON price_tracking(productId);
```

### Query Optimization Tips
- Use `EXPLAIN` to analyze slow queries
- Add indexes on frequently queried columns
- Use `LIMIT` for large result sets
- Consider partitioning for large tables

---

## 🔐 Security Best Practices

### 1. Use Dedicated Database User
```sql
CREATE USER 'shopscout_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON shopscout.* TO 'shopscout_user'@'localhost';
```

### 2. Regular Backups
```bash
# Backup database
mysqldump -u root -p shopscout > shopscout_backup.sql

# Restore database
mysql -u root -p shopscout < shopscout_backup.sql
```

### 3. Enable SSL (Production)
```sql
SHOW VARIABLES LIKE '%ssl%';
```

---

## ✅ Verification Checklist

- [ ] MySQL installed and running
- [ ] `shopscout` database created
- [ ] Server `.env` configured with MySQL credentials
- [ ] Server starts without errors
- [ ] Tables created automatically
- [ ] User sign-up syncs to MySQL
- [ ] Wishlist operations work
- [ ] Price tracking works
- [ ] Data persists after server restart

---

## 🎯 Summary

**What You Have Now:**

✅ **Firebase Auth** - Handles authentication securely  
✅ **MySQL Database** - Stores all application data  
✅ **Automatic Sync** - Users synced from Firebase to MySQL  
✅ **Full Control** - Your data, your database  
✅ **Performance** - Fast local queries  
✅ **Scalability** - MySQL handles millions of records  

**Data Flow:**
```
Firebase (Auth) → Extension → Backend → MySQL (Data)
```

**Your extension is now a production-grade full-stack application!** 🚀

---

## 📚 Next Steps

1. **Start MySQL:** `sudo systemctl start mysql`
2. **Create database:** Follow Step 3 above
3. **Configure .env:** Add MySQL credentials
4. **Start server:** `cd server && npm start`
5. **Test:** Sign up and verify data in MySQL

**See `BACKEND_INTEGRATION_COMPLETE.md` for API usage examples!**
