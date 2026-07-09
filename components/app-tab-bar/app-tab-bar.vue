<template>
	<view class="ios-tabbar shadow-ios">
		<view
			class="tab-box"
			:class="{ active: active === 'index', gray: active !== 'index' }"
			@click="goPage('index')"
		>
			<text class="t-emoji">🏠</text>
			<text class="t-txt">首页</text>
		</view>
		<view
			class="tab-box"
			:class="{ active: active === 'notes', gray: active !== 'notes' }"
			@click="goPage('notes')"
		>
			<text class="t-emoji">📓</text>
			<text class="t-txt">笔记</text>
		</view>
		<view
			class="tab-box"
			:class="{ active: active === 'schedule', gray: active !== 'schedule' }"
			@click="goPage('schedule')"
		>
			<text class="t-emoji">📅</text>
			<text class="t-txt">排班</text>
		</view>
		<view
			class="tab-box"
			:class="{ active: active === 'knowledge', gray: active !== 'knowledge' }"
			@click="goPage('knowledge')"
		>
			<text class="t-emoji">📚</text>
			<text class="t-txt">知识</text>
		</view>
		<view
			class="tab-box"
			:class="{ active: active === 'account', gray: active !== 'account' }"
			@click="goPage('account')"
		>
			<text class="t-emoji">👤</text>
			<text class="t-txt">账户</text>
		</view>
	</view>
</template>

<script>
export default {
	name: 'AppTabBar',
	props: {
		active: {
			type: String,
			default: 'index',
			validator: (val) => ['index', 'notes', 'schedule', 'knowledge', 'account'].includes(val)
		}
	},
	methods: {
		goPage(page) {
			if (page === this.active) return
			const pageMap = {
				index: '/pages/index/index',
				notes: '/pages/notes/notes',
				schedule: '/pages/schedule/schedule',
				knowledge: '/pages/knowledge/knowledge',
				account: '/pages/account/index'
			}
			uni.reLaunch({ url: pageMap[page] })
		}
	}
}
</script>

<style>
.ios-tabbar {
	position: fixed;
	bottom: 50rpx;
	left: 40rpx;
	right: 40rpx;
	height: 136rpx;
	background: rgba(255, 255, 255, 0.92);
	backdrop-filter: saturate(180%) blur(20px);
	border-radius: 70rpx;
	display: flex;
	justify-content: space-around;
	align-items: center;
	z-index: 999;
	box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.06);
	border: 1rpx solid rgba(0, 0, 0, 0.03);
}

.shadow-ios {
	box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.06);
}

.tab-box {
	width: 100rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;
	transition: opacity 0.2s ease;
}

.t-emoji {
	font-size: 44rpx;
}

.t-txt {
	font-size: 20rpx;
	font-weight: 850;
	color: #007AFF;
}

.gray {
	opacity: 0.42;
	filter: grayscale(1);
}

.active {
	opacity: 1;
	filter: none;
}
</style>
