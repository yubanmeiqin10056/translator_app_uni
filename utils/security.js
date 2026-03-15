/**
 * 安全验证工具模块
 * 提供文件完整性验证和安全存储功能
 */

/**
 * 简单哈希函数（用于文件完整性验证）
 * 实际生产环境应使用加密库
 */
export function simpleHash(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  // 转为16进制并补齐
  return Math.abs(hash).toString(16).padStart(8, '0')
}

/**
 * 计算对象的哈希值
 */
export function hashObject(obj) {
  return simpleHash(JSON.stringify(obj))
}

/**
 * 验证数据完整性
 */
export function verifyIntegrity(data, expectedHash) {
  const actualHash = hashObject(data)
  return actualHash === expectedHash
}

/**
 * 语言包完整性验证
 */
export function verifyLanguagePack(packData) {
  // 检查必需字段
  const requiredFields = ['id', 'version', 'data']
  for (const field of requiredFields) {
    if (!packData[field]) {
      return {
        valid: false,
        error: `缺少必需字段: ${field}`
      }
    }
  }
  
  // 验证数据完整性
  if (packData.hash) {
    const dataHash = hashObject(packData.data)
    if (dataHash !== packData.hash) {
      return {
        valid: false,
        error: '数据完整性验证失败'
      }
    }
  }
  
  // 验证版本格式
  if (!/^\d+\.\d+\.\d+$/.test(packData.version)) {
    return {
      valid: false,
      error: '版本号格式无效'
    }
  }
  
  return {
    valid: true,
    id: packData.id,
    version: packData.version,
    wordCount: Object.keys(packData.data).length
  }
}

/**
 * 创建签名的语言包
 */
export function createSignedPack(id, version, data) {
  const pack = {
    id,
    version,
    timestamp: Date.now(),
    data,
    hash: hashObject(data)
  }
  return pack
}

/**
 * 安全存储数据
 */
export function secureSet(key, data) {
  try {
    const payload = {
      data,
      hash: hashObject(data),
      timestamp: Date.now()
    }
    uni.setStorageSync(key, payload)
    return true
  } catch (e) {
    console.error('安全存储失败:', e)
    return false
  }
}

/**
 * 安全读取数据
 */
export function secureGet(key) {
  try {
    const payload = uni.getStorageSync(key)
    if (!payload) return null
    
    // 验证数据完整性
    if (payload.hash && !verifyIntegrity(payload.data, payload.hash)) {
      console.warn('数据完整性验证失败:', key)
      return null
    }
    
    return payload.data
  } catch (e) {
    console.error('安全读取失败:', e)
    return null
  }
}

/**
 * 加密敏感数据（简单混淆）
 * 注意：生产环境应使用专业加密库
 */
export function encrypt(text, key) {
  let result = ''
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    result += String.fromCharCode(charCode)
  }
  // Base64 编码
  return btoa(encodeURIComponent(result))
}

/**
 * 解密敏感数据
 */
export function decrypt(encoded, key) {
  try {
    const text = decodeURIComponent(atob(encoded))
    let result = ''
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      result += String.fromCharCode(charCode)
    }
    return result
  } catch (e) {
    console.error('解密失败:', e)
    return null
  }
}

/**
 * 安全存储API密钥
 */
export function storeApiKey(service, key, secret) {
  const encryptKey = 'translator_app_2026'
  const data = {
    key: encrypt(key, encryptKey),
    secret: encrypt(secret, encryptKey)
  }
  return secureSet(`api_${service}`, data)
}

/**
 * 读取API密钥
 */
export function getApiKey(service) {
  const encryptKey = 'translator_app_2026'
  const data = secureGet(`api_${service}`)
  if (!data) return null
  
  return {
    key: decrypt(data.key, encryptKey),
    secret: decrypt(data.secret, encryptKey)
  }
}

/**
 * 删除API密钥
 */
export function deleteApiKey(service) {
  uni.removeStorageSync(`api_${service}`)
}

/**
 * Base64 编码
 */
function btoa(str) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let result = ''
  let i = 0
  
  while (i < str.length) {
    const a = str.charCodeAt(i++)
    const b = i < str.length ? str.charCodeAt(i++) : 0
    const c = i < str.length ? str.charCodeAt(i++) : 0
    
    const bitmap = (a << 16) | (b << 8) | c
    
    result += chars[(bitmap >> 18) & 63]
    result += chars[(bitmap >> 12) & 63]
    result += i > str.length + 1 ? '=' : chars[(bitmap >> 6) & 63]
    result += i > str.length ? '=' : chars[bitmap & 63]
  }
  
  return result
}

/**
 * Base64 解码
 */
function atob(str) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let result = ''
  let i = 0
  
  str = str.replace(/[^A-Za-z0-9\+\/\=]/g, '')
  
  while (i < str.length) {
    const a = chars.indexOf(str.charAt(i++))
    const b = chars.indexOf(str.charAt(i++))
    const c = chars.indexOf(str.charAt(i++))
    const d = chars.indexOf(str.charAt(i++))
    
    const bitmap = (a << 18) | (b << 12) | (c << 6) | d
    
    result += String.fromCharCode((bitmap >> 16) & 255)
    if (c !== 64) result += String.fromCharCode((bitmap >> 8) & 255)
    if (d !== 64) result += String.fromCharCode(bitmap & 255)
  }
  
  return result
}

export default {
  simpleHash,
  hashObject,
  verifyIntegrity,
  verifyLanguagePack,
  createSignedPack,
  secureSet,
  secureGet,
  encrypt,
  decrypt,
  storeApiKey,
  getApiKey,
  deleteApiKey
}
