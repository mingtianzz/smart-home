<template>
  <div>
    <div class="card-header">
      <h3>用户管理</h3>
      <el-input v-model="search" placeholder="搜索姓名/手机号" style="width:240px" clearable @input="loadUsers" />
    </div>
    <el-table :data="users" v-loading="loading" stripe style="width:100%">
      <el-table-column prop="name" label="姓名" width="120" />
      <el-table-column prop="phone" label="手机号" width="140" />
      <el-table-column prop="email" label="邮箱" min-width="160" />
      <el-table-column label="角色" width="100">
        <template #default="{ row }">
          <el-tag :type="roleType(row.role)" size="small" class="status-tag">{{ roleText(row.role) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status !== 'disabled' ? 'success' : 'danger'" size="small" class="status-tag">
            {{ row.status !== 'disabled' ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="注册时间" width="160" prop="createdAt" />
      <el-table-column label="操作" width="80" fixed="right">
        <template #default="{ row }">
          <el-switch
            v-if="row.role !== 'admin'"
            :model-value="row.status !== 'disabled'"
            @change="toggleUser(row)"
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../../utils/request'

const users = ref([])
const loading = ref(false)
const search = ref('')

function roleType(r) {
  return { tenant: 'info', landlord: 'warning', admin: 'danger' }[r] || 'info'
}
function roleText(r) {
  return { tenant: '租户', landlord: '房东', admin: '管理员' }[r] || r
}

async function loadUsers() {
  loading.value = true
  try {
    const params = {}
    if (search.value) params.search = search.value
    const res = await request.get('/admin/users', { params })
    users.value = Array.isArray(res) ? res : (res.users || res.data || [])
  } catch {
    users.value = []
  } finally {
    loading.value = false
  }
}

async function toggleUser(row) {
  try {
    const newStatus = row.status === 'disabled' ? 'active' : 'disabled'
    await request.put(`/admin/users/${row._id || row.id}/status`, { status: newStatus })
    ElMessage.success(newStatus === 'active' ? '用户已启用' : '用户已禁用')
    loadUsers()
  } catch {}
}

onMounted(loadUsers)
</script>
