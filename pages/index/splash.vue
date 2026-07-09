<template>
	<view class="splash-container">
		<view class="bg-layer">
			<view class="bg-grid"></view>
			<view class="bg-glow"></view>
		</view>

		<view class="main-content" :class="{ 'fade-in': show }">
			
			<view class="center-stage">
				
				<view class="solar-system">
					<view class="orbit orbit-inner">
						<view class="planet planet-blue"></view>
					</view>
					
					<view class="orbit orbit-middle"></view>
					
					<view class="orbit orbit-outer">
						<view class="planet planet-cyan"></view>
						<view class="planet planet-cyan opposite"></view>
					</view>

					<view class="orbit orbit-3d">
						<view class="planet planet-bright"></view>
					</view>
				</view>

				<view class="logo-box">
					<image class="app-logo" src="/static/logo_rabbit.png" mode="aspectFit"></image>
					<view class="scan-line"></view>
				</view>
				
			</view>

			<view class="text-group">
				<text class="logo-main">一图灵</text>
				<text class="logo-sub">十万基层大夫的影像口袋书</text>
			</view>

		</view>

		<view class="bottom-info">
			<view class="sys-loading">
				<text class="sys-text">ATLAS RETRIEVAL ENGINE INITIATING...</text>
				<view class="data-stream">
					<view class="stream-block"></view>
				</view>
			</view>
			<text class="version">V 1.0.0</text>
		</view>
	</view>
</template>

<script>
export default {
	data() { 
		return { show: false }; 
	},
	onLoad() {
		setTimeout(() => { this.show = true; }, 100);

		setTimeout(() => {
			uni.reLaunch({ url: '/pages/index/index' });
		}, 3000);
	}
}
</script>

<style>
/* --- 基础与背景 --- */
.splash-container { 
	height: 100vh; 
	background: #03070E; /* 极致深邃的黑蓝 */
	display: flex; 
	flex-direction: column; 
	align-items: center; 
	justify-content: center; 
	position: relative;
	overflow: hidden;
}

.bg-layer {
	position: absolute;
	inset: 0;
	z-index: 1;
}

/* 科技感矩阵网格底纹 */
.bg-grid {
	width: 100%;
	height: 100%;
	background-image: 
		linear-gradient(rgba(58, 176, 255, 0.03) 1px, transparent 1px),
		linear-gradient(90deg, rgba(58, 176, 255, 0.03) 1px, transparent 1px);
	background-size: 60rpx 60rpx;
	background-position: center center;
}

/* 中心深蓝射灯 */
.bg-glow {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 900rpx;
	height: 900rpx;
	background: radial-gradient(circle, rgba(58, 176, 255, 0.15) 0%, rgba(3, 7, 14, 0) 65%);
}

/* --- 整体内容容器 --- */
.main-content {
	opacity: 0; 
	transform: scale(0.95); 
	transition: all 1.5s cubic-bezier(0.2, 0.8, 0.2, 1);
	display: flex; 
	flex-direction: column; 
	align-items: center; 
	z-index: 2;
	width: 100%;
}
.fade-in { 
	opacity: 1; 
	transform: scale(1); 
}

/* --- 核心舞台区 --- */
.center-stage {
	position: relative;
	width: 500rpx;
	height: 500rpx;
	display: flex;
	justify-content: center;
	align-items: center;
	margin-bottom: 20rpx;
}

/* --- 太阳系数据环 (关键实现) --- */
.solar-system {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 100%;
	height: 100%;
	pointer-events: none;
}

/* 轨道通用样式 */
.orbit {
	position: absolute;
	top: 50%;
	left: 50%;
	border-radius: 50%;
	box-sizing: border-box;
}

/* 行星/数据节点通用样式 */
.planet {
	position: absolute;
	border-radius: 50%;
	box-shadow: 0 0 15rpx currentColor;
}

/* 内轨道：半径小，转速快 */
.orbit-inner {
	width: 340rpx;
	height: 340rpx;
	margin-top: -170rpx;
	margin-left: -170rpx;
	border: 2rpx solid rgba(58, 176, 255, 0.2);
	animation: spinReverse 6s linear infinite;
}
.planet-blue {
	width: 12rpx;
	height: 12rpx;
	background: #3AB0FF;
	color: #3AB0FF;
	top: -6rpx;
	left: 50%;
	transform: translateX(-50%);
}

/* 中轨道：虚线刻度盘，转速中 */
.orbit-middle {
	width: 440rpx;
	height: 440rpx;
	margin-top: -220rpx;
	margin-left: -220rpx;
	border: 4rpx dashed rgba(58, 176, 255, 0.3);
	animation: spin 15s linear infinite;
}

/* 外轨道：半径大，转速极慢 */
.orbit-outer {
	width: 560rpx;
	height: 560rpx;
	margin-top: -280rpx;
	margin-left: -280rpx;
	border: 2rpx solid rgba(58, 176, 255, 0.1);
	animation: spinReverse 25s linear infinite;
}
.planet-cyan {
	width: 8rpx;
	height: 8rpx;
	background: #00FFFF; /* 青色点缀 */
	color: #00FFFF;
	top: 50%;
	left: -4rpx;
	transform: translateY(-50%);
}
.planet-cyan.opposite {
	left: auto;
	right: -4rpx;
}

/* 3D 倾斜轨道 (最科幻的一层) */
.orbit-3d {
	width: 480rpx;
	height: 480rpx;
	margin-top: -240rpx;
	margin-left: -240rpx;
	border: 2rpx solid rgba(255, 255, 255, 0.15);
	border-left-color: rgba(58, 176, 255, 0.8); /* 制造光影拖尾感 */
	animation: spin3D 8s linear infinite;
}
.planet-bright {
	width: 16rpx;
	height: 16rpx;
	background: #FFFFFF;
	color: #3AB0FF;
	box-shadow: 0 0 20rpx #FFFFFF, 0 0 40rpx #3AB0FF;
	left: 10%;
	top: 10%;
}

/* --- 兔子与扫描 --- */
.logo-box {
	position: relative;
	z-index: 10; /* 确保兔子在轨道上方 */
}

.app-logo { 
	width: 280rpx; 
	height: 280rpx; 
	animation: breathe 3s infinite ease-in-out; 
}

.scan-line {
	position: absolute;
	left: -15%;
	width: 130%;
	height: 4rpx;
	background: linear-gradient(90deg, transparent, #00FFFF, #ffffff, #00FFFF, transparent);
	box-shadow: 0 0 20rpx #00FFFF;
	z-index: 11;
	animation: scanDrop 2.5s ease-in-out infinite;
}

/* --- 品牌文字 --- */
.text-group { 
	text-align: center; 
	margin-top: 10rpx;
}
.logo-main { 
	font-size: 64rpx; 
	font-weight: 900; 
	color: #FFFFFF; 
	letter-spacing: 16rpx; 
	display: block; 
	text-shadow: 0 0 20rpx rgba(58, 176, 255, 0.6); 
}
.logo-sub { 
	font-size: 24rpx; 
	color: #3AB0FF; 
	letter-spacing: 6rpx; 
	font-weight: bold; 
	margin-top: 16rpx; 
	display: block; 
	text-transform: uppercase;
}

/* --- 底部数据流加载 --- */
.bottom-info { 
	position: fixed; 
	bottom: 8vh; 
	width: 100%; 
	display: flex;
	flex-direction: column;
	align-items: center;
	z-index: 2;
}

.sys-loading {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 16rpx;
}

.sys-text {
	font-size: 18rpx;
	color: rgba(58, 176, 255, 0.8);
	font-family: monospace;
	letter-spacing: 4rpx;
	margin-bottom: 12rpx;
	animation: blink 1.5s infinite;
}

/* 数据流扫描条 */
.data-stream {
	width: 200rpx;
	height: 2rpx;
	background: rgba(58, 176, 255, 0.2);
	position: relative;
	overflow: hidden;
}
.stream-block {
	position: absolute;
	height: 100%;
	width: 40rpx;
	background: #00FFFF;
	box-shadow: 0 0 10rpx #00FFFF;
	animation: dataRun 1.5s linear infinite;
}

.version { 
	font-size: 16rpx; 
	color: rgba(255,255,255,0.2); 
	font-weight: bold; 
	letter-spacing: 4rpx;
}

/* --- 动画关键帧 --- */
@keyframes spin { 100% { transform: rotate(360deg); } }
@keyframes spinReverse { 100% { transform: rotate(-360deg); } }

/* 3D轨道核心动画：沿X/Y轴倾斜的同时，让Z轴进行360度旋转 */
@keyframes spin3D {
	0% { transform: rotateX(65deg) rotateY(-15deg) rotateZ(0deg); }
	100% { transform: rotateX(65deg) rotateY(-15deg) rotateZ(360deg); }
}

@keyframes breathe {
	0%, 100% { transform: scale(1); filter: drop-shadow(0 0 15rpx rgba(58, 176, 255, 0.5)); }
	50% { transform: scale(1.05); filter: drop-shadow(0 0 40rpx rgba(58, 176, 255, 0.9)); }
}

@keyframes scanDrop {
	0% { top: -10%; opacity: 0; }
	15% { opacity: 1; }
	85% { opacity: 1; }
	100% { top: 110%; opacity: 0; }
}

@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

@keyframes dataRun {
	0% { left: -40rpx; }
	100% { left: 100%; }
}
</style>
