const express = require('express');
const router = express.Router();
const FinanceRecord = require('../models/FinanceRecord');
const IncomeUpdateLog = require('../models/IncomeUpdateLog');
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

// GET /api/finance/updates - Get income update history (landlord)
router.get('/updates', authenticate, authorize('landlord'), async (req, res, next) => {
  try {
    const filter = { landlordId: req.user._id };
    const { startDate, endDate, contractId } = req.query;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    if (contractId) {
      filter.contractId = contractId;
    }

    const updates = await IncomeUpdateLog.find(filter)
      .populate('contractId', 'rent deposit startDate endDate status')
      .populate('houseId', 'title address')
      .populate('operatorId', 'name')
      .sort({ createdAt: -1 });

    res.json(updates);
  } catch (err) {
    next(err);
  }
});

// POST /api/finance - Create finance record
router.post('/', authenticate, authorize('landlord'), async (req, res, next) => {
  try {
    const { houseId, amount, month } = req.body;

    if (!houseId || !amount || !month) {
      return res.status(400).json({ message: '请填写必填字段' });
    }

    const house = await House.findById(houseId);
    if (!house) {
      return res.status(404).json({ message: '房源不存在' });
    }
    if (house.landlordId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权为此房源添加财务记录' });
    }

    // Find active contract for this house
    const contract = await Contract.findOne({
      houseId,
      landlordId: req.user._id,
      status: { $in: ['signed', 'pending_sign'] },
    });

    if (!contract) {
      return res.status(400).json({ message: '该房源没有有效的合同，请先创建合同' });
    }

    const record = new FinanceRecord({
      landlordId: req.user._id,
      houseId,
      contractId: contract._id,
      amount,
      month,
    });

    await record.save();
    const populated = await FinanceRecord.findById(record._id)
      .populate('houseId', 'title address')
      .populate('contractId', 'startDate endDate rent');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
