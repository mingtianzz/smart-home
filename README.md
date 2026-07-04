# 智慧房屋租赁系统

基于 Vue 3 + Node.js + MongoDB 的全功能房屋租赁管理平台，支持租客、房东、管理员三种角色。

## 功能概览

### 租客端
- **房源浏览** — 按区域、价格、类型筛选搜索房源
- **房源详情** — 查看房源信息、房东信息、用户评价
- **预约看房** — 提交看房预约，管理预约状态
- **合同管理** — 查看和签署电子合同
- **评价系统** — 对租住过的房源进行评分和评价

### 房东端
- **房源管理** — 发布/编辑/上下架房源，实时更新房源状态
- **预约管理** — 查看租客预约，确认或拒绝看房请求
- **合同管理** — 创建和管理租赁合同，电子签署
- **财务管理** — 按月份统计租金收入，添加财务记录

### 管理后台
- **用户管理** — 查看所有用户，启用/禁用账号
- **房源审核** — 审核房东发布的房源，通过或拒绝
- **数据统计** — 用户数、房源数、预约数、合同数等概览
- **系统设置** — 配置房屋类型、支付方式、审核开关

## 技术栈

| 层 | 技术 |
|---|------|
| **前端** | Vue 3 (Composition API), Vite, Vue Router, Pinia, Element Plus, Axios |
| **后端** | Node.js, Express.js, JWT 认证, Mongoose ODM |
| **数据库** | MongoDB |
| **设计** | Element Plus 组件 + 自定义主题（蓝绿主色 `#0d7a7a` + 暖金点缀 `#d4943a`） |

## 快速开始

### 前置条件

- Node.js >= 18
- MongoDB >= 6.0（本地运行或 Docker）
- npm 或 yarn

### 1. 克隆并安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 2. 启动 MongoDB

**方式一：本地 MongoDB 服务**
```bash
# Windows - 确保 MongoDB 服务已启动
net start MongoDB
```

**方式二：Docker**
```bash
docker run -d -p 27017:27017 --name mongo mongo:7
```

**方式三：无需安装（自动降级）**

后端会自动检测本地 MongoDB，若连接失败则自动启用内存数据库（`mongodb-memory-server`），数据会在重启后清空。

### 3. 初始化管理员账号

```bash
cd backend
node seed.js
```

默认管理员：
```
手机号: 13800000000
密码:   admin123
角色:   管理员
```

### 4. 启动项目

打开两个终端窗口：

```bash
# 终端 1 - 启动后端
cd backend
node server.js
# 输出: MongoDB 连接成功 / 服务器启动成功 http://localhost:3000

# 终端 2 - 启动前端
cd frontend
npm run dev
# 输出: http://localhost:5173
```

### 5. 访问使用

浏览器打开 **http://localhost:5173**

- 注册新账号 → 选择角色（租客/房东）
- 使用管理员账号登录后台管理

## 项目结构

```
home/
├── frontend/                      # 前端 Vue 3 项目
│   ├── src/
│   │   ├── views/
│   │   │   ├── HomePage.vue       # 首页（房源列表搜索）
│   │   │   ├── HouseDetail.vue    # 房源详情
│   │   │   ├── LoginPage.vue      # 登录
│   │   │   ├── RegisterPage.vue   # 注册
│   │   │   ├── tenant/            # 租客端页面
│   │   │   │   ├── MyAppointments.vue
│   │   │   │   ├── MyContracts.vue
│   │   │   │   └── MyReviews.vue
│   │   │   ├── landlord/          # 房东端页面
│   │   │   │   ├── Dashboard.vue
│   │   │   │   ├── HouseManage.vue
│   │   │   │   ├── HouseForm.vue
│   │   │   │   ├── AppointmentManage.vue
│   │   │   │   ├── ContractManage.vue
│   │   │   │   └── FinanceManage.vue
│   │   │   └── admin/             # 管理后台页面
│   │   │       ├── Dashboard.vue
│   │   │       ├── UserManage.vue
│   │   │       ├── HouseReview.vue
│   │   │       ├── DataStats.vue
│   │   │       └── SystemSettings.vue
│   │   ├── components/            # 公共组件
│   │   │   ├── NavBar.vue
│   │   │   ├── FooterBar.vue
│   │   │   └── HouseCard.vue
│   │   ├── router/index.js        # 路由 + 权限守卫
│   │   ├── stores/auth.js         # Pinia 认证状态
│   │   └── utils/request.js       # Axios 封装
│   └── package.json
│
├── backend/                       # 后端 Express 项目
│   ├── routes/
│   │   ├── auth.js                # 认证（注册/登录/资料）
│   │   ├── houses.js              # 房源 CRUD + 审核 + 状态
│   │   ├── appointments.js        # 预约（角色自适应列表）
│   │   ├── contracts.js           # 合同（创建/签署/终止）
│   │   ├── finance.js             # 财务记录
│   │   ├── reviews.js             # 评价（评分/可见性）
│   │   └── admin.js               # 管理（用户/统计/设置）
│   ├── models/                    # Mongoose 数据模型
│   ├── middleware/                 # 认证中间件 + 错误处理
│   ├── config/index.js            # 配置文件
│   ├── server.js                  # 入口文件
│   └── seed.js                    # 管理员初始化脚本
│
├── doc/
│   └── API_DOCUMENTATION (1).md   # API 详细文档
├── PRODUCT.md                     # 产品策略文档
├── DESIGN.md                      # 设计系统规范
└── README.md                      # 本文件
```

## API 概览

Base URL: `http://localhost:3000/api`

| 模块 | 端点 | 说明 |
|------|------|------|
| **认证** | `POST /auth/register` | 用户注册 |
| | `POST /auth/login` | 用户登录 |
| | `GET /auth/me` | 获取当前用户 |
| | `PUT /auth/profile` | 更新个人资料 |
| **房源** | `GET /houses` | 房源列表（公开） |
| | `GET /houses/my` | 我的房源（房东） |
| | `GET /houses/:id` | 房源详情 |
| | `POST /houses` | 发布房源 |
| | `PUT /houses/:id` | 编辑房源 |
| | `DELETE /houses/:id` | 下架房源 |
| | `PUT /houses/:id/review` | 审核房源（管理员） |
| | `PUT /houses/:id/status` | 上架/下架（房东） |
| **预约** | `GET /appointments` | 预约列表（角色自适应） |
| | `POST /appointments` | 创建预约 |
| | `PUT /appointments/:id/confirm` | 确认预约 |
| | `PUT /appointments/:id/reject` | 拒绝预约 |
| | `PUT /appointments/:id/cancel` | 取消预约 |
| **合同** | `GET /contracts` | 合同列表（角色自适应） |
| | `POST /contracts` | 创建合同（房东） |
| | `PUT /contracts/:id/sign` | 签署合同 |
| | `PUT /contracts/:id/terminate` | 终止合同 |
| **财务** | `GET /finance` | 财务记录（房东） |
| | `POST /finance` | 添加记录（房东） |
| **评价** | `GET /reviews/house/:houseId` | 房源评价 |
| | `POST /reviews` | 创建评价（租客） |
| **管理** | `GET /admin/users` | 用户列表 |
| | `PUT /admin/users/:id/status` | 启用/禁用用户 |
| | `GET /admin/stats` | 系统统计 |
| | `GET /admin/settings` | 获取设置 |
| | `PUT /admin/settings` | 更新设置 |

详见 [API 文档](doc/API_DOCUMENTATION%20(1).md)。

## 设计主题

- **主色**: 蓝绿 `#0d7a7a` — 传递专业、可靠、舒适感
- **强调色**: 暖金 `#d4943a` — 营造温馨、品质氛围
- **背景**: 纯白 `#ffffff` + 柔和灰 `#f8f9fa`
- **圆角**: 8px (小卡片)、12px (大卡片)、6px (按钮)
- **阴影**: 轻量级 `rgba(13, 122, 122, 0.08)`

详见 [DESIGN.md](DESIGN.md)。
