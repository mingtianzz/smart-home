# 智慧房屋租赁系统 — 初学者完全指南

> 本文档面向初次接触本项目的开发者，用通俗易懂的语言讲解项目架构、开发流程和核心技术。建议按顺序阅读。

---

## 📑 目录

- [1. 项目整体结构](#1-项目整体结构)
  - [1.1 项目概览](#11-项目概览)
  - [1.2 前端目录详解](#12-前端目录详解)
  - [1.3 后端目录详解](#13-后端目录详解)
  - [1.4 模块间的关系](#14-模块间的关系)
- [2. 开发环境搭建](#2-开发环境搭建)
  - [2.1 必需工具安装](#21-必需工具安装)
  - [2.2 配置文件说明](#22-配置文件说明)
  - [2.3 启动项目的完整步骤](#23-启动项目的完整步骤)
- [3. 前后端联调指南](#3-前后端联调指南)
  - [3.1 API 规范](#31-api-规范)
  - [3.2 请求与响应格式](#32-请求与响应格式)
  - [3.3 通过 Vite 代理解决跨域](#33-通过-vite-代理解决跨域)
  - [3.4 常见联调问题排查](#34-常见联调问题排查)
- [4. 基础开发流程](#4-基础开发流程)
  - [4.1 完整开发一个功能的步骤](#41-完整开发一个功能的步骤)
  - [4.2 代码提交规范](#42-代码提交规范)
- [5. 关键技术点解释](#5-关键技术点解释)
  - [5.1 前后端分离架构](#51-前后端分离架构)
  - [5.2 JWT 认证](#52-jwt-认证)
  - [5.3 Vue Router 权限守卫](#53-vue-router-权限守卫)
  - [5.4 Pinia 状态管理](#54-pinia-状态管理)
  - [5.5 Vite 代理](#55-vite-代理)
  - [5.6 Mongoose 数据模型](#56-mongoose-数据模型)
  - [5.7 ECharts 数据可视化](#57-echarts-数据可视化)

---

## 1. 项目整体结构

### 1.1 项目概览

本项目采用 **前后端分离** 架构，分为两个独立运行的应用程序：

| 端 | 技术 | 端口 | 职责 |
|---|------|------|------|
| **前端** `frontend/` | Vue 3 + Vite | 5173 | 用户界面展示和交互 |
| **后端** `backend/` | Node.js + Express | 3000 | 数据处理和业务逻辑 |

```
用户浏览器
     │
     ▼
┌─────────────┐     API 请求      ┌─────────────┐    读写     ┌──────────┐
│  前端 (5173) │ ────────────────→ │  后端 (3000) │ ────────→ │ MongoDB  │
│  Vue 3 页面  │ ←──────────────── │  Express API │ ←──────── │  数据库   │
└─────────────┘     响应数据       └─────────────┘            └──────────┘
```

**工作流程**：用户在浏览器中操作页面 → 前端通过 API 向后端发送请求 → 后端处理业务逻辑并读写数据库 → 返回结果给前端 → 前端更新页面显示。

### 1.2 前端目录详解

```
frontend/
├── public/                       # 静态资源（不会经过构建处理）
│   ├── favicon.svg               # 浏览器标签栏图标
│   └── login-bg.png              # 登录页背景图片
│
├── src/                          # 源代码目录
│   ├── main.js                   # 前端入口文件，初始化 Vue 应用
│   ├── App.vue                   # 根组件，所有页面的容器
│   │
│   ├── style.css                 # 全局样式 + CSS 变量（定义颜色主题）
│   │
│   ├── router/
│   │   └── index.js              # 路由配置 + 权限守卫
│   │     # 定义 URL 路径和页面的对应关系
│   │     # 控制哪些页面需要登录才能访问
│   │
│   ├── stores/
│   │   └── auth.js               # 认证状态管理（Pinia）
│   │     # 保存当前登录用户信息（token、角色、用户名等）
│   │     # 所有组件都可以从这里读取用户状态
│   │
│   ├── utils/
│   │   └── request.js            # Axios HTTP 请求封装
│   │     # 统一设置请求地址(baseURL)、token、错误处理
│   │
│   ├── components/               # 公共组件（可复用的 UI 部件）
│   │   ├── NavBar.vue            # 顶部导航栏（含角色菜单）
│   │   ├── FooterBar.vue         # 底部页脚
│   │   └── HouseCard.vue         # 房源卡片（房源列表中的每个小方块）
│   │
│   └── views/                    # 页面组件（每个 .vue 文件是一个完整页面）
│       ├── HomePage.vue          # 首页：房源列表搜索 + 展示
│       ├── HouseDetail.vue       # 房源详情页
│       ├── LoginPage.vue         # 登录页（支持多角色登录）
│       ├── RegisterPage.vue      # 注册页
│       │
│       ├── tenant/               # 租客端页面（需要租客角色登录）
│       │   ├── TenantLayout.vue  # 租客端布局框架（左侧菜单 + 右侧内容）
│       │   ├── MyAppointments.vue # 我的预约
│       │   ├── MyContracts.vue   # 我的合同
│       │   ├── MyProfile.vue     # 个人资料
│       │   └── MyReviews.vue     # 我的评价
│       │
│       ├── landlord/             # 房东端页面（需要房东角色登录）
│       │   ├── LandlordLayout.vue # 房东端布局框架
│       │   ├── HouseManage.vue   # 房源管理列表
│       │   ├── HouseForm.vue     # 发布/编辑房源表单
│       │   ├── AppointmentManage.vue # 预约管理
│       │   ├── ContractManage.vue # 合同管理
│       │   └── FinanceManage.vue # 财务管理（含折线图）
│       │
│       └── admin/                # 管理员端页面
│           ├── AdminLayout.vue   # 管理后台布局框架
│           ├── UserManage.vue    # 用户管理
│           ├── HouseReview.vue   # 房源审核
│           ├── DataStats.vue     # 数据统计
│           └── SystemSettings.vue # 系统设置
│
└── package.json                  # 前端项目配置和依赖清单
```

### 1.3 后端目录详解

```
backend/
├── server.js                     # 后端入口文件
│   # 启动 HTTP 服务器，挂载路由，连接数据库
│
├── .env                          # 环境变量（数据库地址、JWT密钥、端口）
│
├── config/
│   └── index.js                  # 配置文件，读取 .env 中的变量
│
├── middleware/                    # 中间件（请求处理管道中的环节）
│   ├── auth.js                   # JWT 认证中间件
│   │   # 验证请求中的 token，解析出当前用户
│   └── errorHandler.js           # 全局错误处理
│       # 捕获所有路由中抛出的错误，统一返回格式
│
├── models/                       # 数据模型（Mongoose）
│   ├── User.js                   # 用户模型（账号、密码、角色、手机号）
│   ├── House.js                  # 房源模型（标题、地址、租金、面积、状态）
│   ├── Appointment.js             # 预约模型（租客、房东、房源、时间、状态）
│   ├── Contract.js               # 合同模型（双方、房源、租金、起止日期、状态）
│   ├── FinanceRecord.js          # 财务记录模型（房东、房源、合同、金额、月份）
│   ├── IncomeUpdateLog.js        # 收入变更日志（记录每次修改的详情）
│   ├── Review.js                 # 评价模型（租客、房源、评分、内容）
│   ├── OperationLog.js           # 操作日志（记录管理员操作）
│   └── Setting.js                # 系统设置（房屋类型、支付方式等）
│
├── routes/                       # 路由/接口（处理具体的 API 请求）
│   ├── auth.js                   # 认证接口（注册、登录、获取用户信息）
│   ├── houses.js                 # 房源接口（发布、编辑、审核、搜索）
│   ├── appointments.js           # 预约接口（创建、确认、拒绝、取消）
│   ├── contracts.js              # 合同接口（创建、签署、终止、修改租金）
│   ├── finance.js                # 财务接口（记录列表、统计、更新记录）
│   ├── reviews.js                # 评价接口（创建、查询、管理）
│   └── admin.js                  # 管理接口（用户列表、统计、设置）
│
└── seed.js                       # 初始化脚本（创建默认管理员账号）
```

### 1.4 模块间的关系

下图展示了一个典型业务流程中各个模块的协作关系：

```
用户操作流程：租客浏览房源 → 预约看房 → 房东确认 → 签署合同 → 生成收入

涉及的模块（按顺序）:
房源模块(House) → 预约模块(Appointment) → 合同模块(Contract) → 财务模块(Finance)

数据流动方向:
┌──────────┐    ┌────────────┐    ┌──────────┐    ┌───────────────┐
│ 房源模块   │ ←→ │ 预约模块     │ ←→ │ 合同模块   │ ←→ │ 财务模块       │
│ House     │    │ Appointment │    │ Contract  │    │ FinanceRecord │
└──────────┘    └────────────┘    └──────────┘    └───────┬───────┘
     │                                                    │
     ▼                                                    ▼
┌──────────┐                                       ┌───────────────┐
│ 评价模块   │                                       │ IncomeUpdate  │
│ Review   │                                       │ Log 收入变更日志│
└──────────┘                                       └───────────────┘

认证模块(Auth) — 所有模块都需要验证用户身份
管理模块(Admin) — 管理员统一管理用户、房源审核、系统设置
```

**关键业务逻辑**：
- 房东签署合同后 → 房源自动下架（`status: offline`）
- 双方都签署后 → 按月自动生成财务记录
- 修改合同租金 → 自动同步更新所有财务记录
- 每次财务更新 → 自动记录变更日志

---

## 2. 开发环境搭建

### 2.1 必需工具安装

| 工具 | 版本要求 | 用途 | 安装方式 |
|------|---------|------|---------|
| **Node.js** | >= 18 | 运行前端和后端 | [nodejs.org](https://nodejs.org/) 下载安装包 |
| **MongoDB** | >= 6.0 | 数据库 | [mongodb.com](https://www.mongodb.com/try/download/community) 下载安装 |
| **VSCode** | 任意 | 代码编辑器 | [code.visualstudio.com](https://code.visualstudio.com/) |
| **Git** | 任意 | 版本控制 | [git-scm.com](https://git-scm.com/) |

**验证安装成功**：
```bash
node --version   # 应输出 v18.x.x 或更高
npm --version    # 应输出 10.x.x 或更高
mongosh          # 应能进入 MongoDB 命令行
```

### 2.2 配置文件说明

#### 后端配置 `.env`

文件位置：`backend/.env`

```ini
PORT=3000                    # 后端服务端口
MONGODB_URI=mongodb://localhost:27017/rental-system  # 数据库连接地址
JWT_SECRET=your_jwt_secret   # JWT 加密密钥（用于生成登录 token）
```

各配置项含义：
- **PORT**：后端监听端口，前端通过这个端口访问后端
- **MONGODB_URI**：告诉后端去哪里连接数据库
- **JWT_SECRET**：对用户登录 token 进行签名的密钥，泄漏后别人可以伪造 token

#### 前端代理配置

文件位置：`frontend/vite.config.js`

```js
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',  // 代理目标：后端地址
        changeOrigin: true,
      }
    }
  }
})
```

意思是：前端把所有以 `/api` 开头的请求，都转发给 `http://localhost:3000`（后端）。

### 2.3 启动项目的完整步骤

**第一步：启动 MongoDB 服务**

```bash
# Windows — 以管理员身份运行 PowerShell
Start-Service -Name "MongoDB"
```

**第二步：安装后端依赖**

```bash
cd backend
npm install
```

`npm install` 会根据 `package.json` 下载所有需要的第三方包到 `node_modules` 文件夹。

**第三步：初始化管理员账号**

```bash
node seed.js
```

执行后会在数据库中创建一个默认管理员：
- 手机号：`13800000000`
- 密码：`admin123`

**第四步：启动后端服务**

```bash
node server.js
```

看到以下输出说明后端启动成功：
```
MongoDB 连接成功
服务器启动成功 http://localhost:3000
```

**第五步：安装前端依赖**

```bash
cd ../frontend
npm install
```

**第六步：启动前端**

```bash
npm run dev
```

看到以下输出说明前端启动成功：
```
VITE v8.1.3  ready in 607 ms
➜  Local:   http://localhost:5173/
```

**第七步：打开浏览器**

访问 `http://localhost:5173/` 即可使用系统。

### 常见启动问题

| 问题 | 原因 | 解决方法 |
|------|------|---------|
| `ECONNREFUSED 127.0.0.1:27017` | MongoDB 未启动 | 运行 `Start-Service -Name "MongoDB"` |
| `端口 3000 被占用` | 另一个程序占用该端口 | 修改 `.env` 中的 PORT，或关闭占用程序 |
| `npm install 报错` | 网络问题 | 设置淘宝镜像：`npm config set registry https://registry.npmmirror.com` |

---

## 3. 前后端联调指南

### 3.1 API 规范

本项目所有接口遵循 RESTful 设计风格：

| 概念 | 说明 |
|------|------|
| **基础路径** | `/api`（所有接口都以 `/api` 开头） |
| **请求方法** | GET（查）、POST（增）、PUT（改）、DELETE（删） |
| **数据格式** | 请求和响应都使用 JSON |
| **认证方式** | Bearer Token（在请求头中携带 token） |
| **响应结构** | 统一格式（见下节） |

**接口命名示例**：

```
GET    /api/houses              # 获取房源列表
POST   /api/houses              # 创建房源
GET    /api/houses/:id          # 获取单个房源详情
PUT    /api/houses/:id          # 更新房源信息
PUT    /api/houses/:id/review   # 审核房源（特定操作）
```

### 3.2 请求与响应格式

#### 发起请求

前端使用封装好的 `request` 工具，位于 `frontend/src/utils/request.js`：

```js
// 引入封装的请求工具
import request from '@/utils/request'

// GET 请求 - 获取房源列表
const res = await request.get('/houses', {
  params: { page: 1, pageSize: 12 }
})

// POST 请求 - 创建房源
const res = await request.post('/houses', {
  title: '朝阳区两居室',
  rent: 3500,
  area: '朝阳区'
})

// PUT 请求 - 更新房源
const res = await request.put('/houses/123', {
  rent: 3800
})
```

#### 成功响应格式

```json
{
  "houses": [ ... ],       // 数据字段（名称因接口而异）
  "total": 42,             // 分页时返回总数
  "page": 1,               // 分页信息
  "message": "操作成功"     // 提示信息
}
```

#### 错误响应格式

```json
{
  "message": "手机号已注册",  // 错误描述
  "error": {}                // 详细错误信息（开发调试用）
}
```

#### 认证（JWT Token）

登录后后端会返回一个 token，前端保存在 `localStorage` 中。每次请求时，Axios 自动在请求头中添加：

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

这个 token **有效期为 7 天**，过期后需要重新登录。

### 3.3 通过 Vite 代理解决跨域

**什么是跨域**：浏览器出于安全考虑，禁止前端页面（`localhost:5173`）访问不同端口（`localhost:3000`）的接口。

**解决方式**：Vite 开发服务器提供代理功能。配置在 `vite.config.js` 中：

```js
// 原理：浏览器请求的是自己同源的 5173 端口
// Vite 再把请求转发给 3000 端口（服务器之间没有跨域限制）

// 用户请求:    GET http://localhost:5173/api/houses
// Vite 转发:   GET http://localhost:3000/api/houses
//                    ↑ 浏览器认为是同源，不拦截
```

这就是为什么前端 `request.js` 中的 `baseURL` 只写 `/api` 而不是完整的 `http://localhost:3000/api`。

### 3.4 常见联调问题排查

#### 问题 1：前端请求报 404

```
GET /api/houses 404 (Not Found)
```

**排查步骤**：
1. 确认后端已启动（终端窗口没有关闭）
2. 确认请求路径是否正确 — 检查 `request.js` 中的 `baseURL`
3. 到浏览器开发者工具 → Network 标签查看实际请求的 URL

#### 问题 2：请求报 401 Unauthorized

```
POST /api/contracts 401 (Unauthorized)
```

**原因**：未登录或 token 过期
**解决**：重新登录，或检查 `request.js` 中是否正确携带了 token

#### 问题 3：请求报 403 Forbidden

```
PUT /api/houses/xxx/review 403 (Forbidden)
```

**原因**：当前登录用户没有该操作的权限（例如租客不能审核房源）
**解决**：使用有权限的角色登录（管理员才能审核）

#### 问题 4：后端报 MongoServerError

```
MongoServerError: E11000 duplicate key error
```

**原因**：数据库唯一约束冲突（如重复的手机号注册）
**解决**：检查输入的数据是否已存在

#### 问题 5：页面空白或组件不显示

**排查步骤**：
1. 按 F12 打开开发者工具 → Console 面板查看报错
2. 查看是否有未捕获的 JavaScript 错误
3. 检查路由路径是否正确

#### 调试技巧

```js
// 前端调试 - 在任意 .vue 文件中
console.log('当前数据:', someData)
console.log('API 响应:', response)

// 后端调试 - 在任意路由文件中
console.log('收到请求:', req.body)
console.log('当前用户:', req.user)
```

---

## 4. 基础开发流程

### 4.1 完整开发一个功能的步骤

以「**新增房源类型筛选条件**」为例，演示从需求到上线的完整流程：

#### 步骤 1：后端 — 数据模型（如果需要新字段）

文件：`backend/models/House.js`

```javascript
// 如果想给房源增加一个「楼层」字段
const houseSchema = new mongoose.Schema({
  title: String,
  rent: Number,
  floor: String,          // ← 新增：高层/中层/低层
  // ...其他字段
})
```

#### 步骤 2：后端 — 编写 API 接口

文件：`backend/routes/houses.js`

```javascript
// 在查询接口中增加楼层筛选
router.get('/', async (req, res) => {
  const { floor } = req.query      // 获取 URL 参数
  const filter = { status: 'approved' }

  if (floor) {
    filter.floor = floor            // ← 新增筛选条件
  }

  const houses = await House.find(filter)
  res.json({ houses })
})
```

**验证方法**：在浏览器中访问 `http://localhost:3000/api/houses?floor=高层` 看是否正确返回数据。

#### 步骤 3：前端 — 更新页面 UI

文件：`frontend/src/views/HomePage.vue`

```html
<template>
  <!-- 增加楼层筛选下拉框 -->
  <el-select v-model="filters.floor" placeholder="选择楼层">
    <el-option label="全部" value="" />
    <el-option label="高层" value="高层" />
    <el-option label="中层" value="中层" />
    <el-option label="低层" value="低层" />
  </el-select>
</template>
```

#### 步骤 4：前端 — 调用 API

```javascript
// 在 HomePage.vue 的 script 部分
async function loadHouses() {
  const res = await request.get('/houses', {
    params: filters.value  // 自动包含 floor 参数
  })
  houses.value = res.houses
}
```

#### 步骤 5：验证功能

1. 后端终端按 `Ctrl + C` 重启（修改后端代码需要重启）
2. 前端热更新自动生效，无需手动刷新
3. 在页面上选择「高层」，确认房源列表正确筛选

#### 完整流程图

```
需求分析
    │
    ▼
后端数据模型修改 (models/xxx.js)
    │
    ▼
后端 API 编写 (routes/xxx.js)
    │
    ▼
重启后端 (Ctrl + C → node server.js)
    │
    ▼
前端页面组件修改 (views/xxx.vue)
    │
    ▼
前端 API 调用 (utils/request.js 或 直接调用)
    │
    ▼
功能验证 (浏览器操作 + Network 面板)
```

### 4.2 代码提交规范

```bash
# 1. 查看当前修改
git status

# 2. 查看具体改动
git diff

# 3. 添加要提交的文件
git add backend/routes/houses.js
git add frontend/src/views/HomePage.vue

# 4. 提交，写清楚的提交信息
git commit -m "$(cat <<'EOF'
feat: 新增房源楼层筛选功能

- House 模型新增 floor 字段
- houses GET 接口增加 floor 筛选参数
- 首页增加楼层选择器下拉框
EOF
)"
```

**提交信息格式建议**：
- `feat: 新功能` — 例如 `feat: 新增房源楼层筛选`
- `fix: 修复 Bug` — 例如 `fix: 修复登录后页面不跳转的问题`
- `refactor: 重构代码` — 例如 `refactor: 优化预约列表查询性能`
- `style: 样式修改` — 例如 `style: 调整导航栏间距`

---

## 5. 关键技术点解释

### 5.1 前后端分离架构

**是什么**：前端和后端是两个独立的项目，各自运行在自己的服务器上，通过 API 通信。

**为什么用**：

```
传统方式（前后端不分离）:
后端渲染 HTML → 返回给浏览器 → 用户看到页面
问题：前端代码写在后端项目里，分工混乱

前后端分离:
前端只负责页面展示 ←→ API 通信 ←→ 后端只负责数据处理
好处：前后端团队可以独立开发、独立部署、技术选型互不影响
```

**在本项目中的体现**：
- 前端 `frontend/` 和后端 `backend/` 是分开的文件夹
- 前端用 Vue 3，后端用 Express，技术栈完全不同
- 两者通过 HTTP 请求（JSON 数据）通信

### 5.2 JWT 认证

**是什么**：JWT（JSON Web Token）是一种用户身份认证方式。

**工作原理**：

```
登录前（未认证）
用户 → 发送手机号+密码 → 后端验证 → 返回 JWT token（一串加密字符串）
                                         ↓
登录后（已认证）                               ↓
用户 → 携带 token 访问任何接口 → 后端解密验证 → 确认用户身份
```

**Token 长什么样**：
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJpZCI6IjY0MWE3...  (包含用户ID、角色等信息)
.sflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
（三个部分用 . 分隔：头部.载荷.签名）
```

**在本项目中的使用**：

文件位置：
- 生成 token：[auth.js 登录接口](file:///c:/Users/里/Desktop/home/backend/routes/auth.js)
- 验证 token：[auth.js 中间件](file:///c:/Users/里/Desktop/home/backend/middleware/auth.js)
- 保存 token：[auth.js Pinia store](file:///c:/Users/里/Desktop/home/frontend/src/stores/auth.js)

**通俗理解**：JWT 就像一张**带有防伪标识的身份证**。用户登录后拿到这张"身份证"，之后每次请求都出示它，后端验证防伪标识确认身份。

### 5.3 Vue Router 权限守卫

**是什么**：在用户访问某个页面之前，检查用户是否有权限访问。

**代码位置**：[router/index.js](file:///c:/Users/里/Desktop/home/frontend/src/router/index.js)

**工作原理**：

```
用户点击链接 → 路由守卫触发 → 检查登录状态
    ├── 未登录 → 跳转到登录页
    ├── 已登录，角色不符合 → 跳转到首页
    └── 已登录，角色符合 → 正常访问页面
```

**通俗理解**：相当于小区门口的保安。访客要进楼 → 保安先问：「你是业主吗？住几栋？」→ 确认后才放行。

### 5.4 Pinia 状态管理

**是什么**：Pinia 是 Vue 3 的全局状态管理工具，用于在多个组件间共享数据。

**为什么需要**：

```
没有 Pinia：
组件 A 获取用户信息 → 存到自己内部
组件 B 也需要 → 再发一次请求 → 浪费

有 Pinia：
组件 A 获取用户信息 → 存到 Pinia（全局存储）
组件 B 需要 → 直接从 Pinia 读 → 不用再请求
```

**在本项目中的使用**：

[stores/auth.js](file:///c:/Users/里/Desktop/home/frontend/src/stores/auth.js) — 存储当前登录用户信息：

```javascript
// 任何组件都可以这样获取用户信息
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
console.log(auth.user)     // 当前用户对象
console.log(auth.token)    // JWT token
console.log(auth.role)     // 用户角色
```

**通俗理解**：Pinia 就像一个**公共公告板**。任何组件都可以往上面贴信息，也可以从上面读取信息。不用每次都在组件之间传来传去。

### 5.5 Vite 代理

**是什么**：Vite 开发服务器提供的一个功能，把前端收到的请求转发到后端。

**为什么需要**：

```
问题：浏览器跨域限制
  前端 http://localhost:5173
  后端 http://localhost:3000
  浏览器拒绝前端直接访问不同端口的后端

解决：Vite 代理
  前端请求 /api/houses → Vite 服务器(5173)
  → Vite 转发 → 后端服务器(3000)  → 返回数据
  → Vite 返回 → 前端
  
  浏览器看来：请求去了 5173（同源），所以不拦截
  实际上：Vite 偷偷转发给了 3000
```

**配置位置**：[vite.config.js](file:///c:/Users/里/Desktop/home/frontend/vite.config.js)

### 5.6 Mongoose 数据模型

**是什么**：Mongoose 是一个 Node.js 库，用来操作 MongoDB 数据库。它让开发者可以用 JavaScript 对象的方式来操作数据库。

**数据模型 = 数据库表结构**：

```javascript
// models/House.js — 定义房源数据应该长什么样
const houseSchema = new mongoose.Schema({
  title: { type: String, required: true },      // 标题（必填）
  rent:  { type: Number, required: true },      // 租金（必填，数字）
  area:  { type: String },                      // 区域（可选）
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'offline'],  // 只能取这些值
    default: 'pending'                          // 默认值
  }
})
```

**常用操作**：

```javascript
// 增
await House.create({ title: '三居室', rent: 5000 })

// 删
await House.findByIdAndDelete('64a1b2c3...')

// 改
await House.findByIdAndUpdate('64a1b2c3...', { rent: 5500 })

// 查
await House.find({ status: 'approved' })         // 查所有符合条件的
await House.findById('64a1b2c3...')              // 按 ID 查单个
await House.find().sort({ createdAt: -1 }).limit(10)  // 排序 + 限制数量
```

**通俗理解**：Mongoose 模型就像一张**表格模板**。它规定了每条数据有哪些字段、每个字段是什么类型、哪些字段必填。操作模型就像在填写和查询表格。

### 5.7 ECharts 数据可视化

**是什么**：ECharts 是百度开源的一个 JavaScript 图表库，用于在网页上绘制各种图表。

**在本项目中的使用**：

在 [FinanceManage.vue](file:///c:/Users/里/Desktop/home/frontend/src/views/landlord/FinanceManage.vue) 中，使用 ECharts 绘制收入趋势折线图：

```javascript
// 核心步骤
import * as echarts from 'echarts'

// 1. 创建图表实例
const chart = echarts.init(document.getElementById('chart'))

// 2. 配置图表选项
chart.setOption({
  xAxis: { data: ['1月','2月','3月'] },     // X 轴：月份
  yAxis: {},                                 // Y 轴：金额
  series: [{                                 // 数据系列
    type: 'line',
    data: [5000, 6000, 5500]                // 每个月的收入
  }]
})
```

**图表示例**：

```
收入(元)
 6000 ┤           ●
       │         / \
 5500 ┤        /   ●
       │       /
 5000 ┤──────●
       │
       └──────────────────→
             1月  2月  3月  (月份)
```

**支持的时间粒度**：
- **月**：按自然月汇总收入
- **季**：按季度汇总（1-3月、4-6月、7-9月、10-12月）
- **年**：按年度汇总

---

## 附录：常用命令速查

```bash
# 项目启动
Start-Service -Name "MongoDB"    # 启动数据库（Windows）
cd backend && npm install        # 安装后端依赖
cd backend && node server.js     # 启动后端
cd frontend && npm install       # 安装前端依赖
cd frontend && npm run dev       # 启动前端

# Git 操作
git status                       # 查看文件变更状态
git add <文件名>                  # 暂存文件
git commit -m "信息"             # 提交
git pull                         # 拉取远程最新代码
git push                         # 推送本地提交

# 调试
node --inspect server.js         # 带调试模式启动后端
```
