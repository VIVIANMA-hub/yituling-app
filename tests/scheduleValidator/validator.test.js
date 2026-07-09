'use strict'

const assert = require('node:assert')
const { findConsecutiveEmergency, MAX_CONSECUTIVE_EMERGENCY } = require('../../common/scheduleValidator')

test('MAX_CONSECUTIVE_EMERGENCY 与服务端常量保持一致', () => {
  assert.strictEqual(MAX_CONSECUTIVE_EMERGENCY, 3)
})

test('findConsecutiveEmergency: 连续 4 天 → 1 个 violation', () => {
  const map = { '1': 'emergency', '2': 'emergency', '3': 'emergency', '4': 'emergency', '5': 'day' }
  const { violations } = findConsecutiveEmergency(map, 5)
  assert.strictEqual(violations.length, 1)
  assert.strictEqual(violations[0].startDay, 1)
  assert.strictEqual(violations[0].endDay, 4)
})

test('findConsecutiveEmergency: 连续 6 天 violation 区间延展到第 6 天', () => {
  const map = { '1': 'emergency', '2': 'emergency', '3': 'emergency', '4': 'emergency', '5': 'emergency', '6': 'emergency' }
  const { violations } = findConsecutiveEmergency(map, 6)
  assert.strictEqual(violations.length, 1)
  assert.strictEqual(violations[0].startDay, 1)
  assert.strictEqual(violations[0].endDay, 6)
})

test('findConsecutiveEmergency: 连续 3 天 → 无 violation', () => {
  const map = { '1': 'emergency', '2': 'emergency', '3': 'emergency', '4': 'day' }
  const { violations } = findConsecutiveEmergency(map, 4)
  assert.deepStrictEqual(violations, [])
})

test('findConsecutiveEmergency: 多段独立违规', () => {
  const map = {
    '1': 'emergency', '2': 'emergency', '3': 'emergency', '4': 'emergency',
    '5': 'day',
    '10': 'emergency', '11': 'emergency', '12': 'emergency', '13': 'emergency', '14': 'emergency'
  }
  const { violations } = findConsecutiveEmergency(map, 14)
  assert.strictEqual(violations.length, 2)
  assert.strictEqual(violations[0].startDay, 1)
  assert.strictEqual(violations[0].endDay, 4)
  assert.strictEqual(violations[1].startDay, 10)
  assert.strictEqual(violations[1].endDay, 14)
})

test('findConsecutiveEmergency: 月底正好 4 天违规', () => {
  const map = { '27': 'emergency', '28': 'emergency', '29': 'emergency', '30': 'emergency' }
  const { violations } = findConsecutiveEmergency(map, 30)
  assert.strictEqual(violations.length, 1)
  assert.strictEqual(violations[0].startDay, 27)
  assert.strictEqual(violations[0].endDay, 30)
})

test('findConsecutiveEmergency: 缺失日期视为非 emergency 不累计', () => {
  // day 4 缺失（undefined），3+5 不应连成 4 天
  const map = { '1': 'emergency', '2': 'emergency', '3': 'emergency', '5': 'emergency', '6': 'emergency' }
  const { violations } = findConsecutiveEmergency(map, 6)
  assert.deepStrictEqual(violations, [])
})

test('findConsecutiveEmergency: 空 map 返回空 violations', () => {
  assert.deepStrictEqual(findConsecutiveEmergency({}, 30).violations, [])
})
