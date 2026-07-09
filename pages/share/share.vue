<template>
  <view class="page">
    <view class="status-bar"></view>

    <!-- 顶部导航 -->
    <view class="nav">
      <view class="back-btn" @click="goBack">‹</view>
      <text class="nav-title">邀请任务</text>
      <view class="nav-right"></view>
    </view>

    <scroll-view scroll-y class="scroll" :show-scrollbar="false">
      <!-- 任务黑卡 -->
      <view class="income-card">
        <view class="income-top">
          <view>
            <text class="income-label">我的当前灵点</text>
            <text class="income-money">{{ points }}</text>
          </view>

          <view class="withdraw-btn" @click="goTasks">
            任务中心
          </view>
        </view>

        <view class="stats-box">
          <view class="stat-item">
            <text class="stat-num">+20</text>
            <text class="stat-label">邀请注册奖励</text>
          </view>
          <view class="stat-item">
            <text class="stat-num">+20</text>
            <text class="stat-label">有效分享排班图</text>
          </view>
          <view class="stat-item">
            <text class="stat-num">100</text>
            <text class="stat-label">兑换1天Pro</text>
          </view>
        </view>
      </view>

      <!-- 合规提示 -->
      <view class="notice-card">
        <text class="notice-title">任务说明</text>
        <text class="notice-text">
          邀请任务奖励以“有效邀请和有效分享”记录为准。灵点仅可兑换 App 内权益，不可提现、不可转账、不可现金化。
        </text>
      </view>

      <!-- 专属推广码 -->
      <view class="card">
        <view class="card-header">
          <view>
            <text class="card-title">专属推广码</text>
            <text class="card-subtitle">好友注册时填写邀请码，可关联邀请任务。</text>
          </view>
        </view>

        <view class="code-row">
          <view class="code-box">
            <text class="code-label">邀请码</text>
            <text class="code-value">{{ referralCode }}</text>
          </view>
          <view class="copy-btn" @click="copyCode">复制</view>
        </view>

        <view class="qr-wrap">
          <view class="qr-box">
            <text class="qr-icon">▦</text>
            <text class="qr-text">推广二维码</text>
            <text class="qr-small">接入后端后自动生成</text>
          </view>
        </view>

        <view class="poster-btn" @click="copyInviteText">
          复制推广文案
        </view>
      </view>

      <!-- 任务记录 -->
      <view class="card">
        <view class="card-header">
          <view>
            <text class="card-title">灵点记录</text>
            <text class="card-subtitle">仅展示任务类型与奖励，不展示隐私信息。</text>
          </view>
        </view>

        <view class="record-list" v-if="records.length">
          <view class="record-item" v-for="item in records" :key="item.id">
            <view class="record-left">
              <text class="record-title">{{ item.title }}</text>
              <text class="record-time">{{ item.time }}</text>
            </view>
            <view class="record-right">
              <text class="record-money">+{{ item.points }}</text>
              <text class="record-status" :class="item.status">{{ getStatusText(item.status) }}</text>
            </view>
          </view>
        </view>

        <view class="empty-state" v-else>
          <text class="empty-icon">🌱</text>
          <text class="empty-title">暂无邀请记录</text>
          <text class="empty-desc">复制邀请文案，邀请医护朋友注册体验一图灵。</text>
        </view>
      </view>

      <!-- 上架安全说明 -->
      <view class="safe-card">
        <text class="safe-title">合规提醒</text>
        <text class="safe-text">
          分享和邀请奖励仅在有效任务完成后发放。严禁虚假注册、伪造分享、诱导传播，违规任务不计分。
        </text>
      </view>

      <view class="bottom-space"></view>
    </scroll-view>
  </view>
</template>

<script>
import { safeBack } from '@/utils/nav.js'
import { getPointDashboard } from '@/utils/points.js'

export default {
  data() {
    return {
      points: 0,
      referralCode: 'YTL202604',
      records: [
        {
          id: 1,
          title: '邀请注册',
          time: '2026-04-20 09:30',
          points: 20,
          status: 'pending'
        },
        {
          id: 2,
          title: '有效分享排班图',
          time: '2026-04-19 21:12',
          points: 20,
          status: 'settled'
        },
        {
          id: 3,
          title: '邀请注册',
          time: '2026-04-18 14:08',
          points: 20,
          status: 'review'
        }
      ]
    }
  },
  onShow() {
    const dash = getPointDashboard()
    this.points = dash.points
  },

  methods: {
    goBack() {
      safeBack('/pages/index/index')
    },
    goTasks() {
      uni.navigateTo({ url: '/pages/tasks/tasks' })
    },

    getStatusText(status) {
      const map = {
        pending: '待确认',
        review: '审核中',
        settled: '已到账',
        rejected: '未通过'
      }
      return map[status] || '处理中'
    },

    copyCode() {
      uni.setClipboardData({
        data: this.referralCode,
        success: () => {
          uni.showToast({
            title: '邀请码已复制',
            icon: 'success'
          })
        }
      })
    },

    copyInviteText() {
      const text = `我正在使用一图灵：排班整理、脱敏笔记、影像学习卡工具。邀请码：${this.referralCode}。完成有效分享后可获得灵点，灵点可兑换Pro权益。`

      uni.setClipboardData({
        data: text,
        success: () => {
          uni.showToast({
            title: '推广文案已复制',
            icon: 'success'
          })
        }
      })
    }
  }
}
</script>

<style>
view,
text,
scroll-view {
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif;
}

.page {
  min-height: 100vh;
  background: #f5f5f7;
}

.status-bar {
  height: 88rpx;
}

.nav {
  height: 88rpx;
  padding: 0 40rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-btn {
  width: 64rpx;
  height: 64rpx;
  line-height: 56rpx;
  font-size: 58rpx;
  color: #1d1d1f;
  font-weight: 400;
}

.nav-title {
  font-size: 34rpx;
  font-weight: 900;
  color: #1d1d1f;
}

.nav-right {
  width: 64rpx;
  height: 64rpx;
}

.scroll {
  height: calc(100vh - 176rpx);
  padding: 0 32rpx;
}

.income-card {
  margin-top: 24rpx;
  background: #1d1d1f;
  border-radius: 42rpx;
  padding: 42rpx;
  color: #fff;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.12);
}

.income-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.income-label {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.62);
  font-weight: 700;
}

.income-money {
  display: block;
  margin-top: 22rpx;
  font-size: 68rpx;
  line-height: 1;
  color: #fff;
  font-weight: 900;
  letter-spacing: -2rpx;
}

.withdraw-btn {
  background: #007aff;
  color: #fff;
  padding: 16rpx 26rpx;
  border-radius: 100rpx;
  font-size: 24rpx;
  font-weight: 900;
}

.withdraw-btn:active {
  transform: scale(0.96);
}

.stats-box {
  margin-top: 46rpx;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 28rpx;
  padding: 28rpx 10rpx;
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.stat-item {
  width: 33.33%;
  text-align: center;
}

.stat-num {
  display: block;
  color: #ffe680;
  font-size: 30rpx;
  font-weight: 900;
}

.stat-label {
  display: block;
  margin-top: 8rpx;
  color: rgba(255, 255, 255, 0.48);
  font-size: 20rpx;
  font-weight: 700;
}

.notice-card,
.card,
.safe-card {
  margin-top: 26rpx;
  background: #fff;
  border-radius: 36rpx;
  padding: 34rpx;
  box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.035);
}

.notice-title,
.card-title,
.safe-title {
  display: block;
  font-size: 30rpx;
  font-weight: 900;
  color: #1d1d1f;
}

.notice-text,
.card-subtitle,
.safe-text {
  display: block;
  margin-top: 14rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: #86868b;
  font-weight: 600;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.code-row {
  margin-top: 28rpx;
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.code-box {
  flex: 1;
  background: #f5f5f7;
  border-radius: 24rpx;
  padding: 22rpx 26rpx;
}

.code-label {
  display: block;
  font-size: 20rpx;
  color: #86868b;
  font-weight: 700;
}

.code-value {
  display: block;
  margin-top: 8rpx;
  font-size: 34rpx;
  color: #1d1d1f;
  font-weight: 900;
  letter-spacing: 1rpx;
}

.copy-btn {
  width: 120rpx;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  background: #1d1d1f;
  color: #fff;
  border-radius: 24rpx;
  font-size: 26rpx;
  font-weight: 900;
}

.qr-wrap {
  margin-top: 30rpx;
  display: flex;
  justify-content: center;
}

.qr-box {
  width: 300rpx;
  height: 300rpx;
  background: #f2f2f7;
  border-radius: 24rpx;
  border: 2rpx dashed #d2d2d7;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.qr-icon {
  font-size: 68rpx;
  color: #86868b;
  font-weight: 900;
}

.qr-text {
  margin-top: 10rpx;
  font-size: 26rpx;
  color: #1d1d1f;
  font-weight: 900;
}

.qr-small {
  margin-top: 8rpx;
  font-size: 20rpx;
  color: #86868b;
  font-weight: 600;
}

.poster-btn {
  margin-top: 30rpx;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  background: #007aff;
  color: #fff;
  border-radius: 100rpx;
  font-size: 28rpx;
  font-weight: 900;
}

.record-list {
  margin-top: 24rpx;
}

.record-item {
  padding: 26rpx 0;
  border-bottom: 1rpx solid #f2f2f7;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-item:last-child {
  border-bottom: none;
}

.record-title {
  display: block;
  font-size: 27rpx;
  color: #1d1d1f;
  font-weight: 800;
}

.record-time {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #86868b;
  font-weight: 600;
}

.record-right {
  text-align: right;
}

.record-money {
  display: block;
  font-size: 28rpx;
  color: #34c759;
  font-weight: 900;
}

.record-status {
  display: inline-block;
  margin-top: 8rpx;
  font-size: 20rpx;
  font-weight: 800;
  padding: 6rpx 12rpx;
  border-radius: 10rpx;
}

.record-status.pending {
  color: #ff9f0a;
  background: rgba(255, 159, 10, 0.12);
}

.record-status.review {
  color: #007aff;
  background: rgba(0, 122, 255, 0.1);
}

.record-status.settled {
  color: #34c759;
  background: rgba(52, 199, 89, 0.12);
}

.record-status.rejected {
  color: #ff3b30;
  background: rgba(255, 59, 48, 0.12);
}

.empty-state {
  padding: 56rpx 20rpx 34rpx;
  text-align: center;
}

.empty-icon {
  display: block;
  font-size: 58rpx;
}

.empty-title {
  display: block;
  margin-top: 16rpx;
  font-size: 28rpx;
  color: #1d1d1f;
  font-weight: 900;
}

.empty-desc {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #86868b;
  font-weight: 600;
  line-height: 1.5;
}

.safe-card {
  background: #fff7e6;
}

.safe-title {
  color: #8a5a00;
}

.safe-text {
  color: #9a6a12;
}

.bottom-space {
  height: 80rpx;
}
</style>
