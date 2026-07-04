const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { phone, email, password, name, role } = req.body;

    if (!password || !name || !role) {
      return res.status(400).json({ message: '请填写必填字段' });
    }

    if (!['tenant', 'landlord'].includes(role)) {
      return res.status(400).json({ message: '角色无效' });
    }

    if (!phone && !email) {
      return res.status(400).json({ message: '手机号和邮箱至少填一个' });
    }

    // Check duplicate account
    let existingUser = null;
    if (phone) {
      existingUser = await User.findOne({ phone });
    }
    if (!existingUser && email) {
      existingUser = await User.findOne({ email });
    }
    if (existingUser) {
      return res.status(400).json({ message: '该账号已被注册' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      phone: phone || undefined,
      email: email || undefined,
      passwordHash,
      name,
      role,
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

    res.status(201).json({
      message: '注册成功',
      token,
      user: { id: user._id, name: user.name, role: user.role, phone: user.phone, email: user.email },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { phone, email, password, role } = req.body;

    if (!password || !role) {
      return res.status(400).json({ message: '请填写必填字段' });
    }

    // Find user by phone or email
    let user = null;
    if (phone) {
      user = await User.findOne({ phone });
    }
    if (!user && email) {
      user = await User.findOne({ email });
    }
    if (!user) {
      return res.status(401).json({ message: '账号或密码错误' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: '账号或密码错误' });
    }

    // Check status
    if (user.status === 'disabled') {
      return res.status(403).json({ message: '账号已被禁用' });
    }

    // Check role
    if (user.role !== role) {
      return res.status(401).json({ message: '角色选择错误' });
    }

    const token = jwt.sign({ userId: user._id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

    res.json({
      message: '登录成功',
      token,
      user: { id: user._id, name: user.name, role: user.role, phone: user.phone, email: user.email },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/auth/profile
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const { name, phone, email } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (email) updates.email = email;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({
      message: '更新成功',
      user: { id: user._id, name: user.name, role: user.role, phone: user.phone, email: user.email },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;