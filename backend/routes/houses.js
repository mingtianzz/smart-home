const express = require('express');
const router = express.Router();
const House = require('../models/House');
const Contract = require('../models/Contract');
const OperationLog = require('../models/OperationLog');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/houses - List approved houses for tenants (public)
router.get('/', async (req, res, next) => {
  try {
    const { area, minRent, maxRent, type, keyword, page = 1, limit = 12 } = req.query;
    const filter = { status: 'approved' };

    if (area) {
      filter.area = { $regex: area, $options: 'i' };
    }
    if (minRent || maxRent) {
      filter.rent = {};
      if (minRent) filter.rent.$gte = Number(minRent);
      if (maxRent) filter.rent.$lte = Number(maxRent);
    }
    if (type) {
      filter.type = type;
    }
    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { address: { $regex: keyword, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Math.min(100, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [houses, total] = await Promise.all([
      House.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      House.countDocuments(filter),
    ]);

    res.json({ houses, total, page: pageNum, limit: limitNum });
  } catch (err) {
    next(err);
  }
});

// GET /api/houses/all - List all houses for admin review
router.get('/all', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    const houses = await House.find(filter).populate('landlordId', 'name phone').sort({ createdAt: -1 });
    res.json(houses);
  } catch (err) {
    next(err);
  }
});

// GET /api/houses/my - List landlord's own houses
router.get('/my', authenticate, authorize('landlord'), async (req, res, next) => {
  try {
    const filter = { landlordId: req.user._id };
    if (req.query.status) {
      filter.status = req.query.status;
    }
    const houses = await House.find(filter).sort({ createdAt: -1 });
    res.json({ houses });
  } catch (err) {
    next(err);
  }
});

// GET /api/houses/pending - List pending houses for admin review
router.get('/pending', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const houses = await House.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(houses);
  } catch (err) {
    next(err);
  }
});

// GET /api/houses/:id - Get house detail with landlord info
router.get('/:id', async (req, res, next) => {
  try {
    const house = await House.findById(req.params.id).populate('landlordId', 'name phone');
    if (!house) {
      return res.status(404).json({ message: '房源不存在' });
    }
    res.json(house);
  } catch (err) {
    next(err);
  }
});

// POST /api/houses - Create house
router.post('/', authenticate, authorize('landlord'), async (req, res, next) => {
  try {
    const { title, area, address, rent, deposit, type, size, floor, facilities, description, images, landlordName, landlordPhone } = req.body;

    if (!title || !area || !address || !type || !landlordName || !landlordPhone) {
      return res.status(400).json({ message: '请填写必填字段（标题、区域、地址、类型、姓名、联系方式）' });
    }

    const numRent = Number(rent);
    const numSize = Number(size);
    if (isNaN(numRent) || numRent <= 0) {
      return res.status(400).json({ message: '租金必须是大于 0 的数字' });
    }
    if (isNaN(numSize) || numSize <= 0) {
      return res.status(400).json({ message: '面积必须是大于 0 的数字' });
    }

    const house = new House({
      landlordId: req.user._id,
      landlordName,
      landlordPhone,
      title,
      area,
      address,
      rent: numRent,
      deposit: Math.max(0, Number(deposit) || 0),
      type,
      size: numSize,
      floor: floor || '',
      facilities: facilities || [],
      description: description || '',
      images: images || [],
    });

    await house.save();
    res.status(201).json(house);
  } catch (err) {
    next(err);
  }
});

// PUT /api/houses/:id - Update house
router.put('/:id', authenticate, authorize('landlord'), async (req, res, next) => {
  try {
    const house = await House.findById(req.params.id);
    if (!house) {
      return res.status(404).json({ message: '房源不存在' });
    }
    if (house.landlordId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权修改此房源' });
    }

    const { rent, deposit, size } = req.body;
    if (rent !== undefined) {
      const num = Number(rent);
      if (isNaN(num) || num <= 0) return res.status(400).json({ message: '租金必须是大于 0 的数字' });
      house.rent = num;
    }
    if (deposit !== undefined) {
      house.deposit = Math.max(0, Number(deposit) || 0);
    }
    if (size !== undefined) {
      const num = Number(size);
      if (isNaN(num) || num <= 0) return res.status(400).json({ message: '面积必须是大于 0 的数字' });
      house.size = num;
    }

    const stringFields = ['title', 'area', 'address', 'type', 'floor', 'description', 'landlordName', 'landlordPhone'];
    stringFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        house[field] = req.body[field];
      }
    });

    const arrayFields = ['facilities', 'images'];
    arrayFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        house[field] = req.body[field];
      }
    });

    await house.save();
    res.json(house);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/houses/:id - Soft delete (set status to offline)
router.delete('/:id', authenticate, authorize('landlord'), async (req, res, next) => {
  try {
    const house = await House.findById(req.params.id);
    if (!house) {
      return res.status(404).json({ message: '房源不存在' });
    }
    if (house.landlordId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权删除此房源' });
    }

    house.status = 'offline';
    await house.save();
    res.json({ message: '房源已下线' });
  } catch (err) {
    next(err);
  }
});

// PUT /api/houses/:id/review - Review house (admin)
router.put('/:id/review', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { status, rejectReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: '审核状态无效' });
    }

    const house = await House.findById(req.params.id);
    if (!house) {
      return res.status(404).json({ message: '房源不存在' });
    }

    house.status = status;
    if (status === 'rejected' && rejectReason) {
      house.rejectReason = rejectReason;
    }
    await house.save();

    await OperationLog.create({
      operatorId: req.user._id,
      action: 'review_house',
      targetType: 'House',
      targetId: house._id,
      detail: `审核房源「${house.title}」，结果：${status === 'approved' ? '已通过' : '已拒绝'}${rejectReason ? '，原因：' + rejectReason : ''}`,
    });

    res.json(house);
  } catch (err) {
    next(err);
  }
});

// PUT /api/houses/:id/status - Toggle on/offline (landlord)
router.put('/:id/status', authenticate, authorize('landlord'), async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['approved', 'offline'].includes(status)) {
      return res.status(400).json({ message: '状态值无效' });
    }

    const house = await House.findById(req.params.id);
    if (!house) {
      return res.status(404).json({ message: '房源不存在' });
    }
    if (house.landlordId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权操作此房源' });
    }

    // 上架前检查是否有未到期的合同
    if (status === 'approved') {
      const activeContract = await Contract.findOne({
        houseId: req.params.id,
        status: 'signed',
        endDate: { $gte: new Date() },
      });
      if (activeContract) {
        return res.status(400).json({ message: '该房源存在未到期的有效合同，无法上架' });
      }
    }

    house.status = status;
    await house.save();
    res.json({ message: status === 'approved' ? '已上架' : '已下架' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
