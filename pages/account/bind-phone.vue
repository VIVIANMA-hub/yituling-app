<template>
  <view class="page">
    <view class="status-bar"></view>
    <view class="nav">
      <view class="back-btn" @click="goBack">‹</view>
      <text class="nav-title">补绑手机号</text>
      <view class="placeholder"></view>
    </view>

    <view class="hero">
      <text class="hero-title">绑定手机号</text>
      <text class="hero-sub">用于接收账号安全通知、执行账号注销。本平台不存储登录密码，手机号仅作为业务联系方式。</text>
    </view>

    <view class="form">
      <view class="field">
        <text class="field-label">手机号</text>
        <input
          class="field-input"
          v-model="phone"
          type="number"
          maxlength="11"
          placeholder="11 位中国大陆手机号"
        />
      </view>

      <view class="field code-row">
        <view class="code-left">
          <text class="field-label">验证码</text>
          <input
            class="field-input"
            v-model="code"
            type="number"
            maxlength="6"
            placeholder="6 位验证码"
          />
        </view>
        <view
          class="code-btn"
          :class="{ disabled: cooldown > 0 || sending }"
          @click="sendCode"
        >
          {{ cooldown > 0 ? `${cooldown}s 后重发` : (sending ? '发送中…' : '获取验证码') }}
        </view>
      </view>

      <view v-if="hint" class="hint">{{ hint }}</view>

      <view class="primary-btn" :class="{ disabled: !canSubmit }" @click="submit">绑定</view>
      <view class="ghost-btn" @click="skip">稍后再说</view>
    </view>
  </view>
</template>

<script>
import { safeBack } from '@/utils/nav.js'
import { getCallerToken, saveAuthFromLoginResult } from '@/utils/identity.js'

export default {
  data() {
    return {
      phone: '',
      code: '',
      cooldown: 0,
      sending: false,
      submitting: false,
      hint: '',
      _cdTimer: null
    }
  },
  computed: {
    canSubmit() {
      return !this.submitting
        && /^1[3-9]\d{9}$/.test(this.phone)
        && /^\d{4,6}$/.test(this.code)
    }
  },
  onUnload() {
    if (this._cdTimer) clearInterval(this._cdTimer)
  },
  methods: {
    goBack() { safeBack('/pages/index/index') },
    skip() {
      uni.showModal({
        title: '稍后再说',
        content: '未绑定手机号时无法接收业务通知、找回账号或注销，确定跳过吗？',
        confirmText: '跳过',
        cancelText: '继续绑定',
        success: (r) => {
          if (r.confirm) safeBack('/pages/index/index')
        }
      })
    },
    startCooldown(sec) {
      this.cooldown = sec
      if (this._cdTimer) clearInterval(this._cdTimer)
      this._cdTimer = setInterval(() => {
        this.cooldown--
        if (this.cooldown <= 0) { clearInterval(this._cdTimer); this._cdTimer = null }
      }, 1000)
    },
    async sendCode() {
      if (!/^1[3-9]\d{9}$/.test(this.phone)) {
        this.hint = '请输入正确的手机号'
        return
      }
      if (this.cooldown > 0 || this.sending) return
      this.sending = true
      this.hint = ''
      try {
        const r = await uniCloud.callFunction({
          name: 'ytl-auth',
          data: { action: 'send_code', phone: this.phone }
        })
        const body = r && r.result
        if (!body || !body.ok) {
          this.hint = (body && body.message) || '发送失败'
          return
        }
        this.startCooldown(60)
        this.hint = body.hint || '验证码已发送，5 分钟内有效'
      } catch (e) {
        this.hint = '网络异常：' + (e && e.message || 'unknown')
      } finally {
        this.sending = false
      }
    },
    async submit() {
      if (!this.canSubmit) return
      const token = getCallerToken()
      if (!token) {
        this.hint = '登录状态已失效，请重新登录'
        setTimeout(() => uni.redirectTo({ url: '/pages/account/login' }), 1000)
        return
      }
      this.submitting = true
      this.hint = ''
      try {
        const r = await uniCloud.callFunction({
          name: 'ytl-auth',
          data: {
            action: 'bind_phone',
            token,
            phone: this.phone,
            code: this.code
          }
        })
        const body = r && r.result
        if (!body || !body.ok) {
          this.hint = (body && body.message) || '绑定失败'
          return
        }
        // 后端只返 user，没返 token；这里把现有 token 拼回去更新 user 缓存
        const merged = { ok: true, token, tokenExpiresAt: undefined, user: body.user }
        saveAuthFromLoginResult(merged)
        uni.showToast({ title: body.alreadyBound ? '已绑定' : '绑定成功', icon: 'success' })
        setTimeout(() => safeBack('/pages/index/index'), 600)
      } catch (e) {
        this.hint = '网络异常：' + (e && e.message || 'unknown')
      } finally {
        this.submitting = false
      }
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
.hero { padding: 30rpx 40rpx 0; }
.hero-title { font-size: 40rpx; font-weight: 800; color: #1D1D1F; display: block; }
.hero-sub { font-size: 24rpx; color: #6E6E73; margin-top: 12rpx; display: block; line-height: 1.5; }

.form {
  margin: 40rpx 24rpx;
  background: #fff;
  border-radius: 22rpx;
  padding: 32rpx;
}
.field { margin-bottom: 28rpx; }
.field-label { font-size: 24rpx; color: #6E6E73; display: block; margin-bottom: 12rpx; }
.field-input {
  background: #F5F5F7;
  border-radius: 14rpx;
  padding: 20rpx 22rpx;
  font-size: 32rpx;
}
.code-row { display: flex; gap: 16rpx; align-items: flex-end; }
.code-left { flex: 1; }
.code-btn {
  padding: 22rpx 24rpx;
  border-radius: 14rpx;
  background: #E8F2FF;
  color: #1F6FEB;
  font-size: 24rpx;
  font-weight: 700;
  white-space: nowrap;
  margin-bottom: 4rpx;
}
.code-btn.disabled { background: #F5F5F7; color: #98A2B3; }

.hint { font-size: 22rpx; color: #B26A00; padding: 12rpx 4rpx 0; }

.primary-btn {
  margin-top: 16rpx;
  padding: 24rpx;
  background: #1F6FEB;
  color: #fff;
  border-radius: 999rpx;
  text-align: center;
  font-size: 30rpx;
  font-weight: 700;
}
.primary-btn.disabled { background: #C7C7CC; }

.ghost-btn {
  margin-top: 16rpx;
  padding: 20rpx;
  text-align: center;
  color: #6E6E73;
  font-size: 26rpx;
}
</style>
