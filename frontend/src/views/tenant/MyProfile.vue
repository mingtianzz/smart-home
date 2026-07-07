<template>
  <div>
    <div class="card-header">
      <h2>个人信息</h2>
    </div>

    <div class="profile-card">
      <div class="profile-header">
        <el-avatar :size="80" :style="avatarStyle">{{ avatarText }}</el-avatar>
        <div class="user-basic">
          <h3>{{ profile.name }}</h3>
          <span class="role-tag">{{ roleText }}</span>
        </div>
      </div>

      <el-form :model="profile" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="profile.name" :disabled="!editable" placeholder="请输入姓名" />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="profile.phone" :disabled="!editable" placeholder="请输入手机号" />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="profile.email" :disabled="!editable" placeholder="请输入邮箱" />
        </el-form-item>

        <el-form-item label="性别">
          <el-select v-model="profile.gender" :disabled="!editable" placeholder="请选择性别" style="width:100%">
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>

        <el-form-item label="角色">
          <el-tag type="info" size="small">{{ roleText }}</el-tag>
        </el-form-item>

        <el-form-item label="注册时间">
          <span class="muted-text">{{ formatDate(profile.createdAt) }}</span>
        </el-form-item>

        <el-form-item>
          <el-button v-if="!editable" type="primary" @click="editable = true">编辑</el-button>
          <el-button v-if="editable" @click="cancelEdit">取消</el-button>
          <el-button v-if="editable" type="primary" @click="saveProfile">保存</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="profile-card" style="margin-top:24px;">
      <h3 class="card-title">修改密码</h3>
      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入原密码" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请确认新密码" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="changePassword">修改密码</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../../stores/auth'
import request from '../../utils/request'

const auth = useAuthStore()
const formRef = ref(null)
const passwordFormRef = ref(null)
const editable = ref(false)

const profile = ref({
  name: '',
  phone: '',
  email: '',
  gender: '',
  role: '',
  createdAt: ''
})

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }]
}

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }, { min: 6, message: '密码长度至少6位', trigger: 'blur' }],
  confirmPassword: [{ required: true, message: '请确认新密码', trigger: 'blur' }, { validator: validateConfirmPassword, trigger: 'blur' }]
}

function validateConfirmPassword(rule, value, callback) {
  if (value !== passwordForm.value.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const avatarText = computed(() => {
  return profile.value.name ? profile.value.name.charAt(0).toUpperCase() : 'U'
})

const avatarStyle = computed(() => ({
  backgroundColor: '#1d4359',
  color: '#fff',
  fontWeight: 600,
  fontSize: '24px'
}))

const roleText = computed(() => {
  const map = { tenant: '租户', landlord: '房东', admin: '管理员' }
  return map[profile.value.role] || profile.value.role
})

function formatDate(dateStr) {
  if (!dateStr) return '--'
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

async function loadProfile() {
  const localUser = auth.user || JSON.parse(localStorage.getItem('user') || '{}')
  profile.value = {
    name: localUser.name || '',
    phone: localUser.phone || '',
    email: localUser.email || '',
    gender: localUser.gender || '',
    role: localUser.role || '',
    createdAt: localUser.createdAt || ''
  }
  try {
    const res = await request.get('/auth/me')
    const user = res.user || res.data?.user || res
    if (user.name) profile.value.name = user.name
    if (user.phone) profile.value.phone = user.phone
    if (user.email) profile.value.email = user.email
    if (user.gender !== undefined) profile.value.gender = user.gender
    if (user.role) profile.value.role = user.role
    if (user.createdAt) profile.value.createdAt = user.createdAt
  } catch {
    ElMessage.info('使用本地缓存的用户信息')
  }
}

function cancelEdit() {
  editable.value = false
  loadProfile()
}

async function saveProfile() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      const res = await request.put('/auth/profile', {
        name: profile.value.name,
        phone: profile.value.phone,
        email: profile.value.email,
        gender: profile.value.gender
      })
      ElMessage.success(res.message || '保存成功')
      if (res.user) {
        auth.saveAuth(res.user, localStorage.getItem('token'))
      }
      editable.value = false
    } catch (err) {
      ElMessage.error(err.response?.data?.message || '保存失败')
    }
  })
}

async function changePassword() {
  if (!passwordFormRef.value) return
  await passwordFormRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      await request.put('/auth/password', passwordForm.value)
      ElMessage.success('密码修改成功')
      passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
    } catch (err) {
      ElMessage.error(err.response?.data?.message || '密码修改失败')
    }
  })
}

onMounted(loadProfile)
</script>

<style scoped>
.profile-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 20px;
}

.user-basic h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1a1d1d;
  margin: 0 0 8px 0;
}

.role-tag {
  display: inline-block;
  font-size: 12px;
  color: #1d4359;
  background: #e2f3f3;
  padding: 4px 12px;
  border-radius: 4px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1d1d;
  margin: 0 0 20px 0;
}

.muted-text {
  color: #9ca3a3;
  font-size: 14px;
}
</style>