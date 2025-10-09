<template>
  <div class="card">
    <div class="badges">
      <span>Ep {{ t.episodeId }}</span>
      <span>Map {{ t.mapId }} ({{ t.level }})</span>
      <span>Ch {{ t.channelId }}</span>
    </div>
    <h3>{{ t.user?.nickname || t.user?.username }}</h3>
    <p>Status: {{ t.status.toFixed(1) }}</p>
    <small>created {{ fmtAgo(t.createdAt) }}, updated {{ fmtAgo(t.updatedAt) }}</small>
    <div v-if="editable">
      <input type="number" step="0.1" v-model="newStatus" />
      <button @click="update">Update</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const props = defineProps({ tracker:Object, editable:Boolean });
const emit = defineEmits(['update']);
const t = props.tracker;
const newStatus = ref(t.status);

function fmtAgo(ts) {
  const d = new Date(ts);
  const s = (Date.now()-d)/1000;
  if (s<60) return Math.floor(s)+'s ago';
  if (s<3600) return Math.floor(s/60)+'m ago';
  return Math.floor(s/3600)+'h ago';
}

function update() {
  emit('update', { id:t.id, status:Number(newStatus.value) });
}
</script>

<style scoped>
.card {
  background:#1e1e1e; border:1px solid #333; border-radius:8px;
  padding:12px; width:220px;
}
.badges span {
  background:#333; border-radius:6px; padding:2px 6px; margin-right:4px; font-size:12px;
}
</style>
