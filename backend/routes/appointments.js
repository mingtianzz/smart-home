const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const House = require('../models/House');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/appointments - Get appointments (role-based)
router.get('/', authenticate, async (req, res, next) => {
  try {
    let filter = {};

    if (req.user.role === 'tenant') {
      filter.tenantId = req.user._id;
    } else if (req.user.role === 'landlord') {
      filter.landlordId = req.user._id;
    }
    // admin sees all

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const appointments = await Appointment.find(filter)
      .populate('tenantId', 'name phone')
      .populate('landlordId', 'name phone')
      .populate('houseId', 'title address')
      .sort({ createdAt: -1 });

    res.json(appointments);
  } catch (err) {
    next(err);
  }
});

// POST /api/appointments - Create appointment
router.post('/', authenticate, authorize('tenant'), async (req, res, next) => {
  try {
    const { houseId, visitDate, visitTime, contact, remark } = req.body;

    if (!houseId || !visitDate || !visitTime || !contact) {
      return res.status(400).json({ message: '请填写必填字段' });
    }

    const house = await House.findById(houseId);
    if (!house) {
      return res.status(404).json({ message: '房源不存在' });
    }
    if (house.status !== 'approved') {
      return res.status(400).json({ message: '该房源暂不可预约' });
    }

    const appointment = new Appointment({
      tenantId: req.user._id,
      landlordId: house.landlordId,
      houseId,
      visitDate,
      visitTime,
      contact,
      remark: remark || '',
    });

    await appointment.save();
    res.status(201).json(appointment);
  } catch (err) {
    next(err);
  }
});

// PUT /api/appointments/:id/cancel - Cancel appointment (tenant)
router.put('/:id/cancel', authenticate, authorize('tenant'), async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: '预约不存在' });
    }
    if (appointment.tenantId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权取消此预约' });
    }
    if (appointment.status !== 'pending') {
      return res.status(400).json({ message: '只能取消待确认的预约' });
    }

    appointment.status = 'cancelled';
    await appointment.save();
    res.json(appointment);
  } catch (err) {
    next(err);
  }
});

// PUT /api/appointments/:id/confirm - Confirm appointment (landlord)
router.put('/:id/confirm', authenticate, authorize('landlord'), async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: '预约不存在' });
    }
    if (appointment.landlordId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权确认此预约' });
    }
    if (appointment.status !== 'pending') {
      return res.status(400).json({ message: '只能确认待确认的预约' });
    }

    appointment.status = 'confirmed';
    await appointment.save();
    res.json(appointment);
  } catch (err) {
    next(err);
  }
});

// PUT /api/appointments/:id/reject - Reject appointment (landlord)
router.put('/:id/reject', authenticate, authorize('landlord'), async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: '预约不存在' });
    }
    if (appointment.landlordId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权拒绝此预约' });
    }
    if (appointment.status !== 'pending') {
      return res.status(400).json({ message: '只能拒绝待确认的预约' });
    }

    appointment.status = 'rejected';
    appointment.rejectReason = req.body.reason || '';
    await appointment.save();
    res.json(appointment);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
