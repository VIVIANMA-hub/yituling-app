<template>
  <view class="page">
    <view class="status-bar"></view>
    <view class="nav">
      <view class="back-btn" @click="goBack">‹</view>
      <view>
        <text class="nav-title">回执列表</text>
        <text class="nav-subtitle">{{ subtitleText }}</text>
      </view>
      <view class="placeholder"></view>
    </view>

    <scroll-view scroll-y class="scroll" :show-scrollbar="false">
      <view v-if="loading" class="empty">加载中…</view>
      <view v-else-if="loadError" class="empty error">{{ loadError }}</view>
      <view v-else-if="!responses.length" class="empty">还没有人响应。</view>

      <template v-else>
        <view class="summary">
          <view class="stat">
            <text class="stat-num">{{ stats.agree }}</text>
            <text class="stat-label">同意</text>
          </view>
          <view class="stat">
            <text class="stat-num">{{ stats.leave }}</text>
            <text class="stat-label">请假/调班</text>
          </view>
          <view class="stat">
            <text class="stat-num">{{ stats.comment }}</text>
            <text class="stat-label">备注</text>
          </view>
        </view>

        <view class="card" v-for="r in responses" :key="r._id">
          <view class="row-head">
            <text class="responder">{{ r.responderName || '医生' }}</text>
            <text class="kind-tag" :class="r.kind">{{ kindLabel(r.kind) }}</text>
          </view>
          <text v-if="r.kind === 'leave'" class="row-body">
            {{ shareMonthLabel(r) }}/{{ r.leaveDay }} 申请休假 · {{ r.leaveReason || '未填原因' }}
          </text>
          <text v-else-if="r.kind === 'comment'" class="row-body">{{ r.commentText }}</text>
          <text v-else class="row-body">已知悉本月排班</text>
          <text class="row-time">{{ formatTime(r.createdAt) }}</text>
        </view>
      </template>
    </scroll-view>
  </view>
</template>

<script>
import { safeBack } from '@/utils/nav.js'
import { withAuth, ensureLogin, isLoggedIn } from '@/utils/identity.js'

export default {
  data() {
    return {
      shareId: '',
      loading: true,
      loadError: '',
      responses: []
    }
  },
  computed: {
    subtitleText() {
      return `${this.responses.length} 条回执`
    },
    stats() {
      const out = { agree: 0, leave: 0, comment: 0 }
      this.responses.forEach(r => { if (out[r.kind] != null) out[r.kind]++ })
      return out
    }
  },
  onLoad(query) {
    this.shareId = String(query && query.s || '')
    if (!this.shareId) {
      this.loading = false
      this.loadError = '链接里缺少分享 ID（s 参数）'
      return
    }
    this.fetchList()
  },
  methods: {
    goBack() { safeBack('/pages/schedule/schedule') },
    async fetchList() {
      if (!isLoggedIn()) {
        this.loading = false
        this.loadError = '需要登录一图灵账号才能查看回执'
        ensureLogin()
        return
      }
      try {
        const callRes = await uniCloud.callFunction({
          name: 'schedule-response',
          data: withAuth({ action: 'list_by_share', shareId: this.shareId })
        })
        const r = callRes && callRes.result
        if (!r || !r.ok) {
          this.loadError = (r && r.message) || '加载失败'
          return
        }
        this.responses = r.responses || []
      } catch (e) {
        this.loadError = '网络异常：' + (e && e.message || 'unknown')
      } finally {
        this.loading = false
      }
    },
    kindLabel(k) {
      return { agree: '同意', leave: '请假', comment: '备注' }[k] || k
    },
    shareMonthLabel(r) {
      // 简化：list 接口当前没回带 share.month，靠 createdAt 推断
      const d = new Date(r.createdAt)
      return `${d.getMonth() + 1}`
    },
    formatTime(ts) {
      if (!ts) return ''
      const d = new Date(ts)
      return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }
  }
}
</script>

<style>
.page { background: #F5F5F7; min-height: 100vh; }
.status-bar { height: var(--status-bar-height); background: #F5F5F7; }
.nav { display: flex; align-items: center; padding: 20rpx 24rpx; gap: 16rpx; }
.back-btn { font-size: 48rpx; color: #1F6FEB; width: 56rpx; }
.placeholder { width: 56rpx; }
.nav-title { font-size: 32rpx; font-weight: 700; color: #1D1D1F; display: block; }
.nav-subtitle { font-size: 22rpx; color: #6E6E73; display: block; margin-top: 4rpx; }

.scroll { padding: 12rpx 24rpx 80rpx; }
.empty { padding: 80rpx 24rpx; text-align: center; color: #86868B; font-size: 28rpx; }
.empty.error { color: #D9342B; }

.summary {
  background: #fff; border-radius: 22rpx; padding: 24rpx;
  display: flex; justify-content: space-around; margin-bottom: 20rpx;
}
.stat { display: flex; flex-direction: column; align-items: center; }
.stat-num { font-size: 40rpx; font-weight: 800; color: #1F6FEB; }
.stat-label { font-size: 22rpx; color: #6E6E73; margin-top: 4rpx; }

.card { background: #fff; border-radius: 18rpx; padding: 22rpx; margin-bottom: 16rpx; }
.row-head { display: flex; align-items: center; gap: 12rpx; }
.responder { font-size: 28rpx; font-weight: 700; color: #1D1D1F; }
.kind-tag {
  padding: 4rpx 14rpx; border-radius: 999rpx; font-size: 20rpx;
}
.kind-tag.agree { background: #E6F4EA; color: #137333; }
.kind-tag.leave { background: #FFF4E5; color: #B26A00; }
.kind-tag.comment { background: #E8F2FF; color: #1F6FEB; }

.row-body { display: block; margin-top: 12rpx; font-size: 26rpx; color: #1D1D1F; line-height: 1.5; }
.row-time { display: block; margin-top: 10rpx; font-size: 22rpx; color: #98a2b3; }
</style>
