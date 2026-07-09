<template>
  <view class="page">
    <view class="status-bar"></view>
    <view class="nav">
      <view class="back-btn" @click="goBack">‹</view>
      <text class="nav-title">社区审核</text>
      <view class="nav-actions">
        <view class="cobook-btn" @click="goCobook">共创库</view>
        <view class="refresh-btn" @click="fetch">↻</view>
      </view>
    </view>

    <!-- 今日审核计数 -->
    <view class="kpi-row" v-if="todayStats.approved + todayStats.rejected > 0">
      <view class="kpi-cell">
        <text class="kpi-num approved">{{ todayStats.approved }}</text>
        <text class="kpi-label">今日通过</text>
      </view>
      <view class="kpi-cell">
        <text class="kpi-num rejected">{{ todayStats.rejected }}</text>
        <text class="kpi-label">今日驳回</text>
      </view>
      <view class="kpi-cell">
        <text class="kpi-num">{{ posts.length }}</text>
        <text class="kpi-label">当前列表</text>
      </view>
    </view>

    <!-- 状态切换 -->
    <view class="status-tabs">
      <view
        v-for="tab in statusTabs"
        :key="tab.key"
        class="status-tab"
        :class="{ active: currentStatus === tab.key }"
        @click="switchStatus(tab.key)"
      >{{ tab.label }}</view>
    </view>

    <scroll-view scroll-y class="scroll" :show-scrollbar="false">
      <view v-if="loading" class="empty">加载中…</view>
      <view v-else-if="loadError" class="empty error">{{ loadError }}</view>
      <view v-else-if="!posts.length" class="empty">{{ emptyHint }}</view>

      <view v-else>
        <view class="summary">{{ summaryText }}</view>
        <view class="card" v-for="p in posts" :key="p._id">
          <view class="card-head">
            <text class="author">{{ p.ownerName || '医生' }}</text>
            <text class="meta">{{ formatTime(p.createdAt) }}</text>
          </view>

          <text class="post-title">{{ p.title || '（无标题）' }}</text>

          <!-- 完整正文（不截断） -->
          <text class="post-body">{{ p.content }}</text>

          <!-- 风险词扫描结果 -->
          <view class="risk-row" v-if="getRiskHits(p).length">
            <text class="risk-label">⚠ 风险词命中：</text>
            <text class="risk-word" v-for="w in getRiskHits(p)" :key="w">{{ w }}</text>
          </view>

          <!-- 完整结构化字段 -->
          <view class="fields">
            <view class="field-row">
              <text class="field-key">分类</text>
              <text class="field-val">{{ p.category || '未标注' }}</text>
            </view>
            <view class="field-row">
              <text class="field-key">模态</text>
              <text class="field-val">{{ modalityLabel(p.modality) }}</text>
            </view>
            <view class="field-row">
              <text class="field-key">部位</text>
              <text class="field-val">{{ p.bodyPart || '未标注' }}</text>
            </view>
            <view class="field-row">
              <text class="field-key">体位</text>
              <text class="field-val">{{ p.positioning || '未标注' }}</text>
            </view>
            <view class="field-row" v-if="p.ctCompanion">
              <text class="field-key">CT 配对</text>
              <text class="field-val">{{ p.ctCompanion }}</text>
            </view>
            <view class="field-row">
              <text class="field-key">权重</text>
              <text class="field-val">{{ p.publishWeight || 0 }} {{ (p.publishWeight || 0) >= 110 ? '· 出书候选' : '' }}</text>
            </view>
            <view class="field-row" v-if="p.authorized">
              <text class="field-key">授权出书</text>
              <text class="field-val authorized">是</text>
            </view>
          </view>

          <view class="tags" v-if="p.tags && p.tags.length">
            <text class="tag" v-for="t in p.tags.slice(0, 8)" :key="t"># {{ t }}</text>
          </view>

          <!-- 驳回理由（仅 rejected 状态显示） -->
          <view class="reject-banner" v-if="currentStatus === 'rejected' && p.rejectReason">
            <text>驳回理由：{{ p.rejectReason }}</text>
          </view>

          <view class="row-actions">
            <template v-if="currentStatus === 'pending'">
              <view class="btn reject" @click="reject(p)">驳回</view>
              <view class="btn approve" @click="approve(p)">通过</view>
            </template>
            <template v-else>
              <view class="btn revoke" @click="revoke(p)">撤回审核（转回待审）</view>
            </template>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { safeBack } from '@/utils/nav.js'
import { withAuth, ensureLogin, isLoggedIn } from '@/utils/identity.js'

const MODALITY_LABELS = {
  ct_plain: 'CT平扫', ct_enhance: 'CT增强', cta: 'CTA',
  mri: 'MRI', xray: 'X线', dsa: 'DSA', nm: '核医学', us: '超声'
}

// 与 notes-post 云函数保持一致的合规黑名单
const MEDICAL_ADVICE_WORDS = ['诊断建议', '临床处置建议', '用药建议', '分诊建议', '建议用药', '建议治疗', '自动判断病情', '辅助判断病情', '确诊', '首选药', '处方']
const PIPL_HINT_REGEX = /(\d{17}[\dXx]|\d{15}|[一-龥]{2,8}(?:医院|人民医院|妇幼|附属医院))/g

function todayKey() {
  const d = new Date()
  return `ytl_review_kpi_${d.getFullYear()}_${d.getMonth() + 1}_${d.getDate()}`
}

export default {
  data() {
    return {
      posts: [],
      loading: true,
      loadError: '',
      todayStats: { approved: 0, rejected: 0 },
      currentStatus: 'pending',
      statusTabs: [
        { key: 'pending', label: '待审' },
        { key: 'approved', label: '已通过' },
        { key: 'rejected', label: '已驳回' }
      ]
    }
  },
  computed: {
    emptyHint() {
      const map = { pending: '当前没有待审核的帖子。', approved: '还没有已通过的帖子。', rejected: '还没有被驳回的帖子。' }
      return map[this.currentStatus] || '暂无数据。'
    },
    summaryText() {
      const map = {
        pending: `待审 ${this.posts.length} 条 · 按创建时间升序（旧的优先审）`,
        approved: `已通过 ${this.posts.length} 条 · 按时间倒序；如需撤回请点底部按钮。`,
        rejected: `已驳回 ${this.posts.length} 条 · 按时间倒序；驳回理由会展示给作者。`
      }
      return map[this.currentStatus] || ''
    }
  },
  onLoad() {
    if (!isLoggedIn()) {
      this.loading = false
      this.loadError = '审核员需要登录一图灵账号'
      ensureLogin()
      return
    }
    this.loadTodayStats()
  },
  onShow() {
    if (!isLoggedIn()) return
    this.fetch()
  },
  methods: {
    goBack() { safeBack('/pages/index/index') },
    goCobook() { uni.navigateTo({ url: '/pages/admin/cobook' }) },
    modalityLabel(k) { return MODALITY_LABELS[k] || k || '未标注' },
    formatTime(ts) {
      if (!ts) return ''
      const d = new Date(ts)
      return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    },
    getRiskHits(p) {
      const text = `${p.title || ''}\n${p.content || ''}\n${p.ctCompanion || ''}`
      const hits = []
      for (const w of MEDICAL_ADVICE_WORDS) {
        if (text.includes(w)) hits.push(w)
      }
      const piplMatches = text.match(PIPL_HINT_REGEX)
      if (piplMatches) hits.push(...piplMatches.slice(0, 3))
      return [...new Set(hits)]
    },
    loadTodayStats() {
      try {
        const raw = uni.getStorageSync(todayKey())
        if (raw) this.todayStats = typeof raw === 'string' ? JSON.parse(raw) : raw
      } catch (e) { /* 静默 */ }
    },
    bumpStats(action) {
      const k = action === 'review_approve' ? 'approved' : 'rejected'
      this.todayStats[k]++
      uni.setStorageSync(todayKey(), JSON.stringify(this.todayStats))
    },
    switchStatus(status) {
      if (this.currentStatus === status) return
      this.currentStatus = status
      this.fetch()
    },
    async fetch() {
      this.loading = true
      this.loadError = ''
      try {
        const res = await uniCloud.callFunction({
          name: 'notes-post',
          data: withAuth({ action: 'list_admin_posts', status: this.currentStatus, limit: 50 })
        })
        const r = res && res.result
        if (!r || !r.ok) {
          this.loadError = (r && r.message) || '加载失败（可能你不在 admins.json 白名单里）'
          return
        }
        this.posts = r.posts || []
      } catch (e) {
        this.loadError = '网络异常：' + (e && e.message || 'unknown')
      } finally {
        this.loading = false
      }
    },
    async revoke(p) {
      const yes = await new Promise(r => uni.showModal({
        title: '撤回审核',
        content: `撤回《${p.title || '无标题'}》的${this.currentStatus === 'approved' ? '通过' : '驳回'}决定？该帖将回到待审队列。`,
        success: rr => r(rr.confirm)
      }))
      if (!yes) return
      uni.showLoading({ title: '撤回中...' })
      try {
        const res = await uniCloud.callFunction({
          name: 'notes-post',
          data: withAuth({ action: 'review_revoke', postId: p._id })
        })
        uni.hideLoading()
        const r = res && res.result
        if (!r || !r.ok) {
          uni.showModal({ title: '撤回失败', content: (r && r.message) || '请稍后重试', showCancel: false })
          return
        }
        this.posts = this.posts.filter(x => x._id !== p._id)
        uni.showToast({ title: '已撤回，回到待审', icon: 'success' })
      } catch (e) {
        uni.hideLoading()
        uni.showModal({ title: '网络异常', content: e && e.message || 'unknown', showCancel: false })
      }
    },
    async approve(p) {
      const riskHits = this.getRiskHits(p)
      const extra = riskHits.length ? `\n\n⚠ 该帖检测到风险词：${riskHits.join('、')}。确认无误后再通过。` : ''
      const yes = await new Promise(r => uni.showModal({
        title: '通过审核',
        content: `通过《${p.title || '无标题'}》？通过后将在公开 feed 展示。${extra}`,
        success: rr => r(rr.confirm)
      }))
      if (!yes) return
      await this._review(p._id, 'review_approve', '')
    },
    async reject(p) {
      const r = await new Promise(resolve => uni.showModal({
        title: '驳回原因',
        editable: true,
        placeholderText: '简要原因（200 字内），会显示给作者',
        success: rr => resolve(rr.confirm ? (rr.content || '不符合社区规范') : null)
      }))
      if (r == null) return
      await this._review(p._id, 'review_reject', r)
    },
    async _review(postId, action, rejectReason) {
      uni.showLoading({ title: '处理中...' })
      try {
        const res = await uniCloud.callFunction({
          name: 'notes-post',
          data: withAuth({ action, postId, rejectReason })
        })
        uni.hideLoading()
        const r = res && res.result
        if (!r || !r.ok) {
          uni.showModal({ title: '处理失败', content: (r && r.message) || '请稍后重试', showCancel: false })
          return
        }
        this.posts = this.posts.filter(p => p._id !== postId)
        this.bumpStats(action)
        uni.showToast({ title: action === 'review_approve' ? '已通过' : '已驳回', icon: 'success' })
      } catch (e) {
        uni.hideLoading()
        uni.showModal({ title: '网络异常', content: e && e.message || 'unknown', showCancel: false })
      }
    }
  }
}
</script>

<style>
.page { background: #F5F5F7; min-height: 100vh; }
.status-bar { height: var(--status-bar-height); background: #F5F5F7; }
.nav { display: flex; align-items: center; padding: 20rpx 24rpx; gap: 16rpx; }
.back-btn { font-size: 48rpx; color: #1F6FEB; width: 56rpx; }
.refresh-btn { font-size: 36rpx; color: #1F6FEB; width: 56rpx; text-align: right; }
.nav-title { font-size: 32rpx; font-weight: 700; color: #1D1D1F; flex: 1; }
.nav-actions { display: flex; align-items: center; gap: 12rpx; }
.cobook-btn { padding: 8rpx 18rpx; background: #FFF4E5; color: #B26A00; border-radius: 999rpx; font-size: 22rpx; font-weight: 700; white-space: nowrap; }

.kpi-row { display: flex; margin: 0 24rpx 16rpx; background: #fff; border-radius: 18rpx; padding: 18rpx 8rpx; }
.kpi-cell { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4rpx; }
.kpi-num { font-size: 32rpx; font-weight: 800; color: #1D1D1F; }
.kpi-num.approved { color: #137333; }
.kpi-num.rejected { color: #D9342B; }
.kpi-label { font-size: 20rpx; color: #86868B; font-weight: 700; }

.status-tabs { display: flex; gap: 10rpx; padding: 0 24rpx 14rpx; overflow-x: auto; }
.status-tab { padding: 10rpx 22rpx; border-radius: 999rpx; background: #fff; font-size: 24rpx; color: #6E6E73; white-space: nowrap; }
.status-tab.active { background: #1F6FEB; color: #fff; font-weight: 700; }

.scroll { padding: 12rpx 24rpx 80rpx; }
.empty { padding: 80rpx 24rpx; text-align: center; color: #86868B; font-size: 28rpx; }
.empty.error { color: #D9342B; }
.summary { padding: 12rpx 8rpx 20rpx; font-size: 24rpx; color: #6E6E73; }

.card { background: #fff; border-radius: 20rpx; padding: 24rpx; margin-bottom: 18rpx; }
.card-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12rpx; }
.author { font-size: 26rpx; font-weight: 700; color: #1D1D1F; }
.meta { font-size: 22rpx; color: #86868B; }
.post-title { font-size: 30rpx; font-weight: 700; color: #1D1D1F; display: block; margin-bottom: 10rpx; }
.post-body { font-size: 26rpx; color: #1D1D1F; line-height: 1.5; display: block; }

.risk-row { margin-top: 16rpx; padding: 14rpx 18rpx; background: #FDE2E1; border-radius: 12rpx; display: flex; flex-wrap: wrap; align-items: center; gap: 12rpx; }
.risk-label { font-size: 22rpx; color: #D9342B; font-weight: 800; }
.risk-word { padding: 4rpx 12rpx; background: #fff; color: #D9342B; font-size: 22rpx; font-weight: 700; border-radius: 6rpx; }

.fields { margin-top: 18rpx; padding: 16rpx 18rpx; background: #F8FAFC; border-radius: 14rpx; display: flex; flex-direction: column; gap: 8rpx; }
.field-row { display: flex; gap: 18rpx; align-items: flex-start; }
.field-key { width: 130rpx; font-size: 22rpx; color: #6E6E73; font-weight: 700; flex-shrink: 0; }
.field-val { flex: 1; font-size: 22rpx; color: #1D1D1F; font-weight: 700; line-height: 1.4; }
.field-val.authorized { color: #137333; }

.tags { display: flex; flex-wrap: wrap; gap: 8rpx; margin-top: 14rpx; }
.tag { font-size: 22rpx; color: #1F6FEB; background: #E8F2FF; padding: 4rpx 14rpx; border-radius: 8rpx; }
.row-actions { display: flex; gap: 16rpx; margin-top: 20rpx; }
.btn { flex: 1; padding: 20rpx; text-align: center; border-radius: 14rpx; font-size: 28rpx; font-weight: 700; }
.btn.approve { background: #1F6FEB; color: #fff; }
.btn.reject { background: #F5F5F7; color: #D9342B; }
.btn.revoke { background: #FFF4E5; color: #B26A00; }

.reject-banner { margin-top: 16rpx; padding: 14rpx 18rpx; background: #FDE2E1; border-radius: 12rpx; }
.reject-banner text { font-size: 22rpx; color: #D9342B; font-weight: 700; line-height: 1.5; }
</style>
