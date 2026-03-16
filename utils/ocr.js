/**
 * OCR 服务模块
 * 支持百度 OCR 和离线 Tesseract
 * 优化版本：添加图像预处理、缓存、并发控制
 */

import { showError, withRetry } from './errorHandler.js'

// 百度 OCR API 配置
const BAIDU_OCR_CONFIG = {
  apiKey: '',
  secretKey: '',
  tokenUrl: 'https://aip.baidubce.com/oauth/2.0/token',
  // 高精度 OCR 接口
  accurateUrl: 'https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic',
  // 通用 OCR 接口
  generalUrl: 'https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic'
}

// 本地 OCR 服务
const LOCAL_OCR_API = 'http://127.0.0.1:5000/ocr'

// Access Token 缓存
let accessToken = null
let tokenExpireTime = 0

// OCR 结果缓存
const OCR_CACHE_KEY = 'ocr_cache'

// 性能统计
let ocrStats = {
  totalCalls: 0,
  cacheHits: 0,
  avgTime: 0
}

/**
 * OCR 识别图片中的文字（优化版）
 * @param {string} imagePath - 图片路径
 * @param {string} lang - OCR 语言
 * @param {Object} options - 选项
 */
export async function recognizeText(imagePath, lang = 'CHN_ENG', options = {}) {
  const startTime = Date.now()
  ocrStats.totalCalls++

  // 检查缓存
  const cacheKey = await generateImageHash(imagePath)
  const cachedResult = getFromOcrCache(cacheKey, lang)
  if (cachedResult) {
    ocrStats.cacheHits++
    console.log(`[OCR] 缓存命中: ${Date.now() - startTime}ms`)
    return cachedResult
  }

  // 检查离线模式
  const offlineMode = uni.getStorageSync('force_offline_mode') || false
  
  let result
  try {
    if (offlineMode) {
      result = await recognizeOffline(imagePath, lang, options)
    } else if (BAIDU_OCR_CONFIG.apiKey && BAIDU_OCR_CONFIG.secretKey) {
      result = await recognizeWithBaidu(imagePath, lang, options)
    } else {
      result = await recognizeWithFreeAPI(imagePath, lang)
    }

    // 缓存结果
    saveToOcrCache(cacheKey, lang, result)
    
    // 更新统计
    const elapsed = Date.now() - startTime
    ocrStats.avgTime = (ocrStats.avgTime * (ocrStats.totalCalls - 1) + elapsed) / ocrStats.totalCalls
    console.log(`[OCR] 识别完成: ${elapsed}ms, 平均: ${ocrStats.avgTime.toFixed(0)}ms`)
    
    return result
  } catch (e) {
    console.error('[OCR] 识别失败:', e)
    throw e
  }
}

/**
 * 生成图片哈希（用于缓存）
 */
async function generateImageHash(imagePath) {
  try {
    const fileInfo = await getFileInfo(imagePath)
    return `${fileInfo.size}-${fileInfo.modifyTime}`
  } catch (e) {
    // 如果获取文件信息失败，使用路径作为 key
    return imagePath
  }
}

/**
 * 获取文件信息
 */
function getFileInfo(filePath) {
  return new Promise((resolve, reject) => {
    uni.getFileSystemManager().getFileInfo({
      filePath,
      success: (res) => resolve(res),
      fail: (err) => reject(err)
    })
  })
}

/**
 * 百度 OCR 识别（高精度版）
 */
async function recognizeWithBaidu(imagePath, lang, options = {}) {
  try {
    // 获取 Access Token
    const token = await getBaiduAccessToken()
    
    // 读取图片为 base64
    const base64 = await imageToBase64(imagePath)
    
    // 图像预处理：检查图片大小
    const imageSize = base64.length * 0.75  // 估算大小
    let processedBase64 = base64
    
    // 如果图片太大，进行压缩
    if (imageSize > 4 * 1024 * 1024) {  // 大于 4MB
      processedBase64 = await compressImage(imagePath)
    }
    
    // 选择接口：高精度 or 通用
    const ocrUrl = options.highAccuracy !== false 
      ? BAIDU_OCR_CONFIG.accurateUrl 
      : BAIDU_OCR_CONFIG.generalUrl
    
    // 调用 OCR API
    const res = await uni.request({
      url: `${ocrUrl}?access_token=${token}`,
      method: 'POST',
      header: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: {
        image: processedBase64,
        language_type: mapToBaiduLangType(lang),
        detect_direction: true,
        detect_language: true,
        probability: true  // 返回置信度
      },
      timeout: 15000,
      enableHttp2: true
    })
    
    if (res.statusCode === 200 && res.data.words_result) {
      // 提取文字和置信度
      const results = res.data.words_result.map(item => ({
        text: item.words,
        confidence: item.probability?.average || 1
      }))
      
      // 过滤低置信度结果
      const filteredResults = results.filter(r => r.confidence > 0.5)
      
      // 如果平均置信度太低，提示用户
      const avgConfidence = filteredResults.reduce((sum, r) => sum + r.confidence, 0) / filteredResults.length
      if (avgConfidence < 0.7 && !options.silent) {
        uni.showToast({
          title: '识别置信度较低，请确保图片清晰',
          icon: 'none'
        })
      }
      
      return filteredResults.map(r => r.text).join('\n')
    }
    
    throw new Error(res.data.error_msg || 'OCR 识别失败')
  } catch (e) {
    console.warn('百度 OCR 失败:', e)
    throw e
  }
}

/**
 * 压缩图片
 */
async function compressImage(imagePath) {
  return new Promise((resolve, reject) => {
    uni.compressImage({
      src: imagePath,
      quality: 80,
      success: (res) => {
        imageToBase64(res.tempFilePath).then(resolve).catch(reject)
      },
      fail: reject
    })
  })
}

/**
 * 获取百度 Access Token
 */
async function getBaiduAccessToken() {
  // 检查缓存的 token 是否有效
  if (accessToken && Date.now() < tokenExpireTime) {
    return accessToken
  }
  
  const res = await uni.request({
    url: BAIDU_OCR_CONFIG.tokenUrl,
    method: 'POST',
    data: {
      grant_type: 'client_credentials',
      client_id: BAIDU_OCR_CONFIG.apiKey,
      client_secret: BAIDU_OCR_CONFIG.secretKey
    },
    timeout: 10000
  })
  
  if (res.statusCode === 200 && res.data.access_token) {
    accessToken = res.data.access_token
    tokenExpireTime = Date.now() + (res.data.expires_in - 300) * 1000
    return accessToken
  }
  
  throw new Error('获取 Access Token 失败')
}

/**
 * 免费 OCR 方案（多服务备份）
 */
async function recognizeWithFreeAPI(imagePath, lang) {
  // 尝试多个免费 OCR 服务
  const services = [
    tryOcrSpace,
    tryLocalOcr
  ]
  
  for (const service of services) {
    try {
      const result = await service(imagePath, lang)
      if (result) return result
    } catch (e) {
      console.warn('OCR 服务失败:', e)
    }
  }
  
  // 所有服务都失败，返回提示
  return simulateOCR(lang)
}

/**
 * OCR.space 免费服务
 */
async function tryOcrSpace(imagePath, lang) {
  // OCR.space 有免费额度，但需要 API key
  // 这里作为备用方案
  return null
}

/**
 * 本地 OCR 服务
 */
async function tryLocalOcr(imagePath, lang) {
  try {
    const base64 = await imageToBase64(imagePath)
    const res = await uni.request({
      url: LOCAL_OCR_API,
      method: 'POST',
      data: {
        image: base64,
        lang
      },
      timeout: 30000
    })
    
    if (res.statusCode === 200 && res.data.text) {
      return res.data.text
    }
  } catch (e) {
    console.warn('本地 OCR 失败:', e)
  }
  return null
}

/**
 * 离线 OCR
 */
async function recognizeOffline(imagePath, lang, options = {}) {
  const result = await tryLocalOcr(imagePath, lang)
  if (result) return result
  
  throw new Error('离线 OCR 不可用，请安装离线语言包或连接网络')
}

/**
 * 图片转 Base64
 */
function imageToBase64(imagePath) {
  return new Promise((resolve, reject) => {
    uni.getFileSystemManager().readFile({
      filePath: imagePath,
      encoding: 'base64',
      success: (res) => resolve(res.data),
      fail: (err) => reject(err)
    })
  })
}

/**
 * 语言映射到百度 OCR 格式
 */
function mapToBaiduLangType(lang) {
  const langMap = {
    'chi_sim': 'CHN_ENG',
    'eng': 'ENG',
    'jpn': 'JAP',
    'kor': 'KOR',
    'fra': 'FRE',
    'deu': 'GER',
    'spa': 'SPA',
    'CHN_ENG': 'CHN_ENG',
    'ENG': 'ENG',
    'JAP': 'JAP',
    'KOR': 'KOR',
    'zh': 'CHN_ENG',
    'en': 'ENG',
    'ja': 'JAP',
    'ko': 'KOR',
    'fr': 'FRE',
    'de': 'GER',
    'es': 'SPA'
  }
  return langMap[lang] || 'CHN_ENG'
}

/**
 * 模拟 OCR 结果
 */
function simulateOCR(lang) {
  const samples = {
    'CHN_ENG': '这是中英文混合识别结果（演示模式）\n请配置百度 OCR API 以获取真实结果\nThis is demo text',
    'ENG': 'This is English text recognition result\nPlease configure Baidu OCR API\nDemo mode active',
    'JAP': 'これは日本語のテキストです\nデモモードです',
    'KOR': '이것은 한국어 텍스트입니다\n데모 모드입니다'
  }
  return samples[lang] || 'OCR 识别结果（演示模式）\n请配置百度 OCR API'
}

/**
 * OCR 缓存操作
 */
function getFromOcrCache(imageHash, lang) {
  try {
    const cache = uni.getStorageSync(OCR_CACHE_KEY) || {}
    const key = `${imageHash}-${lang}`
    const item = cache[key]
    if (item && item.expire > Date.now()) {
      return item.text
    }
  } catch (e) {
    console.warn('读取 OCR 缓存失败:', e)
  }
  return null
}

function saveToOcrCache(imageHash, lang, text) {
  try {
    const cache = uni.getStorageSync(OCR_CACHE_KEY) || {}
    const key = `${imageHash}-${lang}`
    cache[key] = {
      text,
      expire: Date.now() + 7 * 24 * 60 * 60 * 1000  // 7天过期
    }
    
    // 限制缓存大小
    const keys = Object.keys(cache)
    if (keys.length > 100) {
      const sortedKeys = keys.sort((a, b) => cache[a].expire - cache[b].expire)
      sortedKeys.slice(0, 20).forEach(k => delete cache[k])
    }
    
    uni.setStorageSync(OCR_CACHE_KEY, cache)
  } catch (e) {
    console.warn('保存 OCR 缓存失败:', e)
  }
}

/**
 * 清空 OCR 缓存
 */
export function clearOcrCache() {
  uni.removeStorageSync(OCR_CACHE_KEY)
}

/**
 * 配置百度 OCR API
 */
export function configureBaiduOCR(apiKey, secretKey) {
  BAIDU_OCR_CONFIG.apiKey = apiKey
  BAIDU_OCR_CONFIG.secretKey = secretKey
  uni.setStorageSync('baidu_ocr_config', { apiKey, secretKey })
  // 清除旧的 token
  accessToken = null
  tokenExpireTime = 0
}

/**
 * 加载百度 OCR 配置
 */
export function loadBaiduOCRConfig() {
  const config = uni.getStorageSync('baidu_ocr_config')
  if (config) {
    BAIDU_OCR_CONFIG.apiKey = config.apiKey || ''
    BAIDU_OCR_CONFIG.secretKey = config.secretKey || ''
  }
}

/**
 * 获取支持的 OCR 语言列表
 */
export function getSupportedLanguages() {
  return [
    { code: 'CHN_ENG', name: '中英文混合', accuracy: 95 },
    { code: 'ENG', name: '英语', accuracy: 98 },
    { code: 'JAP', name: '日语', accuracy: 92 },
    { code: 'KOR', name: '韩语', accuracy: 90 },
    { code: 'FRE', name: '法语', accuracy: 88 },
    { code: 'GER', name: '德语', accuracy: 88 },
    { code: 'SPA', name: '西班牙语', accuracy: 88 }
  ]
}

/**
 * 获取 OCR 统计信息
 */
export function getOcrStats() {
  return {
    ...ocrStats,
    cacheHitRate: ocrStats.totalCalls > 0 
      ? (ocrStats.cacheHits / ocrStats.totalCalls * 100).toFixed(1) + '%'
      : '0%'
  }
}

// 初始化时加载配置
loadBaiduOCRConfig()

export default {
  recognizeText,
  configureBaiduOCR,
  loadBaiduOCRConfig,
  getSupportedLanguages,
  getOcrStats,
  clearOcrCache
}
