<template>
  <view class="page">
    <view class="status-bar"></view>

    <view class="brand-row">
      <view class="brand-left" @click="go('/pages/settings/settings')">
        <image class="logo" src="/static/logo_rabbit.png" mode="aspectFill"></image>
        <view>
          <text class="brand">一图灵</text>
          <text class="tagline">影像资料，拍了就会找</text>
        </view>
      </view>
      <view class="settings-btn" @click="go('/pages/settings/settings')">⚙️</view>
    </view>

    <view class="hello-block">
      <text class="hello">{{ greeting }}，{{ displayName }}</text>
      <view class="reminder-pill" @click="go('/pages/schedule/schedule')">
        <text class="bell">🔔</text>
        <text>{{ reminderEnabled ? '排班提醒已开启' : '排班提醒未开启' }}</text>
        <text class="time">{{ reminderEnabled ? reminderTime : '设置' }} ›</text>
      </view>
    </view>

    <!-- 未登录引导 -->
    <view v-if="!loggedIn" class="login-strip" @click="go('/pages/account/login')">
      <view>
        <text class="login-title">登录一图灵账号</text>
        <text class="login-desc">同步草稿、收取在线响应、提交社区审核</text>
      </view>
      <text class="login-action">去登录 ›</text>
    </view>

    <view class="search-card" @click="go('/pages/knowledge/knowledge')">
      <view class="search-inner">
        <text class="search-icon">🏠</text>
        <text class="search-placeholder">哪里不会，拍照搜资料...</text>
        <view class="divider"></view>
        <text class="camera" @click.stop="go('/pages/knowledge/knowledge')">📷</text>
      </view>
    </view>

    <view class="quick-grid">
      <view class="quick-item" v-for="item in quickItems" :key="item.title" @click="go(item.url)">
        <view class="quick-icon">{{ item.icon }}</view>
        <text class="quick-title">{{ item.title }}</text>
      </view>
    </view>

    <view class="pro-strip" @click="go('/pages/vip/vip')">
      <view>
        <text class="pro-title">Pro 解剖资料助手</text>
        <text class="pro-desc">拍照找资料线索，整理报告模板和私人知识库</text>
      </view>
      <text class="pro-action">查看 ›</text>
    </view>

    <view class="task-strip" @click="go('/pages/tasks/tasks')">
      <view>
        <text class="task-title">灵点任务中心</text>
        <text class="task-desc">签到 80 + 任一 20 点任务，可兑换 1 天 Pro</text>
      </view>
      <text class="task-action">去完成 ›</text>
    </view>

    <view class="legal-note">
      <text>仅用于效率工具、学习笔记和资料整理，不提供问诊、诊断、治疗、用药或分诊建议。</text>
    </view>

    <app-tab-bar active="index" />
  </view>
</template>

<script>
import { getCallerIdentity } from '@/utils/identity.js'
export default {
  data() {
    return {
      userName: '',
      loggedIn: false,
      reminderEnabled: true,
      reminderTime: '22:00',
      quickItems: [
        { icon: '📅', title: '排班助手', url: '/pages/schedule/schedule' },
        { icon: '📷', title: '脱敏助手', url: '/pages/anonymize/anonymize' },
        { icon: '📚', title: '知识库', url: '/pages/knowledge/knowledge' },
        { icon: '🦴', title: '影像解剖', url: '/pages/knowledge/knowledge?mode=anatomy' },
        { icon: '💡', title: '影像笔记', url: '/pages/notes/notes' },
        { icon: '📝', title: '学分管家', url: '/pages/credit/credit' }
      ]
    }
  },
  computed: {
    displayName() {
      return this.userName || '医生'
    },
    greeting() {
      const hour = new Date().getHours()
      if (hour < 6) return '深夜好'
      if (hour < 11) return '早上好'
      if (hour < 14) return '中午好'
      if (hour < 18) return '下午好'
      return '晚上好'
    }
  },
  onShow() {
    uni.hideTabBar()
    // 优先用一图灵账号真实姓名，否则用本地 user_name 兜底
    const id = getCallerIdentity()
    this.loggedIn = id.loggedIn
    if (id.loggedIn && id.name && id.name !== '医生') {
      this.userName = id.name
    } else {
      this.userName = uni.getStorageSync('user_name') || ''
    }
    this.loadReminder()
  },
  methods: {
    loadReminder() {
      const settings = uni.getStorageSync('ytl_schedule_reminder')
      if (!settings) {
        this.reminderEnabled = true
        this.reminderTime = uni.getStorageSync('shift_reminder_time') || '22:00'
        return
      }
      this.reminderEnabled = settings.enabled !== false
      this.reminderTime = settings.time || '22:00'
    },
    go(url) {
      uni.navigateTo({ url })
    }
  }
}
</script>

<style>
view,
text,
image {
  box-sizing: border-box;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", "Microsoft YaHei", sans-serif;
}

.page {
  min-height: 100vh;
  padding: 0 40rpx 230rpx;
  background: #F5F5F7;
  color: #1D1D1F;
}

.status-bar {
  height: 96rpx;
}

.brand-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22rpx;
  padding-top: 24rpx;
}

.brand-left {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 22rpx;
}

.settings-btn {
  flex-shrink: 0;
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  box-shadow: 0 12rpx 34rpx rgba(0, 0, 0, 0.045);
}

.logo {
  width: 112rpx;
  height: 112rpx;
  border-radius: 30rpx;
  background: #1D1D1F;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.08);
}

.brand {
  display: block;
  font-size: 58rpx;
  line-height: 1.05;
  font-weight: 900;
  color: #1D1D1F;
  letter-spacing: 0;
}

.tagline {
  display: block;
  margin-top: 10rpx;
  color: #86868B;
  font-size: 24rpx;
  font-weight: 700;
}

.hello-block {
  margin-top: 70rpx;
}

.hello {
  display: block;
  font-size: 68rpx;
  line-height: 1.1;
  color: #1D1D1F;
  font-weight: 900;
  letter-spacing: 0;
}

.reminder-pill {
  margin-top: 26rpx;
  width: fit-content;
  max-width: 100%;
  min-height: 60rpx;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: #E8F2FF;
  color: #175CD3;
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 24rpx;
  font-weight: 800;
}

.bell {
  font-size: 30rpx;
}

.time {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: #007AFF;
  color: #fff;
}

.search-card {
  margin-top: 74rpx;
  padding: 24rpx;
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.035);
}

.search-inner {
  height: 96rpx;
  padding: 0 28rpx;
  border-radius: 24rpx;
  background: #F5F5F7;
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.search-icon,
.camera {
  flex-shrink: 0;
  font-size: 34rpx;
}

.search-placeholder {
  flex: 1;
  color: #86868B;
  font-size: 28rpx;
  font-weight: 800;
}

.divider {
  width: 2rpx;
  height: 48rpx;
  background: #D0D5DD;
}

.quick-grid {
  margin-top: 78rpx;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  row-gap: 46rpx;
  column-gap: 28rpx;
}

.quick-item {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.quick-icon {
  width: 126rpx;
  height: 126rpx;
  border-radius: 30rpx;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 54rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.03);
}

.quick-title {
  display: block;
  margin-top: 20rpx;
  color: #1D1D1F;
  font-size: 25rpx;
  line-height: 1.2;
  font-weight: 850;
  text-align: center;
}

.pro-strip {
  margin-top: 72rpx;
  padding: 28rpx;
  border-radius: 28rpx;
  background: #1D1D1F;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.08);
}

.login-strip {
  margin-top: 32rpx;
  padding: 24rpx 28rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #1F6FEB 0%, #4A90E2 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22rpx;
}
.login-title { display: block; color: #fff; font-size: 28rpx; font-weight: 800; }
.login-desc { display: block; margin-top: 6rpx; color: rgba(255, 255, 255, 0.85); font-size: 22rpx; }
.login-action { color: #fff; font-size: 24rpx; font-weight: 700; white-space: nowrap; }

.pro-title {
  display: block;
  color: #fff;
  font-size: 30rpx;
  font-weight: 900;
}

.pro-desc {
  display: block;
  margin-top: 8rpx;
  color: rgba(255, 255, 255, 0.68);
  font-size: 23rpx;
  line-height: 1.4;
  font-weight: 700;
}

.pro-action {
  flex-shrink: 0;
  color: #7DD3FC;
  font-size: 25rpx;
  font-weight: 900;
}

.task-strip {
  margin-top: 18rpx;
  padding: 26rpx;
  border-radius: 28rpx;
  background: #0f172a;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  box-shadow: 0 16rpx 48rpx rgba(15, 23, 42, 0.18);
}

.task-title,
.task-desc {
  display: block;
}

.task-title {
  color: #f8fafc;
  font-size: 29rpx;
  font-weight: 900;
}

.task-desc {
  margin-top: 8rpx;
  color: #cbd5e1;
  font-size: 22rpx;
  line-height: 1.4;
  font-weight: 700;
}

.task-action {
  flex-shrink: 0;
  color: #fde68a;
  font-size: 24rpx;
  font-weight: 900;
}

.legal-note {
  margin-top: 26rpx;
  padding: 0 6rpx;
}

.legal-note text {
  display: block;
  color: #98a2b3;
  font-size: 21rpx;
  line-height: 1.45;
  font-weight: 650;
}
</style>
