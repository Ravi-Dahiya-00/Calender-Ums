const express = require('express');
const supabase = require('../config/supabase');

const router = express.Router();

// ─── GET /api/sources ───────────────────────────────────────────────────────
// Returns all configured event sources (used by calendar widget to know what to fetch)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('event_sources')
      .select('*')
      .eq('enabled', true)
      .order('label');

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/sources ──────────────────────────────────────────────────────
// Add a new event source (university provides their endpoint URL)
router.post('/', async (req, res) => {
  try {
    const { source_id, label, endpoint, color } = req.body;
    if (!source_id || !label || !endpoint) {
      return res.status(400).json({ success: false, message: 'source_id, label, and endpoint are required' });
    }

    const { data, error } = await supabase
      .from('event_sources')
      .insert([{ source_id, label, endpoint, color: color || '#6366F1', enabled: true }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PATCH /api/sources/:source_id/toggle ───────────────────────────────────
router.patch('/:source_id/toggle', async (req, res) => {
  try {
    const { data: current, error: fetchErr } = await supabase
      .from('event_sources')
      .select('enabled')
      .eq('source_id', req.params.source_id)
      .single();

    if (fetchErr || !current) {
      return res.status(404).json({ success: false, message: 'Source not found' });
    }

    const { data, error } = await supabase
      .from('event_sources')
      .update({ enabled: !current.enabled })
      .eq('source_id', req.params.source_id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
