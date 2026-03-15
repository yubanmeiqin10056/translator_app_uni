<template>
  <view class="container">
    <!-- 语言选择 -->
    <view class="language-selector">
      <picker :value="sourceLangIndex" :range="languages" range-key="name" @change="onSourceLangChange">
        <view class="lang-picker">
          <text>{{ languages[sourceLangIndex].name }}</text>
          <text class="picker-arrow">▼</text>
        </view>
      </picker>
      
      <view class="swap-btn" @click="swapLanguages">
        <text>⇄</text>
      </view>
      
      <picker :value="targetLangIndex" :range="languages" range-key="name" @change="onTargetLangChange">
        <view class="lang-picker">
          <text>{{ languages[targetLangIndex].name }}</text>
          <text class="picker-arrow">▼</text>
        </view>
      </picker>
    </view>
    
    <!-- 图片预览 -->
    <view class="image-section">
      <view class="image-preview" v-if="imagePath">
        <image :src="imagePath" mode="aspectFit" class="preview-img"></image>
        <view class="image-actions">
          <view class="action-btn" @click="chooseImage">
            <text>重新选择</text>
          </view>
          <view class="action-btn danger" @click="clearImage">
            <text>清除</text>
          </view>
        </view>
      </view>
      
      <view class="image-placeholder" v-else>
        <text class="placeholder-icon">📷</text>
        <text class="placeholder-text">点击下方按钮选择图片</text>
      </view>
    </view>
    
    <!-- 操作按钮 -->
    <view class="action-buttons">
      <button class="action-btn-camera" @click="takePhoto">
        <text class="btn-icon">📸</text>
        <text>拍照</text>
      </button>
      <button class="action-btn-gallery" @click="chooseImage">
        <text class="btn-icon">🖼️</text>
        <text>相册</text>
      </button>
    </view>
    
    <!-- 识别和翻译按钮 -->
    <button class="translate-btn" :disabled="!imagePath || isProcessing" @click="processImage">
      <text v-if="isProcessing">处理中...</text>
      <text v-else>识别并翻译</text>
    </button>
    
    <!-- 结果展示 -->
    <view class="result-section" v-if="recognizedText || translatedText">
      <!-- 识别结果 -->
      <view class="result-card" v-if="recognizedText">
        <view class="result-header">
          <text class="result-title">识别结果</text>
          <view class="copy-btn" @click="copyText(recognizedText)">
            <text>复制</text>
          </view>
        </view>
        <view class="result-content">
          <text>{{ recognizedText }}</text>
        </view>
      </view>
      
      <!-- 翻译结果 -->
      <view class="result-card" v-if="translatedText">
        <view class="result-header">
          <text class="result-title">翻译结果</text>
          <view class="copy-btn" @click="copyText(translatedText)">
            <text>复制</text>
          </view>
        </view>
        <view class="result-content translated">
          <text>{{ translatedText }}</text>
        </view>
      </view>
    </view>
    
    <!-- 自定义 Tabbar -->
    <custom-tabbar />
  </view>
</template>

<script>
import { translate } from '@/utils/translator.js'
import { recognizeText } from '@/utils/ocr.js'
import CustomTabbar from '@/components/custom-tabbar.vue'

export default {
  components: {
    CustomTabbar
  },
  data() {
    return {
      imagePath: '',
      recognizedText: '',
      translatedText: '',
      isProcessing: false,
      sourceLangIndex: 0,
      targetLangIndex: 1,
      languages: [
        { code: 'auto', name: '自动检测' },
        { code: 'zh', name: '中文' },
        { code: 'en', name: '英语' },
        { code: 'ja', name: '日语' },
        { code: 'ko', name: '韩语' },
        { code: 'fr', name: '法语' },
        { code: 'de', name: '德语' },
        { code: 'es', name: '西班牙语' }
      ]
    }
  },
  methods: {
    onSourceLangChange(e) {
      this.sourceLangIndex = e.detail.value
    },
    onTargetLangChange(e) {
      this.targetLangIndex = e.detail.value
    },
    swapLanguages() {
      if (this.languages[this.sourceLangIndex].code !== 'auto') {
        const temp = this.sourceLangIndex
        this.sourceLangIndex = this.targetLangIndex
        this.targetLangIndex = temp
      }
    },
    takePhoto() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['camera'],
        success: (res) => {
          this.imagePath = res.tempFilePaths[0]
          this.clearResults()
        },
        fail: (err) => {
          uni.showToast({
            title: '拍照取消',
            icon: 'none'
          })
        }
      })
    },
    chooseImage() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album'],
        success: (res) => {
          this.imagePath = res.tempFilePaths[0]
          this.clearResults()
        },
        fail: (err) => {
          uni.showToast({
            title: '选择取消',
            icon: 'none'
          })
        }
      })
    },
    clearImage() {
      this.imagePath = ''
      this.clearResults()
    },
    clearResults() {
      this.recognizedText = ''
      this.translatedText = ''
    },
    async processImage() {
      if (!this.imagePath) return
      
      this.isProcessing = true
      this.clearResults()
      
      try {
        // OCR 识别
        const sourceLang = this.languages[this.sourceLangIndex].code
        const ocrLang = sourceLang === 'auto' ? 'chi_sim+eng' : this.getOcrLang(sourceLang)
        
        this.recognizedText = await recognizeText(this.imagePath, ocrLang)
        
        if (this.recognizedText) {
          // 翻译
          const targetLang = this.languages[this.targetLangIndex].code
          this.translatedText = await translate(this.recognizedText, sourceLang, targetLang)
        }
      } catch (e) {
        uni.showToast({
          title: '处理失败: ' + e.message,
          icon: 'none'
        })
      } finally {
        this.isProcessing = false
      }
    },
    getOcrLang(code) {
      const langMap = {
        'zh': 'chi_sim',
        'en': 'eng',
        'ja': 'jpn',
        'ko': 'kor',
        'fr': 'fra',
        'de': 'deu',
        'es': 'spa'
      }
      return langMap[code] || 'eng'
    },
    copyText(text) {
      uni.setClipboardData({
        data: text,
        success: () => {
          uni.showToast({
            title: '已复制',
            icon: 'success'
          })
        }
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

.language-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.lang-picker {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.picker-arrow {
  font-size: 20rpx;
  color: #999;
  margin-left: 8rpx;
}

.swap-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #6366F1;
  border-radius: 50%;
  color: #fff;
  font-size: 32rpx;
}

.image-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.image-preview {
  position: relative;
}

.preview-img {
  width: 100%;
  height: 400rpx;
  border-radius: 12rpx;
}

.image-actions {
  display: flex;
  justify-content: center;
  gap: 24rpx;
  margin-top: 20rpx;
}

.action-btn {
  font-size: 26rpx;
  color: #6366F1;
  padding: 12rpx 24rpx;
  border: 1rpx solid #6366F1;
  border-radius: 8rpx;
}

.action-btn.danger {
  color: #EF4444;
  border-color: #EF4444;
}

.image-placeholder {
  height: 300rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 12rpx;
}

.placeholder-icon {
  font-size: 80rpx;
  margin-bottom: 16rpx;
}

.placeholder-text {
  font-size: 28rpx;
  color: #999;
}

.action-buttons {
  display: flex;
  gap: 24rpx;
  margin-bottom: 24rpx;
}

.action-btn-camera,
.action-btn-gallery {
  flex: 1;
  height: 120rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
  border: none;
}

.action-btn-camera {
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  color: #fff;
}

.action-btn-gallery {
  background: #fff;
  color: #6366F1;
  border: 2rpx solid #6366F1;
}

.btn-icon {
  font-size: 36rpx;
  margin-bottom: 8rpx;
}

.translate-btn {
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  color: #fff;
  border-radius: 16rpx;
  height: 96rpx;
  line-height: 96rpx;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
  margin-bottom: 24rpx;
}

.translate-btn[disabled] {
  background: #ccc;
}

.result-section {
  margin-top: 24rpx;
}

.result-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.result-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.copy-btn {
  font-size: 26rpx;
  color: #6366F1;
  padding: 8rpx 16rpx;
  border: 1rpx solid #6366F1;
  border-radius: 8rpx;
}

.result-content {
  font-size: 30rpx;
  line-height: 1.6;
  color: #333;
}

.result-content.translated {
  background: rgba(99, 102, 241, 0.05);
  padding: 16rpx;
  border-radius: 12rpx;
}
</style>
