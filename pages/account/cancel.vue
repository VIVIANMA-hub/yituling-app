<template>
  <view class="page">
    <view class="status-bar"></view>
    <view class="nav">
      <view class="back" @click="goBack">‹</view>
      <text class="nav-title">账号注销</text>
      <view class="right"></view>
    </view>

    <scroll-view scroll-y class="content" :show-scrollbar="false">
      <view class="warning-card">
        <text class="warning-title">注销前请认真阅读</text>
        <text class="warning-text">账号注销后，您将无法继续登录该账号。会员权益、草稿、笔记、收藏、认证状态和推广记录可能无法恢复。</text>
      </view>

      <view class="section" v-for="(block, index) in doc.blocks" :key="index">
        <text class="section-title">{{ block.heading }}</text>
        <text class="section-body">{{ block.body }}</text>
      </view>

      <view class="form-card">
        <text class="form-title">提交注销申请</text>

        <view class="check-row" v-for="item in checks" :key="item.key" @click="item.checked = !item.checked">
          <view class="checkbox" :class="{ checked: item.checked }">
            <text v-if="item.checked">✓</text>
          </view>
          <text class="check-text">{{ item.text }}</text>
        </view>

        <input class="input" v-model="confirmText" placeholder="请输入：确认注销" />

        <view class="submit-btn" :class="{ disabled: !canSubmit }" @click="submitCancel">提交注销申请</view>
      </view>

      <view class="bottom-space"></view>
    </scroll-view>
  </view>
</template>

<script>
import { getLegalDoc, CONTACT_INFO } from '@/utils/legalDocs.js'

export default {
  data() {
    return {
      doc: getLegalDoc('cancel'),
      confirmText: '',
      checks: [
        { key: 'read', text: '我已阅读并理解账号注销后果。', checked: false },
        { key: 'backup', text: '我已自行备份需要保留的数据。', checked: false },
        { key: 'legal', text: '我理解依法需要留存的记录不会立即删除。', checked: false }
      ],
      contactEmail: CONTACT_INFO.contactEmail
    }
  },

  computed: {
    canSubmit() {
      return this.confirmText === '确认注销' && this.checks.every(item => item.checked)
    }
  },

  methods: {
    goBack() {
      uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/settings/settings' }) })
    },

    async submitCancel() {
      if (!this.canSubmit) {
        uni.showToast({ title: '请完成勾选并输入确认文字', icon: 'none' })
        return
      }

      // 本地记一份历史申请单（兼容旧逻辑）
      const request = {
        id: 'CANCEL-' + Date.now(),
        createdAt: new Date().toISOString(),
        status: 'pending'
      }
      uni.setStorageSync('ytl_cancel_request', request)

      // 已登录用户直接调云端真实删除
      const { isLoggedIn, withAuth, clearAuth } = await import('@/utils/identity.js')
      if (!isLoggedIn()) {
        uni.showModal({
          title: '本地申请已记录',
          content: `当前未登录一图灵账号。注销申请已记录在本机。请通过 ${this.contactEmail} 联系我们完成身份核验。`,
          showCancel: false,
          success: () => this.goBack()
        })
        return
      }

      uni.showLoading({ title: '正在删除云端数据...' })
      try {
        const res = await uniCloud.callFunction({
          name: 'ytl-auth',
          data: withAuth({ action: 'cancel_account', confirmation: 'YES_DELETE_MY_ACCOUNT' })
        })
        uni.hideLoading()
        const r = res && res.result
        if (!r || !r.ok) {
          uni.showModal({
            title: '云端注销失败',
            content: `本地已记录申请，但云端删除未成功：${(r && r.message) || '请稍后重试或邮件 ${this.contactEmail} 联系'}。`,
            showCancel: false,
            success: () => this.goBack()
          })
          return
        }
        // 清本地登录态
        clearAuth()
        const removed = r.report && r.report.removed || {}
        const summary = [
          `账号：${removed.ytl_users || 0}`,
          `笔记：${removed.ytl_posts || 0}`,
          `排班分享：${removed.schedule_shares || 0}`,
          `回执：${(removed.my_responses || 0) + (removed.schedule_responses_under_my_shares || 0)}`,
          `登录 token：${removed.ytl_tokens || 0}`
        ].join('\n')
        uni.showModal({
          title: '已注销',
          content: `云端数据已删除：\n${summary}\n\n如需彻底删除本地数据，请在系统设置卸载本 App。`,
          showCancel: false,
          success: () => {
            uni.reLaunch({ url: '/pages/index/index' })
          }
        })
      } catch (e) {
        uni.hideLoading()
        uni.showModal({
          title: '网络异常',
          content: (e && e.message) || 'unknown',
          showCancel: false
        })
      }
    }
  }
}
</script>

<style>
view, text, scroll-view, input {
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif;
}

.page { min-height: 100vh; background: #f5f5f7; }
.status-bar { height: 88rpx; }
.nav { height: 88rpx; padding: 0 34rpx; display: flex; align-items: center; justify-content: space-between; }
.back, .right { width: 64rpx; height: 64rpx; }
.back { border-radius: 50%; background: #fff; color: #1d1d1f; font-size: 54rpx; line-height: 56rpx; text-align: center; }
.nav-title { font-size: 34rpx; color: #1d1d1f; font-weight: 900; }
.content { height: calc(100vh - 176rpx); padding: 0 32rpx; }
.warning-card, .section, .form-card { margin-top: 24rpx; background: #fff; border-radius: 34rpx; padding: 34rpx; box-shadow: 0 12rpx 38rpx rgba(0, 0, 0, 0.035); }
.warning-card { background: #fff0f0; }
.warning-title, .section-title, .form-title { display: block; font-size: 30rpx; color: #1d1d1f; font-weight: 900; }
.warning-title { color: #b42318; }
.warning-text, .section-body { display: block; margin-top: 14rpx; font-size: 25rpx; line-height: 1.75; color: #515154; font-weight: 600; }
.warning-text { color: #b42318; }
.check-row { display: flex; gap: 18rpx; padding: 24rpx 0; border-bottom: 1rpx solid #f2f2f7; }
.checkbox { width: 42rpx; height: 42rpx; border-radius: 50%; border: 3rpx solid #d2d2d7; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 22rpx; font-weight: 900; }
.checkbox.checked { background: #007aff; border-color: #007aff; }
.check-text { flex: 1; font-size: 25rpx; line-height: 1.5; color: #1d1d1f; font-weight: 700; }
.input { margin-top: 28rpx; height: 90rpx; padding: 0 26rpx; border-radius: 24rpx; background: #f5f5f7; font-size: 28rpx; color: #1d1d1f; }
.submit-btn { margin-top: 28rpx; height: 90rpx; line-height: 90rpx; text-align: center; border-radius: 100rpx; background: #ff3b30; color: #fff; font-size: 28rpx; font-weight: 900; }
.submit-btn.disabled { background: #c7c7cc; }
.bottom-space { height: 90rpx; }
</style>
