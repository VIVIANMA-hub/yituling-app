// 排班合规检查（客户端用）。
// 与 uniCloud-aliyun/cloudfunctions/ai-schedule/lib/postcheck.js 中的硬规则保持一致；
// 服务端走 enforceConsecutiveEmergency（硬改），客户端只检测并提示，不强改用户手动操作。

export const MAX_CONSECUTIVE_EMERGENCY = 3

// 检查某医生的 dayMap 是否含连续 ≥4 天 emergency。
// 返回 { violations: [{ startDay, endDay }] }，空数组表示无违规。
export function findConsecutiveEmergency(dayMap, daysInMonth) {
  const violations = []
  let runStart = 0
  for (let day = 1; day <= daysInMonth; day++) {
    const k = dayMap[String(day)] || dayMap[day]
    if (k === 'emergency') {
      if (runStart === 0) runStart = day
      const runLen = day - runStart + 1
      if (runLen > MAX_CONSECUTIVE_EMERGENCY) {
        const last = violations[violations.length - 1]
        if (last && last.startDay === runStart) {
          last.endDay = day
        } else {
          violations.push({ startDay: runStart, endDay: day })
        }
      }
    } else {
      runStart = 0
    }
  }
  return { violations }
}
