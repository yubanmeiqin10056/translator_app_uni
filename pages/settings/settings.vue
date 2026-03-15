<template>
  <view class="container">
    <!-- 外观设置 -->
    <view class="section">
      <text class="section-title">外观</text>
      <view class="setting-item">
        <view class="setting-left">
          <text class="setting-icon">🌙</text>
          <text class="setting-label">深色模式</text>
        </view>
        <switch :checked="isDarkMode" @change="toggleDarkMode" color="#6366F1" />
      </view>
    </view>
    
    <!-- API 配置 -->
    <view class="section">
      <text class="section-title">API 配置</text>
      <view class="setting-item" @click="showBaiduTranslateConfig">
        <view class="setting-left">
          <text class="setting-icon">🌐</text>
          <text class="setting-label">百度翻译 API</text>
        </view>
        <view class="setting-right">
          <text class="setting-value" :class="{ configured: baiduTranslateConfigured }">
            {{ baiduTranslateConfigured ? '已配置' : '未配置' }}
          </text>
          <text class="setting-arrow">›</text>
        </view>
      </view>
      <view class="setting-item" @click="showBaiduOCRConfig">
        <view class="setting-left">
          <text class="setting-icon">👁️</text>
          <text class="setting-label">百度 OCR API</text>
        </view>
        <view class="setting-right">
          <text class="setting-value" :class="{ configured: baiduOCRConfigured }">
            {{ baiduOCRConfigured ? '已配置' : '未配置' }}
          </text>
          <text class="setting-arrow">›</text>
        </view>
      </view>
    </view>
    
    <!-- 语言包管理 -->
    <view class="section">
      <text class="section-title">语言包</text>
      <view class="setting-item" @click="goToLanguageManager">
        <view class="setting-left">
          <text class="setting-icon">🌍</text>
          <text class="setting-label">语言包管理</text>
        </view>
        <view class="setting-right">
          <text class="setting-value">{{ installedCount }} 个已安装</text>
          <text class="setting-arrow">›</text>
        </view>
      </view>
      <view class="setting-item">
        <view class="setting-left">
          <text class="setting-icon">📴</text>
          <text class="setting-label">离线模式</text>
        </view>
        <switch :checked="offlineMode" @change="toggleOfflineMode" color="#6366F1" />
      </view>
    </view>
    
    <!-- 数据管理 -->
    <view class="section">
      <text class="section-title">数据</text>
      <view class="setting-item" @click="goToHistory">
        <view class="setting-left">
          <text class="setting-icon">📋</text>
          <text class="setting-label">翻译历史</text>
        </view>
        <view class="setting-right">
          <text class="setting-value">{{ historyCount }} 条记录</text>
          <text class="setting-arrow">›</text>
        </view>
      </view>
      <view class="setting-item" @click="clearHistory">
        <view class="setting-left">
          <text class="setting-icon">🗑️</text>
          <text class="setting-label">清空翻译历史</text>
        </view>
        <view class="setting-right">
          <text class="setting-arrow">›</text>
        </view>
      </view>
      <view class="setting-item" @click="clearCache">
        <view class="setting-left">
          <text class="setting-icon">🧹</text>
          <text class="setting-label">清除缓存</text>
        </view>
        <view class="setting-right">
          <text class="setting-value">{{ cacheSize }}</text>
          <text class="setting-arrow">›</text>
        </view>
      </view>
    </view>
    
    <!-- 关于 -->
    <view class="section">
      <text class="section-title">关于</text>
      <view class="setting-item">
        <view class="setting-left">
          <text class="setting-icon">📱</text>
          <text class="setting-label">版本</text>
        </view>
        <text class="setting-value">1.0.0</text>
      </view>
      <view class="setting-item" @click="showAbout">
        <view class="setting-left">
          <text class="setting-icon">ℹ️</text>
          <text class="setting-label">关于应用</text>
        </view>
        <view class="setting-right">
          <text class="setting-arrow">›</text>
        </view>
      </view>
      <view class="setting-item" @click="showHelp">
        <view class="setting-left">
          <text class="setting-icon">❓</text>
          <text class="setting-label">帮助与反馈</text>
        </view>
        <view class="setting-right">
          <text class="setting-arrow">›</text>
        </view>
      </view>
    </view>
    
    <!-- 自定义 Tabbar -->
    <custom-tabbar />
  </view>
</template>

<script>
import CustomTabbar from '@/components/custom-tabbar.vue'
import { loadBaiduConfig, configureBaidu, setOfflineMode } from '@/utils/translator.js'
import { loadBaiduOCRConfig, configureBaiduOCR } from '@/utils/ocr.js'
import { storeApiKey, getApiKey, deleteApiKey, secureSet, secureGet } from '@/utils/security.js'

export default {
  components: {
    CustomTabbar
  },
  data() {
    return {
      isDarkMode: false,
      offlineMode: false,
      installedCount: 0,
      historyCount: 0,
      cacheSize: '0 KB',
      baiduTranslateConfigured: false,
      baiduOCRConfigured: false
    }
  },
  onLoad() {
    this.loadSettings()
    this.calculateCacheSize()
    this.loadAPIConfig()
  },
  onShow() {
    this.loadInstalledCount()
    this.loadHistoryCount()
  },
  methods: {
    loadSettings() {
      this.isDarkMode = uni.getStorageSync('dark_mode') || false
      this.offlineMode = uni.getStorageSync('offline_mode') || false
    },
    loadInstalledCount() {
      const packs = uni.getStorageSync('installed_packs') || []
      this.installedCount = packs.length
    },
    loadHistoryCount() {
      const history = uni.getStorageSync('translation_history') || []
      this.historyCount = history.length
    },
    loadAPIConfig() {
      loadBaiduConfig()
      loadBaiduOCRConfig()
      
      const translateConfig = uni.getStorageSync('baidu_translate_config')
      this.baiduTranslateConfigured = !!(translateConfig && translateConfig.appId)
      
      const ocrConfig = uni.getStorageSync('baidu_ocr_config')
      this.baiduOCRConfigured = !!(ocrConfig && ocrConfig.apiKey)
    },
    toggleDarkMode(e) {
      this.isDarkMode = e.detail.value
      uni.setStorageSync('dark_mode', this.isDarkMode)
      uni.showToast({ title: '主题已切换', icon: 'success' })
    },
    toggleOfflineMode(e) {
      this.offlineMode = e.detail.value
      setOfflineMode(this.offlineMode)
      uni.showToast({ 
        title: this.offlineMode ? '已开启离线模式' : '已关闭离线模式', 
        icon: 'success' 
      })
    },
    goToLanguageManager() {
      uni.navigateTo({ url: '/pages/language/language' })
    },
    goToHistory() {
      uni.navigateTo({ url: '/pages/history/history' })
    },
    showBaiduTranslateConfig() {
      const currentConfig = uni.getStorageSync('baidu_translate_config') || {}
      uni.showModal({
        title: '百度翻译 API 配置',
        editable: true,
        placeholderText: '请输入 App ID',
        success: (res) => {
          if (res.confirm && res.content) {
            this.saveBaiduTranslateId(res.content)
          }
        }
      })
    },
    saveBaiduTranslateId(appId) {
      uni.showModal({
        title: '请输入密钥',
        editable: true,
        placeholderText: '请输入 Secret Key',
        success: (res) => {
          if (res.confirm && res.content) {
            configureBaidu(appId, res.content)
            this.baiduTranslateConfigured = true
            uni.showToast({ title: '配置成功', icon: 'success' })
          }
        }
      })
    },
    showBaiduOCRConfig() {
      uni.showModal({
        title: '百度 OCR API 配置',
        editable: true,
        placeholderText: '请输入 API Key',
        success: (res) => {
          if (res.confirm && res.content) {
            this.saveBaiduOCRKey(res.content)
          }
        }
      })
    },
    saveBaiduOCRKey(apiKey) {
      uni.showModal({
        title: '请输入密钥',
        editable: true,
        placeholderText: '请输入 Secret Key',
        success: (res) => {
          if (res.confirm && res.content) {
            configureBaiduOCR(apiKey, res.content)
            this.baiduOCRConfigured = true
            uni.showToast({ title: '配置成功', icon: 'success' })
          }
        }
      })
    },
    clearHistory() {
      uni.showModal({
        title: '确认清空',
        content: '确定要清空所有翻译历史吗？',
        success: (res) => {
          if (res.confirm) {
            uni.removeStorageSync('translation_history')
            this.historyCount = 0
            uni.showToast({ title: '已清空', icon: 'success' })
          }
        }
      })
    },
    clearCache() {
      uni.showModal({
        title: '确认清除',
        content: '确定要清除翻译缓存吗？不会影响API配置和语言包。',
        success: (res) => {
          if (res.confirm) {
            // 只清除翻译缓存，保留API配置和语言包
            uni.removeStorageSync('translation_cache')
            uni.removeStorageSync('translation_history')
            this.calculateCacheSize()
            uni.showToast({ title: '已清除缓存', icon: 'success' })
          }
        }
      })
    },
    calculateCacheSize() {
      try {
        const info = uni.getStorageInfoSync()
        const sizeKB = info.currentSize
        if (sizeKB < 1024) {
          this.cacheSize = sizeKB + ' KB'
        } else {
          this.cacheSize = (sizeKB / 1024).toFixed(1) + ' MB'
        }
      } catch (e) {
        this.cacheSize = '0 KB'
      }
    },
    showAbout() {
      uni.showModal({
        title: '离线翻译',
        content: '一款支持离线使用的翻译应用\n提供文本翻译和拍照翻译功能\n\n版本: 1.0.0\n\n技术栈: uni-app + Vue.js',
        showCancel: false
      })
    },
    showHelp() {
      uni.showModal({
        title: '帮助与反馈',
        content: '使用说明：\n1. 配置百度翻译/OCR API 获得更好的体验\n2. 下载语言包支持离线翻译\n3. 支持文本输入和拍照翻译\n\n如有问题请反馈至：\nfeedback@example.com',
        showCancel: false
      })
    }
  }
}
</script>

<style scoped>
.container {
  padding: 24rpx;
  min-height: 100vh;
  background: #f8f8f8;
  padding-bottom: 150rpx;
}

.section {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  overflow: hidden;
}

.section-title {
  font-size: 26rpx;
  color: #999;
  padding: 24rpx 32rpx 16rpx;
  display: block;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-left {
  display: flex;
  align-items: center;
}

.setting-icon {
  font-size: 36rpx;
  margin-right: 24rpx;
}

.setting-label {
  font-size: 32rpx;
  color: #333;
}

.setting-right {
  display: flex;
  align-items: center;
}

.setting-value {
  font-size: 28rpx;
  color: #999;
  margin-right: 12rpx;
}

.setting-value.configured {
  color: #10B981;
}

.setting-arrow {
  font-size: 32rpx;
  color: #ccc;
}
</style>