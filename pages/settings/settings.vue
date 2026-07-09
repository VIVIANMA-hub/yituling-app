<template>
  <view class="page" :class="{ dark: theme === 'dark' }">
    <view class="status-bar"></view>

    <view class="nav">
      <view class="back" @click="goBack">‹</view>
      <text class="nav-title">个人中心</text>
      <view class="right"></view>
    </view>

    <scroll-view scroll-y class="content" :show-scrollbar="false">
      <view class="profile-card">
        <view class="avatar">医</view>
        <view>
          <text class="profile-name">{{ userName }}</text>
          <text class="profile-desc">基层影像效率工具 · 非诊断类应用</text>
        </view>
      </view>

      <view class="points-card">
        <view class="points-head">
          <view>
            <text class="points-label">灵石账户</text>
            <text class="points-desc">可兑换 Pro 体验和智能功能次数</text>
          </view>
          <view class="points-num">
            <text>{{ points }}</text>
            <text>灵石</text>
          </view>
        </view>
        <view class="points-actions">
          <view class="points-btn primary-points" @click="go('/pages/vip/vip')">去兑换</view>
          <view class="points-btn" @click="showPointRecords">查看记录</view>
        </view>
      </view>

      <view class="section-card">
        <text class="section-title">我的信息</text>
        <view class="edit-row">
          <text class="edit-label">昵称</text>
          <input class="edit-input" v-model="profileName" placeholder="填写昵称" maxlength="16" @blur="saveProfile" />
        </view>
        <view class="edit-row">
          <text class="edit-label">手机号</text>
          <input class="edit-input" v-model="phone" placeholder="未绑定" type="number" maxlength="11" @blur="saveProfile" />
        </view>
        <view class="edit-row">
          <text class="edit-label">邮箱</text>
          <input class="edit-input" v-model="email" placeholder="未绑定" @blur="saveProfile" />
        </view>
      </view>

      <view class="section-card">
        <text class="section-title">页面风格</text>
        <view class="theme-switch">
          <view class="theme-option" :class="{ active: theme === 'light' }" @click="setTheme('light')">白天</view>
          <view class="theme-option" :class="{ active: theme === 'dark' }" @click="setTheme('dark')">黑夜</view>
        </view>
      </view>

      <view class="section-card">
        <text class="section-title">服务与帮助</text>
        <view class="row" v-for="item in legalRows" :key="item.title" @click="go(item.url)">
          <view>
            <text class="row-title">{{ item.title }}</text>
            <text class="row-desc">{{ item.desc }}</text>
          </view>
          <text class="arrow">›</text>
        </view>
      </view>

      <view class="section-card">
        <text class="section-title">账号与数据</text>
        <view class="row" v-for="item in dataRows" :key="item.title" @click="go(item.url)">
          <view>
            <text class="row-title">{{ item.title }}</text>
            <text class="row-desc">{{ item.desc }}</text>
          </view>
          <text class="arrow">›</text>
        </view>
      </view>

      <view class="section-card">
        <text class="section-title">关于一图灵</text>
        <view class="info-line">
          <text>版本</text>
          <text>1.0.0</text>
        </view>
        <view class="info-line">
          <text>运营主体</text>
          <text>{{ companyName }}</text>
        </view>
        <view class="info-line">
          <text>统一社会信用代码</text>
          <text>{{ unifiedSocialCreditCode }}</text>
        </view>
        <view class="info-line">
          <text>邓白氏编码</text>
          <text>{{ dunsNumber }}</text>
        </view>
        <view class="info-line">
          <text>客服电话</text>
          <text>{{ contactPhone }}</text>
        </view>
        <view class="info-line">
          <text>客服邮箱</text>
          <text>{{ contactEmail }}</text>
        </view>
        <view class="info-line compact" @click="showFiling">
          <text>备案信息</text>
          <text>查看</text>
        </view>
      </view>

      <view class="warning-card">
        <text class="warning-title">医疗边界</text>
        <text class="warning-text">一图灵 1.0 只提供排班、脱敏、资料整理、学分自填记录和经验共创，不提供诊断、治疗、用药或分诊建议。</text>
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
      userName: '医生',
      profileName: '',
      phone: '',
      email: '',
      theme: 'light',
      points: 0,
      legalRows: [
        { title: '用户服务协议', desc: '服务边界、用户义务与非医疗器械声明', url: '/pages/public/agreement' },
        { title: '隐私政策', desc: '权限、数据、个人信息保护和用户权利', url: '/pages/public/privacy' },
        { title: '发票中心', desc: '会员订单开票申请、进度与历史查询', url: '/pages/invoice/invoice' },
        { title: 'SDK 合规清单', desc: '第三方能力接入说明', url: '/pages/sdk/sdk' },
        { title: '苹果账号转换清单', desc: '个人账号转公司账号执行步骤', url: '/pages/compliance/apple-account' },
        { title: '联系客服', desc: '账号、隐私、举报和商务反馈', url: '/pages/contact/contact' }
      ],
      dataRows: [
        { title: '个人数据删除', desc: '申请删除草稿、上传素材、社区内容等', url: '/pages/account/delete-data' },
        { title: '账号注销', desc: '提交注销申请并了解不可恢复后果', url: '/pages/account/cancel' }
      ],
      companyName: CONTACT_INFO.companyName,
      unifiedSocialCreditCode: CONTACT_INFO.unifiedSocialCreditCode,
      dunsNumber: CONTACT_INFO.dunsNumber,
      contactPhone: CONTACT_INFO.contactPhone,
      contactEmail: CONTACT_INFO.contactEmail
    }
  },
  onShow() {
    const name = uni.getStorageSync('user_name')
    this.profileName = name || ''
    this.userName = name || '医生'
    this.phone = uni.getStorageSync('ytl_user_phone') || ''
    this.email = uni.getStorageSync('ytl_user_email') || ''
    this.theme = uni.getStorageSync('ytl_theme') || 'light'
    this.points = Number(uni.getStorageSync('ytl_points') || 0)
  },
  methods: {
    goBack() {
      uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
    },
    go(url) {
      uni.navigateTo({ url })
    },
    saveProfile() {
      const name = (this.profileName || '').trim()
      const phone = (this.phone || '').trim()
      const email = (this.email || '').trim()
      uni.setStorageSync('user_name', name)
      uni.setStorageSync('ytl_user_phone', phone)
      uni.setStorageSync('ytl_user_email', email)
      this.userName = name || '医生'
    },
    setTheme(theme) {
      this.theme = theme
      uni.setStorageSync('ytl_theme', theme)
      uni.showToast({
        title: theme === 'dark' ? '已切换黑夜' : '已切换白天',
        icon: 'none'
      })
    },
    showPointRecords() {
      const records = uni.getStorageSync('ytl_point_records') || []
      if (!records.length) {
        uni.showModal({
          title: '暂无灵石记录',
          content: '看广告、有效分享、发布脱敏内容都可以获得灵石。',
          showCancel: false
        })
        return
      }
      const lines = records.slice(0, 5).map(item => `${item.title} +${item.points}`).join('\n')
      uni.showModal({
        title: '最近灵点记录',
        content: lines,
        showCancel: false
      })
    },
    showFiling() {
      uni.showModal({
        title: '备案信息',
        content: 'ICP备案：桂ICP备2026008099号',
        showCancel: false
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

.page.dark {
  background: #0f172a;
  color: #e5e7eb;
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

.profile-card,
.points-card,
.section-card,
.warning-card {
  margin-top: 24rpx;
  background: #fff;
  border-radius: 30rpx;
  padding: 30rpx;
  box-shadow: 0 14rpx 36rpx rgba(17, 24, 39, 0.05);
}

.dark .profile-card,
.dark .section-card {
  background: #182235;
  box-shadow: 0 14rpx 36rpx rgba(0, 0, 0, 0.18);
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.points-card {
  background: linear-gradient(135deg, #111827, #2a210f);
  color: #fff7df;
  border: 1rpx solid rgba(247, 200, 95, 0.28);
}

.points-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 22rpx;
}

.points-label,
.points-desc {
  display: block;
}

.points-label {
  color: #f7c85f;
  font-size: 24rpx;
  font-weight: 900;
}

.points-desc {
  margin-top: 8rpx;
  color: rgba(255, 247, 223, 0.72);
  font-size: 21rpx;
  line-height: 1.4;
  font-weight: 700;
}

.points-num {
  flex-shrink: 0;
  text-align: right;
}

.points-num text:first-child {
  display: block;
  color: #ffe16a;
  font-size: 46rpx;
  line-height: 1;
  font-weight: 900;
}

.points-num text:last-child {
  display: block;
  margin-top: 6rpx;
  color: rgba(255, 247, 223, 0.72);
  font-size: 20rpx;
  font-weight: 800;
}

.points-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
  margin-top: 24rpx;
}

.points-btn {
  min-height: 72rpx;
  border-radius: 999rpx;
  border: 1rpx solid rgba(255, 247, 223, 0.18);
  color: #fff7df;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 23rpx;
  font-weight: 900;
}

.primary-points {
  background: #ffe16a;
  color: #231400;
  border-color: #ffe16a;
}

.avatar {
  width: 82rpx;
  height: 82rpx;
  border-radius: 24rpx;
  background: #1677ff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  font-weight: 900;
}

.profile-name {
  display: block;
  color: #111827;
  font-size: 30rpx;
  font-weight: 900;
}

.dark .profile-name,
.dark .section-title,
.dark .row-title,
.dark .info-line text:last-child,
.dark .edit-label {
  color: #f9fafb;
}

.profile-desc {
  display: block;
  margin-top: 6rpx;
  color: #667085;
  font-size: 22rpx;
  font-weight: 700;
}

.section-title {
  display: block;
  color: #111827;
  font-size: 28rpx;
  font-weight: 900;
  margin-bottom: 8rpx;
}

.edit-row {
  min-height: 86rpx;
  border-bottom: 1rpx solid #eef2f7;
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.edit-row:last-child {
  border-bottom: none;
}

.edit-label {
  width: 112rpx;
  color: #111827;
  font-size: 25rpx;
  font-weight: 900;
}

.edit-input {
  flex: 1;
  height: 70rpx;
  color: #111827;
  font-size: 25rpx;
  font-weight: 700;
  text-align: right;
}

.theme-switch {
  margin-top: 18rpx;
  padding: 8rpx;
  border-radius: 999rpx;
  background: #eef2f7;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8rpx;
}

.theme-option {
  height: 72rpx;
  border-radius: 999rpx;
  color: #667085;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 900;
}

.theme-option.active {
  background: #111827;
  color: #fff;
  box-shadow: 0 10rpx 28rpx rgba(17, 24, 39, 0.16);
}

.dark .edit-row,
.dark .row,
.dark .info-line {
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

.dark .edit-input,
.dark .profile-desc,
.dark .row-desc,
.dark .info-line text,
.dark .arrow {
  color: #cbd5e1;
}

.dark .theme-switch {
  background: #0f172a;
}

.dark .theme-option {
  color: #94a3b8;
}

.dark .theme-option.active {
  background: #f8fafc;
  color: #111827;
}

.row {
  padding: 24rpx 0;
  border-bottom: 1rpx solid #eef2f7;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.row-title {
  display: block;
  color: #111827;
  font-size: 26rpx;
  font-weight: 900;
}

.row-desc {
  display: block;
  margin-top: 6rpx;
  color: #667085;
  font-size: 21rpx;
  line-height: 1.4;
  font-weight: 650;
}

.arrow {
  color: #98a2b3;
  font-size: 46rpx;
}

.info-line {
  padding: 18rpx 0;
  border-bottom: 1rpx solid #eef2f7;
  display: flex;
  justify-content: space-between;
  gap: 24rpx;
}

.info-line:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.info-line text {
  color: #667085;
  font-size: 22rpx;
  line-height: 1.4;
  font-weight: 700;
}

.info-line text:last-child {
  flex: 1;
  text-align: right;
  color: #111827;
}

.warning-card {
  background: #fffbeb;
  border: 1rpx solid #fedf89;
}

.warning-title {
  display: block;
  color: #b54708;
  font-size: 26rpx;
  font-weight: 900;
}

.warning-text {
  display: block;
  margin-top: 10rpx;
  color: #92400e;
  font-size: 22rpx;
  line-height: 1.55;
  font-weight: 650;
}

.bottom-space {
  height: 100rpx;
}
</style>
