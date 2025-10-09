<template>
  <select v-model="theme" @change="applyTheme">
    <option value="dark">🌙 Night</option>
    <option value="light">☀️ White</option>
    <option value="grey">🌫 Grey</option>
  </select>
</template>

<script setup>
const theme = ref(localStorage.getItem('theme') || 'dark');
const applyTheme = () => {
  document.documentElement.setAttribute('data-theme', theme.value);
  localStorage.setItem('theme', theme.value);
};
onMounted(applyTheme);
</script>
