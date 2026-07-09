// 排班分享 H5 的 URL payload 编码 / 解码。
// 目标：把单医生整月排班塞进 URL，对方无需安装 App 即可在浏览器看到。
//
// 合规约束（[[project-yituling-app]]）：
//   - 默认只编码单医生数据，不暴露整张科室表（避免人员名单外泄）
//   - 不编码病人姓名、医院、检查号等敏感字段（payload 里没有这些）
//
// payload 结构（编码前的对象）：
// {
//   v: 1,                       // 版本号，方便后续升级
//   d: "张三",                   // 医生姓名（用户自填）
//   y: 2026, m: 6,              // 年月
//   s: { "1":"day","2":"rest", ... },   // scheduleMap（单医生）
//   t: [                         // shiftTypes 子集，只取实际用到的
//     { k:"day", n:"白班", s:"白", c:"#1F6FEB", tm:"8-18" },
//     ...
//   ]
// }
//
// 编码：JSON → utf8 bytes → base64url（URL 安全字符）
// 解码：反向。base64url 比 hex 短约 33%，30 天的 payload 约 600-900 字符，
// 多数即时通讯客户端都能完整接收。

export const VERSION = 1

function toBase64Url(str) {
  // Node / 浏览器两端兼容
  let b64
  if (typeof Buffer !== 'undefined') {
    b64 = Buffer.from(str, 'utf8').toString('base64')
  } else if (typeof btoa !== 'undefined') {
    // btoa 只吃 latin1，先 encodeURIComponent 把 utf8 转成可接受的形式
    b64 = btoa(unescape(encodeURIComponent(str)))
  } else {
    throw new Error('NO_BASE64_IMPL')
  }
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64url.length + 3) % 4)
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(b64, 'base64').toString('utf8')
  }
  if (typeof atob !== 'undefined') {
    return decodeURIComponent(escape(atob(b64)))
  }
  throw new Error('NO_BASE64_IMPL')
}

// 把展示用的 shiftTypes（{key,name,short,color,time}）压成短键，只保留实际用到的班次。
function compressShiftTypes(shiftTypes, scheduleMap) {
  const used = new Set(Object.values(scheduleMap || {}))
  return (shiftTypes || []).filter(s => used.has(s.key)).map(s => ({
    k: s.key,
    n: s.name || s.short || '',
    s: s.short || '',
    c: s.color || '#475467',
    tm: s.time || ''
  }))
}

function decompressShiftTypes(arr) {
  return (arr || []).map(s => ({
    key: s.k,
    name: s.n || s.s || '',
    short: s.s || '',
    color: s.c || '#475467',
    time: s.tm || ''
  }))
}

export function encodeSchedulePayload({ doctorName, year, month, scheduleMap, shiftTypes }) {
  if (!doctorName || typeof doctorName !== 'string') throw new Error('doctorName required')
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error('invalid year/month')
  }
  if (!scheduleMap || typeof scheduleMap !== 'object') throw new Error('scheduleMap required')

  // 只保留 day 1..daysInMonth 范围，避免无效字段
  const daysInMonth = new Date(year, month, 0).getDate()
  const trimmedMap = {}
  for (let d = 1; d <= daysInMonth; d++) {
    const k = scheduleMap[String(d)] || scheduleMap[d]
    if (k) trimmedMap[String(d)] = k
  }

  const payload = {
    v: VERSION,
    d: doctorName.slice(0, 12),
    y: year,
    m: month,
    s: trimmedMap,
    t: compressShiftTypes(shiftTypes, trimmedMap)
  }
  return toBase64Url(JSON.stringify(payload))
}

export function decodeSchedulePayload(encoded) {
  if (!encoded || typeof encoded !== 'string') throw new Error('encoded payload required')
  let obj
  try {
    obj = JSON.parse(fromBase64Url(encoded))
  } catch (e) {
    throw new Error('PAYLOAD_DECODE_FAIL: ' + e.message)
  }
  if (!obj || obj.v !== VERSION) throw new Error('UNSUPPORTED_VERSION')
  if (!obj.d || !Number.isInteger(obj.y) || !Number.isInteger(obj.m)) {
    throw new Error('PAYLOAD_FIELDS_MISSING')
  }
  return {
    doctorName: obj.d,
    year: obj.y,
    month: obj.m,
    scheduleMap: obj.s || {},
    shiftTypes: decompressShiftTypes(obj.t)
  }
}

// uni-app (vite) 用 named import；Node 25+ 单测 require() 也能读 ESM
export { toBase64Url as _toBase64Url, fromBase64Url as _fromBase64Url }
