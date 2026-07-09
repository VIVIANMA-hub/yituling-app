<template>
	<view class="page-container light-theme">
		<view class="bg-glow"></view>

		<view class="header-section">
			<view class="brand-line">
				<text class="brand-txt">MEDTURING MEMO</text>
			</view>
			<view class="title-row">
				<text class="page-title">备忘录</text>
				<text class="count-tag">{{ archiveData.length }} 篇</text>
			</view>
			<view class="search-box-v2 shadow-soft">
				<text class="search-icon">🔍</text>
				<input class="s-input" placeholder="检索我的草稿和收藏..." />
			</view>
		</view>

		<scroll-view scroll-y class="archive-scroll">
			<view class="case-card-v2" v-for="(item, index) in archiveData" :key="index" @click="goDetail">
				
				<view class="case-content">
					<view class="case-meta">
						<view class="status-tag" :class="item.type">
							<text>{{ item.type === 'draft' ? '📝 本地草稿' : '⭐ 社区收藏' }}</text>
						</view>
						<text class="case-time">{{ item.date }}</text>
					</view>
					<text class="case-title-v2">{{ item.title }}</text>
					
					<view class="case-image-mini" v-if="item.hasImage">
						<text class="img-icon">🖼️</text>
						<text>包含脱敏影像附件</text>
					</view>
				</view>
				
				<view class="arrow-v2">⇢</view>
			</view>
			<view class="list-footer-gap"></view>
		</scroll-view>

		<view class="bottom-bar-v2">
			<button class="create-btn shadow-blue" @click="handleCreate">
				<text class="plus-icon">＋</text>
				<text>新建备忘</text>
			</button>
			<view class="compliance-tip">仅自己可见，本机保存</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			archiveData: [
				{ 
					title: '胸部DR：右肺中叶条索状高密度影，考虑陈旧性病变。', 
					type: 'draft', 
					date: '今天 10:24', 
					hasImage: false 
				},
				{ 
					title: '腰椎间盘突出伴椎管狭窄经典描述模板', 
					type: 'collect', 
					date: '昨天 15:30', 
					hasImage: true 
				},
				{ 
					title: '关于基层卫生院超声设备探头保养的几点避坑总结', 
					type: 'draft', 
					date: '3月5日', 
					hasImage: false 
				}
			]
		}
	},
	methods: {
		goDetail() { 
			uni.showToast({ title: '进入编辑详情', icon: 'none' });
			// 实际跳转: uni.navigateTo({ url: '/pages/archive/detail/detail' }); 
		},
		handleCreate() { 
			// 跳转或直接弹起键盘，与经验圈体验对齐
			uni.showToast({ title: '开始写新备忘', icon: 'none' });
		}
	}
}
</script>

<style>
/* 核心科技蓝设计语言 */
.light-theme { --bg: #F8FAFC; --card: #FFFFFF; --primary: #007AFF; --text: #1E293B; --sub: #64748B; --border: #E2E8F0; }
.page-container { min-height: 100vh; background: var(--bg); padding: 0 40rpx; position: relative; overflow: hidden; }

/* 科技蓝光晕 */
.bg-glow { position: absolute; top: -100rpx; right: -100rpx; width: 500rpx; height: 500rpx; background: radial-gradient(circle, rgba(0, 122, 255, 0.05) 0%, transparent 70%); pointer-events: none;}

/* 1. 顶部重排版 */
.header-section { padding-top: 100rpx; margin-bottom: 50rpx; position: relative; z-index: 10;}
.brand-line { margin-bottom: 16rpx; }
.brand-txt { font-size: 20rpx; font-weight: 900; color: var(--primary); letter-spacing: 4rpx; }

.title-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40rpx; }
.page-title { font-size: 56rpx; font-weight: 900; color: var(--text); }
.count-tag { font-size: 22rpx; color: var(--sub); font-weight: 800; background: var(--border); padding: 6rpx 20rpx; border-radius: 100rpx; margin-bottom: 12rpx;}

.search-box-v2 { background: var(--card); height: 110rpx; border-radius: 36rpx; display: flex; align-items: center; padding: 0 40rpx; border: 1rpx solid var(--border); }
.s-input { flex: 1; font-size: 28rpx; margin-left: 20rpx; font-weight: 700; color: var(--text); }

/* 2. 备忘录卡片逻辑 */
.archive-scroll { height: calc(100vh - 400rpx); position: relative; z-index: 10;}
.case-card-v2 {
	background: var(--card); border-radius: 32rpx; padding: 36rpx;
	display: flex; align-items: center; margin-bottom: 30rpx;
	border: 1rpx solid var(--border); position: relative;
	transition: transform 0.1s;
}
.case-card-v2:active { transform: scale(0.98); }

.case-content { flex: 1; padding-right: 20rpx; }
.case-meta { display: flex; align-items: center; gap: 20rpx; margin-bottom: 16rpx; }

/* 状态标签 */
.status-tag { font-size: 20rpx; padding: 6rpx 16rpx; border-radius: 8rpx; font-weight: 800; }
.status-tag.draft { background: rgba(0, 122, 255, 0.1); color: var(--primary); }
.status-tag.collect { background: rgba(245, 158, 11, 0.1); color: #F59E0B; }

.case-time { font-size: 20rpx; color: var(--sub); font-weight: 700; }
.case-title-v2 { font-size: 28rpx; font-weight: 800; color: var(--text); display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; line-height: 1.6;}

/* 附件提示 */
.case-image-mini { margin-top: 16rpx; display: inline-flex; align-items: center; gap: 8rpx; background: var(--bg); padding: 8rpx 20rpx; border-radius: 100rpx; font-size: 18rpx; color: var(--sub); font-weight: 700; border: 1rpx dashed #CBD5E1;}

.arrow-v2 { font-size: 32rpx; color: #CBD5E1; font-weight: 900; }

/* 3. 底部悬浮栏：对齐经验圈的极简风格 */
.bottom-bar-v2 { position: fixed; bottom: 40rpx; left: 40rpx; right: 40rpx; z-index: 20; display: flex; flex-direction: column; align-items: center; gap: 16rpx;}
.create-btn {
	width: 100%; height: 110rpx; border-radius: 100rpx; display: flex;
	align-items: center; justify-content: center; gap: 12rpx;
	font-weight: 900; font-size: 32rpx; border: none;
	background: var(--text); color: #fff;
}
.create-btn::after { border: none; }
.plus-icon { font-size: 40rpx; font-weight: 300; }

.compliance-tip { font-size: 20rpx; color: #94A3B8; font-weight: 800; }

.list-footer-gap { height: 240rpx; }
.shadow-soft { box-shadow: 0 10rpx 30rpx rgba(0,0,0,0.02); }
.shadow-blue { box-shadow: 0 20rpx 50rpx rgba(30, 41, 59, 0.2); }
</style>