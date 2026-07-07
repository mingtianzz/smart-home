const express = require('express');
const router = express.Router();
const FinanceRecord = require('../models/FinanceRecord');
const House = require('../models/House');
const Contract = require('../models/Contract');
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
      .populate('contractId', 'startDate endDate rent')
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (err) {
    next(err);
  }
});

// GET /api/finance/stats - Get income statistics for charts (landlord)
router.get('/stats', authenticate, authorize('landlord'), async (req, res, next) => {
  try {
    const filter = { landlordId: req.user._id };

    if (req.query.startMonth) {
      filter.month = { $gte: req.query.startMonth };
    }
    if (req.query.endMonth) {
      filter.month = { ...filter.month, $lte: req.query.endMonth };
    }
    if (req.query.houseId) {
      filter.houseId = req.query.houseId;
    }

    const granularity = req.query.granularity || 'month'; // day, week, month

    let groupId;
    if (granularity === 'month') {
      groupId = '$month';
    } else {
      // Default to month grouping
      groupId = '$month';
    }

    const stats = await FinanceRecord.aggregate([
      { $match: filter },
      {
        $group: {
          _id: groupId,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totalIncome = await FinanceRecord.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    res.json({
      chartData: stats.map(s => ({ period: s._id, amount: s.totalAmount, count: s.count })),
      summary: totalIncome[0] || { total: 0, count: 0 },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
