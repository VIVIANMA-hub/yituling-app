<template>
  <view class="page">
    <view class="status-bar"></view>
    <view class="nav">
      <view class="back-btn" @click="goBack">‹</view>
      <text class="nav-title">我的响应</text>
      <view class="refresh-btn" @click="fetch">↻</view>
    </view>

    <scroll-view scroll-y class="scroll" :show-scrollbar="false">
      <view v-if="loading" class="empty">加载中…</view>
      <view v-else-if="loadError" class="empty error">{{ loadError }}</view>
      <view v-else-if="!responses.length" class="empty">还没有提交过任何回执。</view>

      <view v-else>
        <view class="hint">作为响应人提交过的所有回执。{{ ttlHint }}</view>
        <view class="card" v-for="r in responses" :key="r._id">
          <view class="card-head">
            <text class="kind-tag" :class="r.kind">{{ kindLabel(r.kind) }}</text>
            <text class="time">{{ formatTime(r.createdAt) }}</text>
          </view>
          <text v-if="r.kind === 'leave'" class="body">
            申请休假 · {{ r.leaveDay }} 号 · {{ r.leaveReason || '未填原因' }}
          </text>
          <text v-else-if="r.kind === 'comment'" class="body">{{ r.commentText }}</text>
          <text v-else class="body">已知悉本月排班</text>
          <text class="meta">分享 ID：{{ r.shareId }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { safeBack } from '@/utils/nav.js'
import { withAuth, isLoggedIn, ensureLogin, getCallerIdentity } from '@/utils/identity.js'

export default {
  data() {
    return {
      loading: true,
      loadError: '',
      responses: []
    }
  },
  computed: {
    ttlHint() {
      const id = getCallerIdentity()
      return id.isVip ? '会员保留 365 天' : '普通用户保留 90 天'
    }
  },
  onLoad() {
    if (!isLoggedIn()) {
      this.loading = false
      this.loadError = '需要登录一图灵账号才能看响应历史'
      ensureLogin()
      return
    }
    this.fetch()
  },
  methods: {
    goBack() { safeBack('/pages/account/index') },
    kindLabel(k) {
      return { agree: '同意', leave: '请假', comment: '备注' }[k] || k
    },
    formatTime(ts) {
      if (!ts) return ''
      const d = new Date(ts)
      return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    },
    async fetch() {
      this.loading = true
      this.loadError = ''
      try {
        const res = await uniCloud.callFunction({
          name: 'schedule-response',
          data: withAuth({ action: 'list_mine' })
        })
        const r = res && res.result
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
.scroll { padding: 12rpx 24rpx 80rpx; }
.empty { padding: 80rpx 24rpx; text-align: center; color: #86868B; font-size: 28rpx; }
.empty.error { color: #D9342B; }
.hint { padding: 8rpx 8rpx 20rpx; font-size: 22rpx; color: #6E6E73; }

.card { background: #fff; border-radius: 22rpx; padding: 24rpx; margin-bottom: 18rpx; }
.card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.kind-tag { padding: 4rpx 14rpx; border-radius: 999rpx; font-size: 20rpx; font-weight: 700; }
.kind-tag.agree { background: #E6F4EA; color: #137333; }
.kind-tag.leave { background: #FFF4E5; color: #B26A00; }
.kind-tag.comment { background: #E8F2FF; color: #1F6FEB; }
.time { font-size: 22rpx; color: #98a2b3; }
.body { display: block; font-size: 26rpx; color: #1D1D1F; line-height: 1.5; }
.meta { display: block; margin-top: 10rpx; font-size: 20rpx; color: #C7C7CC; word-break: break-all; }
</style>
