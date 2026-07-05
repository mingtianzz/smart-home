<template>
  <div>
    <div class="card-header">
      <h3>房源管理</h3>
      <el-button type="primary" size="large" @click="$router.push('/landlord/houses/new')" class="add-btn">
        <span class="add-btn-icon">+</span> 新增房源
      </el-button>
    </div>

    <!-- 统计概览 -->
    <el-row :gutter="22" class="stats-row">
      <el-col :span="6">
        <div class="mini-stat stat-all">
          <span class="mini-value">{{ houses.length }}</span>
          <span class="mini-label">全部房源</span>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="mini-stat stat-approved">
          <span class="mini-value">{{ statusCounts.approved }}</span>
          <span class="mini-label">已上架</span>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="mini-stat stat-pending">
          <span class="mini-value">{{ statusCounts.pending }}</span>
          <span class="mini-label">待审核</span>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="mini-stat stat-other">
          <span class="mini-value">{{ statusCounts.offline + statusCounts.rejected }}</span>
          <span class="mini-label">下架/驳回</span>
        </div>
      </el-col>
    </el-row>

    <el-table :data="houses" v-loading="loading" stripe class="house-table">
      <el-table-column label="封面" width="80">
        <template #default="{ row }">
          <div class="table-thumb" v-if="row.images && row.images[0]">
            <img :src="row.images[0]" class="thumb-img" />
          </div>
          <div class="table-thumb-placeholder" v-else>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b6e4e4" stroke-width="1.5"><path d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9.5Z"/></svg>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
      <el-table-column label="面积" width="85" align="center">
        <template #default="{ row }"><span class="cell-highlight">{{ row.size || row.area }}㎡</span></template>
      </el-table-column>
      <el-table-column label="租金" width="120" align="right">
        <template #default="{ row }">
          <span class="cell-price">¥{{ Number(row.rent).toLocaleString() }}</span>
          <span class="cell-unit">/月</span>
        </template>
      </el-table-column>
      <el-table-column label="区域" width="100">
        <template #default="{ row }">{{ row.area || '—' }}</template>
      </el-table-column>
      <el-table-column label="类型" width="80" align="center">
        <template #default="{ row }">{{ row.type || row.houseType || '—' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small" class="status-tag" effect="dark">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="$router.push(`/landlord/houses/${row._id || row.id}/edit`)" class="action-btn">
            编辑
          </el-button>
          <el-button
            v-if="row.status === 'approved'"
            size="small"
            type="warning"
            class="action-btn"
            @click="toggleStatus(row._id || row.id, 'offline')"
          >下架</el-button>
          <el-button
            v-if="row.status === 'offline' || row.status === 'rejected'"
            size="small"
            type="success"
            class="action-btn"
            @click="toggleStatus(row._id || row.id, 'approved')"
          >上架</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="!loading && houses.length === 0" class="empty-card">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#b6e4e4" stroke-width="1.0">
        <path d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9.5Z"/>
        <path d="M9 21V13H15V21" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <p>暂无房源</p>
      <span class="empty-hint">点击「新增房源」发布您的第一套房源吧</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../../utils/request'
import { SAMPLE_HOUSES } from '../../data/sampleHouses.js'

const houses = ref([])
const loading = ref(false)

const statusType = (s) => {
  return { pending: 'warning', approved: 'success', rejected: 'danger', rented: 'info', offline: 'info' }[s] || 'info'
}
const statusText = (s) => {
  return { pending: '待审核', approved: '已上架', rejected: '未通过', rented: '已租出', offline: '已下架' }[s] || s
}

const statusCounts = computed(() => {
  const counts = { approved: 0, pending: 0, rejected: 0, offline: 0, rented: 0 }
  houses.value.forEach(h => { if (counts[h.status] !== undefined) counts[h.status]++ })
  return counts
})

async function loadHouses() {
  loading.value = true
  try {
    const res = await request.get('/houses/my')
    const backend = res.houses || res.data || []
    if (backend.length > 0) {
      houses.value = backend
    } else {
      // 后端无数据时使用样例
      houses.value = SAMPLE_HOUSES.slice(0, 6).map((h, i) => ({
        ...h,
        _id: 'my-sample-' + i,
        id: 'my-sample-' + i,
        status: i < 3 ? 'approved' : i < 5 ? 'pending' : 'offline'
      }))
    }
  } catch {
    // 后端连接失败，使用样例
    houses.value = SAMPLE_HOUSES.slice(0, 6).map((h, i) => ({
      ...h,
      _id: 'my-sample-' + i,
      id: 'my-sample-' + i,
      status: i < 3 ? 'approved' : i < 5 ? 'pending' : 'offline'
    }))
  } finally {
    loading.value = false
  }
}

async function toggleStatus(id, status) {
  if (String(id).startsWith('my-sample')) {
    const item = houses.value.find(h => (h._id || h.id) === id)
    if (item) {
      item.status = status
      ElMessage.success(status === 'approved' ? '已上架' : '已下架')
    }
    return
  }
  try {
    await request.put(`/houses/${id}/status`, { status })
    ElMessage.success(status === 'approved' ? '已上架' : '已下架')
    loadHouses()
  } catch {}
}

onMounted(loadHouses)
</script>

<style scoped>
.add-btn {
  font-weight: 600;
  letter-spacing: 0.02em;
  border-radius: 10px;
}
.add-btn-icon { font-size: 18px; margin-right: 2px; }

/* ── Mini Stats Row ── */
.stats-row { margin-bottom: 24px; }

.mini-stat {
  padding: 18px 16px;
  border-radius: 12px;
  text-align: center;
  border: 1px solid #eff1f1;
  background: #fff;
  transition: box-shadow 260ms cubic-bezier(0.22, 0.61, 0.36, 1);
  position: relative;
  overflow: hidden;
}
.mini-stat::before {
  content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 3px;
}
.stat-all::before      { background: linear-gradient(90deg, #0d7a7a, #3ba3a3); }
.stat-approved::before  { background: linear-gradient(90deg, #3ba3a3, #4caf7d); }
.stat-pending::before   { background: linear-gradient(90deg, #c8943a, #d4a84e); }
.stat-other::before     { background: linear-gradient(90deg, #9ca3a3, #b8bfbf); }
.mini-stat:hover { box-shadow: 0 4px 16px rgba(13, 122, 122, 0.06); }

.mini-value { font-size: 26px; font-weight: 700; color: #1a1c1c; display: block; line-height: 1.2; }
.mini-label { font-size: 12px; color: #9ca3a3; margin-top: 4px; display: block; }

/* ── Table ── */
.house-table { margin-top: 4px; }

.table-thumb {
  width: 48px; height: 36px; border-radius: 6px; overflow: hidden;
}
.thumb-img {
  width: 100%; height: 100%; object-fit: cover;
}
.table-thumb-placeholder {
  width: 48px; height: 36px; border-radius: 6px;
  background: linear-gradient(135deg, #f5fafa, #ecf4f4);
  display: flex; align-items: center; justify-content: center;
}
.cell-highlight { font-weight: 600; color: #0d7a7a; }
.cell-price { font-size: 15px; font-weight: 700; color: #c56a62; }
.cell-unit { font-size: 11px; color: #9ca3a3; margin-left: 2px; }

.action-btn { font-weight: 500; border-radius: 6px; }

/* ── Empty ── */
.empty-card {
  text-align: center; padding: 60px 20px; color: #9ca3a3;
}
.empty-card svg { margin-bottom: 14px; opacity: 0.5; }
.empty-card p { font-size: 15px; margin-bottom: 6px; color: #6b7272; }
.empty-hint { font-size: 13px; color: #c0c5c5; }
</style>
