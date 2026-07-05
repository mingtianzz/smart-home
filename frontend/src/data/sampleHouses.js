/**
 * 租房样例数据 —— 当后端无数据时作为首页展示
 * 图片使用 taste-skill 中的生成规则：真实场景类 prompt
 */

const SAMPLE_IMAGES = [
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
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop'
]

export const SAMPLE_HOUSES = [
  {
    _id: 'sample-1',
    id: 'sample-1',
    title: '朝阳大悦城 · 精装两居室 · 南北通透',
    area: '朝阳区',
    size: 89,
    rent: 6800,
    deposit: 6800,
    type: '整租',
    address: '朝阳区朝阳北路99号大悦城公寓',
    status: 'approved',
    images: [SAMPLE_IMAGES[0]],
    facilities: ['WIFI', '空调', '冰箱', '洗衣机', '热水器', '暖气', '床', '衣柜'],
    description: '精装修两居室，南北通透，采光极佳。紧邻朝阳大悦城，步行3分钟到地铁6号线青年路站，生活配套齐全。'
  },
  {
    _id: 'sample-2',
    id: 'sample-2',
    title: '海淀中关村 · 高端公寓 · 拎包入住',
    area: '海淀区',
    size: 55,
    rent: 5200,
    deposit: 5200,
    type: '公寓',
    address: '海淀区中关村大街15号中科大厦',
    status: 'approved',
    images: [SAMPLE_IMAGES[1]],
    facilities: ['WIFI', '空调', '冰箱', '洗衣机', '热水器', '电视', '床', '衣柜', '电梯'],
    description: '中关村核心地段高端公寓，24小时安保，拎包入住。步行5分钟到地铁4号线中关村站，周边高校云集，学术氛围浓厚。'
  },
  {
    _id: 'sample-3',
    id: 'sample-3',
    title: '三里屯 · 现代复式 · 独立露台',
    area: '朝阳区',
    size: 120,
    rent: 12000,
    deposit: 12000,
    type: '整租',
    address: '朝阳区工体北路甲2号盈科中心',
    status: 'approved',
    images: [SAMPLE_IMAGES[2]],
    facilities: ['WIFI', '空调', '冰箱', '洗衣机', '热水器', '电视', '暖气', '床', '衣柜', '车位'],
    description: '三里屯核心地段复式公寓，带独立露台，视野开阔。楼下即是太古里，步行可至工人体育场，都市繁华尽在脚下。'
  },
  {
    _id: 'sample-4',
    id: 'sample-4',
    title: '望京SOHO · 温馨单间 · 适合白领',
    area: '朝阳区',
    size: 25,
    rent: 3200,
    deposit: 3200,
    type: '单间',
    address: '朝阳区望京东园四区5号楼',
    status: 'approved',
    images: [SAMPLE_IMAGES[3]],
    facilities: ['WIFI', '空调', '热水器', '床', '衣柜'],
    description: '望京核心区域温馨单间，干净整洁，适合年轻白领。步行至望京SOHO仅需5分钟，周边餐饮、超市、健身房齐全。'
  },
  {
    _id: 'sample-5',
    id: 'sample-5',
    title: 'CBD国贸 · 豪华一居 · 高层景观',
    area: '朝阳区',
    size: 72,
    rent: 9500,
    deposit: 9500,
    type: '整租',
    address: '朝阳区建国门外大街1号国贸大厦',
    status: 'approved',
    images: [SAMPLE_IMAGES[4]],
    facilities: ['WIFI', '空调', '冰箱', '洗衣机', '热水器', '电视', '暖气', '床', '衣柜', '电梯', '车位'],
    description: '国贸CBD核心地段豪华一居，高层景观房，俯瞰整个CBD天际线。精装修全配，24小时管家服务，尊享品质生活。'
  },
  {
    _id: 'sample-6',
    id: 'sample-6',
    title: '西城金融街 · 花园洋房 · 静谧雅致',
    area: '西城区',
    size: 105,
    rent: 8800,
    deposit: 8800,
    type: '整租',
    address: '西城区金融街街道太平桥大街23号',
    status: 'approved',
    images: [SAMPLE_IMAGES[5]],
    facilities: ['WIFI', '空调', '冰箱', '洗衣机', '热水器', '暖气', '床', '衣柜', '电视'],
    description: '金融街旁静谧花园洋房，闹中取静。小区绿化率高，环境优雅，适合追求品质生活的金融精英。步行可达地铁1号线。'
  },
  {
    _id: 'sample-7',
    id: 'sample-7',
    title: '通州副中心 · 地铁口阳光合租 · 限女生',
    area: '通州区',
    size: 18,
    rent: 1800,
    deposit: 1800,
    type: '合租',
    address: '通州区新华大街100号新华联家园',
    status: 'approved',
    images: [SAMPLE_IMAGES[6]],
    facilities: ['WIFI', '空调', '洗衣机', '热水器', '床', '衣柜'],
    description: '地铁6号线通州北关站旁，阳光充足次卧招合租，仅限女生。室友为金融行业白领，爱干净好相处。'
  },
  {
    _id: 'sample-8',
    id: 'sample-8',
    title: '亦庄开发区 · 三居整租 · 家庭首选',
    area: '大兴区',
    size: 130,
    rent: 5500,
    deposit: 5500,
    type: '整租',
    address: '大兴区亦庄经济开发区荣华南路10号',
    status: 'approved',
    images: [SAMPLE_IMAGES[7]],
    facilities: ['WIFI', '空调', '冰箱', '洗衣机', '热水器', '电视', '暖气', '床', '衣柜', '电梯', '车位'],
    description: '亦庄开发区大三居，南北通透，双阳台。小区环境优美，配套幼儿园、小学，适合家庭居住。紧邻地铁亦庄线。'
  },
  {
    _id: 'sample-9',
    id: 'sample-9',
    title: '东城胡同 · 新中式小院 · 独门独户',
    area: '东城区',
    size: 45,
    rent: 7500,
    deposit: 7500,
    type: '整租',
    address: '东城区南锣鼓巷福祥胡同15号',
    status: 'approved',
    images: [SAMPLE_IMAGES[8]],
    facilities: ['WIFI', '空调', '冰箱', '洗衣机', '热水器', '暖气', '床', '衣柜'],
    description: '南锣鼓巷旁新中式胡同小院，独门独户，闹中取静。保留传统四合院韵味同时融入现代家居设施，文艺青年的理想居所。'
  },
  {
    _id: 'sample-10',
    id: 'sample-10',
    title: '丰台科技园 · 精装公寓 · 短租可选',
    area: '丰台区',
    size: 42,
    rent: 3800,
    deposit: 3800,
    type: '公寓',
    address: '丰台区科技园富丰路4号',
    status: 'approved',
    images: [SAMPLE_IMAGES[9]],
    facilities: ['WIFI', '空调', '冰箱', '洗衣机', '热水器', '电视', '床', '衣柜', '电梯'],
    description: '丰台科技园区精装公寓，支持短租。适合科技园区上班族，步行可达9号线丰台科技园站。品牌家电，智能门锁。'
  },
  {
    _id: 'sample-11',
    id: 'sample-11',
    title: '石景山 · 万达旁两居 · 性价比之选',
    area: '石景山区',
    size: 78,
    rent: 4200,
    deposit: 4200,
    type: '整租',
    address: '石景山区石景山路20号万达广场',
    status: 'approved',
    images: [SAMPLE_IMAGES[10]],
    facilities: ['WIFI', '空调', '冰箱', '洗衣机', '热水器', '暖气', '床', '衣柜', '电视'],
    description: '石景山万达广场旁舒适两居，生活便利。楼下超市、影院、餐饮一应俱全，地铁1号线八角游乐园站步行可达。'
  },
  {
    _id: 'sample-12',
    id: 'sample-12',
    title: '昌平回龙观 · 温馨次卧 · 拎包即住',
    area: '昌平区',
    size: 20,
    rent: 2200,
    deposit: 2200,
    type: '合租',
    address: '昌平区回龙观西大街35号院',
    status: 'approved',
    images: [SAMPLE_IMAGES[11]],
    facilities: ['WIFI', '空调', '洗衣机', '热水器', '床', '衣柜'],
    description: '回龙观核心区域温馨次卧，出行方便。紧邻地铁8/13号线，周边餐饮选择丰富，适合IT行业从业者。'
  }
]

/**
 * 根据搜索条件过滤样例数据
 */
export function filterSampleHouses({ keyword, area, minRent, maxRent, type }) {
  let result = [...SAMPLE_HOUSES]

  if (keyword) {
    const kw = keyword.toLowerCase()
    result = result.filter(h =>
      h.title.toLowerCase().includes(kw) ||
      h.address.toLowerCase().includes(kw) ||
      h.description.toLowerCase().includes(kw)
    )
  }

  if (area) {
    result = result.filter(h => h.area.includes(area))
  }

  if (minRent !== null && minRent !== undefined) {
    result = result.filter(h => h.rent >= minRent)
  }

  if (maxRent !== null && maxRent !== undefined) {
    result = result.filter(h => h.rent <= maxRent)
  }

  if (type) {
    result = result.filter(h => h.type === type)
  }

  return result
}
