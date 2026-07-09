<template>
	<view class="redirect-shim">
		<text class="hint">正在打开登录页…</text>
	</view>
</template>

<script>
// 此页面是历史遗留路由的转发壳。
// 原 mock 登录代码（含 mock_token_xxx / 假短信倒计时）已在 2026-05-19 移除，
// 真实登录走 /pages/account/login（接 ytl-auth 云函数）。
// pages.json 保留 pages/public/login 注册，避免老链接/旧分享卡死。
export default {
	onLoad(options = {}) {
		const params = []
		if (options && typeof options === 'object') {
			for (const k of Object.keys(options)) {
				if (options[k] != null) {
					params.push(`${encodeURIComponent(k)}=${encodeURIComponent(options[k])}`)
				}
			}
		}
		const qs = params.length ? `?${params.join('&')}` : ''
		uni.reLaunch({ url: `/pages/account/login${qs}` })
	}
}
</script>

<style>
.redirect-shim {
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #03070E;
}
.hint {
	color: rgba(255, 255, 255, 0.6);
	font-size: 28rpx;
	letter-spacing: 2rpx;
}
</style>
