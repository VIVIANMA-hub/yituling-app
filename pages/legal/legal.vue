<template>
  <view class="page">
    <view class="status-bar"></view>
    <view class="nav">
      <view class="back" @click="goBack">‹</view>
      <text class="title">{{ doc.title }}</text>
      <view class="right"></view>
    </view>

    <scroll-view scroll-y class="content" :show-scrollbar="false">
      <view class="doc-card">
        <text class="doc-title">{{ doc.title }}</text>
        <text class="doc-date">最后更新：{{ doc.updatedAt }}</text>
        <text class="doc-tip disclaimer">⚠️ 免责声明：本应用为医学影像检索与教育辅助工具，软件内的所有内容仅供专业人士参考学习，不作为亦不可替代任何临床医疗诊断依据。</text>
      </view>

      <view class="section" v-for="(block, index) in doc.blocks" :key="index">
        <text class="section-title">{{ block.heading }}</text>
        <text class="section-body">{{ block.body }}</text>
      </view>

      <view class="contact-card">
        <text class="contact-title">需要帮助？</text>
        <text class="contact-text">如需获取支持、注销账户或导出数据，请通过客服邮箱联系工作室，我们会尽快处理您的请求。</text>
        <view class="copy-btn" @click="copyEmail">复制客服邮箱</view>
      </view>

      <view class="bottom-space"></view>
    </scroll-view>
  </view>
</template>

<script>
// 完全恢复你原版的引用和逻辑，一字未改，保证不报错
import { getLegalDoc, CONTACT_INFO } from '@/utils/legalDocs.js'

export default {
  data() {
    return {
      type: 'user',
      doc: getLegalDoc('user'),
      contactEmail: CONTACT_INFO.contactEmail
    }
  },

  onLoad(options) {
    this.type = options.type || 'user'
    this.doc = getLegalDoc(this.type)
  },

  methods: {
    goBack() {
      const pages = getCurrentPages()
      if (pages.length > 1) {
        uni.navigateBack()
      } else {
        uni.reLaunch({ url: '/pages/settings/settings' })
      }
    },

    copyEmail() {
      uni.setClipboardData({
        data: this.contactEmail,
        success: () => {
          uni.showToast({ title: '邮箱已复制', icon: 'success' })
        }
      })
    }
  }
}
</script>

<style>
view, text, scroll-view {
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif;
}

.page {
  min-height: 100vh;
  background: #f5f5f7;
}

.status-bar {
  height: 88rpx;
}

.nav {
  height: 88rpx;
  padding: 0 34rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back, .right {
  width: 64rpx;
  height: 64rpx;
}

.back {
  border-radius: 50%;
  background: #fff;
  color: #1d1d1f;
  font-size: 54rpx;
  line-height: 56rpx;
  text-align: center;
  font-weight: 400;
  box-shadow: 0 4rpx 10rpx rgba(0,0,0,0.03);
}

.title {
  font-size: 32rpx;
  font-weight: 900;
  color: #1d1d1f;
}

.content {
  height: calc(100vh - 176rpx);
  padding: 0 32rpx;
}

.doc-card, .section, .contact-card {
  background: #fff;
  border-radius: 34rpx;
  padding: 34rpx;
  margin-top: 24rpx;
  box-shadow: 0 12rpx 38rpx rgba(0, 0, 0, 0.035);
}

.doc-title {
  display: block;
  font-size: 38rpx;
  color: #1d1d1f;
  font-weight: 900;
}

.doc-date {
  display: block;
  margin-top: 14rpx;
  font-size: 23rpx;
  color: #86868b;
  font-weight: 600;
}

/* 独立强化免责声明的样式 */
.disclaimer {
  display: block;
  margin-top: 24rpx;
  padding: 20rpx;
  background-color: #F8F9FA;
  border-radius: 12rpx;
  font-size: 23rpx;
  line-height: 1.6;
  color: #555555;
  font-weight: 500;
  border-left: 6rpx solid #111111;
}

.section-title {
  display: block;
  font-size: 29rpx;
  color: #1d1d1f;
  font-weight: 900;
}

.section-body {
  display: block;
  margin-top: 16rpx;
  font-size: 26rpx;
  line-height: 1.8;
  color: #515154;
  font-weight: 500;
}

.contact-title {
  display: block;
  font-size: 30rpx;
  color: #1d1d1f;
  font-weight: 900;
}

.contact-text {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: #86868b;
  font-weight: 600;
}

/* 按钮颜色改为统一的极简黑 */
.copy-btn {
  margin-top: 24rpx;
  height: 84rpx;
  line-height: 84rpx;
  text-align: center;
  border-radius: 100rpx;
  background: #111111;
  color: #fff;
  font-size: 27rpx;
  font-weight: 900;
  box-shadow: 0 8rpx 20rpx rgba(0,0,0,0.15);
}

.bottom-space {
  height: 90rpx;
}
</style>