<template>
  <div>
    <div class="card-header">
      <h3>预约管理</h3>
    </div>

    <!-- 预约状态统计 -->
    <el-row :gutter="22" class="stats-row">
      <el-col :span="6">
        <div class="mini-stat stat-pending">
          <span class="mini-value">{{ counts.pending }}</span>
          <span class="mini-label">待确认</span>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="mini-stat stat-confirmed">
          <span class="mini-value">{{ counts.confirmed }}</span>
          <span class="mini-label">已确认</span>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="mini-stat stat-cancelled">
          <span class="mini-value">{{ counts.cancelled }}</span>
          <span class="mini-label">已取消</span>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="mini-stat stat-rejected">
          <span class="mini-value">{{ counts.rejected }}</span>
          <span class="mini-label">已拒绝</span>
        </div>
      </el-col>
    </el-row>

    <el-table :data="appointments" v-loading="loading" stripe class="appt-table">
      <el-table-column label="房源" min-width="160">
        <template #default="{ row }">
          <span class="cell-house">{{ row.houseId?.title || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="租户" width="120">
        <template #default="{ row }">
          <span class="cell-tenant">{{ row.tenantId?.name || row.tenantId?.phone || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="看房日期" width="120">
        <template #default="{ row }">
          <span class="cell-date">{{ formatDate(row.visitDate) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="时间" width="90">
        <template #default="{ row }">{{ row.visitTime || '--' }}</template>
      </el-table-column>
      <el-table-column label="联系方式" width="130">
        <template #default="{ row }">{{ row.contact || '--' }}</template>
      </el-table-column>
      <el-table-column label="备注" min-width="150" show-overflow-tooltip>
        <template #default="{ row }">{{ row.remark || '--' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="95" align="center">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small" class="status-tag" effect="dark">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <template v-if="row.status === 'pending'">
            <el-button type="success" size="small" class="action-btn" @click="confirmAppointment(row._id || row.id)">确认</el-button>
            <el-button type="danger" size="small" class="action-btn" @click="showRejectDialog(row._id || row.id)">拒绝</el-button>
          </template>
          <template v-else-if="row.status === 'confirmed'">
            <el-button type="primary" size="small" class="action-btn" @click="showContractDialog(row)">创建合同</el-button>
          </template>
          <span v-else class="cell-done">—</span>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="!loading && appointments.length === 0" class="empty-card">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#b6e4e4" stroke-width="1.0">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
      <p>暂无预约记录</p>
      <span class="empty-hint">当租户预约看房后，记录将显示在此处</span>
    </div>

    <!-- Reject Dialog -->
    <el-dialog v-model="rejectDialogVisible" title="拒绝预约" width="440px" class="reject-dialog">
      <el-input
        v-model="rejectReason"
        type="textarea"
        :rows="3"
        placeholder="请输入拒绝原因（选填）"
      />
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReject" :loading="rejectLoading">确定拒绝</el-button>
      </template>
    </el-dialog>

    <!-- Create Contract Dialog (from confirmed appointment) -->
    <el-dialog v-model="contractDialogVisible" title="创建合同" width="520px" class="contract-dialog">
      <div v-if="contractAppointment" class="contract-preview">
        <p class="preview-hint">基于已确认的预约创建租赁合同</p>
        <div class="preview-info">
          <div class="preview-row"><label>房源</label><span>{{ contractAppointment.houseId?.title || '--' }}</span></div>
          <div class="preview-row"><label>地址</label><span>{{ contractAppointment.houseId?.address || '--' }}</span></div>
          <div class="preview-row"><label>租户</label><span>{{ contractAppointment.tenantId?.name || contractAppointment.tenantId?.phone || '--' }}</span></div>
        </div>
        <el-form :model="contractForm" label-width="80px" style="margin-top:16px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="开始日期">
                <el-date-picker v-model="contractForm.startDate" type="date" placeholder="开始日期" style="width:100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="结束日期">
                <el-date-picker v-model="contractForm.endDate" type="date" placeholder="结束日期" style="width:100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="月租金">
            <el-input-number v-model="contractForm.rent" :min="0" style="width:100%" />
          </el-form-item>
          <el-form-item label="押金">
            <el-input-number v-model="contractForm.deposit" :min="0" style="width:100%" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="contractDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreateContract" :loading="contractLoading">创建合同</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../../utils/request'

const appointments = ref([])
const loading = ref(false)
const rejectDialogVisible = ref(false)
const rejectReason = ref('')
const rejectId = ref(null)
const rejectLoading = ref(false)

// 合同创建相关
const contractDialogVisible = ref(false)
const contractAppointment = ref(null)
const contractLoading = ref(false)
const contractForm = ref({ startDate: '', endDate: '', rent: 0, deposit: 0 })

const counts = computed(() => ({
  pending: appointments.value.filter(a => a.status === 'pending').length,
  confirmed: appointments.value.filter(a => a.status === 'confirmed').length,
  cancelled: appointments.value.filter(a => a.status === 'cancelled').length,
  rejected: appointments.value.filter(a => a.status === 'rejected').length,
}))

function statusType(s) {
  return { pending: 'warning', confirmed: 'success', cancelled: 'info', rejected: 'danger' }[s] || 'info'
}
function statusText(s) {
  return { pending: '待确认', confirmed: '已确认', cancelled: '已取消', rejected: '已拒绝' }[s] || s
}
function formatDate(dateStr) {
  if (!dateStr) return '--'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function loadAppointments() {
  loading.value = true
  try {
    const res = await request.get('/appointments')
    const list = res.appointments || res.data || (Array.isArray(res) ? res : [])
    appointments.value = list
  } catch {
    appointments.value = []
  } finally {
    loading.value = false
  }
}

async function confirmAppointment(id) {
  try {
    await request.put(`/appointments/${id}/confirm`)
    ElMessage.success('已确认该预约')
    loadAppointments()
  } catch (err) {
    console.error('确认预约失败:', err)
  }
}

function showRejectDialog(id) {
  rejectId.value = id; rejectReason.value = ''; rejectDialogVisible.value = true
}

async function submitReject() {
  rejectLoading.value = true
  try {
    await request.put(`/appointments/${rejectId.value}/reject`, { reason: rejectReason.value })
    ElMessage.success('已拒绝该预约')
    rejectDialogVisible.value = false
    loadAppointments()
  } catch (err) {
    console.error('拒绝预约失败:', err)
  } finally {
    rejectLoading.value = false
  }
}

function showContractDialog(appointment) {
  contractAppointment.value = appointment
  // 预填：用预约日期作为开始日期，默认一年租期，租金从房源信息读取
  const startDate = appointment.visitDate ? new Date(appointment.visitDate) : new Date()
  const endDate = new Date(startDate)
  endDate.setFullYear(endDate.getFullYear() + 1)
  contractForm.value = {
    startDate,
    endDate,
    rent: appointment.houseId?.rent || 0,
    deposit: appointment.houseId?.deposit || 0,
  }
  contractDialogVisible.value = true
}

async function submitCreateContract() {
  if (!contractForm.value.startDate || !contractForm.value.endDate) {
    ElMessage.warning('请选择合同起止日期')
    return
  }
  contractLoading.value = true
  try {
    const aptId = contractAppointment.value._id || contractAppointment.value.id
    await request.post(`/contracts/from-appointment/${aptId}`, {
      startDate: contractForm.value.startDate instanceof Date
        ? contractForm.value.startDate.toISOString().split('T')[0]
        : contractForm.value.startDate,
      endDate: contractForm.value.endDate instanceof Date
        ? contractForm.value.endDate.toISOString().split('T')[0]
        : contractForm.value.endDate,
      rent: contractForm.value.rent,
      deposit: contractForm.value.deposit,
    })
    ElMessage.success('合同创建成功，请在合同管理中查看')
    contractDialogVisible.value = false
    loadAppointments()
  } catch (err) {
    console.error('创建合同失败:', err)
  } finally {
    contractLoading.value = false
  }
}

onMounted(loadAppointments)
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
.stat-pending::before   { background: linear-gradient(90deg, #c8943a, #d4a84e); }
.stat-confirmed::before  { background: linear-gradient(90deg, #3ba3a3, #4caf7d); }
.stat-cancelled::before  { background: linear-gradient(90deg, #9ca3a3, #b8bfbf); }
.stat-rejected::before   { background: linear-gradient(90deg, #c56a62, #d4807a); }
.mini-stat:hover { box-shadow: 0 4px 16px rgba(29, 67, 89, 0.06); }

.mini-value { font-size: 26px; font-weight: 700; color: #1a1c1c; display: block; line-height: 1.2; }
.mini-label { font-size: 12px; color: #9ca3a3; margin-top: 4px; display: block; }

/* ── Table ── */
.cell-house  { font-weight: 500; color: #1a1c1c; }
.cell-tenant { font-weight: 500; }
.cell-date   { font-weight: 500; color: #1d4359; }
.cell-done   { color: #c0c5c5; }
.action-btn  { font-weight: 500; border-radius: 6px; }

/* ── Empty ── */
.empty-card {
  text-align: center; padding: 60px 20px; color: #9ca3a3;
}
.empty-card svg { margin-bottom: 14px; opacity: 0.5; }
.empty-card p { font-size: 15px; margin-bottom: 6px; color: #6b7272; }
.empty-hint  { font-size: 13px; color: #c0c5c5; }

/* ── Contract Preview Dialog ── */
.contract-preview .preview-hint {
  font-size: 13px; color: #6b7272; margin-bottom: 12px;
}
.preview-info {
  background: #f7f9f9; border: 1px solid #e2e6e6; border-radius: 8px; padding: 14px 16px;
}
.preview-row {
  display: flex; gap: 12px; padding: 4px 0; font-size: 13px;
}
.preview-row label {
  color: #6b7272; min-width: 48px;
}
.preview-row span {
  color: #1a1c1c; font-weight: 500;
}
</style>
