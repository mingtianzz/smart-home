<template>
  <div class="page-container">
    <!-- Welcome Hero Section -->
    <div class="welcome-section">
      <div class="welcome-badge">
        <span class="badge-dot"></span>
        优质房源 · 每日更新
      </div>
      <h1 class="welcome-title">找到您的理想居所</h1>
      <p class="welcome-subtitle">浏览精选优质房源，一键预约轻松看房</p>
      <div class="welcome-stats">
        <div class="stat-chip">
          <span class="chip-value">{{ displayCount }}</span>
          <span class="chip-label">在租房源</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-chip">
          <span class="chip-value">100%</span>
          <span class="chip-label">真实房源</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-chip">
          <span class="chip-value">免费</span>
          <span class="chip-label">预约看房</span>
        </div>
      </div>
    </div>

    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="搜索房源标题/地址" clearable class="search-input-keyword" />
        </el-form-item>
        <el-form-item label="区域">
          <el-input v-model="searchForm.area" placeholder="如: 朝阳区" style="width:120px" clearable />
        </el-form-item>
        <el-form-item label="租金">
          <el-input-number v-model="searchForm.minRent" :min="0" placeholder="最低" style="width:120px" />
          <span class="range-sep">—</span>
          <el-input-number v-model="searchForm.maxRent" :min="0" placeholder="最高" style="width:120px" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="searchForm.type" placeholder="房屋类型" clearable style="width:140px">
            <el-option label="整租" value="整租" />
            <el-option label="合租" value="合租" />
            <el-option label="单间" value="单间" />
            <el-option label="公寓" value="公寓" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchHouses" :loading="loading" class="search-btn">搜索房源</el-button>
          <el-button @click="resetSearch" class="reset-btn">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="house-grid" v-loading="loading">
      <div
        v-for="house in houses"
        :key="house._id || house.id"
        class="grid-item-enter"
        :style="{ animationDelay: (houses.indexOf(house) * 40) + 'ms' }"
      >
        <HouseCard :house="house" :page="page" />
      </div>
    </div>

    <div class="text-center mt-20" v-if="total > 0">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="loadHouses"
      />
    </div>

    <div v-if="!loading && houses.length === 0" class="empty-state">
      <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#b8ccd9" stroke-width="1.0">
        <path d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9.5Z"/>
        <path d="M9 21V13H15V21" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <p>暂无匹配的房源</p>
      <span class="empty-hint">试试调整搜索条件或关键词</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import request from '../utils/request'
import HouseCard from '../components/HouseCard.vue'

const route = useRoute()

const houses = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = 12
const total = ref(0)

const searchForm = ref({
  keyword: '',
  area: '',
  minRent: null,
  maxRent: null,
  type: ''
})

const displayCount = computed(() => total.value || houses.value.length || 0)

async function loadHouses() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize, status: 'approved' }
    if (searchForm.value.keyword) params.keyword = searchForm.value.keyword
    if (searchForm.value.area) params.area = searchForm.value.area
    if (searchForm.value.minRent !== null) params.minRent = searchForm.value.minRent
    if (searchForm.value.maxRent !== null) params.maxRent = searchForm.value.maxRent
    if (searchForm.value.type) params.type = searchForm.value.type
    const res = await request.get('/houses', { params })
    houses.value = res.houses || res.data || []
    total.value = res.total || houses.value.length
  } catch {
    houses.value = []
    total.value = 0
  } finally {
    loading.value = false
    await nextTick()
    const savedScroll = parseInt(sessionStorage.getItem('houseScrollTop'))
    if (savedScroll && route.query.fromPage) {
      window.scrollTo({ top: savedScroll, behavior: 'smooth' })
      sessionStorage.removeItem('houseScrollTop')
    }
  }
}

function searchHouses() {
  page.value = 1
  loadHouses()
}

function resetSearch() {
  searchForm.value = { keyword: '', area: '', minRent: null, maxRent: null, type: '' }
  page.value = 1
  loadHouses()
}

onMounted(() => {
  const fromPage = parseInt(route.query.fromPage)
  if (fromPage && fromPage > 0) {
    page.value = fromPage
  }
  loadHouses()
})

watch(() => route.query.fromPage, (newVal) => {
  const fromPage = parseInt(newVal)
  if (fromPage && fromPage > 0) {
    page.value = fromPage
    loadHouses()
  }
})
</script>

<style scoped>
/* ── Welcome Section ── */
.welcome-section {
  text-align: center;
  padding: 48px 20px 44px;
  position: relative;
}

.welcome-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  color: #516473;
  background: rgba(29, 67, 89, 0.06);
  padding: 5px 16px;
  border-radius: 20px;
  margin-bottom: 20px;
  letter-spacing: 0.02em;
}

.badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1d4359, #3b637a);
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.6; transform: scale(1.3); }
}

.welcome-title {
  font-size: 34px;
  font-weight: 700;
  color: #1a1c1c;
  margin-bottom: 12px;
  letter-spacing: -0.025em;
  line-height: 1.2;
  background: linear-gradient(135deg, #1a1c1c 0%, #1d4359 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-subtitle {
  font-size: 17px;
  color: #9ca3a3;
  font-weight: 400;
  margin-bottom: 28px;
}

.welcome-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.stat-chip {
  text-align: center;
}

.chip-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #1d4359;
  letter-spacing: -0.01em;
  line-height: 1.2;
}

.chip-label {
  font-size: 12px;
  color: #9ca3a3;
  letter-spacing: 0.02em;
}

.stat-divider {
  width: 1px;
  height: 24px;
  background: #d6dee4;
}

/* ── Search ── */
.search-input-keyword {
  width: 220px;
}

.range-sep {
  margin: 0 10px;
  color: #c0c5c5;
  font-weight: 500;
}

.search-btn {
  min-width: 110px;
}

.reset-btn {
  color: #516473;
  border-color: #d6dee4;
  font-weight: 500;
}

.reset-btn:hover {
  color: #1d4359;
  border-color: #1d4359;
  background: rgba(29, 67, 89, 0.04);
}

/* ── Grid animation ── */
.grid-item-enter {
  animation: card-enter 480ms cubic-bezier(0.22, 0.61, 0.36, 1) backwards;
}

@keyframes card-enter {
  from { opacity: 0; transform: translateY(16px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1);     }
}

/* ── Empty State ── */
.empty-state {
  text-align: center;
  padding: 72px 20px;
  color: #9ca3a3;
}

.empty-state svg {
  margin-bottom: 18px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 16px;
  margin-bottom: 6px;
  color: #516473;
}

.empty-hint {
  font-size: 13px;
  color: #c0c5c5;
}
</style>
