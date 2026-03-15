<template>
  <view class="container">
    <!-- 头部信息 -->
    <view class="header">
      <text class="title">离线翻译</text>
      <text class="subtitle">支持文本翻译和拍照翻译</text>
    </view>
    
    <!-- 功能入口 -->
    <view class="feature-list">
      <view class="feature-card" @click="goToText">
        <view class="feature-icon" style="background: linear-gradient(135deg, #6366F1, #8B5CF6);">
          <text class="iconfont icon-text">文</text>
        </view>
        <view class="feature-info">
          <text class="feature-title">文本翻译</text>
          <text class="feature-desc">输入文本进行翻译</text>
        </view>
        <view class="feature-arrow">
          <text class="arrow">›</text>
        </view>
      </view>
      
      <view class="feature-card" @click="goToCamera">
        <view class="feature-icon" style="background: linear-gradient(135deg, #8B5CF6, #A78BFA);">
          <text class="iconfont icon-camera">📷</text>
        </view>
        <view class="feature-info">
          <text class="feature-title">拍照翻译</text>
          <text class="feature-desc">拍摄或选择图片翻译</text>
        </view>
        <view class="feature-arrow">
          <text class="arrow">›</text>
        </view>
      </view>
    </view>
    
    <!-- 离线提示 -->
    <view class="offline-tip">
      <text class="tip-icon">⚡</text>
      <text class="tip-text">支持离线使用，需先下载语言包</text>
    </view>
    
    <!-- 最近翻译 -->
    <view class="recent-section" v-if="recentTranslations.length > 0">
      <text class="section-title">最近翻译</text>
      <view class="recent-list">
        <view class="recent-item" v-for="(item, index) in recentTranslations" :key="index">
          <text class="recent-source">{{ item.source }}</text>
          <text class="recent-target">{{ item.target }}</text>
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
      recentTranslations: []
    }
  },
  onLoad() {
    this.loadRecentTranslations()
  },
  onShow() {
    this.loadRecentTranslations()
  },
  methods: {
    goToText() {
      uni.switchTab({
        url: '/pages/text/text'
      })
    },
    goToCamera() {
      uni.switchTab({
        url: '/pages/camera/camera'
      })
    },
    loadRecentTranslations() {
      const history = uni.getStorageSync('translation_history') || []
      this.recentTranslations = history.slice(0, 5)
    }
  }
}
</script>

<style scoped>
.container {
  padding: 40rpx;
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f8f8 0%, #ffffff 100%);
}

.header {
  text-align: center;
  margin-bottom: 60rpx;
  padding-top: 40rpx;
}

.title {
  font-size: 56rpx;
  font-weight: bold;
  color: #333;
  display: block;
}

.subtitle {
  font-size: 28rpx;
  color: #999;
  margin-top: 16rpx;
  display: block;
}

.feature-list {
  margin-bottom: 40rpx;
}

.feature-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(99, 102, 241, 0.1);
}

.feature-icon {
  width: 100rpx;
  height: 100rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  color: #fff;
}

.feature-info {
  flex: 1;
  margin-left: 32rpx;
}

.feature-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  display: block;
}

.feature-desc {
  font-size: 26rpx;
  color: #999;
  margin-top: 8rpx;
  display: block;
}

.feature-arrow {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.arrow {
  font-size: 40rpx;
  color: #ccc;
}

.offline-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 16rpx;
  margin-bottom: 40rpx;
}

.tip-icon {
  font-size: 32rpx;
  margin-right: 12rpx;
}

.tip-text {
  font-size: 26rpx;
  color: #6366F1;
}

.recent-section {
  margin-top: 40rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 24rpx;
  display: block;
}

.recent-list {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}

.recent-item {
  padding: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.recent-item:last-child {
  border-bottom: none;
}

.recent-source {
  font-size: 28rpx;
  color: #333;
  display: block;
}

.recent-target {
  font-size: 26rpx;
  color: #6366F1;
  margin-top: 8rpx;
  display: block;
}
</style>
