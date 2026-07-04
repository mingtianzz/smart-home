<template>
  <div>
    <h3>数据统计</h3>

    <el-row :gutter="20" class="mb-20" style="margin-top:20px">
      <el-col :span="6">
        <el-card shadow="never" v-loading="loading">
          <div class="stat-item">
            <div class="stat-label">用户总数</div>
            <div class="stat-value" style="color:#0d7a7a">{{ stats.totalUsers || 0 }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" v-loading="loading">
          <div class="stat-item">
            <div class="stat-label">房源总数</div>
            <div class="stat-value" style="color:#36a3a3">{{ stats.totalHouses || 0 }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" v-loading="loading">
          <div class="stat-item">
            <div class="stat-label">预约数</div>
            <div class="stat-value" style="color:#d4943a">{{ stats.totalAppointments || 0 }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" v-loading="loading">
          <div class="stat-item">
            <div class="stat-label">合同数</div>
            <div class="stat-value" style="color:#4caf7d">{{ stats.totalContracts || 0 }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="never">
          <div class="table-section-header">热门区域</div>
          <el-table :data="popularAreas" stripe size="small">
            <el-table-column prop="_id" label="区域" />
            <el-table-column prop="count" label="房源数" width="80" />
          </el-table>
          <el-empty v-if="!loading && popularAreas.length === 0" description="暂无数据" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <div class="table-section-header">租金分布</div>
          <div v-if="rentRange.min != null" class="rent-info">
            <div class="rent-row">
              <span class="rent-label">最低租金</span>
              <span class="rent-value">¥{{ rentRange.min?.toLocaleString() }}</span>
            </div>
            <div class="rent-row">
              <span class="rent-label">最高租金</span>
              <span class="rent-value">¥{{ rentRange.max?.toLocaleString() }}</span>
            </div>
            <div class="rent-row">
              <span class="rent-label">平均租金</span>
              <span class="rent-value" style="color:#0d7a7a;font-weight:700">¥{{ rentRange.avg?.toFixed(0)?.toLocaleString() }}</span>
            </div>
          </div>
          <el-empty v-else description="暂无数据" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../../utils/request'

const loading = ref(false)
const stats = ref({ totalUsers: 0, totalHouses: 0, totalAppointments: 0, totalContracts: 0 })
const popularAreas = ref([])
const rentRange = ref({})

async function loadStats() {
  loading.value = true
  try {
    const res = await request.get('/admin/stats')

    const userCount = res.userCount || {}
    const houseCount = res.houseCount || {}
    const totalUsers = Object.values(userCount).reduce((a, b) => a + b, 0)
    const totalHouses = Object.values(houseCount).reduce((a, b) => a + b, 0)

    stats.value = {
      totalUsers,
      totalHouses,
      totalAppointments: res.appointmentCount || 0,
      totalContracts: res.contractCount || 0,
    }

    popularAreas.value = Array.isArray(res.popularAreas) ? res.popularAreas : []
    rentRange.value = res.rentRanges || {}
  } catch {
    // handled
  } finally {
    loading.value = false
  }
}

onMounted(loadStats)
</script>

<style scoped>
.stat-item {
  text-align: center;
  padding: 16px 12px;
}
.stat-label {
  font-size: 14px;
  color: #6b7272;
  margin-bottom: 8px;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
}
.table-section-header {
  font-size: 16px;
  font-weight: 600;
  color: #1a1d1d;
  margin-bottom: 16px;
}
.rent-info {
  padding: 8px 4px;
}
.rent-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #eef0f0;
}
.rent-row:last-child {
  border-bottom: none;
}
.rent-label {
  font-size: 14px;
  color: #6b7272;
}
.rent-value {
  font-size: 16px;
  font-weight: 600;
  color: #1a1d1d;
}
</style>
