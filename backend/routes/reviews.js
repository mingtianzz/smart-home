const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const House = require('../models/House');
const OperationLog = require('../models/OperationLog');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/reviews/house/:houseId - Get visible reviews for a house
router.get('/house/:houseId', async (req, res, next) => {
  try {
    const reviews = await Review.find({ houseId: req.params.houseId, visible: true })
      .populate('tenantId', 'name')
      .sort({ createdAt: -1 });

    const result = await Review.aggregate([
      { $match: { houseId: req.params.houseId, visible: true } },
      { $group: { _id: null, averageScore: { $avg: '$score' }, count: { $sum: 1 } } },
    ]);

    const averageScore = result.length > 0 ? Math.round(result[0].averageScore * 10) / 10 : 0;

    res.json({ reviews, averageScore, total: reviews.length });
  } catch (err) {
    next(err);
  }
});

// POST /api/reviews - Create review (tenant)
router.post('/', authenticate, authorize('tenant'), async (req, res, next) => {
  try {
    const { houseId, score, content } = req.body;

    if (!houseId || !score) {
      return res.status(400).json({ message: '请填写必填字段' });
    }

    if (score < 1 || score > 5) {
      return res.status(400).json({ message: '评分范围为1-5' });
    }

    const house = await House.findById(houseId);
    if (!house) {
      return res.status(404).json({ message: '房源不存在' });
    }

    const existing = await Review.findOne({ tenantId: req.user._id, houseId });
    if (existing) {
      return res.status(400).json({ message: '您已经评价过此房源' });
    }

    const review = new Review({
      tenantId: req.user._id,
      houseId,
      landlordId: house.landlordId,
      score,
      content: content || '',
    });

    await review.save();
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
});

// PUT /api/reviews/:id/hide - Toggle review visibility (admin)
router.put('/:id/hide', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: '评价不存在' });
    }

    review.visible = !review.visible;
    await review.save();

    await OperationLog.create({
      operatorId: req.user._id,
      action: 'toggle_review_visibility',
      targetType: 'Review',
      targetId: review._id,
      detail: `${review.visible ? '显示' : '隐藏'}评价，房源ID：${review.houseId}`,
    });

    res.json(review);
  } catch (err) {
    next(err);
  }
});

// GET /api/reviews/my - Get my reviews (tenant)
router.get('/my', authenticate, authorize('tenant'), async (req, res, next) => {
  try {
    const reviews = await Review.find({ tenantId: req.user._id })
      .populate('houseId', 'title address')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
