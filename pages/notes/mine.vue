<template>
  <view class="page">
    <view class="status-bar"></view>
    <view class="nav">
      <view class="back-btn" @click="goBack">‹</view>
      <text class="nav-title">我的笔记</text>
      <view class="refresh-btn" @click="fetch">↻</view>
    </view>

    <view class="search-row">
      <view class="search-box">
        <text class="search-icon">⌕</text>
        <input
          class="search-input"
          v-model="searchKeyword"
          placeholder="搜标题 / 内容 / 标签"
          confirm-type="search"
        />
        <text v-if="searchKeyword" class="search-clear" @click="searchKeyword = ''">×</text>
      </view>
    </view>

    <view class="tabs">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="tab"
        :class="{ active: currentTab === tab.key }"
        @click="currentTab = tab.key"
      >
        {{ tab.name }} <text class="tab-count" v-if="counts[tab.key]">({{ counts[tab.key] }})</text>
      </view>
    </view>

    <scroll-view
      scroll-y
      class="scroll"
      :show-scrollbar="false"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onPullRefresh"
    >
      <view v-if="loading" class="empty">加载中…</view>
      <view v-else-if="loadError" class="empty error">{{ loadError }}</view>
      <view v-else-if="!filteredPosts.length" class="empty">{{ emptyHint }}</view>

      <view v-else>
        <view
          v-for="p in filteredPosts"
          :key="p._id"
          class="card"
          :class="{ 'swipe-open': activeSwipeId === p._id, 'swipe-disabled': !canSwipe(p) }"
        >
          <!-- 左滑显露的快捷动作（仅 draft/rejected） -->
          <view class="card-swipe-actions" v-if="canSwipe(p)">
            <view class="swipe-btn delete" @click.stop="confirmDelete(p)">删除</view>
          </view>

          <view
            class="card-shell"
            @touchstart="onTouchStart($event, p)"
            @touchend="onTouchEnd($event, p)"
            @click="onCardClick(p)"
          >
            <view class="card-body">
              <view class="card-head">
                <text class="post-title">{{ p.title || '（无标题）' }}</text>
                <text class="status-tag" :class="p.status">{{ statusLabel(p.status) }}</text>
              </view>
              <text class="post-body">{{ shortContent(p.content) }}</text>
              <view class="card-foot">
                <text class="meta">{{ p.category }} · {{ modalityLabel(p.modality) }} · {{ formatTime(p.createdAt) }}</text>
                <text v-if="p.status === 'rejected'" class="reject-reason">驳回：{{ p.rejectReason || '不符合社区规范' }}</text>
              </view>
            </view>
            <view
              v-if="canSwipe(p)"
              class="card-more"
              @click.stop="openCardActions(p)"
            >···</view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { safeBack } from '@/utils/nav.js'
import { withAuth, isLoggedIn, ensureLogin } from '@/utils/identity.js'

const MODALITY_LABELS = {
  ct_plain: 'CT平扫', ct_enhance: 'CT增强', cta: 'CTA',
  mri: 'MRI', xray: 'X线', dsa: 'DSA', nm: '核医学', us: '超声'
}

export default {
  data() {
    return {
      loading: true,
      loadError: '',
      posts: [],
      currentTab: 'all',
      tabs: [
        { key: 'all', name: '全部' },
        { key: 'draft', name: '草稿' },
        { key: 'pending', name: '待审' },
        { key: 'approved', name: '已通过' },
        { key: 'rejected', name: '被驳' }
      ],
      searchKeyword: '',
      refreshing: false,
      activeSwipeId: '',
      touchStartX: 0,
      touchStartId: ''
    }
  },
  computed: {
    counts() {
      const out = { all: this.posts.length, draft: 0, pending: 0, approved: 0, rejected: 0 }
      for (const p of this.posts) {
        if (out[p.status] != null) out[p.status]++
      }
      return out
    },
    filteredPosts() {
      const byTab = this.currentTab === 'all' ? this.posts : this.posts.filter(p => p.status === this.currentTab)
      const kw = this.searchKeyword.trim().toLowerCase()
      if (!kw) return byTab
      return byTab.filter(p => {
        const blob = `${p.title || ''} ${p.content || ''} ${(p.tags || []).join(' ')}`.toLowerCase()
        return blob.includes(kw)
      })
    },
    emptyHint() {
      if (this.searchKeyword.trim()) return `没找到匹配「${this.searchKeyword}」的笔记。`
      if (this.currentTab === 'all') return '还没有云端笔记。回经验社区写一条吧。'
      return `当前没有「${this.statusLabel(this.currentTab)}」状态的笔记。`
    }
  },
  onLoad() {
    if (!isLoggedIn()) {
      this.loading = false
      this.loadError = '需要登录一图灵账号才能看云端笔记'
      ensureLogin()
      return
    }
    this.fetch()
  },
  methods: {
    goBack() { safeBack('/pages/account/index') },
    statusLabel(s) {
      return { all: '全部', draft: '草稿', pending: '待审', approved: '已通过', rejected: '被驳' }[s] || s
    },
    modalityLabel(k) { return MODALITY_LABELS[k] || k || '' },
    shortContent(c) {
      if (!c) return ''
      const s = String(c).replace(/\s+/g, ' ').trim()
      return s.length > 80 ? s.slice(0, 80) + '…' : s
    },
    formatTime(ts) {
      if (!ts) return ''
      const d = new Date(ts)
      return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    },
    async fetch() {
      this.loading = true
      this.loadError = ''
      try {
        const res = await uniCloud.callFunction({
          name: 'notes-post',
          data: withAuth({ action: 'list_mine' })
        })
        const r = res && res.result
        if (!r || !r.ok) {
          this.loadError = (r && r.message) || '加载失败'
          return
        }
        this.posts = r.posts || []
      } catch (e) {
        this.loadError = '网络异常：' + (e && e.message || 'unknown')
      } finally {
        this.loading = false
      }
    },
    async onPullRefresh() {
      this.refreshing = true
      await this.fetch()
      this.refreshing = false
    },
    canSwipe(p) {
      return p.status === 'draft' || p.status === 'rejected'
    },
    onTouchStart(e, p) {
      if (!this.canSwipe(p)) return
      this.touchStartX = e.touches[0].clientX
      this.touchStartId = p._id
    },
    onTouchEnd(e, p) {
      if (this.touchStartId !== p._id) return
      const endX = (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : this.touchStartX)
      const deltaX = endX - this.touchStartX
      if (deltaX < -50) {
        this.activeSwipeId = p._id
      } else if (deltaX > 50) {
        this.activeSwipeId = ''
      }
      this.touchStartX = 0
      this.touchStartId = ''
    },
    onCardClick(p) {
      // 滑开状态下点击 → 先收起；正常状态 → 进详情
      if (this.activeSwipeId === p._id) {
        this.activeSwipeId = ''
        return
      }
      // 任何其他 row 处于滑开状态，先收起
      if (this.activeSwipeId) {
        this.activeSwipeId = ''
        return
      }
      this.openDetail(p)
    },
    openDetail(p) {
      uni.setStorageSync('current_case', {
        _cloudPostId: p._id,
        title: p.title,
        content: p.content,
        author: p.ownerName,
        tags: p.tags || [],
        category: p.category,
        modality: p.modality,
        displayModality: this.modalityLabel(p.modality)
      })
      uni.navigateTo({ url: '/pages/notes/detail' })
    },
    openCardActions(p) {
      const isRejected = p.status === 'rejected'
      uni.showActionSheet({
        itemList: [isRejected ? '删除被驳回的笔记' : '删除草稿'],
        itemColor: '#D9342B',
        success: (res) => {
          if (res.tapIndex === 0) this.confirmDelete(p)
        }
      })
    },
    confirmDelete(p) {
      uni.showModal({
        title: '确认删除',
        content: `「${p.title || '（无标题）'}」将被永久删除，无法恢复。`,
        confirmText: '删除',
        confirmColor: '#D9342B',
        success: (res) => {
          if (res.confirm) this.deletePost(p)
        }
      })
    },
    async deletePost(p) {
      uni.showLoading({ title: '删除中...' })
      try {
        const res = await uniCloud.callFunction({
          name: 'notes-post',
          data: withAuth({ action: 'delete_post', postId: p._id })
        })
        uni.hideLoading()
        const r = res && res.result
        if (!r || !r.ok) {
          uni.showModal({ title: '删除失败', content: (r && r.message) || '请稍后重试', showCancel: false })
          return
        }
        // 乐观更新：从本地数组移除
        this.posts = this.posts.filter(x => x._id !== p._id)
        uni.showToast({ title: '已删除', icon: 'success' })
      } catch (e) {
        uni.hideLoading()
        uni.showModal({ title: '网络异常', content: e && e.message || 'unknown', showCancel: false })
      }
    }
  }
}
</script>

<style>
.page { background: #F5F5F7; min-height: 100vh; }
.status-bar { height: var(--status-bar-height); background: #F5F5F7; }
.nav { display: flex; align-items: center; padding: 20rpx 24rpx; gap: 16rpx; }
.back-btn { font-size: 48rpx; color: #1F6FEB; width: 56rpx; }
.refresh-btn { font-size: 36rpx; color: #1F6FEB; width: 56rpx; text-align: right; }
.nav-title { font-size: 32rpx; font-weight: 700; color: #1D1D1F; flex: 1; }

.search-row { padding: 0 24rpx 14rpx; }
.search-box { display: flex; align-items: center; gap: 12rpx; padding: 14rpx 22rpx; background: #fff; border-radius: 18rpx; }
.search-icon { font-size: 28rpx; color: #98A2B3; font-weight: 900; }
.search-input { flex: 1; font-size: 26rpx; color: #1D1D1F; height: 56rpx; }
.search-clear { font-size: 32rpx; color: #98A2B3; padding: 0 8rpx; line-height: 1; }

.tabs { display: flex; padding: 0 24rpx 14rpx; gap: 12rpx; overflow-x: auto; }
.tab { padding: 10rpx 22rpx; border-radius: 999rpx; background: #fff; font-size: 24rpx; color: #6E6E73; white-space: nowrap; }
.tab.active { background: #1F6FEB; color: #fff; font-weight: 700; }
.tab-count { font-size: 20rpx; opacity: 0.85; }

.scroll { padding: 8rpx 24rpx 80rpx; }
.empty { padding: 80rpx 24rpx; text-align: center; color: #86868B; font-size: 28rpx; }
.empty.error { color: #D9342B; }

.card { position: relative; overflow: hidden; border-radius: 20rpx; margin-bottom: 18rpx; background: transparent; }
.card-swipe-actions { position: absolute; top: 0; right: 0; bottom: 0; width: 160rpx; display: flex; align-items: stretch; }
.swipe-btn { flex: 1; display: flex; align-items: center; justify-content: center; font-size: 26rpx; font-weight: 800; color: #fff; }
.swipe-btn.delete { background: #D9342B; }
.card-shell { position: relative; background: #fff; border-radius: 20rpx; padding: 24rpx; display: flex; align-items: flex-start; gap: 12rpx; transition: transform 0.25s cubic-bezier(0.32, 0.72, 0.16, 1); }
.card.swipe-open .card-shell { transform: translateX(-160rpx); }
.card.swipe-disabled .card-shell { /* pending/approved 不响应滑动 */ }
.card-body { flex: 1; min-width: 0; }
.card-more { flex-shrink: 0; padding: 4rpx 16rpx; font-size: 28rpx; color: #98A2B3; font-weight: 900; line-height: 1.2; }
.card-more:active { color: #1D1D1F; }
.card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 14rpx; margin-bottom: 10rpx; }
.post-title { flex: 1; font-size: 28rpx; font-weight: 700; color: #1D1D1F; }
.status-tag { padding: 4rpx 14rpx; border-radius: 999rpx; font-size: 20rpx; font-weight: 700; white-space: nowrap; }
.status-tag.draft { background: #F5F5F7; color: #6E6E73; }
.status-tag.pending { background: #FFF4E5; color: #B26A00; }
.status-tag.approved { background: #E6F4EA; color: #137333; }
.status-tag.rejected { background: #FDE2E1; color: #D9342B; }
.post-body { font-size: 24rpx; color: #505050; line-height: 1.5; display: block; }
.card-foot { display: flex; flex-direction: column; gap: 6rpx; margin-top: 12rpx; }
.meta { font-size: 22rpx; color: #98a2b3; }
.reject-reason { font-size: 22rpx; color: #D9342B; }
</style>
