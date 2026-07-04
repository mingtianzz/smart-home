require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('./config');

async function seed() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('MongoDB 连接成功');

    const User = require('./models/User');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('管理员账号已存在:');
      console.log(`  手机号: ${existingAdmin.phone}`);
      console.log(`  密码: admin123`);
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

    console.log('✅ 默认管理员账号创建成功');
    console.log('━━━━━━━━━━━━━━━━━━━━━');
    console.log('  手机号: 13800000000');
    console.log('  密码:   admin123');
    console.log('  角色:   管理员');
    console.log('━━━━━━━━━━━━━━━━━━━━━');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('初始化失败:', err);
    process.exit(1);
  }
}

seed();
