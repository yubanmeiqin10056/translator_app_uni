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
    
    <!-- 输入区域 -->
    <view class="input-section">
      <textarea 
        class="input-area" 
        v-model="inputText" 
        placeholder="请输入要翻译的文本"
        :maxlength="2000"
      ></textarea>
      <view class="input-footer">
        <text class="char-count">{{ inputText.length }}/2000</text>
        <view class="clear-btn" @click="clearInput" v-if="inputText">
          <text>清空</text>
        </view>
      </view>
    </view>
    
    <!-- 翻译按钮 -->
    <button class="translate-btn" :disabled="!inputText || isTranslating" @click="translate">
      <text v-if="isTranslating">翻译中...</text>
      <text v-else>翻译</text>
    </button>
    
    <!-- 输出区域 -->
    <view class="output-section" v-if="outputText">
      <view class="output-header">
        <text class="output-title">翻译结果</text>
        <view class="copy-btn" @click="copyResult">
          <text>复制</text>
        </view>
      </view>
      <view class="output-area">
        <text>{{ outputText }}</text>
      </view>
    </view>
    
    <!-- 历史记录 -->
    <view class="history-section" v-if="history.length > 0">
      <view class="history-header">
        <text class="history-title">翻译历史</text>
        <view class="clear-history" @click="clearHistory">
          <text>清空</text>
        </view>
      </view>
      <scroll-view scroll-y class="history-list">
        <view class="history-item" v-for="(item, index) in history" :key="index" @click="useHistory(item)">
          <text class="history-source">{{ item.source }}</text>
          <text class="history-target">{{ item.target }}</text>
        </view>
      </scroll-view>
    </view>
    
    <!-- 自定义 Tabbar -->
    <custom-tabbar />
  </view>
</template>

<script>
import { translate } from '@/utils/translator.js'
import CustomTabbar from '@/components/custom-tabbar.vue'

export default {
  components: {
    CustomTabbar
  },
  data() {
    return {
      inputText: '',
      outputText: '',
      isTranslating: false,
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
      ],
      history: []
    }
  },
  onLoad() {
    this.loadHistory()
  },
  onShow() {
    this.loadHistory()
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
        
        const tempText = this.inputText
        this.inputText = this.outputText
        this.outputText = tempText
      }
    },
    clearInput() {
      this.inputText = ''
      this.outputText = ''
    },
    async translateText() {
      if (!this.inputText.trim()) return
      
      this.isTranslating = true
      this.outputText = ''
      
      try {
        const sourceLang = this.languages[this.sourceLangIndex].code
        const targetLang = this.languages[this.targetLangIndex].code
        
        const result = await translate(this.inputText, sourceLang, targetLang)
        this.outputText = result
        
        // 保存到历史
        this.saveToHistory()
      } catch (e) {
        uni.showToast({
          title: '翻译失败: ' + e.message,
          icon: 'none'
        })
      } finally {
        this.isTranslating = false
      }
    },
    translate() {
      this.translateText()
    },
    copyResult() {
      uni.setClipboardData({
        data: this.outputText,
        success: () => {
          uni.showToast({
            title: '已复制',
            icon: 'success'
          })
        }
      })
    },
    saveToHistory() {
      const historyItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        source: this.inputText,
        target: this.outputText,
        sourceLang: this.languages[this.sourceLangIndex].name,
        targetLang: this.languages[this.targetLangIndex].name,
        type: 'text',
        time: Date.now()
      }
      
      this.history.unshift(historyItem)
      if (this.history.length > 100) {
        this.history = this.history.slice(0, 100)
      }
      
      uni.setStorageSync('translation_history', this.history)
    },
    loadHistory() {
      this.history = uni.getStorageSync('translation_history') || []
    },
    clearHistory() {
      uni.showModal({
        title: '确认清空',
        content: '确定要清空所有翻译历史吗？',
        success: (res) => {
          if (res.confirm) {
            this.history = []
            uni.removeStorageSync('translation_history')
          }
        }
      })
    },
    useHistory(item) {
      this.inputText = item.source
      this.outputText = item.target
      
      // 设置语言
      const sourceIdx = this.languages.findIndex(l => l.code === item.sourceLang)
      const targetIdx = this.languages.findIndex(l => l.code === item.targetLang)
      if (sourceIdx > -1) this.sourceLangIndex = sourceIdx
      if (targetIdx > -1) this.targetLangIndex = targetIdx
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

.input-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.input-area {
  width: 100%;
  min-height: 200rpx;
  font-size: 32rpx;
  line-height: 1.6;
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
}

.char-count {
  font-size: 24rpx;
  color: #999;
}

.clear-btn {
  font-size: 24rpx;
  color: #6366F1;
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
}

.translate-btn[disabled] {
  background: #ccc;
}

.output-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.output-title {
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

.output-area {
  font-size: 32rpx;
  line-height: 1.6;
  color: #333;
}

.history-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.history-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.clear-history {
  font-size: 24rpx;
  color: #999;
}

.history-list {
  max-height: 400rpx;
}

.history-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.history-item:last-child {
  border-bottom: none;
}

.history-source {
  font-size: 28rpx;
  color: #333;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-target {
  font-size: 26rpx;
  color: #6366F1;
  margin-top: 8rpx;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
