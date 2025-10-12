/**
 * ShopScout Authentication Web Server
 * Production URL: https://shopscout-auth.fly.dev
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
  origin: [
    'https://shopscout-api.fly.dev',
    'https://shopscout-auth.fly.dev',
    'chrome-extension://*',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8000',
    'http://localhost:8001'
  ],
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
    // Check if data is not too old (60 seconds max - increased for better reliability)
    const now = Date.now();
    if (authDataTimestamp && (now - authDataTimestamp) < 60000) {
      const data = authData;
      // Don't clear immediately - let multiple polls succeed
      console.log('[Auth Server] Returning auth data for:', data.email);
      res.json({ authenticated: true, user: data });
      
      // Clear after 5 seconds to allow multiple polls
      setTimeout(() => {
        if (authData && authData.uid === data.uid) {
          authData = null;
          authDataTimestamp = null;
          console.log('[Auth Server] Auth data cleared after successful delivery');
        }
      }, 5000);
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
