const express = require('express');
const { Op } = require('sequelize');
const { AuditLog, User, sequelize } = require('../models');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/logs/analytics
router.get('/analytics', protect, authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};
    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const byAction = await AuditLog.findAll({
      where,
      attributes: ['action', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['action'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 10
    });

    const byModule = await AuditLog.findAll({
      where,
      attributes: ['target_type', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['target_type'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
    });

    const byDateRaw = await AuditLog.findAll({
      where,
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
      limit: 30
    });

    res.json({ byAction, byModule, byDate: byDateRaw });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/logs
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 50, startDate, endDate, targetType, userId, action } = req.query;
    
    const where = {};
    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }
    if (targetType) where.target_type = targetType;
    if (userId) where.user_id = userId;
    if (action) where.action = { [Op.like]: '%' + action + '%' };

    const offset = (page - 1) * limit;

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'role'] }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({ total: count, page: parseInt(page), pages: Math.ceil(count / limit), logs: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

