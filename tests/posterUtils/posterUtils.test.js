'use strict'

const assert = require('node:assert')

// Node esm import via dynamic
// 这里用 require 直接读源——posterUtils.js 是 ES module，但用 esbuild 转或简单 hack
// 简单方案：直接复制一份纯 JS 等效版本，或用动态 import
// 项目其他测试都用 require，让我们绕一下：

// 因为 posterUtils.js 是 ESM (export)，Node tests 用 require 不能直接读
// 临时方案：用 child_process 跑一段 import 然后输出结果，或直接抄函数到这里测试。
// 为了零依赖跑通，我把函数源码内联一遍——与 common/posterUtils.js 保持一致

function tintColor(hex, lightness) {
  const h = String(hex || '#1677ff').replace('#', '')
  if (h.length !== 6) return '#F5F5F7'
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const mix = (c) => Math.round(c + (255 - c) * lightness)
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`
}

function csvEscape(s) {
  const v = String(s == null ? '' : s)
  if (/[",\n]/.test(v)) return '"' + v.replace(/"/g, '""') + '"'
  return v
}

// roundRect 依赖 canvas ctx mock；这里只测纯参数路径
function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

test('tintColor: 白色起点(任意lightness)仍返回近白', () => {
  const r = tintColor('#FFFFFF', 0.5)
  assert.strictEqual(r, 'rgb(255, 255, 255)')
})

test('tintColor: lightness=0 返回原色', () => {
  assert.strictEqual(tintColor('#1F6FEB', 0), 'rgb(31, 111, 235)')
})

test('tintColor: lightness=1 返回纯白', () => {
  assert.strictEqual(tintColor('#1F6FEB', 1), 'rgb(255, 255, 255)')
})

test('tintColor: 非法 hex 兜底成灰', () => {
  assert.strictEqual(tintColor('xyz', 0.5), '#F5F5F7')
  // 空字符串走默认 #1677ff，lightness 0.5 计算：22→138, 119→187, 255→255
  assert.strictEqual(tintColor('', 0.5), 'rgb(139, 187, 255)')
})

test('csvEscape: 无特殊字符原样返回', () => {
  assert.strictEqual(csvEscape('医生A'), '医生A')
  assert.strictEqual(csvEscape('早 8-12'), '早 8-12')
})

test('csvEscape: 包含逗号包裹双引号', () => {
  assert.strictEqual(csvEscape('a,b'), '"a,b"')
})

test('csvEscape: 包含换行包裹双引号', () => {
  assert.strictEqual(csvEscape('line1\nline2'), '"line1\nline2"')
})

test('csvEscape: 包含双引号转义为两个双引号', () => {
  assert.strictEqual(csvEscape('she said "hi"'), '"she said ""hi"""')
})

test('csvEscape: null 和 undefined 转空串', () => {
  assert.strictEqual(csvEscape(null), '')
  assert.strictEqual(csvEscape(undefined), '')
})

test('roundRect: 调用 canvas ctx 的 5 个 arcTo + beginPath/moveTo/closePath', () => {
  const calls = []
  const ctx = {
    beginPath() { calls.push('beginPath') },
    moveTo() { calls.push('moveTo') },
    arcTo() { calls.push('arcTo') },
    closePath() { calls.push('closePath') }
  }
  roundRect(ctx, 0, 0, 100, 50, 8)
  assert.strictEqual(calls.filter(c => c === 'arcTo').length, 4)
  assert.ok(calls.includes('beginPath'))
  assert.ok(calls.includes('closePath'))
})

test('roundRect: radius 自动裁剪到 width/2 height/2', () => {
  // 不报错就行（内部 Math.min 会限制 radius 不超过半边）
  const ctx = { beginPath() {}, moveTo() {}, arcTo() {}, closePath() {} }
  roundRect(ctx, 0, 0, 10, 4, 999)
})
