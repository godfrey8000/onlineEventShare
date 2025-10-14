<template>
  <div class="add-tracker">
    <button class="toggle-btn" @click="toggle">
      {{ open ? '✕ ' + t('tracker.hide') : '➕ ' + t('tracker.addTracker') }}
    </button>

    <transition name="slide-down">
      <div v-if="open" class="form">
        <!-- Loading state -->
        <div v-if="loading" class="loading">{{ t('common.loading') }}</div>
        
        <!-- Error message -->
        <div v-if="error" class="error-banner">{{ error }}</div>

        <!-- Episodes -->
        <div class="section">
          <div class="section-label">📺 {{ t('tracker.episode') }}</div>
          <div class="btn-group">
            <button
              v-for="e in episodes"
              :key="e.id"
              :class="['btn', { active: selectedEpisodes.has(e.episodeId) }]"
              @click="toggleEpisode(e.episodeId)"
            >
              EP{{ e.episodeId }} - {{ e.name }}
            </button>
          </div>
        </div>

        <!-- Maps -->
        <div class="section">
          <div class="section-label">
            🗺️ {{ t('tracker.map') }}
            <span v-if="selectedEpisodes.size > 0 && filteredMaps.length > 0" class="count">
              ({{ filteredMaps.length }})
            </span>
          </div>

          <!-- Favorites (always shown) -->
          <div v-if="favoriteMaps.length > 0" class="map-section">
            <div class="subsection-label">⭐ {{ t('tracker.favorites') }}</div>
            <div class="btn-group">
              <button
                v-for="m in favoriteMaps"
                :key="m.id"
                :class="['btn map-btn', { active: m.id === mapId }]"
                @click="selectMap(m)"
              >
                <span class="map-info">
                  <span class="map-level">Lv{{ m.level }}</span>
                  {{ m.name }}
                </span>
                <span class="star" @click.stop="toggleFavorite(m.id)">⭐</span>
              </button>
            </div>
          </div>

          <!-- All filtered maps (only shown when episodes selected) -->
          <div v-if="selectedEpisodes.size > 0" class="map-section">
            <div v-if="filteredMaps.length > 0">
              <div class="subsection-label">
                {{ favoriteMaps.length > 0 ? t('tracker.otherMaps') : t('tracker.allMaps') }}
              </div>
              <div class="btn-group">
                <button
                  v-for="m in filteredMaps.filter(m => !isFavorite(m.id))"
                  :key="m.id"
                  :class="['btn map-btn', { active: m.id === mapId }]"
                  @click="selectMap(m)"
                >
                  <span class="map-info">
                    <span class="map-level">Lv{{ m.level }}</span>
                    {{ m.name }}
                  </span>
                  <span
                    class="star"
                    @click.stop="toggleFavorite(m.id)"
                  >
                    ☆
                  </span>
                </button>
              </div>
            </div>
            <div v-else class="empty-state">
              {{ t('tracker.noMapsFound') }}
            </div>
          </div>

          <!-- Show hint when no episode selected and no favorites -->
          <div v-if="selectedEpisodes.size === 0 && favoriteMaps.length === 0" class="empty-state">
            {{ t('tracker.selectEpisode') }}
          </div>
        </div>

        <!-- Channels -->
        <div class="section">
          <div class="section-label">📡 {{ t('tracker.channel') }}</div>
          <div class="btn-group">
            <button
              v-for="ch in 10"
              :key="ch"
              :class="['btn channel-btn', { active: ch === channelId }]"
              @click="channelId = ch"
            >
              Ch{{ ch }}
            </button>
          </div>
        </div>

        <!-- Status -->
        <div class="section">
          <div class="section-label">📊 {{ t('tracker.progressStatus') }}</div>
          <div class="btn-group">
            <button
              v-for="s in statuses"
              :key="s.value"
              :class="['btn status-btn', { active: s.value === status }]"
              @click="selectStatus(s.value)"
            >
              {{ s.label }}
            </button>
          </div>
          
          <!-- Manual input -->
          <div class="manual-input">
            <label>{{ t('tracker.manualInput') }}</label>
            <input
              v-model="manualStatus"
              type="number"
              min="0"
              max="5"
              step="0.1"
              :placeholder="t('tracker.manualPlaceholder')"
              @input="onManualInput"
            />
          </div>
        </div>

        <!-- Selected map info -->
        <div v-if="selectedMap" class="selected-info">
          <strong>{{ t('tracker.selected') }}</strong> 
          EP{{ selectedMap.episodeNumber }} - 
          Lv{{ selectedMap.level }} {{ selectedMap.name }} - 
          Ch{{ channelId }} - 
          Status: {{ displayStatus }}
        </div>

        <!-- Actions -->
        <div class="actions">
          <button
            class="add-btn"
            @click="add"
            :disabled="!canAdd || submitting"
          >
            {{ submitting ? t('tracker.adding') : '✓ ' + t('tracker.add') }}
          </button>
          <button class="clear-btn" @click="clear">
            ✕ {{ t('tracker.clear') }}
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../services/api'

const { t } = useI18n()

const props = defineProps({
  nickname: String
})

const emit = defineEmits(['added'])

// UI state
const open = ref(false)
const loading = ref(false)
const submitting = ref(false)
const error = ref('')

// Data
const episodes = ref([])
const maps = ref([])
const userFavorites = ref([])

// Form state
const selectedEpisodes = ref(new Set())
const mapId = ref(null)
const channelId = ref(1)
const status = ref(0)
const manualStatus = ref('')

// Status options
const statuses = [
  { value: 0, label: '0 (Off)' },
  { value: 1, label: '1/4' },
  { value: 2, label: '2/4' },
  { value: 3, label: '3/4' },
  { value: 4, label: '4/4' },
  { value: 5, label: 'ON' }
]

// ✅ Computed properties
const filteredMaps = computed(() => {
  if (selectedEpisodes.value.size === 0) return []
  return maps.value
    .filter(m => selectedEpisodes.value.has(m.episodeNumber))
    .sort((a, b) => {
      // Favorites first, then by level
      const aFav = isFavorite(a.id)
      const bFav = isFavorite(b.id)
      if (aFav && !bFav) return -1
      if (!aFav && bFav) return 1
      return a.level - b.level
    })
})

const favoriteMaps = computed(() => {
  // Show favorites even when no episode is selected
  return maps.value.filter(m => isFavorite(m.id)).sort((a, b) => a.level - b.level)
})

const selectedMap = computed(() => {
  return maps.value.find(m => m.id === mapId.value) || null
})

const displayStatus = computed(() => {
  const val = manualStatus.value ? Number(manualStatus.value) : status.value
  return val
})

const canAdd = computed(() => {
  return mapId.value && channelId.value
})

// ✅ Toggle form
function toggle() {
  open.value = !open.value
  if (open.value && episodes.value.length === 0) {
    fetchData()
  }
}

// ✅ Fetch episodes, maps, and user favorites
async function fetchData() {
  loading.value = true
  error.value = ''
  
  try {
    const [episodesRes, mapsRes, favoritesRes] = await Promise.all([
      api.getEpisodes(),
      api.getMaps(),
      api.getFavoriteMaps().catch(() => ({ data: [] })) // Fallback if not logged in
    ])
    
    episodes.value = episodesRes.data
    maps.value = mapsRes.data
    userFavorites.value = favoritesRes.data.map(m => m.id)
    
    console.log('Loaded:', {
      episodes: episodes.value.length,
      maps: maps.value.length,
      favorites: userFavorites.value.length
    })
  } catch (err) {
    console.error('Failed to load data:', err)
    error.value = t('tracker.failedToLoad')
  } finally {
    loading.value = false
  }
}

// ✅ Episode selection
function toggleEpisode(episodeNumber) {
  if (selectedEpisodes.value.has(episodeNumber)) {
    selectedEpisodes.value.delete(episodeNumber)
  } else {
    selectedEpisodes.value.add(episodeNumber)
  }
  
  // Clear map selection if no longer in filtered maps
  if (mapId.value && !filteredMaps.value.find(m => m.id === mapId.value)) {
    mapId.value = null
  }
}

// ✅ Map selection
function selectMap(map) {
  mapId.value = map.id
}

// ✅ Favorite management
function isFavorite(mapId) {
  return userFavorites.value.includes(mapId)
}

async function toggleFavorite(mapIdToToggle) {
  try {
    if (isFavorite(mapIdToToggle)) {
      await api.removeFavorite(mapIdToToggle)
      userFavorites.value = userFavorites.value.filter(id => id !== mapIdToToggle)
    } else {
      await api.addFavorite(mapIdToToggle)
      userFavorites.value.push(mapIdToToggle)
    }
  } catch (err) {
    console.error('Failed to toggle favorite:', err)
    error.value = 'Failed to update favorite'
    setTimeout(() => error.value = '', 3000)
  }
}

// ✅ Status selection
function selectStatus(value) {
  status.value = value
  manualStatus.value = '' // Clear manual input
}

function onManualInput() {
  let val = parseFloat(manualStatus.value)
  if (!isNaN(val)) {
    // Clamp to 0-5 range
    val = Math.max(0, Math.min(5, val))
    manualStatus.value = val.toString()
    status.value = val
  }
}

// ✅ Add tracker
async function add() {
  if (!canAdd.value) return
  
  const map = selectedMap.value
  if (!map) {
    error.value = t('tracker.selectMap')
    return
  }
  
  const statusValue = manualStatus.value 
    ? parseFloat(manualStatus.value) 
    : status.value
  
  // Validate status range
  if (statusValue < 0 || statusValue > 5) {
    error.value = 'Status must be between 0 and 5'
    return
  }
  
  submitting.value = true
  error.value = ''
  
  try {
    await api.createTracker({
      episodeNumber: map.episodeNumber,  // ✅ Fixed field name
      mapId: map.id,
      channelId: channelId.value,
      level: map.level,  // ✅ Include level
      status: statusValue,
      nickname: props.nickname
    })
    
    emit('added')
    clear()
    console.log('Tracker added successfully')
  } catch (err) {
    console.error('Failed to add tracker:', err)
    error.value = err.response?.data?.error || 'Failed to add tracker'
  } finally {
    submitting.value = false
  }
}

// ✅ Clear form
function clear() {
  selectedEpisodes.value.clear()
  mapId.value = null
  channelId.value = 1
  status.value = 0
  manualStatus.value = ''
  error.value = ''
}

// ✅ Load data on mount if form is open
onMounted(() => {
  if (open.value) {
    fetchData()
  }
})
</script>

<style scoped>
.add-tracker {
  margin: 0 20px 20px 20px;
  background: #1e1e1e;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  max-width: calc(100vw - 40px);
}

.toggle-btn {
  width: 100%;
  padding: 14px;
  background: #2a2a2a;
  color: #fff;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.toggle-btn:hover {
  background: #333;
}

.form {
  padding: 20px;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #888;
}

.error-banner {
  background: #f44336;
  color: white;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.section {
  margin-bottom: 24px;
}

.section-label {
  font-size: 14px;
  font-weight: 600;
  color: #aaa;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.count {
  font-size: 12px;
  color: #666;
}

.subsection-label {
  font-size: 12px;
  color: #888;
  margin: 12px 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.map-section {
  margin-bottom: 12px;
}

.btn-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.btn {
  padding: 8px 14px;
  background: #2a2a2a;
  color: #ccc;
  border: 1px solid #444;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn:hover {
  background: #333;
  border-color: #555;
}

.btn.active {
  background: #4caf50;
  color: white;
  border-color: #4caf50;
}

.map-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 200px;
}

.map-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.map-level {
  background: #333;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.star {
  cursor: pointer;
  font-size: 16px;
  transition: transform 0.2s;
}

.star:hover {
  transform: scale(1.2);
}

.star.filled {
  filter: drop-shadow(0 0 3px gold);
}

.channel-btn {
  min-width: 60px;
}

.status-btn {
  min-width: 80px;
}

.manual-input {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.manual-input label {
  font-size: 13px;
  color: #888;
}

.manual-input input {
  width: 100px;
  padding: 6px 10px;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
}

.manual-input input:focus {
  outline: none;
  border-color: #4caf50;
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: #666;
  font-style: italic;
}

.selected-info {
  background: #2a2a2a;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #ccc;
}

.actions {
  display: flex;
  gap: 12px;
}

.add-btn,
.clear-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn {
  background: #4caf50;
  color: white;
}

.add-btn:hover:not(:disabled) {
  background: #45a049;
}

.add-btn:disabled {
  background: #333;
  color: #666;
  cursor: not-allowed;
}

.clear-btn {
  background: #f44336;
  color: white;
}

.clear-btn:hover {
  background: #d32f2f;
}

/* Transitions */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>