<template>
  <div class="page-container">
    <!-- 轮播图区域 -->
    <div class="carousel-section">
      <div class="carousel-container">
        <div
          class="carousel-track"
          :style="{ transform: `translateX(-${currentIndex * 100}%)`, transition: `transform ${transitionDuration}s ease` }"
        >
          <div
            v-for="(slide, idx) in slides"
            :key="idx"
            class="carousel-slide"
          >
            <img :src="slide.image" :alt="'轮播图 ' + (idx + 1)" />
          </div>
        </div>

        <!-- 固定悬浮文字（始终在轮播图上方，不随图片变化） -->
        <div class="carousel-overlay">
          <div class="carousel-content">
            <div class="welcome-badge">
              <span class="badge-dot"></span>
              优质房源 · 每日更新
            </div>
            <h1 class="carousel-title">找到您的理想居所</h1>
            <p class="carousel-subtitle">浏览精选优质房源，一键预约轻松看房</p>
            <div class="carousel-stats">
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
        </div>

        <!-- 指示器小圆点 -->
        <div class="carousel-dots">
          <span
            v-for="(_, idx) in slides"
            :key="idx"
            class="dot"
            :class="{ active: idx === currentIndex }"
            @click="goTo(idx)"
          ></span>
        </div>
      </div>
    </div>

    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline class="search-form" @submit.prevent="searchHouses">
        <div class="search-fields">
          <el-form-item label="关键词" class="search-item">
            <el-input v-model="searchForm.keyword" placeholder="搜索房源标题/地址" clearable class="s-input" />
          </el-form-item>
          <el-form-item label="区域" class="search-item">
            <el-input v-model="searchForm.area" placeholder="如: 朝阳区" clearable class="s-input narrow" />
          </el-form-item>
          <el-form-item label="租金" class="search-item">
            <div class="rent-group">
              <el-input-number v-model="searchForm.minRent" :min="0" placeholder="最低" class="s-input narrow" controls-position="right" />
              <span class="range-sep">—</span>
              <el-input-number v-model="searchForm.maxRent" :min="0" placeholder="最高" class="s-input narrow" controls-position="right" />
            </div>
          </el-form-item>
          <el-form-item label="类型" class="search-item">
            <el-select v-model="searchForm.type" placeholder="房屋类型" clearable class="s-input narrow">
              <el-option label="整租" value="整租" />
              <el-option label="合租" value="合租" />
              <el-option label="单间" value="单间" />
              <el-option label="公寓" value="公寓" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item class="search-actions">
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
import { ref, computed, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'
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

// ── 轮播图 ──
const slides = [
  { image: '/carousel/1.png', title: '找到您的理想居所', subtitle: '浏览精选优质房源，一键预约轻松看房' },
  { image: '/carousel/2.png', title: '品质生活 从这里开始', subtitle: '海量真实房源，满足不同居住需求' },
  { image: '/carousel/3.png', title: '专业租赁服务', subtitle: '在线预约看房，快速签约入住' },
  { image: '/carousel/4.png', title: '安心租房保障', subtitle: '实名认证房东，真实房源信息' },
  { image: '/carousel/5.png', title: '便捷租房体验', subtitle: '随时随地在线找房，轻松安家' },
  { image: '/carousel/6.png', title: '租房客平台', subtitle: '房东租客直连，省去中介费用' },
]

const currentIndex = ref(0)
const transitionDuration = 0.5
let autoPlayTimer = null

function goTo(idx) {
  if (idx === currentIndex.value) return
  currentIndex.value = idx
  resetAutoPlay()
}

function goNext() {
  currentIndex.value = (currentIndex.value + 1) % slides.length
  resetAutoPlay()
}

function goPrev() {
  currentIndex.value = (currentIndex.value - 1 + slides.length) % slides.length
  resetAutoPlay()
}

function startAutoPlay() {
  stopAutoPlay()
  autoPlayTimer = setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % slides.length
  }, 4000)
}

function stopAutoPlay() {
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer)
    autoPlayTimer = null
  }
}

function resetAutoPlay() {
  stopAutoPlay()
  startAutoPlay()
}

onMounted(() => {
  startAutoPlay()
  const fromPage = parseInt(route.query.fromPage)
  if (fromPage && fromPage > 0) {
    page.value = fromPage
  }
  loadHouses()
})

onBeforeUnmount(() => {
  stopAutoPlay()
})

watch(() => route.query.fromPage, (newVal) => {
  const fromPage = parseInt(newVal)
  if (fromPage && fromPage > 0) {
    page.value = fromPage
    loadHouses()
  }
})

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
</script>

<style scoped>
/* ── 轮播图 ── */
.carousel-section {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 20px 0;
}

.carousel-container {
  position: relative;
  width: 100%;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.carousel-track {
  display: flex;
  width: 100%;
}

.carousel-slide {
  min-width: 100%;
  position: relative;
  aspect-ratio: 21 / 9;
  overflow: hidden;
}

.carousel-slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.carousel-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    rgba(29, 67, 89, 0.75) 0%,
    rgba(0, 0, 0, 0.35) 50%,
    rgba(29, 67, 89, 0.25) 100%
  );
}

.carousel-content {
  text-align: center;
  padding: 20px;
  animation: fadeInUp 0.6s ease backwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.welcome-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  color: #fff;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(8px);
  padding: 5px 16px;
  border-radius: 20px;
  margin-bottom: 20px;
  letter-spacing: 0.02em;
}

.badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #fff;
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.6; transform: scale(1.3); }
}

.carousel-title {
  font-size: clamp(24px, 4vw, 42px);
  font-weight: 700;
  color: #fff;
  margin-bottom: 10px;
  letter-spacing: -0.025em;
  line-height: 1.2;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.carousel-subtitle {
  font-size: clamp(14px, 1.6vw, 18px);
  color: rgba(255, 255, 255, 0.85);
  font-weight: 400;
  margin-bottom: 24px;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}

.carousel-stats {
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
  font-size: clamp(16px, 2vw, 22px);
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.01em;
  line-height: 1.2;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}

.chip-label {
  font-size: clamp(11px, 1vw, 13px);
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.02em;
}

.stat-divider {
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.3);
}

/* 指示器 */
.carousel-dots {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 2;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: all 0.3s ease;
}

.dot:hover {
  background: rgba(255, 255, 255, 0.7);
}

.dot.active {
  background: #fff;
  width: 28px;
  border-radius: 5px;
}

/* ── Search ── */
.search-card {
  margin: 24px auto;
  max-width: 1200px;
  border-radius: 16px;
  border: 1px solid #eef0f0;
  padding: 0 8px;
}

.search-form {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: nowrap;
  gap: 12px;
  width: 100%;
}

.search-fields {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  flex: 1;
  min-width: 0;
}

.search-item {
  margin-bottom: 0 !important;
  flex-shrink: 0;
}

.search-item :deep(.el-form-item__label) {
  font-size: 13px;
  color: #516473;
  font-weight: 500;
  padding-right: 6px;
}

.s-input {
  width: 200px;
}

.s-input.narrow {
  width: 110px;
}

.s-input :deep(.el-input__wrapper) {
  border-radius: 8px;
  border: 1px solid #e4e9ec;
  box-shadow: none;
  transition: border-color 0.2s;
}

.s-input :deep(.el-input__wrapper:hover) {
  border-color: #1d4359;
}

.s-input :deep(.el-input__wrapper.is-focus) {
  border-color: #1d4359;
  box-shadow: 0 0 0 1px #1d4359;
}

.rent-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.range-sep {
  color: #c0c5c5;
  font-weight: 500;
  font-size: 14px;
  margin: 0 2px;
}

.search-actions {
  margin-bottom: 0 !important;
  flex-shrink: 0;
  margin-left: auto;
}

.search-btn {
  min-width: 100px;
  height: 36px;
  border-radius: 8px;
}

.reset-btn {
  color: #516473;
  border-color: #d6dee4;
  height: 36px;
  border-radius: 8px;
}

.reset-btn:hover {
  color: #1d4359;
  border-color: #1d4359;
  background: rgba(29, 67, 89, 0.04);
}

/* ── 响应式：窄屏时搜索换行 ── */
@media (max-width: 1000px) {
  .search-form {
    flex-wrap: wrap;
  }
  .search-fields {
    flex-wrap: wrap;
  }
  .search-actions {
    margin-left: 0;
    width: 100%;
    justify-content: center;
  }
}

/* ── Grid animation ── */
.house-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

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
