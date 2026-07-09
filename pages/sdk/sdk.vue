<template>
  <view class="page">
    <view class="status-bar"></view>
    <view class="nav">
      <view class="back" @click="goBack">‹</view>
      <text class="nav-title">第三方 SDK 清单</text>
      <view class="right"></view>
    </view>

    <scroll-view scroll-y class="content" :show-scrollbar="false">
      <view class="intro-card">
        <text class="intro-title">{{ appName }} 主体信息</text>
        <text class="intro-text">运营主体：{{ companyName }}</text>
        <text class="intro-text">统一社会信用代码：{{ unifiedSocialCreditCode }}</text>
        <text class="intro-text">邓白氏编码：{{ dunsNumber }}</text>
        <text class="intro-text">客服：{{ contactPhone }} / {{ contactEmail }}</text>
      </view>

      <view class="intro-card">
        <text class="intro-title">第三方 SDK 与服务清单</text>
        <text class="intro-text">下面是一图灵当前披露的 SDK 与第三方服务清单。后续接入登录、支付、统计、推送、OCR 或对象存储时，应同步更新真实厂商名称、收集字段和隐私链接。</text>
      </view>

      <view class="sdk-card" v-for="item in sdkList" :key="item.name">
        <view class="sdk-head">
          <text class="sdk-name">{{ item.name }}</text>
          <text class="sdk-status" :class="item.status">{{ item.statusText }}</text>
        </view>
        <text class="sdk-row">用途：{{ item.purpose }}</text>
        <text class="sdk-row">可能收集：{{ item.data }}</text>
        <text class="sdk-row">启用场景：{{ item.scene }}</text>
      </view>

      <view class="tip-card">
        <text class="tip-title">合规维护提醒</text>
        <text class="tip-text">1. 在隐私政策中逐一列出真实 SDK；2. 在 App Store Connect 填 App Privacy；3. 安卓市场上传 SDK 合规清单；4. 小程序后台填写用户隐私保护指引。</text>
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
      sdkList: [
        {
          name: 'DCloud uni-app / App 运行基础模块',
          status: 'using',
          statusText: '已使用',
          purpose: 'App 基础运行、页面渲染、系统能力调用。',
          data: '设备信息、系统版本、网络状态、App 版本、运行日志。',
          scene: '启动 App、页面访问、调用相机相册等系统能力。'
        },
        {
          name: '微信开放平台 / 微信小程序能力',
          status: 'planned',
          statusText: '计划接入',
          purpose: '微信登录、微信分享、小程序运行、微信支付。',
          data: '微信 OpenID/UnionID、昵称头像、订单信息、分享状态。',
          scene: '用户选择微信登录、分享或在小程序内使用支付能力。'
        },
        {
          name: 'Apple Sign in / Apple IAP',
          status: 'planned',
          statusText: '计划接入',
          purpose: 'Apple 登录、iOS 会员订阅与购买。',
          data: 'Apple 用户标识、订阅状态、交易凭证。',
          scene: 'iOS 用户登录、购买 Pro 会员或恢复购买。'
        },
        {
          name: '对象存储服务',
          status: 'planned',
          statusText: '计划接入',
          purpose: '保存用户主动上传的脱敏图、排班图片、头像和审核材料。',
          data: '文件名、文件类型、文件大小、访问地址、上传时间。',
          scene: '用户主动上传或保存素材时。'
        },
        {
          name: 'OCR / AI 识别服务',
          status: 'planned',
          statusText: '计划接入',
          purpose: '排班识别、隐私区域辅助标记、文本结构化。',
          data: '用户主动上传的图片或文本、处理结果、调用日志。',
          scene: '用户点击排班识别、脱敏检测或文本整理时。'
        },
        {
          name: '内容安全审核服务',
          status: 'planned',
          statusText: '计划接入',
          purpose: '识别违法违规、广告引流、患者隐私泄露、低俗暴力等内容。',
          data: '待发布文本、图片、视频、审核结果。',
          scene: '用户发布社区内容、评论、头像或举报时。'
        },
        {
          name: '统计与崩溃分析服务',
          status: 'planned',
          statusText: '计划接入',
          purpose: '分析功能使用、定位崩溃、提升稳定性。',
          data: '设备型号、系统版本、App 版本、崩溃日志、页面访问事件。',
          scene: 'App 运行、崩溃、异常和性能分析时。'
        }
      ]
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
.intro-card, .sdk-card, .tip-card { margin-top: 24rpx; background: #fff; border-radius: 34rpx; padding: 34rpx; box-shadow: 0 12rpx 38rpx rgba(0, 0, 0, 0.035); }
.intro-title, .tip-title { display: block; font-size: 32rpx; color: #1d1d1f; font-weight: 900; }
.intro-text, .tip-text { display: block; margin-top: 14rpx; font-size: 25rpx; line-height: 1.7; color: #515154; font-weight: 600; }
.sdk-head { display: flex; align-items: center; justify-content: space-between; gap: 20rpx; }
.sdk-name { flex: 1; font-size: 29rpx; color: #1d1d1f; font-weight: 900; }
.sdk-status { padding: 8rpx 14rpx; border-radius: 12rpx; font-size: 20rpx; font-weight: 900; }
.sdk-status.using { background: rgba(52, 199, 89, 0.12); color: #34c759; }
.sdk-status.planned { background: rgba(255, 159, 10, 0.14); color: #c46a00; }
.sdk-row { display: block; margin-top: 16rpx; font-size: 24rpx; line-height: 1.6; color: #515154; font-weight: 600; }
.tip-card { background: #fff7e6; }
.tip-title { color: #8a5a00; }
.tip-text { color: #9a6a12; }
.bottom-space { height: 90rpx; }
</style>
