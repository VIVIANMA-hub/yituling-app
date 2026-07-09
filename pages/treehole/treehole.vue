<template>
	<view class="apple-container">
		<view class="status-bar"></view>
		
		<view class="hero-header">
			<view class="title-group">
				<text class="main-title">医路树洞</text>
				<text class="sub-status">这里的倾听，永不实名</text>
			</view>
		</view>

		<view class="input-card shadow-apple">
			<textarea class="hole-input" placeholder="吐槽科室、分享心事、或者只是留下一个符号..." v-model="content" maxlength="500"></textarea>
			<view class="input-footer">
				<text class="char-count">{{ content.length }}/500</text>
				<view class="post-btn" :class="{'active': content.length > 0}" @click="handlePost">
					扔进树洞
				</view>
			</view>
		</view>

		<view class="safety-card">
			<text class="safety-title">安全边界</text>
			<text class="safety-text">树洞只做情绪释放，不提供医疗、心理治疗或危机干预。当前版本不保存原文，只在本机记录匿名投递次数。</text>
		</view>

		<view class="quote-card">
			<text class="quote-text">“那些无法对同事说的话，就留在这里吧。”</text>
			<text class="quote-author">— 一图灵 · 守护每一份情绪</text>
		</view>

		<app-tab-bar active="treehole" />
	</view>
</template>

<script>
export default {
	data() {
		return {
			content: '',
			crisisWords: ['自杀', '轻生', '不想活', '活不下去', '结束生命', '伤害自己', '自残', '跳楼']
		}
	},
	methods: {
		handlePost() {
			const text = this.content.trim();
			if (!text) return;
			if (this.hasCrisisText(text)) {
				this.showCrisisHelp();
				return;
			}

			const count = uni.getStorageSync('ytl_treehole_count') || 0;
			uni.setStorageSync('ytl_treehole_count', count + 1);
			this.content = '';
			uni.showToast({ title: '已匿名投递', icon: 'success' });
		},
		hasCrisisText(text) {
			return this.crisisWords.some(word => text.includes(word));
		},
		callHotline(num) {
			uni.makePhoneCall({
				phoneNumber: String(num).replace(/-/g, ''),
				fail: () => {
					uni.setClipboardData({
						data: String(num),
						success: () => uni.showToast({ title: '号码已复制', icon: 'none' })
					})
				}
			})
		},
		showCrisisHelp() {
			uni.showModal({
				title: '请先保护自己',
				content: '如果你正在考虑伤害自己，请：\n\n1. 立刻联系身边可信任的人\n2. 北京心理危机研究与干预中心 010-82951332（24h）\n3. 全国希望热线 400-161-9995\n4. 紧急情况拨打 120 急救 / 110 报警\n\n一图灵不能提供危机干预，但你不需要一个人扛。',
				confirmText: '拨打 010-82951332',
				cancelText: '我知道了',
				success: r => {
					if (r.confirm) this.callHotline('010-82951332')
				}
			});
		}
	}
}
</script>

<style>
view, text, textarea { font-family: -apple-system, system-ui, "PingFang SC", sans-serif !important; }
.apple-container { min-height: 100vh; background: #FBFBFD; padding: 0 40rpx; }
.status-bar { height: 100rpx; }

.hero-header { margin: 40rpx 0 60rpx; }
.main-title { font-size: 64rpx; font-weight: 900; color: #1D1D1F; display: block; }
.sub-status { font-size: 26rpx; color: #86868B; font-weight: 600; }

.input-card { background: #fff; border-radius: 40rpx; padding: 40rpx; box-shadow: 0 20rpx 60rpx rgba(0,0,0,0.03); }
.hole-input { width: 100%; height: 300rpx; font-size: 32rpx; line-height: 1.6; color: #1D1D1F; }
.input-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 30rpx; padding-top: 30rpx; border-top: 1px solid #F2F2F7; }
.char-count { font-size: 22rpx; color: #D2D2D7; font-weight: 700; }
.post-btn { background: #F2F2F7; color: #86868B; padding: 20rpx 44rpx; border-radius: 100rpx; font-size: 26rpx; font-weight: 800; transition: all 0.3s; }
.post-btn.active { background: #1D1D1F; color: #fff; }

.safety-card { margin-top: 28rpx; padding: 26rpx; border-radius: 28rpx; background: #FFF7E6; border: 1rpx solid #FEDF89; }
.safety-title { display: block; font-size: 26rpx; color: #8A5A00; font-weight: 900; }
.safety-text { display: block; margin-top: 10rpx; font-size: 23rpx; line-height: 1.55; color: #9A6A12; font-weight: 650; }

.quote-card { margin-top: 100rpx; text-align: center; opacity: 0.5; }
.quote-text { font-size: 28rpx; font-weight: 600; color: #86868B; font-style: italic; display: block; margin-bottom: 20rpx; }
.quote-author { font-size: 22rpx; color: #D2D2D7; font-weight: 800; }
</style>
