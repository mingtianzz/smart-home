<template>
  <div class="box">
    <div class="content">
      <div class="login-wrapper">
        <h1>{{ pageTitle }}</h1>
        <div class="login-form">
          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            @submit.prevent="handleLogin"
          >
            <div class="form-item">
              <span>使用邮箱或者手机号</span>
              <el-input v-model="form.phone" placeholder="请输入手机号或邮箱" class="input-item" />
            </div>
            <div class="form-item">
              <span>密码</span>
              <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" class="input-item" />
            </div>
            <el-button type="primary" native-type="submit" :loading="loading" class="login-btn">{{ btnText }}</el-button>
          </el-form>
        </div>

        <!-- Show "other login" section only on the default login page -->
        <template v-if="!routeRole">
          <div class="divider">
            <span class="line"></span>
            <span class="divider-text">其他方式登录</span>
            <span class="line"></span>
          </div>
          <div class="other-login-wrapper">
            <div class="other-login-item" @click="goToRoleLogin('landlord')">
              <el-icon :size="28" color="#d4943a"><HomeFilled /></el-icon>
              <span class="other-label">房东</span>
            </div>
            <div class="other-login-item" @click="goToRoleLogin('admin')">
              <el-icon :size="28" color="#e74c3c"><Setting /></el-icon>
              <span class="other-label">管理员</span>
            </div>
          </div>
        </template>

        <!-- Back link on role-specific pages -->
        <div v-if="routeRole" class="form-footer">
          <router-link to="/login">返回普通登录</router-link>
        </div>
        <div v-else class="form-footer">
          还没有账号？<router-link to="/register">立即注册</router-link>
        </div>
      </div>
    </div>
    <!-- 错误大弹窗 -->
    <Teleport to="body">
      <Transition name="dialog-fade">
        <div v-if="errorVisible" class="error-overlay" @click.self="errorVisible = false">
          <div class="error-dialog">
            <div class="error-icon-wrap">
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="11" stroke="#e74c3c" stroke-width="2" />
                <path d="M12 7v6M12 16.5v.5" stroke="#e74c3c" stroke-width="2.5" stroke-linecap="round"/>
              </svg>
            </div>
            <h2 class="error-title">登录失败</h2>
            <p class="error-msg">{{ errorMsg }}</p>
            <button class="error-close-btn" @click="errorVisible = false">知道了</button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { HomeFilled, Setting } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const formRef = ref(null)
const loading = ref(false)
const errorVisible = ref(false)
const errorMsg = ref('账号或密码错误，请重试')

// Get role from route param (e.g. /login/landlord, /login/admin)
const roleMap = { landlord: '房东', admin: '管理员' }
const routeRole = computed(() => route.params.role)

const pageTitle = computed(() => {
  if (!routeRole.value) return '登录'
  return roleMap[routeRole.value] + '登录'
})

const btnText = computed(() => {
  if (!routeRole.value) return '登 录'
  return roleMap[routeRole.value] + '登录'
})

const defaultRole = computed(() => {
  return routeRole.value || 'tenant'
})

const form = reactive({
  phone: '',
  password: '',
  role: defaultRole.value
})

const rules = {
  phone: [{ required: true, message: '请输入手机号或邮箱', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

// Navigate to role-specific login page
function goToRoleLogin(role) {
  router.push(`/login/${role}`)
}

async function handleLogin() {
  const valid = await formRef.value.validate().catch(() => {})
  if (!valid) return
  form.role = defaultRole.value
  await doLogin()
}

async function doLogin() {
  loading.value = true
  try {
    await auth.login({
      phone: form.phone,
      email: form.phone,
      password: form.password,
      role: form.role
    })
    ElMessage.success('登录成功')
    const target = { tenant: '/tenant/appointments', landlord: '/landlord/houses', admin: '/admin/users' }
    router.push(target[form.role] || '/')
  } catch (err) {
    errorMsg.value = err?.response?.data?.message || '账号或密码错误，请重试'
    errorVisible.value = true
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.box {
  width: 100vw;
  height: 100vh;
  background-color: rgb(255, 255, 255);
  position: relative;
}

/* ── Desktop (≥768px) ── */
@media (min-width: 768px) {
  .content {
    width: 85vw;
    max-width: 1100px;
    height: 90vh;
    max-height: 700px;
    background: url('/login-bg.png') no-repeat;
    background-size: 90% 100%;
    background-color: #fff;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    border-radius: 20px;
  }

  .login-wrapper {
    width: 25vw;
    min-width: 280px;
    max-width: 340px;
    position: absolute;
    right: 15%;
    top: 50%;
    transform: translateY(-50%);
  }

  .login-wrapper h1 {
    text-align: center;
    font-size: 45px;
    color: rgb(81, 100, 115);
    margin-bottom: 40px;
    font-weight: 700;
  }

  .login-form {
    margin: 10px 0;
  }

  .form-item {
    margin: 20px 0;
  }

  .form-item span {
    display: block;
    margin: 5px 20px;
    font-weight: 500;
    color: rgb(81, 100, 115);
    font-size: 14px;
  }

  :deep(.input-item .el-input__wrapper) {
    width: 100%;
    border-radius: 40px;
    height: 60px;
    padding: 0 20px;
    border: 1px solid rgb(214, 222, 228);
    box-shadow: none;
    font-size: 20px;
    font-weight: 200;
  }

  :deep(.input-item .el-input__wrapper:hover) {
    border-color: rgb(29, 67, 89);
  }

  :deep(.input-item .el-input__wrapper.is-focus) {
    border-color: rgb(29, 67, 89);
    box-shadow: 0 0 0 1px rgb(29, 67, 89);
  }

  :deep(.input-item .el-input__inner) {
    height: 58px;
    font-size: 16px;
  }

  .login-btn {
    width: 100%;
    height: 50px;
    border-radius: 40px;
    background-color: rgb(59, 72, 89);
    border-color: rgb(59, 72, 89);
    color: #fff;
    font-size: 20px;
    font-weight: 500;
    letter-spacing: 4px;
    margin-top: 10px;
    border: 0;
    cursor: pointer;
  }

  .login-btn:hover {
    background-color: rgb(45, 58, 75);
    border-color: rgb(45, 58, 75);
  }

  .divider {
    width: 100%;
    margin: 20px 0;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .divider .line {
    flex: 1;
    max-width: 30%;
    border-bottom: 1px solid rgb(214, 222, 228);
  }

  .divider-text {
    vertical-align: middle;
    margin: 0px 20px;
    line-height: 0px;
    display: inline-block;
    width: 100px;
    font-size: 13px;
    color: #9ca3a3;
  }

  .other-login-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    margin-bottom: 24px;
  }

  .other-login-item {
    border: 1px solid rgb(214, 222, 228);
    padding: 10px;
    margin: 10px;
    border-radius: 20px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    background: #fff;
    transition: all 0.25s ease;
  }

  .other-login-item:hover {
    border-color: rgb(29, 67, 89);
    background: rgba(29, 67, 89, 0.04);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(29, 67, 89, 0.1);
  }

  .other-label {
    font-size: 12px;
    font-weight: 500;
    color: rgb(81, 100, 115);
  }

  .form-footer {
    text-align: center;
    font-size: 14px;
    color: #9ca3a3;
  }

  .form-footer a {
    color: rgb(29, 67, 89);
    font-weight: 500;
    text-decoration: none;
  }

  .form-footer a:hover {
    text-decoration: underline;
  }
}

/* ── Mobile (≤768px) ── */
@media (max-width: 768px) {
  .content {
    width: 100vw;
    height: 100vh;
    background: url('/login-bg-phone.png') no-repeat;
    background-size: 100% 100%;
    display: flex;
    align-items: flex-start;
    justify-content: center;
  }

  .login-wrapper {
    width: 70%;
    height: 60%;
    padding-top: 15%;
  }

  .login-wrapper h1 {
    text-align: center;
    font-size: 30px;
    color: #fff;
    margin-bottom: 40px;
  }

  .form-item {
    margin: 10px 0;
  }

  .form-item span {
    display: block;
    margin: 5px 20px;
    color: rgb(113, 129, 141);
    font-size: 14px;
  }

  :deep(.input-item .el-input__wrapper) {
    width: 100%;
    border-radius: 40px;
    height: 40px;
    padding: 0 16px;
    border: 1px solid rgb(113, 129, 141);
    background-color: transparent;
    color: #fff;
    box-shadow: none;
  }

  :deep(.input-item .el-input__inner) {
    color: #fff;
    background: transparent;
  }

  :deep(.input-item .el-input__inner::placeholder) {
    color: rgba(255, 255, 255, 0.5);
  }

  .login-btn {
    width: 100%;
    height: 40px;
    border-radius: 40px;
    background-color: rgb(235, 95, 93);
    color: #fff;
    font-size: 16px;
    font-weight: 500;
    letter-spacing: 4px;
    margin-top: 10px;
    border: 0;
    cursor: pointer;
  }

  .divider {
    width: 100%;
    margin: 20px 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .divider .line {
    flex: 1;
    border-bottom: 1px solid #fff;
  }

  .divider-text {
    margin: 0 16px;
    color: #fff;
    font-size: 13px;
  }

  .other-login-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    margin-bottom: 24px;
  }

  .other-login-item {
    border: 1px solid rgb(214, 222, 228);
    padding: 10px;
    margin: 10px;
    border-radius: 15px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    background: transparent;
  }

  .other-label {
    font-size: 12px;
    color: #fff;
  }

  .form-footer {
    text-align: center;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
  }

  .form-footer a {
    color: #fff;
    font-weight: 500;
    text-decoration: none;
  }
}

/* ── 错误大弹窗 ── */
.error-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.error-dialog {
  background: #fff;
  border-radius: 20px;
  padding: 48px 44px 36px;
  width: 420px;
  max-width: 90vw;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: dialogPopIn 0.35s cubic-bezier(0.22, 0.61, 0.36, 1);
}

@keyframes dialogPopIn {
  from {
    opacity: 0;
    transform: scale(0.85) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.error-icon-wrap {
  margin-bottom: 20px;
  animation: errorPulse 0.6s ease-in-out;
}

@keyframes errorPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

.error-title {
  margin: 0 0 14px;
  font-size: 24px;
  font-weight: 700;
  color: #1d4359;
}

.error-msg {
  margin: 0 0 32px;
  font-size: 16px;
  color: #7c8b95;
  line-height: 1.6;
}

.error-close-btn {
  width: 180px;
  height: 46px;
  border-radius: 40px;
  border: none;
  background: rgb(59, 72, 89);
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  letter-spacing: 2px;
  transition: background 0.2s;
}

.error-close-btn:hover {
  background: rgb(45, 58, 75);
}

/* 弹窗淡入淡出过渡 */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.25s ease;
}
.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}
</style>
