<template>
	<view class="team-page">
		<!-- 顶部导航 -->
		<view class="nav-bar">
			<view class="nav-back" @tap="goBack">
				<text class="back-icon">‹</text>
				<text class="back-text">返回</text>
			</view>
			<text class="nav-title">核心团队</text>
			<view class="nav-right"></view>
		</view>

		<!-- 标题区 -->
		<view class="header-section">
			<view class="header-logo">🐰</view>
			<text class="header-title">一图灵核心成员</text>
			<text class="header-sub">六位兔灵战士，共创医疗AI未来</text>
		</view>

		<!-- 成员卡片列表 -->
		<view class="members-grid">
			<view
				v-for="(m, i) in members"
				:key="i"
				class="member-card"
				:class="{ expanded: expandedIndex === i }"
				@tap="toggleExpand(i)"
			>
				<!-- 卡片主区 -->
				<view class="card-main">
					<view class="avatar-wrap" :style="{ background: m.bgColor }">
						<text class="avatar-emoji">{{ m.emoji }}</text>
					</view>
					<view class="card-info">
						<view class="name-row">
							<text class="code-name">{{ m.codeName }}</text>
							<text class="real-title">{{ m.title }}</text>
						</view>
						<text class="role-tag" :style="{ color: m.color }">{{ m.role }}</text>
						<text class="dept">{{ m.dept }}</text>
					</view>
					<text class="expand-arrow">{{ expandedIndex === i ? '∧' : '∨' }}</text>
				</view>

				<!-- 展开详情 -->
				<view v-if="expandedIndex === i" class="card-detail">
					<view class="detail-divider"></view>
					<text class="detail-desc">{{ m.desc }}</text>
					<view class="skills-wrap">
						<text v-for="(s, j) in m.skills" :key="j" class="skill-tag" :style="{ borderColor: m.color, color: m.color }">{{ s }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 底部标语 -->
		<view class="footer-motto">
			<text class="motto-text">🐇 兔灵不停跑，医影共创造</text>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			expandedIndex: -1,
			members: [
				{
					codeName: '兔灵1号',
					title: '唐总',
					role: '市场推手',
					dept: '市场战略 · 联合创始人',
					emoji: '📊',
					color: '#007AFF',
					bgColor: 'linear-gradient(135deg,#e8f4ff,#c5e0ff)',
					desc: '负责市场调研、商业拓展与品牌落地，连接医疗机构与平台生态。',
					skills: ['市场调研', '商务拓展', '品牌营销', '渠道资源']
				},
				{
					codeName: '兔灵2号',
					title: '张总',
					role: 'AI大脑',
					dept: 'AI算法负责人',
					emoji: '🧠',
					color: '#7C3AED',
					bgColor: 'linear-gradient(135deg,#f3e8ff,#ddd6fe)',
					desc: '负责医疗AI模型训练与优化，构建影像识别与智能推荐核心引擎。',
					skills: ['深度学习', '医学影像AI', '模型优化', 'Python/PyTorch']
				},
				{
					codeName: '兔灵3号',
					title: '婷姐',
					role: '产品设计师',
					dept: '产品负责人',
					emoji: '💻',
					color: '#DC2626',
					bgColor: 'linear-gradient(135deg,#fff1f0,#fecaca)',
					desc: '主导用户体验与产品规划，打造医影人喜欢用的工具型应用。',
					skills: ['产品规划', 'UX设计', '用户研究', 'Figma']
				},
				{
					codeName: '兔灵4号',
					title: '王总',
					role: '数据达人',
					dept: '数据策略',
					emoji: '📈',
					color: '#059669',
					bgColor: 'linear-gradient(135deg,#ecfdf5,#a7f3d0)',
					desc: '负责医疗数据管理与分析，建立合规数据中台支撑业务决策。',
					skills: ['数据分析', '医疗数据合规', 'SQL/BI', '数据架构']
				},
				{
					codeName: '兔灵5号',
					title: '陈顾问',
					role: '临床顾问',
					dept: '医疗专家顾问',
					emoji: '🏥',
					color: '#D97706',
					bgColor: 'linear-gradient(135deg,#fffbeb,#fde68a)',
					desc: '临床场景把关与合规审查，确保产品功能贴合真实医学影像科需求。',
					skills: ['临床把关', '合规审查', '影像诊断', '科研指导']
				},
				{
					codeName: '兔灵6号',
					title: '刘先生',
					role: '安全卫士',
					dept: '隐私与安全',
					emoji: '🔒',
					color: '#6B7280',
					bgColor: 'linear-gradient(135deg,#f9fafb,#e5e7eb)',
					desc: '数据安全与隐私保护体系建设，守护患者数据与平台安全红线。',
					skills: ['数据安全', '隐私合规', '等保三级', '安全架构']
				}
			]
		}
	},
	methods: {
		goBack() {
			uni.navigateBack()
		},
		toggleExpand(i) {
			this.expandedIndex = this.expandedIndex === i ? -1 : i
		}
	}
}
</script>

<style lang="scss" scoped>
.team-page {
	min-height: 100vh;
	background: #FBFBFD;
	padding-bottom: 100rpx;
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
	color: #007AFF;
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
.nav-right {
	width: 80rpx;
}

/* 标题区 */
.header-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 48rpx 32rpx 32rpx;
}
.header-logo {
	font-size: 80rpx;
	margin-bottom: 16rpx;
}
.header-title {
	font-size: 40rpx;
	font-weight: 800;
	color: #1C1C1E;
	letter-spacing: 2rpx;
}
.header-sub {
	margin-top: 12rpx;
	font-size: 26rpx;
	color: #8E8E93;
}

/* 成员网格 */
.members-grid {
	padding: 16rpx 28rpx;
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

/* 成员卡片 */
.member-card {
	background: #fff;
	border-radius: 24rpx;
	box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.06);
	overflow: hidden;
	transition: all 0.25s ease;
}
.member-card.expanded {
	box-shadow: 0 4rpx 32rpx rgba(0,0,0,0.12);
}

.card-main {
	display: flex;
	align-items: center;
	padding: 28rpx 28rpx;
	gap: 24rpx;
}

.avatar-wrap {
	width: 96rpx;
	height: 96rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}
.avatar-emoji {
	font-size: 48rpx;
}

.card-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 6rpx;
}
.name-row {
	display: flex;
	align-items: baseline;
	gap: 14rpx;
}
.code-name {
	font-size: 34rpx;
	font-weight: 700;
	color: #1C1C1E;
}
.real-title {
	font-size: 24rpx;
	color: #8E8E93;
}
.role-tag {
	font-size: 24rpx;
	font-weight: 600;
}
.dept {
	font-size: 24rpx;
	color: #636366;
}

.expand-arrow {
	font-size: 28rpx;
	color: #C7C7CC;
	font-weight: 300;
}

/* 展开详情 */
.detail-divider {
	height: 1rpx;
	background: #F2F2F7;
	margin: 0 28rpx;
}
.card-detail {
	padding: 24rpx 28rpx 28rpx;
}
.detail-desc {
	font-size: 26rpx;
	color: #636366;
	line-height: 1.8;
	display: block;
	margin-bottom: 20rpx;
}
.skills-wrap {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
}
.skill-tag {
	font-size: 22rpx;
	padding: 6rpx 18rpx;
	border: 1.5rpx solid;
	border-radius: 100rpx;
	font-weight: 500;
}

/* 底部标语 */
.footer-motto {
	text-align: center;
	padding: 40rpx;
}
.motto-text {
	font-size: 26rpx;
	color: #C7C7CC;
}
</style>
