<template>
  <view class="custom-tabbar" v-if="showTabbar">
    <view 
      class="tabbar-item" 
      v-for="(item, index) in tabs" 
      :key="index"
      :class="{ active: currentIndex === index }"
      @click="switchTab(index)"
    >
      <text class="tabbar-icon">{{ item.icon }}</text>
      <text class="tabbar-text">{{ item.text }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'CustomTabbar',
  data() {
    return {
      currentIndex: 0,
      tabs: [
        { pagePath: '/pages/index/index', text: '首页', icon: '🏠' },
        { pagePath: '/pages/text/text', text: '文本', icon: '📝' },
        { pagePath: '/pages/camera/camera', text: '拍照', icon: '📷' },
        { pagePath: '/pages/settings/settings', text: '设置', icon: '⚙️' }
      ]
    }
  },
  computed: {
    showTabbar() {
      // 在这些页面显示 tabbar
      const tabbarPages = ['/pages/index/index', '/pages/text/text', '/pages/camera/camera', '/pages/settings/settings']
      const currentRoute = '/' + getCurrentPages()[getCurrentPages().length - 1]?.route
      return tabbarPages.includes(currentRoute)
    }
  },
  created() {
    this.updateCurrentIndex()
  },
  methods: {
    updateCurrentIndex() {
      const currentRoute = '/' + getCurrentPages()[getCurrentPages().length - 1]?.route
      const index = this.tabs.findIndex(tab => tab.pagePath === currentRoute)
      this.currentIndex = index >= 0 ? index : 0
    },
    switchTab(index) {
      if (this.currentIndex === index) return
      
      const pagePath = this.tabs[index].pagePath
      uni.switchTab({
        url: pagePath
      })
      
      this.currentIndex = index
    }
  },
  watch: {
    $route() {
      this.updateCurrentIndex()
    }
  }
}
</script>

<style scoped>
.custom-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-around;
  box-shadow: 0 -2rpx 20rpx rgba(0, 0, 0, 0.05);
  z-index: 999;
  padding-bottom: env(safe-area-inset-bottom);
}

.tabbar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  transition: all 0.2s;
}

.tabbar-item.active {
  transform: scale(1.05);
}

.tabbar-icon {
  font-size: 40rpx;
  margin-bottom: 4rpx;
  filter: grayscale(1);
  opacity: 0.6;
  transition: all 0.2s;
}

.tabbar-item.active .tabbar-icon {
  filter: grayscale(0);
  opacity: 1;
}

.tabbar-text {
  font-size: 22rpx;
  color: #999;
  transition: all 0.2s;
}

.tabbar-item.active .tabbar-text {
  color: #6366F1;
  font-weight: 500;
}
</style>
