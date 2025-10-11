<template>
  <header class="bar">
    <div class="bar-left">
      <strong>Tracker Board</strong>
      <span v-if="token" class="status-badge online">
        🟢 {{ nickname }}
        <span class="role-badge">{{ role }}</span>
      </span>
      <span v-else class="status-badge offline">🔒 Viewer</span>
    </div>

    <div class="bar-right">
      <template v-if="!token">
        <input 
          v-model="username" 
          placeholder="username" 
          @keyup.enter="login"
          :disabled="loading"
        />
        <input 
          v-model="password" 
          type="password" 
          placeholder="password"
          @keyup.enter="login"
          :disabled="loading"
        />
        <button @click="login" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
        <span v-if="error" class="error-msg">{{ error }}</span>
      </template>

      <!-- Language Selector -->
      <select v-model="currentLocale" @change="changeLanguage" class="lang-select">
        <option value="en">English</option>
        <option value="zh">繁體中文</option>
        <option value="ja">日本語</option>
      </select>

      <!-- Logged in actions -->
      <template v-if="token">
        <button @click="$emit('openProfile')" class="profile-btn">
          👤 Profile
        </button>
        <button @click="handleLogout" class="logout-btn">
          Logout
        </button>
      </template>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { api } from '../services/api'

const props = defineProps({
  token: String,
  nickname: String,
  role: String
})

const emit = defineEmits(['login', 'logout', 'openProfile'])

// Login state
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

// Language state
const currentLocale = ref(localStorage.getItem('locale') || 'en')

// ✅ Login function with proper error handling
async function login() {
  if (!username.value || !password.value) {
    error.value = 'Please enter username and password'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const res = await api.login({
      username: username.value,
      password: password.value
    })

    const token = res.data?.token
    const role = res.data?.role

    if (!token || token.split('.').length < 3) {
      throw new Error('Invalid token from server')
    }

    // Decode JWT to get user info
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      
      emit('login', {
        token,
        nickname: payload.nickname || payload.username,
        role: role || payload.role || 'VIEWER'  // ✅ Include role
      })

      // Clear form
      username.value = ''
      password.value = ''
    } catch (decodeErr) {
      console.error('JWT decode failed:', decodeErr)
      // Fallback with minimal info
      emit('login', {
        token,
        nickname: username.value,
        role: role || 'VIEWER'
      })
    }
  } catch (err) {
    console.error('Login failed:', err)
    error.value = err.response?.data?.error || 'Login failed. Please try again.'
  } finally {
    loading.value = false
  }
}

// ✅ Logout with confirmation
function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    emit('logout')
  }
}

// ✅ Language change handler
function changeLanguage(event) {
  const locale = event.target.value
  localStorage.setItem('locale', locale)
  currentLocale.value = locale
  
  // If you have i18n setup, update it
  // if (window.$i18n) {
  //   window.$i18n.locale = locale
  // }
  
  console.log('Language changed to:', locale)
  // TODO: Implement actual i18n switching when ready
}
</script>

<style scoped>
.bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #1a1a1a;
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  position: sticky;
  top: 0;
  z-index: 100;
}

.bar-left,
.bar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar strong {
  font-size: 18px;
  margin-right: 16px;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
}

.status-badge.online {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

.status-badge.offline {
  background: rgba(255, 152, 0, 0.2);
  color: #ff9800;
}

.role-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #333;
  color: #888;
  text-transform: uppercase;
  margin-left: 6px;
}

.bar input {
  background: #2a2a2a;
  color: #fff;
  border: 1px solid #444;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.bar input:focus {
  outline: none;
  border-color: #4caf50;
}

.bar input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.bar button {
  padding: 6px 14px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.bar button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.bar button:not(:disabled):hover {
  transform: translateY(-1px);
}

.bar button:not(:disabled):active {
  transform: translateY(0);
}

/* Login button (primary action) */
.bar-right > button:first-of-type {
  background: #4caf50;
  color: white;
}

.bar-right > button:first-of-type:hover:not(:disabled) {
  background: #45a049;
}

.profile-btn {
  background: #2196f3;
  color: white;
}

.profile-btn:hover {
  background: #1976d2;
}

.logout-btn {
  background: #f44336;
  color: white;
}

.logout-btn:hover {
  background: #d32f2f;
}

.lang-select {
  background: #2a2a2a;
  color: #fff;
  border: 1px solid #444;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.lang-select:focus {
  outline: none;
  border-color: #4caf50;
}

.error-msg {
  color: #f44336;
  font-size: 13px;
  animation: shake 0.3s;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
</style>