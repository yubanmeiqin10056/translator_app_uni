<template>
  <view class="container">
    <!-- 语言包列表 -->
    <view class="pack-list">
      <view class="pack-card" v-for="pack in languagePacks" :key="pack.id">
        <view class="pack-header">
          <view class="pack-info">
            <text class="pack-name">{{ pack.sourceName }} → {{ pack.targetName }}</text>
            <text class="pack-size">{{ pack.size }}</text>
          </view>
          <view class="pack-status" :class="{ installed: pack.installed, downloading: pack.downloading }">
            <text v-if="pack.downloading">下载中 {{ pack.progress }}%</text>
            <text v-else-if="pack.installed">已安装</text>
            <text v-else>未安装</text>
          </view>
        </view>
        
        <!-- 下载进度 -->
        <view class="progress-bar" v-if="pack.downloading">
          <view class="progress-fill" :style="{ width: pack.progress + '%' }"></view>
        </view>
        
        <!-- 操作按钮 -->
        <view class="pack-actions">
          <button 
            v-if="!pack.installed && !pack.downloading" 
            class="btn-download"
            @click="downloadPack(pack)"
          >
            下载
          </button>
          <button 
            v-if="pack.installed" 
            class="btn-delete"
            @click="deletePack(pack)"
          >
            删除
          </button>
        </view>
      </view>
    </view>
    
    <!-- 提示信息 -->
    <view class="tips">
      <text class="tip-title">温馨提示</text>
      <text class="tip-item">• 语言包下载后可离线使用</text>
      <text class="tip-item">• 建议在 WiFi 环境下下载</text>
      <text class="tip-item">• 下载完成后会自动解压安装</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      languagePacks: [
        { id: 'en-zh', sourceName: '英语', targetName: '中文', size: '150 MB', installed: false, downloading: false, progress: 0 },
        { id: 'zh-en', sourceName: '中文', targetName: '英语', size: '150 MB', installed: false, downloading: false, progress: 0 },
        { id: 'en-ja', sourceName: '英语', targetName: '日语', size: '180 MB', installed: false, downloading: false, progress: 0 },
        { id: 'ja-zh', sourceName: '日语', targetName: '中文', size: '160 MB', installed: false, downloading: false, progress: 0 },
        { id: 'ko-zh', sourceName: '韩语', targetName: '中文', size: '155 MB', installed: false, downloading: false, progress: 0 },
        { id: 'en-fr', sourceName: '英语', targetName: '法语', size: '140 MB', installed: false, downloading: false, progress: 0 },
        { id: 'en-de', sourceName: '英语', targetName: '德语', size: '145 MB', installed: false, downloading: false, progress: 0 },
        { id: 'en-es', sourceName: '英语', targetName: '西班牙语', size: '142 MB', installed: false, downloading: false, progress: 0 }
      ]
    }
  },
  onLoad() {
    this.loadInstalledPacks()
  },
  methods: {
    loadInstalledPacks() {
      const installed = uni.getStorageSync('installed_packs') || []
      this.languagePacks.forEach(pack => {
        pack.installed = installed.includes(pack.id)
      })
    },
    async downloadPack(pack) {
      pack.downloading = true
      pack.progress = 0
      
      // 模拟下载进度
      const interval = setInterval(() => {
        pack.progress += Math.random() * 15
        if (pack.progress >= 100) {
          pack.progress = 100
          clearInterval(interval)
          
          // 标记为已安装
          pack.downloading = false
          pack.installed = true
          
          // 保存到本地
          const installed = uni.getStorageSync('installed_packs') || []
          if (!installed.includes(pack.id)) {
            installed.push(pack.id)
            uni.setStorageSync('installed_packs', installed)
          }
          
          uni.showToast({
            title: '下载完成',
            icon: 'success'
          })
        }
      }, 200)
      
      // 实际下载逻辑应该调用后端服务
      // const downloadTask = uni.downloadFile({
      //   url: `https://example.com/models/${pack.id}.zip`,
      //   success: (res) => {
      //     // 解压并安装
      //   }
      // })
      // 
      // downloadTask.onProgressUpdate((res) => {
      //   pack.progress = res.progress
      // })
    },
    deletePack(pack) {
      uni.showModal({
        title: '确认删除',
        content: `确定要删除 ${pack.sourceName}→${pack.targetName} 语言包吗？`,
        success: (res) => {
          if (res.confirm) {
            pack.installed = false
            
            // 从本地存储移除
            const installed = uni.getStorageSync('installed_packs') || []
            const index = installed.indexOf(pack.id)
            if (index > -1) {
              installed.splice(index, 1)
              uni.setStorageSync('installed_packs', installed)
            }
            
            uni.showToast({
              title: '已删除',
              icon: 'success'
            })
          }
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

.pack-list {
  margin-bottom: 24rpx;
}

.pack-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.pack-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.pack-info {
  flex: 1;
}

.pack-name {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
  display: block;
}

.pack-size {
  font-size: 26rpx;
  color: #999;
  margin-top: 8rpx;
  display: block;
}

.pack-status {
  font-size: 24rpx;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  background: #f5f5f5;
  color: #999;
}

.pack-status.installed {
  background: rgba(16, 185, 129, 0.1);
  color: #10B981;
}

.pack-status.downloading {
  background: rgba(99, 102, 241, 0.1);
  color: #6366F1;
}

.progress-bar {
  height: 8rpx;
  background: #f0f0f0;
  border-radius: 4rpx;
  margin-bottom: 16rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366F1, #8B5CF6);
  border-radius: 4rpx;
  transition: width 0.2s;
}

.pack-actions {
  display: flex;
  gap: 16rpx;
}

.btn-download,
.btn-delete {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  font-size: 28rpx;
  border-radius: 12rpx;
  border: none;
}

.btn-download {
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  color: #fff;
}

.btn-delete {
  background: #fff;
  color: #EF4444;
  border: 1rpx solid #EF4444;
}

.tips {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.tip-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
  display: block;
}

.tip-item {
  font-size: 26rpx;
  color: #666;
  line-height: 2;
  display: block;
}
</style>
