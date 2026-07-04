const express = require('express');
const router = express.Router();
const User = require('../models/User');
const House = require('../models/House');
const Appointment = require('../models/Appointment');
const Contract = require('../models/Contract');
const Setting = require('../models/Setting');
const OperationLog = require('../models/OperationLog');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/admin/users - List all users
router.get('/users', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { search, role } = req.query;
    const filter = {};

    if (role) {
      filter.role = role;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/users/:id/status - Enable/disable user
router.put('/users/:id/status', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['active', 'disabled'].includes(status)) {
      return res.status(400).json({ message: '状态值无效' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    user.status = status;
    await user.save();

    await OperationLog.create({
      operatorId: req.user._id,
      action: 'update_user_status',
      targetType: 'User',
      targetId: user._id,
      detail: `将用户「${user.name}」状态改为：${status === 'active' ? '启用' : '禁用'}`,
    });

    res.json(user);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/stats - Get statistics
router.get('/stats', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const [userCountResult, houseCountResult, appointmentCount, contractCount, popularAreas, rentRanges] = await Promise.all([
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      House.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Appointment.countDocuments(),
      Contract.countDocuments(),
      House.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: '$area', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      House.aggregate([
        { $match: { status: 'approved' } },
        {
          $group: {
            _id: null,
            min: { $min: '$rent' },
            max: { $max: '$rent' },
            avg: { $avg: '$rent' },
          },
        },
      ]),
    ]);

    const userCount = {};
    userCountResult.forEach((item) => {
      userCount[item._id] = item.count;
    });

    const houseCount = {};
    houseCountResult.forEach((item) => {
      houseCount[item._id] = item.count;
    });

    res.json({
      userCount,
      houseCount,
      appointmentCount,
      contractCount,
      popularAreas,
      rentRanges: rentRanges[0] || { min: 0, max: 0, avg: 0 },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/settings - Get all system settings
router.get('/settings', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const settings = await Setting.find();
    const result = {};
    settings.forEach((s) => {
      result[s.key] = s.value;
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/settings - Update settings
router.put('/settings', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const updates = req.body;
    const results = [];

    for (const [key, value] of Object.entries(updates)) {
      const setting = await Setting.findOneAndUpdate(
        { key },
        { value, updatedBy: req.user._id, updatedAt: Date.now() },
        { upsert: true, new: true },
      );
      results.push(setting);
    }

    await OperationLog.create({
      operatorId: req.user._id,
      action: 'update_settings',
      targetType: 'Setting',
      detail: `更新系统设置：${Object.keys(updates).join(', ')}`,
    });

    const settings = await Setting.find();
    const result = {};
    settings.forEach((s) => {
      result[s.key] = s.value;
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
