<template>
  <div>
    <!-- ── Header ── -->
    <div class="card-header">
      <h3>财务管理</h3>
      <el-date-picker
        v-model="month"
        type="month"
        placeholder="选择月份"
        @change="handleMonthChange"
        style="width:160px"
      />
    </div>

    <!-- ── Stat Cards ── -->
    <el-row :gutter="22" class="mb-20">
      <el-col :span="8">
        <el-card shadow="never" class="finance-stat-card">
          <div class="stat-item">
            <div class="stat-label">总收入</div>
            <div class="stat-value stat-income">¥{{ totalIncome.toLocaleString() }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" class="finance-stat-card">
          <div class="stat-item">
            <div class="stat-label">本月收入</div>
            <div class="stat-value stat-month">¥{{ monthlyIncome.toLocaleString() }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" class="finance-stat-card">
          <div class="stat-item">
            <div class="stat-label">合同数</div>
            <div class="stat-value stat-contract">{{ contractCount }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- ── Line Chart ── -->
    <el-card shadow="never" class="chart-card mb-20">
      <div class="chart-header">
        <span class="chart-title">收入趋势</span>
        <el-radio-group v-model="granularity" size="small">
        </el-radio-group>
      </div>
      <div ref="chartRef" class="chart-container"></div>
      <div v-if="!loadingChart && chartData.length === 0" class="chart-empty">暂无图表数据</div>
    </el-card>

    <!-- ── Records Table ── -->
    <el-table :data="records" v-loading="loading" stripe style="width:100%">
      <el-table-column label="房源" min-width="150">
        <template #default="{ row }">{{ row.houseId?.title || '--' }}</template>
      </el-table-column>
      <el-table-column label="合同" min-width="100">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="viewContract(row.contractId)">
            {{ row.contractId?._id?.slice(-6) || '--' }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column prop="month" label="月份" width="100" />
      <el-table-column label="金额" width="110">
        <template #default="{ row }">¥{{ Number(row.amount).toLocaleString() }}</template>
      </el-table-column>
      <el-table-column label="创建时间" width="160">
        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
    </el-table>
    <el-empty v-if="!loading && records.length === 0" description="暂无财务记录" />

    <!-- ── Contract Detail Dialog ── -->
    <el-dialog v-model="contractDialogVisible" title="合同详情" width="640px" top="5vh">
      <template v-if="contractDetail">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="合同编号" :span="2">{{ contractDetail._id }}</el-descriptions-item>
          <el-descriptions-item label="房源">{{ contractDetail.houseId?.title || '--' }}</el-descriptions-item>
          <el-descriptions-item label="地址">{{ contractDetail.houseId?.address || '--' }}</el-descriptions-item>
          <el-descriptions-item label="租客">{{ contractDetail.tenantId?.name || '--' }}</el-descriptions-item>
          <el-descriptions-item label="租客电话">{{ contractDetail.tenantId?.phone || '--' }}</el-descriptions-item>
          <el-descriptions-item label="开始日期">{{ formatDate(contractDetail.startDate) }}</el-descriptions-item>
          <el-descriptions-item label="结束日期">{{ formatDate(contractDetail.endDate) }}</el-descriptions-item>
          <el-descriptions-item label="月租金">¥{{ Number(contractDetail.rent).toLocaleString() }}</el-descriptions-item>
          <el-descriptions-item label="押金">¥{{ Number(contractDetail.deposit).toLocaleString() }}</el-descriptions-item>
          <el-descriptions-item label="合同状态" :span="2">
            <el-tag :type="statusTag(contractDetail.status)" size="small">{{ statusLabel(contractDetail.status) }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <div v-if="contractDetail.houseId?.images?.length" class="contract-images mt-10">
          <div class="img-label">房源图片：</div>
          <el-image
            v-for="(img, i) in contractDetail.houseId.images"
            :key="i"
            :src="img"
            :preview-src-list="contractDetail.houseId.images"
            style="width:80px;height:80px;margin-right:8px;border-radius:6px"
          />
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../../utils/request'
import * as echarts from 'echarts'

const records = ref([])
const loading = ref(false)
const month = ref(new Date())

// Chart
const chartRef = ref(null)
const granularity = ref('month')
const chartData = ref([])
const loadingChart = ref(false)
let chartInstance = null

// Contract detail
const contractDialogVisible = ref(false)
const contractDetail = ref(null)

// Stats
const totalIncome = ref(0)
const monthlyIncome = ref(0)

const contractCount = computed(() => {
  const ids = new Set(records.value.map(r => r.contractId?._id).filter(Boolean))
  return ids.size
})

function formatDate(dateStr) {
  if (!dateStr) return '--'
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function statusTag(status) {
  const map = { draft: 'info', pending_sign: 'warning', signed: 'success', terminated: 'danger' }
  return map[status] || 'info'
}

function statusLabel(status) {
  const map = { draft: '草稿', pending_sign: '待签署', signed: '已签署', terminated: '已终止' }
  return map[status] || status
}

// ── Finance Records ──

async function loadFinance() {
  loading.value = true
  try {
    const params = {}
    if (month.value) {
      const d = month.value
      params.month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    }
    const res = await request.get('/finance', { params })
    records.value = Array.isArray(res) ? res : (res.records || res.data || [])
  } catch {
    records.value = []
  } finally {
    loading.value = false
  }
}

// ── Chart ──

async function loadChartData() {
  loadingChart.value = true
  try {
    const params = { granularity: granularity.value }
    if (month.value) {
      const d = month.value
      params.endMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const start = new Date(d)
      start.setFullYear(start.getFullYear() - 1)
      params.startMonth = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`
    }
    const res = await request.get('/finance/stats', { params })
    chartData.value = res.chartData || []
    totalIncome.value = res.totalIncome || 0
    monthlyIncome.value = res.monthlyIncome || 0
    renderChart()
  } catch {
    chartData.value = []
    totalIncome.value = 0
    monthlyIncome.value = 0
  } finally {
    loadingChart.value = false
  }
}

function handleMonthChange() {
  loadFinance()
  loadChartData()
}

function renderChart() {
  if (!chartRef.value) return

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const data = chartData.value
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const p = params[0]
        return `${p.axisValue}<br/>收入：¥${Number(p.value).toLocaleString()}`
      },
    },
    grid: { left: 60, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: data.map(d => d.period),
      axisLabel: { fontSize: 11, color: '#9ca3a3' },
      axisLine: { lineStyle: { color: '#eef0f0' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 11,
        color: '#9ca3a3',
        formatter: (v) => v >= 10000 ? `${(v / 10000).toFixed(1)}w` : v,
      },
      splitLine: { lineStyle: { color: '#f3f5f5', type: 'dashed' } },
    },
    series: [
      {
        type: 'line',
        data: data.map(d => d.amount),
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          color: '#1d4359',
          width: 3,
        },
        itemStyle: {
          color: '#1d4359',
          borderColor: '#fff',
          borderWidth: 2,
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(29,67,89,0.3)' },
            { offset: 1, color: 'rgba(29,67,89,0.02)' },
          ]),
        },
      },
    ],
  }

  chartInstance.setOption(option, true)
  chartInstance.resize()
}

function handleResize() {
  chartInstance?.resize()
}

// ── Contract Detail ──

async function viewContract(contract) {
  if (!contract || !contract._id) return
  try {
    const res = await request.get(`/contracts/${contract._id}`)
    contractDetail.value = res
    contractDialogVisible.value = true
  } catch {
    ElMessage.error('无法获取合同详情')
  }
}

// ── Lifecycle ──

onMounted(() => {
  loadFinance()
  loadChartData()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
  chartInstance = null
})

watch(granularity, loadChartData)
</script>

<style scoped>
/* ── Stat Cards ── */
.finance-stat-card {
  border-radius: 12px;
  border: 1px solid #eef0f0;
}

.stat-item {
  text-align: center;
  padding: 12px 8px;
}

.stat-label {
  font-size: 13px;
  color: #9ea5a5;
  margin-bottom: 10px;
  font-weight: 500;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.stat-income { color: #d4943a; }
.stat-month { color: #1d4359; }
.stat-contract { color: #4caf7d; }

.ml-10 { margin-left: 10px; }

/* ── Chart ── */
.chart-card {
  border-radius: 12px;
  border: 1px solid #eef0f0;
  position: relative;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.chart-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1c1c;
}

.chart-container {
  width: 100%;
  height: 280px;
}

.chart-empty {
  text-align: center;
  padding: 40px 0;
  color: #9ca3a3;
  font-size: 14px;
}

/* ── History ── */
.history-card {
  border-radius: 12px;
  border: 1px solid #eef0f0;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.history-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1c1c;
}

.history-filters {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

/* ── Common ── */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1c1c;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mb-20 { margin-bottom: 20px; }
.mt-20 { margin-top: 20px; }
.mt-10 { margin-top: 10px; }

.contract-images {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.img-label {
  font-size: 13px;
  color: #6b7272;
  margin-right: 4px;
  width: 100%;
  margin-bottom: 6px;
}
</style>
