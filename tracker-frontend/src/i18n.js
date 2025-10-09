import { createI18n } from 'vue-i18n'

export const messages = {
  en: {
    tracker: {
      episodes: 'Episodes',
      maps: 'Maps',
      channel: 'Channel',
      status: 'Status',
      addTitle: 'Add Tracker',
      add: 'Add',
      clear: 'Clear',
    },
  },
  zh: {
    tracker: {
      episodes: '章節',
      maps: '地圖',
      channel: '頻道',
      status: '狀態',
      addTitle: '新增追蹤',
      add: '新增',
      clear: '清除',
    },
  },
  ja: {
    tracker: {
      episodes: 'エピソード',
      maps: 'マップ',
      channel: 'チャンネル',
      status: 'ステータス',
      addTitle: 'トラッカー追加',
      add: '追加',
      clear: 'クリア',
    },
  },
}

const i18n = createI18n({
  locale: localStorage.getItem('lang') || 'en',
  fallbackLocale: 'en',
  messages,
})

export default i18n
