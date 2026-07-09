const STORAGE_KEYS = {
  orders: 'ytl_pending_orders',
  requests: 'ytl_invoice_requests',
  statusLogs: 'ytl_invoice_status_logs'
}

const STATUS_FLOW = ['submitted', 'processing', 'issued']

export function getOrders() {
  return uni.getStorageSync(STORAGE_KEYS.orders) || []
}

export function setOrders(orders = []) {
  uni.setStorageSync(STORAGE_KEYS.orders, orders)
}

export function getInvoiceRequests() {
  return uni.getStorageSync(STORAGE_KEYS.requests) || []
}

function setInvoiceRequests(requests = []) {
  uni.setStorageSync(STORAGE_KEYS.requests, requests)
}

export function getInvoiceStatusLogs() {
  return uni.getStorageSync(STORAGE_KEYS.statusLogs) || []
}

function appendStatusLog(log) {
  const logs = getInvoiceStatusLogs()
  logs.unshift(log)
  uni.setStorageSync(STORAGE_KEYS.statusLogs, logs)
}

export function getLatestInvoiceRequestByOrder(orderId = '') {
  if (!orderId) return null
  const requests = getInvoiceRequests()
  return requests.find(item => item.orderId === orderId) || null
}

export function createInvoiceRequest({
  orderId,
  invoiceType = 'normal',
  titleType = 'personal',
  title = '',
  taxNo = '',
  email = '',
  retryOf = ''
}) {
  const orders = getOrders()
  const order = orders.find(item => item.id === orderId)
  if (!order) return { ok: false, reason: 'order_not_found' }

  const eligibility = order.invoiceEligibility || 'self_pay_only'
  if (eligibility === 'apple_only') {
    return { ok: false, reason: 'apple_only' }
  }

  const normalizedTitle = (title || '').trim()
  const normalizedTaxNo = (taxNo || '').trim().toUpperCase()
  const normalizedEmail = (email || '').trim()
  if (!normalizedTitle) return { ok: false, reason: 'missing_title' }
  if (!normalizedEmail) return { ok: false, reason: 'missing_email' }
  if (titleType === 'company' && !normalizedTaxNo) {
    return { ok: false, reason: 'missing_tax_no' }
  }

  const latest = getLatestInvoiceRequestByOrder(orderId)
  if (latest && latest.status !== 'rejected' && !retryOf) {
    return { ok: false, reason: 'already_exists', request: latest }
  }

  const request = {
    id: `INV${Date.now()}`,
    orderId,
    invoiceType: invoiceType === 'special' ? 'special' : 'normal',
    titleType: titleType === 'company' ? 'company' : 'personal',
    title: normalizedTitle,
    taxNo: normalizedTaxNo,
    email: normalizedEmail,
    status: 'submitted',
    rejectReason: '',
    retryOf: retryOf || '',
    createdAt: new Date().toISOString()
  }

  const requests = getInvoiceRequests()
  requests.unshift(request)
  setInvoiceRequests(requests)
  appendStatusLog({
    invoiceId: request.id,
    fromStatus: 'draft',
    toStatus: 'submitted',
    operator: 'user',
    timestamp: new Date().toISOString()
  })
  return { ok: true, request }
}

export function updateInvoiceStatus({
  invoiceId,
  toStatus = '',
  operator = 'system',
  rejectReason = ''
}) {
  const requests = getInvoiceRequests()
  const index = requests.findIndex(item => item.id === invoiceId)
  if (index < 0) return { ok: false, reason: 'not_found' }
  const prev = requests[index]
  const allowed = ['submitted', 'processing', 'issued', 'rejected']
  if (!allowed.includes(toStatus)) return { ok: false, reason: 'invalid_status' }
  if (prev.status === toStatus) return { ok: false, reason: 'no_change', request: prev }

  const next = {
    ...prev,
    status: toStatus,
    rejectReason: toStatus === 'rejected' ? (rejectReason || '材料不完整，请补充后重提') : ''
  }
  requests.splice(index, 1, next)
  setInvoiceRequests(requests)

  appendStatusLog({
    invoiceId,
    fromStatus: prev.status,
    toStatus,
    operator,
    timestamp: new Date().toISOString()
  })
  return { ok: true, request: next }
}

export function advanceInvoiceStatus(invoiceId = '') {
  const request = getInvoiceRequests().find(item => item.id === invoiceId)
  if (!request) return { ok: false, reason: 'not_found' }
  if (request.status === 'rejected' || request.status === 'issued') {
    return { ok: false, reason: 'terminal', request }
  }
  const idx = STATUS_FLOW.indexOf(request.status)
  const toStatus = STATUS_FLOW[Math.min(idx + 1, STATUS_FLOW.length - 1)]
  return updateInvoiceStatus({ invoiceId, toStatus, operator: 'ops' })
}
