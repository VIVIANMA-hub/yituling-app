// 一图灵账号身份门面：客户端永远通过这个文件拿 token / uid / 用户信息。
//
// 设计：
//   - 登录时云函数 ytl-auth 返回 token（存 storage）+ user（缓存 storage 一份用于 UI 展示）
//   - getCallerIdentity() 同步返回缓存里的 uid + name + isVip（供页面 UI 用）
//   - getCallerToken() 拿当前 token，传给业务云函数当身份凭证
//   - ensureLogin(redirect=true) 同步检查 token 存不存在；不存在时跳登录页
//
// 注：token 本身的有效性由服务端 ytl-auth verify 校验，客户端只持有不解析。
//
// 兼容旧的本地 UUID：第一次开屏时若没有 token，仍生成一个 local uid 占位；
// 但 schedule-share / schedule-response 已经在云函数侧改成"有 token 用 token，
// 没有 token 拒绝写入"，所以纯本地 uid 不再能被云端接受。这里保留只是不让旧
// 代码路径炸掉。

const TOKEN_KEY = 'ytl_auth_token'
const TOKEN_EXP_KEY = 'ytl_auth_token_expires_at'
const USER_KEY = 'ytl_auth_user'
const LOCAL_UID_KEY = 'ytl_local_uid'

function genUuid() {
  function s(n) { return Math.floor((1 + Math.random()) * Math.pow(16, n)).toString(16).slice(1) }
  return `${s(8)}-${s(4)}-${s(4)}-${s(4)}-${s(8)}${s(4)}`
}

export function getLocalUid() {
  try {
    let uid = uni.getStorageSync(LOCAL_UID_KEY)
    if (!uid) {
      uid = `local_${genUuid()}`
      uni.setStorageSync(LOCAL_UID_KEY, uid)
    }
    return uid
  } catch (e) {
    return `anon_${Date.now()}`
  }
}

export function getCallerToken() {
  try {
    const token = uni.getStorageSync(TOKEN_KEY)
    const exp = uni.getStorageSync(TOKEN_EXP_KEY)
    if (!token) return ''
    if (exp && Number(exp) < Date.now()) {
      // 过期清掉
      clearAuth()
      return ''
    }
    return token
  } catch (e) { return '' }
}

export function getCallerIdentity() {
  // 已登录：返回 token 携带的用户信息；未登录：返回 local uid 占位（不能写云端）
  try {
    const userStr = uni.getStorageSync(USER_KEY)
    if (userStr) {
      const u = typeof userStr === 'string' ? JSON.parse(userStr) : userStr
      if (u && u.uid) {
        return {
          uid: u.uid,
          name: u.realName || u.nickname || '医生',
          isVip: !!u.isVip,
          phone: u.phone || '',
          loggedIn: true
        }
      }
    }
  } catch (e) {}
  const localUid = getLocalUid()
  let name = '医生'
  try {
    const storedName = uni.getStorageSync('user_name')
    if (storedName) name = String(storedName).slice(0, 24)
  } catch (e) {}
  return { uid: localUid, name, isVip: false, phone: '', loggedIn: false }
}

export function saveAuthFromLoginResult(result) {
  if (!result || !result.token || !result.user) return false
  try {
    uni.setStorageSync(TOKEN_KEY, result.token)
    if (result.tokenExpiresAt) uni.setStorageSync(TOKEN_EXP_KEY, result.tokenExpiresAt)
    uni.setStorageSync(USER_KEY, JSON.stringify(result.user))
    // 顺手把 user_name 也更新一下（兼容旧 UI 引用）
    if (result.user.realName || result.user.nickname) {
      uni.setStorageSync('user_name', result.user.realName || result.user.nickname)
    }
    return true
  } catch (e) {
    return false
  }
}

export function clearAuth() {
  try {
    uni.removeStorageSync(TOKEN_KEY)
    uni.removeStorageSync(TOKEN_EXP_KEY)
    uni.removeStorageSync(USER_KEY)
  } catch (e) {}
}

export function isLoggedIn() {
  return !!getCallerToken()
}

// 调用业务云函数前自动注入 token；登录态用 token 验签，无登录用 uid 占位（仅本地能跑）
export function withAuth(data = {}) {
  const token = getCallerToken()
  const id = getCallerIdentity()
  // 身份 = token（由云函数调 ytl-auth verify 还原）。uid/isVip 不再客户端传，避免伪造身份。
  // responderName / ownerName 仅作为显示名 hint，云函数可参考可忽略，不参与权限判断。
  return {
    ...data,
    token,
    responderName: data.responderName || id.name,
    ownerName: data.ownerName || id.name
  }
}

// 要求登录（未登录时跳登录页）
export function ensureLogin() {
  if (isLoggedIn()) return true
  uni.showModal({
    title: '需要登录',
    content: '此操作需先登录一图灵账号（手机号验证码）',
    confirmText: '去登录',
    cancelText: '稍后',
    success: (r) => {
      if (r.confirm) uni.navigateTo({ url: '/pages/account/login' })
    }
  })
  return false
}

// 静默尝试发放邀请奖励：用户每次有"有效行为"后异步调用一次，由服务端判断
// 是否满足条件。一天最多触发 1 次（节流，避免每次发帖都打云函数）
export async function tryClaimInviteReward() {
  if (!isLoggedIn()) return
  const todayKey = new Date().toISOString().slice(0, 10)
  try {
    const last = uni.getStorageSync('ytl_invite_claim_last') || ''
    if (last === todayKey) return
    uni.setStorageSync('ytl_invite_claim_last', todayKey)
    const r = await uniCloud.callFunction({
      name: 'ytl-auth',
      data: withAuth({ action: 'claim_invite_reward' })
    })
    const body = r && r.result
    if (body && body.ok && body.granted) {
      uni.showToast({ title: '已感谢邀请人，灵点已到账', icon: 'none', duration: 2200 })
    }
  } catch (e) {
    console.log('[invite] claim skipped:', e && e.message)
  }
}
