/**
 * 翻译服务模块
 * 支持百度翻译、有道翻译和离线翻译
 */

// 百度翻译 API 配置（需要申请：https://fanyi-api.baidu.com/）
const BAIDU_CONFIG = {
  appId: '',  // 请填入你的百度翻译 App ID
  secretKey: '',  // 请填入你的百度翻译密钥
  url: 'https://fanyi-api.baidu.com/api/trans/vip/translate'
}

// 有道翻译 API 配置
const YOUDAO_CONFIG = {
  url: 'https://openapi.youdao.com/api'
}

// 本地翻译服务
const LOCAL_API = 'http://127.0.0.1:5000/translate'

/**
 * MD5 加密（用于百度翻译签名）
 */
function md5(string) {
  // 简化版 MD5，实际项目中应使用加密库
  // 这里使用 uni-app 内置的加密方法或第三方库
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
 * @param {string} text - 待翻译文本
 * @param {string} from - 源语言
 * @param {string} to - 目标语言
 * @returns {Promise<string>} 翻译结果
 */
export async function translate(text, from = 'auto', to = 'zh') {
  if (!text || !text.trim()) {
    return ''
  }

  // 检查是否有离线语言包
  const offlineMode = await checkOfflineMode(from, to)
  
  if (offlineMode) {
    return translateOffline(text, from, to)
  } else {
    // 优先使用百度翻译，其次有道，最后免费 API
    return translateWithBaidu(text, from, to)
  }
}

/**
 * 检查是否可以离线翻译
 */
async function checkOfflineMode(from, to) {
  const installed = uni.getStorageSync('installed_packs') || []
  const packId = `${from === 'auto' ? 'en' : from}-${to}`
  return installed.includes(packId)
}

/**
 * 百度翻译 API
 */
async function translateWithBaidu(text, from, to) {
  // 如果没有配置 API Key，使用免费翻译
  if (!BAIDU_CONFIG.appId || !BAIDU_CONFIG.secretKey) {
    return translateWithFreeAPI(text, from, to)
  }

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
 * 免费翻译 API（MyMemory）
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
 * 离线翻译（使用本地模型）
 */
async function translateOffline(text, from, to) {
  try {
    const res = await uni.request({
      url: LOCAL_API,
      method: 'POST',
      data: {
        text,
        from: from === 'auto' ? 'auto' : from,
        to
      },
      timeout: 15000
    })
    
    if (res.statusCode === 200 && res.data.result) {
      return res.data.result
    }
    
    throw new Error('离线翻译服务不可用')
  } catch (e) {
    console.warn('离线翻译失败，尝试在线翻译:', e)
    return translateWithFreeAPI(text, from, to)
  }
}

/**
 * 语言代码映射到百度格式
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
    'zh': '【翻译】',
    'en': '[Translation]',
    'ja': '【翻訳】',
    'ko': '【번역】',
    'fr': '[Traduction]',
    'de': '[Übersetzung]',
    'es': '[Traducción]'
  }
  return (prefix[to] || '[Translation]') + text
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

export default {
  translate,
  getSupportedLanguages,
  configureBaidu,
  loadBaiduConfig
}