// backend/routes/remarks.js
import express from 'express';
import { pool } from '../models/db.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { isBefore, parseISO } from 'date-fns';

const router = express.Router();

// Get remark for owner (single remark record per owner)
router.get('/:owner', requireAuth, async (req, res) => {
  const owner = req.params.owner;
  try {
    const [rows] = await pool.query('SELECT * FROM remarks WHERE owner_email = ?', [owner]);
    res.json(rows[0] || { owner_email: owner, remarks: '' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update/Set remarks — only owner (boss) can update their remarks
// Body: { owner_email, remarks, date }  -> we will allow saving remarks but only the owner can update them
router.post('/', requireAuth, async (req, res) => {
  const { owner_email, remarks } = req.body;
  if (!owner_email) return res.status(400).json({ error: 'Missing owner_email' });

  // Only the owner can edit their remarks.
  if (req.user.email !== owner_email) return res.status(403).json({ error: 'Only owner can edit remarks' });

  try {
    const [rows] = await pool.query('SELECT * FROM remarks WHERE owner_email = ?', [owner_email]);
    if (!rows || rows.length === 0) {
      await pool.query('INSERT INTO remarks (owner_email, remarks) VALUES (?, ?)', [owner_email, remarks || '']);
    } else {
      await pool.query('UPDATE remarks SET remarks = ? WHERE owner_email = ?', [remarks || '', owner_email]);
    }
    res.json({ message: 'Saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
