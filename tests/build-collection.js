/**
 * 从 register.test-cases.json + auth-test-report.md 中提取全部测试用例，
 * 合并到 postman-collection.json 的 Auth 认证模块中。
 *
 * 运行: node tests/build-collection.js
 */

const fs = require('fs');
const path = require('path');

const testsDir = __dirname;

// ── 读入用例数据 ──────────────────────────────────────────
const registerCases = JSON.parse(fs.readFileSync(path.join(testsDir, 'register.test-cases.json'), 'utf8'));

// ── 助手：生成单个 Postman Request Item ──────────────────
function makePostmanItem(tc, method, urlPath) {
  const body = {};
  let hasBody = false;
  if (tc.request) {
    // 过滤掉 _raw / _contentType 等内部字段
    for (const [k, v] of Object.entries(tc.request)) {
      if (!k.startsWith('_')) { body[k] = v; hasBody = true; }
    }
  }

  // 针对特殊用例: REG-075 是 urlencoded
  let bodyMode = 'raw';
  let rawBody = '';
  if (tc.request && tc.request._raw) {
    bodyMode = 'urlencoded';
    rawBody = tc.request._raw;
  } else if (hasBody) {
    rawBody = JSON.stringify(body, null, 2);
  }

  const item = {
    name: `${tc.id} ${tc.category || ''}`.trim().replace(/\s+/g, ' '),
    request: {
      method: method,
      header: tc.request && tc.request._contentType
        ? [{ key: 'Content-Type', value: tc.request._contentType }]
        : [],
      url: {
        raw: `{{baseUrl}}${urlPath}`,
        host: ['{{baseUrl}}'],
        path: urlPath.split('/').filter(Boolean),
      },
      description: [
        tc.description || '',
        tc.note ? `📝 ${tc.note}` : '',
        tc.validationNote ? `🔍 ${tc.validationNote}` : '',
        `预期: ${tc.expectedStatus} — ${(tc.expectedBody && tc.expectedBody.message) || (tc.expectedBody && tc.expectedBody.message) || ''}`,
        tc.precondition ? `⚠️ 前置: ${tc.precondition}` : '',
      ].filter(Boolean).join('\n\n'),
    },
    response: [],
  };

  if (hasBody || tc.request?._raw) {
    if (bodyMode === 'urlencoded') {
      item.request.body = {
        mode: 'urlencoded',
        urlencoded: rawBody.split('&').map(pair => {
          const [k, v] = pair.split('=');
          return { key: k, value: decodeURIComponent(v || ''), type: 'text' };
        }),
      };
    } else {
      item.request.body = {
        mode: 'raw',
        raw: rawBody,
        options: { raw: { language: 'json' } },
      };
    }
  }

  return item;
}

// ── Register 测试用例 (POST /auth/register) ──────────────
const registerItems = registerCases.testCases.map(tc => makePostmanItem(tc, 'POST', '/auth/register'));

// ── Login 测试用例 ────────────────────────────────────────
const loginCases = [
  // 正向
  { id: 'LOGIN-001', category: '正向·phone登录·tenant', description: '使用 phone 登录，角色 tenant', request: { phone: '13900000001', password: 'pass123456', role: 'tenant' }, expectedStatus: 200, expectedBody: { message: '登录成功' } },
  { id: 'LOGIN-002', category: '正向·email登录·landlord', description: '使用 email 登录，角色 landlord', request: { email: 'landlord@test.com', password: 'pass123456', role: 'landlord' }, expectedStatus: 200, expectedBody: { message: '登录成功' } },
  { id: 'LOGIN-003', category: '正向·phone登录·admin', description: '管理员登录 - 种子用户 13800000000/admin123', request: { phone: '13800000000', password: 'admin123', role: 'admin' }, expectedStatus: 200, expectedBody: { message: '登录成功' } },
  // 负向 — 必填字段
  { id: 'LOGIN-010', category: '负向·password缺失', description: 'password 字段完全缺失', request: { phone: '13900000001', role: 'tenant' }, expectedStatus: 400, expectedBody: { message: '请填写必填字段' } },
  { id: 'LOGIN-011', category: '负向·password空串', description: 'password 为空字符串', request: { phone: '13900000001', password: '', role: 'tenant' }, expectedStatus: 400, expectedBody: { message: '请填写必填字段' } },
  { id: 'LOGIN-012', category: '负向·role缺失', description: 'role 字段完全缺失', request: { phone: '13900000001', password: 'pass123456' }, expectedStatus: 400, expectedBody: { message: '请填写必填字段' } },
  { id: 'LOGIN-013', category: '负向·role空串', description: 'role 为空字符串', request: { phone: '13900000001', password: 'pass123456', role: '' }, expectedStatus: 400, expectedBody: { message: '请填写必填字段' } },
  // 负向 — 凭据错误
  { id: 'LOGIN-020', category: '负向·密码错误', description: '正确 phone，错误 password', request: { phone: '13900000001', password: 'wrongpassword', role: 'tenant' }, expectedStatus: 401, expectedBody: { message: '账号或密码错误' } },
  { id: 'LOGIN-021', category: '负向·用户不存在', description: '不存在的 phone 号', request: { phone: '19999999999', password: 'pass123456', role: 'tenant' }, expectedStatus: 401, expectedBody: { message: '账号或密码错误' } },
  { id: 'LOGIN-022', category: '负向·phone+email均空', description: 'phone 和 email 都不传，查不到用户', request: { password: 'pass123456', role: 'tenant' }, expectedStatus: 401, expectedBody: { message: '账号或密码错误' } },
  // 负向 — 角色
  { id: 'LOGIN-030', category: '负向·角色不匹配(tenant→landlord)', description: 'tenant 用户选 landlord 角色', request: { phone: '13900000001', password: 'pass123456', role: 'landlord' }, expectedStatus: 401, expectedBody: { message: '角色选择错误' } },
  { id: 'LOGIN-031', category: '负向·角色不匹配(landlord→tenant)', description: 'landlord 用户选 tenant 角色', request: { phone: '13900000002', password: 'pass123456', role: 'tenant' }, expectedStatus: 401, expectedBody: { message: '角色选择错误' } },
  // 负向 — 状态
  { id: 'LOGIN-040', category: '负向·账号被禁用', description: '被禁用的用户登录 → 403', request: { phone: '13800000099', password: 'pass123456', role: 'tenant' }, expectedStatus: 403, expectedBody: { message: '账号已被禁用' }, precondition: '需先用 admin 将该用户 status → disabled' },
  // 边界
  { id: 'LOGIN-050', category: '边界·phone+email同时传', description: 'phone 和 email 同时传，phone 先查询命中', request: { phone: '13900000001', email: 'other@test.com', password: 'pass123456', role: 'tenant' }, expectedStatus: 200, expectedBody: { message: '登录成功' }, note: 'phone 先于 email 查询' },
  { id: 'LOGIN-051', category: '边界·多余未知字段', description: '请求体含未定义字段，应被忽略', request: { phone: '13900000001', password: 'pass123456', role: 'tenant', hacked: true, injected: 'malicious' }, expectedStatus: 200, expectedBody: { message: '登录成功' } },
];
const loginItems = loginCases.map(tc => makePostmanItem(tc, 'POST', '/auth/login'));

// ── GET /me 测试用例 ──────────────────────────────────────
const meCases = [
  { id: 'ME-001', category: '正向·正常获取', description: '有效 token 获取当前用户信息', expectedStatus: 200, expectedBody: { user: {} } },
  { id: 'ME-002', category: '负向·无Token', description: '不传 Authorization header', expectedStatus: 401, expectedBody: { message: '请先登录' }, note: 'Postman 中需在 Authorization 标签选 No Auth 覆盖 Collection 默认 Bearer' },
  { id: 'ME-003', category: '负向·Token格式错误', description: 'Authorization 缺少 Bearer 前缀', expectedStatus: 401, expectedBody: { message: '请先登录' }, note: 'Header: Authorization: some-random-token' },
  { id: 'ME-004', category: '负向·Token伪造', description: '随机字符串作为 token', expectedStatus: 401, expectedBody: { message: '登录已过期，请重新登录' } },
  { id: 'ME-005', category: '负向·用户被删除', description: 'token 有效但 DB 中用户已删除', expectedStatus: 401, expectedBody: { message: '用户不存在' }, precondition: '需先手动从 DB 中删除对应用户' },
];
const meItems = meCases.map(tc => makePostmanItem(tc, 'GET', '/auth/me'));

// ── PUT /profile 测试用例 ─────────────────────────────────
const profileCases = [
  { id: 'PROF-001', category: '正向·更新name', description: '仅更新 name 字段', request: { name: '新名字' }, expectedStatus: 200, expectedBody: { message: '更新成功' } },
  { id: 'PROF-002', category: '正向·更新phone', description: '仅更新 phone 字段', request: { phone: '13999999999' }, expectedStatus: 200, expectedBody: { message: '更新成功' } },
  { id: 'PROF-003', category: '正向·更新email', description: '仅更新 email 字段', request: { email: 'newemail@test.com' }, expectedStatus: 200, expectedBody: { message: '更新成功' } },
  { id: 'PROF-004', category: '正向·多字段同时更新', description: '同时更新 name + phone + email', request: { name: '新名字', phone: '13988888888', email: 'multi@test.com' }, expectedStatus: 200, expectedBody: { message: '更新成功' } },
  { id: 'PROF-005', category: '边界·空对象', description: '请求体为 {}', request: {}, expectedStatus: 200, expectedBody: { message: '更新成功' }, note: 'updates 为空对象，findByIdAndUpdate 无变化' },
  { id: 'PROF-006', category: '负向·未登录', description: '不传 token', expectedStatus: 401, expectedBody: { message: '请先登录' }, note: 'Postman 中需在 Authorization 标签选 No Auth' },
];
const profileItems = profileCases.map(tc => makePostmanItem(tc, 'PUT', '/auth/profile'));

// ── 快捷请求（原 collection 中的便利请求）─────────────────
const quickAuthItems = [
  {
    name: '⚡ Register 快捷注册',
    event: [{ listen: 'test', script: { type: 'text/javascript', exec: ['if (pm.response.code === 201) {', '    var json = pm.response.json();', '    pm.collectionVariables.set("token", json.token);', '}'] } }],
    request: {
      method: 'POST', header: [],
      body: { mode: 'raw', raw: '{\n  "phone": "13900000001",\n  "password": "pass123456",\n  "name": "张三",\n  "role": "tenant"\n}', options: { raw: { language: 'json' } } },
      url: { raw: '{{baseUrl}}/auth/register', host: ['{{baseUrl}}'], path: ['auth', 'register'] },
      description: '公开接口。注册成功自动保存 token。',
    },
    response: [],
  },
  {
    name: '⚡ Login (tenant)',
    event: [{ listen: 'test', script: { type: 'text/javascript', exec: ['if (pm.response.code === 200) {', '    var json = pm.response.json();', '    pm.collectionVariables.set("token", json.token);', '    console.log("Token: " + json.token);', '}'] } }],
    request: {
      method: 'POST', header: [],
      body: { mode: 'raw', raw: '{\n  "phone": "13900000001",\n  "password": "pass123456",\n  "role": "tenant"\n}', options: { raw: { language: 'json' } } },
      url: { raw: '{{baseUrl}}/auth/login', host: ['{{baseUrl}}'], path: ['auth', 'login'] },
    },
    response: [],
  },
  {
    name: '⚡ Login (landlord)',
    event: [{ listen: 'test', script: { type: 'text/javascript', exec: ['if (pm.response.code === 200) {', '    var json = pm.response.json();', '    pm.collectionVariables.set("token", json.token);', '}'] } }],
    request: {
      method: 'POST', header: [],
      body: { mode: 'raw', raw: '{\n  "phone": "13900000002",\n  "password": "pass123456",\n  "role": "landlord"\n}', options: { raw: { language: 'json' } } },
      url: { raw: '{{baseUrl}}/auth/login', host: ['{{baseUrl}}'], path: ['auth', 'login'] },
    },
    response: [],
  },
  {
    name: '⚡ Login (admin)',
    event: [{ listen: 'test', script: { type: 'text/javascript', exec: ['if (pm.response.code === 200) {', '    var json = pm.response.json();', '    pm.collectionVariables.set("token", json.token);', '}'] } }],
    request: {
      method: 'POST', header: [],
      body: { mode: 'raw', raw: '{\n  "phone": "13800000000",\n  "password": "admin123",\n  "role": "admin"\n}', options: { raw: { language: 'json' } } },
      url: { raw: '{{baseUrl}}/auth/login', host: ['{{baseUrl}}'], path: ['auth', 'login'] },
      description: '种子管理员: 13800000000 / admin123',
    },
    response: [],
  },
  {
    name: '⚡ Me 当前用户',
    request: { method: 'GET', header: [], url: { raw: '{{baseUrl}}/auth/me', host: ['{{baseUrl}}'], path: ['auth', 'me'] } },
    response: [],
  },
  {
    name: '⚡ Profile 更新资料',
    request: {
      method: 'PUT', header: [],
      body: { mode: 'raw', raw: '{\n  "name": "新名字",\n  "phone": "13900000001"\n}', options: { raw: { language: 'json' } } },
      url: { raw: '{{baseUrl}}/auth/profile', host: ['{{baseUrl}}'], path: ['auth', 'profile'] },
    },
    response: [],
  },
];

// ── 组装完整 Collection ───────────────────────────────────
const collection = {
  info: {
    name: '智慧房屋租赁系统 API (含测试用例)',
    description: [
      '后端全部 37 个端点 + Auth 模块 54 个等价类测试用例。',
      '',
      '结构:',
      '  🏠 Auth 认证',
      '    ├── 📋 Register 等价类测试 (28用例)',
      '    ├── 📋 Login 等价类测试 (15用例)',
      '    ├── 📋 Me 等价类测试 (5用例)',
      '    ├── 📋 Profile 等价类测试 (6用例)',
      '    └── ⚡ 快捷请求 (6个)',
      '  🏘️ Houses 房屋 (10端点)',
      '  📅 Appointments 预约 (5端点)',
      '  📝 Contracts 合同 (5端点)',
      '  💰 Finance 财务 (2端点)',
      '  ⭐ Reviews 评价 (4端点)',
      '  🔧 Admin 管理 (5端点)',
      '  💚 Health (1端点)',
      '',
      '使用: 导入后先创建 Environment 设置 baseUrl=http://localhost:3000/api',
    ].join('\n'),
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:3000/api', type: 'string' },
    { key: 'token', value: '', type: 'string', description: '登录后自动填充' },
    { key: 'houseId', value: '', type: 'string' },
    { key: 'appointmentId', value: '', type: 'string' },
    { key: 'contractId', value: '', type: 'string' },
    { key: 'reviewId', value: '', type: 'string' },
    { key: 'userId', value: '', type: 'string' },
    { key: 'tenantId', value: '', type: 'string' },
  ],
  auth: {
    type: 'bearer',
    bearer: [{ key: 'token', value: '{{token}}', type: 'string' }],
  },
  item: [
    // ═══ Auth 认证 ═══
    {
      name: '🏠 Auth 认证',
      item: [
        {
          name: `📋 Register 等价类测试 (${registerItems.length}用例)`,
          item: registerItems,
          description: `POST /api/auth/register 全覆盖等价类测试\n覆盖字段: phone(5) × email(4) × role(6) × password(4) × name(3) = 23 等价类`,
        },
        {
          name: `📋 Login 等价类测试 (${loginItems.length}用例)`,
          item: loginItems,
          description: `POST /api/auth/login 全覆盖等价类测试\n覆盖: 凭据正确/错误/禁用 + 角色匹配/不匹配 + Token状态`,
        },
        {
          name: `📋 Me 等价类测试 (${meItems.length}用例)`,
          item: meItems,
          description: `GET /api/auth/me 全覆盖等价类测试\n覆盖: Token有效/过期/缺失/伪造 + 用户存在/禁用/删除`,
        },
        {
          name: `📋 Profile 等价类测试 (${profileItems.length}用例)`,
          item: profileItems,
          description: `PUT /api/auth/profile 全覆盖等价类测试\n覆盖: 部分更新/全字段/空对象/未登录`,
        },
        ...quickAuthItems,
      ],
    },

    // ═══ Houses ═══ (保持不变)
    {
      name: '🏘️ Houses 房屋',
      item: [
        { name: 'GET 房源列表（公开搜索）', request: { method: 'GET', header: [], url: { raw: '{{baseUrl}}/houses?page=1&limit=12', host: ['{{baseUrl}}'], path: ['houses'], query: [{ key: 'area', value: '', disabled: true }, { key: 'minRent', value: '', disabled: true }, { key: 'maxRent', value: '', disabled: true }, { key: 'type', value: '', disabled: true }, { key: 'keyword', value: '', disabled: true }, { key: 'page', value: '1' }, { key: 'limit', value: '12' }] }, description: '公开接口，仅返回 status=approved 的房源。' }, response: [] },
        { name: 'GET 房源详情', request: { method: 'GET', header: [], url: { raw: '{{baseUrl}}/houses/{{houseId}}', host: ['{{baseUrl}}'], path: ['houses', '{{houseId}}'] }, description: '公开接口。' }, response: [] },
        { name: 'GET 我的房源（房东）', request: { method: 'GET', header: [], url: { raw: '{{baseUrl}}/houses/my', host: ['{{baseUrl}}'], path: ['houses', 'my'] } }, response: [] },
        { name: 'GET 全部房源（管理员）', request: { method: 'GET', header: [], url: { raw: '{{baseUrl}}/houses/all', host: ['{{baseUrl}}'], path: ['houses', 'all'], query: [{ key: 'status', value: '', disabled: true }] } }, response: [] },
        { name: 'GET 待审核房源（管理员）', request: { method: 'GET', header: [], url: { raw: '{{baseUrl}}/houses/pending', host: ['{{baseUrl}}'], path: ['houses', 'pending'] } }, response: [] },
        { name: 'POST 发布新房源（房东）', event: [{ listen: 'test', script: { type: 'text/javascript', exec: ['if (pm.response.code === 201) {', '    pm.collectionVariables.set("houseId", pm.response.json()._id);', '}'] } }], request: { method: 'POST', header: [], body: { mode: 'raw', raw: '{\n  "title": "精装修两室一厅",\n  "area": "朝阳区",\n  "address": "北京市朝阳区建国路100号",\n  "rent": 3500,\n  "deposit": 3500,\n  "type": "两室一厅",\n  "size": 80,\n  "floor": "12层/共18层",\n  "facilities": ["冰箱","洗衣机","空调","热水器"],\n  "description": "交通便利，采光好，拎包入住",\n  "images": ["https://example.com/img1.jpg"]\n}', options: { raw: { language: 'json' } } }, url: { raw: '{{baseUrl}}/houses', host: ['{{baseUrl}}'], path: ['houses'] } }, response: [] },
        { name: 'PUT 编辑房源（房东-自有）', request: { method: 'PUT', header: [], body: { mode: 'raw', raw: '{\n  "title": "已降价-精装修两室一厅",\n  "rent": 3200\n}', options: { raw: { language: 'json' } } }, url: { raw: '{{baseUrl}}/houses/{{houseId}}', host: ['{{baseUrl}}'], path: ['houses', '{{houseId}}'] } }, response: [] },
        { name: 'PUT 上架/下架（房东-自有）', request: { method: 'PUT', header: [], body: { mode: 'raw', raw: '{\n  "status": "offline"\n}', options: { raw: { language: 'json' } } }, url: { raw: '{{baseUrl}}/houses/{{houseId}}/status', host: ['{{baseUrl}}'], path: ['houses', '{{houseId}}', 'status'] }, description: 'status: approved | offline' }, response: [] },
        { name: 'PUT 审核房源（管理员）', request: { method: 'PUT', header: [], body: { mode: 'raw', raw: '{\n  "status": "approved",\n  "rejectReason": ""\n}', options: { raw: { language: 'json' } } }, url: { raw: '{{baseUrl}}/houses/{{houseId}}/review', host: ['{{baseUrl}}'], path: ['houses', '{{houseId}}', 'review'] }, description: 'status: approved | rejected。拒绝时填 rejectReason。' }, response: [] },
        { name: 'DELETE 软删除房源（房东-自有）', request: { method: 'DELETE', header: [], url: { raw: '{{baseUrl}}/houses/{{houseId}}', host: ['{{baseUrl}}'], path: ['houses', '{{houseId}}'] }, description: '不真删除，status → offline' }, response: [] },
      ],
    },

    // ═══ Appointments ═══
    {
      name: '📅 Appointments 预约',
      item: [
        { name: 'GET 预约列表（角色自适应）', request: { method: 'GET', header: [], url: { raw: '{{baseUrl}}/appointments', host: ['{{baseUrl}}'], path: ['appointments'], query: [{ key: 'status', value: '', disabled: true }] }, description: 'tenant→自己的；landlord→名下房源；admin→全部' }, response: [] },
        { name: 'POST 创建预约（租客）', event: [{ listen: 'test', script: { type: 'text/javascript', exec: ['if (pm.response.code === 201) {', '    pm.collectionVariables.set("appointmentId", pm.response.json()._id);', '}'] } }], request: { method: 'POST', header: [], body: { mode: 'raw', raw: '{\n  "houseId": "{{houseId}}",\n  "visitDate": "2026-07-10",\n  "visitTime": "14:00",\n  "contact": "13800000000",\n  "remark": "下班后看房"\n}', options: { raw: { language: 'json' } } }, url: { raw: '{{baseUrl}}/appointments', host: ['{{baseUrl}}'], path: ['appointments'] } }, response: [] },
        { name: 'PUT 确认预约（房东）', request: { method: 'PUT', header: [], url: { raw: '{{baseUrl}}/appointments/{{appointmentId}}/confirm', host: ['{{baseUrl}}'], path: ['appointments', '{{appointmentId}}', 'confirm'] }, description: '仅 pending→confirmed，需房东本人' }, response: [] },
        { name: 'PUT 拒绝预约（房东）', request: { method: 'PUT', header: [], body: { mode: 'raw', raw: '{\n  "reason": "时间冲突"\n}', options: { raw: { language: 'json' } } }, url: { raw: '{{baseUrl}}/appointments/{{appointmentId}}/reject', host: ['{{baseUrl}}'], path: ['appointments', '{{appointmentId}}', 'reject'] }, description: '仅 pending→rejected' }, response: [] },
        { name: 'PUT 取消预约（租客）', request: { method: 'PUT', header: [], url: { raw: '{{baseUrl}}/appointments/{{appointmentId}}/cancel', host: ['{{baseUrl}}'], path: ['appointments', '{{appointmentId}}', 'cancel'] }, description: '仅 pending→cancelled，需租客本人' }, response: [] },
      ],
    },

    // ═══ Contracts ═══
    {
      name: '📝 Contracts 合同',
      item: [
        { name: 'GET 合同列表（角色自适应）', request: { method: 'GET', header: [], url: { raw: '{{baseUrl}}/contracts', host: ['{{baseUrl}}'], path: ['contracts'] }, description: 'tenant→自己的；landlord→名下房源；admin→全部' }, response: [] },
        { name: 'GET 合同详情', request: { method: 'GET', header: [], url: { raw: '{{baseUrl}}/contracts/{{contractId}}', host: ['{{baseUrl}}'], path: ['contracts', '{{contractId}}'] }, description: '需合同双方或 admin' }, response: [] },
        { name: 'POST 创建合同（房东）', event: [{ listen: 'test', script: { type: 'text/javascript', exec: ['if (pm.response.code === 201) {', '    pm.collectionVariables.set("contractId", pm.response.json()._id);', '}'] } }], request: { method: 'POST', header: [], body: { mode: 'raw', raw: '{\n  "tenantId": "{{tenantId}}",\n  "houseId": "{{houseId}}",\n  "startDate": "2026-08-01",\n  "endDate": "2027-07-31",\n  "rent": 3500,\n  "deposit": 3500\n}', options: { raw: { language: 'json' } } }, url: { raw: '{{baseUrl}}/contracts', host: ['{{baseUrl}}'], path: ['contracts'] }, description: '所有字段必填' }, response: [] },
        { name: 'PUT 签署合同（租客/房东）', request: { method: 'PUT', header: [], url: { raw: '{{baseUrl}}/contracts/{{contractId}}/sign', host: ['{{baseUrl}}'], path: ['contracts', '{{contractId}}', 'sign'] }, description: '双方签→signed' }, response: [] },
        { name: 'PUT 终止合同（任意一方）', request: { method: 'PUT', header: [], url: { raw: '{{baseUrl}}/contracts/{{contractId}}/terminate', host: ['{{baseUrl}}'], path: ['contracts', '{{contractId}}', 'terminate'] }, description: 'status→terminated' }, response: [] },
      ],
    },

    // ═══ Finance ═══
    {
      name: '💰 Finance 财务',
      item: [
        { name: 'GET 财务记录列表（房东）', request: { method: 'GET', header: [], url: { raw: '{{baseUrl}}/finance', host: ['{{baseUrl}}'], path: ['finance'], query: [{ key: 'month', value: '', disabled: true }, { key: 'houseId', value: '', disabled: true }] } }, response: [] },
        { name: 'POST 添加财务记录（房东）', request: { method: 'POST', header: [], body: { mode: 'raw', raw: '{\n  "houseId": "{{houseId}}",\n  "contractId": "{{contractId}}",\n  "amount": 3500,\n  "month": "2026-08"\n}', options: { raw: { language: 'json' } } }, url: { raw: '{{baseUrl}}/finance', host: ['{{baseUrl}}'], path: ['finance'] }, description: '所有字段必填' }, response: [] },
      ],
    },

    // ═══ Reviews ═══
    {
      name: '⭐ Reviews 评价',
      item: [
        { name: 'GET 房源评价（公开）', request: { method: 'GET', header: [], url: { raw: '{{baseUrl}}/reviews/house/{{houseId}}', host: ['{{baseUrl}}'], path: ['reviews', 'house', '{{houseId}}'] }, description: '返回 { reviews, averageScore, total }' }, response: [] },
        { name: 'GET 我的评价（租客）', request: { method: 'GET', header: [], url: { raw: '{{baseUrl}}/reviews/my', host: ['{{baseUrl}}'], path: ['reviews', 'my'] } }, response: [] },
        { name: 'POST 创建评价（租客）', event: [{ listen: 'test', script: { type: 'text/javascript', exec: ['if (pm.response.code === 201) {', '    pm.collectionVariables.set("reviewId", pm.response.json()._id);', '}'] } }], request: { method: 'POST', header: [], body: { mode: 'raw', raw: '{\n  "houseId": "{{houseId}}",\n  "score": 5,\n  "content": "非常好的房子！"\n}', options: { raw: { language: 'json' } } }, url: { raw: '{{baseUrl}}/reviews', host: ['{{baseUrl}}'], path: ['reviews'] }, description: 'score: 1-5；不可重复评价' }, response: [] },
        { name: 'PUT 切换评价可见性（管理员）', request: { method: 'PUT', header: [], url: { raw: '{{baseUrl}}/reviews/{{reviewId}}/hide', host: ['{{baseUrl}}'], path: ['reviews', '{{reviewId}}', 'hide'] }, description: '每次调用翻转 visible' }, response: [] },
      ],
    },

    // ═══ Admin ═══
    {
      name: '🔧 Admin 管理',
      item: [
        { name: 'GET 用户列表', request: { method: 'GET', header: [], url: { raw: '{{baseUrl}}/admin/users', host: ['{{baseUrl}}'], path: ['admin', 'users'], query: [{ key: 'search', value: '', disabled: true }, { key: 'role', value: '', disabled: true }] } }, response: [] },
        { name: 'PUT 启用/禁用用户', event: [{ listen: 'test', script: { type: 'text/javascript', exec: ['pm.collectionVariables.set("userId", pm.response.json()._id);'] } }], request: { method: 'PUT', header: [], body: { mode: 'raw', raw: '{\n  "status": "disabled"\n}', options: { raw: { language: 'json' } } }, url: { raw: '{{baseUrl}}/admin/users/{{userId}}/status', host: ['{{baseUrl}}'], path: ['admin', 'users', '{{userId}}', 'status'] }, description: 'status: active | disabled' }, response: [] },
        { name: 'GET 统计面板', request: { method: 'GET', header: [], url: { raw: '{{baseUrl}}/admin/stats', host: ['{{baseUrl}}'], path: ['admin', 'stats'] } }, response: [] },
        { name: 'GET 系统设置', request: { method: 'GET', header: [], url: { raw: '{{baseUrl}}/admin/settings', host: ['{{baseUrl}}'], path: ['admin', 'settings'] } }, response: [] },
        { name: 'PUT 更新系统设置', request: { method: 'PUT', header: [], body: { mode: 'raw', raw: '{\n  "houseTypes": ["一室","两室一厅","三室一厅","整租"],\n  "paymentMethods": ["月付","季付","半年付","年付"],\n  "auditEnabled": true\n}', options: { raw: { language: 'json' } } }, url: { raw: '{{baseUrl}}/admin/settings', host: ['{{baseUrl}}'], path: ['admin', 'settings'] }, description: '传入任意 key-value 对，逐个 upsert' }, response: [] },
      ],
    },

    // ═══ Health ═══
    {
      name: '💚 Health 健康检查',
      item: [
        { name: 'GET 健康检查', request: { method: 'GET', header: [], url: { raw: '{{baseUrl}}/health', host: ['{{baseUrl}}'], path: ['health'] }, description: '返回 { status, time }' }, response: [] },
      ],
    },
  ],
};

// ── 写出 ──────────────────────────────────────────────────
const outPath = path.join(testsDir, 'postman-collection.json');
fs.writeFileSync(outPath, JSON.stringify(collection, null, 2), 'utf8');

const counts = {
  register: registerItems.length,
  login: loginItems.length,
  me: meItems.length,
  profile: profileItems.length,
  quick: quickAuthItems.length,
  other: 10 + 5 + 5 + 2 + 4 + 5 + 1, // houses+appts+contracts+finance+reviews+admin+health
};

console.log('✅ Postman Collection 已生成:', outPath);
console.log('');
console.log('📊 统计:');
console.log(`  📋 Register 等价类测试: ${counts.register} 用例`);
console.log(`  📋 Login 等价类测试:    ${counts.login} 用例`);
console.log(`  📋 Me 等价类测试:       ${counts.me} 用例`);
console.log(`  📋 Profile 等价类测试:  ${counts.profile} 用例`);
console.log(`  ⚡ Auth 快捷请求:       ${counts.quick} 个`);
console.log(`  🏘️💰📅📝⭐🔧💚 其他端点: ${counts.other} 个`);
console.log(`  ─────────────────────────`);
console.log(`  总计请求:              ${counts.register + counts.login + counts.me + counts.profile + counts.quick + counts.other} 个`);
