<template>
  <div class="house-card" @click="handleClick">
    <div class="card-image">
      <div class="image-glow"></div>
      <el-image
        :src="house.images && house.images[0] || '/placeholder-house.svg'"
        fit="cover"
        class="card-img"
      >
        <template #error>
          <div class="image-placeholder">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9.5Z" stroke="#c5e8e8" stroke-width="1.2" fill="none"/>
              <path d="M9 21V13H15V21" stroke="#c5e8e8" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>暂无图片</span>
          </div>
        </template>
      </el-image>
      <div class="card-overlay"></div>
      <el-tag
        :type="statusType"
        class="status-tag"
        size="small"
        effect="dark"
      >
        {{ statusText }}
      </el-tag>
    </div>
    <div class="card-body">
      <h3 class="house-title">{{ house.title }}</h3>
      <div class="house-meta">
        <span class="meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>
          {{ house.area || house.size }}m²
        </span>
        <span class="meta-divider"></span>
        <span class="meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9.5Z"/></svg>
          {{ house.type || house.houseType || '未分类' }}
        </span>
      </div>
      <div class="house-address">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        {{ house.area || '' }}{{ house.address ? ' · ' + house.address : '' }}
      </div>
      <div class="house-footer">
        <div class="price-block">
          <span class="price-symbol">¥</span>
          <span class="price-value">{{ Number(house.rent).toLocaleString() }}</span>
          <span class="price-unit">/月</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
  house: { type: Object, required: true },
  page: { type: Number, default: 1 }
})

function handleClick() {
  sessionStorage.setItem('houseScrollTop', window.scrollY.toString())
  router.push({ path: `/house/${props.house._id || props.house.id}`, query: { fromPage: props.page } })
}

const statusType = computed(() => {
  const map = { pending: 'warning', approved: 'success', rejected: 'danger', rented: 'info', offline: 'info' }
  return map[props.house.status] || 'info'
})

const statusText = computed(() => {
  const map = { pending: '待审核', approved: '已上架', rejected: '未通过', rented: '已租出', offline: '已下架' }
  return map[props.house.status] || props.house.status
})
</script>

<style scoped>
.house-card {
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 320ms cubic-bezier(0.22, 0.61, 0.36, 1),
              box-shadow 320ms cubic-bezier(0.22, 0.61, 0.36, 1),
              border-color 320ms cubic-bezier(0.22, 0.61, 0.36, 1);
  border: 1px solid #eff1f1;
  position: relative;
}

.house-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 32px rgba(29, 67, 89, 0.09), 0 4px 12px rgba(0, 0, 0, 0.04);
  border-color: rgba(29, 67, 89, 0.15);
}

.house-card:active {
  transform: translateY(-3px) scale(0.98);
}

.card-image {
  position: relative;
  height: 200px;
  overflow: hidden;
  background: linear-gradient(135deg, #f5fafa, #eef4f4);
}

.card-img {
  width: 100%;
  height: 100%;
  transition: transform 500ms cubic-bezier(0.22, 0.61, 0.36, 1);
}

.house-card:hover .card-img {
  transform: scale(1.06);
}

.image-glow {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(to top,
    rgba(0, 0, 0, 0.15) 0%,
    transparent 40%);
  transition: opacity 320ms ease;
}

.card-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  border-radius: 14px 14px 0 0;
  transition: background 320ms ease;
}

.house-card:hover .card-overlay {
  background: rgba(29, 67, 89, 0.04);
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #a8d8d8;
  font-size: 14px;
  background: linear-gradient(135deg, #f5fafa, #ecf4f4);
}

.status-tag {
  position: absolute;
  top: 14px;
  right: 14px;
  border: none;
  font-weight: 600;
  letter-spacing: 0.03em;
  z-index: 3;
  border-radius: 5px !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.card-body {
  padding: 18px 20px 20px;
  position: relative;
  z-index: 2;
  background: #fff;
}

.house-title {
  font-size: 17px;
  font-weight: 600;
  color: #1a1c1c;
  margin-bottom: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.005em;
  transition: color 200ms ease;
}

.house-card:hover .house-title {
  color: #1d4359;
}

.house-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: #6b7272;
}

.meta-item svg {
  color: #b6e4e4;
}

.meta-divider {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #d9dcdc;
}

.house-address {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #9ca3a3;
  margin-bottom: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.house-address svg {
  flex-shrink: 0;
  color: #c5e8e8;
}

.house-footer {
  padding-top: 16px;
  border-top: 1px solid #f3f5f5;
}

.price-block {
  display: flex;
  align-items: baseline;
}

.price-symbol {
  font-size: 16px;
  font-weight: 600;
  color: #c56a62;
  margin-right: 2px;
}

.price-value {
  font-size: 24px;
  font-weight: 700;
  color: #c56a62;
  letter-spacing: -0.015em;
  line-height: 1;
}

.price-unit {
  font-size: 12px;
  color: #6b7272;
  margin-left: 3px;
  font-weight: 500;
}
</style>
