<template>
	<view class="share-container light-theme">
		<view class="glass-header">
			<view class="header-left" @click="goBack">
				<text class="back-icon">←</text>
				<text class="main-title">生成分享卡片</text>
			</view>
		</view>

		<view class="share-card-wrapper animate-fade-in">
			<view class="share-card shadow-blue">
				<view class="card-header">
					<view class="brand-row">
						<image class="mini-logo" src="/static/logo_rabbit.png" mode="aspectFit"></image>
						<text class="brand-name">一图灵 · 经验备忘录</text>
					</view>
					<view class="author-tag">
						<text class="v-tick">✓</text>
						<text class="author-name">马文 · 执业医师</text>
					</view>
				</view>

				<view class="card-body">
					<view class="tag-row">
						<text class="hash-tag">#征象描述技巧</text>
					</view>
					<text class="memo-text">
						【影像表现】双肺野清晰，未见明显实质性浸润影。两肺门不大，位置及形态正常。心影大小、形态均在正常范围内。双侧膈面光滑，肋膈角锐利。
					</text>
					<view class="memo-note-box">
						<text class="note-icon">💡</text>
						<text class="note-text">个人备注：遇到正常的入职体检胸片，直接用这套标准模板，一秒出报告！</text>
					</view>
				</view>

				<view class="card-footer">
					<view class="footer-left">
						<text class="slogan">十万基层大夫的影像口袋书</text>
						<text class="disclaimer">本卡片经 AI 强制脱敏，仅供医学专业人士学术参考，不作诊断依据。</text>
					</view>
					<view class="qr-placeholder">
						<text class="qr-icon">🔍</text>
						<text class="qr-text">扫码查阅</text>
					</view>
				</view>
			</view>
		</view>

		<view class="footer-actions animate-up">
			<button class="btn-primary" @click="saveImage">保存高清长图</button>
			<button class="btn-secondary" @click="goBack">返回修改</button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {}
	},
	methods: {
		saveImage() {
			uni.showLoading({ title: '正在生成高清图...' });
			setTimeout(() => {
				uni.hideLoading();
				// 实际开发中这里会调用 uni.canvasToTempFilePath 或 HTML2Canvas
				uni.showToast({ title: '卡片已保存至相册，快去分享吧！', icon: 'none', duration: 2500 });
			}, 1200);
		},
		goBack() {
			uni.navigateBack();
		}
	}
}
</script>

<style>
/* 锁死科技蓝主题，清除所有幽灵空格 */
.light-theme { --bg: #F8FAFC; --card: #FFFFFF; --primary: #007AFF; --text: #1E293B; --grid: #E2E8F0; }
.share-container { min-height: 100vh; background: var(--bg); padding: 40rpx; font-family: -apple-system, sans-serif; display: flex; flex-direction: column; }

/* 头部 */
.glass-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40rpx; padding-top: 40rpx;}
.header-left { display: flex; align-items: center; }
.back-icon { font-size: 40rpx; color: var(--primary); margin-right: 16rpx; font-weight: 900;}
.main-title { font-size: 36rpx; font-weight: 900; color: var(--text); }

/* 卡片容器 */
.share-card-wrapper { flex: 1; display: flex; justify-content: center; align-items: center; margin-bottom: 40rpx; }
.share-card { background: var(--card); border-radius: 40rpx; width: 100%; max-width: 680rpx; overflow: hidden; position: relative; border: 1rpx solid var(--grid); }
.shadow-blue { box-shadow: 0 30rpx 60rpx rgba(0, 122, 255, 0.12); }

/* 卡片头部 */
.card-header { padding: 36rpx; display: flex; justify-content: space-between; align-items: center; border-bottom: 1rpx solid var(--grid); background: rgba(0, 122, 255, 0.02); }
.brand-row { display: flex; align-items: center; gap: 12rpx; }
.mini-logo { width: 44rpx; height: 44rpx; }
.brand-name { font-size: 28rpx; font-weight: 900; color: var(--primary); letter-spacing: 1rpx;}
.author-tag { display: flex; align-items: center; gap: 6rpx; background: rgba(46, 204, 113, 0.1); padding: 8rpx 20rpx; border-radius: 100rpx; }
.v-tick { color: #059669; font-size: 20rpx; font-weight: 900; }
.author-name { font-size: 20rpx; color: #059669; font-weight: 800; }

/* 卡片正文 */
.card-body { padding: 40rpx 36rpx; }
.tag-row { margin-bottom: 24rpx; }
.hash-tag { font-size: 28rpx; color: var(--primary); font-weight: 900; background: rgba(0, 122, 255, 0.08); padding: 8rpx 20rpx; border-radius: 12rpx; }
.memo-text { font-size: 32rpx; color: var(--text); line-height: 1.7; font-weight: 700; display: block; margin-bottom: 30rpx; text-align: justify; }

/* 个人批注区 */
.memo-note-box { background: #F8FAFC; padding: 24rpx; border-radius: 20rpx; display: flex; align-items: flex-start; gap: 12rpx; border: 1rpx dashed #CBD5E1;}
.note-icon { font-size: 28rpx; margin-top: 4rpx;}
.note-text { font-size: 24rpx; color: #64748B; line-height: 1.6; font-weight: 800; }

/* 卡片底部 (裂变引流区) */
.card-footer { padding: 36rpx; background: #1E293B; display: flex; justify-content: space-between; align-items: center; }
.footer-left { flex: 1; padding-right: 30rpx; }
.slogan { font-size: 28rpx; color: #FFFFFF; font-weight: 900; display: block; margin-bottom: 12rpx; letter-spacing: 2rpx;}
.disclaimer { font-size: 18rpx; color: #94A3B8; line-height: 1.5; font-weight: 700; opacity: 0.8; }

/* 二维码占位符 */
.qr-placeholder { width: 100rpx; height: 100rpx; background: #FFFFFF; border-radius: 16rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 8rpx;}
.qr-icon { font-size: 32rpx; margin-bottom: 4rpx;}
.qr-text { font-size: 16rpx; color: var(--text); font-weight: 900; text-align: center; }

/* 底部操作按钮 */
.footer-actions { padding-bottom: 60rpx; display: flex; flex-direction: column; gap: 24rpx; }
.btn-primary { background: var(--primary); color: #fff; border-radius: 100rpx; font-weight: 900; font-size: 32rpx; border: none; height: 110rpx; display: flex; align-items: center; justify-content: center; box-shadow: 0 10rpx 30rpx rgba(0, 122, 255, 0.3);}
.btn-primary::after { border: none; }
.btn-secondary { background: transparent; color: var(--text); border-radius: 100rpx; font-size: 32rpx; border: 2rpx solid var(--grid); font-weight: 800; height: 110rpx; display: flex; align-items: center; justify-content: center;}
.btn-secondary::after { border: none; }

/* 动画 */
.animate-fade-in { animation: fadeIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); }
.animate-up { animation: fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; animation-delay: 0.1s;}
@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(40rpx); } to { opacity: 1; transform: translateY(0); } }
</style>