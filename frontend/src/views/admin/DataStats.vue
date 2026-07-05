<template>
  <div>
    <div class="card-header">
      <h3>数据统计</h3>
    </div>

    <el-row :gutter="22" style="margin-top:24px">
      <el-col :span="6">
        <el-card shadow="never" v-loading="loading" class="stat-card stat-card-teal">
          <div class="stat-item">
            <div class="stat-label">用户总数</div>
            <div class="stat-value">{{ stats.totalUsers || 0 }}</div>
            <div class="stat-trend">累计注册</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" v-loading="loading" class="stat-card stat-card-green">
          <div class="stat-item">
            <div class="stat-label">房源总数</div>
            <div class="stat-value">{{ stats.totalHouses || 0 }}</div>
            <div class="stat-trend">在平台上架</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" v-loading="loading" class="stat-card stat-card-gold">
          <div class="stat-item">
            <div class="stat-label">预约数</div>
            <div class="stat-value">{{ stats.totalAppointments || 0 }}</div>
            <div class="stat-trend">本月累计</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" v-loading="loading" class="stat-card stat-card-rose">
          <div class="stat-item">
            <div class="stat-label">合同数</div>
            <div class="stat-value">{{ stats.totalContracts || 0 }}</div>
            <div class="stat-trend">已完成签约</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="22" style="margin-top:22px">
      <el-col :span="12">
        <el-card shadow="never" class="section-card">
          <div class="section-header">热门区域</div>
          <div v-if="popularAreas.length > 0">
            <div v-for="(area, idx) in popularAreas" :key="idx" class="area-row">
              <span class="area-rank" :class="'rank-' + (idx + 1)">{{ idx + 1 }}</span>
              <span class="area-name">{{ area._id || area.name }}</span>
              <span class="area-count">{{ area.count }}套</span>
              <div class="area-bar">
                <div class="area-bar-fill" :style="{ width: barWidth(idx) }"></div>
              </div>
            </div>
          </div>
          <div v-else class="empty-inner">暂无数据</div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never" class="section-card">
          <div class="section-header">租金分布</div>
          <div v-if="rentRange.min != null" class="rent-dashboard">
            <div class="rent-row">
              <span class="rent-label">最低</span>
              <span class="rent-value">¥{{ rentRange.min?.toLocaleString() }}</span>
            </div>
            <div class="rent-row rent-row-highlight">
              <span class="rent-label">平均</span>
              <span class="rent-value rent-value-avg">¥{{ Math.round(rentRange.avg || 0).toLocaleString() }}</span>
            </div>
            <div class="rent-row">
              <span class="rent-label">最高</span>
              <span class="rent-value">¥{{ rentRange.max?.toLocaleString() }}</span>
            </div>
          </div>
          <div v-else class="empty-inner">暂无数据</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '../../utils/request'

const loading = ref(false)
const stats = ref({ totalUsers: 0, totalHouses: 0, totalAppointments: 0, totalContracts: 0 })
const popularAreas = ref([])
const rentRange = ref({})

const maxAreaCount = computed(() => {
  if (!popularAreas.value.length) return 1
  return Math.max(...popularAreas.value.map(a => a.count || 0))
})

function barWidth(idx) {
  const count = popularAreas.value[idx]?.count || 0
  const pct = (count / maxAreaCount.value) * 100
  return Math.max(pct, 12) + '%'
}

async function loadStats() {
  loading.value = true
  try {
    const res = await request.get('/admin/stats')
    const userCount = res.userCount || {}
    const houseCount = res.houseCount || {}
    stats.value = {
      totalUsers: Object.values(userCount).reduce((a, b) => a + b, 0),
      totalHouses: Object.values(houseCount).reduce((a, b) => a + b, 0),
      totalAppointments: res.appointmentCount || 0,
      totalContracts: res.contractCount || 0,
    }
    popularAreas.value = Array.isArray(res.popularAreas) ? res.popularAreas : []
    rentRange.value = res.rentRanges || {}
  } catch {} finally { loading.value = false }
}

onMounted(loadStats)
</script>

<style scoped>
/* ── Stat Cards ── */
.stat-card {
  border-radius: 14px;
  border: 1px solid #eff1f1;
  transition: box-shadow 260ms cubic-bezier(0.22, 0.61, 0.36, 1);
  position: relative;
  overflow: hidden;
}
.stat-card:hover {
  box-shadow: 0 6px 20px rgba(13, 122, 122, 0.06);
}
.stat-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 3px;
}
.stat-card-teal::before  { background: linear-gradient(90deg, #0d7a7a, #3ba3a3); }
.stat-card-green::before { background: linear-gradient(90deg, #3ba3a3, #4caf7d); }
.stat-card-gold::before  { background: linear-gradient(90deg, #c8943a, #d4a84e); }
.stat-card-rose::before  { background: linear-gradient(90deg, #c56a62, #d4807a); }

.stat-item { text-align: center; padding: 24px 12px 20px; }
.stat-label { font-size: 13px; color: #9ca3a3; margin-bottom: 10px; font-weight: 500; }
.stat-value { font-size: 32px; font-weight: 700; letter-spacing: -0.015em; color: #1a1c1c; }
.stat-trend { font-size: 11px; color: #c0c5c5; margin-top: 5px; }

/* ── Section Cards ── */
.section-card {
  border-radius: 14px;
  border: 1px solid #eff1f1;
}
.section-header {
  font-size: 17px;
  font-weight: 600;
  color: #1a1c1c;
  margin-bottom: 20px;
}

/* ── Area Ranking ── */
.area-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 0;
  border-bottom: 1px solid #f3f5f5;
}
.area-row:last-child { border-bottom: none; }
.area-rank {
  width: 22px; height: 22px;
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: #fff;
  flex-shrink: 0;
}
.rank-1 { background: linear-gradient(135deg, #c8943a, #d4a84e); }
.rank-2 { background: linear-gradient(135deg, #b0b8b8, #c5cccc); }
.rank-3 { background: linear-gradient(135deg, #c8943a, #d4a84e); opacity: 0.7; }
.area-rank:not(.rank-1):not(.rank-2):not(.rank-3) {
  background: #eef0f0; color: #9ca3a3;
}
.area-name { font-size: 14px; color: #1a1c1c; font-weight: 500; width: 80px; flex-shrink: 0; }
.area-count { font-size: 13px; color: #6b7272; flex-shrink: 0; }
.area-bar { flex: 1; height: 5px; background: #f3f5f5; border-radius: 3px; overflow: hidden; }
.area-bar-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, #0d7a7a, #3ba3a3);
  transition: width 500ms cubic-bezier(0.22, 0.61, 0.36, 1);
}

/* ── Rent Dashboard ── */
.rent-dashboard { padding: 4px 0; }
.rent-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #f3f5f5;
}
.rent-row:last-child { border-bottom: none; }
.rent-row-highlight {
  background: linear-gradient(90deg, rgba(13, 122, 122, 0.03), transparent);
  margin: 0 -20px; padding: 15px 20px; border-radius: 8px;
}
.rent-label { font-size: 14px; color: #6b7272; font-weight: 500; }
.rent-value { font-size: 18px; font-weight: 600; color: #1a1c1c; }
.rent-value-avg { color: #0d7a7a; font-size: 22px; font-weight: 700; }

.empty-inner { text-align: center; padding: 28px; color: #9ca3a3; font-size: 14px; }
</style>
