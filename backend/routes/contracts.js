const express = require('express');
const router = express.Router();
const Contract = require('../models/Contract');
const House = require('../models/House');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/contracts - List contracts (role-based)
router.get('/', authenticate, async (req, res, next) => {
  try {
    let filter = {};

    if (req.user.role === 'tenant') {
      filter.tenantId = req.user._id;
    } else if (req.user.role === 'landlord') {
      filter.landlordId = req.user._id;
    }
    // admin sees all

    const contracts = await Contract.find(filter)
      .populate('tenantId', 'name phone')
      .populate('landlordId', 'name phone')
      .populate('houseId', 'title address')
      .sort({ createdAt: -1 });

    res.json(contracts);
  } catch (err) {
    next(err);
  }
});

// POST /api/contracts - Create contract (landlord)
router.post('/', authenticate, authorize('landlord'), async (req, res, next) => {
  try {
    const { tenantId, houseId, startDate, endDate, rent, deposit } = req.body;

    if (!tenantId || !houseId || !startDate || !endDate || !rent || deposit === undefined) {
      return res.status(400).json({ message: '请填写必填字段' });
    }

    const house = await House.findById(houseId);
    if (!house) {
      return res.status(404).json({ message: '房源不存在' });
    }
    if (house.landlordId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权为此房源创建合同' });
    }

    const contract = new Contract({
      tenantId,
      landlordId: req.user._id,
      houseId,
      startDate,
      endDate,
      rent,
      deposit,
      status: 'draft',
    });

    await contract.save();
    res.status(201).json(contract);
  } catch (err) {
    next(err);
  }
});

// PUT /api/contracts/:id/sign - Sign contract
router.put('/:id/sign', authenticate, async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: '合同不存在' });
    }

    const userId = req.user._id.toString();

    if (userId === contract.tenantId.toString()) {
      if (contract.signedByTenant) {
        return res.status(400).json({ message: '您已签署此合同' });
      }
      contract.signedByTenant = true;
    } else if (userId === contract.landlordId.toString()) {
      if (contract.signedByLandlord) {
        return res.status(400).json({ message: '您已签署此合同' });
      }
      contract.signedByLandlord = true;
    } else {
      return res.status(403).json({ message: '无权签署此合同' });
    }

    if (contract.signedByTenant && contract.signedByLandlord) {
      contract.status = 'signed';
    } else {
      contract.status = 'pending_sign';
    }

    await contract.save();
    res.json(contract);
  } catch (err) {
    next(err);
  }
});

// PUT /api/contracts/:id/terminate - Terminate contract
router.put('/:id/terminate', authenticate, async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: '合同不存在' });
    }

    const userId = req.user._id.toString();
    if (userId !== contract.tenantId.toString() && userId !== contract.landlordId.toString()) {
      return res.status(403).json({ message: '无权终止此合同' });
    }

    contract.status = 'terminated';
    await contract.save();
    res.json(contract);
  } catch (err) {
    next(err);
  }
});

// GET /api/contracts/:id - Get contract detail
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate('tenantId', 'name phone')
      .populate('landlordId', 'name phone')
      .populate('houseId', 'title address');

    if (!contract) {
      return res.status(404).json({ message: '合同不存在' });
    }

    const userId = req.user._id.toString();
    if (req.user.role !== 'admin' &&
        userId !== contract.tenantId.toString() &&
        userId !== contract.landlordId.toString()) {
      return res.status(403).json({ message: '无权查看此合同' });
    }

    res.json(contract);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
