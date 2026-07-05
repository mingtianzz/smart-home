# 智慧房屋租赁系统 — API 文档 & 测试清单

> **项目类型**: Express.js (Node.js) + MongoDB (Mongoose) 后端，Vue 3 + Element Plus 前端
> **Base URL**: `http://localhost:3000/api`
> **认证方式**: Bearer Token (JWT)，Header: `Authorization: Bearer <token>`
> **日期**: 2026-07-04（同步 upstream/master 后重新验证）

---

## ⚠️ 当前实现状态

| 状态 | 说明 |
|------|------|
| ✅ 已实现 | 后端代码完整，已通过代码审查 |
| ⚠️ 路径不一致 | 后端已实现但 API 路径/字段名与前端调用不匹配 |
| ❌ 未实现 | 代码完全缺失 |

### 后端实现总览

| 组件 | 状态 | 说明 |
|------|:----:|------|
| `server.js` | ✅ | Express 入口完整：CORS、路由挂载、MongoDB 连接（含内存 Fallback）、健康检查 |
| `config/index.js` | ✅ | 端口、MongoDB URI、JWT 密钥/过期时间 |
| `middleware/auth.js` | ✅ | `authenticate`（JWT 验证）+ `authorize(...roles)`（角色鉴权） |
| `middleware/errorHandler.js` | ✅ | 全局错误处理器（独立文件，server.js 中另有内联版） |
| `models/User.js` | ✅ | 含 `pre-save` hook |
| `models/House.js` | ✅ | 含 `pre-save` hook |
| `models/Appointment.js` | ✅ | 含 `pre-save` hook |
| `models/Contract.js` | ✅ | 含 `pre-save` hook |
| `models/FinanceRecord.js` | ✅ | 含 `pre-save` hook |
| `models/Review.js` | ✅ | 含 `pre-save` hook |
| `models/Setting.js` | ✅ | Key-Value 结构，含 `pre-save` hook |
| `models/OperationLog.js` | ✅ | 操作审计日志 |
| `routes/auth.js` | ✅ | 4 个端点（含文档未记录的 `PUT /profile`） |
| `routes/houses.js` | ✅ | 10 个端点（含文档未记录的 `GET /all`、`GET /pending`、`DELETE /:id`） |
| `routes/appointments.js` | ✅ | 5 个端点 |
| `routes/contracts.js` | ✅ | 5 个端点（含文档未记录的 `PUT /:id/terminate`、`GET /:id`） |
| `routes/finance.js` | ✅ | 2 个端点 |
| `routes/reviews.js` | ✅ | 4 个端点（含文档未记录的 `PUT /:id/hide`） |
| `routes/admin.js` | ✅ | 5 个端点（users CRUD + stats + settings） |
| `seed.js` | ✅ | 管理员种子数据（13800000000 / admin123） |

### 🚨 关键发现：前后端 API 路径不一致

**后端代码已完整实现，但存在 8 处前后端路径/字段名不匹配**，当前前端调用将无法正常工作：

| # | 前端调用 | 后端实际路径 | 差异 |
|---|---------|-------------|------|
| 1 | `GET /users` | `GET /api/admin/users` | 路径不同（缺 `/admin` 前缀） |
| 2 | `PUT /users/:id/toggle` | `PUT /api/admin/users/:id/status` | 路径 + 端点名不同 |
| 3 | `GET /settings` | `GET /api/admin/settings` | 路径不同（缺 `/admin` 前缀） |
| 4 | `PUT /settings` | `PUT /api/admin/settings` | 路径不同（缺 `/admin` 前缀） |
| 5 | `GET /appointments/my` | `GET /api/appointments` | 后端用角色自动区分，无 `/my` 路径 |
| 6 | `GET /appointments/manage` | `GET /api/appointments` | 同上，无 `/manage` 路径 |
| 7 | `GET /contracts/my` | `GET /api/contracts` | 后端用角色自动区分，无 `/my` 路径 |
| 8 | `GET /contracts/manage` | `GET /api/contracts` | 同上，无 `/manage` 路径 |

### 字段名不一致

| # | 模块 | 前端/API 文档字段 | 后端模型字段 | 影响端点 |
|---|------|------------------|-------------|---------|
| 1 | Review | `rating` | `score` | `POST /api/reviews` |
| 2 | Appointment | `date` / `time` / `note` | `visitDate` / `visitTime` / `contact` + `remark` | `POST /api/appointments` |

### 后端已实现但文档未记录的端点（6 个）

| 端点 | 说明 |
|------|------|
| `PUT /api/auth/profile` | 更新当前用户资料（name, phone, email） |
| `GET /api/houses/all` | Admin 获取所有房源（可选 status 筛选） |
| `GET /api/houses/pending` | Admin 获取待审核房源 |
| `DELETE /api/houses/:id` | 房东软删除房源（status → offline） |
| `PUT /api/contracts/:id/terminate` | 租客/房东终止合同 |
| `GET /api/contracts/:id` | 获取单个合同详情 |
| `PUT /api/reviews/:id/hide` | Admin 切换评价可见性 |

---

## 1. 认证模块 (Auth) — `routes/auth.js`

### 1.1 `POST /api/auth/register` — 用户注册
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | 无（公开） |
| **请求体** | `{ phone?: string, email?: string, password: string, name: string, role: 'tenant' \| 'landlord' }` |
| **验证规则** | `password`, `name`, `role` 必填；`role` 仅限 `tenant`/`landlord`；`phone` 和 `email` 至少填一个；手机号/邮箱不能重复 |
| **成功响应 (201)** | `{ message: "注册成功", token: string, user: { id, name, role, phone, email } }` |
| **错误响应 (400)** | `{ message: "请填写必填字段" }` / `"角色无效"` / `"手机号和邮箱至少填一个"` / `"该账号已被注册"` |
| **前端调用** | `RegisterPage.vue` → `auth.register()` |
| **测试优先级** | 🔴 P0 — 核心功能 |

### 1.2 `POST /api/auth/login` — 用户登录
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | 无（公开） |
| **请求体** | `{ phone?: string, email?: string, password: string, role: string }` |
| **验证规则** | `password`, `role` 必填；后端额外校验 `user.role === role`（角色选择错误返回 401） |
| **成功响应 (200)** | `{ message: "登录成功", token: string, user: { id, name, role, phone, email } }` |
| **错误响应 (400/401/403)** | `{ message: "请填写必填字段" }` / `"账号或密码错误"` / `"角色选择错误"` / `"账号已被禁用"` |
| **前端调用** | `LoginPage.vue` → `auth.login()` |
| **测试优先级** | 🔴 P0 — 核心功能 |

### 1.3 `GET /api/auth/me` — 获取当前用户信息
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需要登录 |
| **成功响应 (200)** | `{ user: { id, name, phone, email, role, status, createdAt } }` |
| **错误响应 (401)** | `{ message: "请先登录" }` |
| **前端调用** | `auth.checkAuth()` 在路由守卫中调用 |
| **测试优先级** | 🔴 P0 — 用于验证 token 有效性、路由守卫 |

### 1.4 `PUT /api/auth/profile` — 更新个人资料
**状态**: ✅ 已实现（📝 文档未记录）

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需要登录 |
| **请求体** | `{ name?: string, phone?: string, email?: string }`（全部可选，部分更新） |
| **成功响应 (200)** | `{ message: "更新成功", user: { id, name, role, phone, email } }` |
| **前端调用** | 暂无前端调用 |
| **测试优先级** | 🟢 P2 |

---

## 2. 房屋模块 (Houses) — `routes/houses.js`

### 2.1 `GET /api/houses` — 房源列表（公开搜索）
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | 无（公开浏览），只返回 `status: 'approved'` 的房源 |
| **查询参数** | `area`, `minRent`, `maxRent`, `type`, `keyword`, `page`（默认1）, `limit`（默认12, 最大100） |
| **成功响应 (200)** | `{ houses: [...], total: number, page: number, limit: number }` |
| **前端调用** | `HomePage.vue`, `HouseReview.vue`, `MyReviews.vue` |
| **测试优先级** | 🔴 P0 — 首页核心 |

### 2.2 `GET /api/houses/my` — 房东自己的房源列表
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `landlord` 角色 |
| **查询参数** | `status`（可选筛选） |
| **成功响应 (200)** | `[{ house }, ...]` — ⚠️ 直接返回数组，非 `{ houses: [...] }` |
| **前端调用** | `HouseManage.vue`, `ContractManage.vue`, `FinanceManage.vue` |
| **测试优先级** | 🔴 P0 |

### 2.3 `GET /api/houses/all` — 所有房源（管理员）
**状态**: ✅ 已实现（📝 文档未记录）

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `admin` 角色 |
| **查询参数** | `status`（可选筛选） |
| **成功响应 (200)** | `[{ house }, ...]` — 直接返回数组 |
| **测试优先级** | 🟡 P1 |

### 2.4 `GET /api/houses/pending` — 待审核房源（管理员）
**状态**: ✅ 已实现（📝 文档未记录）

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `admin` 角色 |
| **成功响应 (200)** | `[{ house }, ...]` — 状态为 `pending` 的房源 |
| **测试优先级** | 🟡 P1 |

### 2.5 `GET /api/houses/:id` — 房源详情
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | 无（公开查看） |
| **URL 参数** | `id` — 房源 MongoDB ObjectId |
| **成功响应 (200)** | `{ house }` — 已 populate `landlordId`（name, phone） |
| **错误响应 (404)** | `{ message: "房源不存在" }` |
| **前端调用** | `HouseDetail.vue`, `HouseForm.vue` (编辑模式) |
| **测试优先级** | 🔴 P0 |

### 2.6 `POST /api/houses` — 发布新房源
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `landlord` 角色 |
| **请求体** | `{ title, area, address, rent, deposit?, type, size, floor?, facilities?, description?, images? }` |
| **验证规则** | `title`, `area`, `address`, `type` 必填；`rent > 0`, `size > 0`（NaN 或 ≤0 返回 400） |
| **成功响应 (201)** | `{ house }` — 直接返回 house 对象 |
| **前端调用** | `HouseForm.vue` (新增模式) |
| **测试优先级** | 🔴 P0 |

### 2.7 `PUT /api/houses/:id` — 编辑房源
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + 房源所属 `landlord` |
| **请求体** | 部分更新，所有字段可选；数字字段单独校验 |
| **验证规则** | 数值字段 `rent > 0`, `size > 0`, `deposit >= 0`；字符串/数组字段按需更新 |
| **成功响应 (200)** | `{ house }` — 更新后的完整对象 |
| **错误响应 (403)** | `{ message: "无权修改此房源" }` |
| **前端调用** | `HouseForm.vue` (编辑模式) |
| **测试优先级** | 🟡 P1 |

### 2.8 `DELETE /api/houses/:id` — 软删除房源
**状态**: ✅ 已实现（📝 文档未记录）

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + 房源所属 `landlord` |
| **业务逻辑** | `status` → `'offline'`（不真正删除） |
| **成功响应 (200)** | `{ message: "房源已下线" }` |
| **前端调用** | 暂无前端调用 |
| **测试优先级** | 🟢 P2 |

### 2.9 `PUT /api/houses/:id/review` — 审核房源（管理员）
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `admin` 角色 |
| **请求体** | `{ status: 'approved' \| 'rejected', rejectReason?: string }` |
| **业务逻辑** | 通过/拒绝 + 写入 OperationLog 审计 |
| **成功响应 (200)** | `{ house }` |
| **前端调用** | `HouseReview.vue` |
| **测试优先级** | 🔴 P0 |

### 2.10 `PUT /api/houses/:id/status` — 上架/下架房源（房东）
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + 房源所属 `landlord` |
| **请求体** | `{ status: 'approved' \| 'offline' }` |
| **成功响应 (200)** | `{ message: "已上架" }` / `"已下架"` |
| **前端调用** | `HouseManage.vue` |
| **测试优先级** | 🟡 P1 |

---

## 3. 预约模块 (Appointments) — `routes/appointments.js`

### 3.1 `GET /api/appointments` — 预约列表（角色自适应）
**状态**: ✅ 已实现（⚠️ 路径与前端不一致：前端调用 `/appointments/my` 和 `/appointments/manage`）

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 |
| **业务逻辑** | tenant → 返回自己的预约；landlord → 返回名下房源的预约；admin → 返回全部 |
| **查询参数** | `status`（可选筛选） |
| **成功响应 (200)** | `[{ appointment }]` — 直接返回数组，已 populate tenant/landlord/house |
| **前端调用** | `MyAppointments.vue` (调用 `/my`)、`AppointmentManage.vue` (调用 `/manage`) |
| **测试优先级** | 🔴 P0 |
| **⚠️ 修复建议** | 在后端添加 `/my` 和 `/manage` 别名路由，或修改前端统一使用 `/appointments` |

### 3.2 `POST /api/appointments` — 创建预约
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `tenant` 角色 |
| **请求体** | `{ houseId, visitDate, visitTime, contact, remark? }` |
| **字段说明** | 后端使用 `visitDate`/`visitTime`/`contact`/`remark`，前端已正确发送这些字段 |
| **验证规则** | `houseId`, `visitDate`, `visitTime`, `contact` 必填；房源必须 `status = 'approved'` |
| **成功响应 (201)** | `{ appointment }` |
| **前端调用** | `HouseDetail.vue` |
| **测试优先级** | 🔴 P0 |

### 3.3 `PUT /api/appointments/:id/confirm` — 确认预约
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + 预约所属 `landlord` |
| **业务逻辑** | `status: 'pending'` → `'confirmed'`；只有 `pending` 状态可操作 |
| **成功响应 (200)** | `{ appointment }` |
| **前端调用** | `AppointmentManage.vue` |
| **测试优先级** | 🟡 P1 |

### 3.4 `PUT /api/appointments/:id/reject` — 拒绝预约
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + 预约所属 `landlord` |
| **请求体** | `{ reason?: string }` |
| **业务逻辑** | `status: 'pending'` → `'rejected'` + 记录 `rejectReason` |
| **成功响应 (200)** | `{ appointment }` |
| **前端调用** | `AppointmentManage.vue` |
| **测试优先级** | 🟡 P1 |

### 3.5 `PUT /api/appointments/:id/cancel` — 取消预约
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + 预约所属 `tenant` |
| **业务逻辑** | `status: 'pending'` → `'cancelled'`；只有 `pending` 状态可取消 |
| **成功响应 (200)** | `{ appointment }` |
| **前端调用** | `MyAppointments.vue` |
| **测试优先级** | 🟢 P2 |

---

## 4. 合同模块 (Contracts) — `routes/contracts.js`

### 4.1 `GET /api/contracts` — 合同列表（角色自适应）
**状态**: ✅ 已实现（⚠️ 路径与前端不一致：前端调用 `/contracts/my` 和 `/contracts/manage`）

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 |
| **业务逻辑** | tenant → 自己的合同；landlord → 名下房源的合同；admin → 全部 |
| **成功响应 (200)** | `[{ contract }]` — 已 populate tenant/landlord/house |
| **前端调用** | `MyContracts.vue` (调用 `/my`)、`ContractManage.vue` (调用 `/manage`) |
| **测试优先级** | 🔴 P0 |
| **⚠️ 修复建议** | 在后端添加 `/my` 和 `/manage` 别名路由，或修改前端统一使用 `/contracts` |

### 4.2 `POST /api/contracts` — 创建合同
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `landlord` 角色 |
| **请求体** | `{ tenantId, houseId, startDate, endDate, rent, deposit }` |
| **验证规则** | 所有字段必填（含 `deposit`）；房源必须属于该房东 |
| **成功响应 (201)** | `{ contract }`，status 初始为 `draft` |
| **前端调用** | `ContractManage.vue` |
| **测试优先级** | 🔴 P0 |

### 4.3 `PUT /api/contracts/:id/sign` — 签署合同
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录（tenant 或 landlord） |
| **业务逻辑** | tenant → `signedByTenant = true`；landlord → `signedByLandlord = true`；双方都签 → `status = 'signed'`；一方签 → `status = 'pending_sign'` |
| **错误响应 (400)** | `{ message: "您已签署此合同" }`（重复签署） |
| **前端调用** | `MyContracts.vue` (租客), `ContractManage.vue` (房东) |
| **测试优先级** | 🔴 P0 |

### 4.4 `PUT /api/contracts/:id/terminate` — 终止合同
**状态**: ✅ 已实现（📝 文档未记录）

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录（合同所属 tenant 或 landlord） |
| **业务逻辑** | `status` → `'terminated'` |
| **成功响应 (200)** | `{ contract }` |
| **前端调用** | 暂无前端调用 |
| **测试优先级** | 🟢 P2 |

### 4.5 `GET /api/contracts/:id` — 合同详情
**状态**: ✅ 已实现（📝 文档未记录）

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录（合同双方或 admin） |
| **成功响应 (200)** | `{ contract }` — 已 populate tenant/landlord/house |
| **错误响应 (403)** | `{ message: "无权查看此合同" }` |
| **前端调用** | 暂无前端调用 |
| **测试优先级** | 🟢 P2 |

---

## 5. 财务模块 (Finance) — `routes/finance.js`

### 5.1 `GET /api/finance` — 财务记录列表
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `landlord` 角色 |
| **查询参数** | `month` (YYYY-MM), `houseId` |
| **成功响应 (200)** | `[{ record }]` — 直接返回数组，已 populate houseId, contractId |
| **前端调用** | `FinanceManage.vue` |
| **测试优先级** | 🟡 P1 |

### 5.2 `POST /api/finance` — 添加财务记录
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `landlord` 角色 |
| **请求体** | `{ houseId, contractId, amount, month }` |
| **验证规则** | `houseId`, `contractId`, `amount`, `month` 全部必填；房源必须属于该房东 |
| **成功响应 (201)** | `{ record }` |
| **前端调用** | `FinanceManage.vue` |
| **测试优先级** | 🟡 P1 |

---

## 6. 评价模块 (Reviews) — `routes/reviews.js`

### 6.1 `GET /api/reviews/house/:houseId` — 获取房源评价
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | 无（公开查看） |
| **URL 参数** | `houseId` — ⚠️ 参数名为 `:houseId`，非 `:id` |
| **成功响应 (200)** | `{ reviews: [...], averageScore: number, total: number }` — 含平均分统计，已 populate tenant |
| **前端调用** | `HouseDetail.vue` — 调用 `/reviews/house/${id}` |
| **测试优先级** | 🟡 P1 |

### 6.2 `GET /api/reviews/my` — 租客自己的评价列表
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `tenant` 角色 |
| **成功响应 (200)** | `[{ review }]` — 已 populate houseId |
| **前端调用** | `MyReviews.vue` |
| **测试优先级** | 🟢 P2 |

### 6.3 `POST /api/reviews` — 创建评价
**状态**: ✅ 已实现（⚠️ 后端字段名为 `score`，前端发送 `rating`）

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `tenant` 角色 |
| **请求体** | `{ houseId, score: 1-5, content? }` |
| **验证规则** | `houseId`, `score` 必填；`score` 1-5；同一租客对同一房源不能重复评价 |
| **成功响应 (201)** | `{ review }` |
| **前端调用** | `MyReviews.vue` — ⚠️ 前端发送 `{ houseId, rating, content }`，后端期望 `score` 而非 `rating` |
| **测试优先级** | 🟢 P2 |
| **⚠️ 修复建议** | 前端改 `rating` → `score`，或后端接收时做 `rating \|\| score` 兼容 |

### 6.4 `PUT /api/reviews/:id/hide` — 切换评价可见性
**状态**: ✅ 已实现（📝 文档未记录）

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `admin` 角色 |
| **业务逻辑** | 切换 `visible` 布尔值 + 写入 OperationLog |
| **成功响应 (200)** | `{ review }` |
| **前端调用** | 暂无前端调用 |
| **测试优先级** | 🟢 P2 |

---

## 7. 管理模块 (Admin) — `routes/admin.js`

### 7.1 `GET /api/admin/users` — 用户列表
**状态**: ✅ 已实现（⚠️ 前端调用 `GET /users`，缺少 `/admin` 前缀）

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `admin` 角色 |
| **查询参数** | `search` (搜索姓名/手机号), `role` (筛选角色) |
| **成功响应 (200)** | `[{ user }]` — 直接返回数组 |
| **前端调用** | `UserManage.vue`, `ContractManage.vue` — ⚠️ 调用 `/users`，非 `/admin/users` |
| **测试优先级** | 🟡 P1 |
| **⚠️ 修复建议** | 前端改为 `/admin/users`，或在 server.js 中添加 `/api/users` → `/api/admin/users` 别名 |

### 7.2 `PUT /api/admin/users/:id/status` — 启用/禁用用户
**状态**: ✅ 已实现（⚠️ 前端调用 `PUT /users/:id/toggle`，路径和端点名均不同）

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `admin` 角色 |
| **请求体** | `{ status: 'active' \| 'disabled' }` |
| **业务逻辑** | 修改用户状态 + 写入 OperationLog |
| **成功响应 (200)** | `{ user }` |
| **前端调用** | `UserManage.vue` — ⚠️ 调用 `PUT /users/:id/toggle`，发送 `{ active: boolean }` |
| **测试优先级** | 🟡 P1 |
| **⚠️ 修复建议** | 前端改为 `PUT /admin/users/:id/status` + `{ status: 'active' \| 'disabled' }` |

### 7.3 `GET /api/admin/stats` — 管理后台统计
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `admin` 角色 |
| **成功响应 (200)** | `{ userCount: { tenant: n, landlord: n, admin: n }, houseCount: { pending: n, approved: n, ... }, appointmentCount: n, contractCount: n, popularAreas: [{ _id, count }], rentRanges: { min, max, avg } }` |
| **前端调用** | `DataStats.vue` |
| **测试优先级** | 🟢 P2 |

### 7.4 `GET /api/admin/settings` — 获取系统设置
**状态**: ✅ 已实现（⚠️ 前端调用 `GET /settings`，缺少 `/admin` 前缀）

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `admin` 角色 |
| **成功响应 (200)** | `{ key1: value1, key2: value2, ... }` — Setting 表中所有 key-value 对展平为一个对象 |
| **前端调用** | `SystemSettings.vue` — ⚠️ 调用 `/settings`，非 `/admin/settings` |
| **测试优先级** | 🟢 P2 |
| **⚠️ 修复建议** | 前端改为 `/admin/settings` |

### 7.5 `PUT /api/admin/settings` — 更新系统设置
**状态**: ✅ 已实现（⚠️ 前端调用 `PUT /settings`，缺少 `/admin` 前缀）

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `admin` 角色 |
| **请求体** | `{ key1: value1, ... }` — 键值对，逐个 upsert |
| **成功响应 (200)** | `{ key1: value1, ... }` — 更新后的完整设置 + 写入 OperationLog |
| **前端调用** | `SystemSettings.vue` — ⚠️ 调用 `PUT /settings`，非 `/admin/settings` |
| **测试优先级** | 🟢 P2 |
| **⚠️ 修复建议** | 前端改为 `/admin/settings` |

---

## 8. 其他端点

### 8.1 `GET /api/health` — 健康检查
**状态**: ✅ 已实现（📝 文档未记录）

| 项目 | 详情 |
|------|------|
| **认证** | 无 |
| **成功响应 (200)** | `{ status: "ok", time: "ISO timestamp" }` |

---

## 认证与权限矩阵

| API 端点 | 公开 | tenant | landlord | admin |
|----------|:----:|:------:|:--------:|:-----:|
| `POST /auth/register` | ✅ | — | — | — |
| `POST /auth/login` | ✅ | — | — | — |
| `GET /auth/me` | — | ✅ | ✅ | ✅ |
| `PUT /auth/profile` | — | ✅ | ✅ | ✅ |
| `GET /houses` | ✅ | ✅ | ✅ | ✅ |
| `GET /houses/all` | — | — | — | ✅ |
| `GET /houses/my` | — | — | ✅ | — |
| `GET /houses/pending` | — | — | — | ✅ |
| `GET /houses/:id` | ✅ | ✅ | ✅ | ✅ |
| `POST /houses` | — | — | ✅ | — |
| `PUT /houses/:id` | — | — | ✅ (own) | — |
| `DELETE /houses/:id` | — | — | ✅ (own) | — |
| `PUT /houses/:id/review` | — | — | — | ✅ |
| `PUT /houses/:id/status` | — | — | ✅ (own) | — |
| `GET /appointments` | — | ✅ (own) | ✅ (own) | ✅ (all) |
| `POST /appointments` | — | ✅ | — | — |
| `PUT /appointments/:id/cancel` | — | ✅ (own) | — | — |
| `PUT /appointments/:id/confirm` | — | — | ✅ (own) | — |
| `PUT /appointments/:id/reject` | — | — | ✅ (own) | — |
| `GET /contracts` | — | ✅ (own) | ✅ (own) | ✅ (all) |
| `GET /contracts/:id` | — | ✅ (own) | ✅ (own) | ✅ |
| `POST /contracts` | — | — | ✅ | — |
| `PUT /contracts/:id/sign` | — | ✅ (own) | ✅ (own) | — |
| `PUT /contracts/:id/terminate` | — | ✅ (own) | ✅ (own) | — |
| `GET /finance` | — | — | ✅ | — |
| `POST /finance` | — | — | ✅ | — |
| `GET /reviews/house/:houseId` | ✅ | ✅ | ✅ | ✅ |
| `GET /reviews/my` | — | ✅ | — | — |
| `POST /reviews` | — | ✅ | — | — |
| `PUT /reviews/:id/hide` | — | — | — | ✅ |
| `GET /admin/users` | — | — | — | ✅ |
| `PUT /admin/users/:id/status` | — | — | — | ✅ |
| `GET /admin/stats` | — | — | — | ✅ |
| `GET /admin/settings` | — | — | — | ✅ |
| `PUT /admin/settings` | — | — | — | ✅ |
| `GET /health` | ✅ | ✅ | ✅ | ✅ |

---

## 🔧 修复优先级建议

### 阻塞级（前后端不通，必须立即修复）

| # | 问题 | 修复方案 | 涉及文件 |
|---|------|---------|---------|
| 1 | 前端调用 `/users`，后端是 `/admin/users` | 前端改为 `/admin/users` | `UserManage.vue`, `ContractManage.vue` |
| 2 | 前端调用 `/users/:id/toggle` + `{ active }`，后端是 `/admin/users/:id/status` + `{ status }` | 前端对齐后端 | `UserManage.vue` |
| 3 | 前端调用 `/settings`，后端是 `/admin/settings` | 前端改为 `/admin/settings` | `SystemSettings.vue` |
| 4 | 前端调用 `/appointments/my`，后端是 `/appointments` | 前端改为 `/appointments`（角色自动区分） | `MyAppointments.vue` |
| 5 | 前端调用 `/appointments/manage`，后端是 `/appointments` | 前端改为 `/appointments` | `AppointmentManage.vue` |
| 6 | 前端调用 `/contracts/my`，后端是 `/contracts` | 前端改为 `/contracts` | `MyContracts.vue` |
| 7 | 前端调用 `/contracts/manage`，后端是 `/contracts` | 前端改为 `/contracts` | `ContractManage.vue` |

### 重要级（字段名不一致）

| # | 问题 | 修复方案 | 涉及文件 |
|---|------|---------|---------|
| 8 | 前端发送 `rating`，后端期望 `score` | 前端改为 `score` | `MyReviews.vue` |

---

## 测试实施建议

### 优先级分类
| 级别 | 说明 | 端点数量 |
|------|------|----------|
| 🔴 **P0** | 核心业务流程，必须最先实现和测试 | 13 个 |
| 🟡 **P1** | 重要功能，第二轮实现 | 14 个 |
| 🟢 **P2** | 辅助功能，第三轮实现 | 10 个 |

### 测试场景覆盖（每个端点）

**正向测试 (Happy Path)**:
- 有效输入 → 预期成功响应 + 数据库状态正确

**边界测试 (Edge Cases)**:
- 必填字段缺失 → 400
- 无效的 ObjectId → 400/404
- 超出范围的值 (如 score < 1 或 > 5) → 400
- 重复数据 (如重复预约、重复评价) → 400

**权限测试 (Authorization)**:
- 未登录访问受保护端点 → 401
- 角色越权访问 → 403 (如 tenant 试图审核房源)
- 跨用户操作 → 403 (如 landlord A 编辑 landlord B 的房源)

**状态机测试 (State Transitions)**:
- 预约: `pending` → `confirmed` / `rejected` / `cancelled`，非法转换拒绝
- 合同: `draft` → `pending_sign` → `signed` / `terminated`，`signedByTenant` + `signedByLandlord` 双方签署逻辑
- 房源: `pending` → `approved` / `rejected` / `offline`，`offline` → `approved`
- 用户: `active` ↔ `disabled`

### 建议测试框架
```bash
# 推荐技术栈
- 测试框架: Jest / Mocha + Chai
- HTTP 断言: supertest
- 数据库: mongodb-memory-server (内存 MongoDB)
- 覆盖率目标: ≥ 80%
```

---

## 数据模型参考（与代码实际一致）

### User
```
{ name, phone?, email?, passwordHash, role: 'tenant'|'landlord'|'admin', status: 'active'|'disabled', createdAt, updatedAt }
```

### House
```
{ landlordId (ref User), title, area, address, rent, deposit, type, size, floor, facilities[], description, images[], status: 'pending'|'approved'|'rejected'|'offline', rejectReason, createdAt, updatedAt }
```

### Appointment
```
{ tenantId (ref User), landlordId (ref User), houseId (ref House), visitDate, visitTime, contact, remark, status: 'pending'|'confirmed'|'rejected'|'cancelled', rejectReason, createdAt, updatedAt }
```

### Contract
```
{ tenantId (ref User), landlordId (ref User), houseId (ref House), startDate, endDate, rent, deposit, status: 'draft'|'pending_sign'|'signed'|'terminated', signedByTenant, signedByLandlord, createdAt, updatedAt }
```

### FinanceRecord
```
{ landlordId (ref User), houseId (ref House), contractId (ref Contract), amount, month, status: 'paid'|'pending', createdAt, updatedAt }
```

### Review
```
{ tenantId (ref User), houseId (ref House), landlordId (ref User), score: 1-5, content, visible, createdAt, updatedAt }
```

### OperationLog
```
{ operatorId (ref User), action, targetType, targetId, detail, createdAt }
```

### Setting
```
{ key (unique), value (Mixed), updatedBy (ref User), createdAt, updatedAt }
```
