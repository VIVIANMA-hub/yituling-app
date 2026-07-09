<template>
  <view class="page">
    <view class="status-bar"></view>
    <view class="nav">
      <view class="back" @click="goBack">‹</view>
      <text class="nav-title">数据删除</text>
      <view class="right"></view>
    </view>

    <scroll-view scroll-y class="content" :show-scrollbar="false">
      <view class="intro-card">
        <text class="intro-title">管理我的数据</text>
        <text class="intro-text">您可以申请删除主动上传或生成的数据。当前会先记录请求和范围，涉及云端数据时请同步通过客服邮箱提交，以便完成身份核验和处理反馈。</text>
      </view>

      <view class="section" v-for="(block, index) in doc.blocks" :key="index">
        <text class="section-title">{{ block.heading }}</text>
        <text class="section-body">{{ block.body }}</text>
      </view>

      <view class="form-card">
        <text class="form-title">选择删除范围</text>
        <view class="data-row" v-for="item in dataTypes" :key="item.key" @click="item.checked = !item.checked">
          <view class="checkbox" :class="{ checked: item.checked }">
            <text v-if="item.checked">✓</text>
          </view>
          <view class="data-texts">
            <text class="data-title">{{ item.title }}</text>
            <text class="data-desc">{{ item.desc }}</text>
          </view>
        </view>

        <textarea class="textarea" v-model="reason" placeholder="可选：补充说明，例如只删除某张图片、某篇草稿或某段时间的数据。" maxlength="300"></textarea>

        <view class="submit-btn" :class="{ disabled: !hasSelected }" @click="submitDelete">提交删除请求</view>
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
      doc: getLegalDoc('deleteData'),
      contactEmail: CONTACT_INFO.contactEmail,
      reason: '',
      dataTypes: [
        { key: 'drafts', title: '草稿与本地笔记', desc: '脱敏卡片草稿、个人笔记、临时记录。', checked: false },
        { key: 'uploads', title: '上传素材', desc: '您主动上传的图片、视频、排班截图等。', checked: false },
        { key: 'community', title: '社区内容', desc: '您发布的经验、评论、点赞收藏等。', checked: false },
        { key: 'schedule', title: '排班数据', desc: '排班识别结果、提醒时间、历史排班。', checked: false },
        { key: 'verify', title: '认证材料', desc: '医护认证相关图片或说明材料。', checked: false }
      ]
    }
  },

  computed: {
    hasSelected() {
      return this.dataTypes.some(item => item.checked)
    }
  },

  methods: {
    goBack() {
      uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/settings/settings' }) })
    },

    submitDelete() {
      if (!this.hasSelected) {
        uni.showToast({ title: '请至少选择一类数据', icon: 'none' })
        return
      }

      const request = {
        id: 'DELETE-' + Date.now(),
        createdAt: new Date().toISOString(),
        types: this.dataTypes.filter(item => item.checked).map(item => item.key),
        reason: this.reason,
        status: 'pending'
      }
      uni.setStorageSync('ytl_delete_request', request)

      uni.showModal({
        title: '删除请求已记录',
        content: `请求已记录在本机。如涉及云端数据，请同时通过 ${this.contactEmail} 使用注册账号联系方式提交，我们会在完成身份核验后反馈处理结果。`,
        showCancel: false,
        success: () => this.goBack()
      })
    }
  }
}
</script>

<style>
view, text, scroll-view, textarea {
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif;
}

.page { min-height: 100vh; background: #f5f5f7; }
.status-bar { height: 88rpx; }
.nav { height: 88rpx; padding: 0 34rpx; display: flex; align-items: center; justify-content: space-between; }
.back, .right { width: 64rpx; height: 64rpx; }
.back { border-radius: 50%; background: #fff; color: #1d1d1f; font-size: 54rpx; line-height: 56rpx; text-align: center; }
.nav-title { font-size: 34rpx; color: #1d1d1f; font-weight: 900; }
.content { height: calc(100vh - 176rpx); padding: 0 32rpx; }
.intro-card, .section, .form-card { margin-top: 24rpx; background: #fff; border-radius: 34rpx; padding: 34rpx; box-shadow: 0 12rpx 38rpx rgba(0, 0, 0, 0.035); }
.intro-title, .section-title, .form-title { display: block; font-size: 30rpx; color: #1d1d1f; font-weight: 900; }
.intro-text, .section-body { display: block; margin-top: 14rpx; font-size: 25rpx; line-height: 1.75; color: #515154; font-weight: 600; }
.data-row { display: flex; gap: 18rpx; padding: 24rpx 0; border-bottom: 1rpx solid #f2f2f7; }
.data-row:last-child { border-bottom: none; }
.checkbox { margin-top: 4rpx; width: 42rpx; height: 42rpx; border-radius: 50%; border: 3rpx solid #d2d2d7; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 22rpx; font-weight: 900; }
.checkbox.checked { background: #007aff; border-color: #007aff; }
.data-texts { flex: 1; }
.data-title { display: block; font-size: 27rpx; color: #1d1d1f; font-weight: 900; }
.data-desc { display: block; margin-top: 8rpx; font-size: 22rpx; line-height: 1.45; color: #86868b; font-weight: 600; }
.textarea { margin-top: 28rpx; width: 100%; height: 180rpx; padding: 24rpx; border-radius: 24rpx; background: #f5f5f7; font-size: 26rpx; line-height: 1.5; color: #1d1d1f; }
.submit-btn { margin-top: 28rpx; height: 90rpx; line-height: 90rpx; text-align: center; border-radius: 100rpx; background: #007aff; color: #fff; font-size: 28rpx; font-weight: 900; }
.submit-btn.disabled { background: #c7c7cc; }
.bottom-space { height: 90rpx; }
</style>
