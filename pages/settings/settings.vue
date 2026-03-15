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
    </view>
    
    <!-- 数据管理 -->
    <view class="section">
      <text class="section-title">数据</text>
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
    </view>
    
    <!-- 自定义 Tabbar -->
    <custom-tabbar />
  </view>
</template>

<script>
import CustomTabbar from '@/components/custom-tabbar.vue'

export default {
  components: {
    CustomTabbar
  },
  data() {
    return {
      isDarkMode: false,
      installedCount: 0,
      cacheSize: '0 KB'
    }
  },
  onLoad() {
    this.loadSettings()
    this.calculateCacheSize()
  },
  onShow() {
    this.loadInstalledCount()
  },
  methods: {
    loadSettings() {
      this.isDarkMode = uni.getStorageSync('dark_mode') || false
    },
    loadInstalledCount() {
      const packs = uni.getStorageSync('installed_packs') || []
      this.installedCount = packs.length
    },
    toggleDarkMode(e) {
      this.isDarkMode = e.detail.value
      uni.setStorageSync('dark_mode', this.isDarkMode)
      
      uni.showToast({
        title: '主题已切换',
        icon: 'success'
      })
    },
    goToLanguageManager() {
      uni.navigateTo({
        url: '/pages/language/language'
      })
    },
    clearHistory() {
      uni.showModal({
        title: '确认清空',
        content: '确定要清空所有翻译历史吗？',
        success: (res) => {
          if (res.confirm) {
            uni.removeStorageSync('translation_history')
            uni.showToast({
              title: '已清空',
              icon: 'success'
            })
          }
        }
      })
    },
    clearCache() {
      uni.showModal({
        title: '确认清除',
        content: '确定要清除所有缓存吗？',
        success: (res) => {
          if (res.confirm) {
            uni.clearStorage()
            uni.showToast({
              title: '已清除',
              icon: 'success'
            })
            this.calculateCacheSize()
          }
        }
      })
    },
    calculateCacheSize() {
      // 简单估算缓存大小
      const info = uni.getStorageInfoSync()
      const sizeKB = info.currentSize
      if (sizeKB < 1024) {
        this.cacheSize = sizeKB + ' KB'
      } else {
        this.cacheSize = (sizeKB / 1024).toFixed(1) + ' MB'
      }
    },
    showAbout() {
      uni.showModal({
        title: '离线翻译',
        content: '一款支持离线使用的翻译应用\n提供文本翻译和拍照翻译功能\n\n版本: 1.0.0',
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

.setting-arrow {
  font-size: 32rpx;
  color: #ccc;
}
</style>
