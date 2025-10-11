// backend/routes/events.js
import express from 'express';
import { pool } from '../models/db.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all events for an owner (ownerEmail param) — accessible to authenticated users
router.get('/:ownerEmail', requireAuth, async (req, res) => {
  const owner = req.params.ownerEmail;
  try {
    const [rows] = await pool.query('SELECT * FROM events WHERE owner_email = ? ORDER BY date, start', [owner]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create event (owner_email must be included in body) — authenticated
router.post('/', requireAuth, async (req, res) => {
  const { owner_email, title, date, start, end, notes } = req.body;
  if (!owner_email || !title || !date) return res.status(400).json({ error: 'Missing fields' });
  try {
    const [result] = await pool.query(
      'INSERT INTO events (owner_email, title, date, start, end, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [owner_email, title, date, start || null, end || null, notes || null]
    );
    res.json({ id: result.insertId, message: 'Created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update event
router.put('/:id', requireAuth, async (req, res) => {
  const id = req.params.id;
  const { title, date, start, end, notes } = req.body;
  try {
    await pool.query('UPDATE events SET title=?, date=?, start=?, end=?, notes=? WHERE id=?', [title, date, start, end, notes, id]);
    res.json({ message: 'Updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete event
router.delete('/:id', requireAuth, async (req, res) => {
  const id = req.params.id;
  try {
    await pool.query('DELETE FROM events WHERE id=?', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
