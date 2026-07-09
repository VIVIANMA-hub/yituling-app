<template>
	<view class="habit-page">
		<!-- 顶部导航 -->
		<view class="nav-bar">
			<view class="nav-back" @tap="goBack">
				<text class="back-icon">‹</text>
				<text class="back-text">返回</text>
			</view>
			<text class="nav-title">今日计划</text>
			<view class="nav-right"></view>
		</view>

		<!-- 日期标题 -->
		<view class="date-header">
			<text class="date-text">{{ todayStr }}</text>
			<text class="date-sub">专注每一分钟</text>
		</view>

		<!-- 今日汇总 -->
		<view class="summary-card">
			<text class="summary-title">⏱ 今日专注</text>
			<text class="summary-total">{{ formatTime(totalSeconds) }}</text>
		</view>

		<!-- 习惯列表 -->
		<view class="habits-list">
			<view
				v-for="(h, i) in habits"
				:key="i"
				class="habit-card"
				:class="{ running: h.running }"
			>
				<!-- 习惯主行 -->
				<view class="habit-main">
					<text class="habit-emoji">{{ h.emoji }}</text>
					<view class="habit-info">
						<text class="habit-name">{{ h.name }}</text>
						<text class="habit-goal">目标 {{ h.goal }}</text>
					</view>
					<text class="habit-time" :class="{ active: h.running }">{{ formatTime(h.seconds) }}</text>
				</view>

				<!-- 进度条 -->
				<view class="progress-wrap">
					<view class="progress-bar">
						<view class="progress-fill" :style="{ width: getProgress(h) + '%', background: h.color }"></view>
					</view>
					<text class="progress-pct">{{ getProgress(h) }}%</text>
				</view>

				<!-- 计时按钮 -->
				<view class="timer-row">
					<view
						class="timer-btn"
						:class="{ 'timer-btn--stop': h.running }"
						:style="h.running ? {} : { background: h.color }"
						@tap="toggleTimer(i)"
					>
						<text class="timer-icon">{{ h.running ? '⏸' : '▶' }}</text>
						<text class="timer-label">{{ h.running ? '暂停' : '开始计时' }}</text>
					</view>
					<view class="reset-btn" @tap="resetTimer(i)">
						<text class="reset-text">重置</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 底部提示 -->
		<view class="footer-tip">
			<text class="tip-text">长按卡片可重置单项计时</text>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		const today = new Date()
		const pad = n => String(n).padStart(2, '0')
		const todayStr = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`
		return {
			todayStr,
			habits: [
				{ name: '健身', emoji: '💪', goal: '60min', targetSec: 3600, seconds: 0, running: false, timer: null, color: '#FF6B35' },
				{ name: '阅读', emoji: '📚', goal: '30min', targetSec: 1800, seconds: 0, running: false, timer: null, color: '#007AFF' },
				{ name: '写作', emoji: '✍️', goal: '30min', targetSec: 1800, seconds: 0, running: false, timer: null, color: '#34C759' },
				{ name: '开发App', emoji: '💻', goal: '240min', targetSec: 14400, seconds: 0, running: false, timer: null, color: '#7C3AED' }
			]
		}
	},
	computed: {
		totalSeconds() {
			return this.habits.reduce((sum, h) => sum + h.seconds, 0)
		}
	},
	methods: {
		goBack() {
			uni.navigateBack()
		},
		formatTime(sec) {
			const h = Math.floor(sec / 3600)
			const m = Math.floor((sec % 3600) / 60)
			const s = sec % 60
			if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
			return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
		},
		getProgress(h) {
			const pct = Math.floor((h.seconds / h.targetSec) * 100)
			return Math.min(pct, 100)
		},
		toggleTimer(i) {
			const h = this.habits[i]
			if (h.running) {
				// 暂停
				clearInterval(h.timer)
				this.habits[i].timer = null
				this.habits[i].running = false
			} else {
				// 开始
				this.habits[i].running = true
				this.habits[i].timer = setInterval(() => {
					this.habits[i].seconds++
					if (this.habits[i].seconds >= this.habits[i].targetSec) {
						// 完成提醒
						clearInterval(this.habits[i].timer)
						this.habits[i].running = false
						uni.showToast({ title: `${this.habits[i].name} 目标完成！🎉`, icon: 'none', duration: 2000 })
					}
				}, 1000)
			}
		},
		resetTimer(i) {
			if (this.habits[i].running) {
				clearInterval(this.habits[i].timer)
				this.habits[i].timer = null
				this.habits[i].running = false
			}
			this.habits[i].seconds = 0
		}
	},
	onUnload() {
		// 页面销毁时清理所有计时器
		this.habits.forEach(h => {
			if (h.timer) clearInterval(h.timer)
		})
	}
}
</script>

<style lang="scss" scoped>
.habit-page {
	min-height: 100vh;
	background: #FBFBFD;
	padding-bottom: 80rpx;
}

/* 导航栏 */
.nav-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 88rpx 32rpx 24rpx;
	background: #fff;
}
.nav-back {
	display: flex;
	align-items: center;
	gap: 4rpx;
}
.back-icon {
	font-size: 44rpx;
	color: #007AFF;
	line-height: 1;
}
.back-text {
	font-size: 28rpx;
	color: #007AFF;
}
.nav-title {
	font-size: 34rpx;
	font-weight: 700;
	color: #1C1C1E;
}
.nav-right { width: 80rpx; }

/* 日期标题 */
.date-header {
	padding: 40rpx 32rpx 16rpx;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}
.date-text {
	font-size: 40rpx;
	font-weight: 800;
	color: #1C1C1E;
}
.date-sub {
	font-size: 26rpx;
	color: #8E8E93;
}

/* 汇总卡片 */
.summary-card {
	margin: 0 28rpx 24rpx;
	background: #fff;
	border-radius: 20rpx;
	padding: 28rpx 32rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.05);
}
.summary-title {
	font-size: 28rpx;
	color: #636366;
	font-weight: 500;
}
.summary-total {
	font-size: 40rpx;
	font-weight: 800;
	color: #007AFF;
	font-variant-numeric: tabular-nums;
}

/* 习惯列表 */
.habits-list {
	padding: 0 28rpx;
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

/* 习惯卡片 */
.habit-card {
	background: #fff;
	border-radius: 24rpx;
	padding: 28rpx;
	box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.06);
	transition: all 0.2s ease;
}
.habit-card.running {
	box-shadow: 0 4rpx 28rpx rgba(0,122,255,0.15);
}

.habit-main {
	display: flex;
	align-items: center;
	gap: 20rpx;
	margin-bottom: 20rpx;
}
.habit-emoji {
	font-size: 52rpx;
}
.habit-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 6rpx;
}
.habit-name {
	font-size: 32rpx;
	font-weight: 700;
	color: #1C1C1E;
}
.habit-goal {
	font-size: 24rpx;
	color: #8E8E93;
}
.habit-time {
	font-size: 36rpx;
	font-weight: 700;
	color: #C7C7CC;
	font-variant-numeric: tabular-nums;
	transition: color 0.2s;
}
.habit-time.active {
	color: #1C1C1E;
}

/* 进度条 */
.progress-wrap {
	display: flex;
	align-items: center;
	gap: 16rpx;
	margin-bottom: 20rpx;
}
.progress-bar {
	flex: 1;
	height: 8rpx;
	background: #F2F2F7;
	border-radius: 100rpx;
	overflow: hidden;
}
.progress-fill {
	height: 100%;
	border-radius: 100rpx;
	transition: width 0.5s ease;
}
.progress-pct {
	font-size: 22rpx;
	color: #8E8E93;
	width: 60rpx;
	text-align: right;
}

/* 计时按钮行 */
.timer-row {
	display: flex;
	gap: 16rpx;
	align-items: center;
}
.timer-btn {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10rpx;
	height: 72rpx;
	border-radius: 100rpx;
	transition: all 0.2s ease;
}
.timer-btn--stop {
	background: #FF3B30 !important;
}
.timer-icon {
	font-size: 28rpx;
	color: #fff;
}
.timer-label {
	font-size: 26rpx;
	font-weight: 600;
	color: #fff;
}
.reset-btn {
	width: 100rpx;
	height: 72rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #F2F2F7;
	border-radius: 100rpx;
}
.reset-text {
	font-size: 24rpx;
	color: #8E8E93;
}

/* 底部提示 */
.footer-tip {
	text-align: center;
	padding: 36rpx;
}
.tip-text {
	font-size: 24rpx;
	color: #C7C7CC;
}
</style>
