const express = require('express');
const { Op } = require('sequelize');
const { SecurityLog, User, sequelize } = require('../models');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/security-logs
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 50, severity } = req.query;
    
    const where = {};
    if (severity) {
      where.severity = severity;
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await SecurityLog.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
      logs: rows,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/security-logs/stats
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const stats = await SecurityLog.findAll({
      attributes: [
        'severity',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['severity']
    });
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
