<template>
  <div class="box">
    <div class="content">
      <div class="register-wrapper">
        <h1>注册</h1>
        <div class="register-form">
          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            @submit.prevent="handleRegister"
          >
            <div class="form-row">
              <div class="form-item form-item-half">
                <span>姓名</span>
                <el-input v-model="form.name" placeholder="请输入姓名" class="input-item" />
              </div>
              <div class="form-item form-item-half">
                <span>角色</span>
                <el-radio-group v-model="form.role" class="role-radio-group">
                  <el-radio-button value="tenant">租户</el-radio-button>
                  <el-radio-button value="landlord">房东</el-radio-button>
                </el-radio-group>
              </div>
            </div>
            <div class="form-item">
              <span>手机号</span>
              <el-input v-model="form.phone" placeholder="请输入手机号" class="input-item" />
            </div>
            <div class="form-item">
              <span>邮箱</span>
              <el-input v-model="form.email" placeholder="请输入邮箱" class="input-item" />
            </div>
            <div class="form-row">
              <div class="form-item form-item-half">
                <span>密码</span>
                <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" class="input-item" />
              </div>
              <div class="form-item form-item-half">
                <span>确认密码</span>
                <el-input v-model="form.confirmPassword" type="password" show-password placeholder="请确认密码" class="input-item" />
              </div>
            </div>
            <el-button type="primary" native-type="submit" :loading="loading" class="register-btn">注 册</el-button>
          </el-form>
        </div>
        <div class="form-footer">
          已有账号？<router-link to="/login">立即登录</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  name: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'tenant'
})

const validateConfirm = (rule, value, callback) => {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' }
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

async function handleRegister() {
  const valid = await formRef.value.validate().catch(() => {})
  if (!valid) return
  loading.value = true
  try {
    await auth.register({
      name: form.name,
      phone: form.phone,
      email: form.email,
      password: form.password,
      role: form.role
    })
    ElMessage.success('注册成功')
    const target = { tenant: '/tenant/appointments', landlord: '/landlord/houses' }
    router.push(target[form.role] || '/')
  } catch {
    // error handled by interceptor
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
  background-color: rgb(29, 67, 89);
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

  .register-wrapper {
    width: 28vw;
    min-width: 320px;
    max-width: 380px;
    position: absolute;
    right: 12%;
    top: 50%;
    transform: translateY(-50%);
  }

  .register-wrapper h1 {
    text-align: center;
    font-size: 40px;
    color: rgb(81, 100, 115);
    margin-bottom: 28px;
    font-weight: 700;
  }

  .register-form {
    margin: 10px 0;
  }

  .form-row {
    display: flex;
    gap: 12px;
  }

  .form-item-half {
    flex: 1;
  }

  .form-item {
    margin: 14px 0;
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
    height: 48px;
    padding: 0 18px;
    border: 1px solid rgb(214, 222, 228);
    box-shadow: none;
    font-size: 16px;
  }

  :deep(.input-item .el-input__wrapper:hover) {
    border-color: rgb(29, 67, 89);
  }

  :deep(.input-item .el-input__wrapper.is-focus) {
    border-color: rgb(29, 67, 89);
    box-shadow: 0 0 0 1px rgb(29, 67, 89);
  }

  :deep(.input-item .el-input__inner) {
    height: 46px;
    font-size: 15px;
  }

  .role-radio-group {
    width: 100%;
    display: flex;
  }

  :deep(.role-radio-group .el-radio-button) {
    flex: 1;
  }

  :deep(.role-radio-group .el-radio-button__inner) {
    border-radius: 40px !important;
    border: 1px solid rgb(214, 222, 228);
    padding: 8px 20px;
    font-size: 14px;
    color: rgb(81, 100, 115);
    box-shadow: none !important;
  }

  :deep(.role-radio-group .el-radio-button.is-active .el-radio-button__inner) {
    background-color: rgb(59, 72, 89);
    border-color: rgb(59, 72, 89);
    color: #fff;
  }

  .register-btn {
    width: 100%;
    height: 48px;
    border-radius: 40px;
    background-color: rgb(59, 72, 89);
    border-color: rgb(59, 72, 89);
    color: #fff;
    font-size: 18px;
    font-weight: 500;
    letter-spacing: 4px;
    margin-top: 10px;
    border: 0;
    cursor: pointer;
  }

  .register-btn:hover {
    background-color: rgb(45, 58, 75);
    border-color: rgb(45, 58, 75);
  }

  .form-footer {
    text-align: center;
    font-size: 14px;
    color: #9ca3a3;
    margin-top: 20px;
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

  .register-wrapper {
    width: 80%;
    max-height: 85vh;
    overflow-y: auto;
    padding-top: 10%;
  }

  .register-wrapper h1 {
    text-align: center;
    font-size: 30px;
    color: #fff;
    margin-bottom: 20px;
  }

  .form-row {
    display: flex;
    gap: 10px;
  }

  .form-item-half {
    flex: 1;
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

  .role-radio-group {
    width: 100%;
    display: flex;
  }

  :deep(.role-radio-group .el-radio-button) {
    flex: 1;
  }

  :deep(.role-radio-group .el-radio-button__inner) {
    border-radius: 40px !important;
    border: 1px solid rgb(113, 129, 141);
    padding: 6px 16px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
    background: transparent;
    box-shadow: none !important;
  }

  :deep(.role-radio-group .el-radio-button.is-active .el-radio-button__inner) {
    background-color: rgb(235, 95, 93);
    border-color: rgb(235, 95, 93);
    color: #fff;
  }

  .register-btn {
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

  .form-footer {
    text-align: center;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 16px;
  }

  .form-footer a {
    color: #fff;
    font-weight: 500;
    text-decoration: none;
  }
}
</style>
