<template>
  <view class="page">
    <view class="status-bar"></view>

    <view class="nav">
      <view class="back-btn" @click="goBack">‹</view>
      <view>
        <text class="nav-title">一图灵知识夹</text>
        <text class="nav-subtitle">收藏资料，随手记录</text>
      </view>
      <view class="help-btn" @click="showHelp">?</view>
    </view>

    <scroll-view scroll-y class="scroll" :show-scrollbar="false">
      <view class="hero-card">
        <text class="hero-label">私人知识库</text>
        <text class="hero-title">拍照、粘贴、保存</text>
        <view class="hero-actions">
          <view class="primary-btn" @click="startAnatomyCapture">拍照标注</view>
          <view class="ghost-btn" @click="detectClipboard">粘贴链接</view>
          <view class="ghost-btn" @click="openAddSheet">新增资料</view>
        </view>
      </view>

      <view class="anatomy-card">
        <view class="anatomy-head">
          <view>
            <text class="anatomy-title">拍照解剖标注</text>
            <text class="anatomy-desc">选择部位和模态，生成检索词和收藏线索。</text>
          </view>
          <view class="mini-action" @click="startAnatomyCapture">{{ anatomyImage ? '换图' : '拍照' }}</view>
        </view>

        <image v-if="anatomyImage" class="anatomy-preview" :src="anatomyImage" mode="aspectFill"></image>

        <view class="picker-block">
          <text class="picker-label">部位</text>
          <scroll-view scroll-x class="mini-scroll" :show-scrollbar="false">
            <view class="mini-row">
              <view
                class="mini-chip"
                v-for="part in anatomyParts"
                :key="part"
                :class="{ active: selectedPart === part }"
                @click="selectedPart = part"
              >
                {{ part }}
              </view>
            </view>
          </scroll-view>
        </view>

        <view class="picker-block">
          <text class="picker-label">模态</text>
          <view class="mini-row wrap">
            <view
              class="mini-chip"
              v-for="modality in modalityOptions"
              :key="modality"
              :class="{ active: selectedModality === modality }"
              @click="selectedModality = modality"
            >
              {{ modality }}
            </view>
          </view>
        </view>

        <view class="recommend-head">
          <text class="recommend-title">{{ selectedPart }}{{ selectedModality }}相关资料</text>
          <text class="recommend-sub">保存线索和笔记</text>
        </view>

        <view class="resource-card" v-for="item in anatomyResources" :key="item.title">
          <view class="resource-top">
            <view class="source-pill web">{{ item.sourceName }}</view>
            <text class="resource-key">{{ item.keyword }}</text>
          </view>
          <text class="resource-title">{{ item.title }}</text>
          <text class="resource-summary">{{ item.summary }}</text>
          <view class="resource-actions">
            <view @click="copySearchKeyword(item)">复制检索词</view>
            <view @click="saveResourceToKnowledge(item)">收藏线索</view>
          </view>
        </view>
      </view>

      <view class="search-card">
        <text class="search-icon">⌕</text>
        <input class="search-input" v-model="searchKey" placeholder="搜：肘关节解剖、手部X线、腰椎CT、胆囊疾病" />
      </view>

      <scroll-view scroll-x class="tag-scroll" :show-scrollbar="false">
        <view class="tag-row">
          <view class="tag" v-for="tag in filterTags" :key="tag" :class="{ active: activeTag === tag }" @click="activeTag = tag">
            {{ tag }}
          </view>
        </view>
      </scroll-view>

      <view class="notice-card">
        <text class="notice-title">保存规则</text>
        <text class="notice-desc">保存链接、摘要、标签和个人笔记。</text>
      </view>

      <view class="section-head">
        <text class="section-title">我的收藏</text>
        <text class="section-count">{{ filteredArticles.length }} 条</text>
      </view>

      <view class="article-card" v-for="item in filteredArticles" :key="item.id" @click="openDetail(item)">
        <view class="article-top">
          <view class="source-pill" :class="item.sourceType">{{ item.sourceName }}</view>
          <text class="date">{{ item.createdAt }}</text>
        </view>
        <image v-if="item.cover" class="article-cover" :src="item.cover" mode="aspectFill"></image>
        <text class="article-title">{{ item.title }}</text>
        <text class="article-summary">{{ item.summary }}</text>
        <view class="tag-list">
          <text v-for="tag in item.tags" :key="tag">#{{ tag }}</text>
        </view>
        <view class="article-footer">
          <text>{{ visibilityText(item.visibility) }} · {{ item.note ? '有个人笔记' : '未写笔记' }}</text>
          <view class="footer-actions">
            <view v-if="item.url" @click.stop="copyLink(item.url)">复制链接</view>
            <view @click.stop="removeArticle(item.id)">删除</view>
          </view>
        </view>
      </view>

      <view class="empty" v-if="filteredArticles.length === 0">
        <text class="empty-title">还没有收藏</text>
        <text class="empty-desc">复制一篇公众号文章链接，或上传一张 X 线/CT 解剖截图，保存成自己的学习卡片。</text>
      </view>

      <view class="bottom-space"></view>
    </scroll-view>

    <view class="sheet-mask" v-if="showAddSheet" @click="closeAddSheet">
      <view class="sheet" @click.stop>
        <view class="sheet-handle"></view>
        <text class="sheet-title">{{ editingId ? '编辑资料' : '保存到知识夹' }}</text>
        <text class="sheet-desc">链接只保存索引和个人笔记；图片默认仅自己可见。公开分享前需确认来源合法。</text>

        <view class="image-picker" @click="pickKnowledgeImage">
          <image v-if="draft.cover" class="picked-image" :src="draft.cover" mode="aspectFill"></image>
          <view v-else class="image-empty">
            <text class="image-plus">＋</text>
            <text>上传截图/解剖图/标注图</text>
          </view>
        </view>

        <view class="field">
          <text class="field-label">原文链接（可选）</text>
          <input class="field-input" v-model="draft.url" placeholder="粘贴公众号/美篇/网页/视频号链接；纯图片资料可不填" @blur="autoFillFromUrl" />
        </view>

        <view class="field">
          <text class="field-label">标题</text>
          <input class="field-input" v-model="draft.title" placeholder="例如：腹痛患者胆囊疾病影像表现整理" />
        </view>

        <view class="field">
          <text class="field-label">摘要</text>
          <textarea class="field-textarea short" v-model="draft.summary" maxlength="220" placeholder="用自己的话概括，不复制大段原文。" />
        </view>

        <view class="field">
          <text class="field-label">标签</text>
          <input class="field-input" v-model="tagText" placeholder="用空格或逗号分隔，如：腹痛 胆囊 CT 超声" />
        </view>

        <view class="field">
          <text class="field-label">我的笔记</text>
          <textarea class="field-textarea" v-model="draft.note" maxlength="500" placeholder="写你的临床学习笔记、适用场景、待验证问题。" />
        </view>

        <view class="field">
          <text class="field-label">可见范围</text>
          <view class="visibility-row">
            <view
              class="visibility-chip"
              v-for="item in visibilityOptions"
              :key="item.key"
              :class="{ active: draft.visibility === item.key }"
              @click="draft.visibility = item.key"
            >
              {{ item.name }}
            </view>
          </view>
        </view>

        <view class="check-row" :class="{ active: draft.sourceConfirmed }" @click="draft.sourceConfirmed = !draft.sourceConfirmed">
          <view class="check-box">{{ draft.sourceConfirmed ? '✓' : '' }}</view>
          <text>我确认资料来源合法；如公开到社区，仅发布自己的笔记、摘要或已授权内容</text>
        </view>

        <view class="sheet-actions">
          <view class="sheet-sub" @click="closeAddSheet">取消</view>
          <view class="sheet-sub" @click="aiOrganizeDraft">整理建议</view>
          <view class="sheet-main" :class="{ disabled: !canSave }" @click="saveArticle">保存</view>
        </view>
      </view>
    </view>

    <view class="sheet-mask" v-if="detailArticle" @click="detailArticle = null">
      <view class="sheet detail-sheet" @click.stop>
        <view class="sheet-handle"></view>
        <view class="detail-head">
          <view class="source-pill" :class="detailArticle.sourceType">{{ detailArticle.sourceName }}</view>
          <text class="date">{{ detailArticle.createdAt }}</text>
        </view>
        <image v-if="detailArticle.cover" class="detail-cover" :src="detailArticle.cover" mode="widthFix"></image>
        <text class="detail-title">{{ detailArticle.title }}</text>
        <text class="detail-summary">{{ detailArticle.summary }}</text>

        <view class="detail-block">
          <text class="detail-label">我的笔记</text>
          <text class="detail-text">{{ detailArticle.note || '还没有写笔记。' }}</text>
        </view>

        <view class="tag-list detail-tags">
          <text v-for="tag in detailArticle.tags" :key="tag">#{{ tag }}</text>
        </view>

        <view class="sheet-actions">
          <view class="sheet-sub" @click="editArticle(detailArticle)">编辑</view>
          <view class="sheet-sub" @click="createPublishDraft(detailArticle)">分享草稿</view>
          <view class="sheet-main" v-if="detailArticle.url" @click="copyLink(detailArticle.url)">复制原文链接</view>
        </view>
      </view>
    </view>

    <app-tab-bar active="knowledge" />
  </view>
</template>

<script>
import { safeBack } from '@/utils/nav.js'
import AppTabBar from '@/components/app-tab-bar/app-tab-bar.vue'

export default {
  components: { AppTabBar },
  data() {
    return {
      searchKey: '',
      activeTag: '全部',
      anatomyImage: '',
      selectedPart: '肘关节',
      selectedModality: 'X线',
      showAddSheet: false,
      editingId: null,
      detailArticle: null,
      tagText: '',
      draft: this.emptyDraft(),
      visibilityOptions: [
        { key: 'private', name: '仅自己' },
        { key: 'friends', name: '指定好友' },
        { key: 'department', name: '本科室' },
        { key: 'public_review', name: '公开分享' }
      ],
      anatomyParts: ['肘关节', '手部', '腕关节', '尺桡骨', '肩关节', '膝关节', '腰椎', '胸部', '腹部', '胆囊'],
      modalityOptions: ['X线', 'CT', 'MRI', '超声', '报告模板'],
      articles: []
    }
  },
  computed: {
    filterTags() {
      const tags = ['全部', '手部', '腕关节', '尺桡骨', 'X线解剖', 'CT解剖', '医保收费', '待精读']
      const savedTags = []
      this.articles.forEach(item => {
        item.tags.forEach(tag => {
          if (!savedTags.includes(tag)) savedTags.push(tag)
        })
      })
      return Array.from(new Set(tags.concat(savedTags)))
    },
    filteredArticles() {
      const key = this.searchKey.trim()
      return this.articles.filter(item => {
        const text = `${item.title}${item.summary}${item.note}${item.tags.join('')}${item.sourceName}`
        const matchKey = !key || text.includes(key)
        const matchTag = this.activeTag === '全部' || item.tags.includes(this.activeTag)
        return matchKey && matchTag
      })
    },
    canSave() {
      return (this.draft.url.trim() || this.draft.cover) && this.draft.title.trim() && this.draft.sourceConfirmed
    },
    anatomyResources() {
      const part = this.selectedPart
      const modality = this.selectedModality
      const baseKeyword = `${part} ${modality} 解剖`
      return [
        {
          title: `${part}${modality}解剖图谱收藏线索`,
          sourceName: '公众号/网页',
          keyword: `${baseKeyword} 影像解剖`,
          summary: `适合查找${part}${modality}正常解剖、常见投照或层面标志。建议收藏原文链接，并用自己的话补充重点。`,
          tags: [part, modality, '影像解剖']
        },
        {
          title: `${part}${modality}常用报告表达`,
          sourceName: '报告模板',
          keyword: `${part} ${modality} 报告模板 正常表现`,
          summary: `用于沉淀自己的报告句式，例如正常结构、关节间隙、骨皮质、软组织等表达，不自动生成医疗判断。`,
          tags: [part, modality, '报告模板']
        },
        {
          title: `${part}常见易混结构学习笔记`,
          sourceName: '学习笔记',
          keyword: `${part} 易误诊 解剖 影像`,
          summary: `适合整理骨骺、籽骨、韧带附着点、正常变异等易混内容。公开分享前需确认图片来源合法。`,
          tags: [part, '易混结构', '待精读']
        }
      ]
    }
  },
  onLoad() {
    this.loadArticles()
  },
  methods: {
    emptyDraft() {
      return {
        url: '',
        title: '',
        summary: '',
        note: '',
        cover: '',
        sourceType: 'web',
        sourceName: '网页',
        visibility: 'private',
        sourceConfirmed: false
      }
    },
    goBack() {
      safeBack('/pages/index/index')
    },
    showHelp() {
      uni.showModal({
        title: '为什么只保存链接和笔记',
        content: '公众号、视频号和其他平台内容有版权与平台规则限制。一图灵适合做私人收藏、链接索引和个人笔记。',
        showCancel: false
      })
    },
    loadArticles() {
      const saved = uni.getStorageSync('ytl_knowledge_articles')
      this.articles = saved && saved.length ? saved : []
    },
    persist() {
      uni.setStorageSync('ytl_knowledge_articles', this.articles)
    },
    detectClipboard() {
      uni.getClipboardData({
        success: (res) => {
          const data = (res.data || '').trim()
          if (!this.isUrl(data)) {
            uni.showToast({ title: '剪贴板里没有链接', icon: 'none' })
            return
          }
          this.openAddSheet()
          this.draft.url = data
          this.autoFillFromUrl()
        },
        fail: () => {
          uni.showToast({ title: '无法读取剪贴板', icon: 'none' })
        }
      })
    },
    startAnatomyCapture() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          this.anatomyImage = res.tempFilePaths[0]
          this.searchKey = `${this.selectedPart} ${this.selectedModality} 解剖`
          uni.showToast({ title: '已生成资料线索', icon: 'success' })
        },
        fail: () => uni.showToast({ title: '未选择图片', icon: 'none' })
      })
    },
    openAddSheet() {
      this.editingId = null
      this.detailArticle = null
      this.draft = this.emptyDraft()
      this.tagText = ''
      this.showAddSheet = true
    },
    closeAddSheet() {
      this.showAddSheet = false
      this.editingId = null
    },
    isUrl(text) {
      return /^https?:\/\//i.test(text)
    },
    autoFillFromUrl() {
      const url = this.draft.url.trim()
      if (!url) return
      const source = this.detectSource(url)
      this.draft.sourceType = source.type
      this.draft.sourceName = source.name
      if (!this.draft.title) {
        this.draft.title = `${source.name}收藏：待整理的医学影像资料`
      }
      if (!this.draft.summary) {
        this.draft.summary = '已保存原文链接。请用自己的话补充摘要，避免复制大段原文。'
      }
      if (!this.tagText) {
        this.tagText = '待精读'
      }
    },
    detectSource(url) {
      if (url.includes('mp.weixin.qq.com')) return { type: 'wechat', name: '公众号' }
      if (url.includes('weixin.qq.com') || url.includes('channels')) return { type: 'video', name: '视频号' }
      if (url.includes('meipian.cn')) return { type: 'meipian', name: '美篇' }
      return { type: 'web', name: '网页' }
    },
    pickKnowledgeImage() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          this.draft.cover = res.tempFilePaths[0]
          this.draft.sourceType = 'image'
          this.draft.sourceName = '图片'
          if (!this.draft.title) this.draft.title = '待整理的医学影像学习图片'
          if (!this.tagText) this.tagText = '待精读'
        },
        fail: () => uni.showToast({ title: '未选择图片', icon: 'none' })
      })
    },
    aiOrganizeDraft() {
      const tags = this.parseTags()
      if (!this.draft.title) {
        this.draft.title = this.draft.cover ? '医学影像图片学习卡' : `${this.draft.sourceName}资料学习卡`
      }
      if (!this.draft.summary) {
        this.draft.summary = 'AI整理建议：请用自己的话概括资料重点，避免复制第三方全文。'
      }
      if (!tags.length) {
        this.tagText = this.draft.cover ? '影像解剖 待精读' : '待精读'
      }
      uni.showToast({ title: '已生成整理建议', icon: 'success' })
    },
    parseTags() {
      return this.tagText
        .split(/[\s,，、]+/)
        .map(tag => tag.trim())
        .filter(Boolean)
        .slice(0, 8)
    },
    saveArticle() {
      if (!this.canSave) {
        uni.showToast({ title: '请填写标题、资料来源并确认来源合法', icon: 'none' })
        return
      }

      const payload = {
        id: this.editingId || Date.now(),
        url: this.draft.url.trim(),
        title: this.draft.title.trim(),
        summary: this.draft.summary.trim() || '用户保存的外部资料链接。',
        note: this.draft.note.trim(),
        cover: this.draft.cover,
        tags: this.parseTags().length ? this.parseTags() : ['待精读'],
        sourceType: this.draft.sourceType,
        sourceName: this.draft.sourceName,
        visibility: this.draft.visibility,
        sourceConfirmed: true,
        createdAt: this.todayText()
      }

      if (this.editingId) {
        this.articles = this.articles.map(item => item.id === this.editingId ? payload : item)
      } else {
        this.articles.unshift(payload)
      }

      this.persist()
      this.closeAddSheet()
      uni.showToast({ title: '已保存到知识夹', icon: 'success' })
    },
    todayText() {
      const d = new Date()
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    },
    openDetail(item) {
      this.detailArticle = item
    },
    editArticle(item) {
      this.detailArticle = null
      this.editingId = item.id
      this.draft = {
        url: item.url,
        title: item.title,
        summary: item.summary,
        note: item.note,
        cover: item.cover || '',
        sourceType: item.sourceType,
        sourceName: item.sourceName,
        visibility: item.visibility || 'private',
        sourceConfirmed: item.sourceConfirmed === true
      }
      this.tagText = item.tags.join(' ')
      this.showAddSheet = true
    },
    copyLink(url) {
      if (!url) return
      uni.setClipboardData({
        data: url,
        success: () => uni.showToast({ title: '链接已复制', icon: 'success' })
      })
    },
    copySearchKeyword(item) {
      uni.setClipboardData({
        data: item.keyword,
        success: () => uni.showToast({ title: '检索词已复制', icon: 'success' })
      })
    },
    saveResourceToKnowledge(item) {
      const article = {
        id: Date.now(),
        url: '',
        title: item.title,
        summary: item.summary,
        note: `检索词：${item.keyword}\n可补充：原文链接、截图、自己的解剖标注和报告表达。`,
        cover: this.anatomyImage,
        tags: item.tags,
        sourceType: 'web',
        sourceName: item.sourceName,
        visibility: 'private',
        sourceConfirmed: true,
        createdAt: this.todayText()
      }
      this.articles.unshift(article)
      this.persist()
      this.activeTag = item.tags[0]
      uni.showToast({ title: '已收藏到知识夹', icon: 'success' })
    },
    visibilityText(key) {
      const map = {
        private: '仅自己可见',
        friends: '指定好友可见',
        department: '本科室可见',
        public_review: '准备公开分享'
      }
      return map[key] || '仅自己可见'
    },
    createPublishDraft(item) {
      if ((item.visibility || 'private') !== 'public_review') {
        uni.showModal({
          title: '先改为公开分享',
          content: '公开前请在编辑页把可见范围改为“公开分享”，并确认来源合法、无个人隐私。',
          showCancel: false
        })
        return
      }
      const list = uni.getStorageSync('ytl_cocreate_drafts') || []
      list.unshift({
        id: Date.now(),
        title: item.title,
        content: item.note || item.summary,
        category: '实战经验',
        deidentified: true,
        authorized: false,
        status: 'draft',
        note: '公开前需确认来源合法与隐私安全',
        createdAt: new Date().toISOString()
      })
      uni.setStorageSync('ytl_cocreate_drafts', list)
      this.detailArticle = null
      uni.showModal({
        title: '已生成分享草稿',
        content: '草稿已保存。公开展示前需完成来源与隐私确认。',
        showCancel: false
      })
    },
    removeArticle(id) {
      uni.showModal({
        title: '删除收藏',
        content: '只会删除一图灵里的收藏记录，不影响原文。',
        confirmText: '删除',
        confirmColor: '#d92d20',
        success: (res) => {
          if (!res.confirm) return
          this.articles = this.articles.filter(item => item.id !== id)
          this.persist()
        }
      })
    }
  }
}
</script>

<style>
view,
text,
scroll-view,
input,
textarea {
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif;
}

.page {
  min-height: 100vh;
  background: #f5f7fb;
  color: #111827;
}

.status-bar {
  height: 88rpx;
}

.nav {
  min-height: 104rpx;
  padding: 0 32rpx 12rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.back-btn,
.help-btn {
  width: 66rpx;
  height: 66rpx;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  flex-shrink: 0;
}

.back-btn {
  font-size: 56rpx;
  padding-bottom: 8rpx;
}

.help-btn {
  font-size: 30rpx;
}

.nav-title,
.nav-subtitle {
  display: block;
  text-align: center;
}

.nav-title {
  font-size: 32rpx;
  font-weight: 900;
}

.nav-subtitle {
  margin-top: 4rpx;
  color: #667085;
  font-size: 20rpx;
  line-height: 1.35;
  font-weight: 700;
}

.scroll {
  height: calc(100vh - 192rpx);
  padding: 0 32rpx;
}

.hero-card,
.anatomy-card,
.search-card,
.notice-card,
.article-card,
.resource-card,
.empty {
  background: #fff;
  border-radius: 26rpx;
  box-shadow: 0 14rpx 36rpx rgba(17, 24, 39, 0.05);
}

.hero-card {
  padding: 34rpx;
}

.hero-label {
  display: block;
  color: #0f766e;
  font-size: 22rpx;
  font-weight: 900;
}

.hero-title {
  display: block;
  margin-top: 12rpx;
  font-size: 42rpx;
  line-height: 1.18;
  font-weight: 900;
}

.hero-desc {
  display: block;
  margin-top: 16rpx;
  color: #667085;
  font-size: 25rpx;
  line-height: 1.55;
  font-weight: 650;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;
  margin-top: 28rpx;
}

.primary-btn,
.ghost-btn {
  flex: 1;
  height: 78rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  font-weight: 900;
}

.primary-btn {
  background: #1677ff;
  color: #fff;
}

.ghost-btn {
  background: #ecfdf3;
  color: #067647;
}

.anatomy-card {
  margin-top: 24rpx;
  padding: 28rpx;
}

.anatomy-head,
.recommend-head,
.resource-top,
.resource-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.anatomy-title {
  display: block;
  color: #111827;
  font-size: 32rpx;
  font-weight: 900;
}

.anatomy-desc {
  display: block;
  margin-top: 8rpx;
  color: #667085;
  font-size: 23rpx;
  line-height: 1.45;
  font-weight: 650;
}

.mini-action {
  flex-shrink: 0;
  padding: 16rpx 22rpx;
  border-radius: 999rpx;
  background: #1677ff;
  color: #fff;
  font-size: 23rpx;
  font-weight: 900;
}

.anatomy-preview {
  width: 100%;
  height: 230rpx;
  margin-top: 22rpx;
  border-radius: 20rpx;
  background: #f2f4f7;
}

.picker-block {
  margin-top: 22rpx;
}

.picker-label {
  display: block;
  margin-bottom: 12rpx;
  color: #344054;
  font-size: 23rpx;
  font-weight: 900;
}

.mini-scroll {
  white-space: nowrap;
}

.mini-row {
  display: flex;
  gap: 12rpx;
}

.mini-row.wrap {
  flex-wrap: wrap;
}

.mini-chip {
  padding: 13rpx 20rpx;
  border-radius: 999rpx;
  background: #f2f4f7;
  color: #475467;
  font-size: 23rpx;
  font-weight: 850;
}

.mini-chip.active {
  background: #111827;
  color: #fff;
}

.recommend-head {
  margin-top: 28rpx;
  padding-top: 22rpx;
  border-top: 1rpx solid #eef2f6;
  align-items: flex-end;
}

.recommend-title {
  color: #111827;
  font-size: 28rpx;
  font-weight: 900;
}

.recommend-sub {
  color: #98a2b3;
  font-size: 20rpx;
  font-weight: 800;
  text-align: right;
}

.resource-card {
  margin-top: 16rpx;
  padding: 22rpx;
  box-shadow: none;
  border: 1rpx solid #eef2f6;
}

.resource-key {
  color: #1677ff;
  font-size: 21rpx;
  font-weight: 900;
  text-align: right;
}

.resource-title {
  display: block;
  margin-top: 14rpx;
  color: #111827;
  font-size: 27rpx;
  line-height: 1.35;
  font-weight: 900;
}

.resource-summary {
  display: block;
  margin-top: 8rpx;
  color: #667085;
  font-size: 23rpx;
  line-height: 1.5;
  font-weight: 650;
}

.resource-actions {
  justify-content: flex-start;
  margin-top: 18rpx;
}

.resource-actions view {
  padding: 12rpx 18rpx;
  border-radius: 999rpx;
  background: #eff6ff;
  color: #1677ff;
  font-size: 22rpx;
  font-weight: 900;
}

.search-card {
  height: 84rpx;
  margin-top: 24rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.search-icon {
  color: #667085;
  font-size: 34rpx;
  font-weight: 900;
}

.search-input {
  flex: 1;
  color: #111827;
  font-size: 26rpx;
  font-weight: 650;
}

.tag-scroll {
  height: 78rpx;
  white-space: nowrap;
  margin: 18rpx -32rpx 0;
}

.tag-row {
  padding: 0 32rpx;
  display: flex;
  gap: 14rpx;
}

.tag {
  padding: 14rpx 24rpx;
  border-radius: 999rpx;
  background: #e8edf5;
  color: #475467;
  font-size: 24rpx;
  font-weight: 800;
}

.tag.active {
  background: #111827;
  color: #fff;
}

.notice-card {
  margin: 4rpx 0 26rpx;
  padding: 24rpx;
  background: #fffbeb;
  border: 1rpx solid #fedf89;
}

.notice-title {
  display: block;
  color: #b54708;
  font-size: 25rpx;
  font-weight: 900;
}

.notice-desc {
  display: block;
  margin-top: 8rpx;
  color: #92400e;
  font-size: 22rpx;
  line-height: 1.5;
  font-weight: 650;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 31rpx;
  font-weight: 900;
}

.section-count {
  color: #667085;
  font-size: 22rpx;
  font-weight: 800;
}

.article-card {
  padding: 28rpx;
  margin-bottom: 22rpx;
}

.article-top,
.article-footer,
.footer-actions,
.detail-head {
  display: flex;
  align-items: center;
}

.article-top,
.article-footer,
.detail-head {
  justify-content: space-between;
  gap: 18rpx;
}

.source-pill {
  padding: 8rpx 14rpx;
  border-radius: 10rpx;
  font-size: 20rpx;
  font-weight: 900;
}

.source-pill.wechat {
  background: #dcfae6;
  color: #067647;
}

.source-pill.meipian {
  background: #fef0c7;
  color: #b54708;
}

.source-pill.video {
  background: #e0e7ff;
  color: #3730a3;
}

.source-pill.web {
  background: #eaf2ff;
  color: #1677ff;
}

.source-pill.image {
  background: #f3e8ff;
  color: #7e22ce;
}

.date {
  color: #98a2b3;
  font-size: 20rpx;
  font-weight: 800;
}

.article-cover {
  width: 100%;
  height: 220rpx;
  margin-top: 18rpx;
  border-radius: 18rpx;
  background: #f2f4f7;
}

.article-title {
  display: block;
  margin-top: 18rpx;
  color: #111827;
  font-size: 32rpx;
  line-height: 1.35;
  font-weight: 900;
}

.article-summary,
.detail-summary {
  display: block;
  margin-top: 12rpx;
  color: #667085;
  font-size: 24rpx;
  line-height: 1.55;
  font-weight: 650;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 18rpx;
}

.tag-list text {
  padding: 7rpx 12rpx;
  border-radius: 8rpx;
  background: #f2f4f7;
  color: #475467;
  font-size: 20rpx;
  font-weight: 800;
}

.article-footer {
  margin-top: 22rpx;
  padding-top: 18rpx;
  border-top: 1rpx solid #f2f4f7;
}

.article-footer text {
  color: #98a2b3;
  font-size: 21rpx;
  font-weight: 800;
}

.footer-actions {
  gap: 18rpx;
}

.footer-actions view {
  color: #1677ff;
  font-size: 22rpx;
  font-weight: 900;
}

.empty {
  padding: 54rpx 34rpx;
  text-align: center;
}

.empty-title {
  display: block;
  font-size: 30rpx;
  font-weight: 900;
}

.empty-desc {
  display: block;
  margin-top: 10rpx;
  color: #667085;
  font-size: 24rpx;
  line-height: 1.5;
  font-weight: 650;
}

.sheet-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: flex-end;
}

.sheet {
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 36rpx 36rpx 0 0;
  padding: 20rpx 34rpx 52rpx;
}

.sheet-handle {
  width: 76rpx;
  height: 8rpx;
  border-radius: 999rpx;
  background: #d0d5dd;
  margin: 0 auto 30rpx;
}

.sheet-title {
  display: block;
  font-size: 38rpx;
  color: #111827;
  font-weight: 900;
}

.sheet-desc {
  display: block;
  margin-top: 12rpx;
  color: #667085;
  font-size: 24rpx;
  line-height: 1.5;
  font-weight: 650;
}

.image-picker {
  margin-top: 24rpx;
  height: 210rpx;
  border-radius: 22rpx;
  overflow: hidden;
  background: #f5f7fb;
  border: 2rpx dashed #cbd5e1;
}

.picked-image {
  width: 100%;
  height: 100%;
}

.image-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #475467;
  font-size: 24rpx;
  font-weight: 800;
}

.image-plus {
  font-size: 48rpx;
  line-height: 1;
  color: #1677ff;
  margin-bottom: 8rpx;
}

.field {
  margin-top: 24rpx;
}

.field-label {
  display: block;
  margin-bottom: 12rpx;
  color: #111827;
  font-size: 25rpx;
  font-weight: 900;
}

.field-input,
.field-textarea {
  width: 100%;
  border-radius: 18rpx;
  background: #f5f7fb;
  padding: 22rpx;
  color: #111827;
  font-size: 26rpx;
  font-weight: 650;
}

.field-input {
  height: 82rpx;
}

.field-textarea {
  min-height: 180rpx;
  line-height: 1.5;
}

.field-textarea.short {
  min-height: 128rpx;
}

.visibility-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
}

.visibility-chip {
  padding: 14rpx 20rpx;
  border-radius: 999rpx;
  background: #f2f4f7;
  color: #475467;
  font-size: 23rpx;
  font-weight: 900;
}

.visibility-chip.active {
  background: #111827;
  color: #fff;
}

.check-row {
  margin-top: 20rpx;
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 20rpx;
  border-radius: 18rpx;
  background: #f8fafc;
  border: 2rpx solid transparent;
}

.check-row.active {
  border-color: rgba(52, 199, 89, 0.4);
  background: #ecfdf3;
}

.check-box {
  flex-shrink: 0;
  width: 38rpx;
  height: 38rpx;
  border-radius: 10rpx;
  background: #fff;
  border: 2rpx solid #d0d5dd;
  color: #12b76a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 900;
}

.check-row text {
  flex: 1;
  color: #344054;
  font-size: 23rpx;
  line-height: 1.45;
  font-weight: 750;
}

.sheet-actions {
  display: flex;
  gap: 18rpx;
  margin-top: 28rpx;
}

.sheet-sub,
.sheet-main {
  flex: 1;
  height: 84rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  font-weight: 900;
}

.sheet-sub {
  background: #f2f4f7;
  color: #111827;
}

.sheet-main {
  background: #1677ff;
  color: #fff;
}

.sheet-main.disabled {
  opacity: 0.45;
}

.detail-title {
  display: block;
  margin-top: 22rpx;
  color: #111827;
  font-size: 36rpx;
  line-height: 1.32;
  font-weight: 900;
}

.detail-cover {
  width: 100%;
  margin-top: 22rpx;
  border-radius: 22rpx;
  background: #f2f4f7;
}

.detail-block {
  margin-top: 24rpx;
  padding: 22rpx;
  border-radius: 18rpx;
  background: #f8fafc;
}

.detail-label {
  display: block;
  color: #475467;
  font-size: 22rpx;
  font-weight: 900;
}

.detail-text {
  display: block;
  margin-top: 8rpx;
  color: #111827;
  font-size: 25rpx;
  line-height: 1.55;
  font-weight: 650;
}

.detail-tags {
  margin-top: 22rpx;
}

.bottom-space {
  height: 250rpx;
}
</style>
