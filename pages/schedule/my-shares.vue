<template>
  <view class="page">
    <view class="status-bar"></view>
    <view class="nav">
      <view class="back-btn" @click="goBack">‹</view>
      <text class="nav-title">我的分享</text>
      <view class="refresh-btn" @click="fetch">↻</view>
    </view>

    <scroll-view scroll-y class="scroll" :show-scrollbar="false">
      <view v-if="loading" class="empty">加载中…</view>
      <view v-else-if="loadError" class="empty error">{{ loadError }}</view>
      <view v-else-if="!shares.length" class="empty">还没有发布过排班分享。回排班助手复制一次链接即可。</view>

      <view v-else>
        <view class="hint">点击任意一条进入回执列表。{{ ttlHint }}</view>
        <view
          v-for="s in shares"
          :key="s._id"
          class="card"
          :class="{ expired: s.expired }"
          @click="openResponses(s)"
        >
          <view class="card-head">
            <text class="title">{{ s.year }}年{{ s.month }}月 · {{ s.doctorCount }} 位医生</text>
            <text v-if="s.expired" class="expired-tag">已过期</text>
          </view>
          <text class="subtitle">{{ s.title || '排班分享' }}</text>
          <view class="foot">
            <text class="meta">发布于 {{ formatTime(s.createdAt) }}</text>
            <text class="meta">{{ s.expired ? '已过期' : '至 ' + formatDate(s.expiresAt) }}</text>
          </view>
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
      shares: []
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
      this.loadError = '需要登录一图灵账号才能看分享历史'
      ensureLogin()
      return
    }
    this.fetch()
  },
  methods: {
    goBack() { safeBack('/pages/schedule/schedule') },
    formatDate(ts) {
      if (!ts) return ''
      const d = new Date(ts)
      return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
    },
    formatTime(ts) {
      if (!ts) return ''
      const d = new Date(ts)
      return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    },
    async fetch() {
      this.loading = true
      this.loadError = ''
      try {
        const res = await uniCloud.callFunction({
          name: 'schedule-share',
          data: withAuth({ action: 'list_mine' })
        })
        const r = res && res.result
        if (!r || !r.ok) {
          this.loadError = (r && r.message) || '加载失败'
          return
        }
        this.shares = r.shares || []
      } catch (e) {
        this.loadError = '网络异常：' + (e && e.message || 'unknown')
      } finally {
        this.loading = false
      }
    },
    openResponses(s) {
      if (s.expired) {
        uni.showToast({ title: '该分享已过期，无法查看回执', icon: 'none' })
        return
      }
      uni.navigateTo({ url: `/pages/schedule/responses?s=${encodeURIComponent(s._id)}` })
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
.card.expired { opacity: 0.6; }
.card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 14rpx; }
.title { font-size: 28rpx; font-weight: 800; color: #1D1D1F; }
.expired-tag { padding: 4rpx 14rpx; border-radius: 999rpx; font-size: 20rpx; background: #F2F3F5; color: #86868B; }
.subtitle { display: block; font-size: 24rpx; color: #6E6E73; margin-top: 8rpx; }
.foot { display: flex; justify-content: space-between; margin-top: 14rpx; }
.meta { font-size: 22rpx; color: #98a2b3; }
</style>
