const express = require('express');
const router = express.Router();
const FinanceRecord = require('../models/FinanceRecord');
const House = require('../models/House');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/finance - Get finance records (landlord)
router.get('/', authenticate, authorize('landlord'), async (req, res, next) => {
  try {
    const filter = { landlordId: req.user._id };

    if (req.query.month) {
      filter.month = req.query.month;
    }
    if (req.query.houseId) {
      filter.houseId = req.query.houseId;
    }

    const records = await FinanceRecord.find(filter)
      .populate('houseId', 'title address')
      .populate('contractId', 'startDate endDate')
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (err) {
    next(err);
  }
});

// POST /api/finance - Create finance record
router.post('/', authenticate, authorize('landlord'), async (req, res, next) => {
  try {
    const { houseId, contractId, amount, month } = req.body;

    if (!houseId || !contractId || !amount || !month) {
      return res.status(400).json({ message: '请填写必填字段' });
    }

    const house = await House.findById(houseId);
    if (!house) {
      return res.status(404).json({ message: '房源不存在' });
    }
    if (house.landlordId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权为此房源添加财务记录' });
    }

    const record = new FinanceRecord({
      landlordId: req.user._id,
      houseId,
      contractId,
      amount,
      month,
    });

    await record.save();
    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
