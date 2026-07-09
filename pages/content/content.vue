<template>
	<view class="content-page">
		<!-- 顶部导航 -->
		<view class="nav-bar">
			<view class="nav-back" @tap="goBack">
				<text class="back-icon">‹</text>
				<text class="back-text">返回</text>
			</view>
			<text class="nav-title">内容工坊</text>
			<view class="nav-right"></view>
		</view>

		<!-- 平台切换 -->
		<view class="platform-tabs">
			<view
				class="tab-item"
				:class="{ active: platform === 'wechat' }"
				@tap="platform = 'wechat'"
			>
				<text class="tab-icon">📱</text>
				<text class="tab-text">公众号</text>
			</view>
			<view
				class="tab-item"
				:class="{ active: platform === 'rednote' }"
				@tap="platform = 'rednote'"
			>
				<text class="tab-icon">📖</text>
				<text class="tab-text">小红书</text>
			</view>
		</view>

		<!-- 内容配置区 -->
		<view class="config-section">
			<!-- 主题输入 -->
			<view class="config-card">
				<text class="card-label">📝 创作主题</text>
				<textarea
					class="topic-input"
					v-model="topic"
					placeholder="输入本次内容主题，如：胸部CT阅片技巧..."
					maxlength="100"
					auto-height
				/>
				<text class="input-count">{{ topic.length }}/100</text>
			</view>

			<!-- 对标账号 -->
			<view class="config-card">
				<text class="card-label">🎯 对标账号</text>
				<view class="accounts-list">
					<view
						v-for="(a, i) in accounts[platform]"
						:key="i"
						class="account-chip"
						:class="{ selected: selectedAccount === a }"
						@tap="selectedAccount = a"
					>
						<text class="chip-text">{{ a }}</text>
					</view>
				</view>
			</view>

			<!-- 热门话题 -->
			<view class="config-card">
				<text class="card-label">🔥 热门话题</text>
				<view class="topics-list">
					<view
						v-for="(t, i) in hotTopics"
						:key="i"
						class="topic-chip"
						:class="{ selected: selectedTopic === t.tag }"
						@tap="selectedTopic = t.tag; topic = topic || t.title"
					>
						<text class="topic-rank">{{ i + 1 }}</text>
						<text class="topic-text">{{ t.tag }}</text>
					</view>
				</view>
			</view>

			<!-- 文风选择 -->
			<view class="config-card">
				<text class="card-label">🎨 内容文风</text>
				<view class="style-options">
					<view
						v-for="s in styles"
						:key="s.key"
						class="style-option"
						:class="{ selected: contentStyle === s.key }"
						@tap="contentStyle = s.key"
					>
						<text class="style-icon">{{ s.icon }}</text>
						<text class="style-name">{{ s.name }}</text>
					</view>
				</view>
			</view>

			<!-- 标签管理 -->
			<view class="config-card">
				<text class="card-label">🏷️ 内容标签</text>
				<view class="tags-wrap">
					<view v-for="(tag, i) in tags" :key="i" class="tag-item">
						<text class="tag-text"># {{ tag }}</text>
						<text class="tag-remove" @tap="removeTag(i)">×</text>
					</view>
					<view class="tag-add" @tap="showAddTag">
						<text class="tag-add-text">+ 添加</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 生成按钮 -->
		<view class="generate-wrap">
			<view class="generate-btn" :class="{ loading: generating }" @tap="generate">
				<text class="generate-icon">{{ generating ? '⏳' : '✨' }}</text>
				<text class="generate-text">{{ generating ? '生成中...' : '一键生成内容' }}</text>
			</view>
		</view>

		<!-- 预览区 -->
		<view v-if="previewContent.title" class="preview-section">
			<text class="preview-title-label">📄 内容预览</text>

			<!-- 公众号预览 -->
			<view v-if="platform === 'wechat'" class="wechat-preview">
				<!-- 封面图区 -->
				<view class="wechat-cover">
					<text class="cover-hint">封面图 · 建议尺寸 900×383px</text>
				</view>
				<!-- 文章标题 -->
				<text class="wechat-article-title">{{ previewContent.title }}</text>
				<!-- 摘要 -->
				<view class="wechat-abstract">
					<text class="abstract-text">{{ previewContent.summary }}</text>
				</view>
				<!-- 正文分节 -->
				<view v-for="(section, i) in previewContent.sections" :key="i" class="wechat-section">
					<view class="section-title-row">
						<view class="section-dot" :style="{ background: sectionColors[i % sectionColors.length] }"></view>
						<text class="section-title">{{ section.title }}</text>
					</view>
					<text class="section-body">{{ section.body }}</text>
				</view>
				<!-- CTA -->
				<view class="wechat-cta">
					<text class="cta-text">觉得有用？点击右下角「在看」支持一下 👇</text>
				</view>
				<!-- 署名 -->
				<view class="wechat-footer">
					<text class="footer-sign">— 一图灵团队 出品 —</text>
				</view>
			</view>

			<!-- 小红书预览 -->
			<view v-if="platform === 'rednote'" class="rednote-preview">
				<!-- 封面 -->
				<view class="rednote-cover">
					<text class="rednote-cover-title">{{ previewContent.title }}</text>
					<text class="rednote-cover-sub">🐰 一图灵</text>
				</view>
				<!-- 博主信息行 -->
				<view class="blogger-row">
					<view class="blogger-avatar">
						<text class="avatar-letter">医</text>
					</view>
					<text class="blogger-name">一图灵</text>
					<view class="follow-btn">
						<text class="follow-text">+ 关注</text>
					</view>
				</view>
				<!-- 正文 -->
				<text class="rednote-body">{{ previewContent.body }}</text>
				<!-- 标签 -->
				<view class="rednote-tags">
					<text v-for="(tag, i) in tags" :key="i" class="rn-tag"># {{ tag }}</text>
				</view>
				<!-- 互动栏 -->
				<view class="rednote-actions">
					<text class="action-item">❤️ 点赞</text>
					<text class="action-item">⭐ 收藏</text>
					<text class="action-item">💬 评论</text>
					<text class="action-item">↗ 分享</text>
				</view>
			</view>

			<!-- 操作按钮 -->
			<view class="action-row">
				<view class="action-btn action-copy" @tap="copyContent">
					<text class="action-btn-text">📋 复制全文</text>
				</view>
				<view class="action-btn action-new" @tap="clearPreview">
					<text class="action-btn-text">🔄 重新生成</text>
				</view>
			</view>
		</view>

		<!-- 底部占位 -->
		<view style="height: 100rpx;"></view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			platform: 'wechat',
			topic: '',
			selectedAccount: '',
			selectedTopic: '',
			contentStyle: 'popular',
			generating: false,
			tags: ['医学影像', '放射科', '病例分享'],
			sectionColors: ['#007AFF', '#34C759', '#FF9500', '#7C3AED'],
			accounts: {
				wechat: ['医学影像技术学', '放射视界', '医影天下', '影像人之家'],
				rednote: ['影像小课堂', '放射科日常', '医学影像干货', '影像技师成长录']
			},
			hotTopics: [
				{ tag: '#影像效率工具', title: 'AI如何提升影像科工作效率' },
				{ tag: '#胸部CT读片', title: '胸部CT阅片技巧精讲' },
				{ tag: '#影像技师', title: '影像技师的一天' },
				{ tag: '#医院信息化', title: '医院PACS系统升级之路' },
				{ tag: '#放射防护', title: '放射科辐射防护指南' }
			],
			styles: [
				{ key: 'academic', icon: '🎓', name: '严谨学术' },
				{ key: 'popular', icon: '📡', name: '专业科普' },
				{ key: 'casual', icon: '😊', name: '轻松活泼' }
			],
			previewContent: {
				title: '',
				summary: '',
				sections: [],
				body: ''
			}
		}
	},
	methods: {
		goBack() {
			uni.navigateBack()
		},
		removeTag(i) {
			this.tags.splice(i, 1)
		},
		showAddTag() {
			uni.showModal({
				title: '添加标签',
				editable: true,
				placeholderText: '输入标签名称',
				success: res => {
					if (res.confirm && res.content && res.content.trim()) {
						this.tags.push(res.content.trim())
					}
				}
			})
		},
		generate() {
			if (!this.topic.trim()) {
				uni.showToast({ title: '请先输入创作主题', icon: 'none' })
				return
			}
			this.generating = true

			// 模拟生成（实际接入 LLM API 后替换此处）
			setTimeout(() => {
				this.generating = false
				const t = this.topic
				if (this.platform === 'wechat') {
					this.previewContent = {
						title: `深度解析 | ${t}`,
						summary: `本文深入探讨「${t}」的核心要点，结合临床实际案例，帮助医影从业者提升专业技能。适合放射科医生、技师及医学生阅读。`,
						sections: [
							{ title: '一、背景与现状', body: `${t}在现代医学影像领域日益重要，随着设备技术迭代更新，掌握核心要点成为每位医影人的必修课。` },
							{ title: '二、关键技术要点', body: `从实操角度出发，${t}需要关注以下几个核心维度：参数设置、患者体位、图像后处理……` },
							{ title: '三、常见误区与注意事项', body: `临床中容易犯的错误主要集中在：忽视个体差异、依赖单一窗宽窗位、忽略临床信息……` },
							{ title: '四、总结与建议', body: `建议将${t}的学习纳入日常规培计划，结合典型病例反复练习，逐步形成影像思维体系。` }
						],
						body: ''
					}
				} else {
					this.previewContent = {
						title: `💡 ${t}`,
						summary: '',
						sections: [],
						body: `⚡ 今天聊聊「${t}」\n\n作为影像人，这个问题太重要了！✨\n\n📌 核心要点1：掌握基础参数，才能出好图\n📌 核心要点2：多看典型病例，建立影像思维\n📌 核心要点3：善用 AI 工具，提升工作效率\n\n💬 你在工作中遇到的最难搞的情况是什么？评论区分享！\n\n🐰 一图灵陪你成长，每天进步一点点～`
					}
				}
			}, 1500)
		},
		copyContent() {
			let text = ''
			if (this.platform === 'wechat') {
				text = `${this.previewContent.title}\n\n${this.previewContent.summary}\n\n`
				this.previewContent.sections.forEach(s => {
					text += `${s.title}\n${s.body}\n\n`
				})
			} else {
				text = `${this.previewContent.title}\n\n${this.previewContent.body}\n\n${this.tags.map(t => '#' + t).join(' ')}`
			}
			uni.setClipboardData({
				data: text,
				success: () => uni.showToast({ title: '已复制到剪贴板', icon: 'success' })
			})
		},
		clearPreview() {
			this.previewContent = { title: '', summary: '', sections: [], body: '' }
			this.topic = ''
		}
	}
}
</script>

<style lang="scss" scoped>
.content-page {
	min-height: 100vh;
	background: #FBFBFD;
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
.back-icon { font-size: 44rpx; color: #007AFF; line-height: 1; }
.back-text { font-size: 28rpx; color: #007AFF; }
.nav-title { font-size: 34rpx; font-weight: 700; color: #1C1C1E; }
.nav-right { width: 80rpx; }

/* 平台切换 */
.platform-tabs {
	display: flex;
	margin: 24rpx 28rpx 0;
	background: #F2F2F7;
	border-radius: 20rpx;
	padding: 8rpx;
	gap: 8rpx;
}
.tab-item {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
	height: 72rpx;
	border-radius: 14rpx;
	transition: all 0.2s;
}
.tab-item.active {
	background: #fff;
	box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.1);
}
.tab-icon { font-size: 32rpx; }
.tab-text { font-size: 26rpx; font-weight: 600; color: #636366; }
.tab-item.active .tab-text { color: #1C1C1E; }

/* 配置区 */
.config-section {
	padding: 24rpx 28rpx;
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}
.config-card {
	background: #fff;
	border-radius: 20rpx;
	padding: 28rpx;
	box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
}
.card-label {
	font-size: 26rpx;
	font-weight: 600;
	color: #636366;
	display: block;
	margin-bottom: 18rpx;
}

/* 主题输入 */
.topic-input {
	width: 100%;
	font-size: 28rpx;
	color: #1C1C1E;
	line-height: 1.6;
	min-height: 80rpx;
}
.input-count {
	font-size: 22rpx;
	color: #C7C7CC;
	display: block;
	text-align: right;
	margin-top: 8rpx;
}

/* 账号列表 */
.accounts-list, .topics-list {
	display: flex;
	flex-wrap: wrap;
	gap: 14rpx;
}
.account-chip {
	padding: 10rpx 22rpx;
	background: #F2F2F7;
	border-radius: 100rpx;
	border: 2rpx solid transparent;
	transition: all 0.15s;
}
.account-chip.selected {
	background: #E8F4FF;
	border-color: #007AFF;
}
.chip-text {
	font-size: 24rpx;
	color: #636366;
}
.account-chip.selected .chip-text {
	color: #007AFF;
	font-weight: 600;
}

/* 热门话题 */
.topic-chip {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 10rpx 22rpx;
	background: #F2F2F7;
	border-radius: 100rpx;
	border: 2rpx solid transparent;
	transition: all 0.15s;
}
.topic-chip.selected {
	background: #FFF4E5;
	border-color: #FF9500;
}
.topic-rank {
	font-size: 20rpx;
	color: #FF3B30;
	font-weight: 700;
}
.topic-text {
	font-size: 24rpx;
	color: #636366;
}
.topic-chip.selected .topic-text {
	color: #FF9500;
	font-weight: 600;
}

/* 文风选择 */
.style-options {
	display: flex;
	gap: 16rpx;
}
.style-option {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;
	padding: 20rpx 0;
	background: #F2F2F7;
	border-radius: 16rpx;
	border: 2rpx solid transparent;
	transition: all 0.15s;
}
.style-option.selected {
	background: #E8F4FF;
	border-color: #007AFF;
}
.style-icon { font-size: 36rpx; }
.style-name { font-size: 22rpx; color: #636366; }
.style-option.selected .style-name { color: #007AFF; font-weight: 600; }

/* 标签管理 */
.tags-wrap {
	display: flex;
	flex-wrap: wrap;
	gap: 14rpx;
}
.tag-item {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 10rpx 20rpx;
	background: #E8F4FF;
	border-radius: 100rpx;
}
.tag-text {
	font-size: 24rpx;
	color: #007AFF;
}
.tag-remove {
	font-size: 28rpx;
	color: #007AFF;
	line-height: 1;
}
.tag-add {
	padding: 10rpx 20rpx;
	background: #F2F2F7;
	border-radius: 100rpx;
}
.tag-add-text {
	font-size: 24rpx;
	color: #8E8E93;
}

/* 生成按钮 */
.generate-wrap {
	padding: 16rpx 28rpx 8rpx;
}
.generate-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	height: 96rpx;
	background: linear-gradient(135deg, #007AFF, #5856D6);
	border-radius: 28rpx;
	box-shadow: 0 8rpx 24rpx rgba(0,122,255,0.35);
	transition: all 0.2s;
}
.generate-btn.loading {
	opacity: 0.7;
}
.generate-icon { font-size: 36rpx; }
.generate-text {
	font-size: 32rpx;
	font-weight: 700;
	color: #fff;
}

/* 预览区 */
.preview-section {
	margin: 24rpx 28rpx;
}
.preview-title-label {
	font-size: 28rpx;
	font-weight: 700;
	color: #1C1C1E;
	display: block;
	margin-bottom: 16rpx;
}

/* 公众号预览 */
.wechat-preview {
	background: #fff;
	border-radius: 20rpx;
	overflow: hidden;
	box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.08);
}
.wechat-cover {
	width: 100%;
	height: 220rpx;
	background: linear-gradient(135deg, #667eea, #764ba2);
	display: flex;
	align-items: center;
	justify-content: center;
}
.cover-hint {
	font-size: 22rpx;
	color: rgba(255,255,255,0.6);
}
.wechat-article-title {
	display: block;
	font-size: 36rpx;
	font-weight: 800;
	color: #1C1C1E;
	padding: 28rpx 28rpx 0;
	line-height: 1.4;
}
.wechat-abstract {
	margin: 20rpx 28rpx;
	padding: 16rpx 20rpx;
	background: #F2F2F7;
	border-left: 6rpx solid #007AFF;
	border-radius: 0 12rpx 12rpx 0;
}
.abstract-text {
	font-size: 24rpx;
	color: #636366;
	line-height: 1.8;
}
.wechat-section {
	padding: 0 28rpx 20rpx;
}
.section-title-row {
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-bottom: 12rpx;
}
.section-dot {
	width: 10rpx;
	height: 10rpx;
	border-radius: 50%;
}
.section-title {
	font-size: 28rpx;
	font-weight: 700;
	color: #1C1C1E;
}
.section-body {
	font-size: 26rpx;
	color: #636366;
	line-height: 1.9;
}
.wechat-cta {
	margin: 8rpx 28rpx 20rpx;
	padding: 20rpx;
	background: #FFF9E6;
	border-radius: 16rpx;
	text-align: center;
}
.cta-text {
	font-size: 24rpx;
	color: #D97706;
}
.wechat-footer {
	padding: 16rpx 28rpx 28rpx;
	text-align: center;
	border-top: 1rpx solid #F2F2F7;
}
.footer-sign {
	font-size: 22rpx;
	color: #C7C7CC;
}

/* 小红书预览 */
.rednote-preview {
	background: #fff;
	border-radius: 20rpx;
	overflow: hidden;
	box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.08);
}
.rednote-cover {
	width: 100%;
	height: 320rpx;
	background: linear-gradient(135deg, #FF4060, #FF6B8A);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 32rpx;
}
.rednote-cover-title {
	font-size: 38rpx;
	font-weight: 800;
	color: #fff;
	text-align: center;
	line-height: 1.4;
}
.rednote-cover-sub {
	margin-top: 16rpx;
	font-size: 24rpx;
	color: rgba(255,255,255,0.8);
}
.blogger-row {
	display: flex;
	align-items: center;
	gap: 16rpx;
	padding: 20rpx 24rpx;
}
.blogger-avatar {
	width: 64rpx;
	height: 64rpx;
	border-radius: 50%;
	background: #FF4060;
	display: flex;
	align-items: center;
	justify-content: center;
}
.avatar-letter {
	font-size: 28rpx;
	color: #fff;
	font-weight: 700;
}
.blogger-name {
	flex: 1;
	font-size: 26rpx;
	font-weight: 600;
	color: #1C1C1E;
}
.follow-btn {
	padding: 10rpx 24rpx;
	border: 1.5rpx solid #FF4060;
	border-radius: 100rpx;
}
.follow-text {
	font-size: 22rpx;
	color: #FF4060;
	font-weight: 600;
}
.rednote-body {
	display: block;
	padding: 0 24rpx 20rpx;
	font-size: 26rpx;
	color: #1C1C1E;
	line-height: 1.9;
	white-space: pre-line;
}
.rednote-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	padding: 0 24rpx 20rpx;
}
.rn-tag {
	font-size: 24rpx;
	color: #2563EB;
}
.rednote-actions {
	display: flex;
	justify-content: space-around;
	padding: 20rpx 24rpx;
	border-top: 1rpx solid #F2F2F7;
}
.action-item {
	font-size: 24rpx;
	color: #636366;
}

/* 操作按钮 */
.action-row {
	display: flex;
	gap: 16rpx;
	margin-top: 20rpx;
}
.action-btn {
	flex: 1;
	height: 80rpx;
	border-radius: 20rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}
.action-copy { background: #007AFF; }
.action-new { background: #F2F2F7; }
.action-btn-text {
	font-size: 26rpx;
	font-weight: 600;
}
.action-copy .action-btn-text { color: #fff; }
.action-new .action-btn-text { color: #636366; }
</style>
