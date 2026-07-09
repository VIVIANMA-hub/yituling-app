<template>
  <view class="page">
    <view class="status-bar"></view>
    <view class="nav">
      <view class="back-btn" @click="goBack">‹</view>
      <text class="nav-title">账户</text>
      <view class="placeholder"></view>
    </view>

    <scroll-view scroll-y class="scroll" :show-scrollbar="false">
      <!-- 未登录 -->
      <view v-if="!user.loggedIn" class="card hero-card">
        <text class="hero-title">登录一图灵账号</text>
        <text class="hero-sub">登录后可在线收同事的「同意/请假/备注」回执，提交社区帖子审核，并同步草稿到云端。</text>
        <view class="primary-btn" @click="goLogin">手机号登录 / 注册</view>
      </view>

      <!-- 已登录 -->
      <template v-else>
        <view class="card profile-card">
          <view class="avatar">{{ avatarText }}</view>
          <view class="profile-body">
            <text class="profile-name">{{ user.realName || user.nickname || '医生' }}</text>
            <text class="profile-phone">{{ user.phone }}</text>
            <text class="profile-vip" :class="{ active: user.isVip }">
              {{ user.isVip ? '一图灵 Pro 会员' : '普通用户' }}
            </text>
          </view>
        </view>

        <view class="card field-card">
          <view class="field-row" @click="editRealName">
            <text class="field-label">真实姓名（科室排班里用）</text>
            <view class="field-right">
              <text class="field-value">{{ user.realName || '未设置' }}</text>
              <text class="field-arrow">›</text>
            </view>
          </view>
          <view class="field-row" @click="editNickname">
            <text class="field-label">昵称</text>
            <view class="field-right">
              <text class="field-value">{{ user.nickname || '医生' }}</text>
              <text class="field-arrow">›</text>
            </view>
          </view>
          <view class="field-row" @click="editHospital">
            <text class="field-label">医院</text>
            <view class="field-right">
              <text class="field-value">{{ user.hospital || '未设置' }}</text>
              <text class="field-arrow">›</text>
            </view>
          </view>
          <view class="field-row" @click="editDepartment">
            <text class="field-label">科室</text>
            <view class="field-right">
              <text class="field-value">{{ user.department || '未设置' }}</text>
              <text class="field-arrow">›</text>
            </view>
          </view>
          <view class="field-row" @click="editTitle">
            <text class="field-label">职称</text>
            <view class="field-right">
              <text class="field-value">{{ user.title || '未设置' }}</text>
              <text class="field-arrow">›</text>
            </view>
          </view>
        </view>

        <view class="card nav-card">
          <view class="nav-row" @click="goMyNotes">
            <text class="nav-icon">📓</text>
            <view class="nav-body">
              <text class="nav-row-title">我的笔记云端管理</text>
              <text class="nav-row-desc">草稿 / 待审 / 已通过 / 被驳</text>
            </view>
            <text class="field-arrow">›</text>
          </view>
          <view class="nav-row" @click="goMyShares">
            <text class="nav-icon">📤</text>
            <view class="nav-body">
              <text class="nav-row-title">我的排班分享</text>
              <text class="nav-row-desc">已发布的分享 + 在线回执</text>
            </view>
            <text class="field-arrow">›</text>
          </view>
          <view class="nav-row" @click="goMyResponses">
            <text class="nav-icon">📥</text>
            <view class="nav-body">
              <text class="nav-row-title">我的响应历史</text>
              <text class="nav-row-desc">提交过的同意/请假/备注</text>
            </view>
            <text class="field-arrow">›</text>
          </view>
          <view class="nav-row" @click="goInvite">
            <text class="nav-icon">🎁</text>
            <view class="nav-body">
              <text class="nav-row-title">邀请同事 +20 灵点 / 人</text>
              <text class="nav-row-desc">分享邀请码 / 链接</text>
            </view>
            <text class="field-arrow">›</text>
          </view>
          <view class="nav-row" v-if="isAdmin" @click="goReview">
            <text class="nav-icon">⚖️</text>
            <view class="nav-body">
              <text class="nav-row-title">社区审核</text>
              <text class="nav-row-desc">仅审核员可见</text>
            </view>
            <text class="field-arrow">›</text>
          </view>
        </view>

        <view class="card nav-card">
          <view class="nav-row" @click="goPrivacy">
            <text class="nav-row-title">隐私政策</text>
            <text class="field-arrow">›</text>
          </view>
          <view class="nav-row" @click="goAgreement">
            <text class="nav-row-title">用户协议</text>
            <text class="field-arrow">›</text>
          </view>
          <view class="nav-row" @click="goDeleteData">
            <text class="nav-row-title">删除我的数据</text>
            <text class="field-arrow">›</text>
          </view>
        </view>

        <view class="logout-btn" @click="logout">退出登录</view>
      </template>
    </scroll-view>

    <AppTabBar active="account" />
  </view>
</template>

<script>
import AppTabBar from '@/components/app-tab-bar/app-tab-bar.vue'
import { safeBack } from '@/utils/nav.js'
import { getCallerIdentity, clearAuth, withAuth, isLoggedIn } from '@/utils/identity.js'

const ADMIN_UIDS = [
  // 与 cloudfunctions/notes-post/admins.json 保持一致；这里只是 UI 兜底
  // 真权限在云函数侧。提审前如果要"审核入口"在客户端隐藏，请把生产 admin uid 列在这
]

export default {
  components: { AppTabBar },
  data() {
    return {
      user: { loggedIn: false, uid: '', nickname: '', realName: '', phone: '', isVip: false }
    }
  },
  computed: {
    avatarText() {
      const name = this.user.realName || this.user.nickname || '医'
      return String(name).slice(0, 1)
    },
    isAdmin() {
      // 客户端简单匹配；服务端权限仍在 admins.json
      return this.user.loggedIn && ADMIN_UIDS.includes(this.user.uid)
    }
  },
  onShow() {
    this.refresh()
  },
  methods: {
    goBack() { safeBack('/pages/index/index') },
    refresh() {
      const id = getCallerIdentity()
      this.user = id.loggedIn
        ? { loggedIn: true, uid: id.uid, nickname: '', realName: '', phone: '', isVip: id.isVip }
        : { loggedIn: false, uid: '', nickname: '', realName: '', phone: '', isVip: false }
      // 从 storage 里取登录时缓存的 user 完整信息
      try {
        const cached = uni.getStorageSync('ytl_auth_user')
        if (cached) {
          const u = typeof cached === 'string' ? JSON.parse(cached) : cached
          if (u && u.uid) this.user = { ...this.user, ...u, loggedIn: true }
        }
      } catch (e) {}
    },
    goLogin() { uni.navigateTo({ url: '/pages/account/login' }) },
    goMyNotes() { uni.navigateTo({ url: '/pages/notes/mine' }) },
    goMyShares() { uni.navigateTo({ url: '/pages/schedule/my-shares' }) },
    goMyResponses() { uni.navigateTo({ url: '/pages/schedule/my-responses' }) },
    goInvite() { uni.navigateTo({ url: '/pages/account/invite' }) },
    goReview() { uni.navigateTo({ url: '/pages/admin/review' }) },
    goPrivacy() { uni.navigateTo({ url: '/pages/public/privacy' }) },
    goAgreement() { uni.navigateTo({ url: '/pages/public/agreement' }) },
    goDeleteData() { uni.navigateTo({ url: '/pages/account/delete-data' }) },
    async editRealName() {
      const cur = this.user.realName || ''
      const res = await new Promise(resolve => uni.showModal({
        title: '真实姓名',
        editable: true,
        placeholderText: '科室排班表里你的姓名，便于排班分享时自动绑定',
        content: cur,
        success: r => resolve(r.confirm ? (r.content || '').trim() : null)
      }))
      if (res == null) return
      await this._updateProfile({ realName: res })
    },
    async editNickname() {
      const cur = this.user.nickname || ''
      const res = await new Promise(resolve => uni.showModal({
        title: '昵称',
        editable: true,
        placeholderText: '社区/分享卡显示用',
        content: cur,
        success: r => resolve(r.confirm ? (r.content || '').trim() : null)
      }))
      if (res == null) return
      await this._updateProfile({ nickname: res })
    },
    async editHospital() {
      const cur = this.user.hospital || ''
      const res = await new Promise(resolve => uni.showModal({
        title: '医院',
        editable: true,
        placeholderText: '所在医院（自填，不会公开）',
        content: cur,
        success: r => resolve(r.confirm ? (r.content || '').trim() : null)
      }))
      if (res == null) return
      await this._updateProfile({ hospital: res })
    },
    async editDepartment() {
      const cur = this.user.department || ''
      const res = await new Promise(resolve => uni.showModal({
        title: '科室',
        editable: true,
        placeholderText: '如：放射科 / 急诊科',
        content: cur,
        success: r => resolve(r.confirm ? (r.content || '').trim() : null)
      }))
      if (res == null) return
      await this._updateProfile({ department: res })
    },
    async editTitle() {
      const cur = this.user.title || ''
      const res = await new Promise(resolve => uni.showModal({
        title: '职称',
        editable: true,
        placeholderText: '住院医师 / 主治医师 / 副主任 / 主任',
        content: cur,
        success: r => resolve(r.confirm ? (r.content || '').trim() : null)
      }))
      if (res == null) return
      await this._updateProfile({ title: res })
    },
    async _updateProfile(patch) {
      if (!isLoggedIn()) return
      uni.showLoading({ title: '保存中...' })
      try {
        const callRes = await uniCloud.callFunction({
          name: 'ytl-auth',
          data: withAuth({ action: 'update_profile', ...patch })
        })
        uni.hideLoading()
        const r = callRes && callRes.result
        if (!r || !r.ok) {
          uni.showModal({ title: '保存失败', content: (r && r.message) || '请稍后重试', showCancel: false })
          return
        }
        // 同步回 storage
        uni.setStorageSync('ytl_auth_user', JSON.stringify(r.user))
        if (r.user.realName || r.user.nickname) {
          uni.setStorageSync('user_name', r.user.realName || r.user.nickname)
        }
        uni.showToast({ title: '已保存', icon: 'success' })
        this.refresh()
      } catch (e) {
        uni.hideLoading()
        uni.showModal({ title: '网络异常', content: e && e.message || 'unknown', showCancel: false })
      }
    },
    logout() {
      uni.showModal({
        title: '退出登录',
        content: '退出后无法在线收回执 / 提交审核；本地草稿保留。',
        success: r => {
          if (r.confirm) {
            clearAuth()
            this.refresh()
            uni.showToast({ title: '已退出', icon: 'none' })
          }
        }
      })
    }
  }
}
</script>

<style>
.page { background: #F5F5F7; min-height: 100vh; }
.status-bar { height: var(--status-bar-height); background: #F5F5F7; }
.nav { display: flex; align-items: center; padding: 20rpx 24rpx; gap: 16rpx; }
.back-btn { font-size: 48rpx; color: #1F6FEB; width: 56rpx; }
.placeholder { width: 56rpx; }
.nav-title { font-size: 32rpx; font-weight: 700; color: #1D1D1F; flex: 1; }
.scroll { padding: 12rpx 24rpx 260rpx; }

.card { background: #fff; border-radius: 22rpx; padding: 24rpx; margin-bottom: 18rpx; }

.hero-card { text-align: center; padding: 40rpx 28rpx; }
.hero-title { display: block; font-size: 34rpx; font-weight: 800; color: #1D1D1F; margin-bottom: 12rpx; }
.hero-sub { display: block; font-size: 24rpx; color: #6E6E73; line-height: 1.6; margin-bottom: 28rpx; }
.primary-btn { padding: 22rpx; border-radius: 999rpx; background: #1F6FEB; color: #fff; font-size: 28rpx; font-weight: 700; }

.profile-card { display: flex; align-items: center; gap: 22rpx; }
.avatar { width: 96rpx; height: 96rpx; border-radius: 50%; background: #E8F2FF; color: #1F6FEB; font-size: 40rpx; font-weight: 800; text-align: center; line-height: 96rpx; }
.profile-body { display: flex; flex-direction: column; gap: 6rpx; flex: 1; }
.profile-name { font-size: 32rpx; font-weight: 800; color: #1D1D1F; }
.profile-phone { font-size: 24rpx; color: #6E6E73; }
.profile-vip { font-size: 22rpx; color: #98a2b3; }
.profile-vip.active { color: #B26A00; font-weight: 700; }

.field-card { padding: 8rpx 24rpx; }
.field-row { display: flex; justify-content: space-between; align-items: center; padding: 24rpx 0; border-bottom: 1rpx solid #ECEEF1; }
.field-row:last-child { border-bottom: none; }
.field-label { font-size: 26rpx; color: #1D1D1F; }
.field-right { display: flex; align-items: center; gap: 10rpx; }
.field-value { font-size: 24rpx; color: #6E6E73; max-width: 280rpx; }
.field-arrow { color: #C7C7CC; font-size: 30rpx; }

.nav-card { padding: 8rpx 24rpx; }
.nav-row { display: flex; align-items: center; gap: 18rpx; padding: 24rpx 0; border-bottom: 1rpx solid #ECEEF1; }
.nav-row:last-child { border-bottom: none; }
.nav-icon { font-size: 32rpx; width: 44rpx; text-align: center; }
.nav-body { flex: 1; display: flex; flex-direction: column; gap: 4rpx; }
.nav-row-title { font-size: 26rpx; color: #1D1D1F; font-weight: 600; }
.nav-row-desc { font-size: 20rpx; color: #98a2b3; }

.logout-btn { margin-top: 32rpx; padding: 22rpx; text-align: center; background: #fff; color: #D9342B; border-radius: 999rpx; font-size: 28rpx; font-weight: 700; }
</style>
