<template>
	<view class="page-container" :class="isDark ? 'dark-theme' : 'light-theme'">
		<view class="bg-glow"></view>

		<view class="glass-header">
			<view class="header-left" @click="goBack">
				<text class="back-icon">⇠</text>
				<text class="main-title">学术详情</text>
			</view>
			<view class="header-right">
				<view class="tag-academic">疑难案例</view>
			</view>
		</view>

		<scroll-view scroll-y class="content-scroll">
			<view class="image-section shadow-purple">
				<image class="main-img" src="https://via.placeholder.com/600/1E293B/FFFFFF?text=Case+Imaging" mode="aspectFit"></image>
				<view class="case-id-tag">Case ID: MT-2026-001</view>
			</view>

			<view class="ai-analysis-card">
				<view class="ai-header">
					<view class="ai-label">AI 影像特征提取</view>
					<text class="confidence">匹配度 98.4%</text>
				</view>
				<view class="feature-tags">
					<text class="f-tag">#磨玻璃结节</text>
					<text class="f-tag">#分叶征</text>
					<text class="f-tag">#胸膜凹陷</text>
				</view>
				<view class="analysis-txt">
					影像表现高度符合《2024肺结节诊疗共识》中的典型恶性征象。建议发起专家联合会诊以确定手术方案。
				</view>
			</view>

			<view class="section-label">关联专家共识</view>
			<view class="paper-card">
				<text class="paper-title">《肺部小结节影像诊断专家共识》</text>
				<text class="paper-meta">中华放射学杂志 | 2024版</text>
				<view class="paper-quote">
					“实性成分占比 (CTR) > 0.5 的磨玻璃结节，其浸润性概率显著增加...”
				</view>
			</view>

			<view class="footer-spacer"></view>
		</scroll-view>

		<view class="bottom-bar">
			<view class="action-group">
				<view class="consult-btn" @click="showConsult = true">
					<view class="consult-icon-box">
						<text class="c-icon">👨‍⚕️</text>
					</view>
					<text class="c-txt">申请会诊</text>
				</view>

				<button class="share-btn-main shadow-purple" open-type="share">
					<text class="btn-icon">💬</text>
					<text>分享病例到医生群</text>
				</button>
			</view>
		</view>

		<view class="consult-overlay" v-if="showConsult" @click.self="showConsult = false">
			<view class="consult-drawer animate-up">
				<view class="drawer-header">
					<text class="d-title">发起远程学术会诊</text>
					<text class="d-sub">对接主治及以上专家 · 15分钟极速响应</text>
				</view>
				<view class="price-box">
					<view class="p-top">
						<text class="p-currency">¥</text>
						<text class="p-val">200</text>
						<text class="p-unit">起/次</text>
					</view>
					<view class="p-list">
						<text>● DICOM 原始影像加密传输</text>
						<text>● 专家高清视频在线连线</text>
						<text>● 自动生成电子会诊报告</text>
					</view>
				</view>
				<button class="confirm-btn" @click="handleConsultSubmit">匹配对应领域专家</button>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			isDark: false,
			showConsult: false
		};
	},
	onShareAppMessage() {
		return {
			title: '[学术分享] 脱敏影像学习笔记与报告表达模板',
			path: '/pages/archive/detail/detail',
			imageUrl: 'https://via.placeholder.com/500/8B5CF6/FFFFFF?text=MedTuring+Academic'
		}
	},
	methods: {
		goBack() { uni.navigateBack(); },
		handleConsultSubmit() {
			uni.showLoading({ title: '正在匹配对应领域专家...' });
			setTimeout(() => {
				uni.hideLoading();
				this.showConsult = false;
				// 跳转到进度跟踪页
				uni.navigateTo({
					url: '/pages/archive/detail/status'
				});
			}, 1800);
		}
	}
}
</script>

<style>
.light-theme { --bg: #F8FAFC; --card: #FFFFFF; --primary: #8B5CF6; --text: #1E293B; --grid: #F1F5F9; }
.page-container { min-height: 100vh; background: var(--bg); position: relative; }

/* 头部 */
.glass-header { display: flex; justify-content: space-between; align-items: center; padding: 60rpx 40rpx 20rpx; position: sticky; top: 0; z-index: 100; background: rgba(248, 250, 252, 0.9); backdrop-filter: blur(20px); }
.back-icon { font-size: 40rpx; color: var(--primary); margin-right: 20rpx; }
.main-title { font-size: 32rpx; font-weight: 900; color: var(--text); }
.tag-academic { font-size: 18rpx; color: var(--primary); background: rgba(139, 92, 246, 0.1); padding: 6rpx 20rpx; border-radius: 100rpx; font-weight: 800; }

/* 影像展示 */
.image-section { margin: 20rpx 30rpx; border-radius: 40rpx; overflow: hidden; background: #000; height: 450rpx; position: relative; }
.main-img { width: 100%; height: 100%; }
.case-id-tag { position: absolute; top: 20rpx; left: 20rpx; background: rgba(0,0,0,0.5); color: #fff; font-size: 16rpx; padding: 4rpx 16rpx; border-radius: 8rpx; }

/* AI 特征提取卡片 */
.ai-analysis-card { margin: 30rpx; background: #1E293B; border-radius: 40rpx; padding: 36rpx; border: 1rpx solid rgba(139, 92, 246, 0.3); }
.ai-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24rpx; }
.ai-label { font-size: 20rpx; color: var(--primary); font-weight: 900; }
.confidence { font-size: 18rpx; color: #A78BFA; font-weight: 800; }
.feature-tags { display: flex; gap: 15rpx; margin-bottom: 24rpx; }
.f-tag { font-size: 18rpx; color: #fff; background: rgba(255,255,255,0.1); padding: 4rpx 16rpx; border-radius: 8rpx; }
.analysis-txt { font-size: 24rpx; color: rgba(255,255,255,0.8); line-height: 1.6; }

/* 共识卡片 */
.section-label { margin: 40rpx 30rpx 20rpx; font-size: 24rpx; font-weight: 900; color: #94A3B8; }
.paper-card { margin: 0 30rpx; background: #fff; border-radius: 40rpx; padding: 40rpx; border: 1rpx solid var(--grid); }
.paper-title { font-size: 28rpx; font-weight: 900; }
.paper-meta { font-size: 20rpx; color: var(--primary); margin: 10rpx 0 20rpx; display: block; }
.paper-quote { font-size: 22rpx; color: #64748B; font-style: italic; line-height: 1.8; background: #F8FAFC; padding: 20rpx; border-radius: 20rpx; }

.footer-spacer { height: 260rpx; }

/* 底部操作 */
.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 40rpx 40rpx 60rpx; background: linear-gradient(to top, var(--bg), transparent); }
.action-group { display: flex; align-items: center; gap: 30rpx; }
.consult-btn { display: flex; flex-direction: column; align-items: center; width: 140rpx; }
.consult-icon-box { width: 70rpx; height: 70rpx; background: #fff; border-radius: 24rpx; display: flex; align-items: center; justify-content: center; box-shadow: 0 10rpx 20rpx rgba(0,0,0,0.05); margin-bottom: 10rpx; }
.c-icon { font-size: 36rpx; }
.c-txt { font-size: 18rpx; color: #64748B; font-weight: 800; }
.share-btn-main { flex: 1; background: var(--primary); color: #fff; height: 110rpx; border-radius: 32rpx; display: flex; align-items: center; justify-content: center; gap: 20rpx; font-weight: 900; font-size: 28rpx; border: none; }

/* 弹窗样式 */
.consult-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 1001; display: flex; align-items: flex-end; }
.consult-drawer { width: 100%; background: #fff; border-radius: 60rpx 60rpx 0 0; padding: 60rpx 40rpx 80rpx; }
.d-title { font-size: 36rpx; font-weight: 900; }
.d-sub { font-size: 24rpx; color: #94A3B8; margin-top: 10rpx; display: block; }
.price-box { margin: 40rpx 0; background: #F8FAFC; border-radius: 40rpx; padding: 40rpx; border: 1rpx solid #E2E8F0; }
.p-top { display: flex; align-items: baseline; color: var(--primary); }
.p-val { font-size: 60rpx; font-weight: 900; margin: 0 10rpx; }
.p-list { margin-top: 30rpx; font-size: 22rpx; color: #64748B; line-height: 1.8; }
.confirm-btn { background: #1E293B; color: #fff; border-radius: 30rpx; height: 100rpx; font-weight: 900; border: none; }

.shadow-purple { box-shadow: 0 20rpx 40rpx rgba(139, 92, 246, 0.25); }
.animate-up { animation: slideUp 0.3s ease-out; }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
</style>