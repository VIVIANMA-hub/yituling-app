<template>
	<view class="year-page">
		<!-- 导航栏 -->
		<view class="nav-bar">
			<view class="nav-back" @tap="goBack">
				<text class="back-icon">‹</text>
				<text class="back-text">返回</text>
			</view>
			<text class="nav-title">2026 全年规划</text>
			<view class="nav-right"></view>
		</view>

		<!-- 年度进度总览 -->
		<view class="overview-card">
			<view class="overview-top">
				<text class="overview-year">2026</text>
				<text class="overview-pct">{{ yearProgress }}% 已完成</text>
			</view>
			<view class="overview-bar">
				<view class="overview-fill" :style="{ width: yearProgress + '%' }"></view>
			</view>
			<view class="milestone-row">
				<view v-for="(m, i) in milestonesFlat" :key="i" class="ms-dot-wrap" :style="{ left: m.offset + '%' }">
					<view class="ms-dot" :style="{ background: m.color }"></view>
					<text class="ms-dot-label">{{ m.short }}</text>
				</view>
			</view>
		</view>

		<!-- 月度计划表 -->
		<view class="months-wrap">
			<view
				v-for="(month, i) in months"
				:key="i"
				class="month-row"
				:class="{ current: month.isCurrent, past: month.isPast }"
				@tap="toggleMonth(i)"
			>
				<!-- 月份头部 -->
				<view class="month-header">
					<view class="month-num-wrap" :style="{ background: month.color + '22' }">
						<text class="month-num" :style="{ color: month.color }">{{ month.num }}月</text>
					</view>
					<view class="month-center">
						<text class="month-focus">{{ month.focus }}</text>
						<view class="month-tags">
							<text v-for="(t, j) in month.tags" :key="j" class="month-tag" :style="{ background: month.color + '18', color: month.color }">{{ t }}</text>
						</view>
					</view>
					<view class="month-right">
						<view v-if="month.milestone" class="milestone-badge" :style="{ background: month.milestoneColor }">
							<text class="milestone-text">{{ month.milestone }}</text>
						</view>
						<text class="expand-icon">{{ expandedMonth === i ? '▲' : '▼' }}</text>
					</view>
				</view>

				<!-- 展开详情 -->
				<view v-if="expandedMonth === i" class="month-detail">
					<view class="detail-divider"></view>
					<view v-for="(task, j) in month.tasks" :key="j" class="task-item">
						<text class="task-dot" :style="{ color: month.color }">●</text>
						<text class="task-text">{{ task }}</text>
					</view>
					<view v-if="month.events && month.events.length" class="events-wrap">
						<view v-for="(ev, k) in month.events" :key="k" class="event-chip">
							<text class="event-icon">{{ ev.icon }}</text>
							<text class="event-text">{{ ev.label }}</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<view style="height: 80rpx;"></view>
	</view>
</template>

<script>
export default {
	data() {
		const now = new Date()
		const curMonth = now.getMonth() + 1

		const months = [
			{
				num: 1, focus: '夯实基础·完善功能', color: '#007AFF',
				tags: ['代码优化', 'MVP打磨'],
				tasks: [
					'完善病例共创核心模块',
					'修复已知 Bug，提升稳定性',
					'统一 Pinia 状态管理',
					'完成 utils/request.js 封装'
				],
				milestone: null, milestoneColor: '',
				events: []
			},
			{
				num: 2, focus: '内测·收集反馈', color: '#5856D6',
				tags: ['内测', '用户反馈'],
				tasks: [
					'组建内测小组（5~10 位医影从业者）',
					'收集功能痛点与操作体验反馈',
					'迭代 UI 交互细节',
					'完善登录与权限模块'
				],
				milestone: null, milestoneColor: '',
				events: []
			},
			{
				num: 3, focus: '产品打磨·合规准备', color: '#34C759',
				tags: ['合规', '产品迭代'],
				tasks: [
					'医疗数据脱敏方案落地',
					'用户隐私协议更新',
					'完成等保三级备案准备',
					'App 图标 / 启动图设计完稿'
				],
				milestone: null, milestoneColor: '',
				events: []
			},
			{
				num: 4, focus: '上线冲刺·应用审核', color: '#FF9500',
				tags: ['提交审核', '冲刺'],
				tasks: [
					'提交 App Store / 安卓市场审核',
					'完成小程序备案与上线',
					'灰度发布，监控崩溃率',
					'App 应用商店文案与截图制作'
				],
				milestone: null, milestoneColor: '',
				events: []
			},
			{
				num: 5, focus: '正式发布·推广启动', color: '#FF3B30',
				tags: ['发布', '推广'],
				tasks: [
					'一图灵 App 正式上线（目标：6月前完成）',
					'公众号/小红书发布推广内容',
					'邀请种子用户试用并留存',
					'建立用户反馈闭环机制'
				],
				milestone: '上线冲刺', milestoneColor: '#FF3B30',
				events: []
			},
			{
				num: 6, focus: '正式上线·稳定运营', color: '#DC2626',
				tags: ['✅ 正式上线', '运营'],
				tasks: [
					'🎯 一图灵 App 正式上线，面向全体用户开放',
					'运营活动：早期用户激励计划',
					'数据监控：DAU / 留存率 / 崩溃率',
					'6.19 赴重庆商务洽谈'
				],
				milestone: '🚀 App上线', milestoneColor: '#DC2626',
				events: [
					{ icon: '🚀', label: '6月底前 App 正式上线' },
					{ icon: '✈️', label: '6.19 去重庆' }
				]
			},
			{
				num: 7, focus: '比赛备战·功能深化', color: '#7C3AED',
				tags: ['备赛', '功能深化'],
				tasks: [
					'整理医保局 AI 大赛参赛材料',
					'AI 识图大赛合规路径评估',
					'撰写项目商业计划书（BP）',
					'持续优化用户体验，冲刺活跃度'
				],
				milestone: '备赛冲刺', milestoneColor: '#7C3AED',
				events: []
			},
			{
				num: 8, focus: '医保局AI大赛·初赛', color: '#0EA5E9',
				tags: ['🏆 初赛', '比赛'],
				tasks: [
					'🏆 参加医保局 AI 大赛初赛',
					'现场演示一图灵核心功能',
					'根据评委反馈优化产品方向',
					'整理初赛经验，备战决赛'
				],
				milestone: '🏆 初赛', milestoneColor: '#0EA5E9',
				events: [
					{ icon: '🏆', label: '8月 医保局AI大赛初赛' }
				]
			},
			{
				num: 9, focus: '决赛备战·融资探索', color: '#059669',
				tags: ['决赛备战', '融资'],
				tasks: [
					'针对初赛评审意见深度迭代',
					'完善 AI 算法演示方案',
					'接触早期投资机构',
					'用户规模冲刺，拉升月活数据'
				],
				milestone: '决赛备战', milestoneColor: '#059669',
				events: []
			},
			{
				num: 10, focus: '医保局AI大赛·决赛', color: '#F59E0B',
				tags: ['🥇 决赛', '比赛'],
				tasks: [
					'🥇 参加医保局 AI 大赛决赛',
					'全力冲刺最终名次',
					'品牌曝光与媒体报道',
					'整理奖项证书与合作资源'
				],
				milestone: '🥇 决赛', milestoneColor: '#F59E0B',
				events: [
					{ icon: '🥇', label: '10月 医保局AI大赛决赛' }
				]
			},
			{
				num: 11, focus: '商业化探索·B端对接', color: '#6366F1',
				tags: ['商业化', 'B端'],
				tasks: [
					'与医院/科室签署合作意向',
					'推进 SaaS 付费方案设计',
					'参加医疗健康行业展会',
					'建立 KOL 合作矩阵'
				],
				milestone: null, milestoneColor: '',
				events: []
			},
			{
				num: 12, focus: '年度总结·2027规划', color: '#8B5CF6',
				tags: ['复盘', '规划'],
				tasks: [
					'2026 年度数据复盘（DAU/MAU/收入）',
					'核心团队 OKR 回顾',
					'制定 2027 产品路线图',
					'用户年度报告制作与发布'
				],
				milestone: '年度复盘', milestoneColor: '#8B5CF6',
				events: []
			}
		].map(m => ({
			...m,
			isCurrent: m.num === curMonth,
			isPast: m.num < curMonth
		}))

		// 里程碑点位（用于进度条上方展示）
		const milestonesFlat = [
			{ short: '上线', offset: 45, color: '#DC2626' },
			{ short: '重庆', offset: 47, color: '#FF9500' },
			{ short: '初赛', offset: 62, color: '#0EA5E9' },
			{ short: '决赛', offset: 79, color: '#F59E0B' }
		]

		// 全年进度（已过月份/12）
		const yearProgress = Math.round(((curMonth - 1) / 12) * 100)

		return { months, milestonesFlat, yearProgress, expandedMonth: curMonth - 1 }
	},
	methods: {
		goBack() {
			uni.navigateBack()
		},
		toggleMonth(i) {
			this.expandedMonth = this.expandedMonth === i ? -1 : i
		}
	}
}
</script>

<style lang="scss" scoped>
.year-page {
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
.nav-back { display: flex; align-items: center; gap: 4rpx; }
.back-icon { font-size: 44rpx; color: #007AFF; line-height: 1; }
.back-text { font-size: 28rpx; color: #007AFF; }
.nav-title { font-size: 34rpx; font-weight: 700; color: #1C1C1E; }
.nav-right { width: 80rpx; }

/* 年度总览卡片 */
.overview-card {
	margin: 24rpx 28rpx;
	background: #fff;
	border-radius: 24rpx;
	padding: 32rpx;
	box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.07);
}
.overview-top {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}
.overview-year {
	font-size: 48rpx;
	font-weight: 900;
	color: #1C1C1E;
}
.overview-pct {
	font-size: 24rpx;
	color: #8E8E93;
}
.overview-bar {
	height: 12rpx;
	background: #F2F2F7;
	border-radius: 100rpx;
	overflow: hidden;
	position: relative;
}
.overview-fill {
	height: 100%;
	background: linear-gradient(90deg, #007AFF, #5856D6);
	border-radius: 100rpx;
	transition: width 0.6s ease;
}

/* 里程碑点 */
.milestone-row {
	position: relative;
	height: 48rpx;
	margin-top: 8rpx;
}
.ms-dot-wrap {
	position: absolute;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4rpx;
	transform: translateX(-50%);
}
.ms-dot {
	width: 14rpx;
	height: 14rpx;
	border-radius: 50%;
}
.ms-dot-label {
	font-size: 18rpx;
	color: #8E8E93;
	white-space: nowrap;
}

/* 月度列表 */
.months-wrap {
	padding: 0 28rpx;
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

/* 月行 */
.month-row {
	background: #fff;
	border-radius: 20rpx;
	overflow: hidden;
	box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.05);
	transition: all 0.2s;
}
.month-row.current {
	box-shadow: 0 4rpx 28rpx rgba(0,122,255,0.18);
	border: 2rpx solid rgba(0,122,255,0.25);
}
.month-row.past {
	opacity: 0.65;
}

.month-header {
	display: flex;
	align-items: center;
	gap: 20rpx;
	padding: 24rpx 24rpx;
}
.month-num-wrap {
	width: 80rpx;
	height: 80rpx;
	border-radius: 20rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}
.month-num {
	font-size: 30rpx;
	font-weight: 800;
}
.month-center {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 10rpx;
}
.month-focus {
	font-size: 28rpx;
	font-weight: 700;
	color: #1C1C1E;
}
.month-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 8rpx;
}
.month-tag {
	font-size: 20rpx;
	padding: 4rpx 14rpx;
	border-radius: 100rpx;
	font-weight: 500;
}
.month-right {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 10rpx;
}
.milestone-badge {
	padding: 6rpx 16rpx;
	border-radius: 100rpx;
}
.milestone-text {
	font-size: 20rpx;
	color: #fff;
	font-weight: 600;
}
.expand-icon {
	font-size: 20rpx;
	color: #C7C7CC;
}

/* 展开详情 */
.detail-divider {
	height: 1rpx;
	background: #F2F2F7;
	margin: 0 24rpx;
}
.month-detail {
	padding: 20rpx 24rpx 24rpx;
}
.task-item {
	display: flex;
	align-items: flex-start;
	gap: 12rpx;
	margin-bottom: 14rpx;
}
.task-dot {
	font-size: 16rpx;
	margin-top: 6rpx;
	flex-shrink: 0;
}
.task-text {
	font-size: 26rpx;
	color: #636366;
	line-height: 1.6;
	flex: 1;
}
.events-wrap {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-top: 16rpx;
}
.event-chip {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 10rpx 20rpx;
	background: #FFF9E6;
	border-radius: 100rpx;
}
.event-icon { font-size: 28rpx; }
.event-text { font-size: 24rpx; color: #D97706; font-weight: 500; }
</style>
