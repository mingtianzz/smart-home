<template>
  <div>
    <div class="card-header">
      <h3>合同管理</h3>
      <el-button type="primary" @click="showCreateDialog">创建合同</el-button>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="22" class="stats-row">
      <el-col :span="6">
        <div class="mini-stat stat-all">
          <span class="mini-value">{{ contracts.length }}</span>
          <span class="mini-label">全部合同</span>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="mini-stat stat-signed">
          <span class="mini-value">{{ statusCounts.signed }}</span>
          <span class="mini-label">已签署</span>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="mini-stat stat-pending">
          <span class="mini-value">{{ statusCounts.pending_sign + statusCounts.draft }}</span>
          <span class="mini-label">待签署/草稿</span>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="mini-stat stat-ended">
          <span class="mini-value">{{ statusCounts.terminated }}</span>
          <span class="mini-label">已终止</span>
        </div>
      </el-col>
    </el-row>

    <!-- 合同列表 -->
    <el-table :data="contracts" v-loading="loading" stripe class="contract-table">
      <el-table-column label="房源" min-width="150">
        <template #default="{ row }">
          <span class="cell-house">{{ row.houseId?.title || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="租户(乙方)" width="120">
        <template #default="{ row }">
          <span class="cell-tenant">{{ row.tenantId?.name || row.tenantId?.phone || '--' }}</span>
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
          <el-tag :type="statusType(row.status, row)" size="small" class="status-tag" effect="dark">{{ statusText(row.status, row) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button size="small" class="action-btn" @click="viewContract(row._id)">查看</el-button>
          <el-button
            v-if="(row.status === 'draft' || row.status === 'pending_sign') && !row.signedByLandlord"
            type="success" size="small" class="action-btn"
            @click="signContract(row._id)"
          >签署</el-button>
          <el-button
            v-if="row.status === 'signed'"
            type="danger" size="small" class="action-btn" plain
            @click="terminateContract(row._id)"
          >终止</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="!loading && contracts.length === 0" class="empty-card">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#b6e4e4" stroke-width="1.0">
        <path d="M14 2H6C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z"/>
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
      </svg>
      <p>暂无合同记录</p>
      <span class="empty-hint">确认预约后可创建合同</span>
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
              <label>户型/楼层</label>
              <span>{{ detailContract.houseId?.type || '--' }} / {{ detailContract.houseId?.floor || '--' }}</span>
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

        <!-- 日期 -->
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
          v-if="detailContract && (detailContract.status === 'draft' || detailContract.status === 'pending_sign') && !detailContract.signedByLandlord"
          type="success" @click="signFromDetail"
        >签署合同</el-button>
      </template>
    </el-dialog>

    <!-- 创建合同弹窗 -->
    <el-dialog v-model="dialogVisible" title="创建合同" width="560px" class="create-dialog">
      <el-form :model="form" label-width="80px">
        <el-form-item label="房源" prop="houseId">
          <el-select v-model="form.houseId" placeholder="选择房源" style="width:100%" @change="onHouseChange">
            <el-option v-for="h in houseOptions" :key="h._id || h.id" :label="h.title" :value="h._id || h.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="租户" prop="tenantId">
          <el-select v-model="form.tenantId" placeholder="选择租户（已确认预约的）" style="width:100%">
            <el-option v-for="t in tenantOptions" :key="t._id" :label="`${t.name || t.phone} — ${t.houseTitle}`" :value="t._id" />
          </el-select>
          <div v-if="tenantOptions.length === 0" class="form-hint">暂无已确认预约的租户，请先在预约管理中确认预约</div>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始日期" prop="startDate">
              <el-date-picker v-model="form.startDate" type="date" placeholder="开始日期" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束日期" prop="endDate">
              <el-date-picker v-model="form.endDate" type="date" placeholder="结束日期" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="月租金" prop="rent">
          <el-input-number v-model="form.rent" :min="0" style="width:100%" />
        </el-form-item>
        <el-form-item label="押金" prop="deposit">
          <el-input-number v-model="form.deposit" :min="0" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createContract" :loading="createLoading">创建合同</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../../utils/request'

const contracts = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const createLoading = ref(false)
const houseOptions = ref([])
const tenantOptions = ref([])

// 合同详情
const detailVisible = ref(false)
const detailContract = ref(null)

const form = ref({ houseId: '', tenantId: '', startDate: '', endDate: '', rent: 0, deposit: 0 })

const statusCounts = computed(() => ({
  draft: contracts.value.filter(c => c.status === 'draft').length,
  pending_sign: contracts.value.filter(c => c.status === 'pending_sign').length,
  signed: contracts.value.filter(c => c.status === 'signed').length,
  terminated: contracts.value.filter(c => c.status === 'terminated').length,
}))

function statusType(s, contract) {
  if (s === 'pending_sign') {
    if (contract?.signedByLandlord) {
      return 'primary'
    }
  }
  return { draft: 'info', pending_sign: 'warning', signed: 'success', terminated: 'danger' }[s] || 'info'
}
function statusText(s, contract) {
  if (s === 'pending_sign') {
    if (contract?.signedByLandlord) {
      return '甲方已签·待乙方'
    }
  }
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
    const res = await request.get('/contracts')
    contracts.value = Array.isArray(res) ? res : (res.contracts || res.data || [])
  } catch {
    contracts.value = []
  } finally {
    loading.value = false
  }
}

async function loadOptions() {
  try {
    // 加载房东房源
    const hRes = await request.get('/houses/my')
    houseOptions.value = Array.isArray(hRes) ? hRes : (hRes.houses || hRes.data || [])

    // 加载已确认预约的租户
    const tRes = await request.get('/contracts/landlord/tenants')
    tenantOptions.value = Array.isArray(tRes) ? tRes : (tRes.tenants || tRes.data || [])
  } catch {
    tenantOptions.value = []
  }
}

function onHouseChange(houseId) {
  const house = houseOptions.value.find(h => (h._id || h.id) === houseId)
  if (house) {
    form.value.rent = house.rent || 0
    form.value.deposit = house.deposit || 0
  }
}

function showCreateDialog() {
  form.value = { houseId: '', tenantId: '', startDate: '', endDate: '', rent: 0, deposit: 0 }
  dialogVisible.value = true
}

async function createContract() {
  if (!form.value.houseId || !form.value.tenantId || !form.value.startDate || !form.value.endDate) {
    ElMessage.warning('请填写完整信息')
    return
  }
  createLoading.value = true
  try {
    await request.post('/contracts', {
      ...form.value,
      startDate: form.value.startDate instanceof Date
        ? form.value.startDate.toISOString().split('T')[0]
        : form.value.startDate,
      endDate: form.value.endDate instanceof Date
        ? form.value.endDate.toISOString().split('T')[0]
        : form.value.endDate,
    })
    ElMessage.success('合同创建成功')
    dialogVisible.value = false
    loadContracts()
  } catch (err) {
    console.error('创建合同失败:', err)
  } finally {
    createLoading.value = false
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
    await ElMessageBox.confirm(
      '签署后该房源将立即锁定并下架，不再对外展示。<br>同时合同将自动生成每月收入记录。',
      '签署确认',
      { confirmButtonText: '确定签署', cancelButtonText: '取消', dangerouslyUseHTMLString: true }
    )
    await request.put(`/contracts/${id}/sign`)
    ElMessage.success('合同签署成功')
    loadContracts()
    if (detailVisible.value && detailContract.value?._id === id) {
      await viewContract(id)
    }
  } catch (err) {
    if (err !== 'cancel') console.error('签署合同失败:', err)
  }
}

async function signFromDetail() {
  if (!detailContract.value) return
  await signContract(detailContract.value._id)
}

async function terminateContract(id) {
  try {
    await ElMessageBox.confirm('确认终止该合同？此操作不可撤销。', '警告', { type: 'warning' })
    await request.put(`/contracts/${id}/terminate`)
    ElMessage.success('合同已终止')
    loadContracts()
  } catch (err) {
    if (err !== 'cancel') console.error('终止合同失败:', err)
  }
}

onMounted(() => {
  loadContracts()
  loadOptions()
})
</script>

<style scoped>
/* ── Stats Row ── */
.stats-row { margin-bottom: 24px; }

.mini-stat {
  padding: 18px 16px; border-radius: 12px; text-align: center;
  border: 1px solid #eff1f1; background: #fff;
  transition: box-shadow 260ms cubic-bezier(0.22, 0.61, 0.36, 1);
  position: relative; overflow: hidden;
}
.mini-stat::before {
  content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 3px;
}
.stat-all::before     { background: linear-gradient(90deg, #1d4359, #3ba3a3); }
.stat-signed::before  { background: linear-gradient(90deg, #3ba3a3, #4caf7d); }
.stat-pending::before { background: linear-gradient(90deg, #c8943a, #d4a84e); }
.stat-ended::before   { background: linear-gradient(90deg, #9ca3a3, #b8bfbf); }
.mini-stat:hover { box-shadow: 0 4px 16px rgba(29,67,89,0.06); }

.mini-value { font-size: 26px; font-weight: 700; color: #1a1c1c; display: block; line-height: 1.2; }
.mini-label { font-size: 12px; color: #9ca3a3; margin-top: 4px; display: block; }

/* ── Table ── */
.cell-house  { font-weight: 500; color: #1a1c1c; }
.cell-tenant { font-weight: 500; }
.cell-date   { font-weight: 500; color: #1d4359; }
.cell-price  { font-weight: 700; color: #c56a62; }
.action-btn  { font-weight: 500; border-radius: 6px; }

/* ── Empty ── */
.empty-card {
  text-align: center; padding: 60px 20px; color: #9ca3a3;
}
.empty-card svg { margin-bottom: 14px; opacity: 0.5; }
.empty-card p { font-size: 15px; margin-bottom: 6px; color: #6b7272; }
.empty-hint  { font-size: 13px; color: #c0c5c5; }

.form-hint {
  font-size: 12px; color: #c0c5c5; margin-top: 4px;
}

/* ── Contract Template (合同简约版本) ── */
.contract-template {
  background: #fff;
  padding: 0;
  font-size: 14px;
  line-height: 1.8;
  color: #1a1c1c;
}

.contract-header {
  text-align: center;
  padding-bottom: 20px;
  margin-bottom: 24px;
  border-bottom: 2px solid #1d4359;
}
.contract-header h2 {
  font-size: 22px; font-weight: 700; color: #1d4359; margin: 0 0 6px;
}
.contract-no {
  font-size: 12px; color: #9ca3a3; margin: 0;
}

.contract-parties {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  margin-bottom: 24px;
}
.party-card {
  background: #f7f9f9; border: 1px solid #e2e6e6; border-radius: 8px;
  padding: 16px;
}
.party-card h4 {
  font-size: 15px; font-weight: 600; color: #1d4359;
  margin: 0 0 10px; padding-bottom: 8px; border-bottom: 1px solid #e2e6e6;
}
.party-card p {
  margin: 4px 0; font-size: 13px; display: flex; gap: 8px;
}
.party-card label { color: #6b7272; min-width: 48px; }

.contract-section {
  margin-bottom: 20px;
}
.contract-section h4 {
  font-size: 15px; font-weight: 600; color: #1a1c1c;
  margin: 0 0 12px; padding-left: 10px; border-left: 3px solid #1d4359;
}

.info-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px;
}
.info-item {
  display: flex; flex-direction: column; gap: 2px;
}
.info-item label {
  font-size: 12px; color: #6b7272;
}
.info-item span {
  font-size: 14px; font-weight: 500; color: #1a1c1c;
}
.info-item.highlight {
  background: #e8f5f5; border-radius: 6px; padding: 10px 12px;
}
.info-item.highlight label { color: #1d4359; font-weight: 500; }
.val-date { color: #1d4359 !important; font-weight: 600 !important; }
.val-price { color: #c56a62 !important; font-weight: 700 !important; font-size: 16px !important; }

.sign-status-bar {
  display: flex; align-items: center; gap: 0;
  padding: 16px; background: #f7f9f9; border-radius: 8px;
  border: 1px solid #e2e6e6;
}
.sign-party {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;
  opacity: 0.5;
}
.sign-party.signed { opacity: 1; }
.sign-icon {
  font-size: 28px; font-weight: 700;
  color: #9ca3a3;
}
.sign-party.signed .sign-icon { color: #4caf7d; }
.sign-label { font-size: 13px; font-weight: 500; color: #1a1c1c; }
.sign-state { font-size: 12px; color: #6b7272; }
.sign-party.signed .sign-state { color: #4caf7d; font-weight: 600; }
.sign-divider {
  width: 40px; height: 1px; background: #e2e6e6;
}

.contract-footer-dates {
  margin-top: 20px; padding-top: 12px; border-top: 1px solid #e2e6e6;
  display: flex; justify-content: space-between;
}
.contract-footer-dates p {
  font-size: 12px; color: #9ca3a3; margin: 0;
}
</style>
