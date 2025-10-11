// backend/routes/auth.js
import express from 'express';
import { pool } from '../models/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';

dotenv.config();
const router = express.Router();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper to create JWT
function makeToken(user) {
  return jwt.sign({ email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
}

/**
 * Register (create new user)
 * - For initial boss creation you can call this directly or create via DB.
 * - Role: 'boss'|'secretary'|'viewer'
 */
router.post('/register', async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
  try {
    const hashed = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [email, hashed, role || 'viewer']);
    res.json({ message: 'Registered' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email already exists' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Email / password login
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows || rows.length === 0) return res.status(400).json({ error: 'User not found' });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
    const token = makeToken({ email: user.email, role: user.role });
    res.json({ token, email: user.email, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Google Sign-in (frontend obtains idToken from Google Sign-In and sends it here)
 * Body: { idToken }
 * We verify the idToken, extract email, create user if missing (role=viewer), then return JWT.
 */
router.post('/google', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: 'Missing idToken' });

  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload(); // contains email, name, etc.
    const email = payload.email;
    // find or create
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    let user;
    if (!rows || rows.length === 0) {
      // auto-create as viewer
      await pool.query('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [email, '', 'viewer']);
      user = { email, role: 'viewer' };
    } else {
      user = rows[0];
    }
    const token = makeToken(user);
    res.json({ token, email: user.email, role: user.role });
  } catch (err) {
    console.error('Google login error', err);
    res.status(500).json({ error: 'Google verification failed' });
  }
});

/**
 * GitHub OAuth code exchange
 * Frontend does redirect to GitHub, gets a code, sends it to this endpoint:
 * Body: { code, redirect_uri }
 *
 * We exchange code for access_token, fetch user emails, pick primary verified email.
 */
router.post('/github', async (req, res) => {
  const { code, redirect_uri } = req.body;
  if (!code) return res.status(400).json({ error: 'Missing code' });

  try {
    // Exchange code for access token
    const tokenRes = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri
    }, {
      headers: { Accept: 'application/json' }
    });

    const accessToken = tokenRes.data.access_token;
    if (!accessToken) return res.status(400).json({ error: 'GitHub token exchange failed' });

    // Fetch user emails
    const emailsRes = await axios.get('https://api.github.com/user/emails', {
      headers: { Authorization: `token ${accessToken}`, Accept: 'application/vnd.github+json' }
    });
    // choose primary verified email
    const emails = emailsRes.data;
    const primary = emails.find(e => e.primary && e.verified) || emails.find(e => e.verified) || emails[0];
    if (!primary || !primary.email) return res.status(400).json({ error: 'No usable email from GitHub' });

    const email = primary.email;
    // find or create user
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    let user;
    if (!rows || rows.length === 0) {
      await pool.query('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [email, '', 'viewer']);
      user = { email, role: 'viewer' };
    } else {
      user = rows[0];
    }
    const token = makeToken(user);
    res.json({ token, email: user.email, role: user.role });

  } catch (err) {
    console.error('GitHub OAuth error', err.response?.data || err.message || err);
    res.status(500).json({ error: 'GitHub login failed' });
  }
});

export default router;
