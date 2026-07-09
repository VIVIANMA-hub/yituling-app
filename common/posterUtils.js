// 排班海报 / CSV 导出共用的纯函数：脱离 Vue 组件实例，方便单测

// hex 颜色与白色按 lightness 比例混合，得到柔化背景色
// lightness=0 返回原色，lightness=1 返回白色
export function tintColor(hex, lightness) {
  const h = String(hex || '#1677ff').replace('#', '')
  if (h.length !== 6) return '#F5F5F7'
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const mix = (c) => Math.round(c + (255 - c) * lightness)
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`
}

// uni-app canvas 没有 roundRect 原生方法，自己用 arcTo 拼一个
export function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

// CSV 字段转义：含 ", " 或换行的字段加双引号 + 转义内层引号
export function csvEscape(s) {
  const v = String(s == null ? '' : s)
  if (/[",\n]/.test(v)) return '"' + v.replace(/"/g, '""') + '"'
  return v
}
