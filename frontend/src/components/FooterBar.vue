<template>
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9.5Z" stroke="#93d3d3" stroke-width="1.5" fill="none"/>
          <path d="M9 21V13H15V21" stroke="#93d3d3" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>{{ year }} 智慧房屋租赁系统</span>
      </div>
      <div class="footer-divider"></div>
      <div class="footer-tagline">专业 · 可信赖 · 高效</div>
    </div>
  </footer>
</template>

<script setup>
const year = new Date().getFullYear()
</script>

<style scoped>
.footer {
  background: #fff;
  border-top: 1px solid #eff1f1;
  margin-top: auto;
  position: relative;
}

.footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(200, 148, 58, 0.2), transparent);
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #9ca3a3;
}

.footer-divider {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #d9dcdc;
  display: none;
}

.footer-tagline {
  font-size: 12px;
  color: #c0c5c5;
  letter-spacing: 0.05em;
}
</style>
