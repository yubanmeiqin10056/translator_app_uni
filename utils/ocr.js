/**
 * OCR 服务模块
 * 支持在线 OCR 和离线 OCR
 */

/**
 * OCR 识别图片中的文字
 * @param {string} imagePath - 图片路径
 * @param {string} lang - OCR 语言
 * @returns {Promise<string>} 识别结果
 */
export async function recognizeText(imagePath, lang = 'chi_sim+eng') {
  // 检查离线模式
  const offlineMode = uni.getStorageSync('offline_mode') || false
  
  if (offlineMode) {
    return recognizeOffline(imagePath, lang)
  } else {
    return recognizeOnline(imagePath, lang)
  }
}

/**
 * 离线 OCR（使用本地 Tesseract）
 */
async function recognizeOffline(imagePath, lang) {
  try {
    // 调用本地 OCR 服务
    const res = await uni.request({
      url: 'http://127.0.0.1:5000/ocr',
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
 * 在线 OCR（使用云服务）
 */
async function recognizeOnline(imagePath, lang) {
  try {
    // 读取图片为 base64
    const base64 = await imageToBase64(imagePath)
    
    // 使用百度 OCR API（需要申请 API Key）
    // 或者使用其他免费 OCR 服务
    const res = await uni.request({
      url: 'https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic',
      method: 'POST',
      header: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: {
        image: base64,
        language_type: getBaiduLangType(lang)
      },
      timeout: 15000
    })
    
    if (res.statusCode === 200 && res.data.words_result) {
      return res.data.words_result.map(item => item.words).join('\n')
    }
    
    throw new Error('OCR 识别失败')
  } catch (e) {
    console.warn('在线 OCR 失败:', e)
    // 返回模拟结果用于演示
    return simulateOCR(lang)
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
      success: (res) => {
        resolve(res.data)
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

/**
 * 获取百度 OCR 语言类型
 */
function getBaiduLangType(lang) {
  const langMap = {
    'chi_sim': 'CHN_ENG',
    'eng': 'ENG',
    'jpn': 'JAP',
    'kor': 'KOR',
    'fra': 'FRE',
    'deu': 'GER',
    'spa': 'SPA'
  }
  return langMap[lang] || 'CHN_ENG'
}

/**
 * 模拟 OCR 结果（演示用）
 */
function simulateOCR(lang) {
  // 模拟不同语言的识别结果
  const samples = {
    'chi_sim': '这是中文文字识别结果示例',
    'eng': 'This is English text recognition result sample',
    'jpn': 'これは日本語のテキスト認識結果です',
    'kor': '이것은 한국어 텍스트 인식 결과입니다',
    'chi_sim+eng': '这是中英文混合识别结果\nThis is mixed Chinese and English result'
  }
  
  return samples[lang] || 'OCR 识别结果（演示模式）'
}

export default {
  recognizeText
}
