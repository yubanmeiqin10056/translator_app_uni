/**
 * 错误处理工具模块
 * 提供统一的错误提示和重试机制
 */

// 错误类型定义
export const ErrorTypes = {
  NETWORK: 'network',
  API: 'api',
  TIMEOUT: 'timeout',
  OFFLINE: 'offline',
  UNKNOWN: 'unknown'
}

// 错误消息映射
const ErrorMessages = {
  [ErrorTypes.NETWORK]: {
    title: '网络连接失败',
    message: '请检查网络连接后重试',
    icon: 'error'
  },
  [ErrorTypes.API]: {
    title: '服务暂时不可用',
    message: '翻译服务繁忙，请稍后重试',
    icon: 'error'
  },
  [ErrorTypes.TIMEOUT]: {
    title: '请求超时',
    message: '网络响应较慢，请稍后重试',
    icon: 'error'
  },
  [ErrorTypes.OFFLINE]: {
    title: '离线模式',
    message: '当前处于离线状态，部分功能受限',
    icon: 'none'
  },
  [ErrorTypes.UNKNOWN]: {
    title: '发生错误',
    message: '请稍后重试',
    icon: 'error'
  }
}

/**
 * 检测错误类型
 */
export function detectErrorType(error) {
  if (!error) return ErrorTypes.UNKNOWN
  
  const message = error.message || error.errMsg || String(error)
  
  if (message.includes('timeout') || message.includes('超时')) {
    return ErrorTypes.TIMEOUT
  }
  if (message.includes('network') || message.includes('网络') || message.includes('connect')) {
    return ErrorTypes.NETWORK
  }
  if (message.includes('offline') || message.includes('离线')) {
    return ErrorTypes.OFFLINE
  }
  if (message.includes('api') || message.includes('API') || message.includes('500') || message.includes('404')) {
    return ErrorTypes.API
  }
  
  return ErrorTypes.UNKNOWN
}

/**
 * 显示错误提示
 */
export function showError(error, options = {}) {
  const type = detectErrorType(error)
  const errorInfo = ErrorMessages[type]
  
  return new Promise((resolve) => {
    uni.showModal({
      title: options.title || errorInfo.title,
      content: options.message || errorInfo.message,
      showCancel: options.showRetry !== false,
      cancelText: options.cancelText || '取消',
      confirmText: options.confirmText || '重试',
      success: (res) => {
        resolve({
          retry: res.confirm,
          type
        })
      },
      fail: () => {
        resolve({
          retry: false,
          type
        })
      }
    })
  })
}

/**
 * 显示加载中的错误提示
 */
export function showLoadingError(error) {
  const type = detectErrorType(error)
  const errorInfo = ErrorMessages[type]
  
  uni.hideLoading()
  
  uni.showToast({
    title: errorInfo.title,
    icon: errorInfo.icon,
    duration: 2000
  })
}

/**
 * 带重试的异步操作包装器
 */
export async function withRetry(fn, options = {}) {
  const maxRetries = options.maxRetries || 3
  const delay = options.delay || 1000
  let lastError = null
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      // 最后一次尝试不需要等待
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
      }
    }
  }
  
  // 所有重试都失败，显示错误提示
  const result = await showError(lastError, options)
  
  if (result.retry) {
    // 用户点击重试
    return withRetry(fn, options)
  }
  
  throw lastError
}

/**
 * 网络状态检查
 */
export function checkNetwork() {
  return new Promise((resolve) => {
    uni.getNetworkType({
      success: (res) => {
        resolve({
          connected: res.networkType !== 'none',
          type: res.networkType
        })
      },
      fail: () => {
        resolve({
          connected: false,
          type: 'unknown'
        })
      }
    })
  })
}

/**
 * 显示加载提示
 */
export function showLoading(title = '加载中...') {
  uni.showLoading({
    title,
    mask: true
  })
}

/**
 * 隐藏加载提示
 */
export function hideLoading() {
  uni.hideLoading()
}

/**
 * 显示成功提示
 */
export function showSuccess(title) {
  uni.showToast({
    title,
    icon: 'success',
    duration: 1500
  })
}

/**
 * 显示普通提示
 */
export function showInfo(title) {
  uni.showToast({
    title,
    icon: 'none',
    duration: 2000
  })
}

export default {
  ErrorTypes,
  detectErrorType,
  showError,
  showLoadingError,
  withRetry,
  checkNetwork,
  showLoading,
  hideLoading,
  showSuccess,
  showInfo
}
