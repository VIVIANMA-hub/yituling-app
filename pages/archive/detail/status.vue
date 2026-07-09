<template>
	<view class="page-container" :class="isDark ? 'dark-theme' : 'light-theme'">
		<view class="bg-glow"></view>
		
		<view class="status-header-card shadow-purple">
			<view class="pulse-box">
				<view class="inner-circle"></view>
				<view class="outer-pulse"></view>
			</view>
			<text class="status-title">正在匹配最合适的专家...</text>
			<text class="status-desc">AI 已解析病例特征，正在通知呼吸影像专家组</text>
		</view>

		<view class="timeline-section">
			<view class="time-item active">
				<view class="dot-box"><view class="dot"></view></view>
				<view class="msg-box">
					<text class="msg-t">申请已提交</text>
					<text class="msg-d">2026-02-09 20:15</text>
				</view>
			</view>
			
			<view class="time-item active">
				<view class="dot-box"><view class="dot"></view></view>
				<view class="msg-box">
					<text class="msg-t">AI 影像特征二次核验完成</text>
					<text class="msg-d">匹配度 98.4%，已锁定 3 位主治专家</text>
				</view>
			</view>

			<view class="time-item pending">
				<view class="dot-box"><view class="dot"></view></view>
				<view class="msg-box">
					<text class="msg-t">等待专家接单</text>
					<text class="msg-d">预计 15 分钟内响应</text>
				</view>
			</view>

			<view class="time-item future">
				<view class="dot-box"><view class="dot"></view></view>
				<view class="msg-box">
					<text class="msg-t">会诊开始 (图文/视频)</text>
				</view>
			</view>
		</view>

		<view class="bottom-group">
			<button class="btn-secondary" @click="goBack">返回病例</button>
			<button class="btn-primary shadow-purple" @click="contactSupport">联系兔灵助手</button>
		</view>
	</view>
</template>

<script>
export default {
	data() { return { isDark: false }; },
	methods: {
		goBack() { uni.navigateBack(); },
		contactSupport() { uni.showToast({ title: '已呼叫人工助手', icon: 'none' }); }
	}
}
</script>

<style>
.light-theme { --bg: #F8FAFC; --card: #FFFFFF; --primary: #8B5CF6; --text: #1E293B; --grid: #F1F5F9; }
.page-container { min-height: 100vh; background: var(--bg); padding: 40rpx; }
.bg-glow { position: absolute; top: 0; right: 0; width: 300rpx; height: 300rpx; background: radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%); }

/* 状态头部 */
.status-header-card { 
	background: #1E293B; border-radius: 40rpx; padding: 60rpx 40rpx; 
	display: flex; flex-direction: column; align-items: center; text-align: center;
	margin-bottom: 60rpx;
}
.status-title { color: #fff; font-size: 32rpx; font-weight: 900; margin-top: 30rpx; }
.status-desc { color: rgba(255,255,255,0.5); font-size: 20rpx; margin-top: 15rpx; line-height: 1.6; }

/* 脉冲动画 */
.pulse-box { position: relative; width: 80rpx; height: 80rpx; }
.inner-circle { position: absolute; width: 100%; height: 100%; background: var(--primary); border-radius: 50%; z-index: 2; }
.outer-pulse { position: absolute; width: 100%; height: 100%; background: var(--primary); border-radius: 50%; animation: pulse 2s infinite; }

/* 时间轴 */
.timeline-section { padding-left: 20rpx; }
.time-item { display: flex; gap: 30rpx; padding-bottom: 60rpx; position: relative; }
.time-item::after { content: ''; position: absolute; left: 19rpx; top: 40rpx; bottom: 0; width: 2rpx; background: var(--grid); }
.time-item:last-child::after { display: none; }

.dot-box { width: 40rpx; height: 40rpx; display: flex; align-items: center; justify-content: center; z-index: 2; }
.dot { width: 16rpx; height: 16rpx; background: #CBD5E1; border-radius: 50%; border: 4rpx solid #fff; }

.time-item.active .dot { background: var(--primary); box-shadow: 0 0 15rpx var(--primary); }
.time-item.active .msg-t { color: var(--text); font-weight: 900; }
.time-item.pending .dot { background: var(--primary); opacity: 0.5; }
.time-item.future .msg-t { color: #94A3B8; }

.msg-box { flex: 1; }
.msg-t { font-size: 26rpx; color: #64748B; display: block; }
.msg-d { font-size: 18rpx; color: #94A3B8; margin-top: 6rpx; display: block; }

/* 底部按钮 */
.bottom-group { position: fixed; bottom: 80rpx; left: 40rpx; right: 40rpx; display: flex; gap: 20rpx; }
.btn-secondary { flex: 1; height: 100rpx; border-radius: 30rpx; background: #fff; font-size: 26rpx; font-weight: 800; border: 1rpx solid var(--grid); }
.btn-primary { flex: 2; height: 100rpx; border-radius: 30rpx; background: var(--primary); color: #fff; font-size: 26rpx; font-weight: 800; border: none; }

@keyframes pulse { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(2.5); opacity: 0; } }
</style>