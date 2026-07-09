<template>
  <view class="page">
    <view class="status-bar"></view>
    <view class="nav">
      <view class="back-btn" @click="goBack">‹</view>
      <text class="nav-title">邀请同事</text>
      <view class="placeholder"></view>
    </view>

    <scroll-view scroll-y class="scroll" :show-scrollbar="false">
      <view v-if="loading" class="empty">加载中…</view>
      <view v-else-if="loadError" class="empty error">{{ loadError }}</view>

      <template v-else>
        <view class="hero">
          <text class="hero-title">每邀请 1 位医生注册并完成首次有效操作</text>
          <text class="hero-points">+{{ info.rewardPoints || 20 }} 灵点</text>
          <text class="hero-sub">合规说明：灵点不可提现 / 转账 / 现金化。仅可在 App 内兑换 Pro 时长。</text>
        </view>

        <view class="code-card">
          <text class="code-label">我的邀请码</text>
          <text class="code-value">{{ info.inviteCode || '-' }}</text>
          <view class="primary-btn" @click="copyCode">复制邀请码</view>
        </view>

        <view class="link-card">
          <text class="link-label">分享链接</text>
          <text class="link-value">{{ info.shareUrl || '-' }}</text>
          <view class="secondary-btn" @click="copyLink">复制链接</view>
        </view>

        <view class="stats-card">
          <view class="stat">
            <text class="num">{{ info.totalInvited || 0 }}</text>
            <text class="label">已邀请</text>
          </view>
          <view class="stat">
            <text class="num pending">{{ info.pending || 0 }}</text>
            <text class="label">待发放</text>
          </view>
          <view class="stat">
            <text class="num granted">{{ info.granted || 0 }}</text>
            <text class="label">已发放</text>
          </view>
          <view class="stat">
            <text class="num cloud">{{ info.cloudPoints || 0 }}</text>
            <text class="label">云端灵点</text>
          </view>
        </view>

        <view class="rule-card">
          <text class="rule-title">奖励发放规则</text>
          <text class="rule-row">1. 被邀请人通过你的邀请码完成手机号注册</text>
          <text class="rule-row">2. 被邀请人完成至少 1 次"有效行为"（如发布排班分享 / 提交社区帖审核）</text>
          <text class="rule-row">3. 服务端确认后向你发放灵点（约 24h 内到账）</text>
          <text class="rule-row">4. 同一手机号只能被邀请 1 次；不能自我邀请；风控发现批量刷单将驳回</text>
          <text class="rule-warning">禁止使用"转发必得 / 返现 / 现金奖励"等措辞对外宣传</text>
        </view>
      </template>
    </scroll-view>
  </view>
</template>

<script>
import { safeBack } from '@/utils/nav.js'
import { withAuth, isLoggedIn, ensureLogin } from '@/utils/identity.js'

export default {
  data() {
    return {
      loading: true,
      loadError: '',
      info: {}
    }
  },
  onLoad() {
    if (!isLoggedIn()) {
      this.loading = false
      this.loadError = '需要登录一图灵账号'
      ensureLogin()
      return
    }
    this.fetch()
  },
  methods: {
    goBack() { safeBack('/pages/account/index') },
    async fetch() {
      this.loading = true
      this.loadError = ''
      try {
        const res = await uniCloud.callFunction({
          name: 'ytl-auth',
          data: withAuth({ action: 'get_invite_info' })
        })
        const r = res && res.result
        if (!r || !r.ok) {
          this.loadError = (r && r.message) || '加载失败'
          return
        }
        this.info = r
      } catch (e) {
        this.loadError = '网络异常：' + (e && e.message || 'unknown')
      } finally {
        this.loading = false
      }
    },
    copyCode() {
      if (!this.info.inviteCode) return
      uni.setClipboardData({
        data: this.info.inviteCode,
        success: () => uni.showToast({ title: '邀请码已复制', icon: 'success' })
      })
    },
    copyLink() {
      if (!this.info.shareUrl) return
      uni.setClipboardData({
        data: this.info.shareUrl,
        success: () => uni.showToast({ title: '链接已复制', icon: 'success' })
      })
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
.nav-title { font-size: 32rpx; font-weight: 700; color: #1D1D1F; flex: 1; }
.scroll { padding: 12rpx 24rpx 80rpx; }
.empty { padding: 80rpx 24rpx; text-align: center; color: #86868B; font-size: 28rpx; }
.empty.error { color: #D9342B; }

.hero { padding: 40rpx 32rpx; background: linear-gradient(135deg, #1F6FEB 0%, #4A90E2 100%); border-radius: 24rpx; color: #fff; text-align: center; margin-bottom: 24rpx; }
.hero-title { font-size: 26rpx; opacity: 0.9; display: block; }
.hero-points { font-size: 60rpx; font-weight: 900; display: block; margin-top: 14rpx; }
.hero-sub { font-size: 22rpx; opacity: 0.8; display: block; margin-top: 16rpx; line-height: 1.5; }

.code-card, .link-card, .stats-card, .rule-card { background: #fff; border-radius: 22rpx; padding: 28rpx; margin-bottom: 18rpx; }

.code-label { font-size: 24rpx; color: #6E6E73; display: block; }
.code-value { font-size: 56rpx; font-weight: 800; color: #1F6FEB; letter-spacing: 6rpx; display: block; margin: 14rpx 0 18rpx; }
.primary-btn { padding: 22rpx; background: #1F6FEB; color: #fff; border-radius: 999rpx; font-size: 28rpx; font-weight: 700; text-align: center; }

.link-label { font-size: 24rpx; color: #6E6E73; display: block; margin-bottom: 12rpx; }
.link-value { font-size: 24rpx; color: #1D1D1F; word-break: break-all; display: block; margin-bottom: 16rpx; }
.secondary-btn { padding: 22rpx; background: #F5F5F7; color: #1D1D1F; border-radius: 999rpx; font-size: 28rpx; font-weight: 700; text-align: center; }

.stats-card { display: flex; justify-content: space-around; }
.stat { display: flex; flex-direction: column; align-items: center; gap: 6rpx; }
.num { font-size: 40rpx; font-weight: 800; color: #1D1D1F; }
.num.pending { color: #B26A00; }
.num.granted { color: #137333; }
.num.cloud { color: #1F6FEB; }
.label { font-size: 22rpx; color: #6E6E73; }

.rule-title { font-size: 26rpx; color: #1D1D1F; font-weight: 700; display: block; margin-bottom: 14rpx; }
.rule-row { font-size: 22rpx; color: #505050; line-height: 1.7; display: block; }
.rule-warning { display: block; margin-top: 12rpx; padding: 10rpx 14rpx; background: #FFF4E5; color: #B26A00; border-radius: 10rpx; font-size: 22rpx; line-height: 1.5; }
</style>
