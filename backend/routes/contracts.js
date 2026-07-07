const express = require('express');
const router = express.Router();
const Contract = require('../models/Contract');
const House = require('../models/House');
const Appointment = require('../models/Appointment');
const FinanceRecord = require('../models/FinanceRecord');
const { authenticate, authorize } = require('../middleware/auth');

// Shared query logic
async function getContractsForUser(user, statusFilter) {
  let filter = {};
  if (user.role === 'tenant') {
    filter.tenantId = user._id;
  } else if (user.role === 'landlord') {
    filter.landlordId = user._id;
  }
  if (statusFilter) filter.status = statusFilter;
  return Contract.find(filter)
    .populate('tenantId', 'name phone')
    .populate('landlordId', 'name phone')
    .populate('houseId', 'title address area rent deposit images')
    .sort({ createdAt: -1 });
}

// ── Static GET routes (must be before /:id) ──

// GET /api/contracts - List contracts (role-based)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const contracts = await getContractsForUser(req.user, req.query.status);
    res.json(contracts);
  } catch (err) {
    next(err);
  }
});

// GET /api/contracts/my - Alias for tenant contracts
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const contracts = await getContractsForUser(req.user, req.query.status);
    res.json({ contracts });
  } catch (err) {
    next(err);
  }
});

// GET /api/contracts/manage - Alias for landlord contracts
router.get('/manage', authenticate, authorize('landlord'), async (req, res, next) => {
  try {
    const contracts = await getContractsForUser(req.user, req.query.status);
    res.json({ contracts });
  } catch (err) {
    next(err);
  }
});

// GET /api/contracts/landlord/tenants - Tenants with confirmed appointments
router.get('/landlord/tenants', authenticate, authorize('landlord'), async (req, res, next) => {
  try {
    const appointments = await Appointment.find({
      landlordId: req.user._id,
      status: 'confirmed',
    }).populate('tenantId', 'name phone').populate('houseId', 'title address');

    const tenantMap = new Map();
    for (const apt of appointments) {
      if (apt.tenantId && !tenantMap.has(apt.tenantId._id.toString())) {
        tenantMap.set(apt.tenantId._id.toString(), {
          _id: apt.tenantId._id,
          name: apt.tenantId.name,
          phone: apt.tenantId.phone,
          houseTitle: apt.houseId?.title || '',
          appointmentId: apt._id,
        });
      }
    }
    res.json(Array.from(tenantMap.values()));
  } catch (err) {
    next(err);
  }
});

// ── Static POST routes ──

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
    if (house.status === 'offline') {
      return res.status(400).json({ message: '该房源已锁定下架，无法创建新合同' });
    }

    // Check for overlapping signed contracts
    const conflict = await Contract.findOne({
      houseId,
      status: 'signed',
      startDate: { $lte: new Date(endDate) },
      endDate: { $gte: new Date(startDate) },
    });
    if (conflict) {
      return res.status(400).json({ message: '该房源在所选时间段内已有有效合同，时间冲突' });
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
    const populated = await Contract.findById(contract._id)
      .populate('tenantId', 'name phone')
      .populate('landlordId', 'name phone')
      .populate('houseId', 'title address');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

// POST /api/contracts/from-appointment/:appointmentId - Create contract from confirmed appointment
router.post('/from-appointment/:appointmentId', authenticate, authorize('landlord'), async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate('houseId', 'title address rent deposit landlordId');

    if (!appointment) {
      return res.status(404).json({ message: '预约不存在' });
    }
    if (appointment.landlordId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权为此预约创建合同' });
    }
    if (appointment.status !== 'confirmed') {
      return res.status(400).json({ message: '只能为已确认的预约创建合同' });
    }

    const { startDate, endDate, rent, deposit } = req.body;
    if (!startDate || !endDate || !rent || deposit === undefined) {
      return res.status(400).json({ message: '请填写必填字段' });
    }

    const house = appointment.houseId;
    if (house.status === 'offline') {
      return res.status(400).json({ message: '该房源已锁定下架，无法创建新合同' });
    }

    // Check for overlapping signed contracts
    const conflict = await Contract.findOne({
      houseId: house._id || house,
      status: 'signed',
      startDate: { $lte: new Date(endDate) },
      endDate: { $gte: new Date(startDate) },
    });
    if (conflict) {
      return res.status(400).json({ message: '该房源在所选时间段内已有有效合同，时间冲突' });
    }

    const contract = new Contract({
      tenantId: appointment.tenantId,
      landlordId: req.user._id,
      houseId: house._id || house,
      appointmentId: appointment._id,
      startDate,
      endDate,
      rent: rent || house.rent,
      deposit: deposit || house.deposit,
      status: 'draft',
    });

    await contract.save();
    const populated = await Contract.findById(contract._id)
      .populate('tenantId', 'name phone')
      .populate('landlordId', 'name phone')
      .populate('houseId', 'title address');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

// ── Parameterized routes (must be after all static routes) ──

// GET /api/contracts/:id - Get contract detail
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate('tenantId', 'name phone email')
      .populate('landlordId', 'name phone email')
      .populate('houseId', 'title address area rent deposit images type floor facilities');

    if (!contract) {
      return res.status(404).json({ message: '合同不存在' });
    }

    const userId = req.user._id.toString();
    if (req.user.role !== 'admin' &&
        userId !== contract.tenantId._id.toString() &&
        userId !== contract.landlordId._id.toString()) {
      return res.status(403).json({ message: '无权查看此合同' });
    }

    res.json(contract);
  } catch (err) {
    next(err);
  }
});

// PUT /api/contracts/:id - Update contract (e.g. rent, deposit)
router.put('/:id', authenticate, authorize('landlord'), async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: '合同不存在' });
    }
    if (contract.landlordId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权修改此合同' });
    }
    if (contract.signedByTenant || contract.signedByLandlord) {
      return res.status(400).json({ message: '合同已有签署记录，无法修改' });
    }

    const { rent, deposit, startDate, endDate } = req.body;
    const oldRent = contract.rent;
    const changes = {};

    if (rent !== undefined && rent !== contract.rent) {
      changes.rent = rent;
    }
    if (deposit !== undefined && deposit !== contract.deposit) {
      changes.deposit = deposit;
    }
    if (startDate) changes.startDate = startDate;
    if (endDate) changes.endDate = endDate;

    if (Object.keys(changes).length === 0) {
      return res.status(400).json({ message: '没有需要更新的字段' });
    }

    // Update contract fields
    Object.assign(contract, changes);
    await contract.save();

    // Auto-update related FinanceRecords if rent changed
    if (changes.rent !== undefined) {
      const relatedRecords = await FinanceRecord.find({
        contractId: contract._id,
      });

      if (relatedRecords.length > 0) {
        for (const record of relatedRecords) {
          record.amount = changes.rent;
          await record.save();
        }
      }
    }

    const populated = await Contract.findById(contract._id)
      .populate('tenantId', 'name phone')
      .populate('landlordId', 'name phone')
      .populate('houseId', 'title address');

    res.json(populated);
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
      // Check for overlapping contracts before finalizing sign
      const conflict = await Contract.findOne({
        _id: { $ne: contract._id },
        houseId: contract.houseId,
        status: 'signed',
        startDate: { $lte: contract.endDate },
        endDate: { $gte: contract.startDate },
      });
      if (conflict) {
        return res.status(400).json({ message: '签署失败：该房源在合同期内已有其他有效合同，时间冲突' });
      }
      contract.status = 'signed';
    } else {
      contract.status = 'pending_sign';
    }

    await contract.save();

    // Lock and unpublish the house when contract becomes signed
    if (contract.status === 'signed') {
      await House.findByIdAndUpdate(contract.houseId, { status: 'offline' });

      // Auto-create finance records when contract becomes signed
      const start = new Date(contract.startDate);
      const end = new Date(contract.endDate);
      const records = [];

      // Generate one record per month from start to end
      const current = new Date(start.getFullYear(), start.getMonth(), 1);
      const last = new Date(end.getFullYear(), end.getMonth(), 1);

      while (current <= last) {
        const monthStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;

        // Skip if record already exists for this contract + month
        const exists = await FinanceRecord.findOne({
          contractId: contract._id,
          month: monthStr,
        });
        if (!exists) {
          records.push({
            landlordId: contract.landlordId,
            houseId: contract.houseId,
            contractId: contract._id,
            amount: contract.rent,
            month: monthStr,
          });
        }

        current.setMonth(current.getMonth() + 1);
      }

      if (records.length > 0) {
        await FinanceRecord.insertMany(records);
      }
    }

    const populated = await Contract.findById(contract._id)
      .populate('tenantId', 'name phone')
      .populate('landlordId', 'name phone')
      .populate('houseId', 'title address');
    res.json(populated);
  } catch (err) {
    next(err);
  }
});

// PUT /api/contracts/:id/reject - Tenant rejects contract, resets sign status
router.put('/:id/reject', authenticate, async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: '合同不存在' });
    }
    if (req.user._id.toString() !== contract.tenantId.toString()) {
      return res.status(403).json({ message: '只有租户可以拒绝合同' });
    }
    if (contract.status !== 'pending_sign' && contract.status !== 'draft') {
      return res.status(400).json({ message: '当前合同状态不允许拒绝' });
    }

    contract.signedByLandlord = false;
    contract.signedByTenant = false;
    contract.status = 'draft';
    await contract.save();

    const populated = await Contract.findById(contract._id)
      .populate('tenantId', 'name phone')
      .populate('landlordId', 'name phone')
      .populate('houseId', 'title address');
    res.json(populated);
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

module.exports = router;
