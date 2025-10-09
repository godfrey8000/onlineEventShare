<template>
  <header class="bar">
    <div>
      <strong>Tracker Board</strong>
      <span v-if="token" style="color:limegreen">🟢 {{ nickname }}</span>
      <span v-else style="color:orange">🔒 Viewer</span>
    </div>

    <div>
      <template v-if="!token">
        <input v-model="username" placeholder="username" />
        <input v-model="password" type="password" placeholder="password" />
        <button @click="login">Login</button>
      </template>
      <select v-model="$i18n.locale">
        <option value="en">English</option>
        <option value="zh">繁體中文</option>
        <option value="ja">日本語</option>
      </select>
      <button v-if="token" @click="$emit('openProfile')" class="profile-btn">Profile</button>
      <button v-if="token" @click="$emit('logout')">Logout</button>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue';
import { API } from '../services/api';
import UserProfile from './UserProfile.vue';

const showProfile = ref(false);
const props = defineProps(['token', 'nickname', 'openProfile']);
const emit = defineEmits(['login', 'logout']);
const username = ref('');
const password = ref('');

function saveLang(e) {
  localStorage.setItem('lang', e.target.value)
}

async function login() {
  const res = await API.post('/auth/login', { username: username.value, password: password.value });

  // Validate JWT
  const t = res.data?.token;
  if (!t || t.split('.').length < 3) {
    alert('Invalid token from server.');
    return;
  }

  try {
    const payload = JSON.parse(atob(t.split('.')[1]));
    emit('login', { token: t, nickname: payload.nickname || payload.username });
  } catch (err) {
    console.error('Decode failed:', err);
    emit('login', { token: t, nickname: username.value }); // fallback
  }
}

</script>

<style scoped>
.bar {
  display:flex; justify-content:space-between; align-items:center;
  padding:10px 20px; background:#1a1a1a; color:#fff;
}
.bar input { margin-right:5px; background:#222; color:#fff; border:1px solid #444; padding:3px 6px; }
.bar button { margin-left:5px; }
</style>
