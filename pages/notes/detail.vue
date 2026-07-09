<template>
	<view class="apple-container pb-safe">
		<view class="swiper-container">
			<swiper class="image-swiper" v-if="caseData.images && caseData.images.length" circular indicator-dots indicator-active-color="#FFFFFF" indicator-color="rgba(255,255,255,0.4)">
				<swiper-item v-for="(img, index) in caseData.images" :key="index">
					<image :src="img" mode="aspectFill" class="slide-image" @click="previewImage(index)"></image>
					<view class="watermark">内部学术交流 · 隐私已擦除</view>
				</swiper-item>
			</swiper>
			<view class="image-placeholder" v-else>
				<text class="ph-icon">医</text>
				<text class="ph-text">这条笔记暂无配图</text>
			</view>

			<view class="back-btn glass" @click="goBack">
				<text class="back-icon">←</text>
			</view>
		</view>

		<!-- 云端状态条（仅在 cloudPostId 存在时显示）-->
		<view class="cloud-status-bar" v-if="cloudStatus">
			<text class="cs-tag" :class="cloudStatus">{{ statusLabel }}</text>
			<text class="cs-desc">{{ statusDesc }}</text>
			<view class="cs-actions" v-if="canSubmitReview">
				<view class="cs-btn-edit" @click="goEdit">编辑</view>
				<view class="cs-btn" @click="submitReview">提交审核</view>
			</view>
		</view>

		<view class="author-bar">
			<view class="author-left">
				<image class="author-avatar" :src="caseData.avatar || '/static/rabbit.jpg'" mode="aspectFill"></image>
				<view class="author-info">
					<text class="author-name">{{ caseData.author }}</text>
					<text class="author-title">实名认证同行</text>
				</view>
			</view>
			<view class="follow-btn">关注</view>
		</view>

		<view class="content-section">
			<template v-if="!inlineEditing">
				<text class="note-title" :class="{ tappable: canInlineEdit }" @click="enterInlineEdit">{{ caseData.title || (canInlineEdit ? '点这里加标题' : '') }}</text>
				<text class="note-body" :class="{ tappable: canInlineEdit }" @click="enterInlineEdit">{{ caseData.content || (canInlineEdit ? '点这里写正文' : '') }}</text>
				<view class="tag-group" v-if="caseData.tags && caseData.tags.length">
					<text class="hash-tag" v-for="tag in caseData.tags" :key="tag"># {{ tag }}</text>
				</view>
				<view v-if="canInlineEdit" class="inline-hint">
					<text>💡 点击标题或正文可直接编辑（备忘录式）。</text>
				</view>
			</template>
			<template v-else>
				<input
					class="inline-title-input"
					v-model="inlineDraft.title"
					placeholder="标题（首行）"
					maxlength="60"
				/>
				<textarea
					class="inline-body-textarea"
					v-model="inlineDraft.content"
					placeholder="正文：影像表现 / 操作要点 / 报告表达。不写诊断、用药、分诊建议。"
					maxlength="6000"
					:auto-height="true"
					:adjust-position="true"
				></textarea>
				<view class="inline-edit-actions">
					<view class="inline-btn ghost" @click="cancelInlineEdit">取消</view>
					<view class="inline-btn main" @click="saveInlineEdit(false)">保存草稿</view>
					<view
						v-if="cloudStatus === 'rejected'"
						class="inline-btn warn"
						@click="saveInlineEdit(true)"
					>保存并重新送审</view>
				</view>
			</template>
		</view>

		<view class="ai-feature-card shadow-soft">
			<view class="ai-header">
				<text class="ai-title">结构化经验笔记</text>
				<text class="ai-status">医生自填</text>
			</view>
			<view class="ai-body">
				<view class="feature-row">
					<text class="f-label">观察要点</text>
					<text class="f-value">{{ caseData.aiFeatures.morphology }}</text>
				</view>
				<view class="feature-row">
					<text class="f-label">操作提醒</text>
					<text class="f-value">{{ caseData.aiFeatures.density }}</text>
				</view>
				<view class="feature-row highlight-row">
					<text class="f-label">分享状态</text>
					<text class="f-value highlight-txt">已脱敏，可用于学习交流</text>
				</view>
			</view>
		</view>

		<view class="legal-disclaimer">
			<view class="legal-text">
				<text class="legal-bold">平台合规声明</text>
				<text class="legal-desc">本页面内容仅供医学专业人士学习交流与个人笔记管理使用。本软件非医疗器械，不提供临床诊断意见、临床处置、用药或分诊建议。</text>
			</view>
		</view>

		<view class="comments-section">
			<text class="c-title">同行研讨</text>
			<view class="comments-placeholder">
				<text class="cp-title">评论功能将于 V2.0 开放</text>
				<text class="cp-desc">V1.0 仅开放笔记发布与审核。如需与作者交流，请通过线下渠道。</text>
			</view>
		</view>

		<view class="xhs-bottom-bar glass-bottom">
			<view class="input-box" @click="comingSoon('comment')">
				<text class="pen">写</text> V2.0 开放评论
			</view>
			<view class="action-icons">
				<view class="action-btn" @click="comingSoon('like')"><text class="a-icon">赞</text><text class="a-count">V2</text></view>
				<view class="action-btn" @click="comingSoon('bookmark')"><text class="a-icon">藏</text><text class="a-count">V2</text></view>
				<view class="action-btn" @click="shareNote"><text class="a-icon">享</text><text class="a-count">分享</text></view>
			</view>
		</view>
	</view>
</template>

<script>
import { withAuth, getCallerIdentity, isLoggedIn, ensureLogin } from '@/utils/identity.js'

export default {
	data() {
		return {
			caseData: {
				author: '',
				avatar: '/static/rabbit.jpg',
				images: [],
				title: '',
				content: '',
				tags: [],
				likes: 0,
				comments: 0,
				aiFeatures: {
					morphology: '记录图像质量、体位配合、扫描范围和报告标题一致性',
					density: '发布前复核患者姓名、检查号、医院名称、二维码等信息'
				}
			},
			cloudPostId: '',
			cloudStatus: '',
			cloudRejectReason: '',
			cloudOwnerId: '',
			cloudPost: null,
			inlineEditing: false,
			inlineDraft: { title: '', content: '' }
		}
	},
	computed: {
		isOwner() {
			if (!this.cloudOwnerId) return false
			const id = getCallerIdentity()
			return id.loggedIn && id.uid === this.cloudOwnerId
		},
		canSubmitReview() {
			// 草稿或被驳，且是本人 → 可以提交审核
			return this.isOwner && (this.cloudStatus === 'draft' || this.cloudStatus === 'rejected')
		},
		canInlineEdit() {
			// 草稿/被驳 + 本人 → 可以点击直接编辑（备忘录模式）
			return this.isOwner && (this.cloudStatus === 'draft' || this.cloudStatus === 'rejected')
		},
		statusLabel() {
			return { draft: '草稿', pending: '待审核', approved: '已通过', rejected: '已驳回' }[this.cloudStatus] || ''
		},
		statusDesc() {
			if (this.cloudStatus === 'draft') return '草稿仅你可见。准备好后点右侧"提交审核"。'
			if (this.cloudStatus === 'pending') return '已提交，等待社区审核员处理。'
			if (this.cloudStatus === 'approved') return '已通过审核，公开在社区 feed。'
			if (this.cloudStatus === 'rejected') return '审核被驳回：' + (this.cloudRejectReason || '不符合社区规范')
			return ''
		}
	},
	methods: {
		goBack() { uni.navigateBack(); },
		previewImage(index) {
			uni.previewImage({ current: index, urls: this.caseData.images });
		},
		async fetchCloudPost(postId) {
			try {
				const res = await uniCloud.callFunction({
					name: 'notes-post',
					data: withAuth({ action: 'get', postId })
				})
				const r = res && res.result
				if (!r || !r.ok || !r.post) return
				this.cloudPost = r.post
				this.cloudPostId = r.post._id
				this.cloudStatus = r.post.status || ''
				this.cloudRejectReason = r.post.rejectReason || ''
				this.cloudOwnerId = r.post.ownerId || ''
				// 用云端最新数据覆盖本地展示
				Object.assign(this.caseData, {
					title: r.post.title || this.caseData.title,
					content: r.post.content || this.caseData.content,
					tags: r.post.tags && r.post.tags.length ? r.post.tags : this.caseData.tags,
					author: r.post.ownerName || this.caseData.author
				})
			} catch (e) {
				console.log('[detail] fetchCloudPost skipped:', e && e.message)
			}
		},
		enterInlineEdit() {
			if (!this.canInlineEdit) return
			this.inlineDraft = {
				title: this.caseData.title || '',
				content: this.caseData.content || ''
			}
			this.inlineEditing = true
		},
		cancelInlineEdit() {
			this.inlineEditing = false
			this.inlineDraft = { title: '', content: '' }
		},
		async saveInlineEdit(submitForReview) {
			if (!this.cloudPostId) {
				uni.showToast({ title: '云端笔记不存在', icon: 'none' })
				return
			}
			const title = this.inlineDraft.title.trim()
			const content = this.inlineDraft.content.trim()
			if (!content) {
				uni.showToast({ title: '内容不能为空', icon: 'none' })
				return
			}
			const action = submitForReview ? 'publish_for_review' : 'save_draft'
			uni.showLoading({ title: submitForReview ? '送审中...' : '保存中...' })
			try {
				const p = this.cloudPost || {}
				const res = await uniCloud.callFunction({
					name: 'notes-post',
					data: withAuth({
						action,
						postId: this.cloudPostId,
						title: title || (content.split('\n')[0] || '').slice(0, 30),
						content,
						category: p.category || '实战经验',
						modality: p.modality || 'ct_plain',
						threadType: p.threadType || 'note',
						bodyPart: p.bodyPart || '未标注',
						positioning: p.positioning || '未标注',
						ctCompanion: p.ctCompanion || '',
						tags: p.tags || [],
						deidentified: !!p.deidentified,
						authorized: !!p.authorized
					})
				})
				uni.hideLoading()
				const r = res && res.result
				if (!r || !r.ok) {
					uni.showModal({ title: '保存失败', content: (r && r.message) || '请稍后重试', showCancel: false })
					return
				}
				this.caseData.title = title
				this.caseData.content = content
				this.cloudStatus = r.status || this.cloudStatus
				this.inlineEditing = false
				this.inlineDraft = { title: '', content: '' }
				uni.showToast({ title: submitForReview ? '✓ 已送审' : '✓ 已保存', icon: 'none' })
			} catch (e) {
				uni.hideLoading()
				uni.showModal({ title: '网络异常', content: e && e.message || 'unknown', showCancel: false })
			}
		},
		goEdit() {
			if (!this.isOwner) return
			const p = this.cloudPost || {}
			uni.setStorageSync('ytl_notes_edit_prefill', {
				cloudPostId: this.cloudPostId,
				title: this.caseData.title || '',
				content: this.caseData.content || '',
				category: p.category || '实战经验',
				modality: p.modality || 'ct_plain',
				threadType: p.threadType || 'note',
				ctCompanionNote: p.ctCompanion || '',
				authorized: !!p.authorized,
				tags: this.caseData.tags || []
			})
			uni.reLaunch({ url: '/pages/notes/notes' })
		},
		comingSoon(type) {
			const map = { comment: '评论', like: '点赞', bookmark: '收藏' }
			const label = map[type] || '该功能'
			uni.showToast({ title: `${label}将于 V2.0 开放`, icon: 'none' })
		},
		shareNote() {
			if (this.cloudStatus && this.cloudStatus !== 'approved') {
				uni.showToast({ title: '审核通过后才能分享', icon: 'none' })
				return
			}
			const title = this.caseData.title || '一图灵笔记'
			const body = (this.caseData.content || '').slice(0, 80)
			const text = `【${title}】\n${body}${body.length >= 80 ? '…' : ''}\n—— 来自一图灵 App`
			uni.setClipboardData({
				data: text,
				success: () => uni.showToast({ title: '已复制，粘贴到微信/群即可', icon: 'none', duration: 2000 }),
				fail: () => uni.showToast({ title: '复制失败，请截图分享', icon: 'none' })
			})
		},
		async submitReview() {
			if (!this.canSubmitReview) return
			if (!isLoggedIn()) { ensureLogin(); return }
			const yes = await new Promise(r => uni.showModal({
				title: '提交审核',
				content: '提交后内容不可直接修改，需等待社区审核员处理。',
				success: rr => r(rr.confirm)
			}))
			if (!yes) return
			uni.showLoading({ title: '提交中...' })
			try {
				const res = await uniCloud.callFunction({
					name: 'notes-post',
					data: withAuth({
						action: 'publish_for_review',
						postId: this.cloudPostId,
						title: this.caseData.title,
						content: this.caseData.content,
						tags: this.caseData.tags,
						deidentified: true
					})
				})
				uni.hideLoading()
				const r = res && res.result
				if (!r || !r.ok) {
					uni.showModal({ title: '提交失败', content: (r && r.message) || '请稍后重试', showCancel: false })
					return
				}
				this.cloudStatus = 'pending'
				uni.showToast({ title: '已提交审核', icon: 'success' })
			} catch (e) {
				uni.hideLoading()
				uni.showModal({ title: '网络异常', content: e && e.message || 'unknown', showCancel: false })
			}
		}
	},
	onLoad(query) {
		const caseFromList = uni.getStorageSync('current_case');
		const defaultAuthor = this.$store ? this.$store.getters.realName : '兔灵用户';
		if (caseFromList) {
			this.caseData = Object.assign({}, this.caseData, {
				author: caseFromList.author || defaultAuthor,
				title: caseFromList.title || this.caseData.title,
				content: caseFromList.content || this.caseData.content,
				likes: caseFromList.likes || this.caseData.likes,
				tags: caseFromList.tags && caseFromList.tags.length ? caseFromList.tags : this.caseData.tags,
				...(caseFromList.cover ? { images: [caseFromList.cover] } : {})
			});
			// 如果列表项带了 _cloudPostId 或本地草稿带了 cloudPostId，去云端拉最新
			const pid = caseFromList._cloudPostId || caseFromList.cloudPostId
			if (pid) this.fetchCloudPost(pid)
			uni.removeStorageSync('current_case');
		} else {
			this.caseData.author = defaultAuthor;
		}
		// 也允许 query 传 ?postId=xxx 直达
		if (query && query.postId) this.fetchCloudPost(String(query.postId))
	}
}
</script>

<style>
.apple-container { min-height: 100vh; background: #FFFFFF; font-family: -apple-system, "SF Pro Display", sans-serif; }
.pb-safe { padding-bottom: 200rpx; }

.swiper-container { position: relative; width: 100vw; height: 100vw; background: #000; }
.image-swiper { width: 100%; height: 100%; }
.slide-image { width: 100%; height: 100%; }
.watermark { position: absolute; bottom: 40rpx; left: 0; right: 0; text-align: center; color: rgba(255,255,255,0.6); font-size: 20rpx; font-weight: 600; letter-spacing: 2rpx; pointer-events: none; }
.image-placeholder { width: 100%; height: 100%; background: #1D1D1F; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18rpx; }
.ph-icon { width: 120rpx; height: 120rpx; border-radius: 50%; background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); font-size: 48rpx; font-weight: 900; display: flex; align-items: center; justify-content: center; }
.ph-text { color: rgba(255,255,255,0.55); font-size: 22rpx; font-weight: 700; }
.back-btn { position: absolute; top: 100rpx; left: 40rpx; width: 72rpx; height: 72rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; z-index: 10; }
.glass { background: rgba(0,0,0,0.4); backdrop-filter: blur(10px); color: #fff; font-size: 40rpx; font-weight: 800; }

.cloud-status-bar {
	margin: 24rpx 40rpx 0;
	padding: 20rpx 24rpx;
	background: #F5F7FB;
	border-radius: 18rpx;
	display: flex;
	align-items: center;
	gap: 16rpx;
}
.cs-tag {
	padding: 6rpx 18rpx; border-radius: 999rpx;
	font-size: 22rpx; font-weight: 800;
	background: #fff;
}
.cs-tag.draft { color: #6E6E73; }
.cs-tag.pending { color: #B26A00; background: #FFF4E5; }
.cs-tag.approved { color: #137333; background: #E6F4EA; }
.cs-tag.rejected { color: #D9342B; background: #FDE2E1; }
.cs-desc { flex: 1; font-size: 22rpx; color: #1D1D1F; line-height: 1.4; }
.cs-actions { display: flex; gap: 10rpx; flex-shrink: 0; }
.cs-btn { padding: 12rpx 24rpx; background: #1F6FEB; color: #fff; border-radius: 999rpx; font-size: 22rpx; font-weight: 700; }
.cs-btn-edit { padding: 12rpx 24rpx; background: #F2F4F7; color: #1D1D1F; border-radius: 999rpx; font-size: 22rpx; font-weight: 700; }
.cs-btn-edit:active { background: #E5E7EB; }

.author-bar { display: flex; justify-content: space-between; align-items: center; padding: 30rpx 40rpx; }
.author-left { display: flex; align-items: center; gap: 16rpx; }
.author-avatar { width: 80rpx; height: 80rpx; border-radius: 50%; border: 1rpx solid #F2F2F7; }
.author-info { display: flex; flex-direction: column; gap: 4rpx; }
.author-name { font-size: 28rpx; font-weight: 800; color: #1D1D1F; }
.author-title { font-size: 20rpx; color: #86868B; font-weight: 600; }
.follow-btn { border: 2rpx solid #1D1D1F; color: #1D1D1F; padding: 10rpx 32rpx; border-radius: 100rpx; font-size: 24rpx; font-weight: 800; }

.content-section { padding: 0 40rpx 20rpx; }
.note-title { font-size: 40rpx; font-weight: 800; color: #1D1D1F; line-height: 1.4; display: block; margin-bottom: 20rpx; }
.note-title.tappable, .note-body.tappable { transition: background 0.2s; padding: 8rpx 12rpx; margin-left: -12rpx; margin-right: -12rpx; border-radius: 12rpx; }
.note-title.tappable:active, .note-body.tappable:active { background: rgba(0,122,255,0.06); }
.note-body { font-size: 30rpx; color: #333333; line-height: 1.6; display: block; margin-bottom: 30rpx; }
.tag-group { display: flex; flex-wrap: wrap; gap: 16rpx; }
.hash-tag { color: #007AFF; font-size: 26rpx; font-weight: 700; background: rgba(0, 122, 255, 0.08); padding: 8rpx 20rpx; border-radius: 8rpx; }
.inline-hint { margin-top: 24rpx; padding: 14rpx 18rpx; background: rgba(0,122,255,0.05); border-radius: 12rpx; }
.inline-hint text { font-size: 22rpx; color: #1F6FEB; font-weight: 700; }

.inline-title-input { width: 100%; font-size: 40rpx; font-weight: 800; color: #1D1D1F; padding: 16rpx 0; border-bottom: 2rpx solid #E5E7EB; }
.inline-body-textarea { width: 100%; min-height: 280rpx; font-size: 30rpx; color: #333333; line-height: 1.6; padding: 24rpx 0; box-sizing: border-box; }
.inline-edit-actions { display: flex; gap: 16rpx; flex-wrap: wrap; margin-top: 24rpx; }
.inline-btn { flex: 1; min-width: 200rpx; padding: 22rpx 0; text-align: center; border-radius: 999rpx; font-size: 26rpx; font-weight: 800; }
.inline-btn.ghost { background: #F2F4F7; color: #475467; }
.inline-btn.main { background: #1D1D1F; color: #fff; }
.inline-btn.warn { background: #1F6FEB; color: #fff; }

.ai-feature-card { margin: 40rpx; background: #F8F9FA; border-radius: 32rpx; padding: 30rpx; border: 1rpx solid #E5E5EA; }
.shadow-soft { box-shadow: 0 16rpx 48rpx rgba(0,0,0,0.03); }
.ai-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24rpx; border-bottom: 1rpx solid #E5E5EA; padding-bottom: 20rpx; }
.ai-title { font-size: 28rpx; font-weight: 800; color: #1D1D1F; display: flex; align-items: center; gap: 8rpx; }
.sparkle { color: #007AFF; font-size: 32rpx; }
.ai-status { font-size: 20rpx; color: #34C759; font-weight: 800; background: #E6F9F0; padding: 6rpx 16rpx; border-radius: 8rpx; }
.feature-row { display: flex; justify-content: space-between; margin-bottom: 16rpx; }
.f-label { font-size: 24rpx; color: #86868B; font-weight: 600; }
.f-value { font-size: 24rpx; color: #1D1D1F; font-weight: 800; text-align: right; max-width: 60%; }
.highlight-row { margin-top: 24rpx; background: rgba(0, 122, 255, 0.05); padding: 16rpx; border-radius: 12rpx; }
.highlight-txt { color: #007AFF; }

.legal-disclaimer { margin: 0 40rpx 40rpx; background: #FFF4E5; border: 1rpx solid #FFE0B2; border-radius: 24rpx; padding: 24rpx; display: flex; gap: 16rpx; align-items: flex-start; }
.legal-icon { font-size: 36rpx; margin-top: 4rpx; }
.legal-text { flex: 1; display: flex; flex-direction: column; gap: 8rpx; }
.legal-bold { font-size: 24rpx; font-weight: 800; color: #D97706; }
.legal-desc { font-size: 20rpx; color: #92400E; line-height: 1.5; font-weight: 600; }

.comments-section { padding: 0 40rpx 40rpx; border-top: 16rpx solid #F5F5F7; padding-top: 40rpx; }
.c-title { font-size: 28rpx; font-weight: 800; color: #86868B; margin-bottom: 30rpx; display: block; }
.comments-placeholder { padding: 36rpx 28rpx; background: #F8FAFC; border-radius: 18rpx; display: flex; flex-direction: column; gap: 10rpx; }
.cp-title { font-size: 26rpx; color: #1D1D1F; font-weight: 800; }
.cp-desc { font-size: 22rpx; color: #667085; line-height: 1.5; font-weight: 700; }

.xhs-bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; height: 160rpx; padding: 20rpx 40rpx; display: flex; align-items: flex-start; justify-content: space-between; gap: 30rpx; border-top: 1rpx solid rgba(0,0,0,0.05); z-index: 100; }
.glass-bottom { background: rgba(255,255,255,0.9); backdrop-filter: saturate(180%) blur(20px); }
.input-box { flex: 1; height: 76rpx; background: #F5F5F7; border-radius: 100rpx; display: flex; align-items: center; padding: 0 30rpx; color: #86868B; font-size: 26rpx; font-weight: 600; gap: 10rpx; }
.action-icons { display: flex; gap: 30rpx; align-items: center; height: 76rpx; }
.action-btn { display: flex; align-items: center; gap: 8rpx; }
.a-icon { width: 44rpx; height: 44rpx; border-radius: 50%; background: #F2F4F7; color: #1D1D1F; font-size: 20rpx; font-weight: 900; display: flex; align-items: center; justify-content: center; }
.a-count { font-size: 24rpx; font-weight: 800; color: #505050; }
</style>
