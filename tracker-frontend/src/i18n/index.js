import { createI18n } from 'vue-i18n'

const messages = {
  en: {
    tracker: {
      addTracker: 'Add Tracker',
      hide: 'Hide Form',
      episodes: 'Episodes',
      maps: 'Maps',
      channel: 'Channel',
      status: 'Status',
      manualPlaceholder: 'Custom (e.g. 2.5)',
      add: 'Add',
      clear: 'Clear',
      selectMap: 'Please select a map'
    }
  },
  zh: {
    tracker: {
      addTracker: '新增追蹤',
      hide: '隱藏表單',
      episodes: '章節',
      maps: '地圖',
      channel: '頻道',
      status: '狀態',
      manualPlaceholder: '自訂 (例如 2.5)',
      add: '新增',
      clear: '清除',
      selectMap: '請選擇地圖'
    }
  },
  ja: {
    tracker: {
      addTracker: 'トラッカーを追加',
      hide: 'フォームを隠す',
      episodes: 'エピソード',
      maps: 'マップ',
      channel: 'チャンネル',
      status: 'ステータス',
      manualPlaceholder: 'カスタム (例: 2.5)',
      add: '追加',
      clear: 'クリア',
      selectMap: 'マップを選択してください'
    }
  }
}

export const i18n = createI18n({
  legacy: false, // Use Composition API mode
  locale: localStorage.getItem('locale') || 'en',
  fallbackLocale: 'en',
  messages
})