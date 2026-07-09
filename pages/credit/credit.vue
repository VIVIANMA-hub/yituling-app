<template>
    <view class="page">
        <view class="status-bar"></view>

        <view class="nav">
            <view class="back-btn" @click="goBack">‹</view>
            <view>
                <text class="nav-title">学分管家</text>
                <text class="nav-subtitle">自填记录 · 地区订阅 · 官方入口</text>
            </view>
            <view class="nav-placeholder"></view>
        </view>

        <scroll-view scroll-y class="content" :show-scrollbar="false">
            <view class="summary-card">
                <view class="summary-head">
                    <text class="summary-title">{{ year }} 年继续医学教育学分</text>
                    <text class="summary-badge">本地记录</text>
                </view>

                <view class="score-row">
                    <text class="score-main">{{ totalCredits }}</text>
                    <text class="score-total">/ {{ targetCredits }} 分</text>
                </view>

                <view class="progress-bg">
                    <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
                </view>

                <view class="countdown-box">
                    <text class="countdown-num">{{ daysLeft }}</text>
                    <text class="countdown-text">天后到达清零/统计截止日：{{ deadline }}</text>
                </view>

                <view class="reminder-row" @click="toggleReminder">
                    <view class="reminder-toggle" :class="{ on: reminderEnabled }">
                        <text v-if="reminderEnabled">✓</text>
                    </view>
                    <view class="reminder-body">
                        <text class="reminder-title">{{ reminderEnabled ? '到期前 30 / 7 / 1 天提醒' : '开启到期提醒' }}</text>
                        <text class="reminder-desc">{{ reminderHint }}</text>
                    </view>
                </view>

                <view class="deadline-row" @click="editDeadline">
                    <text class="deadline-label">修改截止日：</text>
                    <text class="deadline-value">{{ deadline }} ›</text>
                </view>
            </view>

            <view class="notice-card">
                <text class="notice-title">边界说明</text>
                <text class="notice-desc">一图灵只做个人进度记录、地区资讯订阅和官方入口收藏。不读取身份证或手机号自动统计学分，最终结果请以当地官方继续医学教育系统为准。</text>
            </view>

            <view class="links-card">
                <text class="section-title">地区免费学分资讯</text>
                <view class="link-item" v-for="item in regionFeeds" :key="item.name" @click="copyLink(item)">
                    <view>
                        <text class="link-title">{{ item.name }}</text>
                        <text class="link-url">{{ item.url }}</text>
                    </view>
                    <text class="copy-text">订阅</text>
                </view>
            </view>

            <view class="form-card">
                <text class="section-title">新增学分记录</text>

                <view class="field">
                    <text class="label">项目名称</text>
                    <input class="input" v-model="draft.title" placeholder="例如：基层影像质控培训" />
                </view>

                <view class="field-row">
                    <view class="field half">
                        <text class="label">学分类别</text>
                        <picker :range="creditTypes" @change="onTypeChange">
                            <view class="picker-box">{{ draft.type }}</view>
                        </picker>
                    </view>
                    <view class="field half">
                        <text class="label">获得分数</text>
                        <input class="input" type="digit" v-model="draft.points" placeholder="0" />
                    </view>
                </view>

                <view class="field">
                    <text class="label">获得日期</text>
                    <picker mode="date" :value="draft.date" @change="onDateChange">
                        <view class="picker-box">{{ draft.date }}</view>
                    </picker>
                </view>

                <view class="field">
                    <text class="label">备注</text>
                    <input class="input" v-model="draft.note" placeholder="证书编号、主办单位或查询线索" />
                </view>

                <view class="primary-btn" @click="addRecord">保存记录</view>
            </view>

            <view class="list-card">
                <view class="section-row">
                    <text class="section-title">我的记录</text>
                    <text class="section-sub">{{ records.length }} 条</text>
                </view>

                <view v-if="records.length === 0" class="empty">
                    <text class="empty-title">还没有记录</text>
                    <text class="empty-desc">先把今年已获得的学分手动录入，后续只做倒计时和补足提醒。</text>
                </view>

                <view class="record-item" v-for="item in records" :key="item.id">
                    <view>
                        <text class="record-title">{{ item.title }}</text>
                        <text class="record-meta">{{ item.type }} · {{ item.date }}</text>
                        <text class="record-note" v-if="item.note">{{ item.note }}</text>
                    </view>
                    <text class="record-score">+{{ item.points }}</text>
                </view>
            </view>

            <view class="links-card">
                <text class="section-title">官方查询入口收藏</text>
                <view class="link-item" v-for="item in officialLinks" :key="item.name" @click="copyLink(item)">
                    <view>
                        <text class="link-title">{{ item.name }}</text>
                        <text class="link-url">{{ item.url }}</text>
                    </view>
                    <text class="copy-text">复制</text>
                </view>
            </view>

            <view class="bottom-space"></view>
        </scroll-view>
    </view>
</template>

<script>
export default {
    data() {
        return {
            year: 2026,
            targetCredits: 25,
            deadline: '2026-12-31',
            reminderEnabled: false,
            creditTypes: ['I 类学分', 'II 类学分', '院内培训', '其他记录'],
            draft: {
                title: '',
                type: 'I 类学分',
                points: '',
                date: '',
                note: ''
            },
            records: [],
            officialLinks: [
                { name: '继续医学教育官方项目查询', url: 'https://cmegsb.cma.org.cn' },
                { name: '广西继续医学教育官方入口', url: '请以当地卫健委/继续医学教育平台最新地址为准' },
                { name: '本院科教科/医务科查询', url: '建议收藏医院内部通知或官方系统入口' }
            ],
            regionFeeds: [
                { name: '广西免费学分资讯', url: '订阅广西继续教育免费项目提醒' },
                { name: '广东免费学分资讯', url: '订阅广东继续教育免费项目提醒' },
                { name: '湖南免费学分资讯', url: '订阅湖南继续教育免费项目提醒' }
            ]
        }
    },
    computed: {
        totalCredits() {
            const total = this.records.reduce((sum, item) => sum + Number(item.points || 0), 0)
            return Math.round(total * 10) / 10
        },
        progressPercent() {
            return Math.min(100, Math.round((this.totalCredits / this.targetCredits) * 100))
        },
        daysLeft() {
            const end = new Date(`${this.deadline}T23:59:59`)
            const now = new Date()
            const diff = Math.ceil((end.getTime() - now.getTime()) / 86400000)
            return Math.max(0, diff)
        },
        reminderHint() {
            const left = this.daysLeft
            const remain = Math.max(0, this.targetCredits - this.totalCredits)
            if (!this.reminderEnabled) return '关闭中。开启后将在截止前 30/7/1 天本地提醒你补足学分。'
            if (left <= 0) return `已到期。剩余 ${remain} 分未达标，请尽快补足或更新截止日。`
            if (left <= 7) return `紧急：仅剩 ${left} 天，还差 ${remain} 分`
            if (left <= 30) return `临近：还有 ${left} 天，还差 ${remain} 分`
            return `开启中。${left} 天后到期，目标剩余 ${remain} 分。`
        }
    },
    onLoad() {
        const today = new Date()
        this.draft.date = this.formatDate(today)
        this.loadRecords()
        this.loadPrefs()
        this.maybeNotify()
    },
    onShow() {
        this.loadRecords()
        this.loadPrefs()
        this.maybeNotify()
    },
    methods: {
        goBack() {
            uni.navigateBack()
        },
        loadPrefs() {
            const prefs = uni.getStorageSync('ytl_credit_prefs') || {}
            this.reminderEnabled = !!prefs.reminderEnabled
            if (prefs.deadline) this.deadline = prefs.deadline
            if (Number.isInteger(prefs.targetCredits) && prefs.targetCredits > 0) {
                this.targetCredits = prefs.targetCredits
            }
        },
        savePrefs() {
            uni.setStorageSync('ytl_credit_prefs', {
                reminderEnabled: this.reminderEnabled,
                deadline: this.deadline,
                targetCredits: this.targetCredits
            })
        },
        toggleReminder() {
            this.reminderEnabled = !this.reminderEnabled
            this.savePrefs()
            if (this.reminderEnabled) {
                // 提示用户授予系统通知权限（实际通知靠 maybeNotify 每次进入时检查）
                uni.showModal({
                    title: '到期提醒已开启',
                    content: '进入本页面时如果距离截止日 ≤ 30/7/1 天，会本地弹窗提示。建议在系统设置里也允许一图灵的通知，便于后台到点提示。',
                    showCancel: false
                })
                this.maybeNotify(true)
            }
        },
        async editDeadline() {
            const cur = this.deadline
            const res = await new Promise(r => uni.showModal({
                title: '修改截止日',
                editable: true,
                placeholderText: 'YYYY-MM-DD',
                content: cur,
                success: rr => r(rr.confirm ? (rr.content || '').trim() : null)
            }))
            if (!res) return
            if (!/^\d{4}-\d{2}-\d{2}$/.test(res)) {
                uni.showToast({ title: '日期格式应为 YYYY-MM-DD', icon: 'none' })
                return
            }
            this.deadline = res
            this.savePrefs()
            this.maybeNotify(true)
        },
        maybeNotify(force) {
            if (!this.reminderEnabled) return
            const left = this.daysLeft
            const remain = Math.max(0, this.targetCredits - this.totalCredits)
            // 触发条件：30/7/1/0 天且当天没提示过
            const todayKey = new Date().toISOString().slice(0, 10)
            const lastKey = uni.getStorageSync('ytl_credit_last_notify') || ''
            if (!force && lastKey === todayKey) return
            const thresholds = [0, 1, 7, 30]
            if (!thresholds.includes(left)) return
            uni.setStorageSync('ytl_credit_last_notify', todayKey)
            uni.showModal({
                title: left <= 1 ? '学分到期紧急提醒' : '学分到期提醒',
                content: `距离 ${this.deadline} 仅剩 ${left} 天，距离目标 ${this.targetCredits} 分还差 ${remain} 分。请尽快查官方平台补录或参加学习项目。`,
                confirmText: '我知道了',
                showCancel: false
            })
        },
        loadRecords() {
            this.records = uni.getStorageSync('ytl_credit_records') || []
        },
        onTypeChange(e) {
            this.draft.type = this.creditTypes[e.detail.value]
        },
        onDateChange(e) {
            this.draft.date = e.detail.value
        },
        addRecord() {
            const title = this.draft.title.trim()
            const points = Number(this.draft.points)
            if (!title || !points || points <= 0) {
                uni.showToast({ title: '请填写项目名称和有效分数', icon: 'none' })
                return
            }

            const item = {
                id: Date.now(),
                title,
                type: this.draft.type,
                points: Math.round(points * 10) / 10,
                date: this.draft.date,
                note: this.draft.note.trim()
            }
            const list = [item, ...this.records]
            uni.setStorageSync('ytl_credit_records', list)
            this.records = list
            this.draft = {
                title: '',
                type: 'I 类学分',
                points: '',
                date: this.formatDate(new Date()),
                note: ''
            }
            uni.showToast({ title: '已保存', icon: 'success' })
        },
        copyLink(item) {
            uni.setClipboardData({
                data: item.url,
                success: () => uni.showToast({ title: '已复制入口信息', icon: 'success' })
            })
        },
        formatDate(date) {
            const y = date.getFullYear()
            const m = String(date.getMonth() + 1).padStart(2, '0')
            const d = String(date.getDate()).padStart(2, '0')
            return `${y}-${m}-${d}`
        }
    }
}
</script>

<style>
view,
text,
scroll-view,
input,
picker {
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif;
}

.page {
    min-height: 100vh;
    background: #f5f7fb;
    color: #111827;
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
}

.back-btn,
.nav-placeholder {
    width: 66rpx;
    height: 66rpx;
}

.back-btn {
    border-radius: 50%;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 56rpx;
    padding-bottom: 8rpx;
    font-weight: 900;
}

.nav-title {
    display: block;
    text-align: center;
    font-size: 32rpx;
    font-weight: 900;
}

.nav-subtitle {
    display: block;
    margin-top: 4rpx;
    text-align: center;
    color: #667085;
    font-size: 21rpx;
    font-weight: 700;
}

.content {
    height: calc(100vh - 184rpx);
    padding: 0 32rpx;
}

.summary-card,
.notice-card,
.form-card,
.list-card,
.links-card {
    background: #fff;
    border-radius: 26rpx;
    padding: 28rpx;
    margin-bottom: 22rpx;
    box-shadow: 0 14rpx 36rpx rgba(17, 24, 39, 0.05);
}

.summary-head,
.section-row,
.record-item,
.link-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18rpx;
}

.summary-title,
.section-title {
    display: block;
    font-size: 30rpx;
    color: #111827;
    font-weight: 900;
}

.summary-badge {
    padding: 7rpx 14rpx;
    border-radius: 999rpx;
    background: #eef6ff;
    color: #1677ff;
    font-size: 20rpx;
    font-weight: 900;
}

.score-row {
    margin-top: 22rpx;
    display: flex;
    align-items: baseline;
}

.score-main {
    font-size: 92rpx;
    line-height: 1;
    color: #1677ff;
    font-weight: 900;
}

.score-total {
    margin-left: 10rpx;
    color: #98a2b3;
    font-size: 30rpx;
    font-weight: 900;
}

.progress-bg {
    height: 18rpx;
    border-radius: 999rpx;
    background: #eef2f7;
    overflow: hidden;
    margin-top: 22rpx;
}

.progress-fill {
    height: 100%;
    border-radius: 999rpx;
    background: linear-gradient(90deg, #1677ff, #12b76a);
}

.countdown-box {
    margin-top: 24rpx;
    padding: 20rpx;
    border-radius: 18rpx;
    background: #fff7ed;
    display: flex;
    align-items: center;
    gap: 14rpx;
}

.countdown-num {
    color: #c2410c;
    font-size: 42rpx;
    font-weight: 900;
}

.countdown-text {
    flex: 1;
    color: #9a3412;
    font-size: 23rpx;
    line-height: 1.45;
    font-weight: 750;
}

.reminder-row {
    margin-top: 18rpx;
    padding: 18rpx 20rpx;
    border-radius: 18rpx;
    background: #F5F5F7;
    display: flex;
    align-items: center;
    gap: 14rpx;
}
.reminder-toggle {
    width: 40rpx; height: 40rpx; border-radius: 50%;
    border: 3rpx solid #C7C7CC;
    text-align: center; line-height: 34rpx;
    color: #fff; font-size: 22rpx; font-weight: 800;
}
.reminder-toggle.on { background: #1F6FEB; border-color: #1F6FEB; }
.reminder-body { flex: 1; display: flex; flex-direction: column; gap: 4rpx; }
.reminder-title { font-size: 26rpx; color: #1D1D1F; font-weight: 700; }
.reminder-desc { font-size: 22rpx; color: #6E6E73; line-height: 1.5; }

.deadline-row {
    margin-top: 12rpx;
    padding: 12rpx 4rpx;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 8rpx;
}
.deadline-label { font-size: 22rpx; color: #86868B; }
.deadline-value { font-size: 22rpx; color: #1F6FEB; font-weight: 700; }

.notice-card {
    background: #fffbeb;
    border: 1rpx solid #fedf89;
}

.notice-title {
    display: block;
    color: #b54708;
    font-size: 25rpx;
    font-weight: 900;
}

.notice-desc {
    display: block;
    margin-top: 8rpx;
    color: #92400e;
    font-size: 22rpx;
    line-height: 1.55;
    font-weight: 650;
}

.field {
    margin-top: 22rpx;
}

.field-row {
    display: flex;
    gap: 18rpx;
}

.half {
    flex: 1;
}

.label {
    display: block;
    margin-bottom: 10rpx;
    color: #475467;
    font-size: 22rpx;
    font-weight: 900;
}

.input,
.picker-box {
    width: 100%;
    min-height: 78rpx;
    border-radius: 18rpx;
    background: #f5f7fb;
    color: #111827;
    font-size: 25rpx;
    font-weight: 750;
    padding: 20rpx;
}

.primary-btn {
    margin-top: 28rpx;
    height: 86rpx;
    border-radius: 999rpx;
    background: #1677ff;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 27rpx;
    font-weight: 900;
}

.section-sub {
    color: #98a2b3;
    font-size: 22rpx;
    font-weight: 800;
}

.empty {
    padding: 34rpx 0 10rpx;
    text-align: center;
}

.empty-title {
    display: block;
    color: #111827;
    font-size: 27rpx;
    font-weight: 900;
}

.empty-desc {
    display: block;
    margin-top: 10rpx;
    color: #667085;
    font-size: 22rpx;
    line-height: 1.5;
    font-weight: 650;
}

.record-item {
    padding: 24rpx 0;
    border-bottom: 1rpx solid #eef2f7;
}

.record-item:last-child {
    border-bottom: none;
}

.record-title,
.link-title {
    display: block;
    color: #111827;
    font-size: 25rpx;
    line-height: 1.4;
    font-weight: 900;
}

.record-meta,
.record-note,
.link-url {
    display: block;
    margin-top: 6rpx;
    color: #667085;
    font-size: 21rpx;
    line-height: 1.4;
    font-weight: 650;
}

.record-score {
    color: #12b76a;
    font-size: 30rpx;
    font-weight: 900;
}

.link-item {
    padding: 22rpx 0;
    border-bottom: 1rpx solid #eef2f7;
}

.link-item:last-child {
    border-bottom: none;
}

.copy-text {
    flex-shrink: 0;
    color: #1677ff;
    font-size: 23rpx;
    font-weight: 900;
}

.bottom-space {
    height: 120rpx;
}
</style>
