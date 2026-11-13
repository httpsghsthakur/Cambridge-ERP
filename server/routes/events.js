const express = require('express');
const router = express.Router();
const { Event, User } = require('../models');
const { protect, isAdmin } = require('../middleware/auth');
const { clearCache } = require('../utils/cache');

const { Op } = require('sequelize');

const getIstStartOfTodayUtc = () => {
  const istOffsetMs = 330 * 60 * 1000;
  const nowIst = new Date(Date.now() + istOffsetMs);
  return new Date(
    Date.UTC(nowIst.getUTCFullYear(), nowIst.getUTCMonth(), nowIst.getUTCDate(), 0, 0, 0) - istOffsetMs
  );
};

// GET /api/events - View active events (supports ?includePast=true for Admin management)
router.get('/', protect, async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const includePast = req.query.includePast === 'true';

    const where = { is_active: true };
    if (!includePast) {
      where.event_date = { [Op.gte]: getIstStartOfTodayUtc() };
    }

    const events = await Event.findAll({
      where,
      include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }],
      order: [['event_date', includePast ? 'DESC' : 'ASC']],
    });

    res.json(events.map(e => e.toJSON()));
  } catch (err) {
    console.error('[events][GET /]', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/events - Create a new event (Admin/Admin2 only)
router.post('/', protect, isAdmin, async (req, res) => {
  try {
    const { title, description, event_date, location } = req.body;
    if (!title || !event_date) {
      return res.status(400).json({ message: 'Title and event date are required.' });
    }
    const parsedDate = new Date(event_date);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid event date format.' });
    }

    const event = await Event.create({
      title: title.trim(),
      description: description ? description.trim() : null,
      event_date: parsedDate,
      location: location ? location.trim() : null,
      is_active: true,
      created_by: req.user.id,
    });

    await clearCache('/events');
    await clearCache('/dashboard');
    res.status(201).json(event.toJSON());
  } catch (err) {
    console.error('[events][POST /]', err);
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/events/:id - Update an event (Admin/Admin2 only)
router.put('/:id', protect, isAdmin, async (req, res) => {
  try {
    const { title, description, event_date, location, is_active } = req.body;
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    let nextDate = event.event_date;
    if (event_date !== undefined) {
      const parsedDate = new Date(event_date);
      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: 'Invalid event date format.' });
      }
      nextDate = parsedDate;
    }

    await event.update({
      title: title !== undefined ? title.trim() : event.title,
      description: description !== undefined ? description.trim() : event.description,
      event_date: nextDate,
      location: location !== undefined ? location.trim() : event.location,
      is_active: is_active !== undefined ? is_active : event.is_active,
    });

    await clearCache('/events');
    await clearCache('/dashboard');
    res.json(event.toJSON());
  } catch (err) {
    console.error('[events][PUT /:id]', err);
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/events/:id - Delete an event (Admin/Admin2 only)
router.delete('/:id', protect, isAdmin, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    await event.destroy();

    await clearCache('/events');
    await clearCache('/dashboard');
    res.json({ message: 'Event deleted successfully.' });
  } catch (err) {
    console.error('[events][DELETE /:id]', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
