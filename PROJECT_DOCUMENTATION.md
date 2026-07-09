# 万家安良居 — 智慧房屋租赁系统项目文档

> **项目名称**: 万家安良居（智慧房屋租赁系统）
> **版本**: 1.0.0
> **技术栈**: Vue 3 + Vite 8 + Element Plus + Pinia + Vue Router 4 (前端) / Node.js + Express + MongoDB + Mongoose + JWT (后端)
> **本文档用途**: 帮助开发人员理解系统架构、功能实现、数据流通及请求规范，便于维护和新成员快速上手。

---

## 目录

1. [系统架构概览](#1-系统架构概览)
2. [功能实现逻辑](#2-功能实现逻辑)
3. [数据流通机制](#3-数据流通机制)
4. [请求发送机制](#4-请求发送机制)
5. [请求结构规范](#5-请求结构规范)
6. [附录](#6-附录)

---

## 1. 系统架构概览

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (Vue 3 SPA)                        │
│  ┌───────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │  NavBar   │  │  Router  │  │  Pinia    │  │  Element Plus UI  │  │
│  │  FooterBar│  │(vue-     │  │(auth      │  │  (表格/表单/弹窗   │  │
│  │  HouseCard│  │ router)  │  │  store)   │  │   对话框/导航等)   │  │
│  └───────────┘  └──────────┘  └───────────┘  └──────────────────┘  │
│                         │                                            │
│                  ┌──────┴──────┐                                    │
│                  │ Axios 实例  │  baseURL: /api                      │
│                  │ request.js │  拦截器: Token注入 + 错误处理       │
│                  └──────┬──────┘                                    │
└─────────────────────────┼───────────────────────────────────────────┘
                          │  ╱api/*  (Vite Proxy)
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Backend (Express)                            │
│                                                                     │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────────────┐  │
│  │Middleware│  │    Routes    │  │         Models (Mongoose)      │  │
│  │  auth.js │  │  /auth       │  │  User   │  House              │  │
│  │  error   │  │  /houses     │  │  Appt.  │  Contract           │  │
│  │Handler.js│  │  /appointments│  │  Review │  FinanceRecord      │  │
│  └──────────┘  │  /contracts  │  │  OpLog  │  Setting            │  │
│                │  /reviews    │  └───────────────────────────────┘  │
│                │  /finance    │                                      │
│                │  /admin      │         ┌──────────────────┐        │
│                │  /upload     │         │   MongoDB 数据库  │        │
│                └──────────────┘         └──────────────────┘        │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 角色权限体系

| 角色 | 标识 | 功能范围 |
|------|------|----------|
| **租户 (Tenant)** | `tenant` | 浏览房源、预约看房、查看/签署合同、发表评价、管理个人信息 |
| **房东 (Landlord)** | `landlord` | 管理房源、处理预约、管理合同、查看财务统计 |
| **管理员 (Admin)** | `admin` | 用户管理、房源审核、数据统计、系统设置 |

### 1.3 前端路由结构

| 路径 | 页面组件 | 权限 | 功能描述 |
|------|----------|------|----------|
| `/` | HomePage.vue | 公开 | 首页：轮播图 + 房源搜索 + 房源卡片列表 |
| `/login` / `/login/:role` | LoginPage.vue | 公开 | 登录（支持角色参数路由） |
| `/register` | RegisterPage.vue | 公开 | 注册（租户/房东角色选择） |
| `/house/:id` | HouseDetail.vue | 公开 | 房源详情（图片/信息/评价/预约） |
| `/tenant/*` | TenantLayout + 子页面 | tenant | 租户后台（预约/合同/评价/资料） |
| `/landlord/*` | LandlordLayout + 子页面 | landlord | 房东后台（房源/预约/合同/财务） |
| `/admin/*` | AdminLayout + 子页面 | admin | 管理后台（用户/审核/统计/设置） |

---

## 2. 功能实现逻辑

### 2.1 用户认证模块

#### 2.1.1 注册流程

```
用户填写注册表单
    │
    ▼
前端校验: 必填字段(姓名/角色/密码)、密码一致性、邮箱格式
    │
    ▼
POST /api/auth/register
    │
    ▼
后端校验:
  1. 角色必须是 tenant 或 landlord
  2. 手机号/邮箱至少填一个
  3. 检查手机号/邮箱唯一性
    │
    ▼
bcrypt.hash(password, 10) 密码加密
    │
    ▼
创建 User 文档 → MongoDB
    │
    ▼
jwt.sign({ userId }, secret, { expiresIn: '7d' }) 生成 Token
    │
    ▼
返回: { token, user } → 前端存储到 localStorage + Pinia
    │
    ▼
根据角色跳转至对应后台首页
```

**核心算法**: 密码使用 `bcryptjs` 哈希（salt rounds = 10），Token 使用 `jsonwebtoken` 签发，有效期 7 天。

**关键数据结构**:
```javascript
// User Schema (Mongoose)
{
  name: String,           // 必填
  phone: String,          // 唯一（与 email 二选一）
  email: String,          // 唯一
  passwordHash: String,   // bcrypt 哈希
  role: 'tenant'|'landlord'|'admin',
  status: 'active'|'disabled',  // 默认 active
  // ... 其他可选字段（avatar, gender, birthday, idCard, address, bio）
}
```

#### 2.1.2 登录流程

```
用户提交凭证 (phone/email + password + role)
    │
    ▼
POST /api/auth/login
    │
    ▼
后端查询: 按 phone 或 email 查找用户
    │
    ├── 用户不存在 → 401 "账号或密码错误"
    │
    ▼
bcrypt.compare(password, user.passwordHash)
    │
    ├── 密码不匹配 → 401 "账号或密码错误"
    │
    ▼
检查 status:
    ├── disabled → 403 "账号已被禁用"
    │
    ▼
检查 role:
    ├── 角色不匹配 → 401 "角色选择错误"
    │
    ▼
签发 JWT Token → 返回用户信息
```

#### 2.1.3 JWT 认证中间件

```javascript
// middleware/auth.js - authentiate 中间件
流程:
1. 从 Authorization header 提取 Bearer token
2. jwt.verify(token, secret) 解码
3. 根据 decoded.userId 查询用户
4. 检查用户状态（disabled 则拒绝）
5. 将 user 对象挂载到 req.user

// middleware/auth.js - authorize 中间件
流程:
1. 接收允许的角色列表 (...roles)
2. 检查 req.user.role 是否在 roles 中
3. 不在则返回 403
```

#### 2.1.4 前端状态管理 (Pinia)

```javascript
// stores/auth.js
状态:
  - user: ref (从 localStorage 恢复)
  - token: ref (从 localStorage 恢复)

计算属性:
  - isLoggedIn: 基于 token 是否存在
  - role: 从 user.role 派生
  - isTenant / isLandlord / isAdmin

操作:
  - login(credentials): 调用 API → saveAuth
  - register(data): 调用 API → saveAuth
  - logout(): 清除 localStorage 和状态
  - checkAuth(): GET /auth/me 验证 Token 有效性
  - saveAuth(userData, tokenStr): 存储到 localStorage + Pinia
```

#### 2.1.5 路由守卫

```javascript
// router/index.js - beforeEach
流程:
1. 检查目标路由 meta.requiresAuth
2. 未登录 → 重定向 /login
3. 角色不匹配 (meta.role) → 重定向 /
```

### 2.2 房源管理模块

#### 2.2.1 房源发布流程 (房东)

```
房东填写房源表单 (HouseForm.vue)
    │
    ▼
表单字段: 标题、姓名、联系方式、面积、租金、押金、区域、类型、地址
          配套设施（多选/自定义）、图片（最多4张，单张≤10MB）、描述
    │
    ├── 图片上传: POST /api/upload → 返回图片URL数组
    │
    ▼
POST /api/houses → 状态默认 pending (待审核)
    │
    ▼
房源不可在前台展示，等待管理员审核
```

**图片上传实现**:
```javascript
// Multer 配置
storage: diskStorage → 保存到 backend/uploads/
filename: Date.now() + random() + ext
fileFilter: 仅允许 jpeg/jpg/png/gif/webp/bmp
limits: fileSize 10MB

// 访问方式
/uploads/{filename} → 通过 Express static 服务
Vite 代理: /uploads → http://localhost:3000
```

#### 2.2.2 房源审核流程 (管理员)

```
管理员查看待审核房源列表 (HouseReview.vue)
    │
    ▼
审核操作:
  ├── 通过: PUT /api/houses/:id/review { status: 'approved' }
  └── 拒绝: PUT /api/houses/:id/review { status: 'rejected', rejectReason: '...' }
    │
    ▼
操作日志记录 (OperationLog.create)
    │
    ▼
房源状态变更:
  - approved → 前台首页可见，可被搜索
  - rejected → 房东需修改后重新提交
```

#### 2.2.3 房源上下架流程 (房东)

```
房东操作房源状态 (HouseManage.vue)
    │
    ▼
PUT /api/houses/:id/status
    │
    ├── 上架 (→ approved):
    │   检查: 是否存在未到期有效合同 → 有则禁止上架
    │   拒绝状态的房源不能直接上架，需先重新提交审核
    │
    ├── 下架 (→ offline):
    │   软删除，房源不再被搜索到
    │
    └── 重新提交审核 (→ pending):
        修改后的房源重新进入审核流程
```

#### 2.2.4 房源搜索与列表

```javascript
// GET /api/houses - 公开接口
参数: { area, minRent, maxRent, type, keyword, page, limit }
过滤条件:
  - 默认 status: 'approved'（仅展示已审核通过的房源）
  - area: 模糊匹配
  - rent: 范围查询 ($gte/$lte)
  - keyword: 标题 + 地址模糊匹配 ($or)
  - type: 精确匹配
分页: 默认 page=1, limit=12, 按 createdAt 降序

// 前端实现 (HomePage.vue)
搜索表单: keyword + area + minRent/maxRent + type
重置: 清空表单, page=1, 重新加载
滚动记忆: 跳转详情页前保存 scrollTop → sessionStorage, 返回时恢复
```

### 2.3 预约管理模块

#### 2.3.1 租户预约流程

```
租户在房源详情页点击 "预约看房"
    │
    ├── 未登录 → 提示登录 → 跳转登录页
    ├── 非租户角色 → 提示 "只有租户可以预约看房"
    │
    ▼
弹出预约表单对话框:
  看房日期 (DatePicker) + 看房时间 (TimePicker)
  联系方式 + 备注
    │
    ▼
POST /api/appointments
    │
    ▼
创建预约: status = 'pending'
  关联: tenantId, landlordId, houseId
```

#### 2.3.2 房东处理预约

```
房东查看预约列表 (AppointmentManage.vue)
    │
    ▼
顶部统计卡片: 待确认 / 已确认 / 已取消 / 已拒绝 数量
    │
    ▼
操作:
  ├── 确认预约: PUT /api/appointments/:id/confirm
  │    status: pending → confirmed
  │
  ├── 拒绝预约: PUT /api/appointments/:id/reject
  │    需填写拒绝原因 → status: rejected
  │
  └── 创建合同 (从已确认预约):
      弹窗填写: 起止日期, 月租金, 押金
      POST /api/contracts/from-appointment/:appointmentId
```

#### 2.3.3 租户取消预约

```
租户在我的预约页面操作 (MyAppointments.vue)
    │
    ▼
PUT /api/appointments/:id/cancel
条件: 仅当 status === 'pending' (待确认状态)
结果: status → 'cancelled'
```

### 2.4 合同管理模块

#### 2.4.1 合同创建流程

```
方式一: 直接从预约创建合同
  POST /api/contracts/from-appointment/:appointmentId
  前提: 预约必须是 confirmed 状态
  校验: 房源未锁定下架、时间不冲突

方式二: 手动创建合同 (ContractManage.vue)
  POST /api/contracts
  选择: 房源 + 租户（从已确认预约中获取）
  填写: 起止日期, 月租金, 押金
```

**时间冲突检测算法**:
```javascript
// 查询重叠合同
const conflict = await Contract.findOne({
  houseId,
  status: 'signed',
  startDate: { $lte: new Date(endDate) },
  endDate: { $gte: new Date(startDate) },
});
```

#### 2.4.2 合同签署流程

```
合同创建 → status: 'draft'
    │
    ▼
房东签署 (PUT /api/contracts/:id/sign)
    │
    ├── signedByLandlord = true
    │
    ▼
租户签署 (PUT /api/contracts/:id/sign)
    │
    ├── signedByTenant = true
    │
    ▼
双方都签署时:
  1. 再次检查时间冲突
  2. status → 'signed'
  3. 自动下架房源 (House.status → 'offline')
  4. 自动生成财务记录 (每月一条, 从 startDate 到 endDate)
```

**财务记录自动生成算法**:
```javascript
// 合同签署时自动触发
1. 获取 startDate 和 endDate
2. 从 start 所在月到 end 所在月, 遍历每个月
3. 对每个月创建一条 FinanceRecord:
   { landlordId, houseId, contractId, amount: contract.rent, month: 'YYYY-MM' }
4. 跳过已存在的记录（防止重复）
```

#### 2.4.3 合同终止

```
PUT /api/contracts/:id/terminate
条件: 租户或房东均可发起
结果: status → 'terminated'
影响: 合同终止后, 房源可重新上架
```

#### 2.4.4 合同模板

前端 `ContractManage.vue` 和 `MyContracts.vue` 中实现了一个精美的合同展示弹窗，包含：

```
甲方（房东）信息: 姓名、电话
乙方（租户）信息: 姓名、电话
房源信息: 标题、地址、面积、租金、押金、类型、楼层、配套设施
租赁条款:
  - 租赁期限: startDate ~ endDate
  - 月租金金额
  - 押金金额
签署状态进度条: signedByLandlord / signedByTenant
```

### 2.5 评价管理模块

#### 2.5.1 评价创建流程

```
租户在我的评价页面 (MyReviews.vue) → "写评价"
    │
    ▼
GET /api/reviews/available-houses
逻辑: 查找租户所有 confirmed 预约 → 过滤已评价过的房源
    │
    ▼
选择房源 + 评分(1-5星) + 评价内容
    │
    ▼
POST /api/reviews
校验:
  1. 必须有过 confirmed 预约
  2. 不能重复评价同一房源
  3. 评分范围 1-5
```

#### 2.5.2 评价展示

```javascript
// GET /api/reviews/house/:houseId
结果:
  - 仅返回 visible: true 的评价
  - 使用 Aggregate 管道计算平均分和总数
  - 按 createdAt 降序排列

// 平均分计算
averageScore: $avg → Math.round(avg * 10) / 10 (保留一位小数)
```

#### 2.5.3 评价可见性管理 (管理员)

```
管理员可切换评价的 visible 属性
PUT /api/reviews/:id/hide → toggle visible
操作记录: OperationLog.create
```

### 2.6 财务管理模块

#### 2.6.1 财务数据生成

财务记录在合同双方签署完成时自动生成（详见 2.4.2 节），无需手动录入。

**数据流**:
```
合同签署 → 按月生成 FinanceRecord → 房东在财务管理页面查看
```

#### 2.6.2 财务统计与图表

```
GET /api/finance/stats
    │
    ▼
MongoDB Aggregate 管道:
  1. 按房东 ID 过滤
  2. 按月份分组 ($group: _id: '$month')
  3. 汇总金额 ($sum: '$amount')
  4. 按月份排序
    │
    ▼
生成折线图数据 (12个月跨度):
  - 补齐缺失月份 (amount = 0)
  - 返回 chartData[{ period, amount, count }]
    │
    ▼
统计卡片:
  - 总收入: 所有财务记录汇总
  - 本月收入: 当前月份的财务记录汇总
  - 合同数: 总量

前端 ECharts 渲染:
  - 折线图 + 渐变面积填充
  - X轴: 月份, Y轴: 金额
```

### 2.7 管理员功能模块

#### 2.7.1 用户管理

```
GET /api/admin/users → 列表 (支持 search + role 过滤)
PUT /api/admin/users/:id/status → 切换启用/禁用
操作日志记录每次状态变更
```

#### 2.7.2 数据统计面板

```
GET /api/admin/stats
使用 Promise.all 并行查询 6 个聚合:
  1. 用户数 (按角色分组)
  2. 房源数 (按状态分组)
  3. 预约总数
  4. 合同总数
  5. 热门区域 Top 5 (按房源数降序)
  6. 租金分布 (最低/平均/最高)
```

#### 2.7.3 系统设置

```
GET /api/admin/settings → 获取所有设置 (key-value 格式)
PUT /api/admin/settings → 批量更新设置

Setting Schema:
  { key: String (unique), value: Mixed, updatedBy: ObjectId }

预设设置项:
  - houseTypes: 房屋类型列表 (数组)
  - paymentMethods: 支付方式列表 (数组)
  - reviewEnabled: 审核功能开关 (布尔)
```

### 2.8 前端组件体系

#### 公共组件

| 组件 | 功能 |
|------|------|
| **NavBar.vue** | 顶部导航栏，响应式，登录后显示用户头像+下拉菜单 |
| **FooterBar.vue** | 页脚，显示版权信息 |
| **HouseCard.vue** | 房源卡片，展示缩略图/标题/区域/面积/类型/租金/状态标签 |

#### 布局组件

| 组件 | 角色 | 导航项 |
|------|------|--------|
| **TenantLayout.vue** | 租户 | 我的预约 / 我的合同 / 我的评价 / 个人信息 |
| **LandlordLayout.vue** | 房东 | 房源管理 / 预约管理 / 合同管理 / 财务管理 |
| **AdminLayout.vue** | 管理员 | 用户管理 / 房源审核 / 数据统计 / 系统设置 |

---

## 3. 数据流通机制

### 3.1 数据流总览图

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                             用户操作层 (UI)                                    │
│  登录/注册  │  发布房源  │  预约看房  │  签署合同  │  评价  │  系统设置         │
└──────────┬──┴─────┬────┴─────┬────┴──────┬────┴────┬──┴──────────┘           │
           │        │          │           │         │                          │
           ▼        ▼          ▼           ▼         ▼                          │
┌─────────────────────────────────────────────────────────────────────────────┐│
│                         Axios 请求层 (request.js)                             ││
│  baseURL: /api  │  Token 注入  │  响应解包  │  统一错误处理                   ││
└───────────────────────────────────┬─────────────────────────────────────────┘│
                                    │                                            │
                                    ▼                                            │
┌─────────────────────────────────────────────────────────────────────────────┐│
│                           Express 路由层                                      ││
│  /auth  │  /houses  │  /appointments  │  /contracts  │  /reviews  │  /admin  ││
│  /finance  │  /upload  │  /health                                             ││
└──────────┬───────────────┬──────────────────────────────┬────────────────────┘│
           │               │                              │                     │
           ▼               ▼                              ▼                      │
┌────────────────┐ ┌──────────────┐ ┌────────────────────────────────────┐      │
│  JWT 认证中间件 │ │  权限校验    │ │  参数校验 + 业务逻辑处理              │      │
│  auth.authenti-│ │  auth.autho- │ │  数据格式转换/验证/计算               │      │
│  cate          │ │  rize()      │ │                                     │      │
└────────────────┘ └──────────────┘ └────────────────┬───────────────────┘      │
                                                     │                          │
                                                     ▼                          │
┌────────────────────────────────────────────────────────────────────────────┐  │
│                         Mongoose 数据模型层                                   │  │
│  User │ House │ Appointment │ Contract │ Review │ FinanceRecord │ OperationLog │  │
│  Setting │ IncomeUpdateLog                                                    │  │
└──────────────────────────────────┬─────────────────────────────────────────┘  │
                                   │                                             │
                                   ▼                                             │
┌──────────────────────────────────────────────────────────────────────────────┐│
│                             MongoDB 数据库                                    ││
│  Database: house_rental                                                        │
└──────────────────────────────────────────────────────────────────────────────┘│
```

### 3.2 核心业务数据流

#### 3.2.1 租房完整业务链

```
[租户]                    [房东]                  [管理员]              [系统]
  │                         │                       │                    │
  │── 注册(tenant) ────────│                       │                    │
  │                         │── 注册(landlord) ─────│                    │
  │                         │── 发布房源(pending) ──│                    │
  │                         │                       │── 审核通过 ────────│
  │── 浏览房源(approved) ──│                       │                    │
  │── 预约看房(pending) ───│                       │                    │
  │                         │── 确认预约            │                    │
  │── 查看已确认预约 ──────│                       │                    │
  │                         │── 创建合同(draft) ───│                    │
  │── 签署合同              │                       │                    │
  │                         │── 签署合同            │                    │
  │                         │                       │                    │── 合同生效(signed)
  │                         │                       │                    │── 房源自动下架
  │                         │                       │                    │── 生成财务记录
  │── 评价房源 ────────────│                       │                    │
  │                         │── 查看财务统计 ──────│                    │
  │                         │                       │── 查看数据统计 ───│
  │                         │                       │── 管理用户/设置 ──│
```

#### 3.2.2 状态流转图

**房源状态**:
```
      ┌─────────┐
      │ pending │ (房东发布/重新提交)
      └────┬────┘
           │
     ┌─────┴─────┐
     ▼           ▼
 ┌────────┐ ┌──────────┐
 │approved│ │ rejected │
 └───┬────┘ └────┬─────┘
     │           │
     ▼           └──→ (修改后重新提交 → pending)
 ┌────────┐
 │ offline│ ← (房东手动下架 / 合同签署自动下架)
 └────────┘
```

**预约状态**:
```
 ┌─────────┐
 │ pending │ (租户创建)
 └────┬────┘
      │
 ┌────┴────┬──────┐
 ▼         ▼      ▼
┌─────────┐┌────┐┌─────────┐
│confirmed││re- ││cancelled│
│         ││jec-││(租户取消)│
└────┬────┘│ted │└─────────┘
     │     └────┘
     ▼
 (可创建合同)
```

**合同状态**:
```
 ┌───────┐
 │ draft │ (房东创建)
 └───┬───┘
     │
 ┌───┴────────┐
 │ pending_   │ (一方已签署)
 │ sign       │
 └───┬────────┘
     │
 ┌───┴────┐     ┌────────────┐
 │ signed  │────→│ terminated │
 │ (双方签)│     │ (提前终止) │
 └────────┘     └────────────┘
```

### 3.3 前端数据状态管理

#### 3.3.1 Pinia Store 架构

```javascript
// stores/auth.js - 全局认证状态

// ─── 持久化存储策略 ───
localStorage:
  token: string       // JWT Token
  user: JSON string   // 用户对象

// ─── 状态依赖链 ───
token  ←── localStorage.getItem('token')
  │
  ├── isLoggedIn = !!token   (计算属性)
  │
user  ←── JSON.parse(localStorage.getItem('user'))
  │
  ├── role = user?.role       (计算属性)
  ├── isTenant = role === 'tenant'
  ├── isLandlord = role === 'landlord'
  └── isAdmin = role === 'admin'

// ─── 操作流程 ───
login()  →  saveAuth()  →  写入 localStorage + 更新 ref
register() → saveAuth() → 同上
logout() →  清除 localStorage + 重置 ref 为 null/空
checkAuth() →  GET /auth/me → 成功则更新 user, 失败则 logout()
```

#### 3.3.2 组件间数据传递

```
路由参数:
  /house/:id → route.params.id 获取房源ID
  /login/:role → route.params.role 获取角色

查询参数:
  ?fromPage=N → 分页回跳
  ?search=xxx → 搜索关键词

sessionStorage (跨页面):
  houseScrollTop → 保存房源列表滚动位置

Pinia Store (全局):
  auth 状态 → 所有组件共享登录/用户信息

provide/inject:
  当前未使用, 数据通过 props + 路由参数传递
```

### 3.4 后端数据流

#### 3.4.1 MongoDB 集合关系图

```
┌──────────┐       ┌──────────┐       ┌──────────────┐
│   User   │1───→N │   House  │1───→N │ Appointment  │
│(tenant)  │       │          │       │              │
└──────────┘       │landlordId│       │ tenantId     │
                   │          │       │ landlordId   │
┌──────────┐       │   ...    │       │ houseId      │
│   User   │1───→N └──────────┘       │ visitDate    │
│(landlord)│           │              │ visitTime    │
└──────────┘           │              │ contact      │
                       │              │ status       │
┌──────────┐           │              └──────────────┘
│   User   │1───→N     │                     │
│(admin)   │           │                     │
└──────────┘           ▼                     │
                ┌──────────────┐             │
                │   Contract   │◄────────────┘
                │              │  (appointmentId)
                │ tenantId     │
                │ landlordId   │
                │ houseId      │
                │ startDate    │
                │ endDate      │
                │ rent/deposit │
                │ status       │
                └──────┬───────┘
                       │
                       ▼
                ┌──────────────┐
                │FinanceRecord │
                │              │
                │ contractId   │
                │ houseId      │
                │ landlordId   │
                │ amount       │
                │ month        │
                └──────────────┘

┌──────────┐       ┌──────────┐
│  Review  │       │   User   │
│          │       │(operator)│
│ tenantId │       └──────────┘
│ houseId  │            │
│ landlordId│           │
│ score    │            ▼
│ content  │       ┌──────────────┐
│ visible  │       │OperationLog  │
└──────────┘       │              │
                   │ operatorId   │
┌──────────┐       │ action       │
│ Setting  │       │ targetType   │
│          │       │ targetId     │
│ key      │       │ detail       │
│ value    │       └──────────────┘
└──────────┘
```

#### 3.4.2 数据格式转换

| 方向 | 转换处理 | 位置 |
|------|----------|------|
| **身份证号脱敏** | `maskIdCard()`: 前3位 + `********` + 后4位 | `utils/helpers.js` |
| **日期格式化** | `visitDate.toISOString().split('T')[0]` → YYYY-MM-DD | 前端提交前 |
| **时间格式转换** | `time.toTimeString().split(' ')[0]` → HH:mm:ss | 前端提交前 |
| **设施列表** | `parseFacilities()`: 数组/JSON字符串/逗号分隔字符串统一转为数组 | `HouseDetail.vue` |
| **图片URL** | 后端返回 `/uploads/filename` → Vite代理转发 | 前后端代理 |
| **金额格式化** | `Number(rent).toLocaleString()` → 千分位显示 | 前端展示 |

---

## 4. 请求发送机制

### 4.1 Axios 请求封装 (request.js)

```javascript
// utils/request.js
const request = axios.create({
  baseURL: '/api',        // 所有 API 请求的前缀
  timeout: 15000,          // 15 秒超时
});
```

#### 4.1.1 请求拦截器

```javascript
request.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    // 自动注入 JWT Token 到 Authorization header
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**触发条件**: 每次 Axios 请求发出前自动执行。

#### 4.1.2 响应拦截器

```javascript
request.interceptors.response.use(
  // 成功响应 → 自动解包 response.data
  response => response.data,

  // 错误响应 → 统一错误处理
  error => {
    const { status, data } = error.response;

    // 401: Token 过期或无效
    if (status === 401) {
      if (当前页不是登录/注册页) {
        清除 token 和 user → 跳转 /login
      } // 登录页自己处理
    }

    // 403: 权限不足
    else if (status === 403) {
      ElMessage.error('没有权限执行此操作');
    }

    // 422: 数据验证失败
    else if (status === 422) {
      ElMessage.error(data?.message || '数据验证失败');
    }

    // 其他错误
    else {
      ElMessage.error(data?.message || '请求失败');
    }

    // 网络错误（无响应）
    if (!error.response) {
      ElMessage.error('网络错误，请检查网络连接');
    }

    return Promise.reject(error);
  }
);
```

**异常处理策略总结**:

| 状态码 | 处理方式 | 说明 |
|--------|----------|------|
| 200-299 | `response.data` 解包 | 自动提取业务数据 |
| 401 | 清除登录态 → 跳转登录页 | 登录页自身处理，不弹Toast |
| 403 | `ElMessage.error()` 提示 | 无权限操作 |
| 422 | `ElMessage.error()` 提示 | 数据验证失败 |
| 其他 4xx/5xx | `ElMessage.error()` 提示 | 显示服务端错误消息 |
| 网络错误 | `ElMessage.error()` 提示 | 无响应时 |

### 4.2 前端调用方式

#### 4.2.1 API 调用模式

```javascript
// 模式一: 在组件中直接调用
import request from '../utils/request'

// GET 请求
const res = await request.get('/houses', { params: { page: 1, limit: 12 } })

// POST 请求
const res = await request.post('/auth/login', { phone, password, role })

// PUT 请求
const res = await request.put(`/houses/${id}/status`, { status: 'offline' })

// 文件上传 (FormData)
const formData = new FormData()
formData.append('file', file)
const res = await request.post('/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
```

#### 4.2.2 Pinia Store 中的调用

```javascript
// stores/auth.js - 封装了认证相关的请求
async function login(credentials) {
  const res = await request.post('/auth/login', credentials)
  // res 已经是解包后的 response.data
  saveAuth(res.user, res.token)  // 存储到 localStorage + Pinia
  return res
}
```

#### 4.2.3 前端请求触发方式

| 触发条件 | 请求类型 | 示例 |
|----------|----------|------|
| **页面加载 (onMounted)** | GET | 加载房源列表、加载详情、加载用户信息 |
| **路由导航 (beforeEach)** | GET | 路由守卫中 `checkAuth()` 验证 Token |
| **用户点击** | POST/PUT | 登录、注册、创建预约、签署合同 |
| **表单提交** | POST/PUT | 发布房源、编辑资料、修改密码 |
| **搜索操作** | GET | 房源搜索过滤 |
| **分页切换** | GET | 翻页加载房源 |
| **定时器** | 无 | 本项目未使用轮询请求 |

### 4.3 后端请求处理机制

#### 4.3.1 Express 中间件链

```
请求进入 → CORS 中间件 → JSON 解析 → 路由匹配 → 认证中间件 → 权限中间件 → 路由处理函数 → 返回响应
                                                                                          │
                                                                                   错误处理中间件
```

**CORS 配置**:
```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8080'],
  credentials: true,
}));
```

**JSON Body 解析**:
```javascript
app.use(express.json());
```

#### 4.3.2 JWT 认证流程 (服务端)

```
1. 请求到达 /api/* 路由
2. 路由定义 auth.authenticate 中间件
3. 从 Authorization: Bearer <token> 提取 Token
4. jwt.verify(token, secret) 解码
   ├── 失败 → 401 { message: '登录已过期，请重新登录' }
   └── 成功 → 从 userId 查询数据库
       ├── 用户不存在 → 401 { message: '用户不存在' }
       ├── 已禁用 → 403 { message: '账号已被禁用' }
       └── 正常 → req.user = user → next()
```

#### 4.3.3 角色权限校验

```javascript
// 用法示例: 需要 landlord 角色
router.post('/', authenticate, authorize('landlord'), handler);

// authorize 实现
function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: '无权限执行此操作' });
    }
    next();
  };
}
```

#### 4.3.4 文件上传处理

```javascript
// 路由: POST /api/upload
// 中间件链: authenticate → authorize('landlord') → multer 处理
// 文件限制: 单文件, 最大 10MB, 仅支持图片格式
// 成功返回: { url: '/uploads/xxx.jpg', filename: 'xxx.jpg' }

// Multer 错误处理
if (err instanceof multer.MulterError) {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: '图片大小不能超过 10MB' });
  }
}
```

#### 4.3.5 MongoDB 内存数据库降级策略

```javascript
// server.js - 启动逻辑
async function start() {
  try {
    await mongoose.connect(config.mongodbUri);   // 首选: 连接真实 MongoDB
  } catch (err) {
    // 降级: 使用 mongodb-memory-server
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
  }
}
```

### 4.4 内部服务通信

当前系统为单体架构，后端在同一 Node.js 进程中运行，**不存在微服务之间的内部 RPC 通信**。服务端内部的数据交互通过以下方式实现：

1. **函数调用**: 路由处理函数中直接调用 Mongoose Model 方法
2. **中间件链**: 请求在 Express 中间件管道中依序处理
3. **MongoDB 查询**: 跨集合数据关联通过 `populate()` 或 `aggregate()` 实现

---

## 5. 请求结构规范

### 5.1 通用规范

| 项目 | 规范 |
|------|------|
| **Base URL** | `http://localhost:3000/api` (开发) |
| **Content-Type** | `application/json` (文件上传使用 `multipart/form-data`) |
| **认证方式** | `Authorization: Bearer <JWT_Token>` |
| **成功响应** | 直接返回业务数据对象/数组，HTTP 状态码 200/201 |
| **错误响应** | `{ message: string }`，HTTP 状态码 4xx/5xx |
| **分页响应** | `{ houses: [], total: number, page: number, limit: number }` |

### 5.2 认证模块 (`/api/auth`)

#### 5.2.1 用户注册

| 属性 | 值 |
|------|------|
| **方法** | `POST` |
| **URL** | `/api/auth/register` |
| **认证** | 无需 |
| **请求体** | `application/json` |

**请求示例**:
```json
{
  "phone": "13800138000",
  "email": "user@example.com",
  "password": "password123",
  "name": "张三",
  "role": "tenant"
}
```

**字段约束**:
| 字段 | 类型 | 必填 | 约束 |
|------|------|------|------|
| `phone` | string | 否* | 与 email 至少填一个 |
| `email` | string | 否* | 与 phone 至少填一个，需邮箱格式 |
| `password` | string | 是 | 长度 >= 6 |
| `name` | string | 是 | 非空 |
| `role` | string | 是 | 仅允许 `tenant` / `landlord` |

**成功响应 (201)**:
```json
{
  "message": "注册成功",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "664a1b2c3d4e5f6a7b8c9d0e",
    "name": "张三",
    "role": "tenant",
    "phone": "13800138000",
    "email": "user@example.com",
    "avatar": "",
    "gender": "",
    "birthday": null,
    "idCard": "",
    "address": "",
    "bio": "",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 5.2.2 用户登录

| 属性 | 值 |
|------|------|
| **方法** | `POST` |
| **URL** | `/api/auth/login` |
| **认证** | 无需 |

**请求示例**:
```json
{
  "phone": "13800138000",
  "email": "user@example.com",
  "password": "password123",
  "role": "tenant"
}
```

**成功响应 (200)**: 同上注册响应格式。

**错误响应**:
```json
// 401 账号或密码错误
{ "message": "账号或密码错误" }

// 403 账号被禁用
{ "message": "账号已被禁用" }

// 401 角色选择错误
{ "message": "角色选择错误" }
```

#### 5.2.3 获取当前用户

| 属性 | 值 |
|------|------|
| **方法** | `GET` |
| **URL** | `/api/auth/me` |
| **认证** | 需 Bearer Token |

**成功响应 (200)**:
```json
{
  "user": { "id": "...", "name": "张三", "role": "tenant", ... }
}
```

#### 5.2.4 更新个人资料

| 属性 | 值 |
|------|------|
| **方法** | `PUT` |
| **URL** | `/api/auth/profile` |
| **认证** | 需 Bearer Token |

**请求体** (部分更新, 只需传要修改的字段):
```json
{
  "name": "李四",
  "phone": "13900139000",
  "avatar": "/uploads/avatar.jpg",
  "gender": "male",
  "address": "北京市朝阳区"
}
```

**校验逻辑**:
- 修改手机号/邮箱时检查唯一性 (排除当前用户)
- 只更新传入的字段

#### 5.2.5 修改密码

| 属性 | 值 |
|------|------|
| **方法** | `PUT` |
| **URL** | `/api/auth/password` |
| **认证** | 需 Bearer Token |

**请求体**:
```json
{
  "oldPassword": "old123",
  "newPassword": "new456"
}
```

**校验**:
- 新旧密码必填
- 新密码长度 >= 6
- 原密码需与数据库 bcrypt 匹配

### 5.3 房源模块 (`/api/houses`)

#### 5.3.1 获取房源列表 (公开)

| 属性 | 值 |
|------|------|
| **方法** | `GET` |
| **URL** | `/api/houses` |
| **认证** | 无需 |

**查询参数**:
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `area` | string | 否 | - | 区域模糊匹配 |
| `minRent` | number | 否 | - | 最低租金 |
| `maxRent` | number | 否 | - | 最高租金 |
| `type` | string | 否 | - | 房屋类型精确匹配 |
| `keyword` | string | 否 | - | 标题/地址模糊搜索 |
| `page` | number | 否 | 1 | 页码 (>=1) |
| `limit` | number | 否 | 12 | 每页条数 (1-100) |

**成功响应 (200)**:
```json
{
  "houses": [
    {
      "_id": "...",
      "title": "朝阳区精装两居室",
      "area": "朝阳区",
      "address": "某某小区1号楼",
      "rent": 5000,
      "deposit": 5000,
      "type": "整租",
      "size": 89,
      "floor": "中层",
      "facilities": ["冰箱", "洗衣机", "空调"],
      "description": "...",
      "images": ["/uploads/house1.jpg"],
      "status": "approved",
      "landlordId": { "_id": "...", "name": "王房东", "phone": "138..." },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 12
}
```

#### 5.3.2 获取房源详情

| 属性 | 值 |
|------|------|
| **方法** | `GET` |
| **URL** | `/api/houses/:id` |
| **认证** | 无需 |

**路径参数**: `id` - 房源 MongoDB ObjectId

#### 5.3.3 创建房源 (房东)

| 属性 | 值 |
|------|------|
| **方法** | `POST` |
| **URL** | `/api/houses` |
| **认证** | 需 Bearer Token, landord 角色 |

**请求体**:
```json
{
  "title": "朝阳区精装两居室",
  "area": "朝阳区",
  "address": "某某小区1号楼1单元101",
  "rent": 5000,
  "deposit": 5000,
  "type": "整租",
  "size": 89.5,
  "floor": "中层/18层",
  "facilities": ["冰箱", "洗衣机", "空调", "热水器"],
  "description": "精装修，交通便利，拎包入住",
  "images": ["/uploads/xxx.jpg", "/uploads/yyy.jpg"],
  "landlordName": "王房东",
  "landlordPhone": "13800138000"
}
```

**字段约束**:
| 字段 | 类型 | 必填 | 约束 |
|------|------|------|------|
| `title` | string | 是 | |
| `area` | string | 是 | |
| `address` | string | 是 | |
| `type` | string | 是 | |
| `landlordName` | string | 是 | |
| `landlordPhone` | string | 是 | |
| `rent` | number | 否 | > 0 |
| `size` | number | 否 | > 0 |
| `deposit` | number | 否 | >= 0 |
| `images` | string[] | 否 | 最多4张 |

#### 5.3.4 更新房源 (房东)

| 属性 | 值 |
|------|------|
| **方法** | `PUT` |
| **URL** | `/api/houses/:id` |
| **认证** | 需 Bearer Token, landlord 角色，且为房源所有者 |

**请求体**: 同创建，支持部分字段更新。

**权限校验**: `house.landlordId.toString() !== req.user._id.toString() → 403`

#### 5.3.5 软删除房源 (房东下架)

| 属性 | 值 |
|------|------|
| **方法** | `DELETE` |
| **URL** | `/api/houses/:id` |
| **认证** | 需 Bearer Token, landlord 角色 |

**响应**: `{ "message": "房源已下线" }`

#### 5.3.6 房源审核 (管理员)

| 属性 | 值 |
|------|------|
| **方法** | `PUT` |
| **URL** | `/api/houses/:id/review` |
| **认证** | 需 Bearer Token, admin 角色 |

**请求体**:
```json
{
  "status": "approved",
  "rejectReason": "房屋照片不清晰"  // 仅 rejected 时需要
}
```

**审核通过后**: 自动创建操作日志。

#### 5.3.7 房源上下架 (房东)

| 属性 | 值 |
|------|------|
| **方法** | `PUT` |
| **URL** | `/api/houses/:id/status` |
| **认证** | 需 Bearer Token, landlord 角色 |

**请求体**:
```json
{
  "status": "approved"   // 或 "offline" / "pending"
}
```

#### 5.3.8 管理员获取所有房源

| 属性 | 值 |
|------|------|
| **方法** | `GET` |
| **URL** | `/api/houses/all` |
| **认证** | 需 Bearer Token, admin 角色 |

**查询参数**: `status` (可选，按状态筛选)

#### 5.3.9 房东获取自己的房源

| 属性 | 值 |
|------|------|
| **方法** | `GET` |
| **URL** | `/api/houses/my` |
| **认证** | 需 Bearer Token, landlord 角色 |

**查询参数**: `status` (可选，按状态筛选)

### 5.4 预约模块 (`/api/appointments`)

#### 5.4.1 获取预约列表

| 属性 | 值 |
|------|------|
| **方法** | `GET` |
| **URL** | `/api/appointments` |
| **认证** | 需 Bearer Token |

**角色数据隔离**:
- 租户: 仅返回 `tenantId = req.user._id`
- 房东: 仅返回 `landlordId = req.user._id`
- 管理员: 返回所有

**查询参数**: `status` (可选)

#### 5.4.2 创建预约 (租户)

| 属性 | 值 |
|------|------|
| **方法** | `POST` |
| **URL** | `/api/appointments` |
| **认证** | 需 Bearer Token, tenant 角色 |

**请求体**:
```json
{
  "houseId": "664a...",
  "visitDate": "2024-12-25",
  "visitTime": "14:30:00",
  "contact": "13800138000",
  "remark": "希望下午看房"
}
```

#### 5.4.3 取消预约 (租户)

| 属性 | 值 |
|------|------|
| **方法** | `PUT` |
| **URL** | `/api/appointments/:id/cancel` |
| **认证** | 需 Bearer Token, tenant 角色 |
| **条件** | 仅 `status === 'pending'` 可取消 |

#### 5.4.4 确认预约 (房东)

| 属性 | 值 |
|------|------|
| **方法** | `PUT` |
| **URL** | `/api/appointments/:id/confirm` |
| **认证** | 需 Bearer Token, landlord 角色 |

#### 5.4.5 拒绝预约 (房东)

| 属性 | 值 |
|------|------|
| **方法** | `PUT` |
| **URL** | `/api/appointments/:id/reject` |
| **认证** | 需 Bearer Token, landlord 角色 |

**请求体**:
```json
{
  "reason": "该时间段已被预约"
}
```

### 5.5 合同模块 (`/api/contracts`)

#### 5.5.1 获取合同列表

| 属性 | 值 |
|------|------|
| **方法** | `GET` |
| **URL** | `/api/contracts` 或 `/api/contracts/my` 或 `/api/contracts/manage` |
| **认证** | 需 Bearer Token |

**路由说明**: 三个端点本质相同，均为角色隔离查询。

#### 5.5.2 创建合同 (房东)

| 属性 | 值 |
|------|------|
| **方法** | `POST` |
| **URL** | `/api/contracts` |
| **认证** | 需 Bearer Token, landlord 角色 |

**请求体**:
```json
{
  "tenantId": "664a...",
  "houseId": "664b...",
  "startDate": "2024-01-01",
  "endDate": "2025-01-01",
  "rent": 5000,
  "deposit": 5000
}
```

#### 5.5.3 从预约创建合同 (房东)

| 属性 | 值 |
|------|------|
| **方法** | `POST` |
| **URL** | `/api/contracts/from-appointment/:appointmentId` |
| **认证** | 需 Bearer Token, landlord 角色 |

**请求体**: 同创建合同。

#### 5.5.4 签署合同

| 属性 | 值 |
|------|------|
| **方法** | `PUT` |
| **URL** | `/api/contracts/:id/sign` |
| **认证** | 需 Bearer Token (租户或房东) |

**无请求体**。后端根据当前用户角色自动标记相应签署状态。

**签署逻辑**:
```
当前用户 = 租户 → signedByTenant = true
当前用户 = 房东 → signedByLandlord = true
双方均签署 → status = signed → 房源下架 → 生成财务记录
```

#### 5.5.5 拒绝合同 (租户)

| 属性 | 值 |
|------|------|
| **方法** | `PUT` |
| **URL** | `/api/contracts/:id/reject` |
| **认证** | 需 Bearer Token, tenant 角色 |

**效果**: 重置双方签署状态为 false, 合同回到 draft 状态。

#### 5.5.6 终止合同

| 属性 | 值 |
|------|------|
| **方法** | `PUT` |
| **URL** | `/api/contracts/:id/terminate` |
| **认证** | 需 Bearer Token (租户或房东) |

#### 5.5.7 获取合同详情

| 属性 | 值 |
|------|------|
| **方法** | `GET` |
| **URL** | `/api/contracts/:id` |
| **认证** | 需 Bearer Token (合同参与方或管理员) |

#### 5.5.8 更新合同

| 属性 | 值 |
|------|------|
| **方法** | `PUT` |
| **URL** | `/api/contracts/:id` |
| **认证** | 需 Bearer Token, landlord 角色 |

**请求体** (部分更新):
```json
{
  "rent": 5500,
  "deposit": 5500,
  "startDate": "2024-02-01",
  "endDate": "2025-02-01"
}
```

**注意**: 合同一旦有任何签署记录则不可修改。

#### 5.5.9 获取可签约租户 (房东)

| 属性 | 值 |
|------|------|
| **方法** | `GET` |
| **URL** | `/api/contracts/landlord/tenants` |
| **认证** | 需 Bearer Token, landlord 角色 |

**逻辑**: 从已确认的预约中提取租户信息。

### 5.6 评价模块 (`/api/reviews`)

#### 5.6.1 获取房源评价 (公开)

| 属性 | 值 |
|------|------|
| **方法** | `GET` |
| **URL** | `/api/reviews/house/:houseId` |
| **认证** | 无需 |

**成功响应**:
```json
{
  "reviews": [
    {
      "_id": "...",
      "tenantId": { "_id": "...", "name": "李四" },
      "score": 4.5,
      "content": "房子很好，交通便利",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "averageScore": 4.5,
  "total": 1
}
```

#### 5.6.2 创建评价 (租户)

| 属性 | 值 |
|------|------|
| **方法** | `POST` |
| **URL** | `/api/reviews` |
| **认证** | 需 Bearer Token, tenant 角色 |

**请求体**:
```json
{
  "houseId": "664a...",
  "score": 4,
  "content": "房子很干净，房东很热情"
}
```

#### 5.6.3 获取可评价房源 (租户)

| 属性 | 值 |
|------|------|
| **方法** | `GET` |
| **URL** | `/api/reviews/available-houses` |
| **认证** | 需 Bearer Token, tenant 角色 |

#### 5.6.4 获取我的评价 (租户)

| 属性 | 值 |
|------|------|
| **方法** | `GET` |
| **URL** | `/api/reviews/my` |
| **认证** | 需 Bearer Token, tenant 角色 |

#### 5.6.5 切换评价可见性 (管理员)

| 属性 | 值 |
|------|------|
| **方法** | `PUT` |
| **URL** | `/api/reviews/:id/hide` |
| **认证** | 需 Bearer Token, admin 角色 |

### 5.7 财务模块 (`/api/finance`)

#### 5.7.1 获取财务记录 (房东)

| 属性 | 值 |
|------|------|
| **方法** | `GET` |
| **URL** | `/api/finance` |
| **认证** | 需 Bearer Token, landlord 角色 |

**查询参数**: `month` (YYYY-MM), `houseId` (可选)

#### 5.7.2 获取财务统计 (房东)

| 属性 | 值 |
|------|------|
| **方法** | `GET` |
| **URL** | `/api/finance/stats` |
| **认证** | 需 Bearer Token, landlord 角色 |

**查询参数**: `endMonth` (YYYY-MM, 默认当前月), `houseId` (可选)

**成功响应**:
```json
{
  "chartData": [
    { "period": "2024-01", "amount": 5000, "count": 1 },
    { "period": "2024-02", "amount": 10000, "count": 2 }
  ],
  "totalIncome": 150000,
  "monthlyIncome": 5000,
  "totalCount": 30
}
```

### 5.8 管理后台模块 (`/api/admin`)

#### 5.8.1 用户列表 (管理员)

| 属性 | 值 |
|------|------|
| **方法** | `GET` |
| **URL** | `/api/admin/users` |
| **认证** | 需 Bearer Token, admin 角色 |

**查询参数**: `search` (姓名/手机号模糊搜索), `role` (角色筛选)

#### 5.8.2 切换用户状态 (管理员)

| 属性 | 值 |
|------|------|
| **方法** | `PUT` |
| **URL** | `/api/admin/users/:id/status` |
| **认证** | 需 Bearer Token, admin 角色 |

**请求体**:
```json
{
  "status": "active"   // 或 "disabled"
}
```

#### 5.8.3 获取统计数据 (管理员)

| 属性 | 值 |
|------|------|
| **方法** | `GET` |
| **URL** | `/api/admin/stats` |
| **认证** | 需 Bearer Token, admin 角色 |

#### 5.8.4 获取系统设置 (管理员)

| 属性 | 值 |
|------|------|
| **方法** | `GET` |
| **URL** | `/api/admin/settings` |
| **认证** | 需 Bearer Token, admin 角色 |

#### 5.8.5 更新系统设置 (管理员)

| 属性 | 值 |
|------|------|
| **方法** | `PUT` |
| **URL** | `/api/admin/settings` |
| **认证** | 需 Bearer Token, admin 角色 |

**请求体**: Key-Value 格式
```json
{
  "houseTypes": ["整租", "合租", "单间", "公寓"],
  "paymentMethods": ["月付", "季付", "半年付", "年付"],
  "reviewEnabled": true
}
```

### 5.9 文件上传模块

| 属性 | 值 |
|------|------|
| **方法** | `POST` |
| **URL** | `/api/upload` |
| **认证** | 需 Bearer Token, landlord 角色 |
| **Content-Type** | `multipart/form-data` |

| 字段 | 类型 | 约束 |
|------|------|------|
| `file` | File | 单文件, ≤10MB, 仅支持 jpg/png/gif/webp/bmp |

**成功响应 (200)**:
```json
{
  "url": "/uploads/1783390600814-114509032.jpg",
  "filename": "1783390600814-114509032.jpg"
}
```

### 5.10 健康检查

| 属性 | 值 |
|------|------|
| **方法** | `GET` |
| **URL** | `/api/health` |
| **认证** | 无需 |

**响应**:
```json
{
  "status": "ok",
  "time": "2024-01-01T00:00:00.000Z"
}
```

---

## 6. 附录

### 6.1 开发环境配置

| 项目 | 配置 |
|------|------|
| **前端开发服务器** | `cd frontend && npm run dev` → `http://localhost:5173` |
| **后端服务器** | `cd backend && npm run dev` → `http://localhost:3000` |
| **数据库** | MongoDB `mongodb://localhost:27017/house_rental` |
| **Vite API 代理** | `/api` → `http://localhost:3000` |
| **Vite 静态代理** | `/uploads` → `http://localhost:3000` |

### 6.2 技术栈版本

| 技术 | 版本 |
|------|------|
| Vue | 3.5 |
| Vite | 8.1 |
| Element Plus | 2.14 |
| Pinia | 3.0 |
| Vue Router | 4.6 |
| Axios | 1.18 |
| ECharts | 6.1 |
| Node.js | 18+ (LTS) |
| Express | 4.18 |
| Mongoose | 7.11 |
| bcryptjs | 最新 |
| jsonwebtoken | 最新 |
| multer | 最新 |

### 6.3 数据模型汇总

| 模型 | 集合名 | 关键字段 |
|------|--------|----------|
| User | users | name, phone, email, passwordHash, role, status |
| House | houses | landlordId, title, area, address, rent, size, type, status |
| Appointment | appointments | tenantId, landlordId, houseId, visitDate, visitTime, status |
| Contract | contracts | tenantId, landlordId, houseId, startDate, endDate, rent, status |
| Review | reviews | tenantId, houseId, landlordId, score, content, visible |
| FinanceRecord | financerecords | landlordId, houseId, contractId, amount, month |
| OperationLog | operationlogs | operatorId, action, targetType, targetId, detail |
| Setting | settings | key (unique), value (Mixed), updatedBy |

### 6.4 关键文件索引

| 文件路径 | 说明 |
|----------|------|
| `frontend/src/utils/request.js` | Axios 实例 + 拦截器 |
| `frontend/src/stores/auth.js` | Pinia 认证状态管理 |
| `frontend/src/router/index.js` | Vue Router + 导航守卫 |
| `frontend/src/views/HomePage.vue` | 首页 (轮播图 + 搜索 + 房源列表) |
| `frontend/src/views/HouseDetail.vue` | 房源详情 + 预约弹窗 |
| `frontend/src/components/HouseCard.vue` | 房源卡片组件 |
| `frontend/src/components/NavBar.vue` | 导航栏 + 用户下拉菜单 |
| `backend/server.js` | 服务器入口 + 中间件配置 + 上传路由 |
| `backend/config/index.js` | 配置中心 |
| `backend/middleware/auth.js` | JWT 认证 + 角色权限中间件 |
| `backend/routes/auth.js` | 认证路由 (注册/登录/资料/密码) |
| `backend/routes/houses.js` | 房源路由 (CRUD/审核/状态) |
| `backend/routes/appointments.js` | 预约路由 (创建/确认/取消/拒绝) |
| `backend/routes/contracts.js` | 合同路由 (创建/签署/终止) |
| `backend/routes/finance.js` | 财务路由 (记录/统计) |
| `backend/routes/admin.js` | 管理路由 (用户/统计/设置) |
| `backend/routes/reviews.js` | 评价路由 (创建/查询/可见性) |

### 6.5 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| **前端组件** | PascalCase | `HouseCard.vue`, `NavBar.vue` |
| **路由路径** | kebab-case | `/tenant/appointments`, `/landlord/houses` |
| **API 路径** | kebab-case | `/api/auth/login`, `/api/houses/:id/review` |
| **MongoDB 字段** | camelCase | `landlordId`, `visitDate`, `rejectReason` |
| **CSS 类名** | kebab-case | `.house-card`, `.carousel-overlay`, `.nav-btn-register` |

---

> **文档生成日期**: 2026-07-09
> **维护者**: 项目开发团队
> **本文档对应项目版本**: 1.0.0
