<template>
  <view class="page">
    <view class="status-bar"></view>
    <view class="nav">
      <view class="back" @click="goBack">‹</view>
      <text class="nav-title">隐私政策</text>
      <view class="right"></view>
    </view>

    <scroll-view scroll-y class="content" :show-scrollbar="false">
      <view class="doc-card">
        <text class="doc-title">{{ doc.title }}</text>
        <text class="doc-date">最后更新：{{ doc.updatedAt }}</text>
        <text class="doc-tip">运营主体：{{ companyName }} · {{ icp }}</text>
      </view>

      <view class="section" v-for="(block, index) in doc.blocks" :key="index">
        <text class="section-title">{{ block.heading }}</text>
        <text class="section-body">{{ block.body }}</text>
      </view>

      <view class="contact-card">
        <text class="contact-title">联系我们</text>
        <text class="contact-text">如需访问、更正、删除数据或注销账号，可通过客服电话 {{ contactPhone }}、客服微信 {{ contactWechat }}、客服QQ {{ contactQQ }} 或 {{ contactEmail }} 联系我们。</text>
        <view class="copy-btn" @click="copyEmail">复制客服邮箱</view>
      </view>

      <view class="bottom-space"></view>
    </scroll-view>
  </view>
</template>

<script>
import { getLegalDoc, CONTACT_INFO } from '@/utils/legalDocs.js'

export default {
  data() {
    return {
      doc: getLegalDoc('privacy'),
      companyName: CONTACT_INFO.companyName,
      icp: CONTACT_INFO.icp,
      contactPhone: CONTACT_INFO.contactPhone,
      contactWechat: CONTACT_INFO.contactWechat,
      contactQQ: CONTACT_INFO.contactQQ,
      contactEmail: CONTACT_INFO.contactEmail
    }
  },
  methods: {
    goBack() {
      uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
    },
    copyEmail() {
      uni.setClipboardData({
        data: this.contactEmail,
        success: () => uni.showToast({ title: '邮箱已复制', icon: 'success' })
      })
    }
  }
}
</script>

<style>
view,
text,
scroll-view {
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
  height: 88rpx;
  padding: 0 34rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back,
.right {
  width: 64rpx;
  height: 64rpx;
}

.back {
  border-radius: 50%;
  background: #fff;
  color: #111827;
  font-size: 54rpx;
  line-height: 56rpx;
  text-align: center;
}

.nav-title {
  font-size: 34rpx;
  color: #111827;
  font-weight: 900;
}

.content {
  height: calc(100vh - 176rpx);
  padding: 0 32rpx;
}

.doc-card,
.section,
.contact-card {
  background: #fff;
  border-radius: 30rpx;
  padding: 32rpx;
  margin-top: 24rpx;
  box-shadow: 0 14rpx 36rpx rgba(17, 24, 39, 0.05);
}

.doc-title {
  display: block;
  font-size: 38rpx;
  color: #111827;
  font-weight: 900;
}

.doc-date,
.doc-tip {
  display: block;
  margin-top: 12rpx;
  color: #667085;
  font-size: 22rpx;
  line-height: 1.5;
  font-weight: 700;
}

.section-title,
.contact-title {
  display: block;
  color: #111827;
  font-size: 29rpx;
  font-weight: 900;
}

.section-body,
.contact-text {
  display: block;
  margin-top: 14rpx;
  color: #515154;
  font-size: 25rpx;
  line-height: 1.75;
  font-weight: 600;
}

.copy-btn {
  margin-top: 24rpx;
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 999rpx;
  background: #111827;
  color: #fff;
  text-align: center;
  font-size: 27rpx;
  font-weight: 900;
}

.bottom-space {
  height: 90rpx;
}
</style>
