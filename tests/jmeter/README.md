# Auth 模块 JMeter 性能测试

## 目录结构

```
tests/jmeter/
├── auth-performance-test.jmx     ← JMeter 测试计划（主文件）
├── data/
│   ├── generate-test-data.js     ← 测试数据生成脚本
│   ├── register-users.csv        ← 注册参数化数据 (2000行)
│   ├── login-users.csv           ← 登录参数化数据 (2000行)
│   ├── admin-login.csv           ← 管理员登录 (1行)
│   └── profile-data.csv          ← 个人资料数据 (2000行)
├── results/
│   ├── jtl/                      ← JTL 原始结果
│   └── reports/                  ← HTML 报告输出
└── README.md                     ← 本文件
```

## 环境要求

| 工具 | 最低版本 | 说明 |
|------|:------:|------|
| JMeter | 5.6+ | 需安装 JSON Path Extractor 插件 (JMeter 5.6 已内置) |
| Node.js | 18+ | 仅用于生成 CSV 测试数据 |
| MongoDB | 7.x | 目标数据库需运行 |
| 后端服务 | — | `cd backend && node server.js` 启动 |

## 快速开始

### 1. 生成测试数据

```bash
cd tests/jmeter
node data/generate-test-data.js 2000
```

生成 3 个 CSV 文件共 6000 行测试数据。

### 2. 启动后端

```bash
cd backend
node server.js
# 或 npm run dev
```

### 3. 确保测试用户已存在于数据库

**重要**: Login 性能测试需要数据库中已有用户。运行以下命令先注册一批用户：

```bash
# 使用 Register-500并发 线程组先注册用户
# 或者用 curl 批量注册:
node data/generate-test-data.js 2000
# 数据生成后，在 JMeter 中先运行 Register 线程组
```

### 4. 运行 JMeter

**GUI 模式**（推荐调试）：

```bash
jmeter -t tests/jmeter/auth-performance-test.jmx
```

**命令行模式**（推荐正式测试，性能更好）：

```bash
# 创建结果目录
mkdir -p tests/jmeter/results/jtl tests/jmeter/results/reports

# 运行全部已启用的线程组
jmeter -n \
  -t tests/jmeter/auth-performance-test.jmx \
  -l tests/jmeter/results/jtl/result-$(date +%Y%m%d-%H%M%S).jtl \
  -e \
  -o tests/jmeter/results/reports/report-$(date +%Y%m%d-%H%M%S)

# 仅运行单个线程组 (通过 -J 覆盖线程数)
jmeter -n \
  -t tests/jmeter/auth-performance-test.jmx \
  -Jthreads=500 -Jrampup=60 \
  -l results/jtl/register-500.jtl
```

## 测试场景总览

| # | 线程组 | 并发 | 加压时间 | 循环 | 默认状态 |
|---|--------|:---:|:------:|:---:|:------:|
| 01 | Register | **500** | 60s | 1 | ✅ 启用 |
| 02 | Register | **1000** | 120s | 1 | ✅ 启用 |
| 03 | Login | **500** | 60s | 1 | ✅ 启用 |
| 04 | Login | **1000** | 120s | 1 | ✅ 启用 |
| 05 | Register 阶梯加压 | 100→1000 | 300s | 1 | ⬜ 禁用 |
| 06 | Login 阶梯加压 | 100→1000 | 300s | 1 | ⬜ 禁用 |
| 07 | Mixed (Login→Me→Profile) | **500** | 60s | 3 | ✅ 启用 |
| 08 | Mixed (Login→Me→Profile) | **1000** | 120s | 3 | ✅ 启用 |

### 场景说明

**场景 01-02: Register 压力测试**
- 每个线程从 CSV 取一条唯一数据，执行 POST /register
- 验证: 201 + 响应时间 < 5000ms
- ⚠️ 注意: 重复运行前需要清理 DB 中的用户或更换 phone/email

**场景 03-04: Login 压力测试**
- 每个线程从 CSV 取一条数据，执行 POST /login
- 验证: 200 + token 存在 + 响应时间 < 5000ms
- 前置: DB 中必须有对应的用户（先跑 Register 场景）

**场景 05-06: 阶梯加压**
- 6 分钟内从 100 逐步增加到 1000 并发
- 用于发现系统的吞吐量拐点
- 时间线: 第1分钟 200并发 → 第2分钟 400 → ... → 第5分钟 1000 → 第6分钟持续1000

**场景 07-08: 混合工作负载**
- 每个线程: Login(1次) → Me(3次) → Profile(3次)
- 500ms 高斯随机思考时间，模拟真实用户
- JSON Extractor 提取 login token，传递给后续请求
- 验证: 全部 200 + profile 响应 < 3000ms

### 线程组启用/禁用

在 JMeter GUI 中右键线程组 → Enable/Disable，或编辑 .jmx 中 ThreadGroup 的 `enabled` 属性。

## 性能验收指标

| 指标 | Register | Login | GET /me | PUT /profile |
|------|:------:|:-----:|:-------:|:------------:|
| **500并发** 平均响应时间 | < 2000ms | < 1500ms | < 500ms | < 1000ms |
| **500并发** P95 响应时间 | < 3000ms | < 2500ms | < 1000ms | < 2000ms |
| **500并发** 错误率 | < 1% | < 1% | < 0.5% | < 0.5% |
| **500并发** 吞吐量 (TPS) | > 200 | > 250 | > 500 | > 300 |
| **1000并发** 平均响应时间 | < 4000ms | < 3000ms | < 1000ms | < 2000ms |
| **1000并发** P95 响应时间 | < 6000ms | < 5000ms | < 2000ms | < 4000ms |
| **1000并发** 错误率 | < 2% | < 2% | < 1% | < 1% |
| **1000并发** 吞吐量 (TPS) | > 250 | > 300 | > 600 | > 350 |

## 结果分析

### JMeter HTML 报告

命令行运行时会自动生成 Dashboard 报告，关注：

- **APDEX** (Application Performance Index): 越接近 1.0 越好
- **Response Time Percentiles**: P90/P95/P99 在各并发等级下的表现
- **Transactions Per Second**: 系统吞吐能力
- **Error %**: 各接口错误率
- **Response Time Over Time**: 响应时间随时间变化趋势

### 关键调优方向

如果性能不达标，按以下优先级排查：

1. **MongoDB 连接池**: `mongoose.connect` 的 `maxPoolSize` 默认 100，1000并发可能需要调大
2. **bcrypt 耗时**: `bcrypt.hash(password, 10)` 的 saltRounds=10 每次约 50-100ms，是瓶颈。可降至 8 或使用异步 worker
3. **JWT 签名**: `jwt.sign` 每次约 1-2ms，影响较小
4. **Express 中间件栈**: 检查是否有多余中间件
5. **Node.js 单线程**: 配合 `cluster` 模块或 PM2 多进程部署

## 命令行参数覆盖

可通过 `-J` 参数在命令行覆盖线程配置：

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `-Jhost=192.168.1.100` | localhost | 目标主机 |
| `-Jport=3000` | 3000 | 目标端口 |
| `-Jthreads=500` | — | 覆盖线程数 |
| `-Jrampup=60` | — | 覆盖加压时间 |
| `-Jduration=300` | — | 覆盖持续时间 |

## 故障排查

| 问题 | 原因 | 解决 |
|------|------|------|
| Register 返回 400 "该账号已被注册" | CSV 数据之前用过 | 重新生成 CSV 或清理 DB |
| Login 返回 401 | DB 中没有对应用户 | 先运行 Register 场景 |
| JMeter 报 OutOfMemoryError | 堆内存不足 | `export HEAP="-Xms2g -Xmx4g"` |
| 连接被拒绝 | 后端未启动或端口不对 | 检查 `backend/server.js` 运行状态 |
| JSON Extractor 取不到 token | 登录返回非 200 | 检查 View Results Tree 确认响应内容 |
