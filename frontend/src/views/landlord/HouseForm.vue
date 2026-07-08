<template>
  <div>
    <div class="card-header">
      <h3>{{ isEdit ? '编辑房源' : '发布新房源' }}</h3>
    </div>
    <el-card shadow="never" class="form-card-wrapper">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        v-loading="loading"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入房源标题" size="large" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" prop="landlordName">
              <el-input v-model="form.landlordName" placeholder="请输入您的姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系方式" prop="landlordPhone">
              <el-input v-model="form.landlordPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="面积(m²)" prop="size">
              <el-input-number v-model="form.size" :min="1" :max="10000" style="width:100%" size="large" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="租金(元)" prop="rent">
              <el-input-number v-model="form.rent" :min="0" :max="999999" style="width:100%" size="large" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="押金(元)" prop="deposit">
              <el-input-number v-model="form.deposit" :min="0" :max="999999" style="width:100%" size="large" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="区域" prop="area">
              <el-input v-model="form.area" placeholder="如: 朝阳区" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类型" prop="type">
              <el-select v-model="form.type" style="width:100%">
                <el-option label="整租" value="整租" />
                <el-option label="合租" value="合租" />
                <el-option label="单间" value="单间" />
                <el-option label="公寓" value="公寓" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" placeholder="请输入详细地址" />
        </el-form-item>
        <el-form-item label="配套设施" prop="facilities">
          <el-select v-model="form.facilities" multiple filterable allow-create default-first-option style="width:100%">
            <el-option label="WIFI" value="WIFI" />
            <el-option label="空调" value="空调" />
            <el-option label="冰箱" value="冰箱" />
            <el-option label="洗衣机" value="洗衣机" />
            <el-option label="热水器" value="热水器" />
            <el-option label="电视" value="电视" />
            <el-option label="暖气" value="暖气" />
            <el-option label="床" value="床" />
            <el-option label="衣柜" value="衣柜" />
            <el-option label="电梯" value="电梯" />
            <el-option label="车位" value="车位" />
          </el-select>
        </el-form-item>
        <el-form-item label="房屋图片" prop="images">
          <div class="upload-area">
            <div class="image-preview-list">
              <div
                v-for="(img, idx) in form.images"
                :key="idx"
                class="image-preview-item"
              >
                <img :src="img" class="preview-img" />
                <div class="preview-mask" @click="removeImage(idx)">
                  <el-icon><Delete /></el-icon>
                </div>
              </div>
              <label
                v-if="form.images.length < 4"
                class="upload-trigger"
                :class="{ 'is-uploading': isUploading }"
              >
                <input
                  type="file"
                  hidden
                  accept="image/jpeg,image/png,image/gif,image/webp,image/bmp"
                  @change="handleFileChange"
                  :disabled="isUploading"
                />
                <el-icon v-if="!isUploading"><Plus /></el-icon>
                <el-icon v-else class="is-loading"><Loading /></el-icon>
              </label>
            </div>
            <div class="upload-tip">支持 jpg/png/gif/webp 格式，单张不超过 10MB，最多 4 张</div>
          </div>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请描述房屋的详细情况" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="submitLoading" class="submit-btn" size="large">
            {{ isEdit ? '保存修改' : '提交审核' }}
          </el-button>
          <el-button @click="$router.back()" class="cancel-btn" size="large">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Delete, Loading } from '@element-plus/icons-vue'
import request from '../../utils/request'

const route = useRoute()
const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const submitLoading = ref(false)
const isUploading = ref(false)

const isEdit = computed(() => !!route.params.id)

const form = reactive({
  title: '',
  landlordName: '',
  landlordPhone: '',
  area: null,
  rent: null,
  deposit: null,
  type: '',
  size: '',
  address: '',
  facilities: [],
  images: [],
  description: ''
})

const rules = {
  title: [{ required: true, message: '请输入房源标题', trigger: 'blur' }],
  landlordName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  landlordPhone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }, { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }],
  size: [{ required: true, message: '请输入面积', trigger: 'blur' }],
  rent: [{ required: true, message: '请输入租金', trigger: 'blur' }],
  address: [{ required: true, message: '请输入地址', trigger: 'blur' }]
}

// 文件选择后自动上传到后端
async function handleFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 10MB')
    e.target.value = ''
    return
  }
  const formData = new FormData()
  formData.append('file', file)
  isUploading.value = true
  try {
    const res = await request.post('/upload', formData)
    form.images.push(res.url)
  } catch {
    // 错误已在拦截器中处理
  } finally {
    isUploading.value = false
    e.target.value = ''
  }
}

// 移除图片
function removeImage(idx) {
  form.images.splice(idx, 1)
}

async function loadHouse() {
  if (!isEdit.value) return
  loading.value = true
  try {
    const res = await request.get(`/houses/${route.params.id}`)
    const h = res.house || res.data || res
    form.title = h.title || ''; form.area = h.area; form.rent = h.rent; form.deposit = h.deposit
    form.type = h.type || ''; form.size = h.size || ''; form.address = h.address || ''
    form.description = h.description || ''
    form.landlordName = h.landlordId?.name || ''
    form.landlordPhone = h.landlordId?.phone || ''
    if (Array.isArray(h.facilities)) form.facilities = [...h.facilities]
    else if (typeof h.facilities === 'string') {
      try { form.facilities = JSON.parse(h.facilities) } catch { form.facilities = [] }
    }
    form.images = Array.isArray(h.images) ? [...h.images] : []
  } catch { ElMessage.error('加载房源信息失败') } finally { loading.value = false }
}

async function submitForm() {
  const valid = await formRef.value.validate().catch(() => {})
  if (!valid) return
  submitLoading.value = true
  try {
    const data = { ...form, facilities: form.facilities, images: form.images }
    if (isEdit.value) {
      await request.put(`/houses/${route.params.id}`, data)
      ElMessage.success('保存成功')
    } else {
      await request.post('/houses', data)
      ElMessage.success('发布成功，等待管理员审核')
    }
    router.push('/landlord/houses')
  } catch {} finally { submitLoading.value = false }
}

onMounted(loadHouse)
</script>

<style scoped>
.form-card-wrapper {
  max-width: 820px;
  border-radius: 14px;
  border: 1px solid #eff1f1;
}
.form-card-wrapper :deep(.el-card__body) { padding: 32px 36px; }

.upload-area {
  width: 100%;
}

.image-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.image-preview-item {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  border: 1px solid #e4e8e8;
  cursor: pointer;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.preview-mask {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  opacity: 0;
  transition: opacity 0.2s;
}
.image-preview-item:hover .preview-mask {
  opacity: 1;
}

.upload-trigger {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  border: 2px dashed #c0c8c8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #a0a8a8;
  cursor: pointer;
  transition: all 0.2s;
  box-sizing: border-box;
}
.upload-trigger:hover {
  border-color: #1d4359;
  color: #1d4359;
}
.upload-trigger.is-uploading {
  cursor: not-allowed;
  pointer-events: none;
}

.is-loading {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.upload-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

.submit-btn { min-width: 130px; }
.cancel-btn { color: #6b7272; border-color: #e4e8e8; }
.cancel-btn:hover { color: #1d4359; border-color: #1d4359; background: rgba(29, 67, 89, 0.04); }
</style>
