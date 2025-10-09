<template>
  <div class="profile" v-if="token">
    <h2>User Profile</h2>
    <label>Nickname:</label>
    <input v-model="newNickname" placeholder="new nickname" />
    <label>Password:</label>
    <input v-model="newPassword" type="password" placeholder="new password" />
    <div class="actions">
      <button @click="updateProfile">Save</button>
    </div>
    <p v-if="message" style="opacity:.8;">{{ message }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { API } from '../services/api';

const props = defineProps(['token', 'nickname']);
const emit = defineEmits(['updated']);

const newNickname = ref(props.nickname);
const newPassword = ref('');
const message = ref('');

async function updateProfile() {
  try {
    const res = await API.patch('/auth/profile', {
      nickname: newNickname.value,
      password: newPassword.value || undefined
    });
    message.value = '✅ Profile updated!';
    emit('updated', newNickname.value);
  } catch (e) {
    message.value = '❌ Update failed: ' + e.message;
  }
}
</script>

<style scoped>
.profile { max-width:400px; margin:40px auto; background:#1e1e1e; padding:20px; border-radius:8px; }
.profile input { display:block; margin-bottom:10px; width:100%; background:#222; color:#fff; border:1px solid #444; padding:6px; }
.actions { text-align:right; }
</style>
