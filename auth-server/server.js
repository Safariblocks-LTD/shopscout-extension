/**
 * ShopScout Authentication Web Server
 * Serves the authentication page on http://localhost:8000
 */

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.AUTH_PORT || 8000;

// Middleware
app.use(cors({
  origin: true, // Allow any origin but reflect it back (not wildcard)
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// Serve the authentication page
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.get('/auth', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ShopScout Auth Server' });
});

// Check authentication status
let authData = null;
let authDataTimestamp = null;

app.get('/check-auth', (req, res) => {
  console.log('[Auth Server] Check-auth request received');
  
  if (authData) {
    // Check if data is not too old (30 seconds max)
    const now = Date.now();
    if (authDataTimestamp && (now - authDataTimestamp) < 30000) {
      const data = authData;
      authData = null; // Clear after reading
      authDataTimestamp = null;
      console.log('[Auth Server] Returning auth data for:', data.email);
      res.json({ authenticated: true, user: data });
    } else {
      // Data too old, clear it
      authData = null;
      authDataTimestamp = null;
      console.log('[Auth Server] Auth data expired, cleared');
      res.json({ authenticated: false });
    }
  } else {
    res.json({ authenticated: false });
  }
});

// Store authentication data
app.post('/auth-success', express.json(), (req, res) => {
  authData = req.body.user;
  authDataTimestamp = Date.now();
  console.log('[Auth Server] ✅ Authentication successful for:', authData.email);
  console.log('[Auth Server] Auth data stored, waiting for extension to poll...');
  res.json({ success: true });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🔐 ShopScout Authentication Server                 ║
║                                                       ║
║   Status: Running                                     ║
║   Port: ${PORT}                                        ║
║   URL: http://localhost:${PORT}                        ║
║                                                       ║
║   Ready to authenticate users! 🚀                    ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});
