const STORAGE_KEYS = {
  points: 'ytl_points',
  records: 'ytl_point_records',
  checkin: 'ytl_checkin_state',
  proDays: 'ytl_pro_days',
  honorAccount: 'ytl_honor_account'
}

export const POINT_RULES = {
  daily_checkin: 80,
  rewarded_ad: 20,
  share_schedule_valid: 20,
  invite_registered: 20,
  post_approved: 20,
  qa_answer_accepted: 20,
  qa_high_quality_answer: 20,
  quality_content_bonus_min: 20,
  quality_content_bonus_max: 80,
  pro_exchange_cost: 100,
  pro_exchange_days: 1
}

function getDateKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getRecords() {
  return uni.getStorageSync(STORAGE_KEYS.records) || []
}

function setRecords(records) {
  uni.setStorageSync(STORAGE_KEYS.records, records)
}

function getPoints() {
  return Number(uni.getStorageSync(STORAGE_KEYS.points) || 0)
}

function setPoints(points) {
  uni.setStorageSync(STORAGE_KEYS.points, Math.max(0, Number(points) || 0))
}

function hasRecordByUniqueKey(uniqueKey) {
  if (!uniqueKey) return false
  return getRecords().some(item => item.uniqueKey === uniqueKey)
}

function appendRecord(record) {
  const list = getRecords()
  list.unshift(record)
  setRecords(list)
}

export function getPointDashboard() {
  return {
    points: getPoints(),
    records: getRecords(),
    checkin: uni.getStorageSync(STORAGE_KEYS.checkin) || {
      lastCheckinDate: '',
      streakDays: 0
    },
    proDays: Number(uni.getStorageSync(STORAGE_KEYS.proDays) || 0),
    honorAccount: getHonorAccount()
  }
}

export function getHonorAccount() {
  return uni.getStorageSync(STORAGE_KEYS.honorAccount) || {
    level: 1,
    honorPoints: 0,
    badges: []
  }
}

function calcHonorLevel(honorPoints) {
  const safePoints = Math.max(0, Number(honorPoints) || 0)
  return Math.floor(safePoints / 100) + 1
}

export function awardHonor({ honorPoints, badge = '' }) {
  const safePoints = Number(honorPoints || 0)
  if (safePoints <= 0) {
    return { ok: false, reason: 'invalid_params' }
  }
  const account = getHonorAccount()
  const nextHonorPoints = Number(account.honorPoints || 0) + safePoints
  const nextBadges = Array.isArray(account.badges) ? account.badges.slice() : []
  if (badge && !nextBadges.includes(badge)) {
    nextBadges.push(badge)
  }
  const next = {
    level: calcHonorLevel(nextHonorPoints),
    honorPoints: nextHonorPoints,
    badges: nextBadges
  }
  uni.setStorageSync(STORAGE_KEYS.honorAccount, next)
  return { ok: true, account: next }
}

export function awardPoints({ taskType, points, title, sourceId = '', uniqueKey = '', meta = {} }) {
  const safePoints = Number(points || 0)
  if (!taskType || safePoints <= 0) {
    return { ok: false, reason: 'invalid_params' }
  }
  if (uniqueKey && hasRecordByUniqueKey(uniqueKey)) {
    return { ok: false, reason: 'duplicate' }
  }

  const nextPoints = getPoints() + safePoints
  setPoints(nextPoints)
  appendRecord({
    id: `${taskType}_${Date.now()}`,
    taskType,
    title: title || taskType,
    points: safePoints,
    sourceId,
    uniqueKey,
    meta,
    createdAt: new Date().toISOString()
  })
  // 异步同步云端（不 await，不阻塞 UI）
  syncPointsToCloud()
  return { ok: true, points: nextPoints }
}

// 灵点云端同步：发奖/兑换后异步触发。失败静默，节流到 60s 一次
let _lastSyncAt = 0
export async function syncPointsToCloud() {
  const now = Date.now()
  if (now - _lastSyncAt < 60 * 1000) return
  _lastSyncAt = now
  try {
    const identity = (await import('@/utils/identity.js')).getCallerIdentity()
    if (!identity.loggedIn) return
    const localPoints = getPoints()
    const res = await uniCloud.callFunction({
      name: 'ytl-auth',
      data: (await import('@/utils/identity.js')).withAuth({
        action: 'sync_points',
        localPoints
      })
    })
    const r = res && res.result
    if (!r || !r.ok) return
    // 云端 > 本地 → 本地覆盖
    if (r.action === 'client_should_update' && r.cloudPoints > localPoints) {
      setPoints(r.cloudPoints)
    }
  } catch (e) {
    console.log('[points] cloud sync skipped:', e && e.message)
  }
}

export function spendPoints({ taskType, points, title, meta = {} }) {
  const safePoints = Number(points || 0)
  if (!taskType || safePoints <= 0) {
    return { ok: false, reason: 'invalid_params' }
  }
  const current = getPoints()
  if (current < safePoints) {
    return { ok: false, reason: 'insufficient', points: current }
  }
  const nextPoints = current - safePoints
  setPoints(nextPoints)
  appendRecord({
    id: `${taskType}_${Date.now()}`,
    taskType,
    title: title || taskType,
    points: -safePoints,
    sourceId: '',
    uniqueKey: '',
    meta,
    createdAt: new Date().toISOString()
  })
  return { ok: true, points: nextPoints }
}

export function claimDailyCheckin() {
  const today = getDateKey()
  const checkin = uni.getStorageSync(STORAGE_KEYS.checkin) || {
    lastCheckinDate: '',
    streakDays: 0
  }
  if (checkin.lastCheckinDate === today) {
    return { ok: false, reason: 'already_checked_in' }
  }

  const last = checkin.lastCheckinDate
  let streak = 1
  if (last) {
    const prev = new Date(last)
    const now = new Date(today)
    const diffDays = Math.round((now - prev) / (24 * 60 * 60 * 1000))
    streak = diffDays === 1 ? Number(checkin.streakDays || 0) + 1 : 1
  }

  const reward = awardPoints({
    taskType: 'daily_checkin',
    points: POINT_RULES.daily_checkin,
    title: '每日签到',
    sourceId: today,
    uniqueKey: `daily_checkin_${today}`,
    meta: { streakDays: streak }
  })
  if (!reward.ok) return reward

  uni.setStorageSync(STORAGE_KEYS.checkin, {
    lastCheckinDate: today,
    streakDays: streak
  })
  return { ok: true, points: reward.points, streakDays: streak }
}

export function claimDailyAdReward() {
  const today = getDateKey()
  return awardPoints({
    taskType: 'rewarded_ad',
    points: POINT_RULES.rewarded_ad,
    title: '看广告领灵点',
    sourceId: today,
    uniqueKey: `rewarded_ad_${today}`
  })
}

export function claimScheduleShareReward(sourceId = '') {
  const today = getDateKey()
  const stableSource = sourceId || today
  return awardPoints({
    taskType: 'share_schedule_valid',
    points: POINT_RULES.share_schedule_valid,
    title: '有效分享排班图',
    sourceId: stableSource,
    uniqueKey: `share_schedule_valid_${stableSource}`
  })
}

export function grantApprovedPostReward(sourceId) {
  if (!sourceId) return { ok: false, reason: 'missing_source_id' }
  return awardPoints({
    taskType: 'post_approved',
    points: POINT_RULES.post_approved,
    title: '发帖审核通过',
    sourceId,
    uniqueKey: `post_approved_${sourceId}`
  })
}

// 兑换 Pro：登录用户走云端原子扣点 + 累加 vip_expires_at（云端为权威源）
// 未登录用户保留旧本地路径（仅当作"试用记账"，不真正解锁付费功能）
export async function exchangePointsForProDay() {
  let identityMod
  try {
    identityMod = await import('@/utils/identity.js')
  } catch (e) {
    identityMod = null
  }
  const identity = identityMod ? identityMod.getCallerIdentity() : { loggedIn: false }

  if (identity.loggedIn) {
    try {
      const res = await uniCloud.callFunction({
        name: 'ytl-auth',
        data: identityMod.withAuth({ action: 'exchange_pro_day' })
      })
      const r = res && res.result
      if (!r || !r.ok) {
        if (r && r.code === 'INSUFFICIENT_POINTS') {
          return { ok: false, reason: 'insufficient', points: getPoints() }
        }
        return { ok: false, reason: r && r.code ? r.code.toLowerCase() : 'cloud_failed', message: r && r.message }
      }
      // 云端成功：本地 storage 跟随云端值
      setPoints(r.cloudPoints)
      appendRecord({
        id: `exchange_pro_day_${Date.now()}`,
        taskType: 'exchange_pro_day',
        title: '兑换1天Pro',
        points: -POINT_RULES.pro_exchange_cost,
        sourceId: '',
        uniqueKey: '',
        meta: { vipExpiresAt: r.vipExpiresAt, viaCloud: true },
        createdAt: new Date().toISOString()
      })
      // 兑换后重新拉一次 user，让 isVip / vipExpiresAt 同步进 storage
      try {
        const verify = await uniCloud.callFunction({
          name: 'ytl-auth',
          data: identityMod.withAuth({ action: 'verify' })
        })
        const vr = verify && verify.result
        if (vr && vr.ok && vr.user) {
          uni.setStorageSync('ytl_auth_user', JSON.stringify(vr.user))
        }
      } catch (e) {}
      // 仍维护 proDays 计数（前端展示用），但不再是发放凭证
      const currentProDays = Number(uni.getStorageSync(STORAGE_KEYS.proDays) || 0)
      const nextProDays = currentProDays + POINT_RULES.pro_exchange_days
      uni.setStorageSync(STORAGE_KEYS.proDays, nextProDays)
      return {
        ok: true,
        points: r.cloudPoints,
        proDays: nextProDays,
        vipExpiresAt: r.vipExpiresAt,
        viaCloud: true
      }
    } catch (e) {
      console.log('[exchange_pro_day] cloud call failed:', e && e.message)
      return { ok: false, reason: 'network', message: e && e.message }
    }
  }

  // 未登录：本地试用记账（不解锁付费态）
  const spend = spendPoints({
    taskType: 'exchange_pro_day',
    points: POINT_RULES.pro_exchange_cost,
    title: '兑换1天Pro（未登录·本地记账）'
  })
  if (!spend.ok) return spend
  const currentProDays = Number(uni.getStorageSync(STORAGE_KEYS.proDays) || 0)
  const nextProDays = currentProDays + POINT_RULES.pro_exchange_days
  uni.setStorageSync(STORAGE_KEYS.proDays, nextProDays)
  return { ok: true, points: spend.points, proDays: nextProDays, viaCloud: false }
}

export function awardQaAcceptedAnswer(sourceId = '') {
  const today = getDateKey()
  const stableSource = sourceId || `qa_${today}`
  const reward = awardPoints({
    taskType: 'qa_answer_accepted',
    points: POINT_RULES.qa_answer_accepted,
    title: '疑难请教回答被采纳',
    sourceId: stableSource,
    uniqueKey: `qa_answer_accepted_${stableSource}`
  })
  if (!reward.ok) return reward
  const honor = awardHonor({ honorPoints: POINT_RULES.qa_answer_accepted, badge: '答疑达人' })
  return { ok: true, points: reward.points, honorAccount: honor.account || getHonorAccount() }
}

export function awardQaHighQualityAnswer(sourceId = '') {
  const today = getDateKey()
  const stableSource = sourceId || `qa_hq_${today}`
  const reward = awardPoints({
    taskType: 'qa_high_quality_answer',
    points: POINT_RULES.qa_high_quality_answer,
    title: '高质量答疑入选',
    sourceId: stableSource,
    uniqueKey: `qa_high_quality_answer_${stableSource}`
  })
  if (!reward.ok) return reward
  const honor = awardHonor({ honorPoints: POINT_RULES.qa_high_quality_answer, badge: '基层精选答疑' })
  return { ok: true, points: reward.points, honorAccount: honor.account || getHonorAccount() }
}
