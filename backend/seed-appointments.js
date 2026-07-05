require('dotenv').config();
const mongoose = require('mongoose');
const config = require('./config');
const bcrypt = require('bcryptjs');

async function seedAppointments() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('MongoDB 连接成功');

    const User = require('./models/User');
    const House = require('./models/House');
    const Appointment = require('./models/Appointment');

    const availableLandlords = await User.find({ role: 'landlord', status: 'active' });
    let targetLandlord = null;
    for (const ll of availableLandlords) {
      const houseCount = await House.countDocuments({ landlordId: ll._id, status: 'approved' });
      if (houseCount > 0) {
        targetLandlord = ll;
        break;
      }
    }

    if (!targetLandlord) {
      console.error('没有找到有房源的房东');
      process.exit(1);
    }

    const houses = await House.find({ landlordId: targetLandlord._id, status: 'approved' });
    const house = houses[0];

    const passwordHash = await bcrypt.hash('123456', 10);

    const tenantNames = ['张三', '李四', '王五', '赵六'];
    const tenantPhones = ['13800001111', '13800002222', '13800003333', '13800004444'];
    const tenants = [];

    for (let i = 0; i < 4; i++) {
      let tenant = await User.findOne({ phone: tenantPhones[i] });
      if (!tenant) {
        tenant = await User.create({
          name: tenantNames[i],
          phone: tenantPhones[i],
          email: `${tenantNames[i]}@example.com`,
          passwordHash,
          role: 'tenant',
          status: 'active',
        });
        console.log(`创建租客: ${tenantNames[i]} | ${tenantPhones[i]}`);
      }
      tenants.push(tenant);
    }

    await Appointment.deleteMany({ landlordId: targetLandlord._id });

    const appointments = [
      {
        tenantId: tenants[0]._id,
        landlordId: targetLandlord._id,
        houseId: house._id,
        visitDate: '2026-07-06',
        visitTime: '14:00',
        contact: '138****1234',
        remark: '周末方便看房，希望房主在',
        status: 'pending',
      },
      {
        tenantId: tenants[1]._id,
        landlordId: targetLandlord._id,
        houseId: house._id,
        visitDate: '2026-07-05',
        visitTime: '10:30',
        contact: '139****5678',
        remark: '',
        status: 'confirmed',
      },
      {
        tenantId: tenants[2]._id,
        landlordId: targetLandlord._id,
        houseId: house._id,
        visitDate: '2026-07-04',
        visitTime: '16:00',
        contact: '136****9012',
        remark: '想了解一下周边交通',
        status: 'cancelled',
      },
      {
        tenantId: tenants[3]._id,
        landlordId: targetLandlord._id,
        houseId: house._id,
        visitDate: '2026-07-03',
        visitTime: '09:00',
        contact: '137****3456',
        remark: '已经找到其他房源了',
        status: 'rejected',
        rejectReason: '时间冲突',
      },
    ];

    await Appointment.insertMany(appointments);
    console.log(`✅ 为房东 ${targetLandlord.name} (${targetLandlord.phone}) 创建了4条预约记录`);
    console.log(`   使用房源: ${house.title}`);
    console.log('   租客: 张三、李四、王五、赵六');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('初始化失败:', err);
    process.exit(1);
  }
}

seedAppointments();