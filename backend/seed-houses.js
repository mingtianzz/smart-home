require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('./config');

const HOUSE_IMAGES = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1598928506311-c55e85b1a2e9?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1560185008-b033106af89d?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop',
];

const LANDLORDS = [
  { name: '赵建国', phone: '13910000001', email: 'zhaojg@example.com', gender: 'male' },
  { name: '钱小梅', phone: '13910000002', email: 'qianxm@example.com', gender: 'female' },
  { name: '孙志强', phone: '13910000003', email: 'sunzq@example.com', gender: 'male' },
  { name: '周美玲', phone: '13910000004', email: 'zhouml@example.com', gender: 'female' },
  { name: '吴永发', phone: '13910000005', email: 'wuyf@example.com', gender: 'male' },
  { name: '陈秀英', phone: '13910000006', email: 'chenxy@example.com', gender: 'female' },
  { name: '刘大明', phone: '13910000007', email: 'liudm@example.com', gender: 'male' },
  { name: '黄丽华', phone: '13910000008', email: 'huanglh@example.com', gender: 'female' },
  { name: '林海峰', phone: '13910000009', email: 'linhf@example.com', gender: 'male' },
  { name: '王桂芳', phone: '13910000010', email: 'wanggf@example.com', gender: 'female' },
];

// 每个房东发布的房源数据，每位 1-4 套
const LANDLORD_HOUSES = [
  // 赵建国 - 3套
  [
    {
      title: '朝阳望京 · 精装两居 · 南北通透',
      area: '朝阳区', address: '朝阳区望京西路8号院', rent: 7500, deposit: 7500,
      type: '整租', size: 92, floor: '12/26',
      facilities: ['WIFI', '空调', '冰箱', '洗衣机', '热水器', '暖气', '床', '衣柜', '电视'],
      description: '望京核心地段精装两居室，南北通透，高层视野开阔。紧邻地铁14、15号线望京站，周边商圈繁华，生活便利。',
      images: [HOUSE_IMAGES[0]],
    },
    {
      title: '朝阳双井 · 温馨一居 · 适合情侣',
      area: '朝阳区', address: '朝阳区广渠路36号首城国际', rent: 5800, deposit: 5800,
      type: '整租', size: 48, floor: '8/20',
      facilities: ['WIFI', '空调', '冰箱', '洗衣机', '热水器', '床', '衣柜'],
      description: '双井地铁站旁温馨一居，装修时尚简约，适合年轻情侣居住。楼下商场、超市、餐厅一应俱全。',
      images: [HOUSE_IMAGES[1]],
    },
    {
      title: '朝阳劲松 · 单间出租 · 拎包入住',
      area: '朝阳区', address: '朝阳区劲松路2号院', rent: 2800, deposit: 2800,
      type: '单间', size: 22, floor: '5/18',
      facilities: ['WIFI', '空调', '热水器', '床', '衣柜'],
      description: '劲松社区安静单间，室友均为IT白领，作息规律。步行5分钟到地铁10号线劲松站。',
      images: [HOUSE_IMAGES[2]],
    },
  ],
  // 钱小梅 - 2套
  [
    {
      title: '海淀五道口 · 高端公寓 · 清华旁',
      area: '海淀区', address: '海淀区成府路28号五道口华清嘉园', rent: 8500, deposit: 8500,
      type: '公寓', size: 58, floor: '15/22',
      facilities: ['WIFI', '空调', '冰箱', '洗衣机', '热水器', '电视', '床', '衣柜', '电梯'],
      description: '五道口核心区域高端公寓，紧邻清华大学，学术氛围浓厚。精装修全配，24小时安保，品质生活首选。',
      images: [HOUSE_IMAGES[3]],
    },
    {
      title: '海淀上地 · 软件园合租次卧 · 限男生',
      area: '海淀区', address: '海淀区上地西里小区', rent: 2500, deposit: 2500,
      type: '合租', size: 16, floor: '3/6',
      facilities: ['WIFI', '空调', '洗衣机', '热水器', '床', '衣柜'],
      description: '上地西里安静次卧，紧邻上地信息产业基地。室友为百度程序员，爱干净。仅限男生合租。',
      images: [HOUSE_IMAGES[4]],
    },
  ],
  // 孙志强 - 4套
  [
    {
      title: '东城东直门 · 两居整租 · 使馆区旁',
      area: '东城区', address: '东城区东直门北大街10号', rent: 9800, deposit: 9800,
      type: '整租', size: 85, floor: '6/12',
      facilities: ['WIFI', '空调', '冰箱', '洗衣机', '热水器', '暖气', '床', '衣柜', '电视', '电梯'],
      description: '东直门使馆区旁舒适两居，国际化社区环境优雅，24小时保安。步行5分钟到地铁2号线、13号线东直门站。',
      images: [HOUSE_IMAGES[5]],
    },
    {
      title: '东城北新桥 · 胡同小院 · 独门独院',
      area: '东城区', address: '东城区北新桥三条胡同5号', rent: 11000, deposit: 11000,
      type: '整租', size: 52, floor: '1/1',
      facilities: ['WIFI', '空调', '冰箱', '洗衣机', '热水器', '暖气', '床', '衣柜'],
      description: '北新桥胡同里独门独院，新中式装修，保留老北京韵味。步行至簋街美食街仅需3分钟，感受地道北京生活。',
      images: [HOUSE_IMAGES[6]],
    },
    {
      title: '东城灯市口 · 精装公寓 · 王府井旁',
      area: '东城区', address: '东城区灯市口大街16号', rent: 7200, deposit: 7200,
      type: '公寓', size: 45, floor: '9/18',
      facilities: ['WIFI', '空调', '冰箱', '洗衣机', '热水器', '床', '衣柜', '电梯'],
      description: '灯市口精装公寓，步行可达王府井步行街。地铁5号线灯市口站零距离，通勤购物两方便。',
      images: [HOUSE_IMAGES[7]],
    },
    {
      title: '东城安定门 · 合租主卧带阳台',
      area: '东城区', address: '东城区安定门内大街56号', rent: 3500, deposit: 3500,
      type: '合租', size: 22, floor: '4/6',
      facilities: ['WIFI', '空调', '冰箱', '洗衣机', '热水器', '床', '衣柜'],
      description: '安定门内大街合租主卧，带独立阳台，采光极好。紧邻2号线安定门站，交通便利。',
      images: [HOUSE_IMAGES[8]],
    },
  ],
  // 周美玲 - 3套
  [
    {
      title: '西城金融街 · 一居室 · 高端精装',
      area: '西城区', address: '西城区金融街丰汇园小区', rent: 10500, deposit: 10500,
      type: '整租', size: 55, floor: '11/20',
      facilities: ['WIFI', '空调', '冰箱', '洗衣机', '热水器', '暖气', '电视', '床', '衣柜', '电梯', '车位'],
      description: '金融街高端精装一居，央企高管首选。小区安保严密，花园式管理，步行5分钟到金融街购物中心。',
      images: [HOUSE_IMAGES[9]],
    },
    {
      title: '西城德胜门 · 单间出租 · 干净整洁',
      area: '西城区', address: '西城区德胜门外大街甲2号', rent: 3000, deposit: 3000,
      type: '单间', size: 20, floor: '7/16',
      facilities: ['WIFI', '空调', '热水器', '床', '衣柜'],
      description: '德胜门外安静单间，朝南采光好，共享客厅厨房。公交站步行2分钟，适合中关村上班族。',
      images: [HOUSE_IMAGES[10]],
    },
    {
      title: '西城月坛 · 两居整租 · 学区房',
      area: '西城区', address: '西城区月坛南街甲5号', rent: 11500, deposit: 11500,
      type: '整租', size: 78, floor: '5/16',
      facilities: ['WIFI', '空调', '冰箱', '洗衣机', '热水器', '暖气', '床', '衣柜', '电视', '电梯'],
      description: '月坛核心区域学区两居，北京四中、实验二小环绕。安静宜居，适合有学龄儿童的家庭。',
      images: [HOUSE_IMAGES[11]],
    },
  ],
  // 吴永发 - 2套
  [
    {
      title: '通州万达 · 三居整租 · 家庭首选',
      area: '通州区', address: '通州区新华西街60号万达广场', rent: 4500, deposit: 4500,
      type: '整租', size: 115, floor: '8/18',
      facilities: ['WIFI', '空调', '冰箱', '洗衣机', '热水器', '暖气', '电视', '床', '衣柜', '电梯', '车位'],
      description: '通州万达广场旁三居室，户型方正，南北通透。紧邻地铁八通线通州北苑站，配套成熟，生活便利。',
      images: [HOUSE_IMAGES[0]],
    },
    {
      title: '通州梨园 · 合租主卧 · 地铁口',
      area: '通州区', address: '通州区梨园镇云景东路8号', rent: 1600, deposit: 1600,
      type: '合租', size: 18, floor: '2/6',
      facilities: ['WIFI', '空调', '洗衣机', '热水器', '床', '衣柜'],
      description: '梨园地铁站旁合租主卧，价位亲民，适合通州区域上班族。周边超市、菜市场齐全，生活成本低。',
      images: [HOUSE_IMAGES[1]],
    },
  ],
  // 陈秀英 - 3套
  [
    {
      title: '丰台科技园 · 精装公寓 · 短租可选',
      area: '丰台区', address: '丰台区科技园富丰路4号', rent: 4000, deposit: 4000,
      type: '公寓', size: 42, floor: '10/18',
      facilities: ['WIFI', '空调', '冰箱', '洗衣机', '热水器', '电视', '床', '衣柜', '电梯'],
      description: '丰台科技园区精装公寓，支持短租月付。品牌家电，智能门锁，步行5分钟可达9号线丰台科技园站。',
      images: [HOUSE_IMAGES[2]],
    },
    {
      title: '丰台方庄 · 两居整租 · 温馨舒适',
      area: '丰台区', address: '丰台区方庄芳群园二区12号', rent: 5200, deposit: 5200,
      type: '整租', size: 72, floor: '7/14',
      facilities: ['WIFI', '空调', '冰箱', '洗衣机', '热水器', '暖气', '床', '衣柜', '电视'],
      description: '方庄舒适两居，成熟社区配套完善。地铁5号线蒲黄榆站步行8分钟，周边餐饮、教育、医疗配套成熟。',
      images: [HOUSE_IMAGES[3]],
    },
    {
      title: '丰台马家堡 · 单间出租 · 安静整洁',
      area: '丰台区', address: '丰台区马家堡西路15号', rent: 2200, deposit: 2200,
      type: '单间', size: 18, floor: '4/12',
      facilities: ['WIFI', '空调', '热水器', '床', '衣柜'],
      description: '马家堡地铁站旁单间，小区安静绿化好。从4号线可直达北京南站、西单、中关村，通勤方便。',
      images: [HOUSE_IMAGES[4]],
    },
  ],
  // 刘大明 - 1套
  [
    {
      title: '石景山万达 · 一居整租 · 高性价比',
      area: '石景山区', address: '石景山区石景山路20号万达广场', rent: 3800, deposit: 3800,
      type: '整租', size: 50, floor: '6/18',
      facilities: ['WIFI', '空调', '冰箱', '洗衣机', '热水器', '暖气', '床', '衣柜', '电视', '电梯'],
      description: '石景山万达广场楼上一居室，楼下即是万达商圈。地铁1号线八角游乐园站步行5分钟，生活娱乐一站式满足。',
      images: [HOUSE_IMAGES[5]],
    },
  ],
  // 黄丽华 - 3套
  [
    {
      title: '昌平回龙观 · 两居整租 · 南北通透',
      area: '昌平区', address: '昌平区回龙观西大街28号', rent: 4500, deposit: 4500,
      type: '整租', size: 86, floor: '10/18',
      facilities: ['WIFI', '空调', '冰箱', '洗衣机', '热水器', '暖气', '床', '衣柜', '电视'],
      description: '回龙观核心区域南北通透两居，小区环境优雅。紧邻地铁8号线、13号线，西二旗、上地通勤首选。',
      images: [HOUSE_IMAGES[6]],
    },
    {
      title: '昌平天通苑 · 合租单间 · 宽敞明亮',
      area: '昌平区', address: '昌平区天通苑北一区', rent: 1800, deposit: 1800,
      type: '单间', size: 16, floor: '12/28',
      facilities: ['WIFI', '空调', '洗衣机', '热水器', '床', '衣柜'],
      description: '天通苑北一区宽敞单间，朝南采光好。地铁5号线天通苑站步行10分钟，适合望京、CBD通勤。',
      images: [HOUSE_IMAGES[7]],
    },
    {
      title: '昌平沙河高教园 · 公寓整租 · 学生友好',
      area: '昌平区', address: '昌平区沙河高教园区内', rent: 2600, deposit: 2600,
      type: '公寓', size: 35, floor: '5/10',
      facilities: ['WIFI', '空调', '冰箱', '洗衣机', '热水器', '床', '衣柜'],
      description: '沙河高教园区内精装公寓，紧邻北航、央财等高校。房租实惠，适合大学生及考研党。',
      images: [HOUSE_IMAGES[8]],
    },
  ],
  // 林海峰 - 4套
  [
    {
      title: '大兴亦庄 · 三居整租 · 花园洋房',
      area: '大兴区', address: '大兴区亦庄经济开发区荣华南路10号', rent: 6000, deposit: 6000,
      type: '整租', size: 135, floor: '3/6',
      facilities: ['WIFI', '空调', '冰箱', '洗衣机', '热水器', '暖气', '电视', '床', '衣柜', '车位', '电梯'],
      description: '亦庄开发区花园洋房大三居，南北通透双阳台。小区配套幼儿园、小学，紧邻地铁亦庄线，家庭入住首选。',
      images: [HOUSE_IMAGES[9]],
    },
    {
      title: '大兴旧宫 · 两居整租 · 简装干净',
      area: '大兴区', address: '大兴区旧宫镇清逸园小区', rent: 3500, deposit: 3500,
      type: '整租', size: 68, floor: '4/6',
      facilities: ['WIFI', '空调', '冰箱', '洗衣机', '热水器', '暖气', '床', '衣柜'],
      description: '旧宫地铁站旁简装两居，虽简装但干净整洁。紧邻亦庄线旧宫站，生活成本低，性价比极高。',
      images: [HOUSE_IMAGES[10]],
    },
    {
      title: '大兴黄村 · 单间出租 · 紧邻地铁',
      area: '大兴区', address: '大兴区黄村镇兴政街6号', rent: 1500, deposit: 1500,
      type: '单间', size: 15, floor: '3/6',
      facilities: ['WIFI', '空调', '热水器', '床', '衣柜'],
      description: '大兴黄村地铁4号线旁单间，租金低廉。适合在大兴生物医药基地、新媒体产业基地的上班族。',
      images: [HOUSE_IMAGES[11]],
    },
    {
      title: '大兴西红门 · 公寓整租 · 宜家旁',
      area: '大兴区', address: '大兴区西红门宏福路2号', rent: 4200, deposit: 4200,
      type: '公寓', size: 48, floor: '8/15',
      facilities: ['WIFI', '空调', '冰箱', '洗衣机', '热水器', '电视', '床', '衣柜', '电梯'],
      description: '西红门荟聚宜家旁精装公寓，购物娱乐一站式。地铁4号线西红门站步行3分钟，生活便利度满分。',
      images: [HOUSE_IMAGES[0]],
    },
  ],
  // 王桂芳 - 4套
  [
    {
      title: '朝阳三里屯 · 现代复式 · 独立露台',
      area: '朝阳区', address: '朝阳区工体北路甲2号', rent: 13000, deposit: 13000,
      type: '整租', size: 125, floor: '18/24',
      facilities: ['WIFI', '空调', '冰箱', '洗衣机', '热水器', '电视', '暖气', '床', '衣柜', '车位', '电梯'],
      description: '三里屯核心复式公寓，高层带独立露台，城市天际线尽收眼底。楼下太古里、工体，尊享都市繁华。',
      images: [HOUSE_IMAGES[1]],
    },
    {
      title: '朝阳CBD国贸 · 豪华一居 · 高层景观',
      area: '朝阳区', address: '朝阳区建国门外大街1号', rent: 12000, deposit: 12000,
      type: '整租', size: 75, floor: '22/32',
      facilities: ['WIFI', '空调', '冰箱', '洗衣机', '热水器', '电视', '暖气', '床', '衣柜', '电梯', '车位'],
      description: '国贸CBD核心豪华一居，高层全景落地窗。精装全配，24小时管家服务，尊享品质都市生活。',
      images: [HOUSE_IMAGES[2]],
    },
    {
      title: '朝阳常营 · 两居合租主卧 · 限女生',
      area: '朝阳区', address: '朝阳区常营中路2号院', rent: 2800, deposit: 2800,
      type: '合租', size: 22, floor: '8/18',
      facilities: ['WIFI', '空调', '冰箱', '洗衣机', '热水器', '床', '衣柜', '电梯'],
      description: '常营地铁6号线旁合租主卧，仅限女生。室友为银行白领，爱干净好相处，客厅厨房共享。',
      images: [HOUSE_IMAGES[3]],
    },
    {
      title: '朝阳潘家园 · 单间出租 · 古玩城旁',
      area: '朝阳区', address: '朝阳区潘家园路甲9号', rent: 2600, deposit: 2600,
      type: '单间', size: 20, floor: '6/14',
      facilities: ['WIFI', '空调', '冰箱', '洗衣机', '热水器', '床', '衣柜'],
      description: '潘家园古玩城旁安静单间，地铁10号线潘家园站步行3分钟。周边生活配套齐全，适合文艺青年。',
      images: [HOUSE_IMAGES[4]],
    },
  ],
];

async function seed() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('MongoDB 连接成功\n');

    const User = require('./models/User');
    const House = require('./models/House');

    const passwordHash = await bcrypt.hash('123456', 10);

    const createdLandlords = [];

    // 创建房东账号
    for (const ll of LANDLORDS) {
      let user = await User.findOne({ phone: ll.phone });
      if (user) {
        console.log(`房东 ${ll.name} (${ll.phone}) 已存在，跳过创建`);
      } else {
        user = await User.create({
          name: ll.name,
          phone: ll.phone,
          email: ll.email,
          gender: ll.gender,
          passwordHash,
          role: 'landlord',
          status: 'active',
        });
        console.log(`创建房东: ${ll.name} | ${ll.phone} | 密码: 123456`);
      }
      createdLandlords.push(user);
    }

    console.log('\n--- 开始创建房源 ---\n');

    let totalHouses = 0;

    for (let i = 0; i < createdLandlords.length; i++) {
      const landlord = createdLandlords[i];
      const houses = LANDLORD_HOUSES[i];

      for (const houseData of houses) {
        // 检查是否已存在相同标题和房东的房源
        const existing = await House.findOne({ title: houseData.title, landlordId: landlord._id });
        if (existing) {
          console.log(`  房源 "${houseData.title}" 已存在，跳过`);
          continue;
        }

        await House.create({
          landlordId: landlord._id,
          ...houseData,
          status: 'approved',
        });
        totalHouses++;
        console.log(`  [${landlord.name}] ${houseData.title} — ¥${houseData.rent}/月`);
      }
    }

    console.log('\n=============================');
    console.log(`  总计创建 ${totalHouses} 套房源`);
    console.log('  所有房源状态: approved (已审核)');
    console.log('  主界面可直接展示');
    console.log('=============================');
    console.log('\n房东账号汇总:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
    for (const ll of createdLandlords) {
      const count = await House.countDocuments({ landlordId: ll._id });
      console.log(`  ${ll.name} | ${ll.phone} | 密码: 123456 | 房源: ${count}套`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('初始化失败:', err);
    process.exit(1);
  }
}

seed();
