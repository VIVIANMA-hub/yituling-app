<template>
  <view class="page">
    <view class="status-bar"></view>
    <view class="nav">
      <view class="back-btn" @click="goBack">‹</view>
      <text class="nav-title">一图灵账号</text>
      <view class="placeholder"></view>
    </view>

    <view class="hero">
      <text class="hero-title">手机号登录 / 注册</text>
      <text class="hero-sub">仅用于排班协同、社区互动；不绑定任何医保 / 诊疗系统</text>
    </view>

    <view class="form">
      <view class="field">
        <text class="field-label">手机号</text>
        <input
          class="field-input"
          v-model="phone"
          type="number"
          maxlength="11"
          placeholder="11 位手机号"
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

      <view class="field" v-if="!hideInviteField">
        <text class="field-label">邀请码（选填）</text>
        <input
          class="field-input"
          v-model="inviteCode"
          maxlength="8"
          :disabled="lockInviteCode"
          placeholder="同事的 8 位邀请码，注册后双方可得灵点"
        />
      </view>

      <view class="agree-row">
        <view class="check-box" :class="{ on: agreed }" @click="agreed = !agreed">
          <text v-if="agreed">✓</text>
        </view>
        <text class="agree-text">
          已阅读并同意
          <text class="link" @click="openPrivacy">《隐私政策》</text>
          和
          <text class="link" @click="openTerms">《用户协议》</text>
        </text>
      </view>

      <view class="primary-btn" :class="{ disabled: !canLogin }" @click="login">登录</view>

      <!-- 第三方登录入口：仅 App / 微信小程序显示；H5 隐藏（uni-app 在 H5 无法拉起原生授权） -->
      <!-- #ifdef APP-PLUS || MP-WEIXIN -->
      <view v-if="hasOauthEntries" class="oauth-divider">
        <view class="divider-line"></view>
        <text class="divider-text">其他登录方式</text>
        <view class="divider-line"></view>
      </view>

      <view v-if="hasOauthEntries" class="oauth-stack">
        <!-- 微信登录：App-Plus + 微信小程序显示，绿色品牌色 -->
        <!-- #ifdef APP-PLUS || MP-WEIXIN -->
        <view class="oauth-btn wechat" @click="loginWechat">
          <text class="oauth-icon-img"></text>
          <text>使用微信登录</text>
        </view>
        <!-- #endif -->

        <!-- Sign in with Apple：仅 iOS App 显示；样式按苹果 HIG（黑底白字，撑满与主按钮一致，文本"通过 Apple 登录") -->
        <!-- #ifdef APP-PLUS -->
        <view v-if="isIos" class="oauth-btn apple" @click="loginApple">
          <text class="oauth-icon-img apple-logo"></text>
          <text>通过 Apple 登录</text>
        </view>
        <!-- #endif -->
      </view>
      <!-- #endif -->
    </view>
  </view>
</template>

<script>
import { safeBack } from '@/utils/nav.js'
import { saveAuthFromLoginResult } from '@/utils/identity.js'

export default {
  data() {
    return {
      phone: '',
      code: '',
      inviteCode: '',
      lockInviteCode: false,
      hideInviteField: false,
      cooldown: 0,
      sending: false,
      submitting: false,
      hint: '',
      agreed: false,
      isIos: false,
      hasOauthEntries: false,
      _cdTimer: null
    }
  },
  computed: {
    canLogin() {
      return !this.submitting
        && /^1[3-9]\d{9}$/.test(this.phone)
        && /^\d{4,6}$/.test(this.code)
        && this.agreed
    }
  },
  created() {
    try {
      const sys = uni.getSystemInfoSync && uni.getSystemInfoSync()
      this.isIos = !!(sys && (sys.platform === 'ios' || sys.osName === 'ios'))
    } catch (e) { this.isIos = false }
    // #ifdef APP-PLUS || MP-WEIXIN
    this.hasOauthEntries = true
    // #endif
  },
  onLoad(query) {
    // 邀请链接 deep link: ?c=xxxxxxxx 或 ?inviteCode=xxxxxxxx
    if (query && (query.c || query.inviteCode)) {
      this.inviteCode = String(query.c || query.inviteCode || '').slice(0, 8)
      this.lockInviteCode = true  // 锁定避免误改
    }
  },
  onUnload() {
    if (this._cdTimer) clearInterval(this._cdTimer)
  },
  methods: {
    goBack() { safeBack('/pages/index/index') },
    openPrivacy() { uni.navigateTo({ url: '/pages/public/privacy' }) },
    openTerms() { uni.navigateTo({ url: '/pages/public/agreement' }) },
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
    async login() {
      if (!this.canLogin) {
        if (!this.agreed) this.hint = '请先勾选同意《隐私政策》和《用户协议》'
        return
      }
      this.submitting = true
      this.hint = ''
      try {
        const r = await uniCloud.callFunction({
          name: 'ytl-auth',
          data: {
            action: 'login',
            phone: this.phone,
            code: this.code,
            inviteCode: (this.inviteCode || '').trim()
          }
        })
        const body = r && r.result
        if (!body || !body.ok) {
          this.hint = (body && body.message) || '登录失败'
          return
        }
        const ok = saveAuthFromLoginResult(body)
        if (!ok) {
          this.hint = '账号信息保存失败，请重试'
          return
        }
        if (body.invite && body.invite.ok) {
          uni.showToast({ title: '登录成功 · 邀请已关联', icon: 'success', duration: 2000 })
        } else {
          uni.showToast({ title: '登录成功', icon: 'success' })
        }
        setTimeout(() => safeBack('/pages/index/index'), 600)
      } catch (e) {
        this.hint = '网络异常：' + (e && e.message || 'unknown')
      } finally {
        this.submitting = false
      }
    },

    // 微信 / Apple OAuth 公共入口：先拉起原生授权 → 拿凭证 → 调 ytl-auth → saveAuth
    async oauthLogin(provider) {
      if (!this.agreed) {
        this.hint = '请先勾选同意《隐私政策》和《用户协议》再使用第三方登录'
        return
      }
      if (this.submitting) return
      this.submitting = true
      this.hint = ''
      try {
        // 第一步：拉起原生授权
        let authRes
        try {
          authRes = await new Promise((resolve, reject) => {
            uni.login({
              provider,
              scopes: provider === 'apple' ? 'fullName,email' : undefined,
              success: resolve,
              fail: reject
            })
          })
        } catch (e) {
          // 用户取消授权或系统异常
          const msg = (e && (e.errMsg || e.errmsg || e.message)) || ''
          if (/cancel|cancelled/i.test(msg)) {
            this.hint = '已取消授权'
          } else {
            this.hint = `${provider === 'weixin' ? '微信' : 'Apple'} 授权失败：${msg || 'unknown'}`
          }
          return
        }

        // 第二步：调云函数
        const data = { inviteCode: (this.inviteCode || '').trim() }
        if (provider === 'weixin') {
          data.action = 'login_wechat'
          data.code = authRes.code || (authRes.authResult && authRes.authResult.code)
          if (!data.code) {
            this.hint = '微信未返回授权 code，请重试'
            return
          }
        } else if (provider === 'apple') {
          data.action = 'login_apple'
          data.identityToken = authRes.identityToken || (authRes.authResult && authRes.authResult.identityToken)
          if (!data.identityToken) {
            this.hint = 'Apple 未返回 identityToken，请重试'
            return
          }
          if (authRes.userInfo || authRes.user) {
            data.user = authRes.userInfo || authRes.user
          }
        }

        const r = await uniCloud.callFunction({ name: 'ytl-auth', data })
        const body = r && r.result
        if (!body || !body.ok) {
          this.hint = (body && body.message) || `${provider === 'weixin' ? '微信' : 'Apple'} 登录失败`
          return
        }

        const saved = saveAuthFromLoginResult(body)
        if (!saved) {
          this.hint = '账号信息保存失败，请重试'
          return
        }

        // 第三步：若需补绑手机号，跳引导页（用户可在引导页选"稍后"返回）
        if (body.needBindPhone) {
          uni.showToast({ title: '登录成功', icon: 'success' })
          setTimeout(() => uni.redirectTo({ url: '/pages/account/bind-phone' }), 500)
        } else {
          uni.showToast({ title: '登录成功', icon: 'success' })
          setTimeout(() => safeBack('/pages/index/index'), 600)
        }
      } catch (e) {
        this.hint = '网络异常：' + (e && e.message || 'unknown')
      } finally {
        this.submitting = false
      }
    },
    loginWechat() { return this.oauthLogin('weixin') },
    loginApple() { return this.oauthLogin('apple') }
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
.hero-sub { font-size: 24rpx; color: #6E6E73; margin-top: 12rpx; display: block; }

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

.agree-row { display: flex; align-items: center; gap: 10rpx; margin: 28rpx 0 24rpx; }
.check-box {
  width: 36rpx; height: 36rpx; border-radius: 8rpx;
  border: 2rpx solid #C7C7CC;
  text-align: center;
  line-height: 32rpx;
  color: #fff;
  font-size: 24rpx;
}
.check-box.on { background: #1F6FEB; border-color: #1F6FEB; }
.agree-text { font-size: 22rpx; color: #6E6E73; flex: 1; }
.link { color: #1F6FEB; }

.primary-btn {
  margin-top: 12rpx;
  padding: 24rpx;
  background: #1F6FEB;
  color: #fff;
  border-radius: 999rpx;
  text-align: center;
  font-size: 30rpx;
  font-weight: 700;
}
.primary-btn.disabled { background: #C7C7CC; }

.oauth-divider {
  display: flex;
  align-items: center;
  margin: 40rpx 0 24rpx;
  gap: 16rpx;
}
.divider-line {
  flex: 1;
  height: 1rpx;
  background: #E5E5EA;
}
.divider-text {
  font-size: 22rpx;
  color: #98A2B3;
}

.oauth-stack {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
/* 与主登录按钮同宽同高同圆角，让 Apple 按钮符合 HIG"等价主按钮"规范 */
.oauth-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14rpx;
  padding: 24rpx;
  border-radius: 999rpx;
  font-size: 30rpx;
  font-weight: 700;
}
.oauth-btn.wechat {
  background: #07C160;  /* 微信品牌色 */
  color: #fff;
}
.oauth-btn.apple {
  /* 苹果 HIG: black-fill 样式 — 黑底白字 + Apple logo + 完整本地化文本 */
  background: #000;
  color: #fff;
}
.oauth-icon-img {
  font-size: 32rpx;
  line-height: 1;
}
.oauth-icon-img.apple-logo {
  /* iOS 字体下  渲染为苹果 logo；其他平台不显示，但 Apple 按钮仅在 iOS 出现 */
  font-size: 34rpx;
  margin-top: -4rpx;  /* 视觉对齐 */
}

</style>
