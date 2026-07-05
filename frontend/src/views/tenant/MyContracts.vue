<template>
  <div>
    <div class="card-header">
      <h2>我的合同</h2>
    </div>

    <el-table :data="contracts" v-loading="loading" stripe style="width:100%">
      <el-table-column prop="house?.title || '--'" label="房源" min-width="160" />
      <el-table-column label="开始日期" width="110">
        <template #default="{ row }">{{ formatDate(row.startDate) }}</template>
      </el-table-column>
      <el-table-column label="结束日期" width="110">
        <template #default="{ row }">{{ formatDate(row.endDate) }}</template>
      </el-table-column>
      <el-table-column label="租金" width="110">
        <template #default="{ row }">
          <span class="price-text">¥{{ row.rent }}</span>
        </template>
      </el-table-column>
      <el-table-column label="押金" width="110">
        <template #default="{ row }">
          <span class="price-text">¥{{ row.deposit ?? '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag class="status-tag" :type="statusType(row.status)" size="small">
            {{ statusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="row.status === 'pending_sign'"
            type="primary"
            size="small"
            @click="signContract(row._id)"
          >签署合同</el-button>
          <span v-else-if="row.status === 'signed'" class="muted-text">已签署</span>
          <span v-else class="muted-text">-</span>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!loading && contracts.length === 0" description="暂无合同记录" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../../utils/request'

const contracts = ref([])
const loading = ref(false)

function statusType(s) {
  return { draft: 'info', pending_sign: 'warning', signed: 'success', terminated: 'danger' }[s] || 'info'
}

function statusText(s) {
  return { draft: '草稿', pending_sign: '待签署', signed: '已签署', terminated: '已终止' }[s] || s
}

function formatDate(dateStr) {
  if (!dateStr) return '--'
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function loadContracts() {
  loading.value = true
  try {
    const res = await request.get('/contracts/my')
    contracts.value = res.contracts || res.data || []
  } catch {
    contracts.value = []
  } finally {
    loading.value = false
  }
}

async function signContract(id) {
  try {
    await ElMessageBox.confirm('确认签署该合同？', '提示')
    await request.put(`/contracts/${id}/sign`)
    ElMessage.success('合同签署成功')
    loadContracts()
  } catch { /* cancelled */ }
}

onMounted(loadContracts)
</script>
