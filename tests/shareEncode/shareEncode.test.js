'use strict'

const assert = require('node:assert')
const {
  encodeSchedulePayload,
  decodeSchedulePayload,
  VERSION,
  _toBase64Url,
  _fromBase64Url
} = require('../../common/shareEncode')

test('base64url 双向转换：utf8 中文', () => {
  const s = '张三 · 2026年6月排班'
  assert.strictEqual(_fromBase64Url(_toBase64Url(s)), s)
})

test('base64url：输出只含 URL 安全字符', () => {
  const b = _toBase64Url('一些会产生 +/= 的中文字符 ?<>&')
  assert.ok(!/[+/=]/.test(b), `unexpected chars in: ${b}`)
})

test('encode → decode：还原所有字段', () => {
  const input = {
    doctorName: '张三',
    year: 2026,
    month: 6,
    scheduleMap: { '1': 'day', '2': 'rest', '3': 'emergency', '19': 'rest' },
    shiftTypes: [
      { key: 'day', name: '白班', short: '白', color: '#1F6FEB', time: '8-18' },
      { key: 'emergency', name: '急诊', short: '急', color: '#D9342B', time: '夜班' },
      { key: 'rest', name: '休', short: '休', color: '#86868B', time: '' }
    ]
  }
  const enc = encodeSchedulePayload(input)
  const out = decodeSchedulePayload(enc)
  assert.strictEqual(out.doctorName, '张三')
  assert.strictEqual(out.year, 2026)
  assert.strictEqual(out.month, 6)
  assert.strictEqual(out.scheduleMap['1'], 'day')
  assert.strictEqual(out.scheduleMap['3'], 'emergency')
  // shiftTypes 只保留实际用到的
  const keys = out.shiftTypes.map(s => s.key).sort()
  assert.deepStrictEqual(keys, ['day', 'emergency', 'rest'])
})

test('encode: 不用的班次不写入 payload，缩小 URL', () => {
  const input = {
    doctorName: '张三', year: 2026, month: 6,
    scheduleMap: { '1': 'day', '2': 'day' },
    shiftTypes: [
      { key: 'day', name: '白班', short: '白', color: '#1F6FEB' },
      { key: 'emergency', name: '急诊', short: '急', color: '#D9342B' },
      { key: 'early', name: '早班', short: '早', color: '#FF9800' },
      { key: 'rest', name: '休', short: '休', color: '#86868B' }
    ]
  }
  const out = decodeSchedulePayload(encodeSchedulePayload(input))
  assert.deepStrictEqual(out.shiftTypes.map(s => s.key).sort(), ['day'])
})

test('encode: 超出当月范围的 day 字段被丢弃', () => {
  // 6 月只有 30 天，传入 31 应该被丢
  const input = {
    doctorName: '张三', year: 2026, month: 6,
    scheduleMap: { '1': 'day', '30': 'day', '31': 'day' },
    shiftTypes: [{ key: 'day', name: '白', short: '白', color: '#1F6FEB' }]
  }
  const out = decodeSchedulePayload(encodeSchedulePayload(input))
  assert.strictEqual(out.scheduleMap['30'], 'day')
  assert.strictEqual(out.scheduleMap['31'], undefined)
})

test('encode: 长姓名截断到 12 字', () => {
  const longName = '张'.repeat(20)
  const out = decodeSchedulePayload(encodeSchedulePayload({
    doctorName: longName, year: 2026, month: 6,
    scheduleMap: { '1': 'day' },
    shiftTypes: [{ key: 'day', name: '白', short: '白', color: '#1F6FEB' }]
  }))
  assert.strictEqual(out.doctorName.length, 12)
})

test('encode: 缺必填字段抛错', () => {
  assert.throws(() => encodeSchedulePayload({}), /doctorName/)
  assert.throws(() => encodeSchedulePayload({
    doctorName: '张三', year: 2026, month: 13, scheduleMap: {}
  }), /year\/month/)
  assert.throws(() => encodeSchedulePayload({
    doctorName: '张三', year: 2026, month: 6
  }), /scheduleMap/)
})

test('decode: 错误版本抛 UNSUPPORTED_VERSION', () => {
  // 手工构造一个 v=99 的 payload
  const bad = _toBase64Url(JSON.stringify({ v: 99, d: '张三', y: 2026, m: 6, s: {}, t: [] }))
  assert.throws(() => decodeSchedulePayload(bad), /UNSUPPORTED_VERSION/)
})

test('decode: 乱码抛 PAYLOAD_DECODE_FAIL', () => {
  assert.throws(() => decodeSchedulePayload('this-is-not-base64-json-!!!'), /PAYLOAD_DECODE_FAIL|UNSUPPORTED_VERSION|PAYLOAD_FIELDS_MISSING/)
})

test('decode: 空串抛错', () => {
  assert.throws(() => decodeSchedulePayload(''), /required/)
  assert.throws(() => decodeSchedulePayload(null), /required/)
})

test('VERSION 暴露给上层，便于灰度新格式', () => {
  assert.strictEqual(VERSION, 1)
})

test('压缩后 30 天单医生 payload 在合理 URL 长度内（< 1200 字符）', () => {
  const scheduleMap = {}
  for (let d = 1; d <= 30; d++) {
    scheduleMap[String(d)] = d % 4 === 0 ? 'emergency' : (d % 3 === 0 ? 'rest' : 'day')
  }
  const enc = encodeSchedulePayload({
    doctorName: '张医生', year: 2026, month: 6,
    scheduleMap,
    shiftTypes: [
      { key: 'day', name: '白班', short: '白', color: '#1F6FEB', time: '8-18' },
      { key: 'emergency', name: '急诊', short: '急', color: '#D9342B', time: '夜班' },
      { key: 'rest', name: '休', short: '休', color: '#86868B', time: '' }
    ]
  })
  // 加上 base url 后总长度
  const fullUrl = `https://yituling.com/s?d=${enc}`
  assert.ok(fullUrl.length < 1200, `URL too long: ${fullUrl.length}`)
})
