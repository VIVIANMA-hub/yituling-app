<template>
  <view class="page">
    <view class="status-bar"></view>

    <view class="nav">
      <view class="back-btn" @click="goBack">‹</view>
      <view>
        <text class="nav-title">排班助手</text>
        <text class="nav-subtitle">上传 · 校正 · 分享</text>
      </view>
      <view class="help-btn" @click="showRule">?</view>
    </view>

    <scroll-view scroll-y class="scroll" :show-scrollbar="false">
      <view class="section-head">
        <text class="section-title">排班日历</text>
      </view>

      <view class="tool-row">
        <view class="tool-btn" @click="openReminderSetting">
          <text class="tool-title">上班提醒</text>
          <text class="tool-desc">{{ reminderSummary }}</text>
        </view>
        <view class="tool-btn" @click="openCollab">
          <text class="tool-title">协同排班</text>
          <text class="tool-desc">邀请同事一起改</text>
        </view>
      </view>

      <view class="editor-card">
        <view class="month-row">
          <view>
            <text class="month-title">{{ monthLabel }}排班</text>
          </view>
          <view class="name-pill" @click="editName">{{ doctorName }}</view>
        </view>

        <!-- 一键上传本月排班（图片 / Excel），合并进本月排班卡片 -->
        <view class="inline-upload-row" @click="pickCurrentMonthSchedule">
          <view class="inline-upload-icon">📷</view>
          <view class="inline-upload-body">
            <text class="inline-upload-title">一键上传本月排班</text>
            <text class="inline-upload-sub">{{ currentMonthImage ? parseStatusText : '图片 / 多图拼接 / Excel · 自动识别填入下方日历' }}</text>
          </view>
          <view v-if="currentMonthImage" class="inline-upload-thumb">
            <image :src="currentMonthImage" mode="aspectFill"></image>
          </view>
          <view v-else class="inline-upload-cta">上传</view>
        </view>

        <scroll-view
          v-if="doctorOrder.length > 1"
          scroll-x
          class="doctor-tabs"
          :show-scrollbar="false"
        >
          <view class="doctor-tabs-inner">
            <view
              class="doctor-tab"
              v-for="name in doctorOrder"
              :key="name"
              :class="{ active: doctorName === name }"
              @click="switchDoctor(name)"
            >{{ name }}</view>
          </view>
        </scroll-view>

        <view class="legend-row">
          <view class="legend-item" v-for="s in shiftTypes" :key="s.key" @click="editShiftTime(s)">
            <view class="legend-dot" :style="{ backgroundColor: s.color }"></view>
            <text>{{ formatShiftLabel(s) }}</text>
          </view>
          <view class="legend-add" @click="addShiftType">＋</view>
        </view>

        <view class="calendar">
          <view class="week" v-for="w in weeks" :key="w">{{ w }}</view>
          <view
            class="day"
            v-for="item in calendarDays"
            :key="item.id"
            :class="{ muted: item.muted, today: item.today, holiday: !item.muted && item.holiday, violation: !item.muted && item.violation }"
            @click="cycleShift(item)"
          >
            <text class="day-num">{{ item.day }}</text>
            <text class="day-holiday" v-if="!item.muted && item.holiday">{{ item.holiday }}</text>
            <view v-if="!item.muted" class="shift-chip" :style="getShiftStyle(item.shift)">
              {{ getShiftShort(item.shift) }}
            </view>
          </view>
        </view>
      </view>

      <view class="section-head">
        <text class="section-title">下月科室排班（AI 生成）</text>
        <text class="preview-tag">Beta</text>
      </view>

      <view class="dept-intro">
        <text class="dept-intro-text">基于上方本月排班，AI 学习排班规律 → 一键生成下月科室初稿</text>
        <text class="dept-intro-tip">生成结果仅供参考，最终须由科室排班负责人审核确认。</text>
      </view>

      <view class="ai-gen-row">
        <view class="primary-btn ai-gen-btn" @click="aiGenEntry">
          <text>AI 一键生成下月科室排班</text>
        </view>
      </view>

      <view class="share-preview" v-if="posterReady">
        <view v-if="aiWarnings.length" class="ai-warn-bar" @click="showAiWarnings">
          <text class="ai-warn-icon">⚠</text>
          <text class="ai-warn-text">已自动调整 {{ aiWarnings.length }} 处违规连排（点查看详情）</text>
        </view>
        <view class="preview-head">
          <text class="preview-title">下月科室排班 · 预览</text>
          <view class="pro-tag" @click="goToProForWatermark">
            <text class="pro-tag-text">去水印</text>
            <text class="pro-tag-sub">开通 Pro</text>
          </view>
        </view>

        <view class="poster">
          <view class="poster-top">
            <image class="poster-logo" src="/static/logo.png" mode="aspectFit"></image>
            <view class="poster-title-box">
              <text class="poster-title">一图灵</text>
              <text class="poster-subtitle">{{ posterMonthLabel }}科室排班表 · {{ posterDoctorList.length || 1 }} 位医生</text>
            </view>
          </view>

          <scroll-view scroll-x class="poster-scroll" :show-scrollbar="false">
            <view class="poster-table">
              <!-- 表头：医生 | 1 | 2 | ... | 31 -->
              <view class="ptr-row ptr-header">
                <view class="ptr-name">医生</view>
                <view class="ptr-day-h" v-for="day in posterDayList" :key="`h${day}`">{{ day }}</view>
              </view>
              <!-- 每位医生一行 -->
              <view class="ptr-row" v-for="name in posterDoctorList" :key="name">
                <view class="ptr-name">{{ name }}</view>
                <view
                  class="ptr-cell"
                  v-for="day in posterDayList"
                  :key="`${name}-${day}`"
                  :style="getPosterCellStyle(name, day)"
                >{{ getPosterCellLabel(name, day) }}</view>
              </view>
            </view>
          </scroll-view>

          <view class="poster-watermark" v-if="!isProUser">一图灵 App 自动生成</view>
        </view>
      </view>

      <view class="empty-hint" v-else>
        <text class="empty-hint-text">点击上方"AI 一键生成下月科室排班"，结果会在此处显示。</text>
      </view>

      <view class="action-panel" v-if="posterReady">
        <view class="secondary-btn" @click="saveLocal">保存</view>
        <view class="secondary-btn" @click="exportCsv">导出表格</view>
        <view class="secondary-btn" @click="copyShareLink">复制网页链接</view>
        <view class="secondary-btn responses-btn" v-if="lastShareId || responsesTotal" @click="viewResponses">
          查看回执
          <text v-if="responsesUnread" class="responses-badge">{{ responsesUnread > 99 ? '99+' : responsesUnread }}</text>
        </view>
        <view class="primary-btn" @click="sharePoster">分享图片</view>
      </view>

      <view class="bottom-space"></view>
    </scroll-view>

    <view class="shift-editor-mask" v-if="editingShift" @click="closeShiftEditor">
      <view class="shift-editor" @click.stop>
        <view class="sheet-handle"></view>
        <text class="sheet-title">编辑班次</text>

        <view class="field">
          <text class="field-label">标签名称</text>
          <input class="field-input" v-model="shiftDraft.short" maxlength="4" placeholder="白班" />
        </view>

        <view class="field">
          <text class="field-label">时间</text>
          <input class="field-input" v-model="shiftDraft.time" placeholder="可不填，例如：8-12,15-18" />
        </view>

        <view class="field">
          <text class="field-label">颜色</text>
          <view class="color-row">
            <view
              class="color-dot"
              v-for="color in colorOptions"
              :key="color"
              :class="{ active: shiftDraft.color === color }"
              :style="{ backgroundColor: color }"
              @click="shiftDraft.color = color"
            ></view>
          </view>
        </view>

        <view class="shift-preview">
          <text class="field-label preview-label">预览</text>
          <view class="legend-dot" :style="{ backgroundColor: shiftDraft.color }"></view>
          <text>{{ formatShiftLabel(shiftDraft) }}</text>
        </view>

        <view class="sheet-actions">
          <view
            v-if="canDeleteShift(shiftDraft)"
            class="danger-btn sheet-btn"
            @click="deleteShiftType(shiftDraft)"
          >删除此班次</view>
          <view class="secondary-btn sheet-btn" @click="closeShiftEditor">取消</view>
          <view class="primary-btn sheet-btn" @click="saveShiftEdit">保存</view>
        </view>
      </view>
    </view>

    <view class="shift-editor-mask" v-if="showReminderEditor" @click="closeReminderSetting">
      <view class="shift-editor" @click.stop>
        <view class="sheet-handle"></view>
        <text class="sheet-title">上班提醒</text>

        <view class="reminder-preview">
          <text class="reminder-title">{{ tomorrowShiftLabel }}</text>
          <text class="reminder-desc">前一天 {{ reminderTime }} 提醒</text>
        </view>

        <view class="field">
          <text class="field-label">提醒时间</text>
          <picker mode="time" :value="reminderTime" start="00:00" end="23:59" @change="changeReminderTime">
            <view class="field-picker">{{ reminderTime }}</view>
          </picker>
        </view>

        <view class="reminder-switch-row">
          <text>开启提醒</text>
          <switch :checked="reminderEnabled" color="#1677ff" @change="toggleReminder" />
        </view>

        <view class="sheet-actions">
          <view class="primary-btn sheet-btn" @click="closeReminderSetting">完成</view>
        </view>
      </view>
    </view>

    <canvas
      canvas-id="schedulePosterCanvas"
      id="schedulePosterCanvas"
      class="poster-canvas"
      :style="{ width: posterCanvasWidth + 'px', height: posterCanvasHeight + 'px' }"
    ></canvas>

    <app-tab-bar active="schedule" />
  </view>
</template>

<script>
import { safeBack } from '@/utils/nav.js'
import { claimScheduleShareReward } from '@/utils/points.js'
import { getCallerIdentity, withAuth, ensureLogin, tryClaimInviteReward } from '@/utils/identity.js'
import { getHoliday, getMonthHolidays } from '@/common/holidays.js'
import { findConsecutiveEmergency } from '@/common/scheduleValidator.js'
import { encodeSchedulePayload } from '@/common/shareEncode.js'
import { tintColor, roundRect, csvEscape } from '@/common/posterUtils.js'

// H5 分享页基址。yituling.com/s 由静态文件托管（见 docs/share-h5-deploy.md）。
const H5_SHARE_BASE = 'https://yituling.com/s'

export default {
  data() {
    return {
      sourceImage: '',
      currentMonthImage: '',
      // 多图上传时缓存所有图片的 OCR 结果，识别完再合并
      multiImageQueue: [],
      // 区分本次上传的目标：'current'（本月）或 'dept'（下月用本月样本）
      uploadMode: 'dept',
      parsing: false,
      parseConfidence: 1,
      parseNeedsReview: false,
      parseError: '',
      doctorName: '医生',
      currentYear: new Date().getFullYear(),
      currentMonth: new Date().getMonth() + 1,
      // 本月日历固定在真实当月，OCR / AI 生成都不许改它
      lockToRealMonth: true,
      // 下月 AI 生成预览专用月份和数据（不污染本月）
      posterYear: null,
      posterMonth: null,
      posterScheduleMapByDoctor: {},
      weeks: ['日', '一', '二', '三', '四', '五', '六'],
      shiftTypes: [
        { key: 'early', name: '早班', short: '早', time: '8-12', color: '#f59e0b' },
        { key: 'emergency', name: '急诊', short: '急', time: '18-8', color: '#f04438' },
        { key: 'night_off', name: '下夜班', short: '下', time: '', color: '#7c3aed' },
        { key: 'rest', name: '休班', short: '休', time: '', color: '#98a2b3' },
        { key: 'day', name: '白班', short: '白', time: '8-12,15-18', color: '#1677ff' }
      ],
      colorOptions: ['#1677ff', '#f59e0b', '#f04438', '#12b76a', '#7c3aed', '#0f766e', '#475467', '#98a2b3'],
      editingShift: null,
      showReminderEditor: false,
      reminderEnabled: true,
      reminderTime: '22:00',
      shiftDraft: {
        key: '',
        name: '',
        short: '',
        time: '',
        color: '#1677ff'
      },
      scheduleMap: {},
      // 多医生：识别整张科室表后存这里。{ '医生A': {1:'day',...}, '医生B': {...} }
      scheduleMapByDoctor: {},
      doctorOrder: [],
      // 下月排班是否已生成（识别 OR AI 生成成功后置 true）
      posterReady: false,
      // 服务端 postcheck 告警（emergency 连排被降级等）
      aiWarnings: [],
      // 是否 Pro（暂未接付费体系，先 hardcode false 让 UI 透出引导）
      isProUser: false,
      posterCanvasWidth: 750,
      posterCanvasHeight: 720,
      exportingPoster: false,
      // 最近一次上传到云端的 shareId，用于"查看回执"
      lastShareId: '',
      // 收到的回执统计（仅登录用户）
      responsesTotal: 0,
      responsesUnread: 0,
      responsesLatestAt: 0
    }
  },
  computed: {
    monthLabel() {
      return `${this.currentYear}年${this.currentMonth}月`
    },
    parseStatusText() {
      if (this.parsing) return '识别中'
      if (this.parseError) return '识别失败'
      if (this.parseNeedsReview) return '请核对'
      return '已生成'
    },
    canSharePoster() {
      // 置信度过低或仍需复核时禁止裂变分享，避免错班次扩散
      return !this.parsing && !this.parseNeedsReview && !this.parseError
    },
    calendarDays() {
      const year = this.currentYear
      const monthIndex = this.currentMonth - 1
      const firstDay = new Date(year, monthIndex, 1).getDay()
      const daysInMonth = new Date(year, this.currentMonth, 0).getDate()
      const prevDays = new Date(year, monthIndex, 0).getDate()
      const list = []

      for (let i = 0; i < firstDay; i++) {
        list.push({ id: `p-${i}`, day: prevDays - firstDay + i + 1, muted: true, shift: 'rest' })
      }

      const now = new Date()
      const isViewingThisMonth = (this.currentYear === now.getFullYear()) && (this.currentMonth === (now.getMonth() + 1))
      const todayDay = now.getDate()

      // 当前医生的 emergency 连排违规区间，转换成日号 set 便于查询
      const violationSet = new Set()
      const { violations } = findConsecutiveEmergency(this.scheduleMap || {}, daysInMonth)
      for (const v of violations) {
        for (let d = v.startDay; d <= v.endDay; d++) violationSet.add(d)
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const holiday = getHoliday(this.currentYear, this.currentMonth, day)
        list.push({
          id: `d-${day}`,
          day,
          muted: false,
          today: isViewingThisMonth && day === todayDay,
          holiday: holiday ? holiday.name : '',
          violation: violationSet.has(day),
          shift: this.scheduleMap[day] || this.defaultShift(day)
        })
      }

      while (list.length < 42) {
        list.push({ id: `n-${list.length}`, day: list.length - firstDay - daysInMonth + 1, muted: true, shift: 'rest' })
      }

      return list
    },
    posterDays() {
      return this.calendarDays.filter(item => !item.muted).slice(0, 31)
    },
    // 下月排班 H5 预览区使用的医生列表与日期列表（独立于本月日历）
    posterMonthLabel() {
      const y = this.posterYear || this.currentYear
      const m = this.posterMonth || this.currentMonth
      return `${y}年${m}月`
    },
    posterDoctorList() {
      const map = this.posterScheduleMapByDoctor || {}
      const keys = Object.keys(map)
      if (keys.length) return keys
      if (this.doctorOrder.length) return this.doctorOrder
      return [this.doctorName || '医生']
    },
    posterDayList() {
      const y = this.posterYear || this.currentYear
      const m = this.posterMonth || this.currentMonth
      const days = new Date(y, m, 0).getDate()
      const list = []
      for (let d = 1; d <= days; d++) list.push(d)
      return list
    },
    tomorrowShift() {
      const tomorrowDay = new Date().getDate() + 1
      const item = this.calendarDays.find(day => !day.muted && day.day === tomorrowDay)
      return item ? this.getShift(item.shift) : this.getShift('rest')
    },
    tomorrowShiftLabel() {
      return `明天 ${this.formatShiftLabel(this.tomorrowShift)}`
    },
    reminderSummary() {
      if (!this.reminderEnabled) return '未开启'
      return `${this.reminderTime} · ${this.formatShiftLabel(this.tomorrowShift)}`
    }
  },
  onShow() {
    uni.hideTabBar()
    this.loadUserName()
    this.loadShiftTimes()
    this.loadReminder()
    this.seedSchedule()
    this.fetchResponseStats()
  },
  methods: {
    async fetchResponseStats() {
      // 登录后异步拉所有分享的回执统计（含未读）
      const id = getCallerIdentity()
      if (!id.loggedIn) {
        this.responsesTotal = 0
        this.responsesUnread = 0
        return
      }
      const lastReadAt = Number(uni.getStorageSync('ytl_responses_last_read_at') || 0)
      try {
        const res = await uniCloud.callFunction({
          name: 'schedule-response',
          data: withAuth({ action: 'count_for_owner', sinceTs: lastReadAt })
        })
        const r = res && res.result
        if (!r || !r.ok) return
        this.responsesTotal = r.total
        this.responsesUnread = r.unread
        this.responsesLatestAt = r.latestAt
      } catch (e) {
        console.log('[schedule] fetchResponseStats skipped:', e && e.message)
      }
    },
    markResponsesRead() {
      // 用户进入回执列表时调用，把当前最大时间写到本地，下次进来未读归零
      if (this.responsesLatestAt) {
        uni.setStorageSync('ytl_responses_last_read_at', this.responsesLatestAt)
      }
      this.responsesUnread = 0
    },
    goBack() {
      safeBack('/pages/index/index')
    },
    loadUserName() {
      // 已登录用户优先用一图灵账号里的真实姓名；其次本地 user_name；最后兜底"医生"
      const identity = getCallerIdentity()
      if (identity.loggedIn && identity.name && identity.name !== '医生') {
        this.doctorName = identity.name
        return
      }
      const storedName = uni.getStorageSync('user_name')
      if (storedName) this.doctorName = storedName
    },
    loadShiftTimes() {
      const saved = uni.getStorageSync('ytl_shift_times')
      if (!saved) return
      const next = this.shiftTypes.map(item => ({
        ...item,
        name: typeof saved[item.key] === 'object' ? (saved[item.key].name || item.name) : item.name,
        short: typeof saved[item.key] === 'object' ? (saved[item.key].short || item.short) : item.short,
        time: typeof saved[item.key] === 'object' ? (saved[item.key].time || item.time) : (saved[item.key] || item.time),
        color: typeof saved[item.key] === 'object' ? (saved[item.key].color || item.color) : item.color
      }))
      Object.keys(saved).forEach(key => {
        if (!key.startsWith('custom_')) return
        if (next.some(item => item.key === key)) return
        const item = saved[key]
        if (typeof item !== 'object') return
        next.push({
          key,
          name: item.name || item.short || '新班次',
          short: item.short || '新',
          time: item.time || '',
          color: item.color || '#475467'
        })
      })
      this.shiftTypes = next
    },
    loadReminder() {
      const settings = uni.getStorageSync('ytl_schedule_reminder')
      if (!settings) {
        this.reminderEnabled = true
        this.reminderTime = uni.getStorageSync('shift_reminder_time') || '22:00'
        return
      }
      this.reminderEnabled = settings.enabled !== false
      this.reminderTime = settings.time || '22:00'
    },
    saveReminder() {
      const settings = {
        enabled: this.reminderEnabled,
        time: this.reminderTime,
        type: 'day_before',
        updatedAt: new Date().toISOString()
      }
      uni.setStorageSync('ytl_schedule_reminder', settings)
      uni.setStorageSync('shift_reminder_time', this.reminderTime)
      this.tryCreateLocalReminder()
    },
    toggleReminder(e) {
      this.reminderEnabled = !!e.detail.value
      this.saveReminder()
      uni.showToast({ title: this.reminderEnabled ? '提醒已开启' : '提醒已关闭', icon: 'none' })
    },
    changeReminderTime(e) {
      this.reminderTime = e.detail.value
      this.reminderEnabled = true
      this.saveReminder()
      uni.showToast({ title: `提醒时间 ${this.reminderTime}`, icon: 'none' })
    },
    openReminderSetting() {
      this.showReminderEditor = true
    },
    closeReminderSetting() {
      this.showReminderEditor = false
    },
    openCollab() {
      uni.showModal({
        title: '协同排班',
        content: '协同排班可用于邀请同事一起校正排班。当前先支持生成分享图，后续接入账号后开放多人编辑。',
        showCancel: false
      })
    },
    tryCreateLocalReminder() {
      if (!this.reminderEnabled) return
      // App端后续可接入本地通知或 uni-push。这里先保存设置，并在支持的平台尝试创建一条即时系统消息用于验证权限。
      // #ifdef APP-PLUS
      try {
        if (typeof plus !== 'undefined' && plus.push && plus.push.createMessage) {
          plus.push.createMessage(`排班提醒已设为前一天 ${this.reminderTime}`, 'schedule-reminder', { cover: false })
        }
      } catch (e) {}
      // #endif
    },
    showRule() {
      uni.showModal({
        title: '功能边界',
        content: '排班助手只用于整理和分享排班信息。识别结果必须由用户校正确认，平台不参与科室管理决策。',
        showCancel: false
      })
    },
    showAiWarnings() {
      if (!this.aiWarnings.length) return
      // 分类：硬改（连排降级、夜班间隔不足）+ 软告警（节假日集中、值守缺口）
      const hardByDoctor = {}
      const gapByDoctor = {}
      const holidayLines = []
      const coverageLines = []
      for (const w of this.aiWarnings) {
        if (w.reason === 'consecutive_emergency_gt_3') {
          if (!hardByDoctor[w.doctor]) hardByDoctor[w.doctor] = []
          hardByDoctor[w.doctor].push(w.day)
        } else if (w.reason === 'emergency_gap_too_short') {
          if (!gapByDoctor[w.doctor]) gapByDoctor[w.doctor] = []
          gapByDoctor[w.doctor].push(w.day)
        } else if (w.reason === 'holiday_emergency_concentration') {
          const days = Array.isArray(w.days) ? w.days.join('、') : ''
          holidayLines.push(`${w.doctor}：节假日急诊占比 ${Math.round((w.ratio || 0) * 100)}%（${days} 日）`)
        } else if (w.reason === 'daily_emergency_uncovered') {
          const days = Array.isArray(w.days) ? w.days.slice(0, 8).join('、') : ''
          const more = (w.days || []).length > 8 ? ` 等 ${w.days.length} 天` : ''
          coverageLines.push(`${days} 日${more} 全科室无人排急诊`)
        }
      }
      const parts = []
      if (Object.keys(hardByDoctor).length) {
        const lines = Object.entries(hardByDoctor).map(([name, days]) => {
          const shown = days.slice(0, 5).join('、')
          const more = days.length > 5 ? ` 等 ${days.length} 天` : ''
          return `${name}：${shown} 日${more}`
        })
        parts.push(`【已改为休息：连排 4+ 天急诊】\n${lines.join('\n')}`)
      }
      if (Object.keys(gapByDoctor).length) {
        const lines = Object.entries(gapByDoctor).map(([name, days]) => {
          const shown = days.slice(0, 5).join('、')
          const more = days.length > 5 ? ` 等 ${days.length} 天` : ''
          return `${name}：${shown} 日${more}`
        })
        parts.push(`【已改为休息：夜班后未隔 1 天】\n${lines.join('\n')}`)
      }
      if (holidayLines.length) {
        parts.push(`【需复核：节假日急诊集中】\n${holidayLines.join('\n')}`)
      }
      if (coverageLines.length) {
        parts.push(`【需手动指派】\n${coverageLines.join('\n')}\n科室至少需 1 人值守急诊，请手动调整。`)
      }
      uni.showModal({
        title: '排班调整说明',
        content: parts.join('\n\n') + '\n\n点击对应日期可手动切换班次。',
        showCancel: false
      })
    },
    pickSchedule() {
      // 下月 AI 排班的样本上传入口
      this.uploadMode = 'dept'
      this._chooseAndParse()
    },
    pickCurrentMonthSchedule() {
      // 本月排班识别入口（顶部新加的卡片）
      this.uploadMode = 'current'
      this._chooseAndParse()
    },
    _chooseAndParse() {
      // 本月排班入口：单图 / Excel（不给多图，避免日历被多张图覆盖混乱）
      // 下月 AI 入口：单图 / 多图（同一张表分了几页） / Excel
      if (this.uploadMode === 'current') {
        uni.showActionSheet({
          itemList: ['拍照或单张图片', 'Excel 文件'],
          success: (r) => {
            if (r.tapIndex === 0) this._pickSingleImage()
            else if (r.tapIndex === 1) this._pickExcel()
          }
        })
        return
      }
      uni.showActionSheet({
        itemList: ['拍照或单张图片', '多张图片（拼接）', 'Excel 文件'],
        success: (r) => {
          if (r.tapIndex === 0) this._pickSingleImage()
          else if (r.tapIndex === 1) this._pickMultipleImages()
          else if (r.tapIndex === 2) this._pickExcel()
        }
      })
    },
    _pickSingleImage() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          this._setSourcePreview(res.tempFilePaths[0])
          this.multiImageQueue = []
          this.parseScheduleFromImage(res.tempFilePaths[0])
        },
        fail: () => {
          uni.showToast({ title: '未选择图片', icon: 'none' })
        }
      })
    },
    _pickMultipleImages() {
      uni.chooseImage({
        count: 9,
        sizeType: ['compressed'],
        sourceType: ['album'],
        success: async (res) => {
          const paths = res.tempFilePaths || []
          if (!paths.length) return
          this._setSourcePreview(paths[0])
          this.multiImageQueue = paths.slice()
          await this.parseScheduleFromMultiImages(paths)
        },
        fail: () => uni.showToast({ title: '未选择图片', icon: 'none' })
      })
    },
    _pickExcel() {
      // #ifdef H5
      this._pickExcelH5()
      // #endif
      // #ifdef APP-PLUS
      this._pickExcelApp()
      // #endif
      // #ifdef MP-WEIXIN
      this._pickExcelMpWeixin()
      // #endif
    },
    _pickExcelH5() {
      // H5 通过 file input
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.xlsx,.xls,.csv'
      input.onchange = (e) => {
        const file = e.target.files && e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (ev) => {
          this.parseScheduleFromExcel(ev.target.result, file.name)
        }
        reader.readAsArrayBuffer(file)
      }
      input.click()
    },
    _pickExcelApp() {
      // App 端用 plus.io 选文件
      uni.showModal({
        title: 'Excel 选择',
        content: '请通过手机的「文件」App 把 Excel 发送到本应用，或先转成图片再上传。当前 App 内置选择器仅支持图片。',
        showCancel: false
      })
    },
    _pickExcelMpWeixin() {
      // #ifdef MP-WEIXIN
      wx.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['xlsx', 'xls', 'csv'],
        success: (res) => {
          const file = res.tempFiles[0]
          const fs = wx.getFileSystemManager()
          fs.readFile({
            filePath: file.path,
            success: (r) => this.parseScheduleFromExcel(r.data, file.name),
            fail: () => uni.showToast({ title: '读取文件失败', icon: 'none' })
          })
        }
      })
      // #endif
    },
    _setSourcePreview(path) {
      if (this.uploadMode === 'current') {
        this.currentMonthImage = path
      } else {
        this.sourceImage = path
      }
    },
    // AI 一键生成下月排班入口：根据当前是否已有样本动态弹菜单
    aiGenEntry() {
      const hasSample = (this.scheduleMapByDoctor && Object.keys(this.scheduleMapByDoctor).length)
        || Object.keys(this.scheduleMap || {}).length
      const items = []
      if (hasSample) items.push('用现有数据生成')
      items.push('单图', '多图', 'Excel')
      uni.showActionSheet({
        itemList: items,
        success: (r) => {
          const idx = r.tapIndex
          if (hasSample && idx === 0) {
            this.generateDeptSchedule()
            return
          }
          const offset = hasSample ? 1 : 0
          this.uploadMode = 'dept'
          this._pendingAutoGenerateAfterParse = true
          if (idx === offset) this._pickSingleImage()
          else if (idx === offset + 1) this._pickMultipleImages()
          else if (idx === offset + 2) this._pickExcel()
        }
      })
    },
    async generateDeptSchedule() {
      // 用整张科室排班表（多医生）作为 AI 推理样本
      const historyByDoctor = this.scheduleMapByDoctor && Object.keys(this.scheduleMapByDoctor).length
        ? this.scheduleMapByDoctor
        : (Object.keys(this.scheduleMap || {}).length
          ? { [this.doctorName || '医生']: this.scheduleMap }
          : {})

      const doctorCount = Object.keys(historyByDoctor).length
      if (doctorCount === 0) {
        uni.showModal({
          title: '请先识别本月排班',
          content: 'AI 生成下月排班需要本月排班作为推理样本。请先上传本月科室排班表。',
          showCancel: false
        })
        return
      }

      // 估算样本量：所有医生总记录天数 / 医生数
      const totalDays = Object.values(historyByDoctor).reduce((s, m) => s + Object.keys(m).length, 0)
      if (totalDays < 10) {
        const proceed = await new Promise(resolve => {
          uni.showModal({
            title: '样本偏少',
            content: `当前只识别到 ${totalDays} 条排班记录，生成结果可能不准。是否继续？`,
            success: r => resolve(r.confirm)
          })
        })
        if (!proceed) return
      }

      uni.showLoading({ title: 'AI 排班后台生成中...' })
      try {
        // 目标月 = 当前月 + 1
        const targetYear = this.currentMonth === 12 ? this.currentYear + 1 : this.currentYear
        const targetMonth = this.currentMonth === 12 ? 1 : this.currentMonth + 1
        const holidayDates = getMonthHolidays(targetYear, targetMonth)

        const callRes = await uniCloud.callFunction({
          name: 'ai-schedule',
          data: withAuth({
            historyByDoctor,
            shiftTypes: this.shiftTypes,
            sourceYear: this.currentYear,
            sourceMonth: this.currentMonth,
            holidayDates
          })
        })
        const result = callRes && callRes.result
        if (!result || !result.ok) {
          const code = (result && result.code) || 'UNKNOWN'
          const msg = (result && result.message) || '生成失败'
          let detailHint = ''
          if (result && result.detail) {
            const d = result.detail
            if (d.status) detailHint += ` status=${d.status}`
            if (d.error && d.error.message) detailHint += ` reason=${d.error.message}`
            if (d.error && d.error.code) detailHint += ` reason=${d.error.code}`
            if (d.preview) detailHint += ` preview=${String(d.preview).slice(0, 80)}`
            if (!detailHint) detailHint = ' detail=' + JSON.stringify(d).slice(0, 200)
          }
          throw Object.assign(new Error(code), { userMessage: `${msg}\n[${code}]${detailHint}` })
        }
        uni.hideLoading()

        // 只填下月预览数据，不动本月日历和 doctorOrder
        const tYear = Number.isInteger(result.targetYear) ? result.targetYear : (this.currentMonth === 12 ? this.currentYear + 1 : this.currentYear)
        const tMonth = Number.isInteger(result.targetMonth) ? result.targetMonth : (this.currentMonth === 12 ? 1 : this.currentMonth + 1)
        this.posterYear = tYear
        this.posterMonth = tMonth
        this.posterScheduleMapByDoctor = result.scheduleMap || {}
        if (!this.doctorOrder.length) {
          this.doctorOrder = Object.keys(this.posterScheduleMapByDoctor)
        }
        this.posterReady = true
        // 服务端兜底：emergency 连排被降级等
        this.aiWarnings = Array.isArray(result.warnings) ? result.warnings : []
        if (this.aiWarnings.length) {
          uni.showToast({
            title: `已自动调整 ${this.aiWarnings.length} 处违规连排`,
            icon: 'none',
            duration: 2500
          })
        }
        // 不打扰：日历已切到下月，直接看结果即可
      } catch (err) {
        uni.hideLoading()
        const userMsg = err.userMessage || '生成失败，请检查网络或重试。如果云函数尚未配置 API key，请先按 docs/ai-schedule-setup.md 配置。'
        uni.showModal({ title: '生成失败', content: userMsg, showCancel: false })
      }
    },
    _maybePromptGenerateDept() {
      // 识别完后处理：如果用户是从"AI 一键生成"入口进的，直接生成不打扰
      if (this._pendingAutoGenerateAfterParse) {
        this._pendingAutoGenerateAfterParse = false
        this.generateDeptSchedule()
        return
      }
      // 仅当识别置信度可接受且有足够样本时提示
      if (this.parseNeedsReview) return
      const totalDays = Object.values(this.scheduleMapByDoctor || {})
        .reduce((s, m) => s + Object.keys(m || {}).length, 0)
      if (totalDays < 10) return
      // 本月卡片识别后不主动弹（用户可能只想看本月），下月卡片识别后才弹
      if (this.uploadMode !== 'dept') return
      uni.showModal({
        title: '识别完成',
        content: `共识别 ${this.doctorOrder.length || 1} 位医生 / ${totalDays} 条排班。是否顺便生成下月排班？AI 推理约需 5-10 秒。`,
        confirmText: '顺便生成',
        cancelText: '稍后再说',
        success: (r) => {
          if (r.confirm) this.generateDeptSchedule()
        }
      })
    },
    async parseScheduleFromMultiImages(paths) {
      // 多图：每张单独 OCR，结果合并到 scheduleMapByDoctor。
      // 合并策略：同一医生同一天若多图都有，后面的覆盖前面的（用户应按时间顺序选图）。
      this.parsing = true
      this.parseError = ''
      this.parseNeedsReview = false
      uni.showLoading({ title: `正在识别 1/${paths.length}...` })

      const merged = {}
      let lastYear = this.currentYear
      let lastMonth = this.currentMonth
      let lastConfidence = 1
      let anyNeedsReview = false
      const failedIndexes = []

      try {
        for (let i = 0; i < paths.length; i++) {
          uni.showLoading({ title: `正在识别 ${i + 1}/${paths.length}...` })
          try {
            const compressed = await this.compressForOCR(paths[i])
            const base64 = await this.readAsBase64(compressed)
            if (!base64) throw new Error('IMAGE_READ_FAIL')

            const callRes = await uniCloud.callFunction({
              name: 'ocr-schedule',
              data: withAuth({
                image: base64,
                hintYear: this.currentYear,
                hintMonth: this.currentMonth,
                hintDoctorName: this.doctorName === '医生' ? '' : this.doctorName
              })
            })
            const result = callRes && callRes.result
            if (!result || !result.ok) {
              failedIndexes.push(i + 1)
              continue
            }
            // 合并 byDoctor
            const byDoctor = result.scheduleMapByDoctor || {}
            for (const [name, dayMap] of Object.entries(byDoctor)) {
              if (!merged[name]) merged[name] = {}
              Object.assign(merged[name], dayMap || {})
            }
            if (Number.isInteger(result.year)) lastYear = result.year
            if (Number.isInteger(result.month)) lastMonth = result.month
            if (typeof result.confidence === 'number') {
              lastConfidence = Math.min(lastConfidence, result.confidence)
            }
            if (result.needsReview) anyNeedsReview = true
          } catch (e) {
            failedIndexes.push(i + 1)
          }
        }

        if (!Object.keys(merged).length) {
          throw new Error('ALL_IMAGES_FAILED')
        }

        this.scheduleMapByDoctor = merged
        this.doctorOrder = Object.keys(merged)
        const primary = this.doctorOrder[0] || '医生'
        this.doctorName = primary
        this.scheduleMap = merged[primary] || {}
        if (!this.lockToRealMonth) {
          this.currentYear = lastYear
          this.currentMonth = lastMonth
        }
        this.parseConfidence = lastConfidence
        this.parseNeedsReview = anyNeedsReview
        this.posterReady = false

        uni.hideLoading()
        this.parsing = false

        if (failedIndexes.length) {
          uni.showModal({
            title: '部分图片识别失败',
            content: `第 ${failedIndexes.join('、')} 张未识别成功，已用其余图片合并结果。可重新拍摄失败图片再次上传以补全。`,
            showCancel: false
          })
        } else {
          this._maybePromptGenerateDept()
        }
      } catch (err) {
        uni.hideLoading()
        this.parsing = false
        this.parseError = err.message || 'UNKNOWN'
        uni.showModal({
          title: '识别失败',
          content: '所有图片都未能识别。请检查网络，或换一张更清晰的截图。',
          showCancel: false
        })
      }
    },
    async parseScheduleFromExcel(arrayBuffer, fileName) {
      // 动态加载 SheetJS（xlsx）——只在用户真用时才载入，避免打包体积膨胀。
      this.parsing = true
      this.parseError = ''
      uni.showLoading({ title: '正在解析 Excel...' })
      try {
        let XLSX
        try {
          XLSX = require('xlsx')
        } catch (e) {
          uni.hideLoading()
          this.parsing = false
          uni.showModal({
            title: 'Excel 解析未安装',
            content: '需要在 HBuilderX 中给项目安装 xlsx 包：\n\n1. 终端 cd 到项目根\n2. 跑 npm install xlsx\n3. HBuilderX 重新编译\n\n暂时可以先把 Excel 截图上传。',
            showCancel: false
          })
          return
        }
        const wb = XLSX.read(arrayBuffer, { type: 'array' })
        const firstSheet = wb.SheetNames[0]
        const sheet = wb.Sheets[firstSheet]
        // 转成行/列数组（保留空单元）：[[行1单元1, 行1单元2, ...], [行2...], ...]
        const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false })
        if (!grid.length) throw new Error('EMPTY_SHEET')

        const parsed = this._parseExcelGrid(grid)
        if (!parsed || !Object.keys(parsed.scheduleMapByDoctor).length) {
          throw new Error('NO_DATA_PARSED')
        }

        this.scheduleMapByDoctor = parsed.scheduleMapByDoctor
        this.doctorOrder = Object.keys(parsed.scheduleMapByDoctor)
        const primary = this.doctorOrder[0]
        this.doctorName = primary
        this.scheduleMap = parsed.scheduleMapByDoctor[primary] || {}
        if (Number.isInteger(parsed.year) && !this.lockToRealMonth) this.currentYear = parsed.year
        if (Number.isInteger(parsed.month) && !this.lockToRealMonth) this.currentMonth = parsed.month
        this.parseConfidence = 0.9
        this.parseNeedsReview = false
        this.posterReady = false
        this._setSourcePreview('')  // Excel 没图片预览
        uni.hideLoading()
        this.parsing = false
        uni.showToast({ title: `${fileName} 解析完成`, icon: 'success' })
        this._maybePromptGenerateDept()
      } catch (err) {
        uni.hideLoading()
        this.parsing = false
        this.parseError = err.message || 'UNKNOWN'
        uni.showModal({
          title: 'Excel 解析失败',
          content: '请确认表格首行是日期（1/2/3…），首列是医生姓名。表格格式差异较大时，建议改用图片上传。',
          showCancel: false
        })
      }
    },
    _parseExcelGrid(grid) {
      // 通用启发式：
      //   - 找到"看起来是日期表头"的那一行（>= 5 个连续整数 1..31）
      //   - 该行下面每一行：首列姓名 + 后续单元 = 班次字符串
      //   - 用 shiftDict 那套逻辑映射班次（前端没 import，先做简单映射）
      const headerRowIdx = this._findExcelHeaderRow(grid)
      if (headerRowIdx === -1) return null
      const headerRow = grid[headerRowIdx]
      const dayColumns = []
      for (let c = 0; c < headerRow.length; c++) {
        const n = parseInt(String(headerRow[c]).trim(), 10)
        if (Number.isInteger(n) && n >= 1 && n <= 31) {
          dayColumns.push({ col: c, day: n })
        }
      }
      if (dayColumns.length < 5) return null

      const scheduleMapByDoctor = {}
      for (let r = headerRowIdx + 1; r < grid.length; r++) {
        const row = grid[r]
        if (!row || !row.length) continue
        const name = String(row[0] || '').trim()
        if (!name || /^\d/.test(name)) continue
        if (name.length > 8) continue
        const dayMap = {}
        for (const { col, day } of dayColumns) {
          const raw = String(row[col] || '').trim()
          if (!raw) continue
          const key = this._mapShiftText(raw)
          if (key) dayMap[String(day)] = key
        }
        if (Object.keys(dayMap).length >= 3) {
          scheduleMapByDoctor[name] = dayMap
        }
      }
      return { scheduleMapByDoctor, year: this.currentYear, month: this.currentMonth }
    },
    _findExcelHeaderRow(grid) {
      for (let r = 0; r < Math.min(grid.length, 8); r++) {
        const row = grid[r] || []
        let cnt = 0
        for (const cell of row) {
          const n = parseInt(String(cell).trim(), 10)
          if (Number.isInteger(n) && n >= 1 && n <= 31) cnt++
        }
        if (cnt >= 5) return r
      }
      return -1
    },
    _mapShiftText(raw) {
      // 极简映射：与 shiftDict 大类对齐，覆盖最常见的 80% 写法。
      const s = String(raw).replace(/[\s　.,，。·]+/g, '').toLowerCase()
      if (!s || /^[-—]+$/.test(s)) return 'rest'
      if (/休|放|公休|调|节|假|元旦|春节|国庆|劳动|清明|端午|中秋/.test(s)) return 'rest'
      if (/夜|急|d夜|急诊|夜班|夜出|下夜/.test(s)) return 'emergency'
      if (/早/.test(s)) return 'early'
      if (/白|日|上午|下午|班/.test(s)) return 'day'
      return null
    },
    async parseScheduleFromImage(tempFilePath) {
      this.parsing = true
      this.parseError = ''
      this.parseNeedsReview = false
      uni.showLoading({ title: '正在识别排班表...' })

      try {
        const compressed = await this.compressForOCR(tempFilePath)
        const base64 = await this.readAsBase64(compressed)
        if (!base64) throw new Error('IMAGE_READ_FAIL')

        const callRes = await uniCloud.callFunction({
          name: 'ocr-schedule',
          data: withAuth({
            image: base64,
            hintYear: this.currentYear,
            hintMonth: this.currentMonth,
            hintDoctorName: this.doctorName === '医生' ? '' : this.doctorName
          })
        })
        const result = callRes && callRes.result
        if (!result || !result.ok) {
          const code = (result && result.code) || 'UNKNOWN'
          const msg = (result && result.message) || '识别失败，请重试'
          throw Object.assign(new Error(code), { userMessage: msg })
        }

        // 多医生：scheduleMapByDoctor 是核心，doctorOrder 用于选择器
        this.scheduleMapByDoctor = result.scheduleMapByDoctor || {}
        this.doctorOrder = Array.isArray(result.doctorOrder) ? result.doctorOrder : []
        // 当前显示的医生：服务端推断的 primary（hint 命中或第一个）
        const primary = result.doctorName || (this.doctorOrder[0] || '医生')
        this.doctorName = primary
        this.scheduleMap = this.scheduleMapByDoctor[primary] || result.scheduleMap || {}

        if (Number.isInteger(result.year) && !this.lockToRealMonth) this.currentYear = result.year
        if (Number.isInteger(result.month) && result.month >= 1 && result.month <= 12 && !this.lockToRealMonth) {
          this.currentMonth = result.month
        }
        this.parseConfidence = typeof result.confidence === 'number' ? result.confidence : 0
        this.parseNeedsReview = !!result.needsReview

        // 识别只产生"本月"数据，下月预览要重置 → 等用户点 AI 才显示
        this.posterReady = false

        uni.hideLoading()
        this.parsing = false
        // 识别成功后弹卡片：顺便生成下月吗？仅在样本量足够时弹，避免浪费
        this._maybePromptGenerateDept()
        // 不打扰：日历已自动填好，置信度低时通过 parseNeedsReview 标记在 UI 上
      } catch (err) {
        uni.hideLoading()
        this.parsing = false
        this.parseError = err.message || 'UNKNOWN'
        const userMsg = err.userMessage || (err.message === 'IMAGE_READ_FAIL' ? '图片读取失败' : '识别失败，请检查网络或重换一张更清晰的截图')
        uni.showModal({
          title: '识别失败',
          content: `${userMsg}\n你可以重新拍照、换一张图，或先按"加载示例"快速体验。`,
          confirmText: '加载示例',
          cancelText: '关闭',
          success: (modal) => {
            if (modal.confirm) {
              this.scheduleMap = {}
              this.seedSchedule()
              this.parseError = ''
            }
          }
        })
      }
    },
    compressForOCR(filePath) {
      return new Promise((resolve) => {
        // #ifdef H5
        resolve(filePath)
        return
        // #endif
        // #ifndef H5
        uni.compressImage({
          src: filePath,
          quality: 70,
          success: (res) => resolve(res.tempFilePath || filePath),
          fail: () => resolve(filePath)
        })
        // #endif
      })
    },
    readAsBase64(filePath) {
      return new Promise((resolve, reject) => {
        // #ifdef MP-WEIXIN
        const fsm = wx.getFileSystemManager()
        fsm.readFile({
          filePath,
          encoding: 'base64',
          success: (r) => resolve(r.data),
          fail: () => reject(new Error('IMAGE_READ_FAIL'))
        })
        return
        // #endif
        // #ifdef APP-PLUS
        plus.io.resolveLocalFileSystemURL(filePath, (entry) => {
          entry.file((file) => {
            const reader = new plus.io.FileReader()
            reader.onloadend = (e) => {
              const data = String(e.target.result || '').replace(/^data:image\/[a-zA-Z]+;base64,/, '')
              resolve(data)
            }
            reader.onerror = () => reject(new Error('IMAGE_READ_FAIL'))
            reader.readAsDataURL(file)
          }, () => reject(new Error('IMAGE_READ_FAIL')))
        }, () => reject(new Error('IMAGE_READ_FAIL')))
        return
        // #endif
        // #ifdef H5
        fetch(filePath)
          .then(r => r.blob())
          .then(blob => {
            const reader = new FileReader()
            reader.onloadend = () => {
              const data = String(reader.result || '').replace(/^data:image\/[a-zA-Z]+;base64,/, '')
              resolve(data)
            }
            reader.onerror = () => reject(new Error('IMAGE_READ_FAIL'))
            reader.readAsDataURL(blob)
          })
          .catch(() => reject(new Error('IMAGE_READ_FAIL')))
        // #endif
      })
    },
    seedSchedule() {
      if (Object.keys(this.scheduleMap).length) return
      const map = {}
      for (let day = 1; day <= 31; day++) {
        const mod = day % 7
        if (mod === 0 || mod === 1) map[day] = 'rest'
        else if (mod === 2) map[day] = 'early'
        else if (mod === 4) map[day] = 'emergency'
        else map[day] = 'day'
      }
      this.scheduleMap = map
      this.parseConfidence = 1
      this.parseNeedsReview = false
    },
    defaultShift(day) {
      return this.scheduleMap[day] || 'rest'
    },
    cycleShift(item) {
      if (item.muted) return
      const keys = this.shiftTypes.map(s => s.key)
      const current = keys.indexOf(item.shift)
      const next = keys[(current + 1) % keys.length]
      const nextMap = {
        ...this.scheduleMap,
        [item.day]: next
      }
      this.scheduleMap = nextMap
      // 同步回写多医生表，避免切换医生后改动丢失
      if (this.doctorName) {
        this.scheduleMapByDoctor = {
          ...this.scheduleMapByDoctor,
          [this.doctorName]: nextMap
        }
      }
      this.safeVibrate()
      // 连排违规由日历红框永久标示（calendarDays computed 重算），不再额外弹 toast
    },
    getShift(type) {
      return this.shiftTypes.find(s => s.key === type) || this.shiftTypes.find(s => s.key === 'rest') || this.shiftTypes[0]
    },
    getShiftShort(type) {
      return this.getShift(type).short
    },
    getShiftColor(type) {
      return this.getShift(type).color
    },
    getShiftStyle(type) {
      const shift = this.getShift(type)
      return `background-color: ${shift.color}16; color: ${shift.color};`
    },
    formatShiftLabel(shift) {
      const short = (shift.short || '班').trim()
      const time = (shift.time || '').trim()
      return time ? `${short} ${time}` : short
    },
    editName() {
      uni.showModal({
        title: '修改姓名',
        editable: true,
        placeholderText: '请输入分享图上的姓名',
        content: this.doctorName,
        success: (res) => {
          if (res.confirm && res.content) {
            this.doctorName = res.content.trim()
            uni.setStorageSync('user_name', this.doctorName)
          }
        }
      })
    },
    editShiftTime(shift) {
      this.editingShift = shift.key
      this.shiftDraft = { ...shift }
    },
    addShiftType() {
      const index = this.shiftTypes.length + 1
      const color = this.colorOptions[(index - 1) % this.colorOptions.length]
      const shift = {
        key: `custom_${Date.now()}`,
        name: '新班次',
        short: '新',
        time: '',
        color
      }
      this.shiftTypes = [...this.shiftTypes, shift]
      this.persistShiftTypes()
      this.editShiftTime(shift)
    },
    closeShiftEditor() {
      this.editingShift = null
    },
    switchDoctor(name) {
      if (!name || !this.scheduleMapByDoctor[name]) return
      this.doctorName = name
      this.scheduleMap = this.scheduleMapByDoctor[name] || {}
    },
    // 下月排班预览区：取某医生某天的班次（用 posterScheduleMapByDoctor）
    getPosterCellLabel(name, day) {
      const map = (this.posterScheduleMapByDoctor && this.posterScheduleMapByDoctor[name])
        || (name === this.doctorName ? this.scheduleMap : null)
      if (!map) return ''
      const key = map[String(day)]
      if (!key || key === 'rest') return ''
      const shift = this.getShift(key)
      return shift ? shift.short : ''
    },
    getPosterCellStyle(name, day) {
      const map = (this.posterScheduleMapByDoctor && this.posterScheduleMapByDoctor[name])
        || (name === this.doctorName ? this.scheduleMap : null)
      if (!map) return ''
      const key = map[String(day)]
      const shift = this.getShift(key)
      if (!shift || key === 'rest') return 'color: #98a2b3;'
      return `color: ${shift.color}; background: ${this.tintColor(shift.color, 0.88)};`
    },
    goToProForWatermark() {
      uni.showModal({
        title: '去除水印',
        content: '开通一图灵 Pro 后，分享图不再显示水印。Pro 还包含：高级筛选、词典导出、AI 排班无限次。',
        confirmText: '去开通',
        cancelText: '稍后',
        success: (res) => {
          if (res.confirm) uni.navigateTo({ url: '/pages/vip/vip' })
        }
      })
    },
    // 导出排班为 CSV（Excel 可直接打开）。csv 在医生数多/天数多时是更可靠的备选
    exportCsv() {
      try {
        const doctors = this.posterDoctorList
        const days = this.posterDayList
        const lines = []
        lines.push(['医生', ...days.map(d => `${d}日`)].join(','))
        doctors.forEach(name => {
          const map = (this.posterScheduleMapByDoctor && this.posterScheduleMapByDoctor[name])
            || this.scheduleMapByDoctor[name]
            || (name === this.doctorName ? this.scheduleMap : {})
          const row = [this.csvEscape(name)]
          days.forEach(d => {
            const key = (map || {})[String(d)]
            const shift = this.getShift(key)
            row.push(this.csvEscape(shift && key !== 'rest' ? shift.short : ''))
          })
          lines.push(row.join(','))
        })
        const csv = '﻿' + lines.join('\n') // BOM 让 Excel 正确识别 UTF-8 中文
        const yLabel = this.posterYear || this.currentYear
        const mLabel = this.posterMonth || this.currentMonth
        const fileName = `${yLabel}-${String(mLabel).padStart(2, '0')}-科室排班.csv`
        // #ifdef APP-PLUS
        const dir = `_doc/${fileName}`
        plus.io.resolveLocalFileSystemURL(plus.io.convertLocalFileSystemURL('_doc/'), (entry) => {
          entry.getFile(fileName, { create: true, exclusive: false }, (fileEntry) => {
            fileEntry.createWriter((writer) => {
              writer.onwrite = () => {
                const realPath = plus.io.convertLocalFileSystemURL(dir)
                uni.showActionSheet({
                  itemList: ['保存到手机', '分享给好友'],
                  success: (r) => {
                    if (r.tapIndex === 0) {
                      uni.showModal({ title: '已保存', content: `文件保存到：${realPath}\n\n用文件管理器打开即可，或在微信「文件传输助手」分享给电脑。`, showCancel: false })
                    } else {
                      uni.share({
                        provider: 'weixin', scene: 'WXSceneSession', type: 1, summary: fileName,
                        href: realPath, title: fileName,
                        fail: () => uni.showToast({ title: '分享失败，已保存到手机', icon: 'none' })
                      })
                    }
                  }
                })
              }
              writer.write(csv)
            })
          })
        })
        // #endif
        // #ifndef APP-PLUS
        uni.setClipboardData({
          data: csv,
          success: () => uni.showModal({ title: '已复制 CSV', content: '内容已复制到剪贴板，粘贴到 Excel/WPS 即可。', showCancel: false })
        })
        // #endif
      } catch (e) {
        uni.showToast({ title: '导出失败：' + (e.message || ''), icon: 'none' })
      }
    },
    csvEscape(s) {
      // 兼容旧调用点（template 里还可能引用 this.csvEscape），转发到 common util
      return csvEscape(s)
    },
    // 仅允许删除自定义班次（key 以 custom_ 开头），内置 day/early/emergency/rest 不可删
    canDeleteShift(shift) {
      return shift && typeof shift.key === 'string' && shift.key.startsWith('custom_')
    },
    deleteShiftType(shift) {
      if (!this.canDeleteShift(shift)) return
      uni.showModal({
        title: '删除班次',
        content: `确定删除「${shift.short || '该班次'}」？已经标记此班次的日期会重置为休班。`,
        confirmText: '删除',
        confirmColor: '#f04438',
        success: (res) => {
          if (!res.confirm) return
          this.shiftTypes = this.shiftTypes.filter(item => item.key !== shift.key)
          // 已使用该班次的日期回退到 rest，避免日历上引用不存在的 key
          const updated = {}
          Object.keys(this.scheduleMap || {}).forEach(day => {
            updated[day] = this.scheduleMap[day] === shift.key ? 'rest' : this.scheduleMap[day]
          })
          this.scheduleMap = updated
          this.persistShiftTypes()
          this.closeShiftEditor()
          uni.showToast({ title: '已删除', icon: 'success' })
        }
      })
    },
    saveShiftEdit() {
      const draft = {
        ...this.shiftDraft,
        short: (this.shiftDraft.short || '').trim() || '班',
        name: (this.shiftDraft.short || '').trim() || '班次',
        time: (this.shiftDraft.time || '').trim()
      }
      this.shiftTypes = this.shiftTypes.map(item => item.key === draft.key ? draft : item)
      this.persistShiftTypes()
      this.closeShiftEditor()
    },
    persistShiftTypes() {
      const saved = {}
      this.shiftTypes.forEach(item => {
        saved[item.key] = {
          name: item.name,
          short: item.short,
          time: item.time,
          color: item.color
        }
      })
      uni.setStorageSync('ytl_shift_times', saved)
    },
    saveLocal() {
      // posterReady 时保存 AI 生成的下月排班；否则保存本月
      const useNext = this.posterReady && this.posterYear && this.posterMonth
      const data = {
        id: Date.now(),
        doctorName: this.doctorName,
        year: useNext ? this.posterYear : this.currentYear,
        month: useNext ? this.posterMonth : this.currentMonth,
        scheduleMap: useNext
          ? ((this.posterScheduleMapByDoctor || {})[this.doctorName] || {})
          : this.scheduleMap,
        scheduleMapByDoctor: useNext ? this.posterScheduleMapByDoctor : this.scheduleMapByDoctor,
        doctorOrder: this.doctorOrder,
        sourceImage: this.sourceImage,
        createdAt: new Date().toISOString()
      }
      const list = uni.getStorageSync('ytl_schedule_drafts') || []
      list.unshift(data)
      uni.setStorageSync('ytl_schedule_drafts', list)
      uni.showToast({ title: '排班草稿已保存', icon: 'success' })
    },
    async copyShareLink() {
      if (!this.canSharePoster) {
        uni.showModal({
          title: '请先核对识别结果',
          content: '识别置信度偏低或仍需复核。请先把整月排班核对一遍，再生成可分享的网页链接，避免错班次扩散。',
          showCancel: false
        })
        return
      }
      // 复制链接如果想启用"在线响应"，必须登录；未登录只生成只读链接（不含 shareId）
      const id = getCallerIdentity()
      let scope = 'self'  // 'self' 仅本人 / 'team' 全科室（响应人能选自己）
      if (!id.loggedIn) {
        const proceed = await new Promise(r => {
          uni.showModal({
            title: '是否登录后分享',
            content: '登录后分享的链接支持同事在线「同意/请假/备注」，未登录只能分享纯只读视图。',
            confirmText: '去登录',
            cancelText: '只读分享',
            success: rr => r(rr.confirm ? 'login' : 'readonly')
          })
        })
        if (proceed === 'login') {
          uni.navigateTo({ url: '/pages/account/login' })
          return
        }
      } else {
        // 登录用户：让发布人显式选分享范围（合规默认仅本人）
        scope = await new Promise(r => uni.showActionSheet({
          itemList: [
            '仅分享我自己的班次（推荐 · 不暴露全员名单）',
            '分享全科室班表（响应人能选自己 + 在线请假）'
          ],
          success: rr => r(rr.tapIndex === 1 ? 'team' : 'self'),
          fail: () => r('self')
        }))
      }
      // posterReady 时分享下月 AI 生成的内容；否则分享本月
      const useNext = this.posterReady && this.posterYear && this.posterMonth
      const shareYear = useNext ? this.posterYear : this.currentYear
      const shareMonth = useNext ? this.posterMonth : this.currentMonth
      const shareMap = useNext
        ? ((this.posterScheduleMapByDoctor || {})[this.doctorName] || {})
        : (this.scheduleMap || {})
      if (!Object.keys(shareMap).length) {
        uni.showToast({ title: '当前无可分享的排班', icon: 'none' })
        return
      }
      let url
      try {
        const encoded = encodeSchedulePayload({
          doctorName: this.doctorName || '医生',
          year: shareYear,
          month: shareMonth,
          scheduleMap: shareMap,
          shiftTypes: this.shiftTypes
        })
        url = `${H5_SHARE_BASE}?d=${encoded}`
      } catch (e) {
        uni.showModal({ title: '生成链接失败', content: (e && e.message) || '请稍后重试', showCancel: false })
        return
      }
      // 尝试同时上传一份到云端，附带 shareId 用于 H5 → App 响应。失败不阻塞，链接仍可用（只读）。
      try {
        const identity = getCallerIdentity()
        if (!identity.loggedIn) {
          // 未登录就不上云，链接仍可分享只读视图
          console.log('[share] not logged in, skip cloud upload')
        } else {
          const fullMapByDoctor = useNext
            ? (this.posterScheduleMapByDoctor || {})
            : (this.scheduleMapByDoctor && Object.keys(this.scheduleMapByDoctor).length
                ? this.scheduleMapByDoctor
                : { [this.doctorName || '医生']: this.scheduleMap || {} })
          // scope='self' 时只把自己那一行上传，避免暴露全员
          const ownerName = identity.name || this.doctorName || '医生'
          const uploadByDoctor = scope === 'self'
            ? { [ownerName]: fullMapByDoctor[ownerName] || shareMap }
            : fullMapByDoctor
          const callRes = await uniCloud.callFunction({
            name: 'schedule-share',
            data: withAuth({
              action: 'create',
              ownerName,
              year: shareYear,
              month: shareMonth,
              scheduleMapByDoctor: uploadByDoctor,
              scheduleMap: shareMap,
              shiftTypes: this.shiftTypes,
              title: `${shareYear}年${shareMonth}月排班`,
              allowResponses: true,
              isPublic: true,
              scope
            })
          })
          const r = callRes && callRes.result
          if (r && r.ok && r.shareId) {
            url = `${url}&s=${encodeURIComponent(r.shareId)}`
            this.lastShareId = r.shareId
            // 有效行为：尝试触发邀请奖励发放（节流到每天 1 次，静默）
            tryClaimInviteReward()
          }
        }
      } catch (e) {
        // 静默失败，仍返回纯本地链接
        console.log('[share] cloud upload skipped:', e && e.message)
      }
      // 一些渠道（钉钉/某些 webview）对超长 URL 不友好，2k+ 时提醒
      if (url.length > 2000) {
        uni.showModal({
          title: '链接较长',
          content: `生成的网页链接长 ${url.length} 字符，部分聊天工具可能截断。建议改用「分享图片」。`,
          confirmText: '仍要复制',
          success: (r) => { if (r.confirm) this._writeToClipboard(url) }
        })
        return
      }
      this._writeToClipboard(url)
    },
    _writeToClipboard(text) {
      uni.setClipboardData({
        data: text,
        success: () => {
          uni.showToast({ title: '链接已复制，可粘贴到微信', icon: 'none', duration: 2200 })
        },
        fail: () => {
          uni.showModal({ title: '复制失败', content: text, showCancel: false })
        }
      })
    },
    viewResponses() {
      this.markResponsesRead()
      if (this.lastShareId) {
        uni.navigateTo({ url: `/pages/schedule/responses?s=${encodeURIComponent(this.lastShareId)}` })
        return
      }
      // 没有刚生成的 shareId 但云端确有分享 → 跳"我的分享历史"页
      if (this.responsesTotal) {
        uni.navigateTo({ url: '/pages/schedule/my-shares' })
        return
      }
      uni.showToast({ title: '请先复制链接以创建分享', icon: 'none' })
    },
    sharePoster() {
      if (this.parsing) {
        uni.showToast({ title: '识别中，请稍候', icon: 'none' })
        return
      }
      if (!this.canSharePoster) {
        uni.showModal({
          title: '请先核对识别结果',
          content: '识别置信度偏低或有未确认项。点击日期循环切换班次，把整月排班核对一遍后再分享，避免错班次扩散。',
          confirmText: '已核对',
          cancelText: '继续校对',
          success: (res) => {
            if (res.confirm) {
              this.parseNeedsReview = false
              this.parseConfidence = 1
              this.sharePoster()
            }
          }
        })
        return
      }
      this.saveLocal()
      if (this.exportingPoster) return
      this.exportingPoster = true
      uni.showLoading({ title: '正在生成分享图...' })
      this.$nextTick(() => {
        this.drawPosterToCanvas()
      })
    },
    drawPosterToCanvas() {
      // 视觉语言：模仿真实科室排班表（姓名列 + 1-31 日横轴 + 每人一行）。
      // 海报宽 1080，高度按医生数自适应。
      // posterReady 时画下月 AI 结果；否则画本月日历
      const useNext = this.posterReady && this.posterYear && this.posterMonth
      const drawYear = useNext ? this.posterYear : this.currentYear
      const drawMonth = useNext ? this.posterMonth : this.currentMonth
      const drawMonthLabel = useNext ? this.posterMonthLabel : this.monthLabel
      const dataByDoctor = useNext
        ? (this.posterScheduleMapByDoctor || {})
        : (this.scheduleMapByDoctor && Object.keys(this.scheduleMapByDoctor).length
            ? this.scheduleMapByDoctor
            : { [this.doctorName || '医生']: this.scheduleMap || {} })
      const doctors = Object.keys(dataByDoctor).length
        ? Object.keys(dataByDoctor)
        : (this.doctorOrder && this.doctorOrder.length ? this.doctorOrder : [this.doctorName || '医生'])

      const daysInMonth = new Date(drawYear, drawMonth, 0).getDate()

      // 自适应 canvas 尺寸（必须先 setData，再下一帧才生效；这里直接重设并 nextTick 重绘）
      const cardPadX = 36
      const pageMargin = 32
      const w = 1080
      const headerArea = 200       // 标题 + 副标
      const legendArea = 70        // 图例
      const tableHeaderH = 86      // 日期 + 星期 双行
      const rowH = 80              // 每个医生一行
      const footerArea = 96
      const tableH = tableHeaderH + rowH * doctors.length
      const h = pageMargin * 2 + headerArea + legendArea + tableH + footerArea

      // 写回 canvas size 让 .vue template 的 :style 跟上
      if (this.posterCanvasWidth !== w || this.posterCanvasHeight !== h) {
        this.posterCanvasWidth = w
        this.posterCanvasHeight = h
        // 等下一帧再画
        this.$nextTick(() => this.drawPosterToCanvas())
        return
      }

      const ctx = uni.createCanvasContext('schedulePosterCanvas', this)

      // 班次配色
      const shiftFill = {
        day:       { bg: '#E8F2FF', text: '#1F6FEB', label: '白' },
        early:     { bg: '#FFF4DC', text: '#B26A00', label: '早' },
        emergency: { bg: '#FDE2E1', text: '#D9342B', label: '急' },
        night_off: { bg: '#EDE4FB', text: '#7C3AED', label: '下' },
        rest:      { bg: '#F2F3F5', text: '#86868B', label: '休' }
      }
      const getShiftFill = (key) => {
        if (shiftFill[key]) return shiftFill[key]
        const shift = this.getShift(key)
        return { bg: this.tintColor(shift.color, 0.88), text: shift.color, label: shift.short }
      }

      // === 1. 整体背景 + 白卡 ===
      ctx.setFillStyle('#F5F5F7')
      ctx.fillRect(0, 0, w, h)
      ctx.setFillStyle('#FFFFFF')
      this.roundRect(ctx, pageMargin, pageMargin, w - pageMargin * 2, h - pageMargin * 2, 24)
      ctx.fill()

      // === 2. 顶部品牌区（仿 HBuilderX 启动屏风格：圆角 logo + 大字品牌）===
      const headerTop = pageMargin + 28
      const logoSize = 96
      const logoX = cardPadX
      const logoY = headerTop

      // logo 圆角底（写入图片前先画一个圆角白色底，统一视觉）
      ctx.save()
      ctx.setFillStyle('#FFFFFF')
      this.roundRect(ctx, logoX, logoY, logoSize, logoSize, 22)
      ctx.fill()
      // 边框
      ctx.setStrokeStyle('#E5E5EA')
      ctx.setLineWidth(1)
      this.roundRect(ctx, logoX, logoY, logoSize, logoSize, 22)
      ctx.stroke()
      ctx.restore()
      // 画 logo 图片（异步加载，drawImage 在 canvas 上同步绘制）
      ctx.drawImage('/static/logo.png', logoX + 4, logoY + 4, logoSize - 8, logoSize - 8)

      // 右侧品牌字：第一行"一图灵"超大字，第二行"科室排班 · {monthLabel}"
      const brandX = logoX + logoSize + 26
      ctx.setFillStyle('#1D1D1F')
      ctx.font = 'bold 60px -apple-system, "PingFang SC", sans-serif'
      ctx.setFontSize(60)
      ctx.fillText('一图灵', brandX, logoY + 50)

      ctx.setFillStyle('#3C3C43')
      ctx.setFontSize(26)
      ctx.fillText(`科室排班表 · ${drawMonthLabel}`, brandX, logoY + 86)

      // 副信息（医生人数）放在 brand 区域下方
      ctx.setFillStyle('#8E8E93')
      ctx.setFontSize(22)
      ctx.fillText(`${doctors.length} 位医生 · 仅用于排班整理与分享`, cardPadX, logoY + logoSize + 36)

      // === 3. 班次图例 ===
      const legendTop = headerTop + headerArea - 64
      const legendH = 52
      const usedShifts = ['day', 'early', 'emergency', 'night_off', 'rest'].filter(k =>
        Object.values(dataByDoctor).some(map => Object.values(map || {}).includes(k))
      )
      const legendItems = usedShifts.length ? usedShifts : ['early', 'emergency', 'night_off', 'rest']
      const legendGap = 14
      const totalLegendW = w - cardPadX * 2
      const legendItemW = (totalLegendW - legendGap * (legendItems.length - 1)) / legendItems.length
      legendItems.forEach((key, i) => {
        const cfg = getShiftFill(key)
        const lx = cardPadX + i * (legendItemW + legendGap)
        ctx.setFillStyle(cfg.bg)
        this.roundRect(ctx, lx, legendTop, legendItemW, legendH, 12)
        ctx.fill()
        const shiftCfg = this.shiftTypes.find(s => s.key === key)
        const labelText = shiftCfg ? `${shiftCfg.short} ${shiftCfg.time || ''}`.trim() : cfg.label
        ctx.setFillStyle(cfg.text)
        ctx.setFontSize(22)
        ctx.fillText(labelText, lx + 18, legendTop + legendH / 2 + 8)
      })

      // === 4. 主表格：姓名 | 1 | 2 | ... | 31 ===
      const tableTop = legendTop + legendH + 28
      const nameColW = 120
      const dayColW = (w - cardPadX * 2 - nameColW) / daysInMonth

      // 表头：日期 + 星期
      const dayRowY = tableTop
      const wkRowY = tableTop + 44
      // 姓名列 header（"医生"两字）
      ctx.setFillStyle('#F7F7F9')
      ctx.fillRect(cardPadX, tableTop, nameColW, tableHeaderH)
      ctx.setFillStyle('#1D1D1F')
      ctx.font = 'bold 26px sans-serif'
      ctx.setFontSize(26)
      ctx.fillText('医生', cardPadX + nameColW / 2 - 26, tableTop + tableHeaderH / 2 + 9)

      for (let day = 1; day <= daysInMonth; day++) {
        const x = cardPadX + nameColW + (day - 1) * dayColW
        const wkIdx = new Date(drawYear, drawMonth - 1, day).getDay()
        const isWeekend = wkIdx === 0 || wkIdx === 6
        const holiday = getHoliday(drawYear, drawMonth, day)
        const isHoliday = !!holiday
        // 列背景（节假日比周末更醒目）
        ctx.setFillStyle(isHoliday ? '#FCE4DE' : (isWeekend ? '#FEF6F2' : '#FFFFFF'))
        ctx.fillRect(x, tableTop, dayColW, tableHeaderH)
        // 日期数字
        ctx.setFillStyle(isHoliday || isWeekend ? '#D9342B' : '#1D1D1F')
        ctx.setFontSize(22)
        const numStr = String(day)
        const numW = numStr.length * 11
        ctx.fillText(numStr, x + dayColW / 2 - numW / 2, dayRowY + 28)
        // 星期 / 节假日名称（节假日替换星期文案）
        ctx.setFillStyle(isHoliday || isWeekend ? '#D9342B' : '#86868B')
        if (isHoliday) {
          ctx.setFontSize(16)
          const nm = holiday.name.length > 2 ? holiday.name.slice(0, 2) : holiday.name
          const nmW = nm.length * 14
          ctx.fillText(nm, x + dayColW / 2 - nmW / 2, wkRowY + 28)
        } else {
          ctx.setFontSize(18)
          ctx.fillText(this.weeks[wkIdx], x + dayColW / 2 - 9, wkRowY + 28)
        }
      }

      // 表头横线
      ctx.setStrokeStyle('#D0D5DD')
      ctx.setLineWidth(1)
      ctx.beginPath()
      ctx.moveTo(cardPadX, tableTop + tableHeaderH)
      ctx.lineTo(w - cardPadX, tableTop + tableHeaderH)
      ctx.stroke()

      // 医生行
      doctors.forEach((name, dIdx) => {
        const rowTop = tableTop + tableHeaderH + dIdx * rowH
        const map = dataByDoctor[name] || {}

        // 姓名格
        ctx.setFillStyle(dIdx === doctors.indexOf(this.doctorName) ? '#FFFAEB' : '#FAFBFC')
        ctx.fillRect(cardPadX, rowTop, nameColW, rowH)
        ctx.setFillStyle('#1D1D1F')
        ctx.font = 'bold 28px sans-serif'
        ctx.setFontSize(28)
        // 姓名居中（截断长名）
        const displayName = name.length > 4 ? name.slice(0, 4) : name
        const nameW = displayName.length * 26
        ctx.fillText(displayName, cardPadX + nameColW / 2 - nameW / 2, rowTop + rowH / 2 + 10)

        // 班次格
        for (let day = 1; day <= daysInMonth; day++) {
          const x = cardPadX + nameColW + (day - 1) * dayColW
          const shift = map[String(day)] || 'rest'
          const cfg = getShiftFill(shift)
          ctx.setFillStyle(cfg.bg)
          ctx.fillRect(x + 1, rowTop + 1, dayColW - 2, rowH - 2)
          ctx.setFillStyle(cfg.text)
          ctx.font = 'bold 30px sans-serif'
          ctx.setFontSize(30)
          ctx.fillText(cfg.label, x + dayColW / 2 - 15, rowTop + rowH / 2 + 11)
        }

        // 行底分隔线
        ctx.setStrokeStyle('#ECEEF1')
        ctx.beginPath()
        ctx.moveTo(cardPadX, rowTop + rowH)
        ctx.lineTo(w - cardPadX, rowTop + rowH)
        ctx.stroke()
      })

      // 表格外框
      ctx.setStrokeStyle('#D0D5DD')
      ctx.setLineWidth(1)
      ctx.strokeRect(cardPadX, tableTop, w - cardPadX * 2, tableH)
      // 姓名列与日期列之间的竖线
      ctx.beginPath()
      ctx.moveTo(cardPadX + nameColW, tableTop)
      ctx.lineTo(cardPadX + nameColW, tableTop + tableH)
      ctx.stroke()

      // === 5. 底部水印（小 logo + 品牌 + 免责）===
      const footerTop = tableTop + tableH + 36
      ctx.setStrokeStyle('#E5E5EA')
      ctx.setLineWidth(1)
      ctx.beginPath()
      ctx.moveTo(cardPadX, footerTop)
      ctx.lineTo(w - cardPadX, footerTop)
      ctx.stroke()

      // 小 logo
      const footerLogoSize = 36
      ctx.drawImage('/static/logo.png', cardPadX, footerTop + 14, footerLogoSize, footerLogoSize)

      ctx.setFillStyle('#1F6FEB')
      ctx.font = 'bold 24px -apple-system, "PingFang SC", sans-serif'
      ctx.setFontSize(24)
      ctx.fillText('一图灵 App', cardPadX + footerLogoSize + 12, footerTop + 38)

      ctx.setFillStyle('#8E8E93')
      ctx.setFontSize(18)
      ctx.fillText('仅用于排班整理与分享，不涉及诊疗建议或科室审批决策。', cardPadX, footerTop + 76)

      ctx.draw(false, () => {
        uni.canvasToTempFilePath({
          canvasId: 'schedulePosterCanvas',
          fileType: 'jpg',
          quality: 0.95,
          // 显式传 canvas 全尺寸，避免被 CSS 宽度限制只截到一半
          x: 0,
          y: 0,
          width: w,
          height: h,
          destWidth: w,
          destHeight: h,
          success: (res) => {
            this.savePosterImage(res.tempFilePath)
          },
          fail: () => {
            uni.hideLoading()
            this.exportingPoster = false
            uni.showToast({ title: '分享图生成失败', icon: 'none' })
          }
        }, this)
      })
    },
    tintColor(hex, lightness) {
      return tintColor(hex, lightness)
    },
    savePosterImage(filePath) {
      uni.saveImageToPhotosAlbum({
        filePath,
        success: () => {
          uni.hideLoading()
          this.exportingPoster = false
          this.shareImage(filePath, '分享图已保存到相册')
        },
        fail: () => {
          uni.hideLoading()
          this.exportingPoster = false
          this.shareImage(filePath, '分享图已生成，请手动保存或分享')
        }
      })
    },
    shareImage(filePath, title) {
      if (typeof uni.share === 'function') {
        uni.share({
          provider: 'weixin',
          scene: 'WXSceneSession',
          type: 2,
          imageUrl: filePath,
          success: () => {
            this.grantSharePoints()
          },
          fail: () => {
            uni.showModal({
              title,
              content: '当前平台未唤起微信分享。图片文件已生成，App端授权相册后会优先保存到相册。',
              showCancel: false
            })
          }
        })
        return
      }

      uni.showModal({
        title,
        content: '当前平台不支持直接唤起微信分享。图片已生成，App端授权相册后会优先保存到相册。',
        showCancel: false
      })
    },
    grantSharePoints() {
      const today = new Date().toISOString().slice(0, 10)
      const sourceId = `${today}_${this.monthLabel}_${this.doctorName}`.replace(/\s+/g, '')
      const result = claimScheduleShareReward(sourceId)
      if (!result.ok) {
        if (result.reason === 'duplicate') {
          uni.showToast({ title: '本次排班图今日已记分', icon: 'none' })
        }
        return
      }
      uni.showToast({ title: '有效分享 +20 灵点', icon: 'none' })
    },
    roundRect(ctx, x, y, width, height, radius) {
      roundRect(ctx, x, y, width, height, radius)
    },
    safeVibrate() {
      try {
        if (typeof uni.vibrateShort === 'function') uni.vibrateShort()
      } catch (e) {}
    }
  }
}
</script>

<style>
view,
text,
scroll-view,
image {
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif;
}

.page {
  min-height: 100vh;
  background: #f6f7f9;
  color: #111827;
}

.poster-canvas {
  position: fixed;
  /* 放在不可见位置但保留实际像素尺寸，避免被屏幕宽度截断 */
  left: -20000px;
  top: 0;
  opacity: 0;
  pointer-events: none;
}

.status-bar {
  height: 88rpx;
}

.nav {
  height: 96rpx;
  padding: 0 32rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.back-btn,
.help-btn {
  width: 66rpx;
  height: 66rpx;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #111827;
  font-weight: 900;
}

.back-btn {
  font-size: 56rpx;
  padding-bottom: 8rpx;
}

.help-btn {
  font-size: 30rpx;
}

.nav-title {
  display: block;
  text-align: center;
  font-size: 32rpx;
  font-weight: 900;
}

.nav-subtitle {
  display: block;
  text-align: center;
  margin-top: 4rpx;
  font-size: 20rpx;
  color: #667085;
  font-weight: 700;
}

.scroll {
  height: calc(100vh - 184rpx);
  padding: 0 32rpx;
}

.hero {
  padding: 28rpx 4rpx 24rpx;
}

.hero-title {
  display: block;
  font-size: 46rpx;
  line-height: 1.16;
  font-weight: 900;
  color: #111827;
}

.hero-desc {
  display: block;
  margin-top: 16rpx;
  font-size: 25rpx;
  line-height: 1.55;
  color: #667085;
  font-weight: 650;
}

.upload-card,
.editor-card,
.share-preview {
  background: #fff;
  border-radius: 26rpx;
  box-shadow: 0 14rpx 36rpx rgba(17, 24, 39, 0.05);
}

.inline-upload-row {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin: 8rpx 0 20rpx 0;
  padding: 18rpx 22rpx;
  border-radius: 18rpx;
  background: linear-gradient(135deg, #EBF3FF 0%, #F7FAFF 100%);
  border: 2rpx dashed #1F6FEB;
}
.inline-upload-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 18rpx;
  background: #1F6FEB;
  color: #fff;
  text-align: center;
  line-height: 64rpx;
  font-size: 32rpx;
}
.inline-upload-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.inline-upload-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #1F2937;
}
.inline-upload-sub {
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #6B7280;
}
.inline-upload-cta {
  padding: 10rpx 22rpx;
  border-radius: 999rpx;
  background: #1F6FEB;
  color: #fff;
  font-size: 24rpx;
  font-weight: 600;
}
.inline-upload-thumb {
  width: 72rpx;
  height: 72rpx;
  border-radius: 14rpx;
  overflow: hidden;
}
.inline-upload-thumb image {
  width: 100%;
  height: 100%;
}

.upload-card {
  overflow: hidden;
  margin-bottom: 20rpx;
}

.upload-card-current {
  margin: 0 0 24rpx 0;
  border-radius: 16rpx;
  border: 2rpx dashed #1F6FEB;
  background: linear-gradient(180deg, #EBF3FF 0%, #FFFFFF 100%);
  box-shadow: 0 4rpx 16rpx rgba(31, 111, 235, 0.08);
}

.upload-card-current .upload-empty {
  height: 220rpx;
}

.upload-card-current .upload-title {
  color: #1F6FEB;
  font-weight: 700;
}

.upload-empty {
  height: 300rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #fff, #f8fbff);
}

.upload-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 28rpx;
  background: #1677ff;
  color: #fff;
  font-size: 58rpx;
  line-height: 88rpx;
  text-align: center;
  font-weight: 300;
}

.upload-title {
  margin-top: 24rpx;
  font-size: 30rpx;
  font-weight: 900;
  color: #111827;
}

.upload-desc {
  display: none;
}

.source-preview {
  height: 320rpx;
  position: relative;
}

.source-image {
  width: 100%;
  height: 100%;
}

.source-mask {
  position: absolute;
  left: 20rpx;
  right: 20rpx;
  bottom: 20rpx;
  padding: 16rpx 20rpx;
  border-radius: 16rpx;
  background: rgba(17, 24, 39, 0.72);
}

.source-status {
  color: #fff;
  font-size: 24rpx;
  font-weight: 900;
}

.section-head,
.preview-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.ai-warn-bar {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 20rpx;
  margin-bottom: 16rpx;
  background: #FFF7E6;
  border: 1rpx solid #FFD591;
  border-radius: 12rpx;
}

.ai-warn-icon {
  color: #D46B08;
  font-size: 28rpx;
}

.ai-warn-text {
  color: #874D00;
  font-size: 24rpx;
  flex: 1;
}

.section-title,
.preview-title {
  font-size: 31rpx;
  font-weight: 900;
}

.mini-btn,
.preview-tag {
  padding: 9rpx 16rpx;
  border-radius: 999rpx;
  background: #111827;
  color: #f7c85f;
  font-size: 21rpx;
  font-weight: 900;
}

.pro-tag {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #f7c85f 0%, #f59e0b 100%);
  color: #111827;
}

.pro-tag-text {
  font-size: 22rpx;
  font-weight: 900;
}

.pro-tag-sub {
  font-size: 18rpx;
  font-weight: 800;
  opacity: 0.7;
}

.empty-hint {
  margin: 26rpx 0;
  padding: 28rpx 22rpx;
  border-radius: 18rpx;
  background: #f8fafc;
  border: 1rpx dashed #e2e8f0;
  text-align: center;
}

.empty-hint-text {
  color: #98a2b3;
  font-size: 22rpx;
  font-weight: 700;
  line-height: 1.6;
}

.poster-logo {
  width: 64rpx;
  height: 64rpx;
  border-radius: 14rpx;
  background: #fff;
  margin-right: 18rpx;
}

.poster-title-box {
  flex: 1;
}

.poster-scroll {
  width: 100%;
  white-space: nowrap;
  margin-top: 18rpx;
}

.poster-table {
  display: inline-flex;
  flex-direction: column;
  min-width: 100%;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 16rpx;
  overflow: hidden;
}

.ptr-row {
  display: flex;
  align-items: stretch;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.08);
}

.ptr-row.ptr-header {
  background: rgba(255, 255, 255, 0.06);
}

.ptr-name {
  width: 96rpx;
  flex-shrink: 0;
  padding: 14rpx 8rpx;
  font-size: 22rpx;
  font-weight: 900;
  color: #fff;
  text-align: center;
  border-right: 1rpx solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ptr-day-h {
  width: 46rpx;
  flex-shrink: 0;
  text-align: center;
  padding: 14rpx 0;
  font-size: 20rpx;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.7);
}

.ptr-cell {
  width: 46rpx;
  flex-shrink: 0;
  padding: 14rpx 0;
  font-size: 22rpx;
  font-weight: 900;
  text-align: center;
  background: rgba(255, 255, 255, 0.02);
}

.tool-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18rpx;
  margin-bottom: 20rpx;
}

.tool-btn {
  min-height: 92rpx;
  border-radius: 22rpx;
  background: #fff;
  padding: 18rpx 22rpx;
  border: 1rpx solid #eef2f6;
  box-shadow: 0 12rpx 30rpx rgba(17, 24, 39, 0.04);
}

.tool-title {
  display: block;
  color: #111827;
  font-size: 26rpx;
  font-weight: 900;
}

.tool-desc {
  display: block;
  margin-top: 6rpx;
  color: #667085;
  font-size: 20rpx;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.editor-card {
  padding: 26rpx;
  margin-bottom: 30rpx;
  border: 1rpx solid #eef2f6;
}

.month-row {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
  align-items: flex-start;
  margin-bottom: 22rpx;
}

.month-title {
  display: block;
  font-size: 34rpx;
  font-weight: 900;
}

.name-pill {
  flex-shrink: 0;
  padding: 12rpx 18rpx;
  border-radius: 999rpx;
  background: #fff8e7;
  color: #8a5a00;
  border: 1rpx solid #efd184;
  font-size: 23rpx;
  font-weight: 900;
}

.legend-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx 12rpx;
  margin-bottom: 22rpx;
  align-items: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 12rpx 22rpx;
  border-radius: 999rpx;
  background: #f8fafc;
  border: 1rpx solid #eef2f6;
  color: #475467;
  font-size: 22rpx;
  font-weight: 800;
  min-height: 44rpx;
  white-space: nowrap;
  line-height: 1.2;
}

.legend-add {
  min-width: 60rpx;
  height: 48rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  background: #111827;
  color: #f7c85f;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  line-height: 1;
  font-weight: 900;
  gap: 6rpx;
}

.legend-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.dept-intro {
  margin: 8rpx 0 18rpx;
  padding: 18rpx 22rpx;
  background: linear-gradient(135deg, #f0f7ff 0%, #fef6f0 100%);
  border-radius: 18rpx;
  border: 1rpx solid #e6f0ff;
}

.doctor-tabs {
  width: 100%;
  white-space: nowrap;
  margin: 0 0 18rpx;
}

.doctor-tabs-inner {
  display: inline-flex;
  gap: 14rpx;
  padding: 4rpx 2rpx;
}

.doctor-tab {
  padding: 14rpx 26rpx;
  border-radius: 999rpx;
  background: #f8fafc;
  border: 1rpx solid #eef2f6;
  color: #475467;
  font-size: 25rpx;
  font-weight: 800;
  line-height: 1.1;
}

.doctor-tab.active {
  background: #111827;
  color: #f7c85f;
  border-color: #111827;
}

.dept-intro-text {
  display: block;
  color: #1d4ed8;
  font-size: 24rpx;
  font-weight: 800;
  line-height: 1.5;
}

.dept-intro-tip {
  display: block;
  margin-top: 8rpx;
  color: #98a2b3;
  font-size: 21rpx;
  font-weight: 700;
  line-height: 1.4;
}

.upload-subtitle {
  display: block;
  margin-top: 10rpx;
  color: #98a2b3;
  font-size: 22rpx;
  font-weight: 700;
}

.ai-gen-row {
  margin: 18rpx 0 22rpx;
}

.ai-gen-btn {
  height: 92rpx;
  font-size: 28rpx;
}

.calendar {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8rpx;
}

.week {
  height: 40rpx;
  text-align: center;
  color: #98a2b3;
  font-size: 20rpx;
  font-weight: 900;
}

.day {
  min-height: 82rpx;
  border-radius: 16rpx;
  background: #f9fafb;
  border: 1rpx solid #eef2f6;
  padding: 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
}

.day.muted {
  opacity: 0.3;
}

.day.today {
  background: #fff8e6;
  border: 2rpx solid #f59e0b;
  box-shadow: 0 4rpx 12rpx rgba(245, 158, 11, 0.18);
}

.day.today .day-num {
  color: #b45309;
}

.day.holiday {
  background: #fef2f2;
  border: 1rpx solid #fecaca;
}

.day.holiday .day-num {
  color: #dc2626;
}

.day.holiday.today {
  background: linear-gradient(135deg, #fef2f2 0%, #fff8e6 100%);
  border: 2rpx solid #f59e0b;
}

.day.violation {
  border: 3rpx solid #D9342B;
  box-shadow: 0 0 0 2rpx rgba(217, 52, 43, 0.18);
}

.day.violation.today {
  /* 违规优先级高于 today 黄框：保留红框，但 today 的米黄底仍可见 */
  border: 3rpx solid #D9342B;
}

.day-holiday {
  font-size: 16rpx;
  color: #dc2626;
  font-weight: 800;
  line-height: 1;
  margin-top: 2rpx;
  letter-spacing: -1rpx;
}

.day-num {
  font-size: 22rpx;
  color: #111827;
  font-weight: 900;
}

.shift-chip {
  min-width: 38rpx;
  height: 32rpx;
  border-radius: 9rpx;
  text-align: center;
  line-height: 32rpx;
  font-size: 18rpx;
  font-weight: 900;
}

.share-preview {
  padding: 26rpx;
  margin-bottom: 24rpx;
  border: 1rpx solid #eef2f6;
}

.poster {
  border-radius: 20rpx;
  background: linear-gradient(135deg, #111827, #221b0f);
  padding: 24rpx;
  color: #fff;
  border: 1rpx solid rgba(247, 200, 95, 0.24);
}

.poster-top {
  display: flex;
  justify-content: space-between;
  gap: 18rpx;
  align-items: center;
  margin-bottom: 22rpx;
}

.poster-title {
  display: block;
  font-size: 30rpx;
  font-weight: 900;
  color: #fff;
}

.poster-subtitle {
  display: block;
  margin-top: 8rpx;
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 800;
}

.qr-box {
  width: 90rpx;
  height: 90rpx;
  border-radius: 12rpx;
  background: #fff;
  color: #111827;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.qr-main {
  font-size: 34rpx;
  line-height: 34rpx;
  font-weight: 900;
}

.qr-tiny {
  margin-top: 4rpx;
  font-size: 16rpx;
  font-weight: 900;
}

.poster-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6rpx;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 14rpx;
  padding: 8rpx;
}

.poster-day {
  min-height: 58rpx;
  border-radius: 10rpx;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.poster-num {
  color: rgba(255, 255, 255, 0.76);
  font-size: 16rpx;
  font-weight: 800;
}

.poster-shift {
  margin-top: 2rpx;
  font-size: 21rpx;
  font-weight: 900;
}

.poster-watermark {
  margin-top: 18rpx;
  text-align: center;
  color: rgba(255, 255, 255, 0.72);
  font-size: 18rpx;
  font-weight: 800;
}

.action-panel {
  display: flex;
  gap: 18rpx;
  margin-bottom: 24rpx;
}

.primary-btn,
.secondary-btn,
.danger-btn {
  flex: 1;
  height: 82rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 27rpx;
  font-weight: 900;
}

.primary-btn {
  background: #111827;
  color: #f7c85f;
}

.secondary-btn {
  background: #fff;
  color: #111827;
  border: 1rpx solid #eef2f6;
}

.responses-btn { position: relative; }
.responses-badge {
  position: absolute;
  top: 6rpx;
  right: 10rpx;
  min-width: 32rpx;
  height: 32rpx;
  padding: 0 8rpx;
  border-radius: 999rpx;
  background: #D9342B;
  color: #fff;
  font-size: 18rpx;
  font-weight: 800;
  line-height: 32rpx;
  text-align: center;
}

.danger-btn {
  background: #fef3f2;
  color: #b42318;
  border: 1rpx solid #fee4e2;
}

.reminder-title {
  display: block;
  color: #111827;
  font-size: 28rpx;
  font-weight: 900;
}

.reminder-desc {
  display: block;
  margin-top: 6rpx;
  color: #667085;
  font-size: 22rpx;
  font-weight: 700;
}

.bottom-space {
  height: 250rpx;
}

.shift-editor-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.36);
  display: flex;
  align-items: flex-end;
}

.shift-editor {
  width: 100%;
  background: #fff;
  border-radius: 36rpx 36rpx 0 0;
  padding: 20rpx 34rpx 52rpx;
}

.sheet-handle {
  width: 76rpx;
  height: 8rpx;
  border-radius: 999rpx;
  background: #d0d5dd;
  margin: 0 auto 30rpx;
}

.sheet-title {
  display: block;
  color: #111827;
  font-size: 36rpx;
  font-weight: 900;
}

.field {
  flex: 1;
  margin-top: 24rpx;
}

.field-label {
  display: block;
  margin-bottom: 12rpx;
  color: #344054;
  font-size: 23rpx;
  font-weight: 900;
}

.field-input {
  width: 100%;
  height: 82rpx;
  border-radius: 18rpx;
  background: #f5f7fb;
  color: #111827;
  padding: 0 22rpx;
  font-size: 27rpx;
  font-weight: 800;
}

.color-row {
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;
}

.color-dot {
  width: 54rpx;
  height: 54rpx;
  border-radius: 50%;
  border: 6rpx solid #fff;
  box-shadow: 0 0 0 2rpx #e4e7ec;
}

.color-dot.active {
  box-shadow: 0 0 0 4rpx #111827;
}

.shift-preview {
  margin-top: 26rpx;
  min-height: 72rpx;
  border-radius: 18rpx;
  background: #f5f7fb;
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 0 22rpx;
  color: #111827;
  font-size: 25rpx;
  font-weight: 900;
}

.reminder-preview {
  margin-top: 24rpx;
  padding: 24rpx;
  border-radius: 22rpx;
  background: #f5f7fb;
}

.field-picker {
  height: 82rpx;
  border-radius: 18rpx;
  background: #f5f7fb;
  color: #1677ff;
  display: flex;
  align-items: center;
  padding: 0 22rpx;
  font-size: 28rpx;
  font-weight: 900;
}

.reminder-switch-row {
  margin-top: 24rpx;
  min-height: 82rpx;
  border-radius: 18rpx;
  background: #f5f7fb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 22rpx;
  color: #111827;
  font-size: 26rpx;
  font-weight: 900;
}

.preview-label {
  margin: 0 8rpx 0 0;
}

.sheet-actions {
  display: flex;
  gap: 18rpx;
  margin-top: 28rpx;
}

.sheet-btn {
  margin: 0;
}
</style>
