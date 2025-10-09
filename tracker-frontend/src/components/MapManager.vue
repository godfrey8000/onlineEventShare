<template>
  <div class="manager">
    <h2>{{ t('mapManager.title') }}</h2>

    <select v-model="newMap.episodeId">
      <option v-for="ep in episodes" :key="ep.id" :value="ep.id">{{ ep.name }}</option>
    </select>
    <input v-model="newMap.name" :placeholder="t('mapManager.mapName')" />
    <input v-model.number="newMap.level" type="number" :placeholder="t('mapManager.mapLevel')" />
    <button @click="addMap">{{ t('common.add') }}</button>

    <table>
      <thead>
        <tr>
          <th>{{ t('common.episode') }}</th>
          <th>{{ t('common.name') }}</th>
          <th>{{ t('common.level') }}</th>
          <th>{{ t('common.favorite') }}</th>
          <th>{{ t('common.action') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="m in maps" :key="m.id">
          <td>{{ m.episode.name }}</td>
          <td><input v-model="m.name" /></td>
          <td><input v-model.number="m.level" type="number" /></td>
          <td><input type="checkbox" v-model="m.favourite" /></td>
          <td>
            <button @click="updateMap(m)">{{ t('common.save') }}</button>
            <button @click="deleteMap(m.id)">{{ t('common.delete') }}</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { API } from '../services/api'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const maps = ref([])
const episodes = ref([])
const newMap = ref({ name: '', level: 0, episodeId: null })

async function fetchData() {
  maps.value = await API.get('/maps').then(r => r.data)
  episodes.value = await API.get('/episodes').then(r => r.data)
}
async function addMap() {
  await API.post('/maps', newMap.value)
  newMap.value = { name: '', level: 0, episodeId: null }
  fetchData()
}
async function updateMap(m) {
  await API.patch(`/maps/${m.id}`, { name: m.name, level: m.level, favourite: m.favourite })
  fetchData()
}
async function deleteMap(id) {
  await API.delete(`/maps/${id}`)
  fetchData()
}
onMounted(fetchData)
</script>
