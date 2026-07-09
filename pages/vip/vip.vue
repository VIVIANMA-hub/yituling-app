<template>
  <view class="page">
    <view class="status-bar"></view>

    <view class="nav">
      <view class="back-btn" @click="goBack">‹</view>
      <view>
        <text class="nav-title">一图灵 Pro</text>
        <text class="nav-subtitle">排班 · 知识库 · 解剖资料</text>
      </view>
      <view class="nav-placeholder"></view>
    </view>

    <scroll-view scroll-y class="content" :show-scrollbar="false">
      <view class="hero-card">
        <text class="hero-label">PRO MEMBER</text>
        <text class="hero-title">拍照，即刻找资料</text>
        <text class="hero-desc">拍肘关节、手腕、腰椎等图像，按部位和模态整理学习资料线索、报告模板和知识库收藏。</text>
        <view class="hero-points">
          <text>拍照搜资料</text>
          <text>知识库归纳</text>
          <text>智能排班</text>
        </view>
      </view>

      <view class="focus-card">
        <text class="focus-kicker">Pro 专属能力</text>
        <text class="focus-title">拍照后，把资料整理到你的私人知识库</text>
        <text class="focus-desc">按部位、模态和主题归纳资料线索、报告模板和个人笔记。一图灵只做学习资料整理，不做诊断判断。</text>
      </view>

      <view class="demo-card">
        <text class="section-title">解剖学习卡</text>
        <view class="demo-visual">
          <view class="scan-panel">
            <view class="scan-top">
              <text>肘关节 X 线</text>
              <text>标注示例</text>
            </view>
            <view class="xray-frame">
              <view class="elbow-paper">
                <view class="arm upper-arm"></view>
                <view class="arm forearm-a"></view>
                <view class="arm forearm-b"></view>
                <view class="elbow-ring"></view>
                <view class="arrow arrow-a"></view>
                <view class="arrow arrow-b"></view>
                <view class="arrow arrow-c"></view>
                <text class="paper-title">肘关节</text>
                <text class="paper-label label-a">肱骨远端</text>
                <text class="paper-label label-b">桡骨头</text>
                <text class="paper-label label-c">尺骨鹰嘴</text>
              </view>
              <view class="mini-model">
                <text>3D 模型</text>
              </view>
              <view class="joint-core"></view>
            </view>
          </view>

          <view class="result-panel">
            <text class="result-title">已整理</text>
            <view class="result-item">肘关节解剖</view>
            <view class="result-item">X 线体位</view>
            <view class="result-item">报告表达参考</view>
            <view class="library-chip">存入知识库</view>
            <text class="demo-note">学习标注，不作诊断</text>
          </view>
        </view>
      </view>

      <view class="workflow-card">
        <text class="section-title">开通后怎么用</text>
        <view class="workflow">
          <view class="workflow-step" v-for="item in workflow" :key="item.title">
            <view class="step-index">{{ item.index }}</view>
            <text class="step-title">{{ item.title }}</text>
            <text class="step-desc">{{ item.desc }}</text>
          </view>
        </view>
      </view>

      <view class="section-card">
        <text class="section-title">Pro 权益</text>
        <view class="benefit-grid">
          <view class="pro-card" v-for="item in proFeatures" :key="item.name">
            <text class="pro-card-icon">{{ item.icon }}</text>
            <text class="pro-card-kicker">{{ item.kicker }}</text>
            <text class="pro-card-title">{{ item.name }}</text>
            <text class="pro-card-desc">{{ item.desc }}</text>
          </view>
        </view>
      </view>

      <view class="section-card" v-if="canPurchase">
        <text class="section-title">选择套餐</text>
        <view
          class="plan-card"
          v-for="(plan, index) in plans"
          :key="plan.id"
          :class="{ active: activePlan === index }"
          @click="activePlan = index"
        >
          <view>
            <view class="plan-name-row">
              <text class="plan-name">{{ plan.name }}</text>
              <text v-if="plan.tag" class="plan-tag">{{ plan.tag }}</text>
            </view>
            <text class="plan-desc">{{ plan.desc }}</text>
            <view class="plan-benefits">
              <text v-for="benefit in plan.benefits" :key="benefit">✓ {{ benefit }}</text>
            </view>
          </view>
          <view class="price-box">
            <text class="price">¥{{ plan.price }}</text>
            <text class="period">/{{ plan.period }}</text>
          </view>
        </view>
      </view>

      <view class="section-card" v-if="canPurchase">
        <text class="section-title">开票偏好</text>
        <view class="invoice-option-list">
          <view
            class="invoice-option"
            v-for="item in invoicePreferenceOptions"
            :key="item.key"
            :class="{ active: invoicePreference === item.key }"
            @click="invoicePreference = item.key"
          >
            <view>
              <text class="invoice-option-title">{{ item.title }}</text>
              <text class="invoice-option-desc">{{ item.desc }}</text>
            </view>
            <text class="invoice-option-check">{{ invoicePreference === item.key ? '✓' : '' }}</text>
          </view>
        </view>
        <text class="invoice-note">普票与专票均不加价。Apple IAP 订单走 Apple 票据路径；其他支付方式可发邮件至 yituling0619@foxmail.com 申请发票。</text>
      </view>

      <view class="section-card">
        <view class="section-title-row">
          <text class="section-title no-margin">免费用 Pro</text>
          <text class="section-tag">灵点计划</text>
        </view>
        <view class="points-panel">
          <view class="points-item">
            <text class="points-label">当前灵点</text>
            <text class="points-value">{{ currentPoints }}</text>
          </view>
          <view class="points-item">
            <text class="points-label">可用Pro天数</text>
            <text class="points-value">{{ currentProDays }}</text>
          </view>
        </view>
        <view class="free-plan">
          <view class="free-step" v-for="item in freePlans" :key="item.title">
            <text class="free-days">{{ item.reward }}</text>
            <view>
              <text class="free-title">{{ item.title }}</text>
              <text class="free-desc">{{ item.desc }}</text>
            </view>
          </view>
          <view class="free-actions">
            <view class="free-btn primary-free" @click="goAnonymize">发布病例</view>
            <view class="free-btn" @click="watchRewardedAd">看广告领灵点</view>
          </view>
          <view class="free-actions second-row">
            <view class="free-btn" @click="goTasks">任务中心</view>
            <view class="free-btn" @click="showPointsRule">灵点规则</view>
          </view>
          <view class="free-actions second-row">
            <view class="free-btn" @click="goCommunity">去社区</view>
            <view class="free-btn primary-free" @click="exchangeOneDayPro">100灵点兑1天Pro</view>
          </view>
          <text class="free-note">灵点可兑换 Pro 体验，也可用于智能排班和图文学习卡。内容奖励需脱敏并通过审核。</text>
        </view>
      </view>

      <view class="notice-card">
        <text class="notice-title">说明</text>
        <text class="notice-text" v-if="canPurchase">支付成功后自动开通。开票申请可在发票中心提交，发票咨询：客服 QQ {{ contactQQ }}。</text>
        <text class="notice-text">会员售后支持：微信 {{ contactWechat }} / 电话 {{ contactPhone }} / 邮箱 {{ contactEmail }}。</text>
        <view class="invoice-center-btn" v-if="canPurchase" @click="goInvoiceCenter">进入发票中心</view>
      </view>

      <view class="bottom-space"></view>
    </scroll-view>

    <view class="footer" v-if="canPurchase">
      <view class="footer-summary">
        <text>{{ selectedPlan.name }}</text>
        <text>¥{{ selectedPlan.price }}/{{ selectedPlan.period }}</text>
      </view>
      <view class="primary-btn" @click="handlePay">继续开通</view>
      <text class="agreement-text">开通即同意会员服务规则</text>
    </view>
  </view>
</template>

<script>
import {
  POINT_RULES,
  claimDailyAdReward,
  exchangePointsForProDay,
  getPointDashboard
} from '@/utils/points.js'
import { CONTACT_INFO } from '@/utils/legalDocs.js'
import { getCallerToken } from '@/utils/identity.js'

export default {
  data() {
    return {
      userName: '医生',
      activePlan: 1,
      activePay: '',
      rewardAdpid: '',
      rewardedVideoAd: null,
      invoicePreference: 'none',
      currentPoints: 0,
      currentProDays: 0,
      contactQQ: CONTACT_INFO.contactQQ,
      contactWechat: CONTACT_INFO.contactWechat,
      contactPhone: CONTACT_INFO.contactPhone,
      contactEmail: CONTACT_INFO.contactEmail,
      workflow: [
        { index: '1', title: '拍照/截图', desc: '选择肘关节、手腕、腰椎等图像' },
        { index: '2', title: '整理线索', desc: '按部位和模态生成检索词' },
        { index: '3', title: '存入知识库', desc: '资料、模板、笔记下次一搜就到' }
      ],
      proFeatures: [
        { icon: '📸', kicker: 'PHOTO', name: '拍照搜资料', desc: '按部位和模态整理学习线索。' },
        { icon: '📚', kicker: 'LIBRARY', name: '知识库归档', desc: '链接、截图、笔记下次一搜就到。' },
        { icon: '📅', kicker: 'SCHEDULE', name: '智能排班', desc: '历史排班整理成清楚日历。' },
        { icon: '✍️', kicker: 'ARTICLE', name: '图文学习卡', desc: '根据资料生成可收藏的学习文章。' }
      ],
      freePlans: [
        { reward: '+80灵点', title: '每日签到', desc: '完成签到后到账 80 灵点。' },
        { reward: '+20灵点', title: '看广告领灵点', desc: '完成激励视频后可再得 20 灵点。' },
        { reward: '+20灵点', title: '发帖审核通过', desc: '脱敏帖子通过审核后到账 20 灵点。' },
        { reward: '+20灵点', title: '有效分享排班图', desc: '完成有效分享后获得 20 灵点。' }
      ],
      plans: [
        {
          id: 'pro_trial_month',
          name: '首月体验',
          price: '9.9',
          period: '月',
          desc: '先体验核心能力。',
          tag: '新用户',
          benefits: ['拍照搜资料', '知识库归纳', '上班提醒']
        },
        {
          id: 'pro_early_year',
          name: '早鸟年费',
          price: '99',
          period: '年',
          desc: '适合长期使用，价格最划算。',
          tag: '推荐',
          benefits: ['全年拍照搜资料', '知识库归档', '排班草稿', '图文学习卡']
        },
        {
          id: 'pro_month',
          name: '标准月付',
          price: '19.9',
          period: '月',
          desc: '按月开通，随用随续。',
          tag: '',
          benefits: ['拍照搜资料', '知识库归档', '图文学习卡']
        }
      ],
      // payMethods 按平台动态生成（created 钩子里填充），避免 iOS 显示支付宝/微信支付/银行卡（4.8 条违规）
      payMethods: [],
      // 方案 C：iOS V1.0 不开放任何应用内购买（会员 + 灵点充值都不卖），只保留靠任务赚取/兑换的灵点。
      // 默认 false（含 iOS 与无法判定的兜底），仅在确认的可售平台显式置 true。
      // 后续接 Apple IAP 时：在 created() iOS 分支里 push 回 apple_iap 项 + canPurchase = true 即可。
      canPurchase: false,
      invoicePreferenceOptions: [
        { key: 'none', title: '不开发票', desc: '先开通会员，后续按需补申请。' },
        { key: 'normal', title: '普通发票', desc: '用于常规报销场景。' },
        { key: 'special', title: '专用发票', desc: '用于企业进项场景。' }
      ]
    }
  },
  computed: {
    selectedPlan() {
      return this.plans[this.activePlan]
    },
    pointsToExchangeOneDay() {
      return POINT_RULES.pro_exchange_cost
    }
  },
  created() {
    // 按平台决定是否开放应用内购买，以及可用支付方式。
    // 方案 C：iOS（APP-PLUS 且 platform=ios）V1.0 完全不卖 —— payMethods 留空 + canPurchase=false，
    // 只保留靠任务赚取/兑换的灵点，绕开 Apple 3.1.1 / 4.8，加快首次审核。
    const methods = []
    let canPurchase = false
    // #ifdef APP-PLUS
    try {
      const sys = uni.getSystemInfoSync && uni.getSystemInfoSync()
      const isIos = !!(sys && (sys.platform === 'ios' || sys.osName === 'ios'))
      if (isIos) {
        // iOS V1.0：不开放内购，methods 保持空、canPurchase=false。
        // 接入 Apple IAP 后改回：methods.push({ key:'apple_iap', name:'Apple 内购', platform:'ios_iap', desc:'通过 Apple ID 支付' }); canPurchase = true
      } else {
        methods.push({ key: 'wxpay', name: '微信支付', platform: 'android_wxpay', desc: '推荐' })
        methods.push({ key: 'alipay', name: '支付宝', platform: 'android_alipay', desc: '支持银行卡' })
        canPurchase = true
      }
    } catch (e) {
      // 判定失败时保守处理：不开放购买（宁可安卓少卖，也不让 iOS 误显非 IAP 支付）
      canPurchase = false
    }
    // #endif
    // #ifdef MP-WEIXIN
    methods.push({ key: 'wxpay', name: '微信支付', platform: 'mp_wxpay', desc: '小程序原生' })
    canPurchase = true
    // #endif
    // #ifdef H5
    methods.push({ key: 'wxpay', name: '微信支付', platform: 'h5_wxpay', desc: '扫码或公众号内' })
    methods.push({ key: 'alipay', name: '支付宝', platform: 'h5_alipay', desc: '支持银行卡' })
    canPurchase = true
    // #endif
    this.payMethods = methods
    this.canPurchase = canPurchase
  },
  onShow() {
    const storedName = uni.getStorageSync('user_name')
    if (storedName) this.userName = storedName
    this.syncPointsState()
    this.initRewardedAd()
  },
  methods: {
    syncPointsState() {
      const dash = getPointDashboard()
      this.currentPoints = dash.points
      this.currentProDays = dash.proDays
    },
    goBack() {
      uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
    },
    goAnonymize() {
      uni.navigateTo({ url: '/pages/anonymize/anonymize' })
    },
    goCommunity() {
      uni.navigateTo({ url: '/pages/notes/notes' })
    },
    goTasks() {
      uni.navigateTo({ url: '/pages/tasks/tasks' })
    },
    goInvoiceCenter() {
      uni.navigateTo({ url: '/pages/invoice/invoice' })
    },
    showPointsRule() {
      uni.showModal({
        title: '灵点规则',
        content: '每日签到+80灵点。看广告+20，发帖审核通过+20，有效分享排班图+20，邀请注册+20。100灵点可兑换1天Pro，灵点不可提现、不可转账。',
        showCancel: false
      })
    },
    initRewardedAd() {
      if (!this.rewardAdpid || this.rewardedVideoAd) return
      if (!uni.createRewardedVideoAd) return
      try {
        const ad = uni.createRewardedVideoAd({ adpid: this.rewardAdpid })
        ad.onClose((res) => {
          if (res && res.isEnded) {
            this.grantAdReward()
          } else {
            uni.showToast({ title: '看完广告后才能领取灵点', icon: 'none' })
          }
        })
        ad.onError(() => {
          uni.showToast({ title: '广告暂不可用', icon: 'none' })
        })
        this.rewardedVideoAd = ad
      } catch (e) {}
    },
    watchRewardedAd() {
      if (!this.rewardAdpid) {
        uni.showModal({
          title: '广告位待配置',
          content: '上线前在 DCloud uni-ad 创建激励视频广告位，并把 adpid 填入 rewardAdpid 后即可启用。',
          showCancel: false
        })
        return
      }
      if (!this.rewardedVideoAd) {
        this.initRewardedAd()
      }
      if (!this.rewardedVideoAd) {
        uni.showToast({ title: '当前环境暂不支持激励视频', icon: 'none' })
        return
      }
      this.rewardedVideoAd.show().catch(() => {
        this.rewardedVideoAd.load()
          .then(() => this.rewardedVideoAd.show())
          .catch(() => uni.showToast({ title: '广告加载失败', icon: 'none' }))
      })
    },
    grantAdReward() {
      const result = claimDailyAdReward()
      if (!result.ok) {
        if (result.reason === 'duplicate') {
          uni.showToast({ title: '今日广告奖励已领取', icon: 'none' })
          return
        }
        uni.showToast({ title: '领取失败，请稍后重试', icon: 'none' })
        return
      }
      this.syncPointsState()
      uni.showModal({
        title: '灵点已到账',
        content: `本次获得 ${POINT_RULES.rewarded_ad} 灵点，当前共 ${result.points} 灵点。`,
        showCancel: false
      })
    },
    async exchangeOneDayPro() {
      uni.showLoading({ title: '兑换中…', mask: true })
      let result
      try {
        result = await exchangePointsForProDay()
      } catch (e) {
        result = { ok: false, reason: 'network', message: e && e.message }
      }
      uni.hideLoading()
      if (!result.ok) {
        if (result.reason === 'insufficient') {
          uni.showToast({ title: `需要 ${POINT_RULES.pro_exchange_cost} 灵点`, icon: 'none' })
          return
        }
        if (result.reason === 'network') {
          uni.showToast({ title: '网络异常，请稍后重试', icon: 'none' })
          return
        }
        uni.showToast({ title: result.message || '兑换失败，请稍后重试', icon: 'none' })
        return
      }
      this.syncPointsState()
      const expiryHint = result.vipExpiresAt
        ? `\nPro 到期：${new Date(result.vipExpiresAt).toLocaleDateString()}`
        : ''
      uni.showModal({
        title: '兑换成功',
        content: `已消耗 ${POINT_RULES.pro_exchange_cost} 灵点，兑换 1 天 Pro。${expiryHint}`,
        showCancel: false
      })
    },
    handlePay() {
      if (!this.payMethods.length) {
        uni.showToast({ title: '当前平台暂不支持开通，请在 App 内尝试', icon: 'none' })
        return
      }
      uni.showActionSheet({
        itemList: this.payMethods.map(item => item.name + (item.desc ? ` · ${item.desc}` : '')),
        success: (res) => {
          const pay = this.payMethods[res.tapIndex]
          this.activePay = pay.key
          this.buyVip(pay)
        }
      })
    },
    // 调 ytl-payment create_order 拿真实支付参数，再唤起 uni.requestPayment
    async buyVip(pay) {
      const token = getCallerToken()
      if (!token) {
        uni.showModal({
          title: '请先登录',
          content: '开通会员需要登录一图灵账号',
          confirmText: '去登录',
          success: (r) => { if (r.confirm) uni.navigateTo({ url: '/pages/account/login' }) }
        })
        return
      }
      const productId = this.selectedPlan.id
      uni.showLoading({ title: '下单中…' })
      try {
        const r = await uniCloud.callFunction({
          name: 'ytl-payment',
          data: { action: 'create_order', token, productId, platform: pay.platform }
        })
        uni.hideLoading()
        const body = r && r.result
        if (!body || !body.ok) {
          uni.showModal({
            title: '下单失败',
            content: (body && body.message) || `错误码 ${(body && body.code) || 'UNKNOWN'}`,
            showCancel: false
          })
          return
        }
        // mock 路径：服务端已立即标 paid + 发权益，直接刷新本地点数即可
        if (body.mock || body.paid) {
          uni.showToast({ title: 'VIP 已开通（开发态）', icon: 'success' })
          this.syncPointsState()
          return
        }
        // Real 路径：按 platform 唤起原生支付
        if (pay.platform === 'ios_iap') {
          await this.invokeAppleIap({ token, orderId: body.orderId, productId: body.payParams.productId })
        } else if (pay.platform.includes('wxpay')) {
          await this.invokeWxpay({ orderInfo: body.payParams })
        } else if (pay.platform.includes('alipay')) {
          await this.invokeAlipay({ orderInfo: body.payParams })
        }
      } catch (e) {
        uni.hideLoading()
        uni.showModal({ title: '网络异常', content: String(e && e.message || e), showCancel: false })
      }
    },
    invokeAppleIap({ token, orderId, productId }) {
      return new Promise((resolve) => {
        uni.requestPayment({
          provider: 'appleiap',
          orderInfo: productId,
          success: async (r) => {
            // StoreKit 成功后把 receipt 回传服务端验签
            try {
              const verifyR = await uniCloud.callFunction({
                name: 'ytl-payment',
                data: { action: 'apple_verify', token, orderId, receipt: r.transactionReceipt }
              })
              const vb = verifyR && verifyR.result
              if (vb && vb.ok) {
                uni.showToast({ title: '会员已开通', icon: 'success' })
                this.syncPointsState()
              } else {
                uni.showModal({ title: '验签失败', content: (vb && vb.message) || '请重启 App 后重试', showCancel: false })
              }
            } catch (e) {
              uni.showModal({ title: '验签网络异常', content: String(e && e.message || e), showCancel: false })
            }
            resolve()
          },
          fail: (err) => {
            uni.showToast({ title: '已取消或失败', icon: 'none' })
            console.log('[vip] appleiap fail:', err)
            resolve()
          }
        })
      })
    },
    invokeWxpay({ orderInfo }) {
      return new Promise((resolve) => {
        uni.requestPayment({
          provider: 'wxpay',
          orderInfo,  // ytl-payment 返回的 payParams（含 appid/partnerid/prepayid/package/noncestr/timestamp/sign）
          success: () => {
            uni.showToast({ title: '支付成功，等待到账', icon: 'success' })
            // 微信支付走服务端 wxpay_notify 回调发权益；客户端只 toast 然后 1-2s 后刷新
            setTimeout(() => this.syncPointsState(), 1500)
            resolve()
          },
          fail: (err) => {
            const msg = (err && err.errMsg) || ''
            if (/cancel/i.test(msg)) uni.showToast({ title: '已取消', icon: 'none' })
            else uni.showModal({ title: '微信支付失败', content: msg || '请重试', showCancel: false })
            resolve()
          }
        })
      })
    },
    invokeAlipay({ orderInfo }) {
      return new Promise((resolve) => {
        uni.requestPayment({
          provider: 'alipay',
          orderInfo: orderInfo && orderInfo.sdkOrderInfo ? orderInfo.sdkOrderInfo : orderInfo,
          success: () => {
            uni.showToast({ title: '支付成功，等待到账', icon: 'success' })
            setTimeout(() => this.syncPointsState(), 1500)
            resolve()
          },
          fail: (err) => {
            const msg = (err && err.errMsg) || ''
            if (/cancel/i.test(msg)) uni.showToast({ title: '已取消', icon: 'none' })
            else uni.showModal({ title: '支付宝失败', content: msg || '请重试', showCancel: false })
            resolve()
          }
        })
      })
    },
    createOrder(pay) {
      const orderSource = pay.key === 'apple_iap' ? 'iap_apple' : 'self_pay'
      const order = {
        id: `YTL${Date.now()}`,
        planId: this.selectedPlan.id,
        planName: this.selectedPlan.name,
        amount: this.selectedPlan.price,
        channel: pay.key,
        orderSource,
        invoicePreference: this.invoicePreference,
        invoiceEligibility: orderSource === 'iap_apple' ? 'apple_only' : 'self_pay_only',
        status: 'pending',
        createdAt: new Date().toISOString()
      }
      const list = uni.getStorageSync('ytl_pending_orders') || []
      list.unshift(order)
      uni.setStorageSync('ytl_pending_orders', list)
      uni.showModal({
        title: '已生成开通订单',
        content: `套餐：${order.planName}\n金额：¥${order.amount}\n支付方式：${pay.name}\n开票偏好：${this.getInvoicePreferenceLabel(order.invoicePreference)}`,
        showCancel: false,
        success: (res) => {
          if (!res.confirm && order.invoicePreference === 'none') return
          if (order.invoiceEligibility === 'apple_only') {
            uni.showModal({
              title: 'Apple IAP 发票说明',
              content: '该订单发票请通过 Apple 账单路径获取，一图灵端不受理此订单开票申请。',
              showCancel: false
            })
            return
          }
          if (order.invoicePreference === 'none') return
          uni.showModal({
            title: '去发票中心',
            content: '订单已创建，是否现在去发票中心提交开票申请？',
            confirmText: '去提交',
            success: (goRes) => {
              if (goRes.confirm) {
                uni.navigateTo({ url: '/pages/invoice/invoice' })
              }
            }
          })
        },
        fail: () => {
          if (order.invoiceEligibility === 'apple_only') {
            uni.showModal({
              title: 'Apple IAP 发票说明',
              content: '该订单发票请通过 Apple 账单路径获取，一图灵端不受理此订单开票申请。',
              showCancel: false
            })
          }
        }
      })
    },
    getInvoicePreferenceLabel(key = '') {
      const map = {
        none: '不开发票',
        normal: '普通发票',
        special: '专用发票'
      }
      return map[key] || '不开发票'
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
  background: #050505;
  color: #f8fafc;
}

.status-bar {
  height: 88rpx;
}

.nav {
  min-height: 104rpx;
  padding: 0 32rpx 12rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.back-btn,
.nav-placeholder {
  width: 66rpx;
  height: 66rpx;
  flex-shrink: 0;
}

.back-btn {
  border-radius: 50%;
  background: #111;
  color: #f8fafc;
  font-size: 56rpx;
  line-height: 60rpx;
  text-align: center;
  font-weight: 900;
}

.nav-title,
.nav-subtitle {
  display: block;
  text-align: center;
}

.nav-title {
  font-size: 34rpx;
  font-weight: 900;
  color: #ffe16a;
}

.nav-subtitle {
  margin-top: 4rpx;
  color: #8c8c91;
  font-size: 20rpx;
  font-weight: 700;
}

.content {
  height: calc(100vh - 192rpx);
  padding: 0 32rpx;
}

.hero-card,
.section-card,
.workflow-card,
.focus-card,
.demo-card,
.notice-card {
  margin-top: 24rpx;
  border-radius: 28rpx;
  background: #1c1c1e;
  box-shadow: none;
}

.hero-card {
  padding: 36rpx;
  background: linear-gradient(135deg, #05070a 0%, #14100a 58%, #3b2908 100%);
  color: #fff7df;
  border: 1rpx solid rgba(245, 196, 90, 0.45);
  box-shadow: 0 24rpx 62rpx rgba(24, 18, 6, 0.24);
  position: relative;
  overflow: hidden;
}

.hero-label {
  position: relative;
  z-index: 1;
  display: block;
  color: #f7c85f;
  font-size: 22rpx;
  font-weight: 900;
  letter-spacing: 0;
}

.hero-title {
  position: relative;
  z-index: 1;
  display: block;
  margin-top: 12rpx;
  font-size: 48rpx;
  line-height: 1.2;
  font-weight: 900;
  color: #fff7df;
}

.hero-desc {
  position: relative;
  z-index: 1;
  display: block;
  margin-top: 16rpx;
  color: rgba(255, 247, 223, 0.84);
  font-size: 25rpx;
  line-height: 1.55;
  font-weight: 750;
}

.hero-points {
  position: relative;
  z-index: 1;
  margin-top: 26rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.hero-points text {
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(247, 200, 95, 0.14);
  color: #f7c85f;
  font-size: 21rpx;
  font-weight: 900;
  border: 1rpx solid rgba(247, 200, 95, 0.26);
}

.focus-card {
  margin-top: 24rpx;
  padding: 30rpx;
  border-radius: 28rpx;
  background: #1c1c1e;
  border: 1rpx solid #2f2f32;
  box-shadow: none;
}

.focus-kicker {
  display: block;
  color: #ffe16a;
  font-size: 22rpx;
  font-weight: 900;
}

.focus-title {
  display: block;
  margin-top: 12rpx;
  color: #f8fafc;
  font-size: 34rpx;
  line-height: 1.32;
  font-weight: 900;
}

.focus-desc {
  display: block;
  margin-top: 14rpx;
  color: #a1a1aa;
  font-size: 23rpx;
  line-height: 1.5;
  font-weight: 700;
}

.section-card,
.workflow-card,
.focus-card,
.demo-card,
.notice-card {
  padding: 28rpx;
}

.demo-card {
  background: #111;
  border: 1rpx solid #2a2a2d;
}

.demo-visual {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 18rpx;
  align-items: stretch;
}

.scan-panel,
.result-panel {
  border-radius: 24rpx;
  overflow: hidden;
}

.scan-panel {
  min-height: 300rpx;
  background: #050505;
  padding: 18rpx;
  border: 1rpx solid rgba(255, 225, 106, 0.2);
}

.scan-top {
  display: flex;
  justify-content: space-between;
  color: rgba(255, 247, 223, 0.76);
  font-size: 18rpx;
  font-weight: 900;
}

.xray-frame {
  position: relative;
  margin-top: 18rpx;
  height: 228rpx;
  border-radius: 18rpx;
  background: #f8f5ea;
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.elbow-paper {
  position: absolute;
  inset: 0;
}

.arm {
  position: absolute;
  border-radius: 999rpx;
  opacity: 0.76;
  box-shadow: inset 0 0 16rpx rgba(255, 255, 255, 0.3);
}

.upper-arm {
  width: 52rpx;
  height: 154rpx;
  left: 105rpx;
  top: 4rpx;
  background: #c8c783;
}

.forearm-a {
  width: 42rpx;
  height: 146rpx;
  left: 82rpx;
  top: 100rpx;
  background: #65c7c8;
  transform: rotate(18deg);
}

.forearm-b {
  width: 48rpx;
  height: 150rpx;
  left: 142rpx;
  top: 96rpx;
  background: #7e6ad4;
  transform: rotate(-18deg);
}

.elbow-ring {
  position: absolute;
  left: 92rpx;
  top: 100rpx;
  width: 92rpx;
  height: 76rpx;
  border-radius: 48%;
  border: 4rpx dashed rgba(39, 39, 42, 0.42);
}

.joint-core {
  position: absolute;
  left: 116rpx;
  top: 118rpx;
  width: 38rpx;
  height: 38rpx;
  border-radius: 50%;
  background: rgba(34, 197, 94, 0.34);
  border: 3rpx solid rgba(34, 197, 94, 0.76);
}

.arrow {
  position: absolute;
  height: 4rpx;
  border-radius: 999rpx;
  transform-origin: left center;
}

.arrow-a {
  left: 18rpx;
  top: 72rpx;
  width: 84rpx;
  background: #f59e0b;
  transform: rotate(7deg);
}

.arrow-b {
  left: 26rpx;
  top: 162rpx;
  width: 70rpx;
  background: #06b6d4;
  transform: rotate(-14deg);
}

.arrow-c {
  right: 16rpx;
  top: 144rpx;
  width: 72rpx;
  background: #7c3aed;
  transform: rotate(165deg);
}

.paper-title,
.paper-label {
  position: absolute;
  color: #3730a3;
  line-height: 1.2;
  font-weight: 900;
}

.paper-title {
  left: 20rpx;
  top: 12rpx;
  font-size: 24rpx;
}

.paper-label {
  font-size: 17rpx;
}

.label-a {
  left: 14rpx;
  top: 48rpx;
  color: #b45309;
}

.label-b {
  left: 14rpx;
  top: 138rpx;
  color: #0e7490;
}

.label-c {
  right: 12rpx;
  top: 112rpx;
  color: #6d28d9;
}

.mini-model {
  position: absolute;
  right: 12rpx;
  top: 12rpx;
  width: 78rpx;
  height: 78rpx;
  border-radius: 50%;
  background: #fff;
  border: 1rpx solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475467;
  font-size: 16rpx;
  font-weight: 900;
}

.result-panel {
  min-height: 300rpx;
  padding: 22rpx;
  background: #1c1c1e;
  border: 1rpx solid #2f2f32;
}

.result-title {
  display: block;
  color: #ffe16a;
  font-size: 22rpx;
  font-weight: 900;
}

.result-item {
  margin-top: 14rpx;
  padding: 16rpx;
  border-radius: 16rpx;
  background: #fff;
  color: #111827;
  font-size: 22rpx;
  font-weight: 900;
  border: 1rpx solid rgba(234, 210, 141, 0.6);
}

.library-chip {
  margin-top: 18rpx;
  min-height: 54rpx;
  border-radius: 999rpx;
  background: #111827;
  color: #ffe16a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 21rpx;
  font-weight: 900;
}

.demo-note {
  display: block;
  margin-top: 12rpx;
  color: #8c8c91;
  text-align: center;
  font-size: 18rpx;
  font-weight: 800;
  opacity: 0.72;
}

.section-title {
  display: block;
  margin-bottom: 20rpx;
  color: #f8fafc;
  font-size: 31rpx;
  font-weight: 900;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  margin-bottom: 20rpx;
}

.no-margin {
  margin-bottom: 0;
}

.section-tag {
  flex-shrink: 0;
  padding: 7rpx 14rpx;
  border-radius: 999rpx;
  background: #ffb000;
  color: #111;
  font-size: 19rpx;
  font-weight: 900;
}

.workflow {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14rpx;
}

.workflow-step {
  min-height: 178rpx;
  border-radius: 22rpx;
  padding: 18rpx 14rpx;
  background: #1c1c1e;
  border: 1rpx solid #2f2f32;
}

.step-index {
  width: 42rpx;
  height: 42rpx;
  border-radius: 50%;
  background: #111827;
  color: #f7c85f;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  font-weight: 900;
}

.step-title,
.step-desc {
  display: block;
}

.step-title {
  margin-top: 14rpx;
  color: #f8fafc;
  font-size: 23rpx;
  line-height: 1.24;
  font-weight: 900;
}

.step-desc {
  margin-top: 8rpx;
  color: #a1a1aa;
  font-size: 19rpx;
  line-height: 1.35;
  font-weight: 650;
}

.signature-feature {
  padding: 30rpx;
  border-radius: 28rpx;
  background: linear-gradient(135deg, #111827 0%, #17120a 100%);
  color: #fff7df;
  border: 1rpx solid rgba(247, 200, 95, 0.42);
}

.feature-eyebrow,
.signature-title,
.signature-desc {
  display: block;
}

.feature-eyebrow {
  color: #f7c85f;
  font-size: 19rpx;
  font-weight: 900;
  letter-spacing: 0;
}

.signature-title {
  margin-top: 12rpx;
  color: #fff7df;
  font-size: 36rpx;
  line-height: 1.25;
  font-weight: 900;
}

.signature-desc {
  margin-top: 14rpx;
  color: rgba(255, 247, 223, 0.78);
  font-size: 23rpx;
  line-height: 1.5;
  font-weight: 700;
}

.feature-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 22rpx;
}

.feature-tags text {
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(247, 200, 95, 0.12);
  color: #f7c85f;
  font-size: 19rpx;
  font-weight: 900;
  border: 1rpx solid rgba(247, 200, 95, 0.22);
}

.benefit-grid {
  margin-top: 18rpx;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18rpx;
}

.pro-card {
  min-height: 224rpx;
  padding: 24rpx 22rpx;
  border-radius: 28rpx;
  background: #1c1c1e;
  border: 1rpx solid #2f2f32;
}

.pro-card-icon,
.pro-card-kicker,
.pro-card-title,
.pro-card-desc {
  display: block;
}

.pro-card-icon {
  font-size: 38rpx;
  line-height: 1;
  margin-bottom: 22rpx;
}

.pro-card-kicker {
  color: #ffe16a;
  font-size: 17rpx;
  font-weight: 900;
}

.pro-card-title {
  margin-top: 10rpx;
  color: #f8fafc;
  font-size: 28rpx;
  line-height: 1.25;
  font-weight: 900;
}

.pro-card-desc {
  margin-top: 8rpx;
  color: #a1a1aa;
  font-size: 22rpx;
  line-height: 1.42;
  font-weight: 650;
}

.plan-card {
  border: 2rpx solid #2f2f32;
  border-radius: 28rpx;
  padding: 28rpx;
  margin-top: 16rpx;
  display: flex;
  justify-content: space-between;
  gap: 18rpx;
  background: #111;
}

.plan-card.active {
  border-color: #ffe16a;
  background: rgba(255, 225, 106, 0.06);
}

.plan-card.active {
  box-shadow: 0 14rpx 34rpx rgba(197, 139, 24, 0.12);
}

.invoice-option-list {
  display: grid;
  gap: 12rpx;
}

.invoice-option {
  border: 2rpx solid #2f2f32;
  border-radius: 22rpx;
  padding: 18rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  background: #111;
}

.invoice-option.active {
  border-color: #ffe16a;
  background: rgba(255, 225, 106, 0.06);
}

.invoice-option-title,
.invoice-option-desc {
  display: block;
}

.invoice-option-title {
  color: #f8fafc;
  font-size: 25rpx;
  font-weight: 900;
}

.invoice-option-desc {
  margin-top: 8rpx;
  color: #a1a1aa;
  font-size: 21rpx;
  line-height: 1.4;
  font-weight: 650;
}

.invoice-option-check {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 2rpx solid #2f2f32;
  color: #ffe16a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  font-weight: 900;
  flex-shrink: 0;
}

.invoice-note {
  display: block;
  margin-top: 14rpx;
  color: #8c8c91;
  font-size: 20rpx;
  line-height: 1.45;
  font-weight: 700;
}

.plan-name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.plan-name {
  color: #f8fafc;
  font-size: 30rpx;
  font-weight: 900;
}

.plan-tag {
  padding: 5rpx 10rpx;
  border-radius: 999rpx;
  background: #ffb000;
  color: #111;
  font-size: 18rpx;
  font-weight: 900;
}

.plan-desc {
  display: block;
  margin-top: 8rpx;
  color: #a1a1aa;
  font-size: 22rpx;
  line-height: 1.4;
  font-weight: 650;
}

.plan-benefits {
  margin-top: 14rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
}

.plan-benefits text {
  padding: 7rpx 10rpx;
  border-radius: 999rpx;
  background: #1c1c1e;
  color: #d4d4d8;
  font-size: 18rpx;
  line-height: 1.2;
  font-weight: 800;
  border: 1rpx solid #2f2f32;
}

.price-box {
  flex-shrink: 0;
  text-align: right;
}

.price {
  color: #ffe16a;
  font-size: 42rpx;
  font-weight: 900;
}

.period {
  color: #a1a1aa;
  font-size: 20rpx;
  font-weight: 800;
}

.free-plan {
  padding: 4rpx 0 0;
}

.points-panel {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
  margin: 8rpx 0 18rpx;
}

.points-item {
  min-height: 116rpx;
  border-radius: 20rpx;
  border: 1rpx solid #2f2f32;
  background: #111;
  padding: 16rpx 18rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8rpx;
}

.points-label,
.points-value {
  display: block;
}

.points-label {
  color: #a1a1aa;
  font-size: 20rpx;
  font-weight: 700;
}

.points-value {
  color: #ffe16a;
  font-size: 38rpx;
  font-weight: 900;
}

.free-step {
  display: flex;
  align-items: flex-start;
  gap: 18rpx;
  padding: 20rpx 0;
  border-top: 1rpx solid #2f2f32;
}

.free-step:first-child {
  border-top: 0;
  padding-top: 0;
}

.free-days {
  min-width: 92rpx;
  padding: 9rpx 12rpx;
  border-radius: 999rpx;
  background: rgba(255, 225, 106, 0.12);
  color: #ffe16a;
  text-align: center;
  font-size: 20rpx;
  line-height: 1.2;
  font-weight: 900;
  border: 1rpx solid rgba(255, 225, 106, 0.22);
}

.free-title,
.free-desc,
.free-note {
  display: block;
}

.free-title {
  color: #f8fafc;
  font-size: 25rpx;
  font-weight: 900;
}

.free-desc {
  margin-top: 8rpx;
  color: #a1a1aa;
  font-size: 21rpx;
  line-height: 1.42;
  font-weight: 650;
}

.free-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
  margin-top: 12rpx;
}

.second-row {
  margin-top: 14rpx;
}

.free-btn {
  min-height: 76rpx;
  border-radius: 999rpx;
  background: #111;
  color: #f8fafc;
  border: 1rpx solid #2f2f32;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 900;
}

.primary-free {
  background: #ffe16a;
  color: #231400;
  border-color: #ffe16a;
}

.free-note {
  margin-top: 16rpx;
  color: #8c8c91;
  font-size: 19rpx;
  line-height: 1.45;
  font-weight: 700;
}

.notice-card {
  background: #111;
  border: 1rpx solid #2f2f32;
}

.notice-title,
.notice-text {
  display: block;
}

.notice-title {
  color: #ffe16a;
  font-size: 25rpx;
  font-weight: 900;
}

.notice-text {
  margin-top: 10rpx;
  color: #a1a1aa;
  font-size: 22rpx;
  line-height: 1.5;
  font-weight: 650;
}

.invoice-center-btn {
  margin-top: 16rpx;
  min-height: 74rpx;
  border-radius: 999rpx;
  background: #ffe16a;
  color: #231400;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 23rpx;
  font-weight: 900;
}

.bottom-space {
  height: 260rpx;
}

.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24rpx 36rpx 52rpx;
  background: rgba(5, 5, 5, 0.94);
  backdrop-filter: blur(18px);
  border-top: 1rpx solid #1c1c1e;
}

.footer-summary {
  margin-bottom: 14rpx;
  display: flex;
  justify-content: space-between;
  color: #f8fafc;
  font-size: 24rpx;
  font-weight: 900;
}

.footer-summary text:last-child {
  color: #ffe16a;
}

.primary-btn {
  height: 92rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #ffe57a, #ffae00);
  color: #231400;
  box-shadow: 0 18rpx 42rpx rgba(255, 176, 0, 0.24);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 900;
}

.agreement-text {
  display: block;
  margin-top: 14rpx;
  color: #8c8c91;
  text-align: center;
  font-size: 20rpx;
  line-height: 1.35;
  font-weight: 700;
}
</style>
