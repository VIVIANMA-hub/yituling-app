<template>
  <view class="page">
    <view class="status-bar"></view>
    <view class="nav">
      <view class="back-btn" @click="goBack">‹</view>
      <view>
        <text class="nav-title">排班响应</text>
        <text class="nav-subtitle">{{ subtitleText }}</text>
      </view>
      <view class="placeholder"></view>
    </view>

    <scroll-view scroll-y class="scroll" :show-scrollbar="false">
      <view v-if="loading" class="empty">加载中…</view>
      <view v-else-if="loadError" class="empty error">{{ loadError }}</view>

      <template v-else-if="share">
        <view class="card">
          <text class="card-title">{{ share.title || (share.year + '年' + share.month + '月排班') }}</text>
          <text class="card-meta">发布人：{{ share.ownerName }} · {{ formatDate(share.createdAt) }}</text>
          <text class="card-expire">过期时间：{{ formatDate(share.expiresAt) }}</text>
          <text class="card-scope" v-if="share.scope === 'self'">仅展示发布人本人班次（合规默认）</text>
        </view>

        <view class="card">
          <text class="section-title">{{ share.year }}年{{ share.month }}月 我的班次</text>
          <view class="doctor-picker" v-if="doctorOptions.length > 1">
            <text class="doctor-label">我是：</text>
            <scroll-view scroll-x class="doctor-strip" :show-scrollbar="false">
              <view class="doctor-strip-inner">
                <view
                  v-for="name in doctorOptions"
                  :key="name"
                  class="doctor-chip"
                  :class="{ selected: selectedDoctor === name }"
                  @click="selectedDoctor = name"
                >{{ name }}</view>
              </view>
            </scroll-view>
          </view>
          <scroll-view scroll-x class="day-strip" :show-scrollbar="false">
            <view class="day-strip-inner">
              <view
                v-for="day in daysList"
                :key="day"
                class="day-cell"
                :class="{ selected: selectedDay === day }"
                @click="selectedDay = day"
              >
                <text class="day-num">{{ day }}</text>
                <text class="day-shift" :style="{ color: shiftColorOf(day) }">{{ shiftLabelOf(day) }}</text>
              </view>
            </view>
          </scroll-view>
          <text class="hint">点选一天，下方提交「请假/调班」时会写入这天。</text>
        </view>

        <view class="card" v-if="share.allowResponses">
          <text class="section-title">操作</text>
          <view class="action-row" @click="submitAgree">
            <view class="action-icon agree">✓</view>
            <view class="action-body">
              <text class="action-title">我已知悉本月排班</text>
              <text class="action-desc">向发布人提交一条「同意」回执</text>
            </view>
          </view>

          <view class="divider"></view>

          <view class="action-body-stack">
            <text class="action-title">申请休假 / 调班</text>
            <text class="action-desc">选中上方一天后填写原因，提交给发布人</text>
            <textarea
              class="textarea"
              v-model="leaveReason"
              placeholder="简要说明（如：体检 / 家事，120 字内）"
              maxlength="120"
            ></textarea>
            <view class="btn primary" @click="submitLeave">提交请假申请{{ selectedDay ? '（' + share.month + '/' + selectedDay + '）' : '' }}</view>
          </view>

          <view class="divider"></view>

          <view class="action-body-stack">
            <text class="action-title">补充备注</text>
            <text class="action-desc">非休假诉求，例如调班建议、班次疑问</text>
            <textarea
              class="textarea"
              v-model="commentText"
              placeholder="备注内容（200 字内）"
              maxlength="200"
            ></textarea>
            <view class="btn secondary" @click="submitComment">提交备注</view>
          </view>
        </view>

        <view class="card" v-else>
          <text class="closed-text">发布人已关闭响应，仅可查看。</text>
        </view>

        <view class="legal">
          <text>提交即表示同意将姓名、回应内容存储到一图灵服务器，仅发布人本人和你自己可见。</text>
          <text>普通用户保留 90 天，会员保留 365 天，到期自动删除。</text>
        </view>
      </template>
    </scroll-view>
  </view>
</template>

<script>
import { safeBack } from '@/utils/nav.js'
import { getCallerIdentity, withAuth, ensureLogin, isLoggedIn } from '@/utils/identity.js'

export default {
  data() {
    return {
      shareId: '',
      share: null,
      loading: true,
      loadError: '',
      selectedDay: null,
      selectedDoctor: '',
      leaveReason: '',
      commentText: '',
      submitting: false
    }
  },
  computed: {
    subtitleText() {
      if (!this.share) return ''
      return `${this.share.year}年${this.share.month}月`
    },
    daysList() {
      if (!this.share) return []
      const days = new Date(this.share.year, this.share.month, 0).getDate()
      return Array.from({ length: days }, (_, i) => i + 1)
    },
    doctorOptions() {
      if (!this.share) return []
      return Object.keys(this.share.scheduleMapByDoctor || {})
    },
    myMap() {
      if (!this.share) return {}
      // 优先用 selectedDoctor；否则匹配登录用户姓名；最后回退第一位/scheduleMap
      const byDoctor = this.share.scheduleMapByDoctor || {}
      if (this.selectedDoctor && byDoctor[this.selectedDoctor]) return byDoctor[this.selectedDoctor]
      const identity = getCallerIdentity()
      if (identity.name && byDoctor[identity.name]) return byDoctor[identity.name]
      const firstKey = Object.keys(byDoctor)[0]
      if (firstKey) return byDoctor[firstKey]
      return this.share.scheduleMap || {}
    }
  },
  onLoad(query) {
    this.shareId = String(query && query.s || '')
    if (!this.shareId) {
      this.loading = false
      this.loadError = '链接里缺少分享 ID（s 参数）'
      return
    }
    this.fetchShare()
  },
  watch: {
    selectedDoctor(newVal) {
      // 用户主动切换后记忆，下次进入同一分享自动选中
      if (!newVal || !this.shareId) return
      try {
        const id = getCallerIdentity()
        uni.setStorageSync(`ytl_respond_alias:${this.shareId}:${id.uid}`, newVal)
      } catch (e) {}
    }
  },
  methods: {
    goBack() { safeBack('/pages/index/index') },
    async fetchShare() {
      try {
        const callRes = await uniCloud.callFunction({
          name: 'schedule-share',
          data: withAuth({ action: 'get', shareId: this.shareId })
        })
        const r = callRes && callRes.result
        if (!r || !r.ok) {
          this.loadError = (r && r.message) || '加载失败'
          return
        }
        this.share = r.share
        // 自动选中"我是哪位医生"：优先级 ①该分享上次已选 ②账户真实姓名 ③第 1 位
        const byDoctor = (this.share && this.share.scheduleMapByDoctor) || {}
        const identity = getCallerIdentity()
        // ① 本地记忆（按 shareId + uid 维度）
        let remembered = ''
        try {
          const cacheKey = `ytl_respond_alias:${this.shareId}:${identity.uid}`
          const v = uni.getStorageSync(cacheKey)
          if (v && byDoctor[v]) remembered = v
        } catch (e) {}
        if (remembered) {
          this.selectedDoctor = remembered
        } else if (identity.name && byDoctor[identity.name]) {
          this.selectedDoctor = identity.name
        } else {
          this.selectedDoctor = Object.keys(byDoctor)[0] || ''
        }
      } catch (e) {
        this.loadError = '网络异常：' + (e && e.message || 'unknown')
      } finally {
        this.loading = false
      }
    },
    shiftKey(day) {
      return (this.myMap || {})[String(day)] || 'rest'
    },
    shiftLabelOf(day) {
      const key = this.shiftKey(day)
      const t = (this.share.shiftTypes || []).find(s => s.key === key)
      if (t) return t.short || t.name || ''
      return key === 'rest' ? '休' : ''
    },
    shiftColorOf(day) {
      const key = this.shiftKey(day)
      const t = (this.share.shiftTypes || []).find(s => s.key === key)
      if (t) return t.color || '#475467'
      return '#86868B'
    },
    formatDate(ts) {
      if (!ts) return '-'
      const d = new Date(ts)
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    },
    async _submit(payload) {
      if (this.submitting) return
      // 提交必须登录（合规要求）
      if (!isLoggedIn()) {
        if (!ensureLogin()) return
        return
      }
      this.submitting = true
      uni.showLoading({ title: '提交中...' })
      try {
        const callRes = await uniCloud.callFunction({
          name: 'schedule-response',
          data: withAuth({
            action: 'submit',
            shareId: this.shareId,
            responderName: this.selectedDoctor || undefined,
            ...payload
          })
        })
        const r = callRes && callRes.result
        uni.hideLoading()
        if (!r || !r.ok) {
          uni.showModal({ title: '提交失败', content: (r && r.message) || '请稍后重试', showCancel: false })
          return
        }
        uni.showToast({ title: '已提交', icon: 'success' })
        this.leaveReason = ''
        this.commentText = ''
      } catch (e) {
        uni.hideLoading()
        uni.showModal({ title: '网络异常', content: e && e.message || 'unknown', showCancel: false })
      } finally {
        this.submitting = false
      }
    },
    submitAgree() {
      this._submit({ kind: 'agree' })
    },
    submitLeave() {
      if (!this.selectedDay) {
        uni.showToast({ title: '请先选择一天', icon: 'none' })
        return
      }
      this._submit({ kind: 'leave', leaveDay: this.selectedDay, leaveReason: this.leaveReason })
    },
    submitComment() {
      const text = (this.commentText || '').trim()
      if (!text) {
        uni.showToast({ title: '请输入备注内容', icon: 'none' })
        return
      }
      this._submit({ kind: 'comment', commentText: text })
    }
  }
}

function pad(n) { return String(n).padStart(2, '0') }
</script>

<style>
.page { background: #F5F5F7; min-height: 100vh; }
.status-bar { height: var(--status-bar-height); background: #F5F5F7; }
.nav { display: flex; align-items: center; padding: 20rpx 24rpx; gap: 16rpx; }
.back-btn { font-size: 48rpx; color: #1F6FEB; width: 56rpx; }
.placeholder { width: 56rpx; }
.nav-title { font-size: 32rpx; font-weight: 700; color: #1D1D1F; display: block; }
.nav-subtitle { font-size: 22rpx; color: #6E6E73; display: block; margin-top: 4rpx; }

.scroll { padding: 12rpx 24rpx 80rpx; }
.empty { padding: 80rpx 24rpx; text-align: center; color: #86868B; font-size: 28rpx; }
.empty.error { color: #D9342B; }

.card {
  background: #fff;
  border-radius: 22rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
}
.card-title { font-size: 32rpx; font-weight: 700; color: #1D1D1F; display: block; }
.card-meta { font-size: 22rpx; color: #6E6E73; display: block; margin-top: 8rpx; }
.card-expire { font-size: 20rpx; color: #B8B8C0; display: block; margin-top: 4rpx; }
.card-scope { font-size: 22rpx; color: #137333; display: block; margin-top: 10rpx; padding: 6rpx 14rpx; background: #E6F4EA; border-radius: 8rpx; align-self: flex-start; }

.section-title { font-size: 28rpx; font-weight: 700; color: #1D1D1F; display: block; margin-bottom: 16rpx; }

.day-strip-inner { display: flex; gap: 12rpx; padding: 4rpx 0 12rpx; }
.doctor-picker { display: flex; align-items: center; gap: 12rpx; margin-bottom: 12rpx; }
.doctor-label { font-size: 24rpx; color: #6E6E73; white-space: nowrap; }
.doctor-strip { flex: 1; }
.doctor-strip-inner { display: flex; gap: 10rpx; padding: 2rpx 0; }
.doctor-chip {
  padding: 8rpx 18rpx; border-radius: 999rpx;
  background: #F5F5F7; font-size: 24rpx; color: #1D1D1F;
  white-space: nowrap;
}
.doctor-chip.selected { background: #1F6FEB; color: #fff; }
.day-cell {
  min-width: 80rpx; padding: 14rpx 12rpx; border-radius: 14rpx;
  background: #F5F5F7; text-align: center;
  display: flex; flex-direction: column; align-items: center;
}
.day-cell.selected { background: #E8F2FF; border: 2rpx solid #1F6FEB; }
.day-num { font-size: 24rpx; color: #1D1D1F; font-weight: 600; }
.day-shift { font-size: 22rpx; margin-top: 4rpx; }

.hint { font-size: 22rpx; color: #86868B; display: block; margin-top: 8rpx; }

.action-row { display: flex; align-items: center; gap: 18rpx; padding: 20rpx 0; }
.action-row:active { background: #FAFBFC; }
.action-icon {
  width: 60rpx; height: 60rpx; border-radius: 16rpx;
  display: flex; align-items: center; justify-content: center;
  font-size: 36rpx; color: #fff;
}
.action-icon.agree { background: #1F6FEB; }
.action-body { flex: 1; display: flex; flex-direction: column; }
.action-body-stack { display: flex; flex-direction: column; padding: 20rpx 0; }
.action-title { font-size: 28rpx; font-weight: 700; color: #1D1D1F; }
.action-desc { font-size: 22rpx; color: #6E6E73; margin-top: 6rpx; }

.divider { height: 1rpx; background: #ECEEF1; margin: 8rpx 0; }
.textarea {
  background: #F5F5F7; border-radius: 14rpx; padding: 18rpx;
  margin-top: 14rpx; font-size: 26rpx; min-height: 140rpx;
}
.btn {
  margin-top: 16rpx; padding: 22rpx; border-radius: 999rpx;
  text-align: center; font-size: 28rpx; font-weight: 600;
}
.btn.primary { background: #1F6FEB; color: #fff; }
.btn.secondary { background: #F5F5F7; color: #1D1D1F; }

.closed-text { color: #86868B; font-size: 26rpx; }
.legal { font-size: 20rpx; color: #98a2b3; line-height: 1.6; padding: 12rpx 8rpx 32rpx; }
.legal text { display: block; }
</style>
