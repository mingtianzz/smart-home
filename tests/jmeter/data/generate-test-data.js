/**
 * JMeter 性能测试数据生成器
 * 为 Auth 模块的 Register / Login 场景生成参数化 CSV 文件
 *
 * 用法: node tests/jmeter/data/generate-test-data.js [count]
 * 默认: 2000 条（覆盖 500-1000 并发 + 余量）
 */

const fs = require('fs');
const path = require('path');

const COUNT = parseInt(process.argv[2], 10) || 2000;
const OUT_DIR = __dirname;

// ── 1. Register 用户数据 ──────────────────────────────────
const registerHeader = 'phone,email,password,name,role';
const registerRows = [registerHeader];

for (let i = 1; i <= COUNT; i++) {
  const n = String(i).padStart(5, '0');
  const phone = `139${String(i).padStart(8, '0')}`;
  const email = `perfuser${n}@test.com`;
  const password = 'pass123456';
  const name = `性能用户${n}`;
  const role = i % 3 === 0 ? 'landlord' : 'tenant'; // 约 2:1 比例
  registerRows.push(`${phone},${email},${password},${name},${role}`);
}

fs.writeFileSync(path.join(OUT_DIR, 'register-users.csv'), registerRows.join('\n'), 'utf8');
console.log(`✅ register-users.csv — ${COUNT} 行`);

// ── 2. Login 用户数据（需与 register 中的一致）───────────
const loginHeader = 'phone,password,role';
const loginRows = [loginHeader];

for (let i = 1; i <= COUNT; i++) {
  const phone = `139${String(i).padStart(8, '0')}`;
  const password = 'pass123456';
  const role = i % 3 === 0 ? 'landlord' : 'tenant';
  loginRows.push(`${phone},${password},${role}`);
}

fs.writeFileSync(path.join(OUT_DIR, 'login-users.csv'), loginRows.join('\n'), 'utf8');
console.log(`✅ login-users.csv — ${COUNT} 行`);

// ── 3. Admin 登录数据 (固定) ─────────────────────────────
const adminHeader = 'phone,password,role';
const adminRows = [adminHeader, '13800000000,admin123,admin'];
fs.writeFileSync(path.join(OUT_DIR, 'admin-login.csv'), adminRows.join('\n'), 'utf8');
console.log(`✅ admin-login.csv — 1 行`);

// ── 4. Profile 更新数据 ─────────────────────────────────
const profileHeader = 'newName,newPhone,newEmail';
const profileRows = [profileHeader];
for (let i = 1; i <= COUNT; i++) {
  const n = String(i).padStart(5, '0');
  profileRows.push(`更新用户${n},139${String(i + COUNT).padStart(8, '0')},updated${n}@test.com`);
}
fs.writeFileSync(path.join(OUT_DIR, 'profile-data.csv'), profileRows.join('\n'), 'utf8');
console.log(`✅ profile-data.csv — ${COUNT} 行`);

console.log(`\n📊 总计生成 ${COUNT * 3} 条测试数据 (3 个 CSV 文件)`);
