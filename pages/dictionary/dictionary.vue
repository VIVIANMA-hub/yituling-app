<template>
  <view class="page">
    <view class="status-bar"></view>

    <view class="nav">
      <view class="back-btn" @click="goBack">‹</view>
      <view>
        <text class="nav-title">地区影像资料库</text>
        <text class="nav-subtitle">收费规则 · 扫描范围 · 体位标准</text>
      </view>
      <view class="nav-placeholder"></view>
    </view>

    <view class="search-card">
      <text class="search-icon">⌕</text>
      <input class="search-input" v-model="searchKey" placeholder="搜：上下腹部、左下肢CT、胸部DR、体位" />
    </view>

    <scroll-view scroll-x class="tabs" :show-scrollbar="false">
      <view class="tab-inner">
        <view class="tab" v-for="(tab, index) in tabs" :key="tab" :class="{ active: activeTab === index }" @click="activeTab = index">
          {{ tab }}
        </view>
      </view>
    </scroll-view>

    <!-- 高级筛选条 -->
    <view class="adv-filter">
      <view class="adv-row">
        <text class="adv-label">风险</text>
        <view
          class="adv-chip"
          v-for="r in riskFilters"
          :key="r.key"
          :class="{ selected: filterRisk === r.key }"
          @click="filterRisk = r.key"
        >{{ r.name }}</view>
      </view>
      <view class="adv-row">
        <view
          class="adv-chip"
          :class="{ selected: showStarredOnly }"
          @click="showStarredOnly = !showStarredOnly"
        >★ 仅收藏</view>
        <view class="adv-spacer"></view>
        <view class="adv-chip export" @click="exportCsv">⬇ 导出 CSV{{ isProUser ? '' : '（Pro）' }}</view>
      </view>
    </view>

    <scroll-view scroll-y class="content" :show-scrollbar="false">
      <view class="alert-card">
        <text class="alert-title">使用说明</text>
        <text class="alert-desc">资料库用于整理公开政策、院内经验与基层操作要点。收费项目以当地医保局和医院财务口径为准，平台只做资料整理和提醒。</text>
      </view>

      <view class="dict-card" v-for="item in filteredList" :key="item.id">
        <view class="card-head">
          <view>
            <text class="risk-tag" :class="item.risk">{{ item.riskText }}</text>
            <text class="region">{{ item.region }} · {{ item.updatedAt }}</text>
          </view>
          <view class="collect" :class="{ active: item.starred }" @click.stop="toggleStar(item.id)">
            {{ item.starred ? '★' : '☆' }}
          </view>
        </view>

        <text class="title">{{ item.title }}</text>
        <text class="summary">{{ item.summary }}</text>

        <view class="info-grid">
          <view class="info-box">
            <text class="info-label">收费拆解</text>
            <text class="info-value">{{ item.billing }}</text>
          </view>
          <view class="info-box">
            <text class="info-label">扫描范围</text>
            <text class="info-value">{{ item.scanRange }}</text>
          </view>
        </view>

        <view class="standard-block">
          <text class="standard-title">体位/操作标准</text>
          <text class="standard-text">{{ item.position }}</text>
        </view>

        <view class="avoid-block">
          <text class="avoid-title">注意事项</text>
          <text class="avoid-text">{{ item.warning }}</text>
        </view>

        <view class="footer-row">
          <text>来源：{{ item.source }}</text>
          <view class="copy-btn" @click.stop="copyItem(item)">复制要点</view>
        </view>
      </view>

      <view class="empty" v-if="filteredList.length === 0">
        <text class="empty-title">没有找到相关条目</text>
        <text class="empty-desc">先记录基层高频问题：收费拆解、扫描范围、体位摆放和地区规则差异。</text>
      </view>

      <view class="bottom-space"></view>
    </scroll-view>
  </view>
</template>

<script>
import { safeBack } from '@/utils/nav.js'

export default {
  data() {
    return {
      searchKey: '',
      activeTab: 0,
      filterRisk: 'all',
      showStarredOnly: false,
      riskFilters: [
        { key: 'all', name: '全部' },
        { key: 'high', name: '高风险' },
        { key: 'medium', name: '中等' },
        { key: 'low', name: '低风险' }
      ],
      tabs: ['收费规则', '体位标准', '扫描范围', '最新更新'],
      dictList: [
              {
                      "id": 1,
                      "category": "收费规则",
                      "risk": "low",
                      "riskText": "演示数据",
                      "title": "示例词条：收费口径核对流程（公开演示数据）",
                      "summary": "本条为公开演示数据，不含真实词库内容。完整词库随 App 云端下发。",
                      "billing": "以当地医保局最新目录和医院财务口径为准。",
                      "scanRange": "以医嘱和临床问题为准，示例数据不提供具体范围。",
                      "position": "以科室操作规范为准，示例数据不提供具体标准。",
                      "warning": "演示条目，仅用于展示界面结构。",
                      "region": "演示",
                      "source": "公开演示数据",
                      "updatedAt": "2026-05",
                      "starred": true
              },
              {
                      "id": 2,
                      "category": "体位标准",
                      "risk": "low",
                      "riskText": "演示数据",
                      "title": "示例词条：体位摆放要点（公开演示数据）",
                      "summary": "本条为公开演示数据，展示词条卡片的字段结构。",
                      "billing": "——",
                      "scanRange": "——",
                      "position": "以科室操作规范与教材标准为准。",
                      "warning": "演示条目，仅用于展示界面结构。",
                      "region": "演示",
                      "source": "公开演示数据",
                      "updatedAt": "2026-05",
                      "starred": false
              },
              {
                      "id": 3,
                      "category": "扫描范围",
                      "risk": "low",
                      "riskText": "演示数据",
                      "title": "示例词条：扫描范围核对（公开演示数据）",
                      "summary": "本条为公开演示数据，完整内容请在 App 内查看。",
                      "billing": "——",
                      "scanRange": "以医嘱、临床问题和当地质控要求为准。",
                      "position": "——",
                      "warning": "演示条目，仅用于展示界面结构。",
                      "region": "演示",
                      "source": "公开演示数据",
                      "updatedAt": "2026-05",
                      "starred": false
              }
      ]
    }
  },
  computed: {
    activeCategory() {
      return this.tabs[this.activeTab]
    },
    isProUser() {
      try { return !!uni.getStorageSync('ytl_is_vip') } catch (e) { return false }
    },
    filteredList() {
      const key = this.searchKey.trim()
      return this.dictList.filter(item => {
        const matchTab = this.activeCategory === '最新更新' ? item.updatedAt === '2026-05' : item.category === this.activeCategory
        const text = `${item.title}${item.summary}${item.billing}${item.scanRange}${item.position}${item.warning}`
        const matchKey = !key || text.includes(key)
        const matchRisk = this.filterRisk === 'all' || item.risk === this.filterRisk
        const matchStar = !this.showStarredOnly || item.starred
        return matchTab && matchKey && matchRisk && matchStar
      })
    }
  },
  methods: {
    goBack() {
      safeBack('/pages/index/index')
    },
    toggleStar(id) {
      const item = this.dictList.find(row => row.id === id)
      if (!item) return
      item.starred = !item.starred
      try {
        if (typeof uni.vibrateShort === 'function') uni.vibrateShort()
      } catch (e) {}
    },
    copyItem(item) {
      const text = `${item.title}\n收费拆解：${item.billing}\n扫描范围：${item.scanRange}\n体位标准：${item.position}\n避坑提醒：${item.warning}`
      uni.setClipboardData({
        data: text,
        success: () => uni.showToast({ title: '要点已复制', icon: 'success' })
      })
    },
    exportCsv() {
      if (!this.isProUser) {
        uni.showModal({
          title: 'Pro 专属功能',
          content: '词典批量导出 CSV 是 Pro 会员专属。普通用户可对单条点"复制要点"。',
          confirmText: '了解 Pro',
          cancelText: '稍后',
          success: r => { if (r.confirm) uni.navigateTo({ url: '/pages/vip/vip' }) }
        })
        return
      }
      const list = this.filteredList
      if (!list.length) {
        uni.showToast({ title: '当前无可导出条目', icon: 'none' })
        return
      }
      const escape = s => {
        const v = String(s == null ? '' : s)
        if (/[",\n]/.test(v)) return '"' + v.replace(/"/g, '""') + '"'
        return v
      }
      const headers = ['类别', '风险', '标题', '摘要', '收费拆解', '扫描范围', '体位标准', '注意事项', '地区', '来源', '更新']
      const lines = [headers.join(',')]
      for (const it of list) {
        lines.push([it.category, it.riskText, it.title, it.summary, it.billing, it.scanRange, it.position, it.warning, it.region, it.source, it.updatedAt].map(escape).join(','))
      }
      const csv = '﻿' + lines.join('\n')
      uni.setClipboardData({
        data: csv,
        success: () => uni.showModal({
          title: `已复制 ${list.length} 条`,
          content: 'CSV 已复制到剪贴板，粘贴到 Excel/WPS/飞书表格即可。',
          showCancel: false
        })
      })
    }
  }
}
</script>

<style>
view,
text,
scroll-view,
input {
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
  height: 96rpx;
  padding: 0 32rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-btn,
.nav-placeholder {
  width: 66rpx;
  height: 66rpx;
}

.back-btn {
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 56rpx;
  padding-bottom: 8rpx;
  font-weight: 900;
}

.nav-title {
  display: block;
  text-align: center;
  font-size: 32rpx;
  font-weight: 900;
}

.nav-subtitle {
  display: block;
  margin-top: 4rpx;
  text-align: center;
  color: #667085;
  font-size: 21rpx;
  font-weight: 700;
}

.search-card {
  margin: 12rpx 32rpx 18rpx;
  height: 84rpx;
  border-radius: 22rpx;
  background: #fff;
  display: flex;
  align-items: center;
  padding: 0 26rpx;
  gap: 14rpx;
  box-shadow: 0 12rpx 30rpx rgba(17, 24, 39, 0.04);
}

.search-icon {
  font-size: 34rpx;
  color: #667085;
  font-weight: 900;
}

.search-input {
  flex: 1;
  font-size: 26rpx;
  color: #111827;
  font-weight: 650;
}

.tabs {
  white-space: nowrap;
  height: 74rpx;
}

.tab-inner {
  padding: 0 32rpx;
  display: flex;
  gap: 14rpx;
}

.tab {
  padding: 14rpx 24rpx;
  border-radius: 999rpx;
  background: #e8edf5;
  color: #475467;
  font-size: 24rpx;
  font-weight: 800;
}

.tab.active {
  background: #111827;
  color: #fff;
}

.adv-filter { padding: 12rpx 32rpx 0; display: flex; flex-direction: column; gap: 10rpx; }
.adv-row { display: flex; align-items: center; gap: 10rpx; flex-wrap: wrap; }
.adv-label { font-size: 22rpx; color: #6E6E73; font-weight: 700; margin-right: 4rpx; }
.adv-chip { padding: 8rpx 18rpx; border-radius: 999rpx; background: #fff; color: #475467; font-size: 22rpx; font-weight: 700; border: 1rpx solid #E5E5EA; }
.adv-chip.selected { background: #111827; color: #fff; border-color: #111827; }
.adv-chip.export { background: #FFF4E5; color: #B26A00; border-color: #FFE0B2; margin-left: auto; }
.adv-spacer { flex: 1; }

.content {
  height: calc(100vh - 270rpx);
  padding: 0 32rpx;
}

.alert-card,
.dict-card,
.empty {
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 14rpx 36rpx rgba(17, 24, 39, 0.05);
}

.alert-card {
  padding: 24rpx;
  margin: 12rpx 0 22rpx;
  background: #fffbeb;
  border: 1rpx solid #fedf89;
}

.alert-title {
  display: block;
  color: #b54708;
  font-size: 25rpx;
  font-weight: 900;
}

.alert-desc {
  display: block;
  margin-top: 8rpx;
  color: #92400e;
  font-size: 22rpx;
  line-height: 1.5;
  font-weight: 650;
}

.dict-card {
  padding: 28rpx;
  margin-bottom: 22rpx;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18rpx;
}

.risk-tag {
  display: inline-flex;
  padding: 7rpx 14rpx;
  border-radius: 10rpx;
  font-size: 20rpx;
  font-weight: 900;
}

.risk-tag.high {
  background: #fee4e2;
  color: #d92d20;
}

.risk-tag.medium {
  background: #fef0c7;
  color: #b54708;
}

.risk-tag.low {
  background: #dcfae6;
  color: #067647;
}

.region {
  margin-left: 12rpx;
  color: #98a2b3;
  font-size: 20rpx;
  font-weight: 800;
}

.collect {
  width: 54rpx;
  height: 54rpx;
  border-radius: 50%;
  background: #f2f4f7;
  color: #98a2b3;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 900;
}

.collect.active {
  color: #f59e0b;
}

.title {
  display: block;
  font-size: 33rpx;
  line-height: 1.32;
  font-weight: 900;
  color: #111827;
}

.summary {
  display: block;
  margin-top: 14rpx;
  color: #667085;
  font-size: 25rpx;
  line-height: 1.55;
  font-weight: 650;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14rpx;
  margin-top: 22rpx;
}

.info-box,
.standard-block,
.avoid-block {
  border-radius: 18rpx;
  padding: 20rpx;
}

.info-box {
  background: #f8fafc;
}

.info-label,
.standard-title,
.avoid-title {
  display: block;
  font-size: 22rpx;
  color: #475467;
  font-weight: 900;
}

.info-value,
.standard-text,
.avoid-text {
  display: block;
  margin-top: 8rpx;
  color: #111827;
  font-size: 24rpx;
  line-height: 1.5;
  font-weight: 700;
}

.standard-block {
  margin-top: 14rpx;
  background: #eef6ff;
}

.avoid-block {
  margin-top: 14rpx;
  background: #fff7ed;
}

.avoid-title {
  color: #c2410c;
}

.avoid-text {
  color: #9a3412;
}

.footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  margin-top: 22rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f2f4f7;
}

.footer-row text {
  flex: 1;
  color: #98a2b3;
  font-size: 20rpx;
  line-height: 1.4;
  font-weight: 700;
}

.copy-btn {
  flex-shrink: 0;
  padding: 12rpx 18rpx;
  border-radius: 999rpx;
  background: #111827;
  color: #fff;
  font-size: 22rpx;
  font-weight: 900;
}

.empty {
  padding: 50rpx 30rpx;
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

.bottom-space {
  height: 120rpx;
}
</style>
