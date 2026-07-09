<template>
  <view class="page">
    <view class="status-bar"></view>
    <view class="nav">
      <view class="back" @click="goBack">‹</view>
      <text class="nav-title">发票中心</text>
      <view class="right"></view>
    </view>

    <scroll-view scroll-y class="content" :show-scrollbar="false">
      <view class="hero-card">
        <text class="hero-title">会员订单开票管理</text>
        <text class="hero-text">仅用于会员订单开票申请。发票类型不会影响订单金额，按实际税务规则开具。</text>
      </view>

      <view class="card">
        <text class="card-title">选择订单</text>
        <view
          class="order-item"
          v-for="item in orders"
          :key="item.id"
          :class="{ active: selectedOrderId === item.id }"
          @click="selectOrder(item.id)"
        >
          <view>
            <text class="order-name">{{ item.planName }}</text>
            <text class="order-meta">订单号：{{ item.id }}</text>
            <text class="order-meta">支付渠道：{{ getOrderSourceLabel(item.orderSource) }}</text>
          </view>
          <view class="order-right">
            <text class="order-amount">¥{{ item.amount }}</text>
            <text class="order-status">{{ getInvoiceEligibilityLabel(item.invoiceEligibility) }}</text>
          </view>
        </view>
      </view>

      <view class="card" v-if="selectedOrder">
        <text class="card-title">开票申请</text>

        <view v-if="selectedOrder.invoiceEligibility === 'apple_only'" class="apple-tip">
          <text class="tip-title">该订单来自 Apple IAP</text>
          <text class="tip-text">此订单发票请通过 Apple 账单路径获取，一图灵端不受理该笔订单开票申请。</text>
          <view class="tip-btn" @click="showAppleGuide">查看 Apple 开票指引</view>
        </view>

        <view v-else>
          <view class="field">
            <text class="field-label">发票类型</text>
            <view class="chips">
              <view
                class="chip"
                v-for="item in invoiceTypes"
                :key="item.key"
                :class="{ active: form.invoiceType === item.key }"
                @click="form.invoiceType = item.key"
              >
                {{ item.name }}
              </view>
            </view>
            <text class="field-tip">普票与专票均不加价。</text>
          </view>

          <view class="field">
            <text class="field-label">抬头类型</text>
            <view class="chips">
              <view
                class="chip"
                v-for="item in titleTypes"
                :key="item.key"
                :class="{ active: form.titleType === item.key }"
                @click="form.titleType = item.key"
              >
                {{ item.name }}
              </view>
            </view>
          </view>

          <view class="field">
            <text class="field-label">发票抬头</text>
            <input class="input" v-model="form.title" placeholder="请输入个人姓名或公司名称" />
          </view>

          <view class="field" v-if="form.titleType === 'company'">
            <text class="field-label">税号</text>
            <input class="input" v-model="form.taxNo" placeholder="请输入公司税号" />
          </view>

          <view class="field">
            <text class="field-label">接收邮箱</text>
            <input class="input" v-model="form.email" placeholder="用于接收电子发票" />
          </view>

          <view class="submit-btn" @click="submitRequest">提交开票申请</view>
          <text class="field-tip">提交后可在下方查看状态；若被驳回，可直接补充信息后重提。</text>
        </view>
      </view>

      <view class="card">
        <text class="card-title">申请进度与历史</text>
        <view v-if="!requests.length" class="empty-text">暂无开票申请记录</view>
        <view class="request-item" v-for="req in requests" :key="req.id">
          <view class="request-head">
            <text class="request-id">申请号：{{ req.id }}</text>
            <text class="request-status">{{ statusTextMap[req.status] || req.status }}</text>
          </view>
          <text class="request-meta">订单号：{{ req.orderId }} · {{ req.invoiceType === 'special' ? '专票' : '普票' }}</text>
          <text class="request-meta">抬头：{{ req.title }}</text>
          <text class="request-meta">邮箱：{{ req.email }}</text>
          <text v-if="req.rejectReason" class="request-reason">驳回原因：{{ req.rejectReason }}</text>
          <view class="request-actions" v-if="req.status === 'rejected'">
            <view class="action-btn" @click="prefillRetry(req)">按此记录重提</view>
          </view>
        </view>
      </view>

      <view class="card">
        <text class="card-title">说明</text>
        <text class="card-text">1. 有效订单可提交开票申请，状态以服务端回执为准。</text>
        <text class="card-text">2. 一图灵不提供返现、提现、转账相关激励。</text>
        <text class="card-text">3. 开票问题可联系：{{ contactPhone }} / {{ contactEmail }}</text>
      </view>

      <view class="bottom-space"></view>
    </scroll-view>
  </view>
</template>

<script>
import { CONTACT_INFO } from '@/utils/legalDocs.js'
import {
  getOrders,
  getInvoiceRequests,
  createInvoiceRequest
} from '@/utils/invoice.js'

export default {
  data() {
    return {
      orders: [],
      requests: [],
      selectedOrderId: '',
      retryRequestId: '',
      contactPhone: CONTACT_INFO.contactPhone,
      contactEmail: CONTACT_INFO.contactEmail,
      invoiceTypes: [
        { key: 'normal', name: '普通发票' },
        { key: 'special', name: '专用发票' }
      ],
      titleTypes: [
        { key: 'personal', name: '个人' },
        { key: 'company', name: '企业' }
      ],
      statusTextMap: {
        submitted: '已提交',
        processing: '处理中',
        issued: '已开具',
        rejected: '已驳回'
      },
      form: {
        invoiceType: 'normal',
        titleType: 'personal',
        title: '',
        taxNo: '',
        email: ''
      }
    }
  },
  computed: {
    selectedOrder() {
      return this.orders.find(item => item.id === this.selectedOrderId) || null
    }
  },
  onShow() {
    this.reloadData()
  },
  methods: {
    reloadData() {
      this.orders = getOrders()
      this.requests = getInvoiceRequests()
      if (!this.selectedOrderId && this.orders.length) {
        this.selectedOrderId = this.orders[0].id
      }
    },
    goBack() {
      uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/settings/settings' }) })
    },
    selectOrder(orderId) {
      this.selectedOrderId = orderId
      this.retryRequestId = ''
      this.form.taxNo = ''
    },
    getOrderSourceLabel(orderSource = '') {
      if (orderSource === 'iap_apple') return 'Apple IAP'
      return '非 IAP 支付'
    },
    getInvoiceEligibilityLabel(value = '') {
      if (value === 'apple_only') return 'Apple 开票路径'
      return '一图灵可开票'
    },
    showAppleGuide() {
      uni.showModal({
        title: 'Apple IAP 开票指引',
        content: '该订单由 Apple 完成收款，请前往 Apple 账单记录获取发票。一图灵端不受理此订单的开票申请。',
        showCancel: false
      })
    },
    prefillRetry(req) {
      this.selectedOrderId = req.orderId
      this.retryRequestId = req.id
      this.form.invoiceType = req.invoiceType
      this.form.titleType = req.titleType
      this.form.title = req.title
      this.form.taxNo = req.taxNo || ''
      this.form.email = req.email
      uni.showToast({ title: '已带入历史信息', icon: 'none' })
    },
    submitRequest() {
      if (!this.selectedOrderId) {
        uni.showToast({ title: '请先选择订单', icon: 'none' })
        return
      }
      const selectedOrder = this.selectedOrder
      if (selectedOrder && selectedOrder.invoiceEligibility === 'apple_only') {
        this.showAppleGuide()
        return
      }
      const result = createInvoiceRequest({
        orderId: this.selectedOrderId,
        invoiceType: this.form.invoiceType,
        titleType: this.form.titleType,
        title: this.form.title,
        taxNo: this.form.taxNo,
        email: this.form.email,
        retryOf: this.retryRequestId
      })
      if (!result.ok) {
        const reasonMap = {
          order_not_found: '订单不存在',
          apple_only: 'Apple IAP 订单请走 Apple 开票路径',
          missing_title: '请填写发票抬头',
          missing_email: '请填写接收邮箱',
          missing_tax_no: '企业抬头请填写税号',
          already_exists: '该订单已有处理中申请'
        }
        uni.showToast({ title: reasonMap[result.reason] || '提交失败', icon: 'none' })
        return
      }
      this.retryRequestId = ''
      this.form.taxNo = this.form.titleType === 'company' ? this.form.taxNo : ''
      this.reloadData()
      uni.showModal({
        title: '提交成功',
        content: '开票申请已提交，后续请在发票中心查看处理进度。',
        showCancel: false
      })
    }
  }
}
</script>

<style>
view, text, scroll-view, input {
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif;
}

.page { min-height: 100vh; background: #f5f5f7; color: #1d1d1f; }
.status-bar { height: 88rpx; }
.nav { height: 88rpx; padding: 0 34rpx; display: flex; align-items: center; justify-content: space-between; }
.back, .right { width: 64rpx; height: 64rpx; }
.back { border-radius: 50%; background: #fff; color: #1d1d1f; font-size: 54rpx; line-height: 56rpx; text-align: center; }
.nav-title { font-size: 32rpx; color: #1d1d1f; font-weight: 900; }
.content { height: calc(100vh - 176rpx); padding: 0 32rpx; }
.hero-card, .card { margin-top: 24rpx; background: #fff; border-radius: 28rpx; padding: 28rpx; box-shadow: 0 12rpx 36rpx rgba(0, 0, 0, 0.035); }
.hero-title, .card-title { display: block; font-size: 30rpx; color: #1d1d1f; font-weight: 900; }
.hero-text, .card-text, .empty-text { display: block; margin-top: 12rpx; font-size: 24rpx; color: #515154; line-height: 1.6; font-weight: 600; }

.order-item { margin-top: 16rpx; padding: 20rpx; border-radius: 16rpx; border: 1rpx solid #e5e7eb; display: flex; justify-content: space-between; gap: 16rpx; }
.order-item.active { border-color: #007aff; background: #f7fbff; }
.order-name { display: block; font-size: 27rpx; color: #111827; font-weight: 900; }
.order-meta { display: block; margin-top: 8rpx; font-size: 22rpx; color: #6b7280; font-weight: 600; }
.order-right { text-align: right; flex-shrink: 0; }
.order-amount { display: block; font-size: 30rpx; color: #111827; font-weight: 900; }
.order-status { display: block; margin-top: 8rpx; font-size: 20rpx; color: #1d4ed8; font-weight: 700; }

.field { margin-top: 18rpx; }
.field-label { display: block; font-size: 24rpx; color: #1f2937; font-weight: 900; }
.field-tip { display: block; margin-top: 10rpx; font-size: 20rpx; color: #6b7280; font-weight: 600; }
.chips { margin-top: 12rpx; display: flex; gap: 12rpx; }
.chip { min-height: 64rpx; padding: 0 20rpx; border-radius: 999rpx; border: 1rpx solid #d1d5db; color: #1f2937; display: flex; align-items: center; justify-content: center; font-size: 22rpx; font-weight: 800; }
.chip.active { border-color: #007aff; color: #007aff; background: #eff6ff; }
.input { margin-top: 10rpx; width: 100%; height: 84rpx; border-radius: 14rpx; background: #f3f4f6; padding: 0 20rpx; font-size: 24rpx; color: #111827; }

.apple-tip { margin-top: 14rpx; border-radius: 16rpx; background: #fff7ed; border: 1rpx solid #fdba74; padding: 22rpx; }
.tip-title { display: block; font-size: 24rpx; color: #9a3412; font-weight: 900; }
.tip-text { display: block; margin-top: 10rpx; font-size: 22rpx; line-height: 1.55; color: #9a3412; font-weight: 650; }
.tip-btn { margin-top: 14rpx; height: 72rpx; border-radius: 12rpx; background: #ea580c; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 24rpx; font-weight: 900; }

.submit-btn { margin-top: 20rpx; height: 84rpx; border-radius: 999rpx; background: #111827; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 26rpx; font-weight: 900; }

.request-item { margin-top: 14rpx; border-radius: 16rpx; border: 1rpx solid #e5e7eb; background: #fafafa; padding: 18rpx; }
.request-head { display: flex; justify-content: space-between; gap: 12rpx; align-items: center; }
.request-id { font-size: 21rpx; color: #374151; font-weight: 800; }
.request-status { font-size: 20rpx; color: #2563eb; font-weight: 900; }
.request-meta { display: block; margin-top: 8rpx; font-size: 21rpx; color: #4b5563; font-weight: 650; line-height: 1.45; }
.request-reason { display: block; margin-top: 8rpx; font-size: 21rpx; color: #b91c1c; font-weight: 700; line-height: 1.45; }
.request-actions { margin-top: 12rpx; display: flex; justify-content: flex-end; }
.action-btn { min-height: 60rpx; padding: 0 18rpx; border-radius: 10rpx; background: #111827; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 21rpx; font-weight: 800; }

.bottom-space { height: 90rpx; }
</style>
