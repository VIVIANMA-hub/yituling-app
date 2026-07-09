'use strict'

const assert = require('node:assert')
const { getHoliday, getMonthHolidays } = require('../../common/holidays')

test('getHoliday: 2026-01-01 是元旦', () => {
  const h = getHoliday(2026, 1, 1)
  assert.ok(h)
  assert.strictEqual(h.name, '元旦')
  assert.strictEqual(h.isHoliday, true)
})

test('getHoliday: 2026-01-04 不是节假日', () => {
  assert.strictEqual(getHoliday(2026, 1, 4), null)
})

test('getHoliday: 2026-10-01 国庆', () => {
  const h = getHoliday(2026, 10, 1)
  assert.strictEqual(h.name, '国庆')
})

test('getHoliday: 2026-05-01 劳动节', () => {
  assert.strictEqual(getHoliday(2026, 5, 1).name, '劳动节')
})

test('getHoliday: 未维护的年份返回 null', () => {
  assert.strictEqual(getHoliday(2099, 1, 1), null)
})

test('getMonthHolidays: 2026 年 5 月返回劳动节 5 天', () => {
  const list = getMonthHolidays(2026, 5)
  assert.strictEqual(list.length, 5)
  assert.deepStrictEqual(list.map(x => x.day), [1, 2, 3, 4, 5])
  assert.strictEqual(list[0].name, '劳动节')
})

test('getMonthHolidays: 2026 年 10 月返回国庆 8 天', () => {
  const list = getMonthHolidays(2026, 10)
  assert.strictEqual(list.length, 8)
  assert.deepStrictEqual(list.map(x => x.day), [1, 2, 3, 4, 5, 6, 7, 8])
  assert.strictEqual(list[0].name, '国庆')
})

test('getMonthHolidays: 2026 年 3 月无节假日', () => {
  assert.deepStrictEqual(getMonthHolidays(2026, 3), [])
})
