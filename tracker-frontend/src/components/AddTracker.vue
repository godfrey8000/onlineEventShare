<template>
  <div class="add-tracker">
    <button class="btn" @click="toggle">
      {{ open ? t('tracker.hide') : t('tracker.addTracker') }}
    </button>

    <transition name="fade">
      <div v-if="open" class="form">
        <!-- Episodes -->
        <div class="section">
          <div class="section-label">{{ t('tracker.episodes') }}</div>
          <div class="btn-group">
            <button
              v-for="e in episodes"
              :key="e.id"
              :class="['btn', { active: selectedEpisodes.has(e.id) }]"
              @click="toggleEpisode(e.id)"
            >
              {{ e.name }}
            </button>
          </div>
        </div>

        <!-- Maps -->
        <div class="section">
          <div class="section-label">{{ t('tracker.maps') }}</div>
          <div class="btn-group">
            <button
              v-for="m in filteredMaps"
              :key="m.id"
              :class="['btn', { active: m.id === mapId }]"
              @click="mapId = m.id"
            >
              {{ mapLabel(m) }}
              <span class="star" @click.stop="toggleFavourite(m)">⭐</span>
            </button>
          </div>
        </div>

        <!-- Channels -->
        <div class="section">
          <div class="section-label">{{ t('tracker.channel') }}</div>
          <div class="btn-group">
            <button
              v-for="ch in 10"
              :key="ch"
              :class="['btn', { active: ch === channelId }]"
              @click="channelId = ch"
            >
              Ch {{ ch }}
            </button>
          </div>
        </div>

        <!-- Status -->
        <div class="section">
          <div class="section-label">{{ t('tracker.status') }}</div>
          <div class="btn-group">
            <button
              v-for="s in statuses"
              :key="s.value"
              :class="['btn', { active: s.value === status }]"
              @click="status = s.value"
            >
              {{ s.label }}
            </button>
            <input
              v-model="manual"
              class="manual"
              :placeholder="t('tracker.manualPlaceholder')"
              @input="onManual"
            />
          </div>
        </div>

        <div class="actions">
          <button class="add-btn" @click="add">{{ t('tracker.add') }}</button>
          <button class="clear-btn" @click="clear">{{ t('tracker.clear') }}</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { API } from '../services/api'
import { useI18n } from 'vue-i18n'

const props = defineProps(['nickname'])
const emit = defineEmits(['added'])
const { t } = useI18n()

const open = ref(false)
const episodes = ref([])
const maps = ref([])
const selectedEpisodes = reactive(new Set())
const mapId = ref(null)
const channelId = ref(1)
const status = ref(0)
const manual = ref('')
const favourites = ref(JSON.parse(localStorage.getItem('favourites') || '[]'))

const statuses = [
  { value: 0, label: '0 (Off)' },
  { value: 1, label: '1/4' },
  { value: 2, label: '2/4' },
  { value: 3, label: '3/4' },
  { value: 4, label: '4/4' },
  { value: 5, label: 'ON' }
]

function toggle() {
  open.value = !open.value
  if (open.value) fetchData()
}

async function fetchData() {
  const [ep, mp] = await Promise.all([API.get('/episodes'), API.get('/maps')])
  episodes.value = ep.data
  maps.value = mp.data
}

function toggleEpisode(id) {
  selectedEpisodes.has(id) ? selectedEpisodes.delete(id) : selectedEpisodes.add(id)
}

const filteredMaps = computed(() =>
  maps.value.filter(m => selectedEpisodes.has(m.episodeId))
)

function toggleFavourite(m) {
  const idx = favourites.value.indexOf(m.id)
  if (idx >= 0) favourites.value.splice(idx, 1)
  else favourites.value.push(m.id)
  localStorage.setItem('favourites', JSON.stringify(favourites.value))
}

function mapLabel(m) {
  const fav = favourites.value.includes(m.id) ? '⭐' : ''
  return `${m.level || ''} ${fav} ${m.name}`
}

function onManual() {
  const n = parseFloat(manual.value)
  if (!isNaN(n)) status.value = n
}

async function add() {
  if (!mapId.value) return alert(t('tracker.selectMap'))
  const val = manual.value ? Number(manual.value) : Number(status.value)
  await API.post('/trackers', {
    episodeId: maps.value.find(m => m.id === mapId.value)?.episodeId,
    mapId: mapId.value,
    channelId: channelId.value,
    status: val,
    nickname: props.nickname
  })
  emit('added')
  clear()
}

function clear() {
  selectedEpisodes.clear()
  mapId.value = null
  channelId.value = 1
  status.value = 0
  manual.value = ''
}
</script>