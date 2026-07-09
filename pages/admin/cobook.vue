<template>
  <view class="page">
    <view class="status-bar"></view>
    <view class="nav">
      <view class="back-btn" @click="goBack">‹</view>
      <text class="nav-title">出书共创素材库</text>
      <view class="refresh-btn" @click="fetch">↻</view>
    </view>

    <view class="filters">
      <scroll-view scroll-x class="filter-strip" :show-scrollbar="false">
        <view class="filter-strip-inner">
          <view
            class="filter-chip"
            v-for="m in modalities"
            :key="m.key"
            :class="{ selected: modality === m.key }"
            @click="setModality(m.key)"
          >{{ m.name }}</view>
        </view>
      </scroll-view>
    </view>

    <scroll-view scroll-y class="scroll" :show-scrollbar="false">
      <view v-if="loading" class="empty">加载中…</view>
      <view v-else-if="loadError" class="empty error">{{ loadError }}</view>
      <view v-else-if="!posts.length" class="empty">当前条件没有授权素材。</view>

      <view v-else>
        <view class="summary">{{ summary }}</view>
        <view class="card" v-for="p in posts" :key="p._id" @click="openDetail(p)">
          <view class="card-head">
            <text class="title">{{ p.title || '（无标题）' }}</text>
            <text class="weight">权重 {{ p.publishWeight || 0 }}</text>
          </view>
          <text class="body">{{ shortContent(p.content) }}</text>
          <view class="meta-row">
            <text class="meta">{{ p.ownerName || '匿名医生' }}</text>
            <text class="meta">{{ modalityLabel(p.modality) }}{{ p.bodyPart && p.bodyPart !== '未标注' ? ' · ' + p.bodyPart : '' }}</text>
            <text class="meta">{{ p.category }}</text>
          </view>
          <view class="tags" v-if="p.tags && p.tags.length">
            <text class="tag" v-for="t in p.tags.slice(0, 6)" :key="t"># {{ t }}</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { safeBack } from '@/utils/nav.js'
import { withAuth, isLoggedIn, ensureLogin } from '@/utils/identity.js'

const MODALITIES = [
  { key: '', name: '全部' },
  { key: 'ct_plain', name: 'CT平扫' },
  { key: 'ct_enhance', name: 'CT增强' },
  { key: 'cta', name: 'CTA' },
  { key: 'mri', name: 'MRI' },
  { key: 'xray', name: 'X线' },
  { key: 'dsa', name: 'DSA' },
  { key: 'nm', name: '核医学' },
  { key: 'us', name: '超声' }
]

export default {
  data() {
    return {
      loading: true,
      loadError: '',
      posts: [],
      modality: '',
      modalities: MODALITIES
    }
  },
  computed: {
    summary() {
      const total = this.posts.length
      const label = this.modality
        ? MODALITIES.find(m => m.key === this.modality)?.name || ''
        : '全部模态'
      return `${label}：${total} 条授权素材`
    }
  },
  onLoad() {
    if (!isLoggedIn()) {
      this.loading = false
      this.loadError = '审核员需登录一图灵账号'
      ensureLogin()
      return
    }
    this.fetch()
  },
  methods: {
    goBack() { safeBack('/pages/admin/review') },
    modalityLabel(k) { return (MODALITIES.find(m => m.key === k) || {}).name || k || '' },
    shortContent(c) {
      if (!c) return ''
      const s = String(c).replace(/\s+/g, ' ').trim()
      return s.length > 100 ? s.slice(0, 100) + '…' : s
    },
    setModality(key) {
      if (this.modality === key) return
      this.modality = key
      this.fetch()
    },
    async fetch() {
      this.loading = true
      this.loadError = ''
      try {
        const res = await uniCloud.callFunction({
          name: 'notes-post',
          data: withAuth({ action: 'list_for_book', modality: this.modality, limit: 100 })
        })
        const r = res && res.result
        if (!r || !r.ok) {
          this.loadError = (r && r.message) || '加载失败（可能你不在 admins 白名单）'
          return
        }
        this.posts = r.posts || []
      } catch (e) {
        this.loadError = '网络异常：' + (e && e.message || 'unknown')
      } finally {
        this.loading = false
      }
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

.filters { padding: 0 16rpx 12rpx; }
.filter-strip-inner { display: flex; gap: 10rpx; padding: 8rpx 8rpx; }
.filter-chip { padding: 10rpx 22rpx; border-radius: 999rpx; background: #fff; font-size: 22rpx; color: #6E6E73; white-space: nowrap; }
.filter-chip.selected { background: #1F6FEB; color: #fff; font-weight: 700; }

.scroll { padding: 4rpx 24rpx 80rpx; }
.empty { padding: 80rpx 24rpx; text-align: center; color: #86868B; font-size: 28rpx; }
.empty.error { color: #D9342B; }
.summary { padding: 12rpx 4rpx 16rpx; font-size: 22rpx; color: #6E6E73; }

.card { background: #fff; border-radius: 20rpx; padding: 22rpx; margin-bottom: 16rpx; }
.card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 14rpx; margin-bottom: 8rpx; }
.title { flex: 1; font-size: 28rpx; font-weight: 800; color: #1D1D1F; }
.weight { padding: 4rpx 12rpx; background: #FFF4E5; color: #B26A00; border-radius: 999rpx; font-size: 20rpx; font-weight: 700; white-space: nowrap; }
.body { font-size: 24rpx; color: #505050; line-height: 1.5; display: block; }
.meta-row { display: flex; flex-wrap: wrap; gap: 16rpx; margin-top: 14rpx; }
.meta { font-size: 22rpx; color: #98a2b3; }
.tags { display: flex; flex-wrap: wrap; gap: 8rpx; margin-top: 12rpx; }
.tag { font-size: 22rpx; color: #1F6FEB; background: #E8F2FF; padding: 4rpx 12rpx; border-radius: 8rpx; }
</style>
