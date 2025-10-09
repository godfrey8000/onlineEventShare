<template>
  <div class="manager">
    <h2>{{ t('episodeManager.title') }}</h2>
    <input v-model="newName" :placeholder="t('episodeManager.newEpisode')" />
    <button @click="addEpisode">{{ t('common.add') }}</button>

    <ul>
      <li v-for="ep in episodes" :key="ep.id">
        <input v-model="ep.name" />
        <button @click="updateEpisode(ep)">{{ t('common.save') }}</button>
        <button @click="deleteEpisode(ep.id)">{{ t('common.delete') }}</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { API } from '../services/api'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const episodes = ref([])
const newName = ref('')

async function fetchEpisodes() {
  episodes.value = await API.get('/episodes').then(r => r.data)
}
async function addEpisode() {
  if (!newName.value) return
  await API.post('/episodes', { name: newName.value })
  newName.value = ''
  fetchEpisodes()
}
async function updateEpisode(ep) {
  await API.patch(`/episodes/${ep.id}`, { name: ep.name })
  fetchEpisodes()
}
async function deleteEpisode(id) {
  await API.delete(`/episodes/${id}`)
  fetchEpisodes()
}
onMounted(fetchEpisodes)
</script>
