<script>
import CustomTabbar from '@/components/custom-tabbar.vue'

export default {
  components: {
    CustomTabbar
  },
  onLaunch: function() {
    console.log('App Launch')
    // 初始化应用
    this.initApp()
  },
  onShow: function() {
    console.log('App Show')
  },
  onHide: function() {
    console.log('App Hide')
  },
  methods: {
    async initApp() {
      // 加载设置
      const settings = uni.getStorageSync('app_settings')
      if (settings) {
        this.$store?.commit('UPDATE_SETTINGS', settings)
      }
      
      // 加载已安装的语言包
      const packs = uni.getStorageSync('installed_packs') || []
      this.$store?.commit('SET_INSTALLED_PACKS', packs)
    }
  }
}
</script>

<style>
/* 全局样式 */
page {
  background-color: #f8f8f8;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 主色调 */
:root {
  --primary-color: #6366F1;
  --primary-light: #818CF8;
  --primary-dark: #4F46E5;
  --secondary-color: #8B5CF6;
  --success-color: #10B981;
  --warning-color: #F59E0B;
  --error-color: #EF4444;
}

/* 通用卡片样式 */
.card {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

/* 按钮样式 */
.btn-primary {
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  color: #ffffff;
  border-radius: 12rpx;
  padding: 24rpx 48rpx;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
}

.btn-primary:active {
  opacity: 0.8;
}

/* 输入框样式 */
.input-area {
  background-color: #f5f5f5;
  border-radius: 12rpx;
  padding: 24rpx;
  font-size: 32rpx;
  min-height: 200rpx;
}

/* 安全区域适配 */
.safe-area-bottom {
  padding-bottom: calc(100rpx + env(safe-area-inset-bottom));
}
</style>