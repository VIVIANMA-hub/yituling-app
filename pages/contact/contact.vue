<template>
  <view class="page">
    <view class="status-bar"></view>
    <view class="nav">
      <view class="back" @click="goBack">‹</view>
      <text class="nav-title">联系客服</text>
      <view class="right"></view>
    </view>

    <scroll-view scroll-y class="content" :show-scrollbar="false">
      <view class="hero-card">
        <text class="hero-title">一图灵客服与合规反馈</text>
        <text class="hero-text">账号、隐私、数据删除、内容举报、商务合作等问题，都可以通过以下方式联系。</text>
      </view>

      <view class="card">
        <view class="row">
          <view>
            <text class="label">客服电话</text>
            <text class="value">{{ phone }}</text>
          </view>
          <view class="copy" @click="copy(phone)">复制</view>
        </view>
        <view class="row">
          <view>
            <text class="label">客服邮箱</text>
            <text class="value">{{ email }}</text>
          </view>
          <view class="copy" @click="copy(email)">复制</view>
        </view>
        <view class="row">
          <view>
            <text class="label">客服微信</text>
            <text class="value">{{ wechat }}</text>
          </view>
          <view class="copy" @click="copy(wechat)">复制</view>
        </view>
        <view class="row">
          <view>
            <text class="label">客服QQ</text>
            <text class="value">{{ qq }}</text>
          </view>
          <view class="copy" @click="copy(qq)">复制</view>
        </view>
        <view class="row no-border">
          <view>
            <text class="label">运营主体</text>
            <text class="value">{{ company }}</text>
          </view>
        </view>
      </view>

      <view class="card">
        <text class="card-title">建议反馈格式</text>
        <text class="card-text">为了更快处理，请在邮件中写明：账号手机号或用户 ID、问题类型、发生时间、页面截图、希望处理的内容。涉及隐私删除或账号注销时，请使用注册账号能接收验证码的联系方式提交。</text>
      </view>

      <view class="card warning">
        <text class="warning-title">医疗紧急情况</text>
        <text class="warning-text">一图灵不提供急救、诊断、治疗或分诊服务。如遇紧急医疗情况，请立即联系当地急救电话或前往医疗机构。</text>
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
      phone: CONTACT_INFO.contactPhone,
      email: CONTACT_INFO.contactEmail,
      wechat: CONTACT_INFO.contactWechat,
      qq: CONTACT_INFO.contactQQ,
      company: CONTACT_INFO.companyName
    }
  },

  methods: {
    goBack() {
      uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/settings/settings' }) })
    },

    copy(text) {
      uni.setClipboardData({
        data: text,
        success: () => uni.showToast({ title: '已复制', icon: 'success' })
      })
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
.nav-title { font-size: 34rpx; color: #1d1d1f; font-weight: 900; }
.content { height: calc(100vh - 176rpx); padding: 0 32rpx; }
.hero-card, .card { margin-top: 24rpx; background: #fff; border-radius: 34rpx; padding: 34rpx; box-shadow: 0 12rpx 38rpx rgba(0, 0, 0, 0.035); }
.hero-title, .card-title { display: block; font-size: 34rpx; color: #1d1d1f; font-weight: 900; }
.hero-text, .card-text { display: block; margin-top: 14rpx; font-size: 25rpx; line-height: 1.7; color: #515154; font-weight: 600; }
.row { padding: 26rpx 0; border-bottom: 1rpx solid #f2f2f7; display: flex; align-items: center; justify-content: space-between; gap: 20rpx; }
.row:first-child { padding-top: 0; }
.row.no-border { border-bottom: none; padding-bottom: 0; }
.label { display: block; font-size: 22rpx; color: #86868b; font-weight: 700; }
.value { display: block; margin-top: 8rpx; font-size: 27rpx; color: #1d1d1f; font-weight: 900; word-break: break-all; }
.copy { min-width: 108rpx; height: 62rpx; line-height: 62rpx; text-align: center; border-radius: 100rpx; background: #007aff; color: #fff; font-size: 24rpx; font-weight: 900; }
.warning { background: #fff7e6; }
.warning-title { display: block; font-size: 30rpx; color: #8a5a00; font-weight: 900; }
.warning-text { display: block; margin-top: 14rpx; font-size: 25rpx; line-height: 1.7; color: #9a6a12; font-weight: 600; }
.bottom-space { height: 90rpx; }
</style>
