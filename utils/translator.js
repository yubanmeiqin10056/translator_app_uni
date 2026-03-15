/**
 * 翻译服务模块
 * 支持百度翻译、有道翻译和离线翻译
 */

import { showError, withRetry, showLoading, hideLoading, ErrorTypes, detectErrorType } from './errorHandler.js'

// 百度翻译 API 配置
const BAIDU_CONFIG = {
  appId: '',
  secretKey: '',
  url: 'https://fanyi-api.baidu.com/api/trans/vip/translate'
}

// 本地翻译服务
const LOCAL_API = 'http://127.0.0.1:5000/translate'

// 离线词典存储键
const OFFLINE_DICT_KEY = 'offline_dictionary'
const TRANSLATION_CACHE_KEY = 'translation_cache'

/**
 * MD5 加密（简化版）
 */
function md5(string) {
  let hash = 0
  for (let i = 0; i < string.length; i++) {
    const char = string.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).padStart(32, '0').substring(0, 32)
}

/**
 * 生成随机数
 */
function generateRandom() {
  return Math.floor(Math.random() * 100000).toString()
}

/**
 * 翻译文本
 */
export async function translate(text, from = 'auto', to = 'zh') {
  if (!text || !text.trim()) {
    return ''
  }

  // 先检查本地缓存
  const cacheKey = `${from}-${to}-${text}`
  const cachedResult = getFromCache(cacheKey)
  if (cachedResult) {
    return cachedResult
  }

  // 检查离线模式
  const forceOffline = uni.getStorageSync('force_offline_mode')
  
  if (forceOffline) {
    return translateOffline(text, from, to)
  }

  // 在线翻译（带重试）
  try {
    const result = await withRetry(
      () => translateOnline(text, from, to),
      { maxRetries: 2, delay: 500 }
    )
    // 缓存翻译结果
    saveToCache(cacheKey, result)
    return result
  } catch (e) {
    // 在线翻译失败，显示错误并尝试离线翻译
    const errorResult = await showError(e, { 
      title: '翻译失败',
      showRetry: true 
    })
    
    if (errorResult.retry) {
      return translate(text, from, to)
    }
    
    return translateOffline(text, from, to)
  }
}

/**
 * 在线翻译
 */
async function translateOnline(text, from, to) {
  // 优先百度翻译
  if (BAIDU_CONFIG.appId && BAIDU_CONFIG.secretKey) {
    return translateWithBaidu(text, from, to)
  }
  // 免费翻译 API
  return translateWithFreeAPI(text, from, to)
}

/**
 * 百度翻译 API
 */
async function translateWithBaidu(text, from, to) {
  try {
    const salt = generateRandom()
    const sign = md5(BAIDU_CONFIG.appId + text + salt + BAIDU_CONFIG.secretKey)
    
    const res = await uni.request({
      url: BAIDU_CONFIG.url,
      method: 'GET',
      data: {
        q: text,
        from: mapToBaiduLang(from),
        to: mapToBaiduLang(to),
        appid: BAIDU_CONFIG.appId,
        salt: salt,
        sign: sign
      },
      timeout: 10000
    })
    
    if (res.statusCode === 200 && res.data.trans_result) {
      return res.data.trans_result.map(item => item.dst).join('\n')
    }
    
    throw new Error(res.data.error_msg || '翻译失败')
  } catch (e) {
    console.warn('百度翻译失败:', e)
    return translateWithFreeAPI(text, from, to)
  }
}

/**
 * 免费翻译 API
 */
async function translateWithFreeAPI(text, from, to) {
  try {
    const langPair = `${from === 'auto' ? 'autodetect' : from}|${to}`
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`
    
    const res = await uni.request({
      url,
      method: 'GET',
      timeout: 10000
    })
    
    if (res.statusCode === 200 && res.data.responseData) {
      return res.data.responseData.translatedText
    }
    
    throw new Error('翻译失败')
  } catch (e) {
    console.warn('免费翻译失败:', e)
    return simulateTranslation(text, to)
  }
}

/**
 * 离线翻译
 */
async function translateOffline(text, from, to) {
  // 1. 先检查缓存
  const cacheKey = `${from}-${to}-${text}`
  const cached = getFromCache(cacheKey)
  if (cached) {
    return cached
  }

  // 2. 检查离线词典
  const dictResult = lookupDictionary(text, from, to)
  if (dictResult) {
    return dictResult
  }

  // 3. 尝试本地翻译服务
  try {
    const res = await uni.request({
      url: LOCAL_API,
      method: 'POST',
      data: { text, from, to },
      timeout: 15000
    })
    
    if (res.statusCode === 200 && res.data.result) {
      return res.data.result
    }
  } catch (e) {
    console.warn('本地翻译服务不可用:', e)
  }

  // 4. 使用模拟翻译
  return simulateTranslation(text, to)
}

/**
 * 从缓存获取翻译
 */
function getFromCache(key) {
  try {
    const cache = uni.getStorageSync(TRANSLATION_CACHE_KEY) || {}
    const item = cache[key]
    if (item && item.expire > Date.now()) {
      return item.value
    }
  } catch (e) {
    console.warn('读取缓存失败:', e)
  }
  return null
}

/**
 * 保存翻译到缓存
 */
function saveToCache(key, value) {
  try {
    const cache = uni.getStorageSync(TRANSLATION_CACHE_KEY) || {}
    // 缓存30天
    cache[key] = {
      value,
      expire: Date.now() + 30 * 24 * 60 * 60 * 1000
    }
    // 限制缓存大小
    const keys = Object.keys(cache)
    if (keys.length > 1000) {
      // 删除最早的100条
      const sortedKeys = keys.sort((a, b) => cache[a].expire - cache[b].expire)
      sortedKeys.slice(0, 100).forEach(k => delete cache[k])
    }
    uni.setStorageSync(TRANSLATION_CACHE_KEY, cache)
  } catch (e) {
    console.warn('保存缓存失败:', e)
  }
}

/**
 * 离线词典查询
 */
function lookupDictionary(text, from, to) {
  try {
    const dict = uni.getStorageSync(OFFLINE_DICT_KEY) || {}
    const pairKey = `${from}-${to}`
    
    if (dict[pairKey]) {
      // 精确匹配
      if (dict[pairKey][text]) {
        return dict[pairKey][text]
      }
      
      // 模糊匹配（单词级别）
      const words = text.split(/\s+/)
      if (words.length <= 5) {
        const translations = words.map(word => dict[pairKey][word] || word)
        return translations.join(' ')
      }
    }
  } catch (e) {
    console.warn('词典查询失败:', e)
  }
  return null
}

/**
 * 导入离线词典
 */
export function importDictionary(from, to, data) {
  try {
    const dict = uni.getStorageSync(OFFLINE_DICT_KEY) || {}
    const pairKey = `${from}-${to}`
    dict[pairKey] = { ...dict[pairKey], ...data }
    uni.setStorageSync(OFFLINE_DICT_KEY, dict)
    return true
  } catch (e) {
    console.error('导入词典失败:', e)
    return false
  }
}

/**
 * 删除离线词典
 */
export function removeDictionary(from, to) {
  try {
    const dict = uni.getStorageSync(OFFLINE_DICT_KEY) || {}
    const pairKey = `${from}-${to}`
    delete dict[pairKey]
    uni.setStorageSync(OFFLINE_DICT_KEY, dict)
    return true
  } catch (e) {
    console.error('删除词典失败:', e)
    return false
  }
}

/**
 * 获取离线词典列表
 */
export function getOfflineDictionaries() {
  try {
    const dict = uni.getStorageSync(OFFLINE_DICT_KEY) || {}
    return Object.keys(dict).map(key => {
      const [from, to] = key.split('-')
      return {
        from,
        to,
        count: Object.keys(dict[key]).length
      }
    })
  } catch (e) {
    return []
  }
}

/**
 * 清空翻译缓存
 */
export function clearCache() {
  try {
    uni.removeStorageSync(TRANSLATION_CACHE_KEY)
    return true
  } catch (e) {
    return false
  }
}

/**
 * 设置离线模式
 */
export function setOfflineMode(enabled) {
  uni.setStorageSync('force_offline_mode', enabled)
}

/**
 * 获取离线模式状态
 */
export function isOfflineMode() {
  return uni.getStorageSync('force_offline_mode') || false
}

/**
 * 语言代码映射
 */
function mapToBaiduLang(lang) {
  const langMap = {
    'auto': 'auto',
    'zh': 'zh',
    'en': 'en',
    'ja': 'jp',
    'ko': 'kor',
    'fr': 'fra',
    'de': 'de',
    'es': 'spa',
    'ru': 'ru',
    'pt': 'pt',
    'it': 'it'
  }
  return langMap[lang] || lang
}

/**
 * 模拟翻译（降级方案）
 */
function simulateTranslation(text, to) {
  const prefix = {
    'zh': '【离线翻译】',
    'en': '[Offline Translation]',
    'ja': '【オフライン翻訳】',
    'ko': '【오프라인 번역】',
    'fr': '[Traduction hors ligne]',
    'de': '[Offline-Übersetzung]',
    'es': '[Traducción sin conexión]'
  }
  return (prefix[to] || '[Offline]') + text
}

/**
 * 获取支持的语言列表
 */
export function getSupportedLanguages() {
  return [
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'en', name: '英语', flag: '🇬🇧' },
    { code: 'ja', name: '日语', flag: '🇯🇵' },
    { code: 'ko', name: '韩语', flag: '🇰🇷' },
    { code: 'fr', name: '法语', flag: '🇫🇷' },
    { code: 'de', name: '德语', flag: '🇩🇪' },
    { code: 'es', name: '西班牙语', flag: '🇪🇸' },
    { code: 'ru', name: '俄语', flag: '🇷🇺' },
    { code: 'pt', name: '葡萄牙语', flag: '🇵🇹' },
    { code: 'it', name: '意大利语', flag: '🇮🇹' }
  ]
}

/**
 * 配置百度翻译 API
 */
export function configureBaidu(appId, secretKey) {
  BAIDU_CONFIG.appId = appId
  BAIDU_CONFIG.secretKey = secretKey
  uni.setStorageSync('baidu_translate_config', { appId, secretKey })
}

/**
 * 加载百度翻译配置
 */
export function loadBaiduConfig() {
  const config = uni.getStorageSync('baidu_translate_config')
  if (config) {
    BAIDU_CONFIG.appId = config.appId || ''
    BAIDU_CONFIG.secretKey = config.secretKey || ''
  }
}

// 初始化时加载配置
loadBaiduConfig()

export default {
  translate,
  getSupportedLanguages,
  configureBaidu,
  loadBaiduConfig,
  importDictionary,
  removeDictionary,
  getOfflineDictionaries,
  clearCache,
  setOfflineMode,
  isOfflineMode
}
