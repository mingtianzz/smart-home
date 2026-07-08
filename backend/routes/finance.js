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
    let endDate = new Date();
    if (req.query.endMonth) {
      const [year, month] = req.query.endMonth.split('-');
      endDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    }
    const endMonth = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`;
    
    const startDate = new Date(endDate);
    startDate.setFullYear(startDate.getFullYear() - 1);
    const startMonth = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;

    const filter = { landlordId: req.user._id };
    if (req.query.houseId) {
      filter.houseId = req.query.houseId;
    }

    const stats = await FinanceRecord.aggregate([
      { $match: { ...filter, month: { $gte: startMonth, $lte: endMonth } } },
      {
        $group: {
          _id: '$month',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const statsMap = {};
    stats.forEach(s => {
      statsMap[s._id] = { amount: s.totalAmount, count: s.count };
    });

    const chartData = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      const monthStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      chartData.push({
        period: monthStr,
        amount: statsMap[monthStr]?.amount || 0,
        count: statsMap[monthStr]?.count || 0,
      });
      current.setMonth(current.getMonth() + 1);
    }

    const totalIncome = await FinanceRecord.aggregate([
      { $match: { landlordId: req.user._id, month: { $lte: endMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    const monthlyIncome = await FinanceRecord.aggregate([
      { $match: { landlordId: req.user._id, month: endMonth } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    res.json({
      chartData,
      totalIncome: totalIncome[0]?.total || 0,
      monthlyIncome: monthlyIncome[0]?.total || 0,
      totalCount: totalIncome[0]?.count || 0,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
