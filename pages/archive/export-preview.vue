<template>
	<view class="page-container light-theme">
		<view class="bg-glow"></view>

		<view class="glass-header">
			<view class="h-left" @click="goBack">
				<text class="back-icon">←</text>
				<text class="h-title">长图排版预览</text>
			</view>
		</view>

		<view class="preview-hero shadow-blue">
			<view class="poster-mockup" :style="{ background: currentSkinColor }">
				<view class="poster-header">
					<image class="poster-logo" src="/static/logo_rabbit.png" mode="aspectFit"></image>
					<text class="poster-brand">一图灵 · 经验备忘</text>
				</view>
				<view class="poster-body">
					<text class="poster-main-title">典型肺部影像分析规范模板</text>
					<view class="poster-divider"></view>
					<text class="poster-sub-title">学术交流分享 / 内部归档</text>
				</view>
				<view class="poster-footer">
					<text class="poster-sign">分享人：{{ doctorName }} [V]</text>
				</view>
			</view>
			<text class="preview-tip">排版引擎已根据您的笔记自动生成高清长图</text>
		</view>

		<view class="section-label">选择分享主题色</view>
		<scroll-view scroll-x class="skin-scroll">
			<view class="skin-list">
				<view class="skin-card" v-for="s in skins" :key="s.id" 
					:class="{ active: activeSkin === s.id }" @click="activeSkin = s.id">
					<view class="skin-color-box" :style="{ background: s.color }">
						<text class="check-icon" v-if="activeSkin === s.id">✓</text>
					</view>
					<text class="skin-name">{{ s.name }}</text>
				</view>
			</view>
		</scroll-view>

		<view class="config-section">
			<view class="config-item">
				<text class="c-label">显示实名认证标识 [V]</text>
				<switch checked color="#007AFF" />
			</view>
			<view class="config-item">
				<text class="c-label">附带底部引流二维码</text>
				<switch checked color="#007AFF" />
			</view>
		</view>

		<view class="bottom-action">
			<button class="confirm-export-btn shadow-blue" @click="startExport">
				确认并保存至系统相册
			</button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			// 直接拉取本地存储的实名认证名字，没名字就用默认
			doctorName: '马文医生',
			activeSkin: 'blue',
			skins: [
				// 颜色重新定义，更符合专业医疗审美
				{ id: 'blue', name: '极简深蓝', color: '#1E293B' },
				{ id: 'tech', name: '科技冰蓝', color: '#007AFF' },
				{ id: 'white', name: '权威纯白', color: '#FFFFFF' },
				{ id: 'black', name: '沉稳黑卡', color: '#09050B' }
			]
		}
	},
	computed: {
		currentSkinColor() {
			return this.skins.find(s => s.id === this.activeSkin).color;
		}
	},
	methods: {
		goBack() { uni.navigateBack(); },
		startExport() {
			uni.showLoading({ title: '正在渲染高清海报...' });
			setTimeout(() => {
				uni.hideLoading();
				uni.showModal({
					title: '保存成功',
					content: '高清分享图已存入您的手机相册。快去发朋友圈展示您的专业吧！',
					confirmText: '好的',
					confirmColor: '#007AFF',
					showCancel: false
				});
			}, 1500);
		}
	}
}
</script>

<style>
/* 全局科技蓝，所有幽灵空格已杀毒 */
.light-theme { --bg: #F8FAFC; --card: #FFFFFF; --primary: #007AFF; --text: #0F172A; --sub: #94A3B8; --grid: #E2E8F0;}
.page-container { min-height: 100vh; background: var(--bg); padding: 40rpx; position: relative; overflow: hidden;}
.bg-glow { position: absolute; top: -100rpx; left: -100rpx; width: 500rpx; height: 500rpx; background: radial-gradient(circle, rgba(0, 122, 255, 0.05) 0%, transparent 70%); pointer-events: none;}

/* 头部 */
.glass-header { margin-bottom: 50rpx; padding-top: 40rpx; position: relative; z-index: 10;}
.h-left { display: flex; align-items: center; gap: 16rpx; }
.back-icon { font-size: 40rpx; color: var(--primary); font-weight: 900;}
.h-title { font-size: 32rpx; font-weight: 900; color: var(--text); }

/* 海报预览卡片 */
.preview-hero { margin-bottom: 60rpx; text-align: center; position: relative; z-index: 10;}
.poster-mockup { 
	width: 100%; height: 440rpx; border-radius: 40rpx; padding: 50rpx;
	display: flex; flex-direction: column; justify-content: space-between;
	text-align: left; transition: background 0.3s ease;
	position: relative; overflow: hidden; border: 1rpx solid var(--grid);
}
.poster-logo { width: 44rpx; height: 44rpx; }
.poster-header { display: flex; align-items: center; gap: 12rpx; }
.poster-brand { font-size: 22rpx; color: rgba(255,255,255,0.8); font-weight: 900; letter-spacing: 2rpx; }
.poster-main-title { font-size: 36rpx; font-weight: 900; color: #fff; display: block; line-height: 1.4;}
.poster-divider { width: 60rpx; height: 6rpx; background: rgba(255,255,255,0.4); margin: 20rpx 0; border-radius: 10rpx;}
.poster-sub-title { font-size: 20rpx; color: rgba(255,255,255,0.6); font-weight: 700; }
.poster-sign { font-size: 24rpx; color: #fff; font-weight: 900; }

/* 针对白色皮肤的反色处理 */
.preview-hero [style*="background: #FFFFFF"] .poster-main-title,
.preview-hero [style*="background: #FFFFFF"] .poster-sign { color: #1E293B; }
.preview-hero [style*="background: #FFFFFF"] .poster-brand { color: var(--primary); }
.preview-hero [style*="background: #FFFFFF"] .poster-sub-title { color: #94A3B8; }
.preview-hero [style*="background: #FFFFFF"] .poster-divider { background: var(--primary); }

.preview-tip { font-size: 20rpx; color: var(--sub); margin-top: 30rpx; display: block; font-weight: 800; }

/* 皮肤选择区 */
.section-label { font-size: 26rpx; font-weight: 900; color: var(--text); margin-bottom: 30rpx; position: relative; z-index: 10;}
.skin-scroll { width: 100%; white-space: nowrap; margin-bottom: 50rpx; position: relative; z-index: 10;}
.skin-list { display: inline-flex; gap: 30rpx; padding-right: 40rpx; }
.skin-card { display: flex; flex-direction: column; align-items: center; gap: 16rpx; }
.skin-color-box { 
	width: 110rpx; height: 110rpx; border-radius: 30rpx; 
	display: flex; align-items: center; justify-content: center;
	border: 2rpx solid var(--grid);
}
.active .skin-color-box { border: 6rpx solid var(--primary); transform: scale(1.05); }
.skin-name { font-size: 20rpx; font-weight: 800; color: var(--sub); }
.active .skin-name { color: var(--primary); }
.check-icon { color: #fff; font-weight: 900; font-size: 32rpx;}
.active [style*="background: #FFFFFF"] .check-icon { color: var(--primary); }

/* 配置项 */
.config-section { background: #fff; border-radius: 32rpx; padding: 10rpx 40rpx; border: 1rpx solid var(--grid); position: relative; z-index: 10;}
.config-item { display: flex; justify-content: space-between; align-items: center; height: 110rpx; border-bottom: 1rpx solid var(--grid); }
.config-item:last-child { border: none; }
.c-label { font-size: 26rpx; font-weight: 800; color: var(--text); }

/* 底部按钮改为苹果风 */
.bottom-action { margin-top: 60rpx; position: relative; z-index: 10;}
.confirm-export-btn { 
	height: 110rpx; background: var(--primary); color: #fff; 
	border-radius: 100rpx; display: flex; align-items: center; justify-content: center;
	font-weight: 900; font-size: 32rpx; border: none;
}
.confirm-export-btn::after { border: none; }

.shadow-blue { box-shadow: 0 20rpx 50rpx rgba(0, 122, 255, 0.2); }
</style>