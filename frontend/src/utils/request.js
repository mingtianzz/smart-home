import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 15000
})

request.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

request.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response) {
      const { status, data } = error.response
      if (status === 401) {
        // 登录页的 401 显示错误信息，不跳转
        if (window.location.pathname === '/login' || window.location.pathname === '/register') {
          ElMessage.error(data?.message || '账号或密码错误')
        } else {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          window.location.href = '/login'
        }
      } else if (status === 403) {
        ElMessage.error('没有权限执行此操作')
      } else if (status === 422) {
        ElMessage.error(data?.message || '数据验证失败')
      } else {
        ElMessage.error(data?.message || '请求失败')
      }
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }
    return Promise.reject(error)
  }
)

export default request
