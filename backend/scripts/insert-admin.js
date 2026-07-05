require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config');
const User = require('../models/User');

async function insertAdmin() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('MongoDB 连接成功');

    // 检查是否已存在
    const existingPhone = await User.findOne({ phone: '13834080231' });
    if (existingPhone) {
      console.log('该手机号已存在:');
      console.log(`  ID: ${existingPhone._id}`);
      console.log(`  姓名: ${existingPhone.name}`);
      console.log(`  角色: ${existingPhone.role}`);
      console.log(`  状态: ${existingPhone.status}`);
      await mongoose.disconnect();
      return;
    }

    const existingEmail = await User.findOne({ email: 'admin@qq.com' });
    if (existingEmail) {
      console.log('该邮箱已存在:');
      console.log(`  ID: ${existingEmail._id}`);
      console.log(`  姓名: ${existingEmail.name}`);
      console.log(`  手机号: ${existingEmail.phone}`);
      console.log(`  角色: ${existingEmail.role}`);
      await mongoose.disconnect();
      return;
    }

    const passwordHash = await bcrypt.hash('admin123456', 10);

    const admin = new User({
      phone: '13834080231',
      email: 'admin@qq.com',
      name: '系统管理员',
      passwordHash,
      role: 'admin',
      status: 'active',
    });

    await admin.save();

    console.log('✅ 系统管理员创建成功:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  ID:     ${admin._id}`);
    console.log(`  手机号: 13834080231`);
    console.log(`  邮箱:   admin@qq.com`);
    console.log(`  密码:   admin123456`);
    console.log(`  角色:   admin`);
    console.log(`  状态:   active`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('创建失败:', err);
    process.exit(1);
  }
}

insertAdmin();
