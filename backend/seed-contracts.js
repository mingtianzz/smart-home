require('dotenv').config();
const mongoose = require('mongoose');
const config = require('./config');

async function seedContracts() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('MongoDB 连接成功');

    const User = require('./models/User');
    const House = require('./models/House');
    const Contract = require('./models/Contract');

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

    const tenants = await User.find({ role: 'tenant', status: 'active', name: { $ne: '张浚杰' } }).limit(2);
    if (tenants.length < 2) {
      console.error('租户数量不足');
      process.exit(1);
    }

    await Contract.deleteMany({ landlordId: targetLandlord._id });

    const contracts = [
      {
        tenantId: tenants[0]._id,
        landlordId: targetLandlord._id,
        houseId: house._id,
        startDate: '2026-06-30',
        endDate: '2027-06-30',
        rent: house.rent,
        deposit: house.deposit,
        status: 'draft',
        signedByLandlord: false,
        signedByTenant: false,
      },
      {
        tenantId: tenants[1]._id,
        landlordId: targetLandlord._id,
        houseId: house._id,
        startDate: '2026-07-15',
        endDate: '2027-07-15',
        rent: house.rent,
        deposit: house.deposit,
        status: 'draft',
        signedByLandlord: false,
        signedByTenant: false,
      },
      {
        tenantId: tenants[0]._id,
        landlordId: targetLandlord._id,
        houseId: houses[1] ? houses[1]._id : house._id,
        startDate: '2026-08-01',
        endDate: '2027-08-01',
        rent: houses[1] ? houses[1].rent : house.rent,
        deposit: houses[1] ? houses[1].deposit : house.deposit,
        status: 'draft',
        signedByLandlord: false,
        signedByTenant: false,
      },
    ];

    await Contract.insertMany(contracts);
    console.log(`✅ 为房东 ${targetLandlord.name} (${targetLandlord.phone}) 创建了3条初始合同记录（草稿状态）`);
    console.log(`   使用房源: ${house.title}`);
    console.log(`   租户: ${tenants.map(t => t.name).join('、')}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('初始化失败:', err);
    process.exit(1);
  }
}

seedContracts();