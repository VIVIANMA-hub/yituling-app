<template>
	<view class="apple-container">
		<view class="glass-header">
			<view class="status-bar"></view>
			<view class="header-content">
				<view class="title-box">
					<text class="hero-title">影像笔记</text>
					<text class="hero-subtitle">脱敏经验、报告模板和避坑记录</text>
				</view>
				<view class="right-actions">
					<view class="vip-mini-btn" @click="goToVip">
						<text class="v-icon">Pro</text><text class="v-text">升级</text>
					</view>
					<view class="capture-btn shadow-blue" v-if="isMedUser" @click="handleCapture">
						<text class="btn-icon">＋</text>
						<text>记录经验</text>
					</view>
				</view>
			</view>

			<scroll-view scroll-x class="tab-scroll" :show-scrollbar="false">
				<view class="tabs-inner">
					<view class="tab-pill" 
						v-for="(tab, i) in activeCategories" :key="i"
						:class="{ active: activeTab === i }" 
						@click="setActiveTab(i)">
						{{ tab }}
					</view>
				</view>
			</scroll-view>
		</view>

		<scroll-view scroll-y class="notes-flow" :show-scrollbar="false" @scrolltolower="loadMoreFeed" lower-threshold="200">
			<view class="header-spacer"></view>
			
			<view class="disclaimer-bar">
				<text>只展示脱敏后的学习笔记和报告表达</text>
			</view>

			<!-- 快速记录卡（flomo 模式：写完按存，零跳转） -->
			<view class="quick-card">
				<view class="quick-head">
					<text class="quick-title">速记一条影像笔记</text>
					<text class="quick-sync" :class="quickSyncState" @click="onSyncTagClick">{{ quickSyncLabel }}</text>
				</view>
				<textarea
					class="quick-textarea"
					v-model="quickInput"
					:adjust-position="true"
					:show-confirm-bar="false"
					maxlength="500"
					placeholder="例：胸部DR上叶斑片影 + 体位略偏。先存草稿，回头补结构化字段再送审。"
					@confirm="saveQuickDraft"
				></textarea>
				<view class="quick-foot">
					<text class="quick-hint">{{ quickInput.length }}/500 · 主模态 {{ primaryModalityLabel }}</text>
					<view class="quick-actions">
						<view class="quick-btn-ghost" @click="openPublish">完整记录</view>
						<view class="quick-btn-main" :class="{ disabled: !canQuickSave }" @click="saveQuickDraft">存草稿</view>
					</view>
				</view>
			</view>

			<!-- 我的发布状态（登录后显示）-->
			<view class="my-status-card" v-if="myStats.total > 0">
				<view class="status-head">
					<text class="status-title">我的笔记云端状态</text>
					<view class="status-actions">
						<text class="status-refresh" @click="fetchMyStats">刷新</text>
						<text class="status-manage" @click="goMyNotes">管理</text>
					</view>
				</view>
				<view class="status-row" @click="goMyNotes">
					<view class="status-cell">
						<text class="status-num">{{ myStats.draft }}</text>
						<text class="status-label">草稿</text>
					</view>
					<view class="status-cell">
						<text class="status-num pending">{{ myStats.pending }}</text>
						<text class="status-label">待审</text>
					</view>
					<view class="status-cell">
						<text class="status-num approved">{{ myStats.approved }}</text>
						<text class="status-label">已通过</text>
					</view>
					<view class="status-cell">
						<text class="status-num rejected">{{ myStats.rejected }}</text>
						<text class="status-label">被驳</text>
					</view>
				</view>
				<view class="status-hint" v-if="myStats.draft > 0 || myStats.rejected > 0">
					{{ myStats.draft }} 条草稿、{{ myStats.rejected }} 条被驳——点上方"管理"进入我的笔记。
				</view>
			</view>

			<view class="modality-panel">
				<text class="modality-title">当前主模态：{{ primaryModalityLabel }}</text>
				<view class="modality-actions">
					<view
						class="modality-chip"
						v-for="item in modalityOptions"
						:key="item.key"
						:class="{ active: primaryModality === item.key }"
						@click="setPrimaryModality(item.key)"
					>
						{{ item.name }}
					</view>
				</view>
				<text class="modality-tip">默认优先展示同模态内容；MRI 进阶内容可手动展开查看。</text>
			</view>

			<view class="advanced-toggle" v-if="primaryModality !== 'mri'" @click="showAdvancedMri = !showAdvancedMri">
				<text>{{ showAdvancedMri ? '收起MRI进阶内容' : '查看进阶（MRI）' }}</text>
			</view>

			<view class="empty-feed" v-if="!leftList.length && !rightList.length">
				<text class="empty-icon">笔</text>
				<text class="empty-title">{{ activeCategories[activeTab] }}还是空的</text>
				<text class="empty-desc">还没有审核通过的笔记。点击右上角"记录经验"先存一条草稿，提交审核后会出现在这里。</text>
				<view class="empty-cta" @click="openPublish">记录第一条</view>
			</view>

			<view class="waterfall-box" v-else>
				<view class="waterfall-column">
					<view class="wf-card shadow-soft" v-for="(item, i) in leftList" :key="'l'+i" @click="goDetail(item)">
							<view class="img-wrapper">
								<image :src="item.cover" mode="widthFix" class="case-img"></image>
								<view class="badge-top-left" v-if="item.isIndexed">已脱敏</view>
								<view class="badge-top-right" v-if="item.modality">{{ modalityText(item.modality) }}</view>
								<view class="ai-overlay" v-if="item.aiTag">{{ item.aiTag }}</view>
							</view>
						<view class="card-content">
							<text class="case-title">{{ item.title }}</text>
							<view class="ct-companion-card" v-if="item.modality === 'mri'">
								<text class="ct-companion-title">同病种CT平扫参考</text>
								<text class="ct-companion-text">{{ item.ctCompanion || '暂无 CT 参考' }}</text>
							</view>
							<view class="card-footer">
								<view class="author-info">
									<image class="avatar-mini" :src="$store.getters.avatar || '/static/rabbit.jpg'" mode="aspectFill" v-if="item.author === boundName"></image>
									<view class="avatar-text" v-else>医</view>
									<text class="author-name">{{ formatName(item.author) }}</text>
								</view>
								<view class="engagement"><text class="e-item">赞 {{ item.likes }}</text></view>
							</view>
						</view>
					</view>
				</view>

				<view class="waterfall-column">
					<view class="wf-card shadow-soft" v-for="(item, i) in rightList" :key="'r'+i" @click="goDetail(item)">
							<view class="img-wrapper">
								<image :src="item.cover" mode="widthFix" class="case-img"></image>
								<view class="badge-top-right" v-if="item.modality">{{ modalityText(item.modality) }}</view>
								<view class="ai-overlay" v-if="item.aiTag">{{ item.aiTag }}</view>
							</view>
						<view class="card-content">
							<text class="case-title">{{ item.title }}</text>
							<view class="ct-companion-card" v-if="item.modality === 'mri'">
								<text class="ct-companion-title">同病种CT平扫参考</text>
								<text class="ct-companion-text">{{ item.ctCompanion || '暂无 CT 参考' }}</text>
							</view>
							<view class="card-footer">
								<view class="author-info">
									<image class="avatar-mini" :src="$store.getters.avatar || '/static/rabbit.jpg'" mode="aspectFill" v-if="item.author === boundName"></image>
									<view class="avatar-text" v-else>医</view>
									<text class="author-name">{{ formatName(item.author) }}</text>
								</view>
								<view class="engagement"><text class="e-item">赞 {{ item.likes }}</text></view>
							</view>
						</view>
					</view>
				</view>
			</view>
			
			<view class="feed-foot" v-if="leftList.length || rightList.length">
				<text v-if="feedLoading">加载中…</text>
				<text v-else-if="feedDone">— 没有更多了 —</text>
				<text v-else @click="loadMoreFeed">点击加载更多</text>
			</view>

			<view class="safe-bottom-area"></view>
		</scroll-view>

		<app-tab-bar active="notes" />

		<view class="publish-mask" v-if="showPublish" @click="closePublish">
			<view class="publish-sheet" @click.stop>
				<view class="sheet-handle"></view>
				<text class="sheet-title">{{ editingPostId ? '编辑笔记' : '记录影像经验' }}</text>
				<text class="sheet-desc">{{ editingPostId ? '修改后会替换云端草稿；回到详情页可再次提交审核。' : '只记录自己的学习笔记、报告表达和避坑经验；请先完成脱敏。' }}</text>

				<view class="publish-field">
					<text class="field-label">标题</text>
					<input class="field-input" v-model="draft.title" placeholder="例如：胸部DR体位不正导致伪影的处理经验" />
				</view>

				<view class="publish-field">
					<text class="field-label">内容分类</text>
					<view class="category-row">
						<view
							class="category-chip"
							v-for="item in medCategories"
							:key="item"
							:class="{ active: draft.category === item }"
							@click="draft.category = item"
						>
							{{ item }}
						</view>
					</view>
				</view>

				<view class="publish-field">
					<text class="field-label">影像模态</text>
					<view class="category-row">
						<view
							class="category-chip"
							v-for="item in modalityOptions"
							:key="`draft_${item.key}`"
							:class="{ active: draft.modality === item.key }"
							@click="draft.modality = item.key"
						>
							{{ item.name }}
						</view>
					</view>
				</view>

				<view class="publish-field" v-if="draft.modality === 'mri'">
					<text class="field-label">同病种 CT 平扫参考（选填）</text>
					<input class="field-input" v-model="draft.ctCompanionNote" placeholder="例如：可补充同病种 CT 平扫关键层面与窗位要点" />
				</view>

				<view class="publish-field">
					<text class="field-label">帖子类型</text>
					<view class="category-row">
						<view
							class="category-chip"
							v-for="item in threadTypeOptions"
							:key="item.key"
							:class="{ active: draft.threadType === item.key }"
							@click="draft.threadType = item.key"
						>
							{{ item.name }}
						</view>
					</view>
				</view>

				<view class="publish-field">
					<text class="field-label">影像表现 / 学习要点 / 报告表达参考</text>
					<textarea class="field-textarea" v-model="draft.content" maxlength="500" placeholder="写影像表现、主题标签、学习要点、报告表达参考或医保避坑记录。不要写诊断建议、治疗方案、用药建议或分诊建议。" />
				</view>

				<view class="check-row" :class="{ active: draft.deidentified }" @click="draft.deidentified = !draft.deidentified">
					<view class="check-box">{{ draft.deidentified ? '✓' : '' }}</view>
					<text>我确认图片/报告已完成脱敏，不含患者、医院、医生等可识别信息</text>
				</view>

					<view class="sheet-actions">
						<view class="sheet-sub" @click="closePublish">取消</view>
						<view class="sheet-main" :class="{ disabled: !canSubmit }" @click="submitDraft">{{ editingPostId ? '保存修改' : '保存草稿' }}</view>
					</view>
				</view>
			</view>

		<view class="publish-mask" v-if="showPrimaryPicker" @click="showPrimaryPicker = false">
			<view class="publish-sheet" @click.stop>
				<view class="sheet-handle"></view>
				<text class="sheet-title">先选你的主模态</text>
				<text class="sheet-desc">我们会优先展示你看得懂、用得上的内容。后续可在本页随时切换。</text>
				<view class="category-row modality-picker-row">
					<view
						class="category-chip modality-picker-chip"
						v-for="item in modalityOptions"
						:key="`first_${item.key}`"
						@click="confirmPrimaryModality(item.key)"
					>
						{{ item.name }}
					</view>
				</view>
			</view>
		</view>

		<view class="publish-mask" v-if="showSimilarSheet" @click="closeSimilarSheet">
			<view class="publish-sheet similar-sheet" @click.stop>
				<view class="sheet-handle"></view>
				<text class="sheet-title">相似病例参考</text>
				<text class="sheet-desc">上传/发布后立即返回结构化相似结果。默认同模态优先，跨模态可展开。</text>

				<view class="similar-filter-row">
					<view class="similar-filter-chip" :class="{ active: similarFilter === 'all' }" @click="similarFilter = 'all'">全部</view>
					<view
						class="similar-filter-chip"
						v-for="item in modalityOptions"
						:key="item.key"
						:class="{ active: similarFilter === item.key }"
						@click="similarFilter = item.key"
					>仅看{{ item.name }}</view>
				</view>

				<view class="similar-block">
					<text class="similar-block-title">同模态优先</text>
					<view class="similar-item" v-for="item in sameModalityResults" :key="item.id">
						<view class="similar-top">
							<text class="similar-title">{{ item.title }}</text>
							<text class="similar-score">相似度 {{ item.score }}</text>
						</view>
						<text class="similar-meta">{{ modalityText(item.modality) }} · {{ item.bodyPart }} · {{ item.positioning }}</text>
						<text class="similar-tags">{{ formatReasonTags(item.reasonTags) }}</text>
					</view>
					<text class="similar-empty" v-if="!sameModalityResults.length">暂无同模态结果</text>
				</view>

				<view class="similar-block">
					<view class="similar-cross-head">
						<text class="similar-block-title">跨模态参考</text>
						<view class="sheet-sub similar-toggle-btn" @click="showCrossModality = !showCrossModality">
							{{ showCrossModality ? '收起' : '展开' }}
						</view>
					</view>
					<view v-if="showCrossModality">
						<view class="similar-item" v-for="item in crossModalityResults" :key="item.id">
							<view class="similar-top">
								<text class="similar-title">{{ item.title }}</text>
								<text class="similar-score">相似度 {{ item.score }}</text>
							</view>
							<text class="similar-meta">{{ modalityText(item.modality) }} · {{ item.bodyPart }} · {{ item.positioning }}</text>
							<text class="similar-tags">{{ formatReasonTags(item.reasonTags) }}</text>
						</view>
						<text class="similar-empty" v-if="!crossModalityResults.length">暂无跨模态结果</text>
					</view>
					<text class="similar-empty" v-else>默认折叠，点击“展开”查看。</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import AppTabBar from '@/components/app-tab-bar/app-tab-bar.vue';
import { getPointDashboard } from '@/utils/points.js';
import { withAuth, isLoggedIn, ensureLogin, tryClaimInviteReward } from '@/utils/identity.js';

export default {
	components: { AppTabBar },
	data() {
		return {
			activeTab: 0,
			isMedUser: true,
			showPublish: false,
			showPrimaryPicker: false,
			showSimilarSheet: false,
			showCrossModality: false,
			showAdvancedMri: false,
			primaryModality: 'ct_plain',
			similarFilter: 'all',
			editingPostId: '',
			draft: {
				title: '',
				content: '',
				category: '实战经验',
				modality: 'ct_plain',
				threadType: 'note',
				ctCompanionNote: '',
				deidentified: false,
				authorized: false
			},
			medCategories: ['实战经验', '报告模板', '避坑指南', '解剖笔记'],
			modalityOptions: [
				{ key: 'ct_plain', name: 'CT平扫' },
				{ key: 'ct_enhanced', name: 'CT增强' },
				{ key: 'cta', name: 'CTA' },
				{ key: 'mri', name: 'MRI' },
				{ key: 'xray', name: 'X线' },
				{ key: 'dsa', name: 'DSA' },
				{ key: 'nuclear', name: '核医学' },
				{ key: 'ultrasound', name: '超声' }
			],
			threadTypeOptions: [
				{ key: 'note', name: '经验笔记' },
				{ key: 'qa', name: '疑难请教' }
			],
			cases: [],
			leftList: [],
			rightList: [],
			similarResults: [],
			myStats: { total: 0, draft: 0, pending: 0, approved: 0, rejected: 0 },
			feedSkip: 0,
			feedDone: false,
			feedLoading: false,
			feedPageSize: 30,
			quickInput: '',
			quickSyncState: 'idle'  // idle / syncing / synced / failed
		}
	},
	computed: {
		activeCategories() { return this.medCategories; },
		primaryModalityLabel() {
			const selected = this.modalityOptions.find(item => item.key === this.primaryModality)
			return selected ? selected.name : 'CT平扫'
		},
		filteredCases() {
			const category = this.medCategories[this.activeTab];
			const categoryList = this.cases.filter(item => item.category === category);
			if (this.primaryModality === 'mri') return categoryList
			const sameModality = categoryList.filter(item => item.modality === this.primaryModality)
			const rest = categoryList.filter(item => item.modality !== this.primaryModality)
			const noMri = rest.filter(item => item.modality !== 'mri')
			const mri = rest.filter(item => item.modality === 'mri')
			const advancedMri = this.showAdvancedMri ? mri : []
			return [...sameModality, ...noMri, ...advancedMri]
		},
		filteredSimilarResults() {
			if (this.similarFilter === 'all') return this.similarResults
			return this.similarResults.filter(item => item.modality === this.similarFilter)
		},
		sameModalityResults() {
			return this.filteredSimilarResults.filter(item => !item.isCrossModality)
		},
		crossModalityResults() {
			return this.filteredSimilarResults.filter(item => item.isCrossModality)
		},
		canSubmit() {
			return this.draft.title.trim() && this.draft.content.trim() && this.draft.category && this.draft.deidentified;
		},
		canQuickSave() {
			return this.quickInput.trim().length > 0 && this.quickSyncState !== 'syncing'
		},
		quickSyncLabel() {
			const map = { idle: '', syncing: '⟳ 同步中', synced: '✓ 已同步', failed: '⚠ 未同步 · 点重试' }
			return map[this.quickSyncState] || ''
		},
		boundName() { return this.$store.getters.realName || '医生'; }
	},
	onShow() {
		uni.hideTabBar();
		const storedPrimary = uni.getStorageSync('ytl_primary_modality')
		if (storedPrimary) {
			this.primaryModality = storedPrimary
		} else {
			this.showPrimaryPicker = true
		}
		this.splitData();
		this.fetchCloudFeed();
		this.fetchMyStats();
		this.checkEditPrefill();
		this.restoreQuickInput();
	},
	watch: {
		quickInput(val) {
			// 实时持久化到 storage（不 debounce：uni storage 写入很快）
			if (val) {
				uni.setStorageSync('ytl_quick_input_draft', val)
			} else {
				uni.removeStorageSync('ytl_quick_input_draft')
			}
		}
	},
	methods: {
		async fetchMyStats() {
			if (!isLoggedIn()) {
				this.myStats = { total: 0, draft: 0, pending: 0, approved: 0, rejected: 0 }
				return
			}
			try {
				const res = await uniCloud.callFunction({
					name: 'notes-post',
					data: withAuth({ action: 'list_mine' })
				})
				const r = res && res.result
				if (!r || !r.ok || !Array.isArray(r.posts)) return
				const stats = { total: r.posts.length, draft: 0, pending: 0, approved: 0, rejected: 0 }
				for (const p of r.posts) {
					if (stats[p.status] != null) stats[p.status]++
				}
				this.myStats = stats
			} catch (e) {
				console.log('[notes] fetchMyStats skipped:', e && e.message)
			}
		},
		async fetchCloudFeed() {
			// 首次拉取：重置分页状态
			this.feedSkip = 0
			this.feedDone = false
			// 清掉旧的云端 case，保留本地 unshift 的草稿（无 _cloudPostId）
			this.cases = this.cases.filter(c => !c._cloudPostId)
			await this._fetchFeedPage(0)
		},
		async loadMoreFeed() {
			if (this.feedDone || this.feedLoading) return
			await this._fetchFeedPage(this.feedSkip)
		},
		async _fetchFeedPage(skip) {
			if (this.feedLoading) return
			this.feedLoading = true
			try {
				const res = await uniCloud.callFunction({
					name: 'notes-post',
					data: withAuth({ action: 'list_feed', limit: this.feedPageSize, skip })
				})
				const r = res && res.result
				if (!r || !r.ok || !Array.isArray(r.posts)) {
					this.feedDone = true
					return
				}
				const cloudCases = r.posts.map(p => ({
					_cloudPostId: p._id,
					title: p.title,
					author: p.ownerName || '医生',
					category: p.category || '实战经验',
					cover: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500&h=700&fit=crop',
					likes: 0,
					isIndexed: true,
					modality: p.modality,
					displayModality: this.modalityText(p.modality),
					aiTag: p.publishWeight >= 110 ? '出书候选' : '已脱敏',
					bodyPart: p.bodyPart || '未标注',
					tags: p.tags || [],
					positioning: p.positioning || '未标注',
					hasCtCompanion: !!p.ctCompanion,
					ctCompanion: p.ctCompanion || '',
					publishWeight: p.publishWeight || 0,
					content: p.content
				}))
				// 去重：若 cases 中已有 _cloudPostId 一致项则跳过
				const known = new Set(this.cases.map(c => c._cloudPostId).filter(Boolean))
				const fresh = cloudCases.filter(c => !known.has(c._cloudPostId))
				this.cases = [...this.cases, ...fresh]
				this.feedSkip = skip + r.posts.length
				if (r.posts.length < this.feedPageSize) this.feedDone = true
				this.splitData()
			} catch (e) {
				console.log('[notes] fetch feed page skipped:', e && e.message)
			} finally {
				this.feedLoading = false
			}
		},
		setPrimaryModality(modalityKey) {
			this.primaryModality = modalityKey
			uni.setStorageSync('ytl_primary_modality', modalityKey)
			this.splitData()
		},
		confirmPrimaryModality(modalityKey) {
			this.setPrimaryModality(modalityKey)
			this.showPrimaryPicker = false
		},
		modalityText(modality) {
			const selected = this.modalityOptions.find(item => item.key === modality)
			return selected ? selected.name : modality
		},
		// 从标题+正文里抽取常见标签（部位、征象、技术、设备）。
		// 字典命中即加；不命中静默忽略，避免标签污染。客户端推断，结果与用户手动标签 union。
		inferTagsFromContent(text, modalityKey) {
			const blob = String(text || '')
			const tags = new Set()

			// 模态名也作为一个标签
			const modalityName = this.modalityText(modalityKey)
			if (modalityName) tags.add(modalityName)

			// 部位（与发布逻辑里的 bodyPartMatch 共享词表）
			const BODY_PARTS = ['头颅','胸部','腹部','盆腔','颈椎','腰椎','膝关节','髋关节','肩关节','踝关节','四肢','乳腺','甲状腺','心脏','肝','胆','胰','脾','肾','膀胱','前列腺','子宫']
			for (const p of BODY_PARTS) if (blob.includes(p)) tags.add(p)

			// 技术/序列
			const TECH = ['平扫','增强','三期','动脉期','静脉期','延迟期','DWI','T1','T2','FLAIR','压脂','水成像','三维重建','MIP','MPR','VR','灌注','弥散']
			for (const t of TECH) if (blob.includes(t)) tags.add(t)

			// 常见征象/避坑词（客户端粗筛，最终由审核确认）
			const SIGNS = ['伪影','运动伪影','金属伪影','部分容积','GGO','磨玻璃','钙化','结节','囊肿','积液','水肿','骨折','撕裂','梗死','栓塞','狭窄','扩张','占位']
			for (const s of SIGNS) if (blob.includes(s)) tags.add(s)

			// 体位
			const POSE = ['正位','侧位','斜位','仰卧位','俯卧位','站立位','屈曲位']
			for (const p of POSE) if (blob.includes(p)) tags.add(p)

			return [...tags]
		},
		splitData() {
			this.leftList = [];
			this.rightList = [];
			this.filteredCases.forEach((item, index) => {
				if (index % 2 === 0) {
					this.leftList.push(item);
				} else {
					this.rightList.push(item);
				}
			});
		},
		setActiveTab(index) {
			this.activeTab = index;
			this.splitData();
		},
		formatReasonTags(reasonTags = []) {
			if (!Array.isArray(reasonTags) || !reasonTags.length) return '匹配标签：暂无'
			return `匹配标签：${reasonTags.join(' / ')}`
		},
		formatName(n) {
			if (n === this.boundName) return n;
			const surname = n[0];
			const titleMap = {
				'唐继平': '唐总', '张明': '张总', '王强': '王总', '李婷': '婷姐',
				'陈静': '陈顾问', '刘洋': '刘先生',
				'医生D': '李护士长', '医生A': '黄主任', '医生C': '杨医生',
				'医生E': '韦技师', '医生B': '文老师'
			};
			return titleMap[n] || (surname + '先生');
		},
		handleCapture() {
			uni.navigateTo({ url: '/pages/anonymize/anonymize' });
		},
		openPublish() {
			this.showPublish = true;
		},
		closePublish() {
			this.showPublish = false;
			if (this.editingPostId) {
				this.editingPostId = '';
				this.draft = { title: '', content: '', category: '实战经验', modality: this.primaryModality, threadType: 'note', ctCompanionNote: '', deidentified: false, authorized: false };
			}
		},
		closeSimilarSheet() {
			this.showSimilarSheet = false
			this.showCrossModality = false
			this.similarFilter = 'all'
		},
		calcPathologyCompletenessScore(content = '', hasCtCompanion = false) {
			const lengthScore = Math.min(40, Math.floor((content.length || 0) / 12))
			const keywordBonus = /(影像表现|层面|窗位|体位|扫描范围|报告表达|要点)/.test(content) ? 30 : 0
			const companionBonus = hasCtCompanion ? 30 : 0
			return Math.max(0, Math.min(100, lengthScore + keywordBonus + companionBonus))
		},
		calcPublishWeight(payload) {
			const completeness = Number(payload.pathologyCompletenessScore || 0)
			const deidBonus = payload.deidentified ? 20 : 0
			const feedbackBase = Math.min(20, Math.floor(Number(payload.likes || 0) / 10))
			return completeness + deidBonus + feedbackBase
		},
		buildSimilarResults(payload) {
			const sourceTags = Array.isArray(payload.tags) ? payload.tags : []
			const sourcePart = payload.bodyPart || ''
			const sourcePositioning = payload.positioning || ''
			const list = this.cases.map((item, index) => {
				const itemTags = Array.isArray(item.tags) ? item.tags : []
				const matchedTags = sourceTags.filter(tag => itemTags.includes(tag))
				const sameModality = item.modality === payload.modality
				const samePart = sourcePart && item.bodyPart === sourcePart
				const samePositioning = sourcePositioning && item.positioning === sourcePositioning
				let score = 40
				score += matchedTags.length * 12
				if (sameModality) score += 20
				if (samePart) score += 18
				if (samePositioning) score += 10
				score = Math.min(99, Math.max(45, score))
				return {
					id: `similar_${Date.now()}_${index}`,
					title: item.title,
					score,
					reasonTags: [...matchedTags, samePart ? '同部位' : '', samePositioning ? '同体位' : ''].filter(Boolean),
					modality: item.modality,
					bodyPart: item.bodyPart || '未知部位',
					positioning: item.positioning || '未标注体位',
					isCrossModality: !sameModality
				}
			})
			return list
				.filter(item => item.title !== payload.title)
				.sort((a, b) => b.score - a.score)
		},
		submitDraft() {
			if (!this.canSubmit) {
				uni.showToast({ title: '请填写内容并确认已脱敏', icon: 'none' });
				return;
			}
			if (this.hasMedicalAdviceText(this.draft.title + this.draft.content)) {
				uni.showModal({
					title: '内容需修改',
					content: '发布内容只能写影像表现、学习要点、报告表达或避坑记录，不能包含诊断建议、治疗方案、用药建议或分诊建议。',
					showCancel: false
				});
				return;
				}
				// 编辑模式：直接走云端 save_draft 带 postId，不重复加本地草稿列表
				if (this.editingPostId) {
					this._saveEditAsDraft()
					return
				}
				const list = uni.getStorageSync('ytl_cocreate_drafts') || [];
				const bodyPartMatch = (this.draft.title + this.draft.content).match(/头颅|胸部|腹部|膝关节|腰椎|四肢|颈椎|盆腔/)
				const bodyPart = bodyPartMatch ? bodyPartMatch[0] : '未标注'
				const hasCtCompanion = this.draft.modality === 'mri' && !!this.draft.ctCompanionNote.trim()
				const pathologyCompletenessScore = this.calcPathologyCompletenessScore(this.draft.content, hasCtCompanion)
				list.unshift({
					id: Date.now(),
					title: this.draft.title,
					content: this.draft.content,
					category: this.draft.category,
					modality: this.draft.modality,
					displayModality: this.modalityText(this.draft.modality),
					threadType: this.draft.threadType,
					qaStatus: this.draft.threadType === 'qa' ? 'open' : 'na',
					acceptedAnswerId: '',
					hasCtCompanion,
					ctCompanion: this.draft.ctCompanionNote.trim(),
					pathologyCompletenessScore,
					publishWeight: 0,
					bodyPart,
					tags: this.inferTagsFromContent(this.draft.title + ' ' + this.draft.content, this.draft.modality),
					positioning: /仰卧|站立|正位|侧位/.test(this.draft.content) ? (this.draft.content.match(/仰卧|站立|正位|侧位/) || ['未标注'])[0] : '未标注',
					deidentified: true,
					authorized: this.draft.authorized,
					authorizedAt: this.draft.authorized ? new Date().toISOString() : '',
					status: 'draft',
					createdAt: new Date().toISOString()
				});
				const latest = list[0]
				latest.publishWeight = this.calcPublishWeight(latest)
				uni.setStorageSync('ytl_cocreate_drafts', list);
				// 登录用户：把这条草稿同步到云端（作为 draft 留底；不自动 publish_for_review，避免误送审）
				if (isLoggedIn()) {
					this._syncDraftToCloud(latest)
				}
				const tagByType = latest.threadType === 'qa' ? '疑难请教' : '已脱敏'
				const topWeightTag = latest.publishWeight >= 110 ? '出书候选' : tagByType
				this.cases.unshift({
					title: latest.title,
					author: this.boundName,
					category: latest.category,
					cover: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500&h=700&fit=crop',
					likes: 0,
					isIndexed: true,
					modality: latest.modality,
					displayModality: latest.displayModality,
					aiTag: topWeightTag,
					bodyPart: latest.bodyPart,
					tags: latest.tags,
					positioning: latest.positioning,
					hasCtCompanion: latest.hasCtCompanion,
					ctCompanion: latest.ctCompanion,
					pathologyCompletenessScore: latest.pathologyCompletenessScore,
					publishWeight: latest.publishWeight
				})
				this.similarResults = this.buildSimilarResults(latest)
				this.showSimilarSheet = true
				this.draft = { title: '', content: '', category: '实战经验', modality: this.primaryModality, threadType: 'note', ctCompanionNote: '', deidentified: false, authorized: false };
				this.showPublish = false;
				this.splitData()
				const dash = getPointDashboard()
				uni.setStorageSync('ytl_honor_account', dash.honorAccount || { level: 1, honorPoints: 0, badges: [] })
				uni.showModal({
					title: '已保存草稿',
					content: '草稿已保存。已生成同模态优先的相似病例参考，可继续补充或发布。',
					showCancel: false
				});
			},
		goDetail(item) {
			uni.setStorageSync('current_case', item);
			uni.navigateTo({ url: '/pages/notes/detail' });
		},
		async _syncDraftToCloud(latest) {
			// 异步、容错；失败只 log 不打扰用户，下次发布或回到详情再补
			try {
				const res = await uniCloud.callFunction({
					name: 'notes-post',
					data: withAuth({
						action: 'save_draft',
						title: latest.title,
						content: latest.content,
						category: latest.category,
						modality: latest.modality,
						threadType: latest.threadType,
						bodyPart: latest.bodyPart,
						positioning: latest.positioning,
						ctCompanion: latest.ctCompanion,
						tags: latest.tags,
						deidentified: latest.deidentified,
						authorized: latest.authorized,
						publishWeight: latest.publishWeight
					})
				})
				const r = res && res.result
				if (r && r.ok && r.postId) {
					const list = uni.getStorageSync('ytl_cocreate_drafts') || []
					if (list[0] && list[0].id === latest.id) {
						list[0].cloudPostId = r.postId
						list[0].cloudStatus = r.status
						uni.setStorageSync('ytl_cocreate_drafts', list)
					}
				}
			} catch (e) {
				console.log('[notes] cloud draft sync skipped:', e && e.message)
			}
		},
		async publishCloudForReview(latest) {
			if (!latest) return
			if (!isLoggedIn()) { ensureLogin(); return }
			try {
				uni.showLoading({ title: '提交审核中...' })
				const res = await uniCloud.callFunction({
					name: 'notes-post',
					data: withAuth({
						action: 'publish_for_review',
						postId: latest.cloudPostId || undefined,
						title: latest.title,
						content: latest.content,
						category: latest.category,
						modality: latest.modality,
						threadType: latest.threadType,
						bodyPart: latest.bodyPart,
						positioning: latest.positioning,
						ctCompanion: latest.ctCompanion,
						tags: latest.tags,
						deidentified: latest.deidentified,
						authorized: latest.authorized,
						publishWeight: latest.publishWeight
					})
				})
				uni.hideLoading()
				const r = res && res.result
				if (!r || !r.ok) {
					uni.showModal({ title: '提交审核失败', content: (r && r.message) || '请稍后重试', showCancel: false })
					return
				}
				uni.showToast({ title: '已提交审核', icon: 'success' })
				// 有效行为：异步触发邀请奖励发放
				tryClaimInviteReward()
				const list = uni.getStorageSync('ytl_cocreate_drafts') || []
				const idx = list.findIndex(d => d.id === latest.id)
				if (idx >= 0) {
					list[idx].cloudPostId = r.postId
					list[idx].cloudStatus = r.status
					uni.setStorageSync('ytl_cocreate_drafts', list)
				}
			} catch (e) {
				uni.hideLoading()
				uni.showModal({ title: '网络异常', content: e && e.message || 'unknown', showCancel: false })
			}
		},
		goToVip() {
			uni.navigateTo({ url: '/pages/vip/vip' });
		},
		goMyNotes() {
			if (!isLoggedIn()) { ensureLogin(); return }
			uni.navigateTo({ url: '/pages/notes/mine' });
		},
		restoreQuickInput() {
			try {
				const saved = uni.getStorageSync('ytl_quick_input_draft')
				if (saved && !this.quickInput) {
					this.quickInput = String(saved)
					// 状态显示为本地草稿，提示用户上次有未存内容
					this.quickSyncState = 'failed'
				}
			} catch (e) { /* 静默 */ }
		},
		onSyncTagClick() {
			// failed 状态下点击 = 重试
			if (this.quickSyncState === 'failed' && this.quickInput.trim()) {
				this.saveQuickDraft()
			}
		},
		async saveQuickDraft() {
			const content = this.quickInput.trim()
			if (!content) {
				uni.showToast({ title: '写一点内容再存', icon: 'none' })
				return
			}
			// 合规：医疗建议词在草稿阶段也拦截（避免用户养成坏习惯）
			if (this.hasMedicalAdviceText(content)) {
				uni.showModal({
					title: '内容需修改',
					content: '影像笔记不能写诊断建议、用药建议、分诊建议或治疗方案。请改成影像表现/操作要点。',
					showCancel: false
				})
				return
			}
			if (!isLoggedIn()) { ensureLogin(); return }
			// 首行作为标题（最多 30 字），其余作为正文
			const firstLine = content.split('\n')[0].trim()
			const title = firstLine.length > 30 ? firstLine.slice(0, 30) + '…' : firstLine
			const bodyPartMatch = content.match(/头颅|胸部|腹部|膝关节|腰椎|四肢|颈椎|盆腔/)
			const bodyPart = bodyPartMatch ? bodyPartMatch[0] : '未标注'
			const positioning = /仰卧|站立|正位|侧位/.test(content) ? (content.match(/仰卧|站立|正位|侧位/) || ['未标注'])[0] : '未标注'
			const tags = this.inferTagsFromContent(content, this.primaryModality)

			this.quickSyncState = 'syncing'
			try {
				const res = await uniCloud.callFunction({
					name: 'notes-post',
					data: withAuth({
						action: 'save_draft',
						title,
						content,
						category: '实战经验',
						modality: this.primaryModality,
						threadType: 'note',
						bodyPart,
						positioning,
						tags,
						deidentified: false,
						authorized: false
					})
				})
				const r = res && res.result
				if (!r || !r.ok) {
					this.quickSyncState = 'failed'
					uni.showToast({ title: (r && r.message) || '存草稿失败', icon: 'none' })
					return
				}
				this.quickSyncState = 'synced'
				// 清空输入框，让用户能立即写下一条（flomo 模式）
				this.quickInput = ''
				uni.showToast({ title: '✓ 已存草稿', icon: 'none', duration: 1200 })
				// 刷新计数 + 1.6s 后状态回到 idle
				this.fetchMyStats()
				setTimeout(() => { if (this.quickSyncState === 'synced') this.quickSyncState = 'idle' }, 1600)
			} catch (e) {
				this.quickSyncState = 'failed'
				uni.showToast({ title: '网络异常，再点一次重试', icon: 'none' })
			}
		},
		checkEditPrefill() {
			const prefill = uni.getStorageSync('ytl_notes_edit_prefill')
			if (!prefill || !prefill.cloudPostId) return
			this.editingPostId = prefill.cloudPostId
			this.draft = {
				title: prefill.title || '',
				content: prefill.content || '',
				category: prefill.category || '实战经验',
				modality: prefill.modality || 'ct_plain',
				threadType: prefill.threadType || 'note',
				ctCompanionNote: prefill.ctCompanionNote || '',
				deidentified: true,
				authorized: !!prefill.authorized
			}
			uni.removeStorageSync('ytl_notes_edit_prefill')
			this.$nextTick(() => { this.showPublish = true })
		},
		async _saveEditAsDraft() {
			uni.showLoading({ title: '保存中...' })
			try {
				const bodyPartMatch = (this.draft.title + this.draft.content).match(/头颅|胸部|腹部|膝关节|腰椎|四肢|颈椎|盆腔/)
				const bodyPart = bodyPartMatch ? bodyPartMatch[0] : '未标注'
				const hasCtCompanion = this.draft.modality === 'mri' && !!this.draft.ctCompanionNote.trim()
				const pathologyCompletenessScore = this.calcPathologyCompletenessScore(this.draft.content, hasCtCompanion)
				const tags = this.inferTagsFromContent(this.draft.title + ' ' + this.draft.content, this.draft.modality)
				const positioning = /仰卧|站立|正位|侧位/.test(this.draft.content) ? (this.draft.content.match(/仰卧|站立|正位|侧位/) || ['未标注'])[0] : '未标注'
				const res = await uniCloud.callFunction({
					name: 'notes-post',
					data: withAuth({
						action: 'save_draft',
						postId: this.editingPostId,
						title: this.draft.title,
						content: this.draft.content,
						category: this.draft.category,
						modality: this.draft.modality,
						threadType: this.draft.threadType,
						bodyPart,
						positioning,
						ctCompanion: this.draft.ctCompanionNote.trim(),
						tags,
						deidentified: this.draft.deidentified,
						authorized: this.draft.authorized,
						publishWeight: pathologyCompletenessScore + (this.draft.deidentified ? 20 : 0)
					})
				})
				uni.hideLoading()
				const r = res && res.result
				if (!r || !r.ok) {
					uni.showModal({ title: '保存失败', content: (r && r.message) || '请稍后重试', showCancel: false })
					return
				}
				uni.showToast({ title: '已保存到云端', icon: 'success' })
				this.editingPostId = ''
				this.showPublish = false
				this.draft = { title: '', content: '', category: '实战经验', modality: this.primaryModality, threadType: 'note', ctCompanionNote: '', deidentified: false, authorized: false }
				this.fetchMyStats()
			} catch (e) {
				uni.hideLoading()
				uni.showModal({ title: '网络异常', content: e && e.message || 'unknown', showCancel: false })
			}
		},
		hasMedicalAdviceText(text) {
			return /(诊断建议|临床处置建议|用药建议|分诊建议|建议用药|建议治疗|自动判断病情|辅助判断病情|确诊|首选药|处方)/.test(text);
		}
	}
}
</script>

<style>
/* 核心材质与排版：强制现代无衬线字体 */
.apple-container { min-height: 100vh; background: #F5F5F7; font-family: system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", "Microsoft YaHei", sans-serif; }
.status-bar { height: 100rpx; }

.glass-header { position: fixed; top: 0; left: 0; right: 0; background: rgba(245, 245, 247, 0.85); backdrop-filter: saturate(180%) blur(20px); z-index: 100; padding: 0 40rpx 20rpx; border-bottom: 1px solid rgba(0,0,0,0.03); }
.header-content { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30rpx; }
.hero-title { font-size: 64rpx; font-weight: 800; color: #1D1D1F; letter-spacing: -2rpx; display: block; }
.hero-subtitle { font-size: 22rpx; color: #86868B; font-weight: 700; margin-top: 8rpx; display: block; }

/* 右侧操作区：VIP按钮 + 拍照按钮 */
.right-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 16rpx; }
.vip-mini-btn { background: linear-gradient(135deg, #FDE68A, #F59E0B); padding: 8rpx 24rpx; border-radius: 100rpx; display: flex; align-items: center; gap: 8rpx; box-shadow: 0 6rpx 16rpx rgba(245, 158, 11, 0.3); transition: transform 0.2s; }
.vip-mini-btn:active { transform: scale(0.95); }
.v-icon { font-size: 18rpx; font-weight: 950; letter-spacing: 0; margin-top: -2rpx; } 
.v-text { font-size: 22rpx; font-weight: 900; color: #45290A; }

.capture-btn { background: #1D1D1F; color: #fff; padding: 18rpx 36rpx; border-radius: 100rpx; font-size: 26rpx; font-weight: 800; display: flex; align-items: center; gap: 8rpx; transition: transform 0.2s; }
.capture-btn:active { transform: scale(0.96); }
.shadow-blue { box-shadow: 0 10rpx 30rpx rgba(0,0,0,0.15); }

.tab-scroll { margin: 0 -40rpx; white-space: nowrap; width: 100vw; }
.tabs-inner { padding: 0 40rpx; display: flex; gap: 16rpx; }
.tab-pill { padding: 16rpx 36rpx; background: #E8E8ED; border-radius: 100rpx; font-size: 26rpx; font-weight: 700; color: #505050; transition: all 0.3s; }
.tab-pill.active { background: #1D1D1F; color: #fff; }

.notes-flow { height: 100vh; }
.header-spacer { height: 320rpx; }
.disclaimer-bar { background: rgba(0, 122, 255, 0.08); padding: 16rpx 40rpx; margin: 0 30rpx 20rpx; border-radius: 18rpx; display: flex; justify-content: center; }
.disclaimer-bar text { font-size: 21rpx; color: #175CD3; font-weight: 800; line-height: 1.35; text-align: center; }

.quick-card { margin: 0 30rpx 24rpx; padding: 24rpx 22rpx 18rpx; background: #FFFFFF; border-radius: 28rpx; box-shadow: 0 12rpx 36rpx rgba(0,0,0,0.04); display: flex; flex-direction: column; gap: 12rpx; }
.quick-head { display: flex; justify-content: space-between; align-items: center; }
.quick-title { font-size: 26rpx; color: #1D1D1F; font-weight: 900; }
.quick-sync { font-size: 20rpx; font-weight: 800; padding: 2rpx 10rpx; border-radius: 6rpx; }
.quick-sync.idle { color: transparent; }
.quick-sync.syncing { color: #B26A00; background: #FFF4E5; }
.quick-sync.synced { color: #137333; background: #E6F4EA; }
.quick-sync.failed { color: #D9342B; background: #FDE2E1; }
.quick-textarea { width: 100%; min-height: 140rpx; padding: 14rpx 4rpx; font-size: 28rpx; color: #1D1D1F; line-height: 1.5; font-weight: 600; box-sizing: border-box; }
.quick-foot { display: flex; justify-content: space-between; align-items: center; gap: 14rpx; }
.quick-hint { font-size: 20rpx; color: #86868B; font-weight: 700; flex: 1; }
.quick-actions { display: flex; gap: 12rpx; align-items: center; flex-shrink: 0; }
.quick-btn-ghost { padding: 14rpx 22rpx; border-radius: 999rpx; background: #F2F4F7; color: #475467; font-size: 22rpx; font-weight: 800; }
.quick-btn-ghost:active { background: #E5E7EB; }
.quick-btn-main { padding: 14rpx 28rpx; border-radius: 999rpx; background: #1D1D1F; color: #FFFFFF; font-size: 24rpx; font-weight: 900; }
.quick-btn-main.disabled { opacity: 0.4; }

.my-status-card { margin: 0 30rpx 28rpx; padding: 26rpx; background: #FFFFFF; border-radius: 28rpx; box-shadow: 0 12rpx 36rpx rgba(0,0,0,0.04); }
.status-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18rpx; }
.status-title { font-size: 28rpx; color: #1D1D1F; font-weight: 900; }
.status-actions { display: flex; gap: 24rpx; align-items: center; }
.status-refresh { font-size: 22rpx; color: #6E6E73; font-weight: 700; }
.status-manage { font-size: 22rpx; color: #1F6FEB; font-weight: 800; }
.status-row { display: flex; justify-content: space-around; }
.status-cell { display: flex; flex-direction: column; align-items: center; gap: 6rpx; }
.status-num { font-size: 38rpx; color: #1D1D1F; font-weight: 800; }
.status-num.pending { color: #B26A00; }
.status-num.approved { color: #137333; }
.status-num.rejected { color: #D9342B; }
.status-label { font-size: 22rpx; color: #86868B; font-weight: 700; }
.status-hint { margin-top: 16rpx; font-size: 22rpx; color: #6E6E73; line-height: 1.5; }

.modality-panel { margin: 0 30rpx 20rpx; padding: 24rpx; border-radius: 24rpx; background: #FFFFFF; box-shadow: 0 10rpx 28rpx rgba(0,0,0,0.035); }
.modality-title { display: block; font-size: 25rpx; color: #1D1D1F; font-weight: 900; }
.modality-actions { margin-top: 14rpx; display: flex; gap: 12rpx; flex-wrap: wrap; }
.modality-chip { padding: 12rpx 20rpx; border-radius: 999rpx; background: #EEF2FF; color: #344054; font-size: 22rpx; font-weight: 850; }
.modality-chip.active { background: #1D1D1F; color: #FFFFFF; }
.modality-tip { display: block; margin-top: 10rpx; font-size: 21rpx; color: #667085; font-weight: 700; }
.advanced-toggle { margin: 0 30rpx 18rpx; padding: 18rpx 22rpx; border-radius: 20rpx; background: #ECF2FF; color: #175CD3; font-size: 23rpx; font-weight: 850; text-align: center; }

.empty-feed { margin: 0 30rpx 28rpx; padding: 60rpx 36rpx; background: #FFFFFF; border-radius: 28rpx; display: flex; flex-direction: column; align-items: center; gap: 18rpx; box-shadow: 0 12rpx 36rpx rgba(0,0,0,0.04); }
.empty-icon { width: 96rpx; height: 96rpx; border-radius: 50%; background: #EEF4FF; color: #175CD3; font-size: 40rpx; font-weight: 900; display: flex; align-items: center; justify-content: center; }
.empty-title { font-size: 30rpx; color: #1D1D1F; font-weight: 900; }
.empty-desc { text-align: center; font-size: 22rpx; color: #667085; line-height: 1.5; font-weight: 700; }
.empty-cta { margin-top: 8rpx; padding: 18rpx 36rpx; background: #1D1D1F; color: #FFFFFF; border-radius: 999rpx; font-size: 24rpx; font-weight: 900; }

.waterfall-box { padding: 0 30rpx; display: flex; justify-content: space-between; align-items: flex-start; }
.waterfall-column { width: 48%; display: flex; flex-direction: column; gap: 24rpx; }
.wf-card { background: #fff; border-radius: 32rpx; overflow: hidden; box-shadow: 0 16rpx 48rpx rgba(0,0,0,0.03); transform: translateZ(0); }
.wf-card:active { transform: scale(0.98); transition: 0.2s; }

.img-wrapper { position: relative; width: 100%; font-size: 0; background: #F5F5F7; }
.case-img { width: 100%; display: block; border-radius: 32rpx 32rpx 0 0; }

.badge-top-left { position: absolute; top: 16rpx; left: 16rpx; background: rgba(0,0,0,0.5); backdrop-filter: blur(10px); color: #fff; font-size: 18rpx; padding: 6rpx 14rpx; border-radius: 8rpx; font-weight: 600; display: flex; align-items: center; gap: 4rpx; }
.badge-top-right { position: absolute; top: 16rpx; right: 16rpx; background: rgba(52, 199, 89, 0.9); color: #fff; font-size: 18rpx; padding: 4rpx 12rpx; border-radius: 6rpx; font-weight: 800; }
.ai-overlay { position: absolute; bottom: 16rpx; left: 16rpx; right: 16rpx; background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); padding: 8rpx 16rpx; border-radius: 12rpx; font-size: 18rpx; font-weight: 800; color: #007AFF; display: flex; align-items: center; gap: 6rpx; }

.card-content { padding: 20rpx 20rpx 24rpx; }
.case-title { font-size: 26rpx; font-weight: 800; color: #1D1D1F; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 16rpx; }

.card-footer { display: flex; justify-content: space-between; align-items: center; }
.author-info { display: flex; align-items: center; gap: 8rpx; }
.avatar-mini { width: 36rpx; height: 36rpx; border-radius: 50%; }
.avatar-text { width: 36rpx; height: 36rpx; border-radius: 50%; background: #EEF4FF; color: #175CD3; font-size: 18rpx; font-weight: 900; display: flex; align-items: center; justify-content: center; }
.author-name { font-size: 20rpx; color: #86868B; font-weight: 700; }
.engagement { display: flex; gap: 6rpx; }
.e-item { font-size: 20rpx; color: #86868B; font-weight: 700; }

.feed-foot { padding: 32rpx 30rpx 16rpx; text-align: center; font-size: 22rpx; color: #86868B; font-weight: 700; }
.safe-bottom-area { height: 260rpx; }

.publish-mask { position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 1000; background: rgba(0,0,0,0.35); display: flex; align-items: flex-end; }
.publish-sheet { width: 100%; max-height: 88vh; overflow-y: auto; background: #FFFFFF; border-radius: 36rpx 36rpx 0 0; padding: 20rpx 34rpx 52rpx; }
.sheet-handle { width: 76rpx; height: 8rpx; border-radius: 999rpx; background: #D0D5DD; margin: 0 auto 30rpx; }
.sheet-title { display: block; font-size: 38rpx; color: #1D1D1F; font-weight: 900; }
.sheet-desc { display: block; margin-top: 12rpx; font-size: 24rpx; color: #667085; line-height: 1.5; font-weight: 650; }
.publish-field { margin-top: 26rpx; }
.field-label { display: block; margin-bottom: 12rpx; font-size: 25rpx; color: #1D1D1F; font-weight: 900; }
.field-input, .field-textarea { width: 100%; border-radius: 18rpx; background: #F5F5F7; padding: 22rpx; color: #1D1D1F; font-size: 26rpx; font-weight: 650; }
.field-input { height: 82rpx; }
.field-textarea { min-height: 180rpx; line-height: 1.5; }
.category-row { display: flex; flex-wrap: wrap; gap: 14rpx; }
.category-chip { padding: 14rpx 22rpx; border-radius: 999rpx; background: #F2F4F7; color: #475467; font-size: 23rpx; font-weight: 850; }
.category-chip.active { background: #1D1D1F; color: #FFFFFF; }
.check-row { margin-top: 18rpx; display: flex; gap: 16rpx; align-items: flex-start; padding: 20rpx; border-radius: 18rpx; background: #F8FAFC; border: 2rpx solid transparent; }
.check-row.active { border-color: rgba(52, 199, 89, 0.4); background: #ECFDF3; }
.check-box { flex-shrink: 0; width: 38rpx; height: 38rpx; border-radius: 10rpx; background: #FFFFFF; border: 2rpx solid #D0D5DD; display: flex; align-items: center; justify-content: center; color: #12B76A; font-size: 24rpx; font-weight: 900; }
.check-row text { flex: 1; font-size: 23rpx; line-height: 1.45; color: #344054; font-weight: 750; }
.sheet-actions { display: flex; gap: 18rpx; margin-top: 28rpx; }
.sheet-sub, .sheet-main { flex: 1; height: 84rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; font-size: 26rpx; font-weight: 900; }
.sheet-sub { background: #F2F4F7; color: #1D1D1F; }
.sheet-main { background: #007AFF; color: #FFFFFF; }
.sheet-main.disabled { opacity: 0.45; }
.modality-picker-row { margin-top: 24rpx; }
.modality-picker-chip { flex: 1; text-align: center; }

.similar-sheet { padding-bottom: 44rpx; }
.similar-filter-row { display: flex; flex-wrap: wrap; gap: 12rpx; margin-top: 20rpx; }
.similar-filter-chip { padding: 12rpx 18rpx; border-radius: 999rpx; background: #F2F4F7; color: #475467; font-size: 22rpx; font-weight: 850; }
.similar-filter-chip.active { background: #1D1D1F; color: #FFFFFF; }
.similar-block { margin-top: 22rpx; }
.similar-cross-head { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; }
.similar-block-title { font-size: 26rpx; color: #1D1D1F; font-weight: 900; }
.similar-item { margin-top: 12rpx; padding: 18rpx; border-radius: 18rpx; background: #F8FAFC; }
.similar-top { display: flex; align-items: center; justify-content: space-between; gap: 12rpx; }
.similar-title { flex: 1; font-size: 23rpx; color: #101828; font-weight: 850; line-height: 1.4; }
.similar-score { flex-shrink: 0; font-size: 21rpx; color: #175CD3; font-weight: 900; }
.similar-meta { display: block; margin-top: 8rpx; font-size: 21rpx; color: #475467; font-weight: 700; }
.similar-tags { display: block; margin-top: 8rpx; font-size: 20rpx; color: #667085; font-weight: 700; }
.similar-empty { display: block; margin-top: 10rpx; font-size: 21rpx; color: #98A2B3; font-weight: 700; }
.similar-toggle-btn { min-width: 120rpx; flex: 0; height: 62rpx; font-size: 22rpx; }
.ct-companion-card { margin-bottom: 12rpx; padding: 14rpx; border-radius: 14rpx; background: #EEF4FF; }
.ct-companion-title { display: block; font-size: 20rpx; color: #175CD3; font-weight: 900; }
.ct-companion-text { display: block; margin-top: 6rpx; font-size: 20rpx; color: #344054; font-weight: 700; line-height: 1.4; }
</style>
