<template>
  <view class="page">
    <view class="status-bar"></view>
    <view class="nav">
      <view class="back" @click="goBack">‹</view>
      <text class="nav-title">苹果账号转换清单</text>
      <view class="right"></view>
    </view>

    <scroll-view scroll-y class="content" :show-scrollbar="false">
      <view class="hero-card">
        <text class="hero-title">{{ appName }} · iOS 上架主体统一</text>
        <text class="hero-text">目标：将 Apple 个人开发者账号转换为公司账号（Organization），并与安卓各市场主体信息保持一致。</text>
      </view>

      <view class="card">
        <text class="card-title">公司信息（提交 Apple 用）</text>
        <text class="card-line">公司全称：{{ companyName }}</text>
        <text class="card-line">统一社会信用代码：{{ unifiedSocialCreditCode }}</text>
        <text class="card-line">邓白氏编码：{{ dunsNumber }}</text>
        <text class="card-line">客服电话：{{ contactPhone }}</text>
        <text class="card-line">客服邮箱：{{ contactEmail }}</text>
      </view>

      <view class="card">
        <text class="card-title">执行步骤</text>
        <view class="step-row" v-for="(item, index) in checklist" :key="index">
          <text class="step-index">{{ index + 1 }}</text>
          <text class="step-text">{{ item }}</text>
        </view>
      </view>

      <view class="card warning">
        <text class="card-title">提审前核对</text>
        <text class="card-line">1. App Store Connect Seller Name 显示公司主体。</text>
        <text class="card-line">2. iOS/安卓/官网隐私政策中的主体和客服信息完全一致。</text>
        <text class="card-line">3. 不在 App 公示页展示对公账户和银行联行号。</text>
      </view>

      <view class="bottom-space"></view>
    </scroll-view>
  </view>
</template>

<script>
import { CONTACT_INFO } from '@/utils/legalDocs.js'

export default {
  data() {
    return {
      appName: CONTACT_INFO.appName,
      companyName: CONTACT_INFO.companyName,
      unifiedSocialCreditCode: CONTACT_INFO.unifiedSocialCreditCode,
      dunsNumber: CONTACT_INFO.dunsNumber,
      contactPhone: CONTACT_INFO.contactPhone,
      contactEmail: CONTACT_INFO.contactEmail,
      checklist: CONTACT_INFO.appleConversionChecklist || []
    }
  },
  methods: {
    goBack() {
      uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/settings/settings' }) })
    }
  }
}
</script>

<style>
view, text, scroll-view { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif; }
.page { min-height: 100vh; background: #f5f5f7; }
.status-bar { height: 88rpx; }
.nav { height: 88rpx; padding: 0 34rpx; display: flex; align-items: center; justify-content: space-between; }
.back, .right { width: 64rpx; height: 64rpx; }
.back { border-radius: 50%; background: #fff; color: #1d1d1f; font-size: 54rpx; line-height: 56rpx; text-align: center; }
.nav-title { font-size: 32rpx; color: #1d1d1f; font-weight: 900; }
.content { height: calc(100vh - 176rpx); padding: 0 32rpx; }
.hero-card, .card { margin-top: 24rpx; background: #fff; border-radius: 34rpx; padding: 34rpx; box-shadow: 0 12rpx 38rpx rgba(0, 0, 0, 0.035); }
.hero-title, .card-title { display: block; font-size: 32rpx; color: #1d1d1f; font-weight: 900; }
.hero-text, .card-line, .step-text { display: block; margin-top: 12rpx; font-size: 25rpx; line-height: 1.7; color: #515154; font-weight: 600; }
.step-row { display: flex; align-items: flex-start; gap: 14rpx; margin-top: 16rpx; }
.step-index { flex-shrink: 0; width: 36rpx; height: 36rpx; border-radius: 50%; background: #111827; color: #fff; font-size: 20rpx; font-weight: 900; text-align: center; line-height: 36rpx; }
.warning { background: #fff7e6; }
.bottom-space { height: 90rpx; }
</style>
