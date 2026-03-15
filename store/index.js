import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    // 已安装的语言包
    installedPacks: [],
    // 翻译历史
    translationHistory: [],
    // 应用设置
    settings: {
      darkMode: false,
      autoDetect: true,
      defaultSourceLang: 'auto',
      defaultTargetLang: 'zh'
    }
  },
  
  getters: {
    installedPacks: state => state.installedPacks,
    hasPack: state => (packId) => state.installedPacks.includes(packId),
    translationHistory: state => state.translationHistory,
    settings: state => state.settings
  },
  
  mutations: {
    SET_INSTALLED_PACKS(state, packs) {
      state.installedPacks = packs
    },
    
    ADD_PACK(state, packId) {
      if (!state.installedPacks.includes(packId)) {
        state.installedPacks.push(packId)
      }
    },
    
    REMOVE_PACK(state, packId) {
      const index = state.installedPacks.indexOf(packId)
      if (index > -1) {
        state.installedPacks.splice(index, 1)
      }
    },
    
    ADD_HISTORY(state, item) {
      state.translationHistory.unshift(item)
      if (state.translationHistory.length > 100) {
        state.translationHistory = state.translationHistory.slice(0, 100)
      }
    },
    
    CLEAR_HISTORY(state) {
      state.translationHistory = []
    },
    
    UPDATE_SETTINGS(state, settings) {
      state.settings = { ...state.settings, ...settings }
    }
  },
  
  actions: {
    // 加载已安装的语言包
    loadInstalledPacks({ commit }) {
      const packs = uni.getStorageSync('installed_packs') || []
      commit('SET_INSTALLED_PACKS', packs)
    },
    
    // 安装语言包
    installPack({ commit, state }, packId) {
      commit('ADD_PACK', packId)
      uni.setStorageSync('installed_packs', state.installedPacks)
    },
    
    // 卸载语言包
    uninstallPack({ commit, state }, packId) {
      commit('REMOVE_PACK', packId)
      uni.setStorageSync('installed_packs', state.installedPacks)
    },
    
    // 添加翻译历史
    addHistory({ commit, state }, item) {
      commit('ADD_HISTORY', {
        ...item,
        time: Date.now()
      })
      uni.setStorageSync('translation_history', state.translationHistory)
    },
    
    // 清空翻译历史
    clearHistory({ commit }) {
      commit('CLEAR_HISTORY')
      uni.removeStorageSync('translation_history')
    },
    
    // 更新设置
    updateSettings({ commit, state }, settings) {
      commit('UPDATE_SETTINGS', settings)
      uni.setStorageSync('app_settings', state.settings)
    },
    
    // 加载设置
    loadSettings({ commit }) {
      const settings = uni.getStorageSync('app_settings')
      if (settings) {
        commit('UPDATE_SETTINGS', settings)
      }
    }
  }
})

export default store
