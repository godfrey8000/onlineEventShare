<template>
  <div class="tracker-board">
    <!-- Filters & Controls -->
    <div class="controls">
      <div class="filter-section">
        <!-- Episode Filter -->
        <div class="filter-group">
          <label>📺 Episodes:</label>
          <div class="button-group">
            <button
              v-for="ep in episodes"
              :key="ep.id"
              :class="{ active: selectedEpisodes.has(ep.episodeId) }"
              @click="toggleEpisode(ep.episodeId)"
            >
              EP{{ ep.episodeId }}
            </button>
            <button 
              v-if="selectedEpisodes.size > 0"
              class="clear-btn"
              @click="selectedEpisodes.clear()"
            >
              Clear
            </button>
          </div>
        </div>

        <!-- Map Filter -->
        <div class="filter-group">
          <label>🗺️ Maps:</label>
          <div class="button-group">
            <button
              v-for="m in availableMaps"
              :key="m.id"
              :class="{ active: selectedMaps.has(m.id) }"
              @click="toggleMap(m.id)"
            >
              Lv{{ m.level }} - {{ m.name }}
            </button>
            <button 
              v-if="selectedMaps.size > 0"
              class="clear-btn"
              @click="selectedMaps.clear()"
            >
              Clear
            </button>
          </div>
        </div>

        <!-- Nickname Filter -->
        <div class="filter-group">
          <label>👤 Nickname:</label>
          <input
            v-model="nicknameFilter"
            type="text"
            placeholder="Filter by nickname..."
            class="nickname-input"
          />
        </div>
      </div>

      <!-- Sorting -->
      <div class="sort-section">
        <label>🔀 Sort by:</label>
        <select v-model="sortBy" class="sort-select">
          <option value="status">Status</option>
          <option value="level">Level</option>
          <option value="nickname">Nickname</option>
          <option value="updatedAt">Last Updated</option>
          <option value="createdAt">Created</option>
        </select>
        <button @click="toggleSortOrder" class="order-btn">
          {{ sortOrder === 'asc' ? '↑' : '↓' }}
        </button>
      </div>

      <!-- View Toggle -->
      <div class="view-toggle">
        <button
          :class="{ active: viewMode === 'box' }"
          @click="viewMode = 'box'"
        >
          📦 Box View
        </button>
        <button
          :class="{ active: viewMode === 'simple' }"
          @click="viewMode = 'simple'"
        >
          📋 Simple View
        </button>
      </div>

      <!-- Delete Mode Toggle -->
      <div v-if="canDelete" class="delete-toggle">
        <button
          :class="{ active: deleteMode }"
          @click="deleteMode = !deleteMode"
        >
          {{ deleteMode ? '✓ Done' : '🗑️ Delete Mode' }}
        </button>
      </div>
    </div>

    <!-- Tracker Count -->
    <div class="tracker-info">
      Showing {{ filteredTrackers.length }} of {{ trackers.length }} trackers
    </div>

    <!-- Trackers Display -->
    <div :class="['trackers-container', viewMode]">
      <div
        v-for="tracker in sortedTrackers"
        :key="tracker.id"
        :class="['tracker-card', viewMode]"
      >
        <!-- Box View -->
        <template v-if="viewMode === 'box'">
          <div class="tracker-header">
            <div class="tracker-nickname">{{ tracker.nickname }}</div>
            <div class="tracker-meta">
              Lv{{ tracker.level }} - {{ getMapName(tracker.mapId) }}
            </div>
          </div>

          <div class="tracker-body">
            <div class="tracker-channel">Ch{{ tracker.channelId }}</div>
            
            <!-- Progress Circle -->
              <div class="progress-circle">
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <!-- Background circle (always gray) -->
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    fill="none"
                    stroke="#333"
                    stroke-width="8"
                  />
                  
                  <!-- Outline circle (colored, for whole numbers) -->
                  <circle
                    v-if="Number(tracker.status) % 1 === 0 && Number(tracker.status) < 5"
                    cx="40"
                    cy="40"
                    r="35"
                    fill="none"
                    :stroke="getProgressColor(tracker.status)"
                    stroke-width="8"
                    opacity="1"
                  />
                  
                  <!-- Progress arc (colored fill, for decimals only) -->
                  <circle
                    v-else
                    cx="40"
                    cy="40"
                    r="35"
                    fill="none"
                    :stroke="getProgressColor(tracker.status)"
                    stroke-width="8"
                    :stroke-dasharray="getProgressDash(tracker.status)"
                    stroke-linecap="round"
                    transform="rotate(-90 40 40)"
                  />
                  
                  <!-- Status text -->
                  <text x="40" y="45" text-anchor="middle" :class="['status-text', { 'status-on': Number(tracker.status) === 5 }]">
                    {{ getStatusText(tracker.status) }}
                  </text>
                </svg>
              </div>

            <!-- Inline Status Editor -->
            <div class="status-editor">
              <input
                v-model.number="tracker.status"
                type="number"
                min="0"
                max="5"
                step="0.1"
                @change="updateStatus(tracker)"
                :disabled="!canEdit"
              />
            </div>

            <!-- Timestamps -->
            <div class="tracker-timestamps">
              <div class="timestamp-row">
                <span class="timestamp-label">🕒 Updated:</span>
                <span class="timestamp-value" :title="formatFullTime(tracker.updatedAt)">
                  {{ getTimeAgo(tracker.updatedAt) }}
                </span>
              </div>
              <div class="timestamp-row">
                <span class="timestamp-label">📅 Created:</span>
                <span class="timestamp-value" :title="formatFullTime(tracker.createdAt)">
                  {{ getTimeAgo(tracker.createdAt) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Delete Button -->
          <button
            v-if="deleteMode && canDelete"
            class="delete-btn"
            @click="confirmDelete(tracker)"
          >
            ✕
          </button>
        </template>

        <!-- Simple View -->
        <template v-else>
          <div class="simple-compact">
            <span class="simple-nickname" :title="tracker.nickname">
              {{ tracker.nickname || 'Unknown' }}
            </span>
            
            <span class="simple-map" :title="getMapName(tracker.mapId)">
              Lv{{ tracker.level }} {{ getMapNameShort(tracker.mapId, 3) }}
            </span>
            
            <span class="simple-channel">Ch{{ tracker.channelId }}</span>
            
            <!-- Status Circle with partial fill -->
            <span class="simple-status-circle" :style="getSimpleCircleStyle(tracker.status)">
              {{ getStatusText(tracker.status) }}
            </span>

            <!-- ✅ Status Input (inline edit) -->
            <input
              v-if="canEdit"
              v-model.number="tracker.status"
              type="number"
              min="0"
              max="5"
              step="0.1"
              class="simple-status-input"
              @keyup.enter="updateStatus(tracker)"
              @blur="updateStatus(tracker)"
              :title="'Press Enter or click away to save'"
            />

            <span class="simple-time" :title="`Created: ${formatFullTime(tracker.createdAt)}\nUpdated: ${formatFullTime(tracker.updatedAt)}`">
              <span class="time-icon">🕒</span>
              {{ getTimeAgo(tracker.updatedAt) }}
            </span>

            <button
              v-if="deleteMode && canDelete"
              class="delete-btn-simple"
              @click="confirmDelete(tracker)"
            >
              ✕
            </button>
          </div>
        </template>
      </div>

      <!-- Empty State -->
      <div v-if="sortedTrackers.length === 0" class="empty-state">
        <p v-if="trackers.length === 0">No trackers yet. Add one to get started!</p>
        <p v-else>No trackers match the current filters.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { api } from '../services/api'

const props = defineProps({
  trackers: {
    type: Array,
    default: () => []
  },
  token: String,
  role: String
})

const emit = defineEmits(['update', 'delete'])

// Data
const episodes = ref([])
const maps = ref([])

// Filters
const selectedEpisodes = ref(new Set())
const selectedMaps = ref(new Set())
const nicknameFilter = ref('')

// Sorting
const sortBy = ref('status')
const sortOrder = ref('desc')

// View
const viewMode = ref('box')
const deleteMode = ref(false)

// Permissions
const canEdit = computed(() => ['EDITOR', 'ADMIN'].includes(props.role))
const canDelete = computed(() => ['ADMIN'].includes(props.role))

// ✅ Load episodes and maps
async function fetchData() {
  try {
    const [episodesRes, mapsRes] = await Promise.all([
      api.getEpisodes(),
      api.getMaps()
    ])
    episodes.value = episodesRes.data
    maps.value = mapsRes.data
  } catch (err) {
    console.error('Failed to load filter data:', err)
  }
}

// ✅ Filter helpers
function toggleEpisode(episodeId) {
  if (selectedEpisodes.value.has(episodeId)) {
    selectedEpisodes.value.delete(episodeId)
  } else {
    selectedEpisodes.value.add(episodeId)
  }
}

function toggleMap(mapId) {
  if (selectedMaps.value.has(mapId)) {
    selectedMaps.value.delete(mapId)
  } else {
    selectedMaps.value.add(mapId)
  }
}

function toggleSortOrder() {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

// ✅ Available maps based on selected episodes
const availableMaps = computed(() => {
  if (selectedEpisodes.value.size === 0) return maps.value
  return maps.value.filter(m => selectedEpisodes.value.has(m.episodeNumber))
})

// ✅ Filtered trackers
const filteredTrackers = computed(() => {
  let result = props.trackers

  // Filter by episodes
  if (selectedEpisodes.value.size > 0) {
    result = result.filter(t => selectedEpisodes.value.has(t.episodeNumber))
  }

  // Filter by maps
  if (selectedMaps.value.size > 0) {
    result = result.filter(t => selectedMaps.value.has(t.mapId))
  }

  // Filter by nickname
  if (nicknameFilter.value) {
    const search = nicknameFilter.value.toLowerCase()
    result = result.filter(t => 
      t.nickname?.toLowerCase().includes(search)
    )
  }

  return result
})
// ✅ Auto-select EP10 & EP11 when episodes load
watch(episodes, (newEpisodes) => {
  if (newEpisodes.length > 0 && selectedEpisodes.value.size === 0) {
    console.log('Auto-selecting EP10 & EP11')
    selectedEpisodes.value = new Set([10, 11])
  }
}, { immediate: true })



// ✅ Sorted trackers
const sortedTrackers = computed(() => {
  const sorted = [...filteredTrackers.value]
  
  sorted.sort((a, b) => {
    let aVal, bVal
    
    switch (sortBy.value) {
      case 'status':
        aVal = Number(a.status)
        bVal = Number(b.status)
        break
      case 'level':
        aVal = a.level || 0
        bVal = b.level || 0
        break
      case 'nickname':
        aVal = a.nickname || ''
        bVal = b.nickname || ''
        return sortOrder.value === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      case 'updatedAt':
        aVal = new Date(a.updatedAt)
        bVal = new Date(b.updatedAt)
        break
      case 'createdAt':
        aVal = new Date(a.createdAt)
        bVal = new Date(b.createdAt)
        break
      default:
        return 0
    }
    
    return sortOrder.value === 'asc' ? aVal - bVal : bVal - aVal
  })
  
  return sorted
})

// ✅ Helper functions
function getMapName(mapId) {
  return maps.value.find(m => m.id === mapId)?.name || 'Unknown'
}

function getMapNameShort(mapId, length = 3) {
  const name = getMapName(mapId)
  if (name.length <= length) return name
  return name.substring(0, length)
}

// ✅ Helper: Status circle class
function getStatusClass(status) {
  const num = Number(status)
  if (num === 0) return 'status-0'
  if (num < 2) return 'status-low'
  if (num < 4) return 'status-mid'
  if (num < 5) return 'status-high'
  return 'status-complete'
}

// ✅ Get status text (show "ON" for status 5)
function getStatusText(status) {
  const num = Number(status)
  if (num === 5) return 'ON'
  return formatStatus(status)
}

// ✅ Get progress color based on status
function getProgressColor(status) {
  const num = Number(status)
  if (num === 5) return '#FFD700' // Gold for ON
  if (num >= 4) return '#4caf50'  // Green for 4+
  if (num >= 2) return '#ff9800'  // Orange for 2+
  if (num > 0) return '#f44336'   // Red for started
  return '#666'                   // Dark gray for 0
}

// ✅ Get progress dash - FIXED to show decimal properly
function getProgressDash(status) {
  const num = Number(status)
  const circumference = 2 * Math.PI * 35
  
  // For whole numbers (0.0, 1.0, 2.0, 3.0, 4.0), no fill
  if (num % 1 === 0 && num < 5) {
    return `0 ${circumference}`
  }
  
  // For status 5 (ON), full circle
  if (num === 5) {
    return `${circumference} 0`
  }
  
  // For decimals, show only the decimal portion
  // e.g., 4.5 = 50% of one segment, 2.3 = 30% of one segment
  const decimal = num - Math.floor(num)
  const progress = decimal * circumference // Each segment is 1/5 of circle
  
  return `${progress} ${circumference}`
}

// ✅ Get simple circle style - FIXED for better contrast
function getSimpleCircleStyle(status) {
  const num = Number(status)
  const baseLevel = Math.floor(num)
  const decimal = num - baseLevel
  
  let color
  if (num === 5) {
    color = '#FFD700' // Gold
  } else if (num >= 4) {
    color = '#4caf50' // Green
  } else if (num >= 2) {
    color = '#ff9800' // Orange
  } else if (num > 0) {
    color = '#f44336' // Red
  } else {
    color = '#666' // Gray
  }
  
  // For whole numbers (0.0, 1.0, 2.0, etc.), colored border but dark background
  if (decimal === 0 && num < 5) {
    return {
      background: '#1a1a1a',
      borderColor: color,
      color: color, // Text same color as border
      fontWeight: '600'
    }
  }
  
  // For status 5 (ON), full gold with dark text
  if (num === 5) {
    return {
      background: color,
      borderColor: color,
      color: '#000', // Black text on gold background
      fontWeight: '700',
      boxShadow: `0 0 10px ${color}aa`
    }
  }
  
  // For decimals, show partial fill with gradient
  const percentage = decimal * 100
  return {
    background: `conic-gradient(${color} 0% ${percentage}%, #1a1a1a ${percentage}% 100%)`,
    borderColor: color,
    color: '#fff', // ✅ White text for contrast
    fontWeight: '600',
    textShadow: '0 0 3px #000' // ✅ Text shadow for better readability
  }
}


// ✅ Helper: Time ago
function getTimeAgo(timestamp) {
  const now = Date.now()
  const diff = now - new Date(timestamp).getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (seconds < 60) return `${seconds}s`
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  return `${days}d`
}

// ✅ Helper: Format full time for tooltip
function formatFullTime(timestamp) {
  return new Date(timestamp).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function formatStatus(status) {
  const num = Number(status)
  return num % 1 === 0 ? num.toString() : num.toFixed(1)
}


// ✅ Actions
async function updateStatus(tracker) {
  if (!canEdit.value) return
  
  try {
    // ✅ Validate status range
    const status = Number(tracker.status)
    if (status < 0 || status > 5) {
      alert('Status must be between 0 and 5')
      return
    }

    // ✅ Update via API
    const response = await api.updateTracker(tracker.id, {
      status: status
    })

    console.log('[TrackerBoard] Status updated:', response.data)
    
    // ✅ Emit to parent to update the tracker list
    emit('update', response.data || tracker)
    
  } catch (err) {
    console.error('Failed to update tracker:', err)
    alert('Failed to update status: ' + (err.response?.data?.error || err.message))
  }
}

function confirmDelete(tracker) {
  if (confirm(`Delete tracker for ${tracker.nickname}?`)) {
    deleteTracker(tracker)
  }
}

async function deleteTracker(tracker) {
  try {
    await api.deleteTracker(tracker.id)
    emit('delete', tracker.id)
  } catch (err) {
    console.error('Failed to delete tracker:', err)
    alert('Failed to delete tracker')
  }
}

// ✅ Load data on mount
onMounted(fetchData)
</script>

<style scoped>
.tracker-board {
  padding: 20px;
}

.controls {
  background: #1e1e1e;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.filter-section {
  margin-bottom: 20px;
}

.filter-group {
  margin-bottom: 16px;
}

.filter-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #aaa;
  margin-bottom: 8px;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.button-group button {
  padding: 6px 12px;
  background: #2a2a2a;
  color: #ccc;
  border: 1px solid #444;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.button-group button:hover {
  background: #333;
}

.button-group button.active {
  background: #4caf50;
  color: white;
  border-color: #4caf50;
}

.clear-btn {
  background: #f44336 !important;
  color: white !important;
}

.nickname-input {
  width: 100%;
  max-width: 300px;
  padding: 8px 12px;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
}

.nickname-input:focus {
  outline: none;
  border-color: #4caf50;
}

.sort-section,
.view-toggle,
.delete-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.sort-select {
  padding: 6px 12px;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
}

.order-btn {
  padding: 6px 12px;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  font-size: 16px;
}

.tracker-info {
  padding: 10px;
  background: #2a2a2a;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #aaa;
}

.trackers-container {
  display: grid;
  gap: 16px;
}

.trackers-container.box {
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
}

.trackers-container.simple {
  grid-template-columns: 1fr;
}

.tracker-card {
  background: #2a2a2a;
  border-radius: 8px;
  padding: 16px;
  position: relative;
  transition: transform 0.2s;
}

.tracker-card:hover {
  transform: translateY(-2px);
}

.tracker-card.box {
  text-align: center;
}

.tracker-header {
  margin-bottom: 12px;
}

.tracker-nickname {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
}

.tracker-meta {
  font-size: 13px;
  color: #888;
}

.tracker-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.tracker-channel {
  font-size: 14px;
  padding: 4px 10px;
  background: #333;
  border-radius: 4px;
  color: #aaa;
}

.progress-circle {
  margin: 8px 0;
}

.status-text {
  font-size: 20px;
  font-weight: 600;
  fill: #fff;
}

.status-editor input {
  width: 80px;
  padding: 6px;
  background: #333;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  text-align: center;
  font-size: 14px;
}

.status-editor input:focus {
  outline: none;
  border-color: #4caf50;
}

.delete-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Simple View */
.tracker-card.simple {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
}

.simple-content {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
}

.simple-nickname {
  font-weight: 600;
  min-width: 100px;
}

.simple-level,
.simple-channel,
.simple-status {
  padding: 4px 8px;
  background: #333;
  border-radius: 4px;
}

.delete-btn-simple {
  width: 32px;
  height: 32px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 18px;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 16px;
}

/* ✅ Compact Simple View Styles */
.trackers-container.simple {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}

.tracker-card.simple {
  padding: 8px 10px;
  background: #2a2a2a;
  border-radius: 6px;
  transition: all 0.2s;
  border: 1px solid #333;
}

.tracker-card.simple:hover {
  background: #333;
  border-color: #444;
  transform: translateY(-1px);
}

.simple-compact {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  position: relative;
}

.simple-nickname {
  font-weight: 600;
  color: #fff;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.simple-map {
  color: #aaa;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.simple-channel {
  display: inline-block;
  padding: 2px 6px;
  background: #3a3a3a;
  border-radius: 3px;
  font-size: 11px;
  color: #888;
  width: fit-content;
}

.simple-status-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-weight: 600;
  font-size: 13px;
  margin: 4px 0;
  border: 2px solid;
}

.simple-status-circle.status-0 {
  background: #1a1a1a;
  border-color: #333;
  color: #666;
}

.simple-status-circle.status-low {
  background: #2d1a1a;
  border-color: #f44336;
  color: #f44336;
}

.simple-status-circle.status-mid {
  background: #2d2a1a;
  border-color: #ff9800;
  color: #ff9800;
}

.simple-status-circle.status-high {
  background: #1a2d1a;
  border-color: #4caf50;
  color: #4caf50;
}

.simple-status-circle.status-complete {
  background: #1a2d1a;
  border-color: #4caf50;
  color: #4caf50;
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.5);
}

.simple-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #666;
  cursor: help;
}

.time-icon {
  font-size: 10px;
}

.delete-btn-simple {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.delete-btn-simple:hover {
  opacity: 1;
}

/* Box View - Keep existing styles */
.trackers-container.box {
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

/* ✅ Box View Timestamps */
.tracker-timestamps {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #333;
}

.timestamp-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  margin-bottom: 4px;
}

.timestamp-label {
  color: #666;
}

.timestamp-value {
  color: #aaa;
  cursor: help;
}

/* ✅ Simple Status Circle with Gradient Support */
.simple-status-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-weight: 600;
  font-size: 12px;
  margin: 6px 0;
  border: 2px solid;
  transition: all 0.3s;
}

/* ✅ Status Text Styles */
.status-text {
  font-size: 18px;
  font-weight: 600;
  fill: #fff;
}

/* Box View Progress Circle Colors */
.progress-circle svg circle:first-of-type {
  transition: stroke 0.3s;
}

.progress-circle svg circle:last-of-type {
  transition: stroke 0.3s, stroke-dasharray 0.3s;
}

.simple-status-input {
  width: 50px;
  padding: 4px 6px;
  background: #333;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  text-align: center;
  font-size: 12px;
  margin: 4px 0;
}

.simple-status-input:focus {
  outline: none;
  border-color: #4caf50;
}
</style>