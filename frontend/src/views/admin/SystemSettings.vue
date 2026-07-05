<template>
  <div>
    <h3 class="page-heading">系统设置</h3>

    <el-card shadow="never" class="settings-card" style="margin-top:24px">
      <el-form label-width="140px" v-loading="loading">
        <el-form-item label="房屋类型">
          <el-select v-model="settings.houseTypes" multiple filterable allow-create default-first-option style="width:400px" placeholder="输入后回车添加">
            <el-option v-for="t in defaultHouseTypes" :key="t" :label="t" :value="t" />
          </el-select>
          <div class="form-item-tip">输入房屋类型名称后按回车添加</div>
        </el-form-item>

        <el-form-item label="支付方式">
          <el-select v-model="settings.paymentMethods" multiple filterable allow-create default-first-option style="width:400px" placeholder="输入后回车添加">
            <el-option v-for="p in defaultPaymentMethods" :key="p" :label="p" :value="p" />
          </el-select>
          <div class="form-item-tip">输入支付方式名称后按回车添加</div>
        </el-form-item>

        <el-form-item label="审核功能">
          <el-switch v-model="settings.auditEnabled" />
          <span style="margin-left:12px;font-size:13px;color:#6b7272">
            {{ settings.auditEnabled ? '开启后房源发布需管理员审核' : '关闭后房源发布无需审核' }}
          </span>
        </el-form-item>

        <el-divider />

        <el-form-item>
          <el-button type="primary" @click="saveSettings" :loading="saveLoading">保存设置</el-button>
          <span v-if="lastUpdated" class="last-updated">
            上次更新：{{ lastUpdated }}
          </span>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../../utils/request'

const loading = ref(false)
const saveLoading = ref(false)
const lastUpdated = ref('')
const defaultHouseTypes = ['整租', '合租', '单间', '公寓']
const defaultPaymentMethods = ['支付宝', '微信支付', '银行转账']

const settings = reactive({
  houseTypes: [],
  paymentMethods: [],
  auditEnabled: true
})

async function loadSettings() {
  loading.value = true
  try {
    const res = await request.get('/admin/settings')
    const s = res.settings || res.data || res
    settings.houseTypes = Array.isArray(s.houseTypes) ? s.houseTypes : [...defaultHouseTypes]
    settings.paymentMethods = Array.isArray(s.paymentMethods) ? s.paymentMethods : [...defaultPaymentMethods]
    settings.auditEnabled = s.auditEnabled !== undefined ? s.auditEnabled : true
    if (s.updatedAt) {
      lastUpdated.value = formatTime(s.updatedAt)
    }
  } catch {
    // use defaults
  } finally {
    loading.value = false
  }
}

function formatTime(t) {
  const d = new Date(t)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function saveSettings() {
  saveLoading.value = true
  try {
    const res = await request.put('/admin/settings', { ...settings })
    ElMessage.success('设置保存成功')
    if (res?.updatedAt) {
      lastUpdated.value = formatTime(res.updatedAt)
    } else {
      lastUpdated.value = formatTime(new Date())
    }
  } catch {
    // handled
  } finally {
    saveLoading.value = false
  }
}

onMounted(loadSettings)
</script>

<style scoped>
.page-heading {
  font-size: 20px;
  font-weight: 600;
  color: #1a1d1d;
}

.settings-card {
  max-width: 680px;
  border-radius: 12px;
  border: 1px solid #eef0f0;
}

.settings-card :deep(.el-card__body) {
  padding: 28px 32px;
}

.form-item-tip {
  font-size: 12px;
  color: #9ea5a5;
  margin-top: 4px;
  line-height: 1.4;
}

.last-updated {
  margin-left: 16px;
  font-size: 13px;
  color: #9ea5a5;
}
</style>
