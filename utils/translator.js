/**
 * 翻译服务模块
 * 支持在线翻译和离线翻译
 */

// 翻译 API 配置
const TRANSLATE_API = {
  // 有道翻译 API（免费）
  youdao: 'https://openapi.youdao.com/api',
  // 百度翻译 API
  baidu: 'https://fanyi-api.baidu.com/api/trans/vip/translate',
  // 本地翻译服务
  local: 'http://127.0.0.1:5000/translate'
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
    return translateOnline(text, from, to)
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
 * 离线翻译（使用本地模型）
 */
async function translateOffline(text, from, to) {
  try {
    // 调用本地翻译服务
    const res = await uni.request({
      url: TRANSLATE_API.local,
      method: 'POST',
      data: {
        text,
        from: from === 'auto' ? 'auto' : from,
        to
      },
      timeout: 10000
    })
    
    if (res.statusCode === 200 && res.data.result) {
      return res.data.result
    }
    
    throw new Error('离线翻译服务不可用')
  } catch (e) {
    // 离线服务失败，尝试在线翻译
    console.warn('离线翻译失败，尝试在线翻译:', e)
    return translateOnline(text, from, to)
  }
}

/**
 * 在线翻译（使用免费 API）
 */
async function translateOnline(text, from, to) {
  // 使用简单的在线翻译方案
  // 实际项目中应该使用正式的翻译 API
  
  try {
    // 使用 MyMemory 免费翻译 API（无需 API Key）
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
    // 降级处理：返回模拟结果
    console.warn('在线翻译失败:', e)
    return simulateTranslation(text, to)
  }
}

/**
 * 模拟翻译（降级方案）
 */
function simulateTranslation(text, to) {
  // 这是一个简单的降级方案
  // 实际应用中应该集成真正的翻译引擎
  const prefix = {
    'zh': '【中文翻译】',
    'en': '[English Translation]',
    'ja': '【日本語翻訳】',
    'ko': '【한국어 번역】',
    'fr': '[Traduction française]',
    'de': '[Deutsche Übersetzung]',
    'es': '[Traducción española]'
  }
  
  return (prefix[to] || '') + text
}

/**
 * 语言代码映射
 */
export const langCodeMap = {
  'zh': 'zh-CHS',  // 中文
  'en': 'en',      // 英语
  'ja': 'ja',      // 日语
  'ko': 'ko',      // 韩语
  'fr': 'fr',      // 法语
  'de': 'de',      // 德语
  'es': 'es',      // 西班牙语
  'ru': 'ru',      // 俄语
  'pt': 'pt',      // 葡萄牙语
  'it': 'it'       // 意大利语
}

export default {
  translate,
  langCodeMap
}
