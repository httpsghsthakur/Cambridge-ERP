const express = require('express');
const router = express.Router();
const { ClassFeeStructure, User, Student, Fee } = require('../models');
const { protect, hasPermission } = require('../middleware/auth');
const { cacheMiddleware, clearCache } = require('../utils/cache');

const ensureAdminModifier = (req, res) => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ message: 'Only admin can modify class fees.' });
    return false;
  }
  return true;
};

const propagateClassFees = async (cls, monthly_fee, admission_fee) => {
  try {
    const students = await Student.findAll({
      where: { class: cls, is_active: true, approval_status: 'approved' },
      attributes: ['id']
    });
    const studentIds = students.map(s => s.id);
    if (studentIds.length === 0) return;
    
    await Promise.all([
      Fee.update(
        { total_amount: parseFloat(monthly_fee || 0) },
        { where: { student_id: studentIds, fee_type: 'monthly', status: 'unpaid' } }
      ),
      Fee.update(
        { total_amount: parseFloat(admission_fee || 0) },
        { where: { student_id: studentIds, fee_type: 'admission', status: 'unpaid' } }
      )
    ]);
    console.log(`[classFees] Propagated fee updates to ${studentIds.length} students in class ${cls}.`);
  } catch (err) {
    console.error('[classFees] Propagation failed:', err);
  }
};

// GET /api/class-fees
router.get('/', protect, hasPermission('MANAGE_FEES'), cacheMiddleware(3600), async (req, res) => {
  try {
    const structures = await ClassFeeStructure.findAll({
      where: { is_active: true },
      include: [{ model: User, as: 'updatedByUser', attributes: ['id', 'name'] }],
      order: [['class', 'ASC']],
    });

    res.json(
      structures.map((structure) => ({
        id: structure.id,
        class: structure.class,
        monthly_fee: structure.monthly_fee,
        admission_fee: structure.admission_fee,
        updated_at: structure.updated_at,
        updated_by_user: structure.updatedByUser || null,
      }))
    );
  } catch (err) {
    console.error('[class-fees][GET /]', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/class-fees
router.post('/', protect, hasPermission('MANAGE_FEES'), async (req, res) => {
  if (!ensureAdminModifier(req, res)) return;

  try {
    const { class: cls, monthly_fee, admission_fee } = req.body;

    if (!cls) {
      return res.status(400).json({ message: 'Class is required.' });
    }

    const payload = {
      class: cls,
      monthly_fee: parseFloat(monthly_fee || 0),
      admission_fee: parseFloat(admission_fee || 0),
      updated_by: req.user.id,
      is_active: true,
    };

    const existing = await ClassFeeStructure.findOne({ where: { class: cls } });
    let structure;

    if (existing) {
      await existing.update(payload);
      structure = existing;
    } else {
      structure = await ClassFeeStructure.create(payload);
    }

    await propagateClassFees(cls, monthly_fee, admission_fee);

    res.status(existing ? 200 : 201).json({
      message: `Class fee for ${cls} ${existing ? 'updated' : 'created'}.`,
      structure,
    });
  } catch (err) {
    console.error('[class-fees][POST /]', err);
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/class-fees/:class
router.put('/:class', protect, hasPermission('MANAGE_FEES'), async (req, res) => {
  if (!ensureAdminModifier(req, res)) return;

  try {
    const structure = await ClassFeeStructure.findOne({
      where: { class: req.params.class, is_active: true },
    });

    if (!structure) {
      return res.status(404).json({ message: 'Class fee structure not found.' });
    }

    await structure.update({
      monthly_fee: req.body.monthly_fee !== undefined ? parseFloat(req.body.monthly_fee || 0) : structure.monthly_fee,
      admission_fee: req.body.admission_fee !== undefined ? parseFloat(req.body.admission_fee || 0) : structure.admission_fee,
      updated_by: req.user.id,
    });

    await propagateClassFees(req.params.class, structure.monthly_fee, structure.admission_fee);

    res.json({
      message: `Class fee for ${req.params.class} updated.`,
      structure,
    });
  } catch (err) {
    console.error('[class-fees][PUT /:class]', err);
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
