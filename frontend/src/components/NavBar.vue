<template>
  <header class="navbar">
    <div class="navbar-inner">
      <router-link to="/" class="logo">
        <span class="logo-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#0d7a7a"/>
                <stop offset="100%" stop-color="#c8943a"/>
              </linearGradient>
            </defs>
            <path d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9.5Z" stroke="url(#logoGrad)" stroke-width="1.8" fill="none"/>
            <path d="M9 21V13H15V21" stroke="url(#logoGrad)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        <span class="logo-text">智慧房屋租赁</span>
      </router-link>

      <nav class="nav-links">
        <template v-if="auth.isLoggedIn">
          <el-dropdown trigger="click" popper-class="nav-dropdown">
            <span class="user-info">
              <el-avatar :size="34" :style="avatarStyle">{{ avatarText }}</el-avatar>
              <span class="username">{{ auth.user?.name || auth.user?.phone || '用户' }}</span>
              <el-icon class="arrow-icon">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <template v-if="auth.isTenant">
                  <el-dropdown-item>
                    <router-link to="/tenant/appointments" class="dropdown-link">我的预约</router-link>
                  </el-dropdown-item>
                  <el-dropdown-item>
                    <router-link to="/tenant/contracts" class="dropdown-link">我的合同</router-link>
                  </el-dropdown-item>
                  <el-dropdown-item>
                    <router-link to="/tenant/reviews" class="dropdown-link">我的评价</router-link>
                  </el-dropdown-item>
                  <el-dropdown-item>
                    <router-link to="/tenant/profile" class="dropdown-link">个人信息</router-link>
                  </el-dropdown-item>
                </template>
                <template v-if="auth.isLandlord">
                  <el-dropdown-item>
                    <router-link to="/landlord/houses" class="dropdown-link">房源管理</router-link>
                  </el-dropdown-item>
                  <el-dropdown-item>
                    <router-link to="/landlord/appointments" class="dropdown-link">预约管理</router-link>
                  </el-dropdown-item>
                  <el-dropdown-item>
                    <router-link to="/landlord/contracts" class="dropdown-link">合同管理</router-link>
                  </el-dropdown-item>
                  <el-dropdown-item>
                    <router-link to="/landlord/finance" class="dropdown-link">财务管理</router-link>
                  </el-dropdown-item>
                </template>
                <template v-if="auth.isAdmin">
                  <el-dropdown-item>
                    <router-link to="/admin/users" class="dropdown-link">用户管理</router-link>
                  </el-dropdown-item>
                  <el-dropdown-item>
                    <router-link to="/admin/houses" class="dropdown-link">房源审核</router-link>
                  </el-dropdown-item>
                  <el-dropdown-item>
                    <router-link to="/admin/stats" class="dropdown-link">数据统计</router-link>
                  </el-dropdown-item>
                  <el-dropdown-item>
                    <router-link to="/admin/settings" class="dropdown-link">系统设置</router-link>
                  </el-dropdown-item>
                </template>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template v-else>
          <router-link to="/login" class="nav-btn-link">登录</router-link>
          <router-link to="/register" class="nav-btn-register">注册</router-link>
        </template>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const avatarText = computed(() => {
  const name = auth.user?.name || auth.user?.phone || 'U'
  return name.charAt(0).toUpperCase()
})

const avatarStyle = computed(() => ({
  background: 'linear-gradient(135deg, #0d7a7a, #2e9e9e)',
  color: '#fff',
  fontWeight: 600,
  fontSize: '14px',
  boxShadow: '0 2px 8px rgba(13, 122, 122, 0.25)'
}))

function handleLogout() {
  auth.logout()
  router.push('/')
}
</script>

<style scoped>
.navbar {
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(16px) saturate(200%);
  -webkit-backdrop-filter: blur(16px) saturate(200%);
  border-bottom: 1px solid rgba(200, 148, 58, 0.12);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: background 260ms cubic-bezier(0.22, 0.61, 0.36, 1);
}

/* Subtle bottom gradient accent */
.navbar::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(13, 122, 122, 0.3) 30%,
    rgba(200, 148, 58, 0.25) 70%,
    transparent 100%);
  pointer-events: none;
}

.navbar-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: opacity 200ms cubic-bezier(0.22, 0.61, 0.36, 1);
}

.logo:hover {
  opacity: 0.82;
}

.logo-icon {
  display: flex;
  align-items: center;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #0d7a7a 0%, #096060 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.01em;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 14px;
}

.nav-btn-link {
  font-size: 15px;
  color: #5c6363;
  padding: 8px 20px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 200ms cubic-bezier(0.22, 0.61, 0.36, 1);
}

.nav-btn-link:hover {
  color: #0d7a7a;
  background: rgba(13, 122, 122, 0.06);
}

.nav-btn-register {
  font-size: 15px;
  color: #fff;
  background: linear-gradient(135deg, #0d7a7a, #0b6e6e);
  padding: 8px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 260ms cubic-bezier(0.22, 0.61, 0.36, 1);
  box-shadow: 0 2px 8px rgba(13, 122, 122, 0.25);
}

.nav-btn-register:hover {
  background: linear-gradient(135deg, #0f8a8a, #0d7a7a);
  box-shadow: 0 4px 16px rgba(13, 122, 122, 0.35);
  transform: translateY(-1px);
}

.nav-btn-register:active {
  transform: scale(0.96);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 5px 12px;
  border-radius: 10px;
  transition: background 200ms cubic-bezier(0.22, 0.61, 0.36, 1);
}

.user-info:hover {
  background: rgba(13, 122, 122, 0.05);
}

.username {
  font-size: 15px;
  font-weight: 500;
  color: #1a1c1c;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.arrow-icon {
  color: #6b7272;
  display: flex;
  align-items: center;
  transition: transform 200ms cubic-bezier(0.22, 0.61, 0.36, 1);
}

.dropdown-link {
  display: block;
  width: 100%;
  color: inherit;
  font-size: 14px;
  padding: 3px 0;
}

:deep(.nav-dropdown) {
  border-radius: 12px;
  border: 1px solid #eff1f1;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.08);
  margin-top: 8px;
}
</style>
