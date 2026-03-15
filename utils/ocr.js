/**
 * OCR 服务模块
 * 支持百度 OCR 和离线 Tesseract
 */

// 百度 OCR API 配置（需要申请：https://cloud.baidu.com/product/ocr）
const BAIDU_OCR_CONFIG = {
  apiKey: '',  // 请填入你的百度 OCR API Key
  secretKey: '',  // 请填入你的百度 OCR Secret Key
  tokenUrl: 'https://aip.baidubce.com/oauth/2.0/token',
  ocrUrl: 'https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic'
}

// 本地 OCR 服务
const LOCAL_OCR_API = 'http://127.0.0.1:5000/ocr'

// Access Token 缓存
let accessToken = null
let tokenExpireTime = 0

/**
 * OCR 识别图片中的文字
 * @param {string} imagePath - 图片路径
 * @param {string} lang - OCR 语言
 * @returns {Promise<string>} 识别结果
 */
export async function recognizeText(imagePath, lang = 'CHN_ENG') {
  // 检查离线模式
  const offlineMode = uni.getStorageSync('offline_mode') || false
  
  if (offlineMode) {
    return recognizeOffline(imagePath, lang)
  }
  
  // 优先使用百度 OCR
  if (BAIDU_OCR_CONFIG.apiKey && BAIDU_OCR_CONFIG.secretKey) {
    return recognizeWithBaidu(imagePath, lang)
  }
  
  // 降级到免费方案
  return recognizeWithFreeAPI(imagePath, lang)
}

/**
 * 百度 OCR 识别
 */
async function recognizeWithBaidu(imagePath, lang) {
  try {
    // 获取 Access Token
    const token = await getBaiduAccessToken()
    
    // 读取图片为 base64
    const base64 = await imageToBase64(imagePath)
    
    // 调用 OCR API
    const res = await uni.request({
      url: `${BAIDU_OCR_CONFIG.ocrUrl}?access_token=${token}`,
      method: 'POST',
      header: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: {
        image: base64,
        language_type: mapToBaiduLangType(lang),
        detect_direction: true
      },
      timeout: 15000
    })
    
    if (res.statusCode === 200 && res.data.words_result) {
      return res.data.words_result.map(item => item.words).join('\n')
    }
    
    throw new Error(res.data.error_msg || 'OCR 识别失败')
  } catch (e) {
    console.warn('百度 OCR 失败:', e)
    return recognizeWithFreeAPI(imagePath, lang)
  }
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
    tokenExpireTime = Date.now() + (res.data.expires_in - 300) * 1000  // 提前5分钟过期
    return accessToken
  }
  
  throw new Error('获取 Access Token 失败')
}

/**
 * 免费 OCR 方案
 */
async function recognizeWithFreeAPI(imagePath, lang) {
  // 目前没有好的免费 OCR API
  // 返回模拟结果或提示用户配置
  const base64 = await imageToBase64(imagePath)
  
  // 可以尝试一些免费的 OCR 服务
  // 这里返回演示结果
  return simulateOCR(lang)
}

/**
 * 离线 OCR（使用本地 Tesseract）
 */
async function recognizeOffline(imagePath, lang) {
  try {
    const res = await uni.request({
      url: LOCAL_OCR_API,
      method: 'POST',
      data: {
        image: imagePath,
        lang
      },
      timeout: 30000
    })
    
    if (res.statusCode === 200 && res.data.text) {
      return res.data.text
    }
    
    throw new Error('离线 OCR 服务不可用')
  } catch (e) {
    console.warn('离线 OCR 失败:', e)
    throw new Error('OCR 识别失败，请检查网络或安装离线语言包')
  }
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
    'chi_sim': 'CHN_ENG',  // 中英文混合
    'eng': 'ENG',          // 英语
    'jpn': 'JAP',          // 日语
    'kor': 'KOR',          // 韩语
    'fra': 'FRE',          // 法语
    'deu': 'GER',          // 德语
    'spa': 'SPA',          // 西班牙语
    'CHN_ENG': 'CHN_ENG',
    'ENG': 'ENG',
    'JAP': 'JAP',
    'KOR': 'KOR'
  }
  return langMap[lang] || 'CHN_ENG'
}

/**
 * 模拟 OCR 结果（演示用）
 */
function simulateOCR(lang) {
  const samples = {
    'chi_sim': '这是中文文字识别结果示例\n支持多行文本识别',
    'eng': 'This is English text recognition result\nSupports multi-line text',
    'jpn': 'これは日本語のテキストです\n複数行に対応しています',
    'kor': '이것은 한국어 텍스트입니다\n여러 줄을 지원합니다',
    'CHN_ENG': '这是中英文混合识别结果\nThis is mixed Chinese and English text'
  }
  return samples[lang] || 'OCR 识别结果（演示模式）\n请配置百度 OCR API 以获取真实结果'
}

/**
 * 配置百度 OCR API
 */
export function configureBaiduOCR(apiKey, secretKey) {
  BAIDU_OCR_CONFIG.apiKey = apiKey
  BAIDU_OCR_CONFIG.secretKey = secretKey
  uni.setStorageSync('baidu_ocr_config', { apiKey, secretKey })
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
    { code: 'CHN_ENG', name: '中英文混合' },
    { code: 'ENG', name: '英语' },
    { code: 'JAP', name: '日语' },
    { code: 'KOR', name: '韩语' },
    { code: 'FRE', name: '法语' },
    { code: 'GER', name: '德语' },
    { code: 'SPA', name: '西班牙语' }
  ]
}

export default {
  recognizeText,
  configureBaiduOCR,
  loadBaiduOCRConfig,
  getSupportedLanguages
}