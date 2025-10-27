<template>
  <div class="reminder-settings-panel">
    <div class="panel-header">
      <h2>🔔 Reminder Settings</h2>
      <button @click="$emit('close')" class="close-btn">✕</button>
    </div>

    <div class="panel-body">
      <!-- Global Enable/Disable -->
      <div class="setting-group">
        <label class="setting-label">
          <input
            type="checkbox"
            v-model="settings.enabled"
            @change="saveSettings"
          />
          <span class="setting-title">Enable Voice Reminders</span>
        </label>
        <p class="setting-description">
          Speak "Level X, Channel Y" when a tracker transitions from phase 0 to phase 1
        </p>
      </div>

      <div v-if="settings.enabled" class="settings-controls">
        <!-- Volume Control -->
        <div class="setting-group">
          <label class="setting-label">
            <span class="setting-title">🔊 Volume</span>
            <span class="setting-value">{{ Math.round(settings.volume * 100) }}%</span>
          </label>
          <input
            type="range"
            v-model.number="settings.volume"
            min="0"
            max="1"
            step="0.1"
            @change="saveSettings"
            class="slider"
          />
        </div>

        <!-- Speech Rate Control -->
        <div class="setting-group">
          <label class="setting-label">
            <span class="setting-title">⚡ Speech Rate</span>
            <span class="setting-value">{{ settings.rate.toFixed(1) }}x</span>
          </label>
          <input
            type="range"
            v-model.number="settings.rate"
            min="0.5"
            max="2"
            step="0.1"
            @change="saveSettings"
            class="slider"
          />
        </div>

        <!-- Speech Pitch Control -->
        <div class="setting-group">
          <label class="setting-label">
            <span class="setting-title">🎵 Speech Pitch</span>
            <span class="setting-value">{{ settings.pitch.toFixed(1) }}x</span>
          </label>
          <input
            type="range"
            v-model.number="settings.pitch"
            min="0.5"
            max="2"
            step="0.1"
            @change="saveSettings"
            class="slider"
          />
        </div>

        <!-- Test Button -->
        <div class="setting-group">
          <button @click="testVoice" class="test-btn" :disabled="testing">
            {{ testing ? '🔊 Speaking...' : '🔊 Test Voice' }}
          </button>
        </div>
      </div>

      <div class="panel-footer">
        <p class="footer-note">
          💡 Settings are saved locally and synced to your account when logged in
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../services/api'

const { locale } = useI18n()

const props = defineProps({
  token: String
})

const emit = defineEmits(['close'])

const testing = ref(false)

// Settings state
const settings = ref({
  enabled: false,
  volume: 1.0,
  rate: 1.0,
  pitch: 1.0
})

onMounted(() => {
  loadSettings()
})

// Load settings from localStorage and optionally from server
async function loadSettings() {
  // Load from localStorage first
  const enabled = localStorage.getItem('globalReminderEnabled') === 'true'
  const volume = parseFloat(localStorage.getItem('reminderVolume') || '1.0')
  const rate = parseFloat(localStorage.getItem('reminderRate') || '1.0')
  const pitch = parseFloat(localStorage.getItem('reminderPitch') || '1.0')

  settings.value = { enabled, volume, rate, pitch }

  // TODO: Load from server if logged in
  if (props.token) {
    try {
      const response = await api.getReminderSettings()
      if (response.data) {
        const serverSettings = response.data
        // Only use server settings if they're newer
        const localUpdatedAt = localStorage.getItem('reminderSettingsUpdatedAt')
        const serverUpdatedAt = new Date(serverSettings.updatedAt).getTime()

        if (!localUpdatedAt || serverUpdatedAt > parseInt(localUpdatedAt)) {
          settings.value = {
            enabled: serverSettings.enabled,
            volume: serverSettings.volume,
            rate: serverSettings.rate,
            pitch: serverSettings.pitch
          }
          saveToLocalStorage()
        }
      }
    } catch (err) {
      console.error('[ReminderSettings] Failed to load from server:', err)
    }
  }
}

// Save settings to localStorage and optionally to server
async function saveSettings() {
  saveToLocalStorage()

  // TODO: Save to server if logged in
  if (props.token) {
    try {
      await api.saveReminderSettings(settings.value)
      console.log('[ReminderSettings] Saved to server')
    } catch (err) {
      console.error('[ReminderSettings] Failed to save to server:', err)
    }
  }
}

function saveToLocalStorage() {
  localStorage.setItem('globalReminderEnabled', settings.value.enabled.toString())
  localStorage.setItem('reminderVolume', settings.value.volume.toString())
  localStorage.setItem('reminderRate', settings.value.rate.toString())
  localStorage.setItem('reminderPitch', settings.value.pitch.toString())
  localStorage.setItem('reminderSettingsUpdatedAt', Date.now().toString())

  // Dispatch custom event to notify other components
  window.dispatchEvent(new CustomEvent('reminderSettingsChanged'))
}

// Test voice with current settings
function testVoice() {
  if (!window.speechSynthesis) {
    alert('Speech synthesis is not supported in your browser')
    return
  }

  testing.value = true

  // Use current locale for test
  const lang = locale.value === 'zh' ? 'zh-TW' : locale.value === 'ja' ? 'ja-JP' : 'en-US'
  const text = locale.value === 'zh' ? '等級 68，頻道 14' :
               locale.value === 'ja' ? 'レベル 68、チャンネル 14' :
               'Level 68, Channel 14'

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  utterance.rate = settings.value.rate
  utterance.pitch = settings.value.pitch
  utterance.volume = settings.value.volume

  utterance.onend = () => {
    testing.value = false
  }

  utterance.onerror = () => {
    testing.value = false
    alert('Speech synthesis error')
  }

  window.speechSynthesis.speak(utterance)
}
</script>

<style scoped>
.reminder-settings-panel {
  background: #1e1e1e;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #333;
}

.panel-header h2 {
  margin: 0;
  font-size: 20px;
  color: #fff;
}

.close-btn {
  background: transparent;
  border: none;
  color: #aaa;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #333;
  color: #fff;
}

.panel-body {
  padding: 24px;
}

.settings-controls {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #333;
}

.setting-group {
  margin-bottom: 24px;
}

.setting-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  cursor: pointer;
  user-select: none;
}

.setting-label input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #4caf50;
  margin-right: 12px;
}

.setting-title {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.setting-value {
  font-size: 14px;
  color: #4caf50;
  font-weight: 600;
  min-width: 50px;
  text-align: right;
}

.setting-description {
  margin: 0;
  font-size: 13px;
  color: #aaa;
  line-height: 1.5;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #333;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #4caf50;
  cursor: pointer;
  transition: all 0.2s;
}

.slider::-webkit-slider-thumb:hover {
  background: #45a049;
  transform: scale(1.1);
}

.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #4caf50;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.slider::-moz-range-thumb:hover {
  background: #45a049;
  transform: scale(1.1);
}

.test-btn {
  width: 100%;
  padding: 12px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.test-btn:hover:not(:disabled) {
  background: #1976d2;
  transform: translateY(-1px);
}

.test-btn:disabled {
  background: #666;
  cursor: not-allowed;
  opacity: 0.7;
}

.panel-footer {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #333;
}

.footer-note {
  margin: 0;
  font-size: 13px;
  color: #888;
  text-align: center;
  line-height: 1.5;
}
</style>
