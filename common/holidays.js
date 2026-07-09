// 中国法定节假日数据。
// 数据来源：国务院办公厅每年下发的《关于 YYYY 年部分节假日安排的通知》
//
// ⚠️ 2026 年数据准确性说明（2026-05-19 维护）：
//   - 元旦（1月1-3日）：已核实（来自驻丹麦使馆 2026 节假日安排公告）
//   - 春节/清明/劳动/端午/中秋/国庆：**按往年放假规则推算**，未拿到 2026 年国务院通知原文核对。
//   - 建议每年 12 月看到国务院新通知后让 Claude 核对一次本文件。
//   - 如遇用户反馈某天节假日标记不对，**以国务院最新通知为准**，直接改这个文件并更新单测。
//
// 维护原则：
//   1. 只标"放假日"，不标"调休补班日"（补班日科室通常自己安排白班，App 不硬标）
//   2. 每年初看到国务院通知后更新这里
//   3. 单元测试要保留每年的 holidays 数据快照
//   4. 不要 hardcode 当前年份——通过 HOLIDAYS[year] 查找，缺失年份返回空

// 数据格式：{ '2026-01-01': { name: '元旦', isHoliday: true }, ... }
const HOLIDAYS_2026 = {}

function addHolidayRange(name, dates) {
  for (const d of dates) HOLIDAYS_2026[d] = { name, isHoliday: true }
}

addHolidayRange('元旦', ['2026-01-01', '2026-01-02', '2026-01-03'])
addHolidayRange('春节', [
  '2026-02-15', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19',
  '2026-02-20', '2026-02-21', '2026-02-22', '2026-02-23'
])
addHolidayRange('清明', ['2026-04-04', '2026-04-05', '2026-04-06'])
addHolidayRange('劳动节', ['2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04', '2026-05-05'])
addHolidayRange('端午', ['2026-06-19', '2026-06-20', '2026-06-21'])
addHolidayRange('中秋', ['2026-09-25', '2026-09-26', '2026-09-27'])
addHolidayRange('国庆', [
  '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04',
  '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08'
])

export const HOLIDAYS = {
  2026: HOLIDAYS_2026
}

function pad2(n) { return String(n).padStart(2, '0') }

// 查询某日是不是法定节假日
// @return { name, isHoliday } | null
export function getHoliday(year, month, day) {
  const table = HOLIDAYS[year]
  if (!table) return null
  const key = `${year}-${pad2(month)}-${pad2(day)}`
  return table[key] || null
}

// 查询某月所有节假日（用于日历角标）
// @return [{ day, name }]
export function getMonthHolidays(year, month) {
  const table = HOLIDAYS[year]
  if (!table) return []
  const prefix = `${year}-${pad2(month)}-`
  const result = []
  for (const [k, v] of Object.entries(table)) {
    if (k.startsWith(prefix)) {
      const day = parseInt(k.slice(8, 10), 10)
      result.push({ day, name: v.name })
    }
  }
  return result.sort((a, b) => a.day - b.day)
}
