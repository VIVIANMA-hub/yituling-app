<template>
	<view class="cal-root">
		<view class="status-bar"></view>

		<!-- 顶部标题区：年月 + 今天 + 前后月按钮 -->
		<view class="cal-header animate-fade">
			<view class="header-left">
				<text class="year-label">{{ currentYear }} 年</text>
				<text class="month-label">{{ monthNames[currentMonth - 1] }}</text>
			</view>
			<view class="header-actions">
				<view class="nav-btn" @click="changeMonth(-1)">‹</view>
				<view class="today-btn" @click="goToday">今天</view>
				<view class="nav-btn" @click="changeMonth(1)">›</view>
			</view>
		</view>

		<!-- 星期栏 -->
		<view class="week-header">
			<text v-for="(w, wi) in weekDays" :key="wi" :class="['week-col', wi===0||wi===6 ? 'weekend' : '']">{{ w }}</text>
		</view>

		<!-- 日历格子 -->
		<scroll-view scroll-y class="cal-scroll" :show-scrollbar="false">
			<view class="days-grid">
				<view
					v-for="(cell, ci) in calendarCells"
					:key="ci"
					:class="['day-cell', cell.empty ? 'empty-cell' : '', cell.isToday ? 'today-cell' : '', cell.isSelected ? 'selected-cell' : '', cell.isWeekend ? 'weekend-day' : '', cell.isOtherMonth ? 'other-month' : '']"
					@click="!cell.empty && selectDay(cell)">

					<!-- 日期数字 -->
					<view v-if="!cell.empty" class="date-row">
						<view :class="['date-num-wrap', cell.isToday ? 'today-circle' : '']">
							<text class="date-num">{{ cell.day }}</text>
						</view>
						<text :class="['lunar-text', 'lunar-' + cell.lunarType]">{{ cell.lunar }}</text>
					</view>

					<!-- 事件彩色条 -->
					<view v-if="!cell.empty && cell.events && cell.events.length" class="event-bars">
						<view
							v-for="(ev, ei) in cell.events.slice(0, 3)"
							:key="ei"
							class="event-bar"
							:style="{ background: ev.color }">
							<text class="event-bar-text">{{ ev.title }}</text>
						</view>
						<text v-if="cell.events.length > 3" class="more-events">+{{ cell.events.length - 3 }}</text>
					</view>

					<!-- 班次小标 -->
					<view v-if="!cell.empty && cell.shift" :class="['shift-pip', 'shift-' + cell.shift]">
						{{ shiftLabel[cell.shift] }}
					</view>
				</view>
			</view>

			<!-- 选中日详情 -->
			<view class="day-detail animate-slide-up" v-if="selectedCell && !selectedCell.empty">
				<view class="detail-date-line">
					<text class="detail-month-day">{{ currentMonth }}月{{ selectedCell.day }}日</text>
					<text class="detail-week">周{{ selectedCell.weekCn }}</text>
					<text class="detail-lunar-full">{{ selectedCell.lunarFull }}</text>
				</view>

				<view v-if="selectedCell.events && selectedCell.events.length" class="detail-events">
					<view class="detail-ev" v-for="(ev, ei) in selectedCell.events" :key="ei">
						<view class="ev-color-dot" :style="{ background: ev.color }"></view>
						<view class="ev-body">
							<text class="ev-title">{{ ev.title }}</text>
							<text class="ev-desc" v-if="ev.desc">{{ ev.desc }}</text>
						</view>
						<view class="ev-time-badge" v-if="ev.time">{{ ev.time }}</view>
					</view>
				</view>

				<view v-else class="no-event">
					<text class="no-ev-txt">今日无安排</text>
				</view>
			</view>

			<view style="height: 200rpx;"></view>
		</scroll-view>
	</view>
</template>

<script>
// 农历简表（节气 + 农历月日简写）
const LUNAR_TERMS = {
	'2026-1-5': '小寒', '2026-1-20': '大寒',
	'2026-2-3': '立春', '2026-2-18': '雨水',
	'2026-3-5': '惊蛰', '2026-3-20': '春分',
	'2026-4-4': '清明', '2026-4-20': '谷雨',
	'2026-5-5': '立夏', '2026-5-21': '小满',
	'2026-6-5': '芒种', '2026-6-21': '夏至',
	'2026-7-7': '小暑', '2026-7-22': '大暑',
	'2026-8-7': '立秋', '2026-8-23': '处暑',
	'2026-9-7': '白露', '2026-9-23': '秋分',
	'2026-10-8': '寒露', '2026-10-23': '霜降',
	'2026-11-7': '立冬', '2026-11-22': '小雪',
	'2026-12-7': '大雪', '2026-12-21': '冬至'
};

const HOLIDAYS = {
	'2026-1-1': '元旦',
	'2026-1-2': '元旦假',
	'2026-1-3': '元旦假',
	'2026-2-17': '除夕',
	'2026-2-18': '春节',
	'2026-2-19': '初二',
	'2026-2-20': '初三',
	'2026-2-21': '初四',
	'2026-2-22': '初五',
	'2026-2-23': '初六',
	'2026-2-24': '初七',
	'2026-4-4': '清明',
	'2026-4-5': '清明假',
	'2026-4-6': '清明假',
	'2026-5-1': '劳动节',
	'2026-5-2': '劳动节假',
	'2026-5-3': '劳动节假',
	'2026-5-4': '劳动节假',
	'2026-5-5': '劳动节假',
	'2026-6-19': '端午',
	'2026-6-20': '端午假',
	'2026-6-21': '端午假',
	'2026-9-16': '中秋',
	'2026-9-17': '中秋假',
	'2026-9-18': '中秋假',
	'2026-10-1': '国庆',
	'2026-10-2': '国庆假',
	'2026-10-3': '国庆假',
	'2026-10-4': '国庆假',
	'2026-10-5': '国庆假',
	'2026-10-6': '国庆假',
	'2026-10-7': '国庆假',
};

// 农历序数字
const CN_NUMS = ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十',
	'十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
	'廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];
const CN_MONTHS = ['正','二','三','四','五','六','七','八','九','十','冬','腊'];

// 简化农历计算（2026年对照表，实际可接入完整农历库）
function getLunarDisplay(y, m, d) {
	const key = `${y}-${m}-${d}`;
	if (HOLIDAYS[key]) return { text: HOLIDAYS[key], type: 'holiday' };
	if (LUNAR_TERMS[key]) return { text: LUNAR_TERMS[key], type: 'term' };
	// 近似农历天数（演示用，生产中替换完整算法）
	const baseDate = new Date(2026, 0, 29); // 2026-01-29 = 农历正月初一（春节近似）
	const cur = new Date(y, m - 1, d);
	const diff = Math.round((cur - baseDate) / 86400000);
	if (diff < 0 || diff > 365) return { text: '', type: '' };
	const lunarDay = diff % 30;
	const lunarMon = Math.floor(diff / 30) % 12;
	if (lunarDay === 0) return { text: CN_MONTHS[lunarMon] + '月', type: 'lunar-month' };
	return { text: CN_NUMS[lunarDay], type: 'lunar' };
}

export default {
	data() {
		const now = new Date();
		return {
			currentYear: now.getFullYear(),
			currentMonth: now.getMonth() + 1,
			todayYear: now.getFullYear(),
			todayMonth: now.getMonth() + 1,
			todayDay: now.getDate(),
			selectedCell: null,
			weekDays: ['日', '一', '二', '三', '四', '五', '六'],
			weekCnMap: ['日', '一', '二', '三', '四', '五', '六'],
			monthNames: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
			shiftLabel: { white: '早', night: '夜', off: '下', rest: '休' },
			// 全年事件数据
			events: [
				{ date: '2026-3-30', title: '代码重构', color: '#5856D6', desc: 'App架构升级', time: '全天' },
				{ date: '2026-4-1', title: '学术分享', color: '#FF9F0A', desc: '放射科内部分享', time: '15:00' },
				{ date: '2026-4-15', title: '年中汇报', color: '#007AFF', desc: '项目进度汇报', time: '10:00' },
				{ date: '2026-5-4', title: '影像研讨会', color: '#FF9F0A', desc: '省级医学影像研讨', time: '全天' },
				{ date: '2026-6-1', title: 'App测试', color: '#007AFF', desc: '一图灵公测启动', time: '全天' },
				{ date: '2026-6-15', title: 'App上线准备', color: '#34C759', desc: '正式上线前最终验收', time: '全天' },
				{ date: '2026-6-19', title: '重庆出行', color: '#FF2D55', desc: '去重庆·端午', time: '出发' },
				{ date: '2026-6-30', title: '一图灵上线', color: '#34C759', desc: '🚀 App正式上线', time: '全天' },
				{ date: '2026-7-15', title: '半年总结', color: '#007AFF', desc: '项目中期复盘', time: '全天' },
				{ date: '2026-8-1', title: '医保局AI比赛', color: '#FF3B30', desc: '初赛报名截止', time: '全天' },
				{ date: '2026-8-20', title: 'AI比赛初赛', color: '#FF3B30', desc: '医保局AI大赛初赛', time: '全天' },
				{ date: '2026-9-15', title: '年度放射大会', color: '#34C759', desc: '省级学术年会', time: '全天' },
				{ date: '2026-10-1', title: '国庆节', color: '#FF9F0A', desc: '国庆假期', time: '假期' },
				{ date: '2026-10-20', title: 'AI比赛决赛', color: '#FF3B30', desc: '🏆 医保局AI大赛决赛', time: '全天' },
				{ date: '2026-12-31', title: '年终收官', color: '#5856D6', desc: '2026年度总结', time: '全天' }
			],
			// 排班数据（按日期）
			shifts: {
				'2026-4-1': 'white', '2026-4-3': 'night', '2026-4-6': 'white',
				'2026-4-8': 'rest', '2026-4-10': 'night'
			}
		}
	},
	computed: {
		calendarCells() {
			const y = this.currentYear;
			const m = this.currentMonth;
			const firstDay = new Date(y, m - 1, 1).getDay(); // 0=周日
			const daysInMonth = new Date(y, m, 0).getDate();
			const cells = [];

			// 前置空格
			for (let i = 0; i < firstDay; i++) {
				cells.push({ empty: true });
			}

			for (let d = 1; d <= daysInMonth; d++) {
				const dateKey = `${y}-${m}-${d}`;
				const weekIdx = new Date(y, m - 1, d).getDay();
				const dayEvents = this.events.filter(ev => ev.date === dateKey);
				const shift = this.shifts[dateKey] || null;
				const lunarInfo = getLunarDisplay(y, m, d);

				cells.push({
					day: d,
					dateKey,
					isToday: y === this.todayYear && m === this.todayMonth && d === this.todayDay,
					isWeekend: weekIdx === 0 || weekIdx === 6,
					weekCn: this.weekCnMap[weekIdx],
					lunar: lunarInfo.text,
					lunarType: lunarInfo.type,
					lunarFull: lunarInfo.text,
					events: dayEvents,
					shift,
					isSelected: this.selectedCell && this.selectedCell.dateKey === dateKey
				});
			}
			return cells;
		}
	},
	onShow() {
		uni.hideTabBar();
		// 默认选中今天
		const todayKey = `${this.todayYear}-${this.todayMonth}-${this.todayDay}`;
		const todayCell = this.calendarCells.find(c => c.dateKey === todayKey);
		if (todayCell) this.selectedCell = todayCell;
	},
	methods: {
		changeMonth(delta) {
			let m = this.currentMonth + delta;
			let y = this.currentYear;
			if (m < 1) { m = 12; y--; }
			if (m > 12) { m = 1; y++; }
			this.currentMonth = m;
			this.currentYear = y;
			this.selectedCell = null;
			uni.vibrateShort();
		},
		goToday() {
			this.currentYear = this.todayYear;
			this.currentMonth = this.todayMonth;
			this.selectedCell = null;
			this.$nextTick(() => {
				const todayKey = `${this.todayYear}-${this.todayMonth}-${this.todayDay}`;
				const todayCell = this.calendarCells.find(c => c.dateKey === todayKey);
				if (todayCell) this.selectedCell = todayCell;
			});
		},
		selectDay(cell) {
			this.selectedCell = cell;
			uni.vibrateShort();
		}
	}
}
</script>

<style>
.cal-root {
	min-height: 100vh;
	background: #fff;
	font-family: -apple-system, "SF Pro Display", sans-serif;
}
.status-bar { height: 100rpx; }

/* 顶部标题 */
.cal-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-end;
	padding: 0 32rpx 24rpx;
}
.header-left { display: flex; align-items: baseline; gap: 12rpx; }
.year-label { font-size: 32rpx; font-weight: 700; color: #1D1D1F; }
.month-label { font-size: 52rpx; font-weight: 800; color: #1D1D1F; letter-spacing: -1rpx; }
.header-actions { display: flex; align-items: center; gap: 12rpx; }
.nav-btn {
	width: 64rpx; height: 64rpx;
	background: #F2F2F7;
	border-radius: 50%;
	display: flex; align-items: center; justify-content: center;
	font-size: 36rpx; color: #007AFF; font-weight: 700;
}
.today-btn {
	padding: 14rpx 28rpx;
	background: #007AFF;
	border-radius: 30rpx;
	font-size: 26rpx; font-weight: 700; color: #fff;
}

/* 星期栏 */
.week-header {
	display: flex;
	padding: 0 8rpx;
	border-bottom: 1rpx solid #F2F2F7;
	padding-bottom: 12rpx;
}
.week-col {
	flex: 1;
	text-align: center;
	font-size: 22rpx;
	font-weight: 700;
	color: #86868B;
}
.week-col.weekend { color: #FF3B30; opacity: 0.7; }

/* 滚动区 */
.cal-scroll { height: calc(100vh - 320rpx); }

/* 日历格 */
.days-grid {
	display: flex;
	flex-wrap: wrap;
	padding: 0 4rpx;
}
.day-cell {
	width: 14.285%;
	min-height: 140rpx;
	padding: 8rpx 4rpx 6rpx;
	border-bottom: 1rpx solid #F8F8FA;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	align-items: stretch;
}
.empty-cell { background: transparent; }
.other-month { opacity: 0.35; }

/* 日期 + 农历 */
.date-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 4rpx;
	margin-bottom: 6rpx;
}
.date-num-wrap {
	width: 52rpx; height: 52rpx;
	display: flex; align-items: center; justify-content: center;
}
.today-circle {
	background: #FF3B30;
	border-radius: 50%;
}
.today-circle .date-num { color: #fff !important; font-weight: 900; }
.date-num {
	font-size: 26rpx;
	font-weight: 600;
	color: #1D1D1F;
}
.weekend-day .date-num { color: #FF3B30; opacity: 0.8; }
.lunar-text {
	font-size: 16rpx;
	color: #86868B;
	text-align: right;
	flex: 1;
	padding-right: 2rpx;
	white-space: nowrap;
	overflow: hidden;
}
/* 节假日：红色 */
.lunar-holiday { color: #FF3B30 !important; font-weight: 700; }
/* 节气：绿色 */
.lunar-term { color: #34C759 !important; font-weight: 600; }
/* 农历月份首日：蓝色 */
.lunar-lunar-month { color: #007AFF !important; font-weight: 600; }
.selected-cell { background: rgba(0,122,255,0.04); }

/* 事件条 */
.event-bars {
	display: flex;
	flex-direction: column;
	gap: 3rpx;
	padding: 0 2rpx;
}
.event-bar {
	border-radius: 6rpx;
	padding: 3rpx 6rpx;
	overflow: hidden;
}
.event-bar-text {
	font-size: 16rpx;
	color: #fff;
	font-weight: 700;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.more-events {
	font-size: 16rpx;
	color: #86868B;
	padding-left: 4rpx;
}

/* 班次小标 */
.shift-pip {
	align-self: flex-start;
	font-size: 16rpx;
	font-weight: 900;
	padding: 3rpx 8rpx;
	border-radius: 6rpx;
	margin-top: 4rpx;
}
.shift-white { background: rgba(255,159,10,0.12); color: #FF9F0A; }
.shift-night { background: rgba(88,86,214,0.12); color: #5856D6; }
.shift-off { background: rgba(52,199,89,0.12); color: #34C759; }
.shift-rest { background: #F2F2F7; color: #86868B; }

/* 选中日详情 */
.day-detail {
	margin: 20rpx 20rpx 0;
	background: #fff;
	border-radius: 28rpx;
	padding: 36rpx 32rpx;
	box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.06);
}
.detail-date-line {
	display: flex;
	align-items: baseline;
	gap: 16rpx;
	margin-bottom: 28rpx;
}
.detail-month-day { font-size: 42rpx; font-weight: 900; color: #1D1D1F; }
.detail-week { font-size: 24rpx; color: #86868B; font-weight: 600; }
.detail-lunar-full { font-size: 22rpx; color: #FF9F0A; font-weight: 700; margin-left: auto; }

.detail-events { display: flex; flex-direction: column; gap: 20rpx; }
.detail-ev {
	display: flex;
	align-items: flex-start;
	gap: 20rpx;
	padding: 20rpx;
	background: #F9F9FB;
	border-radius: 20rpx;
}
.ev-color-dot {
	width: 14rpx; height: 14rpx;
	border-radius: 50%;
	flex-shrink: 0;
	margin-top: 8rpx;
}
.ev-body { flex: 1; }
.ev-title { font-size: 28rpx; font-weight: 800; color: #1D1D1F; display: block; }
.ev-desc { font-size: 22rpx; color: #86868B; display: block; margin-top: 6rpx; }
.ev-time-badge {
	font-size: 20rpx; color: #007AFF;
	background: rgba(0,122,255,0.08);
	padding: 6rpx 16rpx;
	border-radius: 12rpx;
	font-weight: 700;
	flex-shrink: 0;
}

.no-event { text-align: center; padding: 32rpx 0; }
.no-ev-txt { font-size: 26rpx; color: #C7C7CC; font-weight: 600; }

/* 动画 */
.animate-fade { animation: fadeIn 0.6s ease-out; }
.animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.25, 0.1, 0.25, 1); }
@keyframes fadeIn { from { opacity: 0; transform: translateY(12rpx); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideUp { from { transform: translateY(30rpx); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
</style>
