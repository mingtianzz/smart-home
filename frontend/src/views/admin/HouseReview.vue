<template>
  <div>
    <div class="card-header">
      <h3>房源审核</h3>
      <el-select v-model="statusFilter" placeholder="筛选状态" @change="loadHouses" style="width:140px" clearable>
        <el-option label="待审核" value="pending" />
        <el-option label="已上架" value="approved" />
        <el-option label="未通过" value="rejected" />
      </el-select>
    </div>

    <el-table :data="houses" v-loading="loading" stripe style="width:100%">
      <el-table-column prop="title" label="标题" min-width="160" show-overflow-tooltip />
      <el-table-column label="房东" width="130">
        <template #default="{ row }">{{ row.landlordId?.name || '--' }}</template>
      </el-table-column>
      <el-table-column prop="size" label="面积" width="80">
        <template #default="{ row }">{{ row.size }}㎡</template>
      </el-table-column>
      <el-table-column prop="rent" label="租金" width="100">
        <template #default="{ row }">¥{{ row.rent?.toLocaleString() }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small" class="status-tag">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="showDetail(row)">查看</el-button>
          <template v-if="row.status === 'pending'">
            <el-button type="primary" size="small" @click="handleReview(row._id, 'approved')">通过</el-button>
            <el-button size="small" @click="showRejectDialog(row._id)">拒绝</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-if="!loading && houses.length === 0" description="暂无房源记录" />

    <!-- 查看详情弹窗 -->
    <el-dialog v-model="detailDialog" title="房源详情" width="640px">
      <el-descriptions v-if="detailData" :column="2" border>
        <el-descriptions-item label="标题" :span="2">{{ detailData.title }}</el-descriptions-item>
        <el-descriptions-item label="租金">¥{{ detailData.rent }}</el-descriptions-item>
        <el-descriptions-item label="面积">{{ detailData.size }}㎡</el-descriptions-item>
        <el-descriptions-item label="地址" :span="2">{{ detailData.area }} {{ detailData.address }}</el-descriptions-item>
        <el-descriptions-item label="房东">{{ detailData.landlordName || detailData.landlordId?.name || '--' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ detailData.landlordPhone || detailData.landlordId?.phone || '--' }}</el-descriptions-item>
        <el-descriptions-item label="房屋图片" :span="2">
          <div v-if="detailData.images && detailData.images.length > 0" class="house-images">
            <img v-for="(img, idx) in detailData.images" :key="idx" :src="img" class="review-img" />
          </div>
          <span v-else>暂无图片</span>
        </el-descriptions-item>
        <el-descriptions-item label="状态" :span="2">
          <el-tag :type="statusType(detailData.status)" size="small" class="status-tag">{{ statusText(detailData.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="detailData.description" label="描述" :span="2">{{ detailData.description }}</el-descriptions-item>
        <el-descriptions-item v-if="detailData.rejectReason" label="拒绝原因" :span="2">
          <span style="color:#d9605a">{{ detailData.rejectReason }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 拒绝原因弹窗 -->
    <el-dialog v-model="rejectDialog" title="拒绝原因" width="420px">
      <p style="margin-bottom:12px;color:#6b7272;font-size:13px;">请填写拒绝该房源的原因，将通知房东</p>
      <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="请输入拒绝原因" />
      <template #footer>
        <el-button @click="rejectDialog = false">取消</el-button>
        <el-button type="primary" @click="submitReject" :loading="rejectLoading">确定提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../../utils/request'

const houses = ref([])
const loading = ref(false)
const statusFilter = ref('pending')

const detailDialog = ref(false)
const detailData = ref(null)

const rejectDialog = ref(false)
const rejectReason = ref('')
const rejectId = ref(null)
const rejectLoading = ref(false)

function statusType(s) {
  return { pending: 'warning', approved: 'success', rejected: 'danger', rented: 'info', offline: 'info' }[s] || 'info'
}
function statusText(s) {
  return { pending: '待审核', approved: '已上架', rejected: '未通过', rented: '已租出', offline: '已下架' }[s] || s
}

function showDetail(row) {
  detailData.value = row
  detailDialog.value = true
}

async function loadHouses() {
  loading.value = true
  try {
    const params = { status: statusFilter.value || undefined }
    const res = await request.get('/houses/all', { params })
    houses.value = Array.isArray(res) ? res : (res.houses || res.data || [])
  } catch {
    houses.value = []
  } finally {
    loading.value = false
  }
}

async function handleReview(id, status) {
  try {
    await request.put(`/houses/${id}/review`, { status, rejectReason: '' })
    ElMessage.success(status === 'approved' ? '房源已上架' : '操作成功')
    loadHouses()
  } catch {}
}

function showRejectDialog(id) {
  rejectId.value = id
  rejectReason.value = ''
  rejectDialog.value = true
}

async function submitReject() {
  if (!rejectReason.value) {
    ElMessage.warning('请输入拒绝原因')
    return
  }
  rejectLoading.value = true
  try {
    await request.put(`/houses/${rejectId.value}/review`, { status: 'rejected', rejectReason: rejectReason.value })
    ElMessage.success('已拒绝该房源')
    rejectDialog.value = false
    loadHouses()
  } catch {
    // handled
  } finally {
    rejectLoading.value = false
  }
}

onMounted(loadHouses)
</script>

<style scoped>
.house-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.review-img {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e4e8e8;
}
</style>
