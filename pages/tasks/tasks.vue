<template>
  <view class="page">
    <view class="status-bar"></view>

    <view class="nav">
      <view class="back-btn" @click="goBack">‹</view>
      <text class="nav-title">任务中心</text>
      <view class="nav-right"></view>
    </view>

    <scroll-view scroll-y class="scroll" :show-scrollbar="false">
      <view class="hero-card">
        <text class="hero-title">今日灵点冲刺</text>
        <text class="hero-sub">签到80 + 任一20点任务 = 100点兑换1天Pro</text>
        <view class="point-row">
          <view class="point-item">
            <text class="point-label">当前灵点</text>
            <text class="point-value">{{ points }}</text>
          </view>
          <view class="point-item">
            <text class="point-label">可用Pro天数</text>
            <text class="point-value">{{ proDays }}</text>
          </view>
        </view>
        <view class="exchange-btn" @click="exchangeNow">100灵点兑换1天Pro</view>
      </view>

      <view class="task-card">
        <text class="section-title">今日任务</text>

        <view class="task-item">
          <view>
            <text class="task-title">每日签到</text>
            <text class="task-desc">每天首次签到可获得 80 灵点。</text>
          </view>
          <view class="task-action primary" @click="doCheckin">{{ checkedInToday ? '已签到' : '+80 签到' }}</view>
        </view>

        <view class="task-item">
          <view>
            <text class="task-title">看广告领灵点</text>
            <text class="task-desc">每天最多 1 次，完成后获得 20 灵点。</text>
          </view>
          <view class="task-action" @click="goVipAd">去完成</view>
        </view>

        <view class="task-item">
          <view>
            <text class="task-title">有效分享排班图</text>
            <text class="task-desc">完成有效分享后获得 20 灵点。</text>
          </view>
          <view class="task-action" @click="goSchedule">去分享</view>
        </view>

        <view class="task-item">
          <view>
            <text class="task-title">发帖审核通过</text>
            <text class="task-desc">脱敏帖子审核通过后获得 20 灵点。</text>
          </view>
          <view class="task-action" @click="goNotes">去发帖</view>
        </view>
      </view>

      <view class="task-card">
        <text class="section-title">灵点记录</text>
        <view class="record-item" v-for="item in topRecords" :key="item.id">
          <view>
            <text class="record-title">{{ item.title }}</text>
            <text class="record-time">{{ formatTime(item.createdAt) }}</text>
          </view>
          <text class="record-points" :class="{ minus: item.points < 0 }">{{ item.points > 0 ? `+${item.points}` : item.points }}</text>
        </view>
        <view class="empty" v-if="topRecords.length === 0">暂无记录</view>
      </view>

      <view class="note-card">
        <text class="note-title">规则说明</text>
        <text class="note-line">1. 灵点仅可兑换 App 内权益，不可提现或转账。</text>
        <text class="note-line">2. 发帖奖励以“脱敏并审核通过”为准。</text>
        <text class="note-line">3. 分享奖励以“完成有效分享后获得”为准。</text>
      </view>

      <view class="bottom-space"></view>
    </scroll-view>
  </view>
</template>

<script>
import { safeBack } from '@/utils/nav.js'
import { POINT_RULES, claimDailyCheckin, exchangePointsForProDay, getPointDashboard } from '@/utils/points.js'

export default {
  data() {
    return {
      points: 0,
      proDays: 0,
      checkedInToday: false,
      topRecords: []
    }
  },
  onShow() {
    this.syncData()
  },
  methods: {
    goBack() {
      safeBack('/pages/index/index')
    },
    syncData() {
      const dash = getPointDashboard()
      this.points = dash.points
      this.proDays = dash.proDays
      this.topRecords = dash.records.slice(0, 12)
      const today = new Date().toISOString().slice(0, 10)
      this.checkedInToday = dash.checkin && dash.checkin.lastCheckinDate === today
    },
    doCheckin() {
      if (this.checkedInToday) {
        uni.showToast({ title: '今天已签到', icon: 'none' })
        return
      }
      const result = claimDailyCheckin()
      if (!result.ok) {
        if (result.reason === 'already_checked_in') {
          uni.showToast({ title: '今天已签到', icon: 'none' })
          this.syncData()
          return
        }
        uni.showToast({ title: '签到失败，请稍后重试', icon: 'none' })
        return
      }
      this.syncData()
      uni.showModal({
        title: '签到成功',
        content: `已获得 ${POINT_RULES.daily_checkin} 灵点，当前灵点 ${result.points}。连续签到 ${result.streakDays} 天。`,
        showCancel: false
      })
    },
    async exchangeNow() {
      uni.showLoading({ title: '兑换中…', mask: true })
      let result
      try {
        result = await exchangePointsForProDay()
      } catch (e) {
        result = { ok: false, reason: 'network', message: e && e.message }
      }
      uni.hideLoading()
      if (!result.ok) {
        if (result.reason === 'insufficient') {
          uni.showToast({ title: `需要 ${POINT_RULES.pro_exchange_cost} 灵点`, icon: 'none' })
          return
        }
        if (result.reason === 'network') {
          uni.showToast({ title: '网络异常，请稍后重试', icon: 'none' })
          return
        }
        uni.showToast({ title: result.message || '兑换失败，请稍后重试', icon: 'none' })
        return
      }
      this.syncData()
      const expiryHint = result.vipExpiresAt
        ? `Pro 到期：${new Date(result.vipExpiresAt).toLocaleDateString()}`
        : `当前 Pro 可用天数 ${result.proDays} 天`
      uni.showModal({
        title: '兑换成功',
        content: `已兑换 1 天 Pro。${expiryHint}`,
        showCancel: false
      })
    },
    goVipAd() {
      uni.navigateTo({ url: '/pages/vip/vip' })
    },
    goSchedule() {
      uni.navigateTo({ url: '/pages/schedule/schedule' })
    },
    goNotes() {
      uni.navigateTo({ url: '/pages/notes/notes' })
    },
    formatTime(ts) {
      if (!ts) return '--'
      const date = new Date(ts)
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      const h = String(date.getHours()).padStart(2, '0')
      const min = String(date.getMinutes()).padStart(2, '0')
      return `${m}-${d} ${h}:${min}`
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
  padding: 0 32rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-btn,
.nav-right {
  width: 64rpx;
  height: 64rpx;
}

.back-btn {
  font-size: 56rpx;
  line-height: 56rpx;
  color: #111827;
}

.nav-title {
  font-size: 34rpx;
  font-weight: 900;
  color: #111827;
}

.scroll {
  height: calc(100vh - 176rpx);
  padding: 0 32rpx;
}

.hero-card,
.task-card,
.note-card {
  margin-top: 20rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 12rpx 32rpx rgba(17, 24, 39, 0.05);
}

.hero-title {
  display: block;
  font-size: 36rpx;
  font-weight: 900;
  color: #111827;
}

.hero-sub {
  display: block;
  margin-top: 8rpx;
  color: #667085;
  font-size: 22rpx;
  line-height: 1.5;
}

.point-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14rpx;
  margin-top: 18rpx;
}

.point-item {
  border-radius: 16rpx;
  background: #f8fafc;
  padding: 14rpx 16rpx;
}

.point-label,
.point-value {
  display: block;
}

.point-label {
  color: #667085;
  font-size: 20rpx;
}

.point-value {
  margin-top: 6rpx;
  color: #0f172a;
  font-size: 38rpx;
  font-weight: 900;
}

.exchange-btn {
  margin-top: 18rpx;
  height: 84rpx;
  border-radius: 999rpx;
  background: #111827;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 900;
}

.section-title {
  display: block;
  font-size: 29rpx;
  font-weight: 900;
  color: #111827;
}

.task-item {
  margin-top: 18rpx;
  padding-top: 18rpx;
  border-top: 1rpx solid #eef2f7;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
}

.task-title,
.task-desc {
  display: block;
}

.task-title {
  font-size: 25rpx;
  font-weight: 900;
  color: #0f172a;
}

.task-desc {
  margin-top: 6rpx;
  font-size: 21rpx;
  line-height: 1.45;
  color: #667085;
}

.task-action {
  min-width: 164rpx;
  min-height: 66rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  background: #f1f5f9;
  color: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  font-weight: 900;
}

.task-action.primary {
  background: #111827;
  color: #fff;
}

.record-item {
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #eef2f7;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12rpx;
}

.record-title,
.record-time {
  display: block;
}

.record-title {
  color: #0f172a;
  font-size: 24rpx;
  font-weight: 800;
}

.record-time {
  margin-top: 6rpx;
  color: #94a3b8;
  font-size: 20rpx;
}

.record-points {
  color: #16a34a;
  font-size: 30rpx;
  font-weight: 900;
}

.record-points.minus {
  color: #dc2626;
}

.empty {
  margin-top: 24rpx;
  color: #94a3b8;
  font-size: 22rpx;
  text-align: center;
}

.note-title,
.note-line {
  display: block;
}

.note-title {
  color: #0f172a;
  font-size: 25rpx;
  font-weight: 900;
}

.note-line {
  margin-top: 8rpx;
  color: #64748b;
  font-size: 21rpx;
  line-height: 1.45;
}

.bottom-space {
  height: 56rpx;
}
</style>
