<template>
  <div>
    <div class="card-header">
      <h2>我的合同</h2>
    </div>

    <!-- 合同列表 -->
    <el-table :data="contracts" v-loading="loading" stripe class="contract-table">
      <el-table-column label="房源" min-width="150">
        <template #default="{ row }">
          <span class="cell-house">{{ row.houseId?.title || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="房东(甲方)" width="120">
        <template #default="{ row }">
          {{ row.landlordId?.name || row.landlordId?.phone || '--' }}
        </template>
      </el-table-column>
      <el-table-column label="租期" width="200">
        <template #default="{ row }">
          <span class="cell-date">{{ formatDate(row.startDate) }} ~ {{ formatDate(row.endDate) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="月租金" width="110" align="right">
        <template #default="{ row }">
          <span class="cell-price">¥{{ Number(row.rent).toLocaleString() }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="95" align="center">
        <template #default="{ row }">
          <el-tag class="status-tag" :type="statusType(row.status)" size="small" effect="dark">
            {{ statusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="viewContract(row._id)">查看合同</el-button>
          <el-button
            v-if="row.status === 'pending_sign' && !row.signedByTenant"
            type="success" size="small"
            @click="signContract(row._id)"
          >签署</el-button>
          <el-button
            v-if="row.status === 'pending_sign' && !row.signedByTenant"
            type="danger" size="small"
            @click="rejectContract(row._id)"
          >拒绝</el-button>
          <el-button
            v-if="row.status === 'pending_sign' && row.signedByTenant"
            size="small" disabled
          >已签署</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="!loading && contracts.length === 0" class="empty-card">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#b6e4e4" stroke-width="1.0">
        <path d="M14 2H6C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z"/>
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
      </svg>
      <p>暂无合同记录</p>
      <span class="empty-hint">房东确认预约后会为您创建合同</span>
    </div>

    <!-- 合同详情/模板弹窗 -->
    <el-dialog v-model="detailVisible" title="合同详情" width="720px" class="contract-detail-dialog">
      <div v-if="detailContract" class="contract-template">
        <!-- 合同头部 -->
        <div class="contract-header">
          <h2>房屋租赁合同</h2>
          <p class="contract-no">合同编号：{{ detailContract._id }}</p>
        </div>

        <!-- 甲乙方信息 -->
        <div class="contract-parties">
          <div class="party-card">
            <h4>甲方（出租方）</h4>
            <p><label>姓名：</label><span>{{ detailContract.landlordId?.name || '--' }}</span></p>
            <p><label>电话：</label><span>{{ detailContract.landlordId?.phone || '--' }}</span></p>
          </div>
          <div class="party-card">
            <h4>乙方（承租方）</h4>
            <p><label>姓名：</label><span>{{ detailContract.tenantId?.name || '--' }}</span></p>
            <p><label>电话：</label><span>{{ detailContract.tenantId?.phone || '--' }}</span></p>
          </div>
        </div>

        <!-- 房源信息 -->
        <div class="contract-section">
          <h4>房屋信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <label>房屋名称</label>
              <span>{{ detailContract.houseId?.title || '--' }}</span>
            </div>
            <div class="info-item">
              <label>地址</label>
              <span>{{ detailContract.houseId?.address || '--' }}</span>
            </div>
            <div class="info-item">
              <label>面积</label>
              <span>{{ detailContract.houseId?.area || '--' }}㎡</span>
            </div>
            <div class="info-item">
              <label>户型</label>
              <span>{{ detailContract.houseId?.type || '--' }}</span>
            </div>
          </div>
        </div>

        <!-- 租约条款 -->
        <div class="contract-section">
          <h4>租约条款</h4>
          <div class="info-grid terms-grid">
            <div class="info-item highlight">
              <label>合同开始日期</label>
              <span class="val-date">{{ formatDate(detailContract.startDate) }}</span>
            </div>
            <div class="info-item highlight">
              <label>合同结束日期</label>
              <span class="val-date">{{ formatDate(detailContract.endDate) }}</span>
            </div>
            <div class="info-item highlight">
              <label>月租金</label>
              <span class="val-price">¥{{ Number(detailContract.rent).toLocaleString() }} /月</span>
            </div>
            <div class="info-item highlight">
              <label>押金</label>
              <span class="val-price">¥{{ Number(detailContract.deposit).toLocaleString() }}</span>
            </div>
          </div>
        </div>

        <!-- 签署状态 -->
        <div class="contract-section">
          <h4>签署状态</h4>
          <div class="sign-status-bar">
            <div class="sign-party" :class="{ signed: detailContract.signedByLandlord }">
              <span class="sign-icon">{{ detailContract.signedByLandlord ? '✓' : '○' }}</span>
              <span class="sign-label">甲方（出租方）</span>
              <span class="sign-state">{{ detailContract.signedByLandlord ? '已签署' : '待签署' }}</span>
            </div>
            <div class="sign-divider"></div>
            <div class="sign-party" :class="{ signed: detailContract.signedByTenant }">
              <span class="sign-icon">{{ detailContract.signedByTenant ? '✓' : '○' }}</span>
              <span class="sign-label">乙方（承租方）</span>
              <span class="sign-state">{{ detailContract.signedByTenant ? '已签署' : '待签署' }}</span>
            </div>
          </div>
        </div>

        <div class="contract-footer-dates">
          <p>创建日期：{{ formatDate(detailContract.createdAt) }}</p>
          <p>最后更新：{{ formatDate(detailContract.updatedAt) }}</p>
        </div>
      </div>

      <div v-else class="empty-card" style="padding:40px">
        <p>加载中...</p>
      </div>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button
          v-if="detailContract && detailContract.status === 'pending_sign' && !detailContract.signedByTenant"
          type="danger" @click="rejectFromDetail"
        >拒绝合同</el-button>
        <el-button
          v-if="detailContract && detailContract.status === 'pending_sign' && !detailContract.signedByTenant"
          type="success" @click="signFromDetail"
        >签署合同</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../../utils/request'

const contracts = ref([])
const loading = ref(false)

// 合同详情
const detailVisible = ref(false)
const detailContract = ref(null)

function statusType(s) {
  return { draft: 'info', pending_sign: 'warning', signed: 'success', terminated: 'danger' }[s] || 'info'
}
function statusText(s) {
  return { draft: '草稿', pending_sign: '待签署', signed: '已签署', terminated: '已终止' }[s] || s
}
function formatDate(dateStr) {
  if (!dateStr) return '--'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function loadContracts() {
  loading.value = true
  try {
    const res = await request.get('/contracts/my')
    contracts.value = res.contracts || res.data || (Array.isArray(res) ? res : [])
  } catch {
    contracts.value = []
  } finally {
    loading.value = false
  }
}

async function viewContract(id) {
  try {
    const res = await request.get(`/contracts/${id}`)
    detailContract.value = res.contract || res
    detailVisible.value = true
  } catch (err) {
    console.error('加载合同详情失败:', err)
  }
}

async function signContract(id) {
  try {
    await ElMessageBox.confirm('确认签署该合同？签署后即表示同意合同条款。', '提示')
    await request.put(`/contracts/${id}/sign`)
    ElMessage.success('合同签署成功')
    loadContracts()
    if (detailVisible.value && detailContract.value?._id === id) {
      detailVisible.value = false
    }
  } catch (err) {
    if (err !== 'cancel') console.error('签署合同失败:', err)
  }
}

async function signFromDetail() {
  if (!detailContract.value) return
  await signContract(detailContract.value._id)
}

async function rejectContract(id) {
  try {
    await ElMessageBox.confirm('确定拒绝该合同？拒绝后甲方签署状态将被清空，合同将回到草稿状态。', '提示', { confirmButtonText: '确定拒绝', type: 'warning' })
    await request.put(`/contracts/${id}/reject`)
    ElMessage.success('已拒绝合同')
    loadContracts()
    if (detailVisible.value && detailContract.value?._id === id) {
      detailVisible.value = false
    }
  } catch (err) {
    if (err !== 'cancel') console.error('拒绝合同失败:', err)
  }
}

async function rejectFromDetail() {
  if (!detailContract.value) return
  await rejectContract(detailContract.value._id)
}

onMounted(loadContracts)
</script>

<style scoped>
/* ── Table ── */
.cell-house  { font-weight: 500; color: #1a1c1c; }
.cell-date   { font-weight: 500; color: #1d4359; }
.cell-price  { font-weight: 700; color: #c56a62; }

/* ── Empty ── */
.empty-card {
  text-align: center; padding: 60px 20px; color: #9ca3a3;
}
.empty-card svg { margin-bottom: 14px; opacity: 0.5; }
.empty-card p { font-size: 15px; margin-bottom: 6px; color: #6b7272; }
.empty-hint  { font-size: 13px; color: #c0c5c5; }

/* ── Contract Template (合同简约版本) ── */
.contract-template {
  background: #fff; padding: 0;
  font-size: 14px; line-height: 1.8; color: #1a1c1c;
}

.contract-header {
  text-align: center; padding-bottom: 20px; margin-bottom: 24px;
  border-bottom: 2px solid #1d4359;
}
.contract-header h2 {
  font-size: 22px; font-weight: 700; color: #1d4359; margin: 0 0 6px;
}
.contract-no {
  font-size: 12px; color: #9ca3a3; margin: 0;
}

.contract-parties {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;
}
.party-card {
  background: #f7f9f9; border: 1px solid #e2e6e6; border-radius: 8px; padding: 16px;
}
.party-card h4 {
  font-size: 15px; font-weight: 600; color: #1d4359;
  margin: 0 0 10px; padding-bottom: 8px; border-bottom: 1px solid #e2e6e6;
}
.party-card p { margin: 4px 0; font-size: 13px; display: flex; gap: 8px; }
.party-card label { color: #6b7272; min-width: 48px; }

.contract-section { margin-bottom: 20px; }
.contract-section h4 {
  font-size: 15px; font-weight: 600; color: #1a1c1c;
  margin: 0 0 12px; padding-left: 10px; border-left: 3px solid #1d4359;
}

.info-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px;
}
.info-item { display: flex; flex-direction: column; gap: 2px; }
.info-item label { font-size: 12px; color: #6b7272; }
.info-item span { font-size: 14px; font-weight: 500; color: #1a1c1c; }
.info-item.highlight {
  background: #e8f5f5; border-radius: 6px; padding: 10px 12px;
}
.info-item.highlight label { color: #1d4359; font-weight: 500; }
.val-date { color: #1d4359 !important; font-weight: 600 !important; }
.val-price { color: #c56a62 !important; font-weight: 700 !important; font-size: 16px !important; }

.sign-status-bar {
  display: flex; align-items: center; gap: 0;
  padding: 16px; background: #f7f9f9; border-radius: 8px; border: 1px solid #e2e6e6;
}
.sign-party {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; opacity: 0.5;
}
.sign-party.signed { opacity: 1; }
.sign-icon { font-size: 28px; font-weight: 700; color: #9ca3a3; }
.sign-party.signed .sign-icon { color: #4caf7d; }
.sign-label { font-size: 13px; font-weight: 500; color: #1a1c1c; }
.sign-state { font-size: 12px; color: #6b7272; }
.sign-party.signed .sign-state { color: #4caf7d; font-weight: 600; }
.sign-divider { width: 40px; height: 1px; background: #e2e6e6; }

.contract-footer-dates {
  margin-top: 20px; padding-top: 12px; border-top: 1px solid #e2e6e6;
  display: flex; justify-content: space-between;
}
.contract-footer-dates p { font-size: 12px; color: #9ca3a3; margin: 0; }
</style>
