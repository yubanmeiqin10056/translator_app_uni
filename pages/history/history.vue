<template>
  <view class="container">
    <!-- 顶部操作栏 -->
    <view class="header-actions">
      <view class="search-box">
        <text class="search-icon">🔍</text>
        <input 
          class="search-input" 
          v-model="searchKeyword" 
          placeholder="搜索翻译记录"
          @input="filterHistory"
        />
      </view>
      <view class="action-btn" @click="clearAllHistory">
        <text>清空</text>
      </view>
    </view>
    
    <!-- 分类标签 -->
    <view class="category-tabs">
      <view 
        class="tab-item" 
        :class="{ active: activeCategory === 'all' }"
        @click="switchCategory('all')"
      >
        <text>全部</text>
      </view>
      <view 
        class="tab-item" 
        :class="{ active: activeCategory === 'text' }"
        @click="switchCategory('text')"
      >
        <text>文本翻译</text>
      </view>
      <view 
        class="tab-item" 
        :class="{ active: activeCategory === 'image' }"
        @click="switchCategory('image')"
      >
        <text>拍照翻译</text>
      </view>
    </view>
    
    <!-- 历史列表 -->
    <scroll-view scroll-y class="history-list" v-if="filteredHistory.length > 0">
      <view class="date-group" v-for="group in groupedHistory" :key="group.date">
        <text class="date-title">{{ group.dateLabel }}</text>
        <view class="history-item" v-for="item in group.items" :key="item.id" @click="viewDetail(item)">
          <view class="item-header">
            <text class="item-type">{{ item.type === 'image' ? '📷 拍照' : '📝 文本' }}</text>
            <text class="item-lang">{{ item.sourceLang }} → {{ item.targetLang }}</text>
          </view>
          <view class="item-content">
            <text class="item-source">{{ item.source }}</text>
            <text class="item-target">{{ item.target }}</text>
          </view>
          <view class="item-footer">
            <text class="item-time">{{ formatTime(item.time) }}</text>
            <view class="item-actions">
              <view class="action-icon" @click.stop="copyText(item.target)">
                <text>📋</text>
              </view>
              <view class="action-icon delete" @click.stop="deleteItem(item.id)">
                <text>🗑️</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
    
    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <text class="empty-icon">📝</text>
      <text class="empty-text">暂无翻译记录</text>
      <text class="empty-tip">翻译内容将自动保存在这里</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      history: [],
      filteredHistory: [],
      groupedHistory: [],
      searchKeyword: '',
      activeCategory: 'all'
    }
  },
  onLoad() {
    this.loadHistory()
  },
  onShow() {
    this.loadHistory()
  },
  methods: {
    loadHistory() {
      this.history = uni.getStorageSync('translation_history') || []
      this.filterHistory()
    },
    
    filterHistory() {
      let filtered = this.history
      
      // 按类型筛选
      if (this.activeCategory !== 'all') {
        filtered = filtered.filter(item => item.type === this.activeCategory)
      }
      
      // 按关键词筛选
      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase()
        filtered = filtered.filter(item => 
          item.source.toLowerCase().includes(keyword) ||
          item.target.toLowerCase().includes(keyword)
        )
      }
      
      this.filteredHistory = filtered
      this.groupHistoryByDate()
    },
    
    groupHistoryByDate() {
      const groups = {}
      const today = new Date().toDateString()
      const yesterday = new Date(Date.now() - 86400000).toDateString()
      
      this.filteredHistory.forEach(item => {
        const date = new Date(item.time).toDateString()
        let dateLabel = ''
        
        if (date === today) {
          dateLabel = '今天'
        } else if (date === yesterday) {
          dateLabel = '昨天'
        } else {
          dateLabel = this.formatDate(item.time)
        }
        
        if (!groups[dateLabel]) {
          groups[dateLabel] = { date: dateLabel, dateLabel, items: [] }
        }
        groups[dateLabel].items.push(item)
      })
      
      this.groupedHistory = Object.values(groups)
    },
    
    switchCategory(category) {
      this.activeCategory = category
      this.filterHistory()
    },
    
    viewDetail(item) {
      // 跳转到详情或直接使用
      uni.showModal({
        title: '翻译详情',
        content: `原文：${item.source}\n\n译文：${item.target}`,
        confirmText: '复制译文',
        success: (res) => {
          if (res.confirm) {
            this.copyText(item.target)
          }
        }
      })
    },
    
    copyText(text) {
      uni.setClipboardData({
        data: text,
        success: () => {
          uni.showToast({ title: '已复制', icon: 'success' })
        }
      })
    },
    
    deleteItem(id) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这条记录吗？',
        success: (res) => {
          if (res.confirm) {
            this.history = this.history.filter(item => item.id !== id)
            uni.setStorageSync('translation_history', this.history)
            this.filterHistory()
            uni.showToast({ title: '已删除', icon: 'success' })
          }
        }
      })
    },
    
    clearAllHistory() {
      if (this.history.length === 0) return
      
      uni.showModal({
        title: '确认清空',
        content: '确定要清空所有翻译记录吗？',
        success: (res) => {
          if (res.confirm) {
            this.history = []
            uni.removeStorageSync('translation_history')
            this.filterHistory()
            uni.showToast({ title: '已清空', icon: 'success' })
          }
        }
      })
    },
    
    formatTime(timestamp) {
      const date = new Date(timestamp)
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    },
    
    formatDate(timestamp) {
      const date = new Date(timestamp)
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      return `${month}月${day}日`
    }
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #f8f8f8;
}

.header-actions {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: #fff;
  gap: 20rpx;
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 40rpx;
  padding: 16rpx 24rpx;
}

.search-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
}

.action-btn {
  padding: 16rpx 24rpx;
  color: #6366F1;
  font-size: 28rpx;
}

.category-tabs {
  display: flex;
  background: #fff;
  padding: 0 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.tab-item {
  padding: 24rpx 32rpx;
  font-size: 28rpx;
  color: #999;
  position: relative;
}

.tab-item.active {
  color: #6366F1;
  font-weight: 500;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 4rpx;
  background: #6366F1;
  border-radius: 2rpx;
}

.history-list {
  height: calc(100vh - 200rpx);
  padding: 24rpx;
}

.date-group {
  margin-bottom: 32rpx;
}

.date-title {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 16rpx;
  display: block;
}

.history-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.item-type {
  font-size: 24rpx;
  color: #6366F1;
  background: rgba(99, 102, 241, 0.1);
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
}

.item-lang {
  font-size: 24rpx;
  color: #999;
}

.item-content {
  margin-bottom: 16rpx;
}

.item-source {
  font-size: 28rpx;
  color: #333;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-target {
  font-size: 26rpx;
  color: #6366F1;
  margin-top: 8rpx;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16rpx;
  border-top: 1rpx solid #f5f5f5;
}

.item-time {
  font-size: 24rpx;
  color: #999;
}

.item-actions {
  display: flex;
  gap: 24rpx;
}

.action-icon {
  font-size: 28rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx;
}

.empty-icon {
  font-size: 100rpx;
  margin-bottom: 24rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 32rpx;
  color: #999;
  margin-bottom: 12rpx;
}

.empty-tip {
  font-size: 26rpx;
  color: #ccc;
}
</style>
