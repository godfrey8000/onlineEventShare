<template>
  <div class="tracker-board">

    <!-- Filters (Collapsible) -->
    <div class="controls filter-controls">
      <div class="filter-header" @click="filtersExpanded = !filtersExpanded">
        <span>🔍 {{ t('tracker.filters') }}</span>
        <span class="toggle-icon">{{ filtersExpanded ? '▼' : '▶' }}</span>
      </div>

      <!-- Active Filter Summary -->
      <div v-if="filterSummaryText" class="filter-summary">
        🗺️ Filtering: {{ filterSummaryText }}
        <button @click="clearAllFilters" class="clear-filter-btn">✕ {{ t('tracker.clear') }}</button>
      </div>

      <div v-if="filtersExpanded" class="filter-section">
        <!-- Episode Filter -->
        <div class="filter-group">
          <label @click="episodeFilterExpanded = !episodeFilterExpanded" class="filter-label-toggle">
            📺 {{ t('tracker.episodes') }}:
            <span class="toggle-icon">{{ episodeFilterExpanded ? '▼' : '▶' }}</span>
          </label>
          <div v-if="episodeFilterExpanded" class="button-group">
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
              {{ t('tracker.clear') }}
            </button>
          </div>
        </div>

        <!-- Map Filter (only show when episodes are selected) -->
        <div v-if="selectedEpisodes.size > 0" class="filter-group">
          <label @click="mapFilterExpanded = !mapFilterExpanded" class="filter-label-toggle">
            🗺️ {{ t('tracker.maps') }}:
            <span class="toggle-icon">{{ mapFilterExpanded ? '▼' : '▶' }}</span>
          </label>
          <div v-if="mapFilterExpanded" class="button-group">
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
              {{ t('tracker.clear') }}
            </button>
          </div>
        </div>

        <!-- Nickname Filter -->
        <div class="filter-group">
          <label>👤 {{ t('tracker.nickname') }}:</label>
          <input
            v-model="nicknameFilter"
            type="text"
            placeholder="Filter by nickname..."
            class="nickname-input"
          />
        </div>

        <!-- Full Status Filter -->
        <div class="filter-group">
          <label class="full-filter-toggle">
            <input
              type="checkbox"
              v-model="showOnlyFull"
              class="full-filter-checkbox"
            />
            <span>👥 Show Only Full Parties</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Sorting, View, Delete, Quick Add (All in One Line) -->
    <div class="controls-box">
      <!-- View Toggle -->
      <div class="view-toggle">
        <button
          :class="{ active: viewMode === 'box' }"
          @click="viewMode = 'box'"
        >
          📦 {{ t('tracker.boxView') }}
        </button>
        <button
          :class="{ active: viewMode === 'simple' }"
          @click="viewMode = 'simple'"
        >
          📋 {{ t('tracker.simpleView') }}
        </button>
        <button
          :class="{ active: viewMode === 'list' }"
          @click="viewMode = 'list'"
        >
          📊 列表檢視
        </button>
      </div>

      <!-- Sorting -->
      <div class="sort-section">
        <label>🔀 {{ t('tracker.sortBy') }}</label>
        <select v-model="sortBy" class="sort-select">
          <option value="status">Status</option>
          <option value="level">Level</option>
          <option value="nickname">Nickname</option>
          <option value="countdown">Countdown</option>
          <option value="updatedAt">Last Updated</option>
          <option value="createdAt">Created</option>
        </select>
        <button @click="toggleSortOrder" class="order-btn">
          {{ sortOrder === 'asc' ? '↑' : '↓' }}
        </button>
      </div>

      <!-- Rapid Edit Mode Toggle -->
      <div v-if="canEdit" class="rapid-edit-toggle">
        <button
          :class="{ active: rapidEditMode }"
          @click="toggleRapidEditMode"
        >
          {{ rapidEditMode ? '✓ 快速編輯中' : '⚡ 快速編輯' }}
        </button>
      </div>

      <!-- Quick Add Tracker -->
      <div v-if="canEdit" class="quick-add-section">
        <label>⚡ {{ t('tracker.quickAdd') }}</label>
        <input
          v-model="quickAddInput"
          type="text"
          placeholder="e.g. 721.5, 68141, 10523"
          class="quick-add-input"
          @keyup.enter="handleQuickAdd"
          :title="'Format: [Level][Channel][Status]\nSingle-digit channel: 721.5 (Lv7, Ch2, 1.5)\nDouble-digit channel: 68141 (Lv68, Ch14, 1)\nHigh level: 10523 (Lv105, Ch2, 3)'"
        />
        <input
          v-model="quickAddCountdown"
          type="text"
          placeholder="⏱️ 45 or 530"
          class="quick-add-countdown-input"
          @keyup.enter="handleQuickAdd"
          :title="'Countdown time formats:\n• Minutes: 45 (45 minutes)\n• Hours: 530 (5h 30m) or 1230 (12h 30m)\n\nPhase < 1: Sets countdown timer\nPhase ≥ 1: Sets when phase 1 started'"
        />
        <button @click="handleQuickAdd" class="quick-add-btn" :disabled="!quickAddInput">
          {{ t('tracker.add') }}
        </button>
      </div>
    </div>

    <!-- Tracker Count -->
    <div class="tracker-info">
      {{ t('tracker.showingTrackers', { count: filteredTrackers.length, total: validTrackers.length }) }}
    </div>

    <!-- Trackers Display -->
    <div :class="['trackers-container', viewMode]">
      <!-- List View Header -->
      <div v-if="viewMode === 'list' && sortedTrackers.length > 0" class="list-header">
        <span class="list-header-cell">{{ t('tracker.level') }}</span>
        <span class="list-header-cell">{{ t('tracker.map') }}</span>
        <span class="list-header-cell">{{ t('tracker.channel') }}</span>
        <span class="list-header-cell">{{ t('tracker.full') }}</span>
        <span class="list-header-cell">{{ t('tracker.status') }}</span>
        <span class="list-header-cell">{{ t('tracker.countdown') }}</span>
        <span class="list-header-cell list-header-reminder" @click="toggleAllReminders" title="Toggle all reminders">
          🔔
        </span>
        <span class="list-header-cell">{{ t('tracker.updated') }}</span>
        <span class="list-header-cell">{{ t('tracker.created') }}</span>
        <span class="list-header-cell">{{ t('tracker.user') }}</span>
        <span v-if="rapidEditMode && canEdit" class="list-header-cell">{{ t('tracker.actions') }}</span>
      </div>

      <div
        v-for="tracker in sortedTrackers"
        :key="tracker.id"
        :class="['tracker-card', viewMode, { 'is-full': tracker.isFull }]"
      >
        <!-- Box View -->
        <template v-if="viewMode === 'box'">
          <div class="tracker-header">
            <div class="tracker-nickname">{{ getUserNickname(tracker) }}</div>
            <div class="tracker-meta">
              Lv{{ tracker.level }} - {{ getMapName(tracker.mapId) }}
            </div>
          </div>

          <div class="tracker-body">
            <!-- Channel Display/Editor -->
            <div v-if="editMode[tracker.id] || rapidEditMode" class="channel-selector">
              <label>📡頻道:</label>
              <select v-model.number="tracker.channelId" class="channel-select">
                <option v-for="ch in 99" :key="ch" :value="ch">Ch{{ ch }}</option>
              </select>
            </div>
            <div v-else class="tracker-channel">Ch{{ tracker.channelId }}</div>

            <!-- Full Status Checkbox -->
            <label class="full-checkbox">
              <input
                type="checkbox"
                v-model="tracker.isFull"
                :disabled="!canEdit || (!editMode[tracker.id] && !rapidEditMode)"
              />
              <span>👥 {{ t('tracker.mapFull') }}</span>
            </label>

            <!-- Reminder Toggle -->
            <label class="reminder-toggle" :title="isReminderEnabled(tracker.id) ? 'Reminder enabled' : 'Reminder disabled'">
              <input
                type="checkbox"
                :checked="isReminderEnabled(tracker.id)"
                @change="toggleReminder(tracker)"
              />
              <span>{{ isReminderEnabled(tracker.id) ? '🔔' : '🔕' }}</span>
              <span class="reminder-label">Remind</span>
            </label>

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
            <div v-if="editMode[tracker.id] || rapidEditMode" class="status-editor">
              <input
                v-model.number="tracker.status"
                type="number"
                min="0"
                max="5"
                step="0.1"
              />
            </div>

            <!-- Countdown/Phase Time Display and Editor -->
            <div v-if="tracker.countdownEndsAt || canEdit" :class="Number(tracker.status) >= 1 ? 'phase-one-section' : 'countdown-section'">
              <!-- Display: Countdown for phase 0, Elapsed time for phase 1+ -->
              <div v-if="tracker.countdownEndsAt" :class="Number(tracker.status) >= 1 ? 'phase-one-display' : 'countdown-display'">
                <template v-if="Number(tracker.status) < 1">
                  ⏱️ {{ getCountdownText(tracker.countdownEndsAt) }}
                </template>
                <template v-else>
                  🕐 Phase 1: {{ getPhaseOneElapsedText(tracker.countdownEndsAt) }}
                </template>
              </div>

              <!-- Editor: Always show if can edit -->
              <div v-if="canEdit" class="countdown-controls">
                <input
                  v-model="countdownMinutes[tracker.id]"
                  type="text"
                  :placeholder="Number(tracker.status) < 1 ? '480 or 53000' : 'e.g. 10 (10m ago)'"
                  class="countdown-input"
                  :title="Number(tracker.status) < 1 ? 'Enter minutes (480) or hhmmss (53000 = 5h30m) for countdown' : 'Enter minutes ago when phase 1 started'"
                />
                <button
                  @click="setCountdown(tracker)"
                  class="countdown-btn"
                  :disabled="!countdownMinutes[tracker.id]"
                >
                  {{ Number(tracker.status) < 1 ? '設定倒數' : '設定時間' }}
                </button>
                <button
                  v-if="tracker.countdownEndsAt"
                  @click="clearCountdown(tracker)"
                  class="countdown-clear-btn"
                >
                  ✕
                </button>
              </div>
            </div>

            <!-- Timestamps -->
            <div class="tracker-timestamps">
              <div class="timestamp-row">
                <span class="timestamp-label">🕒 {{ t('tracker.updated') }}:</span>
                <span
                  class="timestamp-value"
                  :title="formatFullTime(tracker.updatedAt)"
                  :style="{ color: getTimestampColor(tracker.updatedAt) }"
                >
                  {{ getTimeAgo(tracker.updatedAt) }}
                </span>
              </div>
              <div v-if="!isUpdatedLongerThanOneDay(tracker.updatedAt)" class="timestamp-row">
                <span class="timestamp-label">📅 {{ t('tracker.created') }}:</span>
                <span
                  class="timestamp-value"
                  :title="formatFullTime(tracker.createdAt)"
                  :style="{ color: getTimestampColor(tracker.createdAt) }"
                >
                  {{ getTimeAgo(tracker.createdAt) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Edit/Commit/Delete Buttons -->
          <div v-if="canEdit && !deleteMode" class="edit-actions">
            <!-- Normal edit mode -->
            <template v-if="!rapidEditMode">
              <button
                v-if="!editMode[tracker.id]"
                @click="toggleEditMode(tracker)"
                class="edit-btn"
              >
                ✏️ 編輯
              </button>
              <template v-else>
                <button
                  @click="commitEdit(tracker)"
                  class="commit-btn"
                >
                  ✓ 儲存
                </button>
                <button
                  @click="cancelEdit(tracker)"
                  class="cancel-btn"
                >
                  ✕ 取消
                </button>
              </template>
            </template>

            <!-- Rapid edit mode - show commit and delete -->
            <template v-else>
              <button
                @click="commitEdit(tracker)"
                class="commit-btn"
              >
                ✓ 儲存
              </button>
              <button
                @click="confirmDelete(tracker)"
                class="delete-btn-rapid"
              >
                🗑️ 刪除
              </button>
            </template>
          </div>

          <!-- Delete Button (in delete mode) -->
          <button
            v-if="deleteMode && canDelete"
            class="delete-btn"
            @click="confirmDelete(tracker)"
          >
            ✕
          </button>
        </template>

        <!-- Simple View -->
        <template v-else-if="viewMode === 'simple'">
          <div class="simple-compact">
            <span class="simple-nickname" :title="getUserNickname(tracker)">
              {{ getUserNickname(tracker) }}
            </span>
            
            <span class="simple-map" :title="getMapName(tracker.mapId)">
              Lv{{ tracker.level }} {{ getMapNameShort(tracker.mapId, 3) }}
            </span>
            
            <span class="simple-channel">Ch{{ tracker.channelId }}</span>

            <!-- Full Status Checkbox -->
            <label class="simple-full-checkbox">
              <input
                type="checkbox"
                v-model="tracker.isFull"
                @change="updateFullStatus(tracker)"
                :disabled="!canEdit"
              />
              <span class="full-text">{{ t('tracker.mapFullSimple') }}</span>
            </label>

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

            <div class="simple-times">
              <span
                class="simple-time"
                :title="`${t('tracker.updated')}: ${formatFullTime(tracker.updatedAt)}`"
                :style="{ color: getTimestampColor(tracker.updatedAt) }"
              >
                <span class="time-icon">🕒</span>
                {{ getTimeAgo(tracker.updatedAt) }}
              </span>
              <span
                v-if="!isUpdatedLongerThanOneDay(tracker.updatedAt)"
                class="simple-time"
                :title="`${t('tracker.created')}: ${formatFullTime(tracker.createdAt)}`"
                :style="{ color: getTimestampColor(tracker.createdAt) }"
              >
                <span class="time-icon">📅</span>
                {{ getTimeAgo(tracker.createdAt) }}
              </span>
            </div>

            <button
              v-if="deleteMode && canDelete"
              class="delete-btn-simple"
              @click="confirmDelete(tracker)"
            >
              ✕
            </button>
          </div>
        </template>

        <!-- List View -->
        <template v-else-if="viewMode === 'list'">
          <div class="list-row">
            <span class="list-level">Lv{{ tracker.level }}</span>
            <span class="list-map" :title="getMapName(tracker.mapId)">{{ getMapName(tracker.mapId) }}</span>

            <!-- Channel Display/Editor -->
            <span v-if="!rapidEditMode" class="list-channel">Ch{{ tracker.channelId }}</span>
            <select v-else v-model.number="tracker.channelId" class="list-channel-select">
              <option v-for="ch in 99" :key="ch" :value="ch">Ch{{ ch }}</option>
            </select>

            <!-- isFull Checkbox -->
            <label class="list-full-checkbox">
              <input
                type="checkbox"
                v-model="tracker.isFull"
                :disabled="!canEdit || !rapidEditMode"
              />
              <span>Full</span>
            </label>

            <!-- Status Circle + Number Display/Editor -->
            <div class="list-status-container">
              <span class="list-status-circle" :style="getSimpleCircleStyle(tracker.status)">
                {{ getStatusText(tracker.status) }}
              </span>
              <span v-if="!rapidEditMode" class="list-status-text" :style="{ color: getProgressColor(tracker.status) }">
                {{ formatStatus(tracker.status) }}
              </span>
              <input
                v-else
                v-model.number="tracker.status"
                type="number"
                min="0"
                max="5"
                step="0.1"
                class="list-status-input"
              />
            </div>

            <!-- Countdown Column -->
            <div class="list-countdown">
              <!-- Show countdown controls in rapid edit mode (for all phases) -->
              <div v-if="rapidEditMode && canEdit" class="list-countdown-edit">
                <!-- Show current countdown/phase time -->
                <span v-if="tracker.countdownEndsAt && Number(tracker.status) < 1" class="countdown-text-inline">
                  ⏱️{{ getCountdownText(tracker.countdownEndsAt) }}
                </span>
                <span v-else-if="tracker.countdownEndsAt && Number(tracker.status) >= 1" class="phase-one-text-inline">
                  🕐{{ getPhaseOneElapsedText(tracker.countdownEndsAt) }}
                </span>

                <!-- Input and buttons -->
                <input
                  v-model="countdownMinutes[tracker.id]"
                  type="text"
                  :placeholder="getCountdownPlaceholder(tracker)"
                  class="list-countdown-input"
                  :title="Number(tracker.status) < 1 ? 'Minutes: 45 / Hours: 530 (5h30m) / 1230 (12h30m)' : 'Minutes ago when phase 1 started'"
                />
                <button
                  @click="setCountdown(tracker)"
                  class="list-countdown-btn"
                  :disabled="!countdownMinutes[tracker.id]"
                >
                  設定
                </button>
                <button
                  v-if="tracker.countdownEndsAt"
                  @click="clearCountdown(tracker)"
                  class="list-countdown-clear"
                >
                  ✕
                </button>
              </div>
              <!-- Display countdown when not in rapid edit mode for status < 1 -->
              <span v-else-if="tracker.countdownEndsAt && Number(tracker.status) < 1" class="countdown-text">
                ⏱️ {{ getCountdownText(tracker.countdownEndsAt) }}
              </span>
              <!-- Display phase one elapsed time for status >= 1 -->
              <span v-else-if="tracker.countdownEndsAt && Number(tracker.status) >= 1" class="phase-one-text">
                🕐 {{ getPhaseOneElapsedText(tracker.countdownEndsAt) }}
              </span>
              <span v-else class="countdown-empty">-</span>
            </div>

            <!-- Reminder Toggle -->
            <div class="list-reminder">
              <button
                @click="toggleReminder(tracker)"
                class="list-reminder-btn"
                :class="{ active: isReminderEnabled(tracker.id) }"
                :title="isReminderEnabled(tracker.id) ? 'Reminder enabled' : 'Reminder disabled'"
              >
                {{ isReminderEnabled(tracker.id) ? '🔔' : '🔕' }}
              </button>
            </div>

            <span class="list-time" :style="{ color: getTimestampColor(tracker.updatedAt) }">
              {{ getTimeAgo(tracker.updatedAt) }}
            </span>
            <span v-if="!isUpdatedLongerThanOneDay(tracker.updatedAt)" class="list-time" :style="{ color: getTimestampColor(tracker.createdAt) }">
              {{ getTimeAgo(tracker.createdAt) }}
            </span>
            <span v-else class="list-time">-</span>
            <span class="list-nickname">{{ getUserNickname(tracker) }}</span>

            <!-- Rapid Edit Buttons -->
            <div v-if="rapidEditMode && canEdit" class="list-actions">
              <button @click="commitEdit(tracker)" class="list-commit-btn" title="儲存">
                ✓
              </button>
              <button @click="confirmDelete(tracker)" class="list-delete-btn" title="刪除">
                🗑️
              </button>
            </div>
          </div>
        </template>
      </div>

      <!-- Empty State -->
      <div v-if="sortedTrackers.length === 0" class="empty-state">
        <p v-if="trackers.length === 0">{{ t('tracker.noTrackers') }}</p>
        <p v-else>{{ t('tracker.noTrackers') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../services/api'

const { t } = useI18n()

const props = defineProps({
  trackers: {
    type: Array,
    default: () => []
  },
  token: String,
  role: String,
  nickname: String
})

const emit = defineEmits(['update', 'delete'])

// Data
const episodes = ref([])
const maps = ref([])

// ✅ Real-time timestamp updates
const currentTime = ref(Date.now())
let timeUpdateInterval = null

// Filters
const selectedEpisodes = ref(new Set())
const selectedMaps = ref(new Set())
const nicknameFilter = ref('')
const showOnlyFull = ref(false)

// Sorting
const sortBy = ref('status')
const sortOrder = ref('desc')

// View
const viewMode = ref('box')
const deleteMode = ref(false)

// ✅ Filter collapsed/expanded states
const filtersExpanded = ref(true)
const episodeFilterExpanded = ref(true)
const mapFilterExpanded = ref(true)

// ✅ Quick Add
const quickAddInput = ref('')
const quickAddCountdown = ref('')

// ✅ Countdown timers
const countdownMinutes = ref({})

// ✅ Edit mode for each tracker
const editMode = ref({}) // { trackerId: true/false }
const editCache = ref({}) // Store original values for cancel
const rapidEditMode = ref(false) // Rapid edit mode - all trackers editable at once
const sortCache = ref({}) // Cache original sort values during rapid edit mode
const rapidEditCache = ref({}) // Cache original tracker values during rapid edit mode

// Permissions
const canEdit = computed(() => ['EDITOR', 'ADMIN'].includes(props.role))
const canDelete = computed(() => ['EDITOR', 'ADMIN'].includes(props.role))

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

// ✅ Valid trackers (excluding old ones) - for showing total count
const validTrackers = computed(() => {
  const eightHoursAgo = currentTime.value - (8 * 60 * 60 * 1000)
  return props.trackers.filter(t => {
    const updatedAt = new Date(t.updatedAt).getTime()
    return updatedAt > eightHoursAgo
  })
})

// ✅ Filtered trackers
const filteredTrackers = computed(() => {
  let result = validTrackers.value

  // Filter by episodes (only if episodes are selected)
  if (selectedEpisodes.value.size > 0) {
    result = result.filter(t => selectedEpisodes.value.has(t.episodeNumber))
  }

  // Filter by maps (only if maps are selected)
  if (selectedMaps.value.size > 0) {
    result = result.filter(t => selectedMaps.value.has(t.mapId))
  }

  // Filter by nickname (check both user.nickname and stored nickname)
  if (nicknameFilter.value) {
    const search = nicknameFilter.value.toLowerCase()
    result = result.filter(t => {
      const displayName = (t.user?.nickname || t.nickname || '').toLowerCase()
      return displayName.includes(search)
    })
  }

  // Filter by full status
  if (showOnlyFull.value) {
    result = result.filter(t => t.isFull === true)
  }

  return result
})
// ✅ No auto-select - default to showing all trackers without episode filter

// ✅ Smart filter summary text
const filterSummaryText = computed(() => {
  if (selectedMaps.value.size === 0) {
    return ''
  }

  // Group selected maps by episode
  const mapsByEpisode = {}
  selectedMaps.value.forEach(mapId => {
    const map = maps.value.find(m => m.id === mapId)
    if (map) {
      if (!mapsByEpisode[map.episodeNumber]) {
        mapsByEpisode[map.episodeNumber] = []
      }
      mapsByEpisode[map.episodeNumber].push(map)
    }
  })

  // For each episode, check if all maps are selected
  const summaryParts = []
  Object.entries(mapsByEpisode).forEach(([episodeNum, selectedMapsInEp]) => {
    const allMapsInEp = maps.value.filter(m => m.episodeNumber === parseInt(episodeNum))

    if (selectedMapsInEp.length === allMapsInEp.length) {
      // All maps in this episode selected, show "EPX"
      summaryParts.push(`EP${episodeNum}`)
    } else {
      // Only some maps selected, show individual levels
      selectedMapsInEp.forEach(map => {
        summaryParts.push(`Lv${map.level}`)
      })
    }
  })

  return summaryParts.join(', ')
})

// ✅ Clear all filters
function clearAllFilters() {
  selectedEpisodes.value.clear()
  selectedMaps.value.clear()
  nicknameFilter.value = ''
  showOnlyFull.value = false
}



// ✅ Sorted trackers
const sortedTrackers = computed(() => {
  const sorted = [...filteredTrackers.value]

  sorted.sort((a, b) => {
    let aVal, bVal

    // ✅ Use cached values during rapid edit mode to prevent re-sorting
    const aCache = rapidEditMode.value ? sortCache.value[a.id] : null
    const bCache = rapidEditMode.value ? sortCache.value[b.id] : null

    switch (sortBy.value) {
      case 'status':
        aVal = aCache ? Number(aCache.status) : Number(a.status)
        bVal = bCache ? Number(bCache.status) : Number(b.status)
        break
      case 'level':
        aVal = aCache ? (aCache.level || 0) : (a.level || 0)
        bVal = bCache ? (bCache.level || 0) : (b.level || 0)
        break
      case 'nickname':
        aVal = aCache ? (aCache.nickname || '') : (a.nickname || '')
        bVal = bCache ? (bCache.nickname || '') : (b.nickname || '')
        const nicknameResult = sortOrder.value === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)

        // Secondary sort by countdown if nicknames are equal
        if (nicknameResult === 0) {
          return compareByCountdown(a, b, aCache, bCache)
        }
        return nicknameResult
      case 'countdown':
        // Sort by countdown time (smallest/closest to expire first)
        // Trackers without countdown go to the end
        const aCountdown = aCache ? aCache.countdownEndsAt : a.countdownEndsAt
        const bCountdown = bCache ? bCache.countdownEndsAt : b.countdownEndsAt
        aVal = aCountdown ? new Date(aCountdown).getTime() : Infinity
        bVal = bCountdown ? new Date(bCountdown).getTime() : Infinity
        break
      case 'updatedAt':
        aVal = aCache ? new Date(aCache.updatedAt) : new Date(a.updatedAt)
        bVal = bCache ? new Date(bCache.updatedAt) : new Date(b.updatedAt)
        break
      case 'createdAt':
        aVal = aCache ? new Date(aCache.createdAt) : new Date(a.createdAt)
        bVal = bCache ? new Date(bCache.createdAt) : new Date(b.createdAt)
        break
      default:
        return 0
    }

    const primaryResult = sortOrder.value === 'asc' ? aVal - bVal : bVal - aVal

    // Secondary sort by countdown if primary values are equal
    if (primaryResult === 0) {
      return compareByCountdown(a, b, aCache, bCache)
    }

    return primaryResult
  })

  return sorted
})

// 🔄 Secondary sort helper: Compare by countdown time
// Post-cooldown (CD+) with longer elapsed time goes higher
// Pre-cooldown with longer remaining time goes lower
function compareByCountdown(a, b, aCache, bCache) {
  const aData = aCache || a
  const bData = bCache || b

  const aStatus = Number(aData.status)
  const bStatus = Number(bData.status)

  const aCountdown = aData.countdownEndsAt
  const bCountdown = bData.countdownEndsAt

  // No countdown data: send to bottom
  if (!aCountdown && !bCountdown) return 0
  if (!aCountdown) return 1
  if (!bCountdown) return -1

  const aTime = new Date(aCountdown).getTime()
  const bTime = new Date(bCountdown).getTime()

  const aIsPostCooldown = aStatus >= 1
  const bIsPostCooldown = bStatus >= 1

  // Both post-cooldown: longer elapsed time (earlier countdownEndsAt) goes higher
  if (aIsPostCooldown && bIsPostCooldown) {
    return aTime - bTime // Earlier time = more elapsed = higher priority (smaller return = higher)
  }

  // Both pre-cooldown: longer remaining time (later countdownEndsAt) goes lower
  if (!aIsPostCooldown && !bIsPostCooldown) {
    return aTime - bTime // Later time = more remaining = lower priority (larger return = lower)
  }

  // Mixed: post-cooldown goes higher than pre-cooldown
  return aIsPostCooldown ? -1 : 1
}

// ✅ Helper functions
function getMapName(mapId) {
  return maps.value.find(m => m.id === mapId)?.name || 'Unknown'
}

function getMapLevel(mapId) {
  return maps.value.find(m => m.id === mapId)?.level || '?'
}

// ✅ Get user's current nickname from user object, fallback to stored nickname
function getUserNickname(tracker) {
  // Prefer live user data over stored nickname
  return tracker.user?.nickname || tracker.nickname || 'Unknown'
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


// ✅ Helper: Time ago (uses reactive currentTime for real-time updates)
function getTimeAgo(timestamp) {
  const diff = currentTime.value - new Date(timestamp).getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return `${seconds}s`
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  return `${days}d`
}

// ✅ Get timestamp color based on age
function getTimestampColor(timestamp) {
  const diff = currentTime.value - new Date(timestamp).getTime()
  const minutes = Math.floor(diff / 1000 / 60)

  if (minutes <= 5) return '#4caf50'  // Green: 0-5 minutes
  if (minutes <= 15) return '#ff9800' // Orange: 5-15 minutes
  return '#f44336'                     // Red: >15 minutes
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

// ✅ Helper: Check if updated time is longer than 1 day
function isUpdatedLongerThanOneDay(updatedAt) {
  const diff = currentTime.value - new Date(updatedAt).getTime()
  const hours = Math.floor(diff / 1000 / 60 / 60)
  return hours >= 24
}

function formatStatus(status) {
  const num = Number(status)
  return num % 1 === 0 ? num.toString() : num.toFixed(1)
}

// ✅ Parse time input - supports multiple formats:
// - 1-2 digits: Minutes (e.g., "5" = 5m, "45" = 45m, "90" = 90m)
// - 3 digits: Hmm format (e.g., "530" = 5h 30m, "145" = 1h 45m)
// - 4+ digits: HHmm format (e.g., "1230" = 12h 30m, "0545" = 5h 45m)
function parseTimeInput(input) {
  if (!input) return 0

  const str = String(input).trim()

  // 1-2 digits: Parse as minutes
  // Examples: "5" = 5 mins, "45" = 45 mins, "90" = 90 mins
  if (str.length <= 2) {
    return parseInt(str, 10) || 0
  }

  // 3 digits: Parse as Hmm (H hours mm minutes)
  // Examples: "530" = 5h 30m = 330 mins, "145" = 1h 45m = 105 mins
  if (str.length === 3) {
    const hours = parseInt(str[0], 10)
    const minutes = parseInt(str.slice(1), 10)

    // Validate minutes range
    if (minutes >= 60) {
      return null // Invalid format
    }

    return hours * 60 + minutes
  }

  // 4+ digits: Parse as HHmm (HH hours mm minutes)
  // Examples: "1230" = 12h 30m = 750 mins, "0545" = 5h 45m = 345 mins
  if (str.length >= 4) {
    const hours = parseInt(str.slice(0, -2), 10)
    const minutes = parseInt(str.slice(-2), 10)

    // Validate minutes range
    if (minutes >= 60) {
      return null // Invalid format
    }

    return hours * 60 + minutes
  }

  return 0
}

// ✅ Countdown timer helpers
function getCountdownText(countdownEndsAt) {
  if (!countdownEndsAt) return ''

  const now = currentTime.value
  const endTime = new Date(countdownEndsAt).getTime()
  const diff = endTime - now

  if (diff <= 0) return '已完成'

  const minutes = Math.floor(diff / 1000 / 60)
  const seconds = Math.floor((diff / 1000) % 60)

  if (minutes > 60) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }

  return `${seconds}s`
}

// Get time since phase 1 started (post-cooldown time)
// For phase 1+, countdownEndsAt represents when phase 1 started
function getPhaseOneElapsedText(countdownEndsAt) {
  if (!countdownEndsAt) return ''

  const now = currentTime.value
  const phaseOneStartTime = new Date(countdownEndsAt).getTime()
  const diff = now - phaseOneStartTime

  if (diff < 0) return '' // countdownEndsAt is in the future (shouldn't happen for phase 1+)

  const minutes = Math.floor(diff / 1000 / 60)

  if (minutes < 1) {
    return 'Just now'
  }

  if (minutes < 60) {
    return `CD+${minutes}m`
  }

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `CD+${hours}h ${mins}m`
}

// Get placeholder text for countdown input showing current value
function getCountdownPlaceholder(tracker) {
  // Always show simple placeholder (current time is shown separately)
  return Number(tracker.status) < 1 ? '480' : '10'
}

async function setCountdown(tracker) {
  if (!canEdit.value) return

  const input = countdownMinutes.value[tracker.id]
  if (!input) return

  const minutes = parseTimeInput(input)
  if (minutes === null || minutes <= 0) {
    alert('Invalid time format. Use:\n- Plain minutes: 480\n- hhmmss: 53000 (5h 30m), 64000 (6h 40m)')
    return
  }

  try {
    // ✅ In rapid edit mode, include all edited fields (status, channel, isFull)
    const updateData = {
      countdownMinutes: minutes
    }

    // ✅ Validate and include edited fields if in rapid edit mode
    if (rapidEditMode.value) {
      const status = Number(tracker.status)
      if (status < 0 || status > 5) {
        alert('Status must be between 0 and 5')
        return
      }

      updateData.status = status
      updateData.channelId = tracker.channelId
      updateData.isFull = tracker.isFull
    }

    const response = await api.updateTracker(tracker.id, updateData)

    console.log('[TrackerBoard] Countdown set:', response.data)
    emit('update', response.data || tracker)

    // ✅ Update caches if in rapid edit mode
    if (rapidEditMode.value) {
      // Update sort cache with committed values
      if (sortCache.value[tracker.id]) {
        sortCache.value[tracker.id] = {
          status: tracker.status,
          level: tracker.level,
          nickname: tracker.nickname,
          updatedAt: tracker.updatedAt,
          createdAt: tracker.createdAt,
          countdownEndsAt: tracker.countdownEndsAt
        }
      }

      // Update rapid edit cache so it won't be reverted on exit
      if (rapidEditCache.value[tracker.id]) {
        rapidEditCache.value[tracker.id] = {
          channelId: tracker.channelId,
          status: tracker.status,
          isFull: tracker.isFull
        }
      }
    }

    // Clear the input
    countdownMinutes.value[tracker.id] = null
  } catch (err) {
    console.error('Failed to set countdown:', err)
    alert('Failed to set countdown: ' + (err.response?.data?.error || err.message))
  }
}

async function clearCountdown(tracker) {
  if (!canEdit.value) return

  try {
    const response = await api.updateTracker(tracker.id, {
      countdownMinutes: 0
    })

    console.log('[TrackerBoard] Countdown cleared:', response.data)
    emit('update', response.data || tracker)
  } catch (err) {
    console.error('Failed to clear countdown:', err)
    alert('Failed to clear countdown: ' + (err.response?.data?.error || err.message))
  }
}

// ✅ Parse quick add input
function parseQuickAddInput(input) {
  // Remove spaces
  const cleaned = input.replace(/\s+/g, '')

  // Extract the parts
  let level, channel, status

  // Strategy: Parse from the end
  // Status is always the last part (1-5, with optional decimal)
  // Channel is 1-2 digits before status (1-99)
  // Level is everything remaining at the beginning (1-999)

  // Match pattern: level (1+ digits) + channel (1-2 digits) + status (digit with optional decimal)
  // We need to try both 1-digit and 2-digit channel interpretations

  // First, try to extract the status part (last digit(s) with optional decimal)
  const statusMatch = cleaned.match(/^(.+?)(\d(?:\.\d+)?)$/)

  if (!statusMatch) {
    return null
  }

  const beforeStatus = statusMatch[1] // Everything before status
  const statusPart = statusMatch[2]   // Status (e.g., "1", "1.5", "3")

  // Now parse level and channel from beforeStatus
  // Try both 1-digit and 2-digit channel interpretations
  let levelPart, channelPart

  if (beforeStatus.length >= 3) {
    // Try 2-digit channel interpretation
    const twoDigitChannel = beforeStatus.slice(-2)
    const twoDigitLevel = beforeStatus.slice(0, -2)

    // Try 1-digit channel interpretation
    const oneDigitChannel = beforeStatus.slice(-1)
    const oneDigitLevel = beforeStatus.slice(0, -1)

    const twoDigitChannelNum = parseInt(twoDigitChannel, 10)
    const twoDigitLevelNum = parseInt(twoDigitLevel, 10)
    const oneDigitChannelNum = parseInt(oneDigitChannel, 10)
    const oneDigitLevelNum = parseInt(oneDigitLevel, 10)

    // Check if each interpretation is valid
    const twoDigitValid = twoDigitChannelNum >= 10 && twoDigitChannelNum <= 99 &&
                          twoDigitLevelNum >= 1 && twoDigitLevelNum <= 999
    const oneDigitValid = oneDigitChannelNum >= 1 && oneDigitChannelNum <= 9 &&
                          oneDigitLevelNum >= 1 && oneDigitLevelNum <= 999

    // Prefer the interpretation where the level exists in our maps database
    const twoDigitLevelExists = maps.value.some(m => m.level === twoDigitLevelNum)
    const oneDigitLevelExists = maps.value.some(m => m.level === oneDigitLevelNum)

    if (twoDigitValid && oneDigitValid) {
      // Both are valid, prefer the one with existing map level
      if (oneDigitLevelExists && !twoDigitLevelExists) {
        // Prefer 1-digit channel interpretation
        levelPart = oneDigitLevel
        channelPart = oneDigitChannel
      } else if (twoDigitLevelExists && !oneDigitLevelExists) {
        // Prefer 2-digit channel interpretation
        levelPart = twoDigitLevel
        channelPart = twoDigitChannel
      } else {
        // Both or neither exist in maps - default to 1-digit channel (more common)
        levelPart = oneDigitLevel
        channelPart = oneDigitChannel
      }
    } else if (twoDigitValid) {
      levelPart = twoDigitLevel
      channelPart = twoDigitChannel
    } else if (oneDigitValid) {
      levelPart = oneDigitLevel
      channelPart = oneDigitChannel
    } else {
      return null
    }
  } else if (beforeStatus.length === 2) {
    // Only room for single-digit level and single-digit channel
    levelPart = beforeStatus.slice(0, 1)
    channelPart = beforeStatus.slice(1, 2)
  } else {
    return null
  }

  level = parseInt(levelPart, 10)
  channel = parseInt(channelPart, 10)
  status = parseFloat(statusPart)

  // Validate ranges
  if (level < 1 || level > 999) {
    return { error: 'Level must be between 1 and 999' }
  }

  if (channel < 1 || channel > 99) {
    return { error: 'Channel must be between 1 and 99' }
  }

  if (status < 0 || status > 5) {
    return { error: 'Status must be between 0 and 5' }
  }

  return { level, channel, status }
}

// ✅ Handle quick add
async function handleQuickAdd() {
  if (!quickAddInput.value.trim()) {
    return
  }

  const parsed = parseQuickAddInput(quickAddInput.value)

  if (!parsed) {
    alert('Invalid format. Examples:\n• Single-digit channel: 721.5 (Lv7, Ch2, 1.5)\n• Double-digit channel: 68141 (Lv68, Ch14, 1)\n• High level: 10523 (Lv105, Ch2, 3)')
    return
  }

  if (parsed.error) {
    alert(parsed.error)
    return
  }

  const { level, channel, status } = parsed

  // Find the map for this level
  const map = maps.value.find(m => m.level === level)

  if (!map) {
    alert(`No map found for level ${level}`)
    return
  }

  try {
    // Create the tracker via API
    const response = await api.createTracker({
      episodeNumber: map.episodeNumber,
      mapId: map.id,
      channelId: channel,
      level: map.level,
      status: status,
      nickname: props.nickname
    })

    console.log('[TrackerBoard] Quick add tracker created:', response.data)

    // Emit to parent to add to the list
    emit('update', response.data)

    // ✅ If countdown is set, set it for any phase
    // For phase < 1: countdown = future time (now + minutes)
    // For phase >= 1: countdown = past time (now - minutes, when phase 1 started)
    if (quickAddCountdown.value) {
      const countdownMinutes = parseTimeInput(quickAddCountdown.value)
      if (countdownMinutes !== null && countdownMinutes > 0) {
        try {
          const countdownResponse = await api.updateTracker(response.data.id, {
            countdownMinutes: countdownMinutes
          })
          console.log('[TrackerBoard] Countdown set for quick-added tracker:', countdownResponse.data)
          emit('update', countdownResponse.data)
        } catch (err) {
          console.error('Failed to set countdown for quick-added tracker:', err)
        }
      }
    }

    // Clear inputs
    quickAddInput.value = ''
    quickAddCountdown.value = ''

  } catch (err) {
    console.error('Failed to quick add tracker:', err)
    alert('Failed to add tracker: ' + (err.response?.data?.error || err.message))
  }
}

// ✅ Edit mode functions
function toggleEditMode(tracker) {
  if (!canEdit.value) return

  const isEditing = editMode.value[tracker.id]

  if (isEditing) {
    // Exiting edit mode - just toggle off without saving
    editMode.value[tracker.id] = false
    delete editCache.value[tracker.id]
  } else {
    // Entering edit mode - cache current values
    editMode.value[tracker.id] = true
    editCache.value[tracker.id] = {
      channelId: tracker.channelId,
      status: tracker.status,
      isFull: tracker.isFull,
      countdownEndsAt: tracker.countdownEndsAt
    }
  }
}

async function commitEdit(tracker) {
  // ✅ Allow commits in both individual edit mode AND rapid edit mode
  if (!canEdit.value || (!editMode.value[tracker.id] && !rapidEditMode.value)) return

  try {
    // Validate status range
    const status = Number(tracker.status)
    if (status < 0 || status > 5) {
      alert('Status must be between 0 and 5')
      return
    }

    // Prepare update data
    const updateData = {
      channelId: tracker.channelId,
      status: status,
      isFull: tracker.isFull
    }

    // ✅ Include countdown minutes if entered but not yet committed
    const input = countdownMinutes.value[tracker.id]
    if (input) {
      const minutes = parseTimeInput(input)
      if (minutes !== null && minutes > 0) {
        updateData.countdownMinutes = minutes
        // Clear the input after including it
        countdownMinutes.value[tracker.id] = null
      }
    }

    // ✅ Update via API
    const response = await api.updateTracker(tracker.id, updateData)

    console.log('[TrackerBoard] Tracker updated:', response.data)

    // ✅ Emit to parent to update the tracker list
    emit('update', response.data || tracker)

    // ✅ Update caches if in rapid edit mode
    if (rapidEditMode.value) {
      // Update sort cache with committed values
      if (sortCache.value[tracker.id]) {
        sortCache.value[tracker.id] = {
          status: tracker.status,
          level: tracker.level,
          nickname: tracker.nickname,
          updatedAt: tracker.updatedAt,
          createdAt: tracker.createdAt,
          countdownEndsAt: tracker.countdownEndsAt
        }
      }

      // Update rapid edit cache so it won't be reverted on exit
      if (rapidEditCache.value[tracker.id]) {
        rapidEditCache.value[tracker.id] = {
          channelId: tracker.channelId,
          status: tracker.status,
          isFull: tracker.isFull
        }
      }
    }

    // Exit edit mode
    editMode.value[tracker.id] = false
    delete editCache.value[tracker.id]

  } catch (err) {
    console.error('Failed to update tracker:', err)
    alert('Failed to update tracker: ' + (err.response?.data?.error || err.message))
  }
}

function cancelEdit(tracker) {
  if (!editMode.value[tracker.id]) return

  const cached = editCache.value[tracker.id]
  if (cached) {
    // Restore original values
    tracker.channelId = cached.channelId
    tracker.status = cached.status
    tracker.isFull = cached.isFull
    tracker.countdownEndsAt = cached.countdownEndsAt
  }

  // Exit edit mode
  editMode.value[tracker.id] = false
  delete editCache.value[tracker.id]
}

// ✅ Toggle rapid edit mode with caching
function toggleRapidEditMode() {
  if (rapidEditMode.value) {
    // Exiting rapid edit mode - restore uncommitted changes
    filteredTrackers.value.forEach(tracker => {
      const cached = rapidEditCache.value[tracker.id]
      if (cached) {
        tracker.channelId = cached.channelId
        tracker.status = cached.status
        tracker.isFull = cached.isFull
        // Don't restore countdownEndsAt since it's managed by backend
      }
    })

    // Clear caches and countdown inputs
    sortCache.value = {}
    rapidEditCache.value = {}
    countdownMinutes.value = {}

    rapidEditMode.value = false
  } else {
    // Entering rapid edit mode - cache current values
    rapidEditMode.value = true

    sortCache.value = {}
    rapidEditCache.value = {}

    filteredTrackers.value.forEach(tracker => {
      // Cache for sorting (prevents re-sorting during edit)
      sortCache.value[tracker.id] = {
        status: tracker.status,
        level: tracker.level,
        nickname: tracker.nickname,
        updatedAt: tracker.updatedAt,
        createdAt: tracker.createdAt,
        countdownEndsAt: tracker.countdownEndsAt
      }

      // Cache for restoring uncommitted changes
      rapidEditCache.value[tracker.id] = {
        channelId: tracker.channelId,
        status: tracker.status,
        isFull: tracker.isFull
      }
    })
  }
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

// ✅ Update full status
async function updateFullStatus(tracker) {
  if (!canEdit.value) return

  try {
    const response = await api.updateTracker(tracker.id, {
      isFull: tracker.isFull
    })

    console.log('[TrackerBoard] Full status updated:', response.data)
    emit('update', response.data || tracker)

  } catch (err) {
    console.error('Failed to update full status:', err)
    alert('Failed to update full status: ' + (err.response?.data?.error || err.message))
  }
}

function confirmDelete(tracker) {
  deleteTracker(tracker)
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

// ✅ Reminder management with localStorage
// Reactive ref to track reminder state changes
const reminderToggleCounter = ref(0)

// Get reminder enabled state for a tracker from localStorage
function isReminderEnabled(trackerId) {
  // Access the counter to make this reactive
  reminderToggleCounter.value
  const trackerReminders = JSON.parse(localStorage.getItem('trackerReminders') || '{}')
  return trackerReminders[trackerId] === true
}

// Set reminder enabled state for a tracker in localStorage
function setReminderEnabled(trackerId, enabled) {
  const trackerReminders = JSON.parse(localStorage.getItem('trackerReminders') || '{}')
  if (enabled) {
    trackerReminders[trackerId] = true
  } else {
    delete trackerReminders[trackerId]
  }
  localStorage.setItem('trackerReminders', JSON.stringify(trackerReminders))

  // Trigger reactivity
  reminderToggleCounter.value++
}

// Toggle reminder for a tracker
function toggleReminder(tracker) {
  const currentState = isReminderEnabled(tracker.id)
  setReminderEnabled(tracker.id, !currentState)

  console.log('[Reminder] Tracker', tracker.id, 'reminder:', !currentState ? 'enabled' : 'disabled')
}

// Toggle ALL trackers' reminders on/off
function toggleAllReminders() {
  const trackerReminders = JSON.parse(localStorage.getItem('trackerReminders') || '{}')
  const allTrackerIds = props.trackers.map(t => t.id)

  // Check if any tracker has reminder enabled
  const anyEnabled = allTrackerIds.some(id => trackerReminders[id] === true)

  if (anyEnabled) {
    // Disable all
    allTrackerIds.forEach(id => delete trackerReminders[id])
    console.log('[Reminder] Disabled all tracker reminders')
  } else {
    // Enable all
    allTrackerIds.forEach(id => trackerReminders[id] = true)
    console.log('[Reminder] Enabled all tracker reminders')
  }

  localStorage.setItem('trackerReminders', JSON.stringify(trackerReminders))
  reminderToggleCounter.value++
}

// Clean up reminders for deleted trackers (optional housekeeping)
function cleanupTrackerReminders() {
  const trackerReminders = JSON.parse(localStorage.getItem('trackerReminders') || '{}')
  const currentTrackerIds = new Set(props.trackers.map(t => t.id))

  let needsUpdate = false
  Object.keys(trackerReminders).forEach(trackerId => {
    if (!currentTrackerIds.has(Number(trackerId))) {
      delete trackerReminders[trackerId]
      needsUpdate = true
    }
  })

  if (needsUpdate) {
    localStorage.setItem('trackerReminders', JSON.stringify(trackerReminders))
    console.log('[Reminder] Cleaned up old tracker reminders')
  }
}

// ✅ Countdown expiration is now handled by backend countdown checker job (every 10s)
// The backend job updates status to 1 and keeps countdownEndsAt as phase 1 start time
// All clients receive updates via Socket.io, so no need for frontend auto-update

// ✅ Load data on mount
onMounted(() => {
  fetchData()

  // ✅ Clean up old tracker reminders
  cleanupTrackerReminders()

  // ✅ Update currentTime every second for real-time timestamp updates
  timeUpdateInterval = setInterval(() => {
    currentTime.value = Date.now()
  }, 1000)
})

// ✅ Cleanup on unmount
onBeforeUnmount(() => {
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval)
  }
})
</script>

<style scoped>
.tracker-board {
  padding: 20px;
}

.controls-box {
  background: #1e1e1e;
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: nowrap;
}

.controls {
  background: #1e1e1e;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.filter-controls {
  width: 100%;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  padding: 8px 12px;
  background: #2a2a2a;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  transition: background 0.2s;
}

.filter-header:hover {
  background: #333;
}

.filter-summary {
  background: #2a2a2a;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 14px;
  color: #fff;
}

.filter-tag {
  display: inline-block;
  padding: 4px 10px;
  background: #4caf50;
  color: white;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.clear-filter-btn {
  padding: 4px 10px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  margin-left: auto;
  transition: background 0.2s;
}

.clear-filter-btn:hover {
  background: #d32f2f;
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

.filter-label-toggle {
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: color 0.2s;
}

.filter-label-toggle:hover {
  color: #fff;
}

.toggle-icon {
  font-size: 12px;
  transition: transform 0.2s;
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
  flex-shrink: 0;
}

.sort-section label,
.view-toggle label,
.delete-toggle label {
  margin-bottom: 0;
  color: #aaa;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.view-toggle button,
.delete-toggle button {
  padding: 6px 10px;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 6px;
  color: #ccc;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  white-space: nowrap;
}

.view-toggle button:hover,
.delete-toggle button:hover {
  background: #333;
}

.view-toggle button.active {
  background: #4caf50;
  color: white;
  border-color: #4caf50;
}

.delete-toggle button.active {
  background: #f44336;
  color: white;
  border-color: #f44336;
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
  transition: all 0.2s;
}

.order-btn:hover {
  background: #333;
}

.delete-toggle button {
  padding: 6px 12px;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 6px;
  color: #ccc;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  white-space: nowrap;
}

.delete-toggle button:hover {
  background: #333;
}

.delete-toggle button.active {
  background: #f44336;
  color: white;
  border-color: #f44336;
}

.quick-add-section {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
  flex-shrink: 0;
}

.quick-add-section label {
  white-space: nowrap;
}

.quick-add-input {
  width: 100px;
  padding: 6px 8px;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 6px;
  color: #fff;
  font-size: 12px;
  transition: border-color 0.2s;
}

.quick-add-input:focus {
  outline: none;
  border-color: #4caf50;
}

.quick-add-input::placeholder {
  color: #666;
}

.quick-add-countdown-input {
  width: 80px;
  padding: 6px 8px;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 6px;
  color: #fff;
  font-size: 12px;
  transition: border-color 0.2s;
}

.quick-add-countdown-input:focus {
  outline: none;
  border-color: #ff9800;
}

.quick-add-countdown-input::placeholder {
  color: #666;
}

.quick-add-btn {
  padding: 6px 12px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
}

.quick-add-btn:hover:not(:disabled) {
  background: #45a049;
  transform: translateY(-1px);
}

.quick-add-btn:disabled {
  background: #666;
  cursor: not-allowed;
  opacity: 0.5;
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
  border: 2px solid transparent;
}

.tracker-card.is-full {
  border-color: #f44336;
  box-shadow: 0 0 10px rgba(244, 67, 54, 0.3);
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
  font-size: 12px;
  font-weight: 600;
  cursor: help;
  transition: color 0.3s ease;
}

.time-icon {
  font-size: 11px;
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
  font-size: 13px;
  margin-bottom: 6px;
}

.timestamp-label {
  color: #888;
  font-weight: 500;
}

.timestamp-value {
  font-weight: 600;
  font-size: 14px;
  cursor: help;
  transition: color 0.3s ease;
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

/* ✅ Countdown Timer Styles */
.countdown-section {
  width: 100%;
  background: #1e1e1e;
  border-radius: 6px;
  padding: 10px;
  margin-top: 8px;
}

.countdown-display {
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: #ff9800;
  margin-bottom: 8px;
}

/* ✅ Phase One Elapsed Time Styles */
.phase-one-section {
  width: 100%;
  background: #1a2a1a;
  border-radius: 6px;
  padding: 10px;
  margin-top: 8px;
  border: 1px solid #4caf50;
}

.phase-one-display {
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: #4caf50;
}

.countdown-controls {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
}

.countdown-input {
  width: 70px;
  padding: 6px 8px;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  text-align: center;
  font-size: 13px;
}

.countdown-input:focus {
  outline: none;
  border-color: #ff9800;
}

.countdown-btn {
  padding: 6px 12px;
  background: #ff9800;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
}

.countdown-btn:hover:not(:disabled) {
  background: #f57c00;
}

.countdown-btn:disabled {
  background: #666;
  cursor: not-allowed;
  opacity: 0.5;
}

.countdown-clear-btn {
  padding: 6px 10px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
}

.countdown-clear-btn:hover {
  background: #d32f2f;
}

/* ✅ Full Status Checkboxes */
.full-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  font-size: 13px;
  color: #aaa;
}

.full-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #4caf50;
}

.full-checkbox input[type="checkbox"]:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.reminder-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
  font-size: 12px;
  color: #aaa;
  padding: 4px 8px;
  background: #2a2a2a;
  border-radius: 4px;
  transition: all 0.2s;
}

.reminder-toggle:hover {
  background: #333;
}

.reminder-toggle input[type="checkbox"] {
  display: none;
}

.reminder-toggle span:first-of-type {
  font-size: 16px;
}

.reminder-label {
  font-size: 11px;
  text-transform: uppercase;
}

.simple-full-checkbox {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  user-select: none;
  font-size: 11px;
  color: #aaa;
}

.simple-full-checkbox input[type="checkbox"] {
  width: 14px;
  height: 14px;
  cursor: pointer;
  accent-color: #f44336;
}

.simple-full-checkbox input[type="checkbox"]:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.full-text {
  font-size: 11px;
  white-space: nowrap;
}

.simple-times {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.full-filter-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  font-size: 14px;
  color: #aaa;
  margin-bottom: 0 !important;
}

.full-filter-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #4caf50;
}

/* ✅ Edit Mode Styles */
.edit-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  justify-content: center;
}

.edit-btn {
  padding: 8px 16px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}

.edit-btn:hover {
  background: #1976d2;
  transform: translateY(-1px);
}

.commit-btn {
  padding: 8px 16px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}

.commit-btn:hover {
  background: #45a049;
  transform: translateY(-1px);
}

.cancel-btn {
  padding: 8px 16px;
  background: #666;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #555;
  transform: translateY(-1px);
}

.channel-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.channel-selector label {
  color: #aaa;
  font-weight: 600;
}

.channel-select {
  padding: 6px 10px;
  background: #333;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
}

.channel-select:focus {
  outline: none;
  border-color: #2196f3;
}

/* ✅ Rapid Edit Mode Styles */
.rapid-edit-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rapid-edit-toggle {
  flex-shrink: 0;
}

.rapid-edit-toggle button {
  padding: 6px 10px;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 6px;
  color: #ccc;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  white-space: nowrap;
}

.rapid-edit-toggle button:hover {
  background: #333;
}

.rapid-edit-toggle button.active {
  background: #ff9800;
  color: white;
  border-color: #ff9800;
}

.delete-btn-rapid {
  padding: 8px 16px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}

.delete-btn-rapid:hover {
  background: #d32f2f;
  transform: translateY(-1px);
}

/* ✅ List View Styles */
.trackers-container.list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tracker-card.list {
  padding: 0;
  background: transparent;
  border: none;
}

.tracker-card.list:hover {
  transform: none;
}

.tracker-card.list.is-full .list-row {
  outline: 3px solid #f44336;
  outline-offset: -3px;
  box-shadow: 0 0 15px rgba(244, 67, 54, 0.5);
}

.list-header {
  display: grid;
  grid-template-columns: 45px minmax(100px, 180px) 65px 60px 95px 220px 35px 75px 75px 90px 60px;
  gap: 8px;
  align-items: center;
  padding: 10px 16px;
  background: #1a1a1a;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #aaa;
  text-transform: uppercase;
  margin-bottom: 4px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.list-header-cell {
  text-align: center;
}

.list-header-cell:first-child {
  text-align: left;
}

.list-header-cell:nth-child(2) {
  text-align: left;
}

.list-header-reminder {
  cursor: pointer;
  transition: transform 0.2s, filter 0.2s;
}

.list-header-reminder:hover {
  transform: scale(1.2);
  filter: brightness(1.5);
}

.list-row {
  display: grid;
  grid-template-columns: 45px minmax(100px, 180px) 65px 60px 95px 220px 35px 75px 75px 90px 60px;
  gap: 8px;
  align-items: center;
  padding: 10px 16px;
  background: #2a2a2a;
  border-radius: 6px;
  font-size: 13px;
  transition: background 0.2s;
}

.list-row:hover {
  background: #333;
}

.list-level {
  font-weight: 600;
  color: #4caf50;
}

.list-map {
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-channel {
  padding: 4px 8px;
  background: #333;
  border-radius: 4px;
  color: #aaa;
  text-align: center;
}

.list-channel-select {
  padding: 4px 8px;
  background: #333;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  font-size: 13px;
}

.list-channel-select:focus {
  outline: none;
  border-color: #2196f3;
}

.list-full-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
  font-size: 12px;
  color: #aaa;
}

.list-full-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #f44336;
}

.list-full-checkbox input[type="checkbox"]:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.list-status-container {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.list-status-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-weight: 600;
  font-size: 11px;
  border: 2px solid;
  flex-shrink: 0;
}

.list-status-text {
  font-weight: 700;
  font-size: 17px;
}

.list-status-input {
  width: 60px;
  padding: 4px 8px;
  background: #333;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  text-align: center;
  font-size: 15px;
}

.list-status-input:focus {
  outline: none;
  border-color: #4caf50;
}

.list-countdown {
  text-align: center;
  font-size: 14px;
}

.list-countdown-edit {
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.list-countdown-input {
  width: 45px;
  padding: 4px 6px;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  text-align: center;
  font-size: 12px;
}

.list-countdown-input:focus {
  outline: none;
  border-color: #ff9800;
}

.list-countdown-btn {
  padding: 4px 8px;
  background: #ff9800;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.list-countdown-btn:hover:not(:disabled) {
  background: #f57c00;
}

.list-countdown-btn:disabled {
  background: #666;
  cursor: not-allowed;
  opacity: 0.5;
}

.list-countdown-clear {
  padding: 4px 6px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
}

.list-countdown-clear:hover {
  background: #d32f2f;
}

.list-reminder {
  display: flex;
  justify-content: center;
  align-items: center;
}

.list-reminder-btn {
  padding: 4px 8px;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.list-reminder-btn:hover {
  background: #333;
  border-color: #666;
}

.list-reminder-btn.active {
  background: #4caf50;
  border-color: #4caf50;
}

.countdown-text {
  color: #ff9800;
  font-weight: 600;
  font-size: 14px;
}

.countdown-text-inline {
  color: #ff9800;
  font-weight: 600;
  font-size: 12px;
  white-space: nowrap;
  margin-right: 4px;
}

.phase-one-text-inline {
  color: #4caf50;
  font-weight: 600;
  font-size: 12px;
  white-space: nowrap;
  margin-right: 4px;
}

.phase-one-text {
  color: #4caf50;
  font-weight: 600;
  font-size: 14px;
}

.countdown-empty {
  color: #555;
}

.list-time {
  font-weight: 600;
  font-size: 15px;
  text-align: center;
}

.list-nickname {
  color: #fff;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.list-commit-btn {
  padding: 6px 12px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
}

.list-commit-btn:hover {
  background: #45a049;
  transform: translateY(-1px);
}

.list-delete-btn {
  padding: 6px 12px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.list-delete-btn:hover {
  background: #d32f2f;
  transform: translateY(-1px);
}
</style>