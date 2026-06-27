const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const supabase = require('../config/supabase');

const router = express.Router();

// ─── Validation Middleware ─────────────────────────────────────────────────
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// ─── Authentication Middleware ─────────────────────────────────────────────
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const apiKey = process.env.ADMIN_API_KEY;
  
  if (!apiKey) {
    console.warn('WARNING: ADMIN_API_KEY is not set in backend. All write operations will fail.');
    return res.status(500).json({ success: false, message: 'Server configuration error' });
  }

  if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid or missing API key' });
  }
  
  next();
};

// ─── GET /api/events ────────────────────────────────────────────────────────
// Fetch all events with optional filters: type, branch, semester, from, to
router.get(
  '/',
  [
    query('type').optional().isString().trim(),
    query('branch').optional().isString().trim(),
    query('semester').optional().isInt({ min: 1, max: 8 }),
    query('from').optional().isISO8601(),
    query('to').optional().isISO8601(),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { type, branch, semester, from, to } = req.query;

      let queryBuilder = supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: true });

      if (type) queryBuilder = queryBuilder.eq('type', type.toUpperCase());
      if (branch) queryBuilder = queryBuilder.or(`branch.eq.${branch},branch.eq.ALL`);
      if (semester) queryBuilder = queryBuilder.or(`semester.eq.${semester},semester.is.null`);
      if (from) queryBuilder = queryBuilder.gte('start_time', from);
      if (to) queryBuilder = queryBuilder.lte('end_time', to);

      const { data, error } = await queryBuilder;
      if (error) throw error;

      // Transform to universal event contract expected by frontend
      const events = data.map(transformEventToContract);

      res.json({ success: true, count: events.length, data: events });
    } catch (err) {
      console.error('GET /events error:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch events', error: err.message });
    }
  }
);

// ─── GET /api/events/:id ────────────────────────────────────────────────────
router.get(
  '/:id',
  [param('id').isUUID()],
  handleValidation,
  async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (error || !data) {
        return res.status(404).json({ success: false, message: 'Event not found' });
      }

      res.json({ success: true, data: transformEventToContract(data) });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ─── POST /api/events ───────────────────────────────────────────────────────
router.post(
  '/',
  requireAuth,
  [
    body('title').notEmpty().trim().isLength({ max: 200 }),
    body('type').notEmpty().trim().toUpperCase(),
    body('start_time').isISO8601().withMessage('start_time must be ISO 8601 format'),
    body('end_time').isISO8601().withMessage('end_time must be ISO 8601 format')
      .custom((value, { req }) => {
        if (new Date(value) <= new Date(req.body.start_time)) {
          throw new Error('end_time must be strictly after start_time');
        }
        return true;
      }),
    body('description').optional().trim(),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/),
    body('venue').optional().trim(),
    body('subject').optional().trim(),
    body('branch').optional({ nullable: true }).trim().toUpperCase(),
    body('semester').optional({ nullable: true }).isInt({ min: 1, max: 8 }),
    body('metadata').optional({ nullable: true }).isObject(),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { title, type, start_time, end_time, description, color, venue, subject, branch, semester, metadata } = req.body;

      const { data, error } = await supabase
        .from('events')
        .insert([{ title, type, start_time, end_time, description, color, venue, subject, branch: branch || 'ALL', semester: semester || null, metadata: metadata || {} }])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ success: true, message: 'Event created successfully', data: transformEventToContract(data) });
    } catch (err) {
      console.error('POST /events error:', err);
      res.status(500).json({ success: false, message: 'Failed to create event', error: err.message });
    }
  }
);

// ─── PUT /api/events/:id ────────────────────────────────────────────────────
router.put(
  '/:id',
  requireAuth,
  [
    param('id').isUUID(),
    body('title').optional().trim().isLength({ max: 200 }),
    body('type').optional().trim().toUpperCase(),
    body('start_time').optional().isISO8601(),
    body('end_time').optional().isISO8601()
      .custom((value, { req }) => {
        if (req.body.start_time && new Date(value) <= new Date(req.body.start_time)) {
          throw new Error('end_time must be strictly after start_time');
        }
        return true;
      }),
    body('description').optional().trim(),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/),
    body('venue').optional().trim(),
    body('subject').optional().trim(),
    body('branch').optional({ nullable: true }).trim().toUpperCase(),
    body('semester').optional({ nullable: true }).isInt({ min: 1, max: 8 }),
    body('metadata').optional({ nullable: true }).isObject(),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const updates = { ...req.body, updated_at: new Date().toISOString() };

      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', req.params.id)
        .select()
        .single();

      if (error || !data) {
        return res.status(404).json({ success: false, message: 'Event not found or update failed' });
      }

      res.json({ success: true, message: 'Event updated successfully', data: transformEventToContract(data) });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ─── DELETE /api/events/:id ─────────────────────────────────────────────────
router.delete(
  '/:id',
  requireAuth,
  [param('id').isUUID()],
  handleValidation,
  async (req, res) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', req.params.id);

      if (error) throw error;

      res.json({ success: true, message: 'Event deleted successfully' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ─── GET /api/events/types/all ──────────────────────────────────────────────
// Returns all distinct event types stored in the DB (useful for dynamic filter bar)
router.get('/types/all', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('type')
      .order('type');

    if (error) throw error;

    const types = [...new Set(data.map(e => e.type))];
    res.json({ success: true, data: types });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Transform DB row → Universal Event Contract ────────────────────────────
function transformEventToContract(row) {
  return {
    id: row.id,
    title: row.title,
    start: row.start_time,   // React Big Calendar uses 'start'
    end: row.end_time,       // React Big Calendar uses 'end'
    type: row.type,
    description: row.description || '',
    color: row.color || '#6366F1',
    venue: row.venue || '',
    subject: row.subject || '',
    branch: row.branch || 'ALL',
    semester: row.semester,
    metadata: row.metadata || {},
    created_at: row.created_at,
    // Alias fields for FullCalendar compatibility (future-proofing)
    start_time: row.start_time,
    end_time: row.end_time,
  };
}

module.exports = router;
