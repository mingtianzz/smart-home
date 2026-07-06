require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('./config');

async function seed() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('MongoDB 连接成功');

    const User = require('./models/User');

    const existingAdmin = await User.findOne({ role: 'admin' });
    const existingTenant = await User.findOne({ phone: '13900000001' });
    const existingLandlord = await User.findOne({ phone: '13900000002' });

    if (existingAdmin && existingTenant && existingLandlord) {
      console.log('测试账号已存在');
      await mongoose.disconnect();
      return;
    }

    const passwordHash = await bcrypt.hash('123456', 10);

    if (!existingAdmin) {
      const admin = new User({
        phone: '13800000000',
        email: 'admin@example.com',
        name: '系统管理员',
        passwordHash,
        role: 'admin',
        status: 'active',
      });
      await admin.save();
    }

    if (!existingTenant) {
      const tenant1 = new User({
        phone: '13900000001',
        email: 'tenant@example.com',
        name: '张浚杰',
        passwordHash,
        role: 'tenant',
        status: 'active',
      });
      await tenant1.save();

      const tenant2 = new User({
        phone: '13900000003',
        email: 'tenant2@example.com',
        name: '张三',
        passwordHash,
        role: 'tenant',
        status: 'active',
      });
      await tenant2.save();

      const tenant3 = new User({
        phone: '13900000004',
        email: 'tenant3@example.com',
        name: '李四',
        passwordHash,
        role: 'tenant',
        status: 'active',
      });
      await tenant3.save();
    }

    if (!existingLandlord) {
      const landlord = new User({
        phone: '13900000002',
        email: 'landlord@example.com',
        name: '李房东',
        passwordHash,
        role: 'landlord',
        status: 'active',
      });
      await landlord.save();
    }

    console.log('✅ 测试账号创建成功');
    console.log('━━━━━━━━━━━━━━━━━━━━━');
    console.log('【管理员】');
    console.log('  手机号: 13800000000');
    console.log('  邮箱:   admin@example.com');
    console.log('  密码:   123456');
    console.log('━━━━━━━━━━━━━━━━━━━━━');
    console.log('【租户】');
    console.log('  手机号: 13900000001');
    console.log('  邮箱:   tenant@example.com');
    console.log('  姓名:   张浚杰');
    console.log('  密码:   123456');
    console.log('━━━━━━━━━━━━━━━━━━━━━');
    console.log('【房东】');
    console.log('  手机号: 13900000002');
    console.log('  邮箱:   landlord@example.com');
    console.log('  姓名:   李房东');
    console.log('  密码:   123456');
    console.log('━━━━━━━━━━━━━━━━━━━━━');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('初始化失败:', err);
    process.exit(1);
  }
}

seed();
