<template>
  <div class="episode-select">
    <label>Episodes:</label>
    <div class="multi-select">
      <button
        v-for="ep in episodes"
        :key="ep.id"
        :class="{ selected: selectedEpisodes.includes(ep.id) }"
        @click="toggleEpisode(ep.id)"
      >
        {{ ep.name }}
      </button>
    </div>
  </div>

  <div class="map-select">
    <label>Map:</label>
    <button
      v-for="m in filteredMaps"
      :key="m.id"
      @click="selectMap(m.id)"
    >
      {{ m.level }}★ - {{ m.name }}
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'   // ✅ required imports
import { API } from '../services/api'           // ✅ assuming you use axios API helper

// Reactive state
const episodes = ref([])         // from API
const maps = ref([])             // from API
const selectedEpisodes = ref([])

// Toggle selection of episode
const toggleEpisode = (id) => {
  if (selectedEpisodes.value.includes(id)) {
    selectedEpisodes.value = selectedEpisodes.value.filter(e => e !== id)
  } else {
    selectedEpisodes.value.push(id)
  }
}

// Filter maps by selected episodes
const filteredMaps = computed(() =>
  maps.value.filter(m => selectedEpisodes.value.includes(m.episodeId))
)

// Fetch data from backend API
async function fetchEpisodesAndMaps() {
  try {
    const [epRes, mapRes] = await Promise.all([
      API.get('/episodes'),
      API.get('/maps')
    ])
    episodes.value = epRes.data
    maps.value = mapRes.data
  } catch (err) {
    console.error('Failed to load episodes/maps:', err)
  }
}

// Load on mount
onMounted(fetchEpisodesAndMaps)
</script>
