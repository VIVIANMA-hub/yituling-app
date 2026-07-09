<script>
export default {
  onLaunch: function(options) {
    console.log('App Launch');
    this.checkPrivacyAgreement();
    this.handleDeepLink(options);
  },
  onShow: function(options) {
    console.log('App Show');
    this.handleDeepLink(options);
  },
  onHide: function() {
    console.log('App Hide');
  },
  methods: {
    // yituling://schedule/respond?s=xxx → /pages/schedule/respond?s=xxx
    // yituling://invite?c=xxxxxxxx → /pages/account/login?c=xxxxxxxx
    handleDeepLink(options) {
      // 多个入口可能传 deep link：onLaunch/onShow options.query + plus.runtime.arguments（iOS URL Scheme）
      let raw = ''
      if (options && options.query) {
        // 微信小程序 / H5 query 直传场景
        if (options.query.s) {
          this._gotoRespond(options.query.s)
          return
        }
        if (options.query.c) {
          this._gotoLoginWithInvite(options.query.c)
          return
        }
      }
      // #ifdef APP-PLUS
      try {
        raw = (plus && plus.runtime && plus.runtime.arguments) || ''
      } catch (e) { raw = '' }
      if (!raw) return
      // 形如 yituling://schedule/respond?s=xxxx
      const mRespond = raw.match(/yituling:\/\/schedule\/respond\?s=([^&]+)/i)
      if (mRespond && mRespond[1]) {
        this._gotoRespond(decodeURIComponent(mRespond[1]))
        try { plus.runtime.arguments = '' } catch (e) {}
        return
      }
      // 形如 yituling://invite?c=xxxxxxxx
      const mInvite = raw.match(/yituling:\/\/invite\?c=([^&]+)/i)
      if (mInvite && mInvite[1]) {
        this._gotoLoginWithInvite(decodeURIComponent(mInvite[1]))
        try { plus.runtime.arguments = '' } catch (e) {}
        return
      }
      // 用完清空避免下次 onShow 重复跳
      try { plus.runtime.arguments = '' } catch (e) {}
      // #endif
    },
    _gotoRespond(shareId) {
      if (!shareId) return
      const url = `/pages/schedule/respond?s=${encodeURIComponent(shareId)}`
      setTimeout(() => {
        uni.navigateTo({ url, fail: () => uni.reLaunch({ url }) })
      }, 300)
    },
    _gotoLoginWithInvite(code) {
      if (!code) return
      const url = `/pages/account/login?c=${encodeURIComponent(code)}`
      setTimeout(() => {
        uni.navigateTo({ url, fail: () => uni.reLaunch({ url }) })
      }, 300)
    },
    checkPrivacyAgreement() {
      // 检查用户是否已同意隐私协议及免责声明
      const hasAgreed = uni.getStorageSync('hasAgreedDisclaimer');
      if (!hasAgreed) {
        // 如果未同意，跳转到强制声明页面或弹出全局 Modal
        uni.showModal({
          title: '服务条款与免责声明',
          content: '一图灵定位为医疗影像知识检索与教育参考工具。本软件提供的所有内容（含AI分析结果）仅供学习、交流和参考，不作为临床诊断、治疗或确诊的最终依据。使用本软件即表示您同意我们的《用户协议》与《隐私政策》。',
          confirmText: '我已阅读并同意',
          cancelText: '暂不使用',
          success: function (res) {
            if (res.confirm) {
              uni.setStorageSync('hasAgreedDisclaimer', true);
            } else if (res.cancel) {
              // 拒绝则退出应用或限制核心功能
              // #ifdef APP-PLUS
              plus.runtime.quit();
              // #endif
            }
          }
        });
      }
    }
  }
}
</script>

<style>
/* 全局极简工业风样式设定 */
page {
  background-color: #F8F9FA;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}
</style>