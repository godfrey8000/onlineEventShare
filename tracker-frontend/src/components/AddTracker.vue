<template>
  <div class="addBox">
    <button @click="toggle">{{ open ? 'Hide' : '➕ Add Tracker' }}</button>

    <transition name="fade">
      <div v-if="open" class="form">
        <div class="row">
          <label>Episode:</label>
          <button
            v-for="e in episodes"
            :key="e.id"
            :class="{selected: e.id===episodeId}"
            @click="episodeId=e.id;loadMaps()"
          >{{ e.name }}</button>
        </div>
        <div class="row">
          <label>Map:</label>
          <button
            v-for="m in maps"
            :key="m.id"
            :class="{selected: m.id===mapId}"
            @click="mapId=m.id"
          >{{ m.name }}</button>
        </div>
        <div class="row">
          <label>Channel:</label>
          <button
            v-for="ch in 10"
            :key="ch"
            :class="{selected: ch===channelId}"
            @click="channelId=ch"
          >Ch {{ ch }}</button>
        </div>
        <div class="row">
            <label>Status:</label>
            <div class="status-buttons">
                <button
                v-for="s in statuses"
                :key="s.value"
                :class="{ selected: s.value === status }"
                @click="status = s.value"
                >
                {{ s.label }}
                </button>
                <input
                v-model="manual"
                placeholder="manual e.g. 1.5"
                class="manual"
                />
            </div>
        </div>
        <div class="row">
          <button @click="add">Add</button>
          <button @click="clear">Clear</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { API } from '../services/api';

const props = defineProps(['nickname']);
const emit = defineEmits(['added']);

const open = ref(false);
const episodes = ref([]);
const maps = ref([]);
const episodeId = ref(null);
const mapId = ref(null);
const channelId = ref(1);   // Default channel = Ch 1
const status = ref(0);      // Default status = 0 (Off)
const manual = ref('');


const statuses = [
  { value: 0, label: '0 (Off)' },
  { value: 1, label: '1/4' },
  { value: 2, label: '2/4' },
  { value: 3, label: '3/4' },
  { value: 4, label: '4/4' },
  { value: 5, label: 'ON' },
];


function toggle() {
  open.value = !open.value;
  if (open.value) loadEpisodes();
}

async function loadEpisodes() {
  const res = await API.get('/episodes');
  episodes.value = res.data;
  if (res.data.length) {
    episodeId.value = res.data[0].id;
    await loadMaps();
  }
}
async function loadMaps() {
  const res = await API.get(`/episodes/${episodeId.value}/maps`);
  maps.value = res.data;
  mapId.value = res.data[0]?.id || null;
}
async function add() {
  const val = manual.value ? Number(manual.value) : Number(status.value);
  await API.post('/trackers', {
    episodeId: episodeId.value,
    mapId: mapId.value,
    channelId: channelId.value,
    level: maps.value.find(m => m.id===mapId.value)?.name,
    status: val,
    nickname: props.nickname
  });
  emit('added');
  clear();
}
function clear() {
  episodeId.value = episodes.value[0]?.id || null;
  mapId.value = null;
  channelId.value = null;
  status.value = 0;
  manual.value = '';
}
</script>

<style scoped>
.addBox { text-align:center; margin:15px; }
.form { background:#1e1e1e; border:1px solid #333; border-radius:8px; padding:12px; margin-top:10px; }
.row { margin:8px 0; display:flex; flex-wrap:wrap; gap:4px; justify-content:center; }
button.selected { background:#ffd54f; color:#222; }
.fade-enter-active, .fade-leave-active { transition: all .3s ease; }
.fade-enter-from, .fade-leave-to { opacity:0; transform:translateY(-10px); }
</style>
