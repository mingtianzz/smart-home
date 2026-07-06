import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/', name: 'Home', component: () => import('../views/HomePage.vue') },
  { path: '/login', name: 'Login', component: () => import('../views/LoginPage.vue') },
  { path: '/login/:role', name: 'RoleLogin', component: () => import('../views/LoginPage.vue'), props: true },
  { path: '/register', name: 'Register', component: () => import('../views/RegisterPage.vue') },
  { path: '/house/:id', name: 'HouseDetail', component: () => import('../views/HouseDetail.vue') },
  {
    path: '/tenant',
    component: () => import('../views/tenant/TenantLayout.vue'),
    meta: { requiresAuth: true, role: 'tenant' },
    children: [
      { path: 'appointments', name: 'MyAppointments', component: () => import('../views/tenant/MyAppointments.vue') },
      { path: 'contracts', name: 'MyContracts', component: () => import('../views/tenant/MyContracts.vue') },
      { path: 'reviews', name: 'MyReviews', component: () => import('../views/tenant/MyReviews.vue') },
      { path: 'profile', name: 'MyProfile', component: () => import('../views/tenant/MyProfile.vue') }
    ]
  },
  {
    path: '/landlord',
    component: () => import('../views/landlord/LandlordLayout.vue'),
    meta: { requiresAuth: true, role: 'landlord' },
    children: [
      { path: 'houses', name: 'HouseManage', component: () => import('../views/landlord/HouseManage.vue') },
      { path: 'houses/new', name: 'HouseNew', component: () => import('../views/landlord/HouseForm.vue') },
      { path: 'houses/:id/edit', name: 'HouseEdit', component: () => import('../views/landlord/HouseForm.vue') },
      { path: 'appointments', name: 'AppointmentManage', component: () => import('../views/landlord/AppointmentManage.vue') },
      { path: 'contracts', name: 'ContractManage', component: () => import('../views/landlord/ContractManage.vue') },
      { path: 'finance', name: 'FinanceManage', component: () => import('../views/landlord/FinanceManage.vue') }
    ]
  },
  {
    path: '/admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      { path: 'users', name: 'UserManage', component: () => import('../views/admin/UserManage.vue') },
      { path: 'houses', name: 'HouseReview', component: () => import('../views/admin/HouseReview.vue') },
      { path: 'stats', name: 'DataStats', component: () => import('../views/admin/DataStats.vue') },
      { path: 'settings', name: 'SystemSettings', component: () => import('../views/admin/SystemSettings.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth) {
    if (!auth.isLoggedIn) {
      return next('/login')
    }
    if (to.meta.role && auth.role !== to.meta.role) {
      return next('/')
    }
  }

  next()
})

export default router
