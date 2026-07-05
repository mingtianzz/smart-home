require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config');
const User = require('../models/User');

async function seedAdmin() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('MongoDB 连接成功: ' + config.mongodbUri);

    const existing = await User.findOne({ phone: '13800000000' });
    if (existing) {
      console.log('管理员已存在，无需重复创建:');
      console.log(`  ID: ${existing._id}`);
      console.log(`  姓名: ${existing.name}`);
      console.log(`  手机号: ${existing.phone}`);
      console.log(`  角色: ${existing.role}`);
      console.log(`  状态: ${existing.status}`);
      await mongoose.disconnect();
      return;
    }

    const passwordHash = await bcrypt.hash('admin123', 10);

    const admin = new User({
      phone: '13800000000',
      name: '系统管理员',
      passwordHash,
      role: 'admin',
      status: 'active',
    });

    await admin.save();

    console.log('✅ 管理员创建成功:');
    console.log('━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  ID:     ${admin._id}`);
    console.log(`  手机号: 13800000000`);
    console.log(`  密码:   admin123`);
    console.log(`  角色:   admin`);
    console.log(`  状态:   active`);
    console.log('━━━━━━━━━━━━━━━━━━━━━');

    await mongoose.disconnect();
  } catch (err) {
    console.error('创建失败:', err);
    process.exit(1);
  }
}

seedAdmin();
