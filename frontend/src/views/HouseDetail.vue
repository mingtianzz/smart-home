<template>
  <div class="page-container">
    <el-button text @click="goBack" class="back-btn">
      <el-icon><ArrowLeft /></el-icon> 返回
    </el-button>

    <div v-loading="loading" v-if="house">
      <el-row :gutter="28">
        <el-col :span="16">
          <div class="image-wrapper" v-if="house.images && house.images.length">
            <div class="main-image-frame">
              <el-image
                :src="house.images[currentImage]"
                fit="cover"
                class="detail-image"
              />
              <!-- 左右箭头 -->
              <template v-if="house.images.length > 1">
                <div class="arrow arrow-left" @click="prevImage">
                  <el-icon><ArrowLeft /></el-icon>
                </div>
                <div class="arrow arrow-right" @click="nextImage">
                  <el-icon><ArrowRight /></el-icon>
                </div>
                <div class="image-counter">{{ currentImage + 1 }} / {{ house.images.length }}</div>
              </template>
            </div>
            <!-- 缩略图列表 -->
            <div class="thumbnail-list" v-if="house.images.length > 1">
              <div
                v-for="(img, idx) in house.images"
                :key="idx"
                class="thumbnail-item"
                :class="{ active: idx === currentImage }"
                @click="currentImage = idx"
              >
                <img :src="img" class="thumbnail-img" />
              </div>
            </div>
          </div>
          <div v-else class="image-wrapper">
            <div class="detail-image-placeholder">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#b6e4e4" stroke-width="1.0">
                <path d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9.5Z"/>
                <path d="M9 21V13H15V21" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>暂无图片</span>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <el-card shadow="never" class="info-card">
            <div class="info-inner">
              <div class="info-status-row">
                <el-tag :type="statusType" size="small" class="status-tag">{{ statusText }}</el-tag>
              </div>
              <h2 class="house-title">{{ house.title }}</h2>
              <div class="price-block">
                <span class="price-symbol">¥</span>
                <span class="price-value">{{ Number(house.rent).toLocaleString() }}</span>
                <span class="price-unit">/月</span>
              </div>

              <div class="divider-line"></div>

              <div class="info-grid">
                <div class="info-cell">
                  <span class="info-label">面积</span>
                  <span class="info-val">{{ house.size }}m²</span>
                </div>
                <div class="info-cell">
                  <span class="info-label">类型</span>
                  <span class="info-val">{{ house.type || house.houseType || '未分类' }}</span>
                </div>
                <div class="info-cell">
                  <span class="info-label">押金</span>
                  <span class="info-val">¥{{ Number(house.deposit || 0).toLocaleString() }}</span>
                </div>
                <div class="info-cell">
                  <span class="info-label">地址</span>
                  <span class="info-val info-address">{{ house.address }}</span>
                </div>
              </div>

              <div class="divider-line"></div>

              <el-button
                type="primary"
                size="large"
                class="appointment-btn"
                @click="handleAppointment"
                :disabled="house.status !== 'approved'"
              >
                预约看房
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="28" class="mt-20">
        <el-col :span="16">
          <!-- Description -->
          <el-card shadow="never" class="section-card">
            <div class="section-heading">
              <span class="section-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </span>
              <h3>房屋描述</h3>
            </div>
            <p class="section-text">{{ house.description || '暂无描述信息' }}</p>
          </el-card>

          <!-- Facilities -->
          <el-card shadow="never" class="section-card" v-if="house.facilities && parseFacilities(house.facilities).length">
            <div class="section-heading">
              <span class="section-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="1" width="22" height="22" rx="2.2"/><path d="M9 1v22M15 1v22M1 9h22M1 15h22"/></svg>
              </span>
              <h3>配套设施</h3>
            </div>
            <div class="facilities-list">
              <span v-for="(f, i) in parseFacilities(house.facilities)" :key="i" class="facility-item">
                {{ f }}
              </span>
            </div>
          </el-card>

          <!-- Landlord -->
          <el-card shadow="never" class="section-card">
            <div class="section-heading">
              <span class="section-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/></svg>
              </span>
              <h3>房东信息</h3>
            </div>
            <div v-if="house.landlordId" class="landlord-info">
              <div class="landlord-avatar">
                {{ (house.landlordId.name || house.landlordId.phone || '?').charAt(0) }}
              </div>
              <div>
                <p class="landlord-name">{{ house.landlordId.name || house.landlordId.phone }}</p>
                <p class="landlord-phone">{{ house.landlordId.phone }}</p>
              </div>
            </div>
            <p v-else class="section-text">暂无房东信息</p>
          </el-card>

          <!-- Reviews -->
          <el-card shadow="never" class="section-card">
            <div class="section-heading">
              <span class="section-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </span>
              <h3>用户评价</h3>
              <span v-if="avgRating > 0" class="rating-badge">
                {{ avgRating }} 分
              </span>
            </div>
            <div v-if="reviews.length === 0" class="empty-reviews">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b6e4e4" stroke-width="1.2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
              <p>暂无评价</p>
              <span class="empty-reviews-hint">成为第一个评价的人</span>
            </div>
            <div v-for="review in reviews" :key="review._id || review.id" class="review-item">
              <div class="review-header">
                <strong class="review-author">{{ review.tenantId?.name || '匿名用户' }}</strong>
                <el-rate :model-value="review.score" disabled :max="5" size="small" />
              </div>
              <p class="review-content">{{ review.content }}</p>
              <el-divider />
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div v-if="!loading && !house" class="empty-state">
      <el-empty description="房源不存在或已被移除" />
    </div>

    <!-- Appointment Dialog -->
    <el-dialog v-model="appointmentDialog" title="预约看房" width="440px" class="appointment-dialog">
      <el-form :model="appointmentForm" label-width="80px">
        <el-form-item label="看房日期">
          <el-date-picker v-model="appointmentForm.date" type="date" placeholder="选择日期" style="width:100%" />
        </el-form-item>
        <el-form-item label="看房时间">
          <el-time-picker v-model="appointmentForm.time" placeholder="选择时间" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="appointmentForm.note" type="textarea" :rows="3" placeholder="可填写您的特殊需求" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="appointmentDialog = false">取消</el-button>
        <el-button type="primary" @click="submitAppointment" :loading="apptLoading">确认预约</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import request from '../utils/request'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const house = ref(null)
const reviews = ref([])
const loading = ref(false)
const apptLoading = ref(false)
const appointmentDialog = ref(false)
const currentImage = ref(0)

const appointmentForm = ref({ date: '', time: '', note: '' })

function goBack() {
  const fromPage = route.query.fromPage
  if (fromPage) {
    router.push({ path: '/', query: { fromPage } })
  } else {
    router.back()
  }
}

const avgRating = computed(() => {
  if (!reviews.value.length) return 0
  const sum = reviews.value.reduce((s, r) => s + (r.score || 0), 0)
  return Math.round((sum / reviews.value.length) * 10) / 10
})

const statusType = computed(() => {
  const m = { pending: 'warning', approved: 'success', rejected: 'danger', rented: 'info', offline: 'info' }
  return m[house.value?.status] || 'info'
})
const statusText = computed(() => {
  const m = { pending: '待审核', approved: '已上架', rejected: '未通过', rented: '已租出', offline: '已下架' }
  return m[house.value?.status] || house.value?.status
})

function parseFacilities(f) {
  if (Array.isArray(f)) return f
  if (typeof f === 'string') {
    try { return JSON.parse(f) } catch { return f.split(/[,，、\s]+/).filter(Boolean) }
  }
  return []
}

function prevImage() {
  const len = house.value?.images?.length || 0
  if (len > 1) {
    currentImage.value = (currentImage.value - 1 + len) % len
  }
}

function nextImage() {
  const len = house.value?.images?.length || 0
  if (len > 1) {
    currentImage.value = (currentImage.value + 1) % len
  }
}

async function loadHouse() {
  loading.value = true
  try {
    const res = await request.get(`/houses/${route.params.id}`)
    house.value = res.house || res.data || res
    if (house.value?.landlordId && typeof house.value.landlordId === 'string') {
      try { house.value.landlordId = JSON.parse(house.value.landlordId) } catch {}
    }
  } catch { house.value = null } finally { loading.value = false }
}

async function loadReviews() {
  try { const res = await request.get(`/reviews/house/${route.params.id}`); reviews.value = res.reviews || res.data || [] } catch { reviews.value = [] }
}

function handleAppointment() {
  if (!auth.isLoggedIn) { ElMessage.warning('请先登录'); return router.push('/login') }
  if (auth.isTenant) { appointmentDialog.value = true } else { ElMessage.warning('只有租户可以预约看房') }
}

async function submitAppointment() {
  if (!appointmentForm.value.date || !appointmentForm.value.time) { ElMessage.warning('请选择看房日期和时间'); return }
  apptLoading.value = true
  try {
    const d = appointmentForm.value.date.toISOString().split('T')[0]
    const t = appointmentForm.value.time.toTimeString().split(' ')[0]
    await request.post('/appointments', { houseId: route.params.id, visitDate: d, visitTime: t, contact: appointmentForm.value.note || '', remark: appointmentForm.value.note || '' })
    ElMessage.success('预约成功，等待房东确认'); appointmentDialog.value = false
  } catch {} finally { apptLoading.value = false }
}

onMounted(() => { loadHouse(); loadReviews() })
</script>

<style scoped>
.back-btn {
  margin-bottom: 24px;
  font-size: 14px;
  color: #6b7272;
  transition: color 200ms ease;
}
.back-btn:hover { color: #1d4359; }

/* ── Image Gallery ── */
.image-wrapper {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(29, 67, 89, 0.06);
}

.main-image-frame {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
}

.detail-image {
  width: 100%;
  height: 440px;
  display: block;
  transition: transform 600ms cubic-bezier(0.22, 0.61, 0.36, 1);
}

.arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255,255,255,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #1d4359;
  font-size: 18px;
  z-index: 2;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.arrow:hover {
  background: #fff;
  box-shadow: 0 2px 12px rgba(0,0,0,0.18);
}
.arrow-left { left: 12px; }
.arrow-right { right: 12px; }

.image-counter {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: rgba(0,0,0,0.55);
  color: #fff;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  z-index: 2;
}

.thumbnail-list {
  display: flex;
  gap: 8px;
  padding: 12px 4px 4px;
  overflow-x: auto;
}

.thumbnail-item {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.2s;
  opacity: 0.6;
}
.thumbnail-item.active {
  border-color: #1d4359;
  opacity: 1;
}
.thumbnail-item:hover {
  opacity: 1;
}

.thumbnail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.detail-image-placeholder {
  width: 100%;
  height: 440px;
  background: linear-gradient(135deg, #f5fafa, #ecf4f4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: #a8d8d8;
  font-size: 15px;
  border-radius: 16px;
}

/* ── Info Card ── */
.info-card {
  border-radius: 16px;
  border: 1px solid #eff1f1;
  height: 100%;
}
.info-card :deep(.el-card__body) { padding: 0; }

.info-inner {
  padding: 28px;
}

.info-status-row {
  margin-bottom: 14px;
}

.house-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1c1c;
  letter-spacing: -0.015em;
  line-height: 1.3;
  margin-bottom: 18px;
}

.price-block {
  display: flex;
  align-items: baseline;
  margin-bottom: 20px;
}
.price-symbol { font-size: 18px; font-weight: 600; color: #c56a62; margin-right: 3px; }
.price-value  { font-size: 34px; font-weight: 700; color: #c56a62; letter-spacing: -0.015em; line-height: 1; }
.price-unit   { font-size: 14px; color: #6b7272; margin-left: 4px; font-weight: 500; }

.divider-line {
  height: 1px;
  background: linear-gradient(90deg, #e4e8e8, transparent);
  margin: 20px 0;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 20px;
  margin-bottom: 20px;
}
.info-cell {}
.info-label { font-size: 12px; color: #9ca3a3; display: block; margin-bottom: 3px; letter-spacing: 0.02em; }
.info-val   { font-size: 14px; color: #1a1c1c; font-weight: 500; }
.info-address { line-height: 1.4; }

.appointment-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  letter-spacing: 0.02em;
}

/* ── Section Cards ── */
.section-card {
  margin-top: 24px;
  border-radius: 14px;
  border: 1px solid #eff1f1;
  transition: box-shadow 260ms cubic-bezier(0.22, 0.61, 0.36, 1);
}
.section-card:hover {
  box-shadow: 0 4px 16px rgba(29, 67, 89, 0.05);
}
.section-card :deep(.el-card__body) { padding: 28px; }

.section-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}
.section-heading h3 {
  font-size: 17px;
  font-weight: 600;
  color: #1a1c1c;
  letter-spacing: -0.005em;
}
.section-icon {
  display: flex;
  align-items: center;
  color: #93d3d3;
}

.section-text {
  color: #2c3030;
  line-height: 1.85;
  font-size: 14px;
}

.rating-badge {
  margin-left: auto;
  font-size: 13px;
  font-weight: 600;
  color: #c8943a;
  background: rgba(200, 148, 58, 0.08);
  padding: 3px 10px;
  border-radius: 6px;
}

/* ── Facilities ── */
.facilities-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.facility-item {
  display: inline-block;
  padding: 6px 16px;
  font-size: 13px;
  color: #1d4359;
  background: linear-gradient(135deg, #d9f2f2, #e8f5f5);
  border-radius: 7px;
  font-weight: 500;
  transition: transform 160ms ease;
}
.facility-item:hover {
  transform: translateY(-1px);
}

/* ── Landlord ── */
.landlord-info {
  display: flex;
  align-items: center;
  gap: 16px;
}
.landlord-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1d4359, #2e9e9e);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
  flex-shrink: 0;
  box-shadow: 0 2px 10px rgba(29, 67, 89, 0.2);
}
.landlord-name  { font-size: 15px; font-weight: 600; color: #1a1c1c; margin-bottom: 2px; }
.landlord-phone { font-size: 13px; color: #6b7272; }

/* ── Reviews ── */
.empty-reviews {
  text-align: center;
  padding: 28px;
  color: #9ca3a3;
  font-size: 14px;
}
.empty-reviews svg { margin-bottom: 12px; opacity: 0.5; }
.empty-reviews-hint { font-size: 12px; color: #c0c5c5; display: block; margin-top: 4px; }

.review-item { padding: 16px 0; }
.review-item:last-child .el-divider { display: none; }

.review-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 10px;
}
.review-author { font-size: 14px; color: #1a1c1c; }
.review-content { color: #2c3030; line-height: 1.7; font-size: 14px; }

.empty-state { padding: 60px 0; }
</style>
