// utils/nav.js
// 小白解释：这是一个“安全跳转工具”。
// 以后页面跳转尽量用 go('/pages/xxx/xxx')，不要到处写 uni.navigateTo。

export function go(url) {
  if (!url) {
    uni.showToast({
      title: '页面地址为空',
      icon: 'none'
    })
    return
  }

  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const currentRoute = currentPage ? '/' + currentPage.route : ''

  // 已经在当前页面，就不要重复跳
  if (currentRoute === url) return

  uni.navigateTo({
    url,
    fail() {
      // navigateTo 失败时，尝试 redirectTo
      uni.redirectTo({
        url,
        fail() {
          // redirectTo 还失败，就回到首页再打开
          uni.reLaunch({
            url
          })
        }
      })
    }
  })
}

export function backHome() {
  uni.reLaunch({
    url: '/pages/index/index'
  })
}

export function safeBack(fallbackUrl = '/pages/index/index') {
  const pages = getCurrentPages()

  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.reLaunch({
      url: fallbackUrl
    })
  }
}