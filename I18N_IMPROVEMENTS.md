# I18N Improvements Needed

## ✅ Completed: Voice Reminder with i18n

### What Was Done:
1. ✅ Added i18n keys for voice reminder in `tracker-frontend/src/i18n/index.js`:
   - `reminder.level` - "Level" / "等級" / "レベル"
   - `reminder.channel` - "Channel" / "頻道" / "チャンネル"
   - `reminder.phase` - "Phase" / "階段" / "フェーズ"

2. ✅ Created `speakReminder()` function with:
   - Uses i18n for all text (`t('reminder.level')`, etc.)
   - Speaks phase number after channel
   - Supports all 3 languages (EN/ZH/JA)
   - Respects volume/rate/pitch settings from localStorage

### Example Output:
- **English:** "Level 7, Channel 2, Phase 1"
- **Chinese:** "等級 7，頻道 2，階段 1"
- **Japanese:** "レベル 7、チャンネル 2、フェーズ 1"

---

## 🚧 TODO: Connect Voice Reminder to Socket.io

The `speakReminder` function is created but not yet called. You need to:

**File:** `tracker-frontend/src/components/TrackerBoard.vue`

**Find:** The Socket.io setup section (search for `socket.on('tracker:changed:global'`)

**Add after it:**

```javascript
// ✅ Listen for phase transition reminders
socket.on('tracker:reminder', (data) => {
  console.log('[Socket] Received reminder event:', data)

  // Check if global reminders are enabled
  const globalEnabled = localStorage.getItem('globalReminderEnabled') === 'true'
  if (!globalEnabled) {
    console.log('[Reminder] Global reminders disabled, skipping')
    return
  }

  // Speak the reminder (now with i18n support!)
  speakReminder(data)
})
```

**Note:** Make sure the backend (`src/jobs/countdownChecker.js`) emits the `tracker:reminder` event with all required data:
- `level`
- `channelId`
- `status` (for phase calculation)
- `mapName` (optional, for future use)

---

## 🔍 Hardcoded Strings That Should Use i18n

Here are all the hardcoded English strings found in `TrackerBoard.vue` that should be converted to use `t()`:

### 1. Sort Options (Lines 121-126)
**Current:**
```vue
<option value="status">Status</option>
<option value="level">Level</option>
<option value="nickname">Nickname</option>
<option value="countdown">Countdown</option>
```

**Should be:**
```vue
<option value="status">{{ t('tracker.status') }}</option>
<option value="level">{{ t('tracker.level') }}</option>
<option value="nickname">{{ t('tracker.nickname') }}</option>
<option value="countdown">{{ t('tracker.countdown') }}</option>
```

### 2. Full Parties Filter (Line 87)
**Current:**
```vue
<span>👥 Show Only Full Parties</span>
```

**Should be:**
```vue
<span>👥 {{ t('tracker.showOnlyFull') }}</span>
```

**Need to add to i18n:**
```javascript
// en
showOnlyFull: 'Show Only Full Parties'

// zh
showOnlyFull: '僅顯示滿隊'

// ja
showOnlyFull: '満員パーティのみ表示'
```

### 3. Full Checkbox in List View (Line 503)
**Current:**
```vue
<span>Full</span>
```

**Should be:**
```vue
<span>{{ t('tracker.full') }}</span>
```

Already exists in i18n ✓

### 4. Quick Add Tooltip (Line 152)
**Current:**
```vue
:title="'Format: [Level][Channel][Status]\nSingle-digit channel: 721.5 (Lv7, Ch2, 1.5)\nDouble-digit channel: 68141 (Lv68, Ch14, 1)\nHigh level: 10523 (Lv105, Ch2, 3)'"
```

**Should be:**
```vue
:title="t('tracker.quickAddFormat')"
```

**Need to add to i18n:**
```javascript
// en
quickAddFormat: 'Format: [Level][Channel][Status]\nSingle-digit channel: 721.5 (Lv7, Ch2, 1.5)\nDouble-digit channel: 68141 (Lv68, Ch14, 1)\nHigh level: 10523 (Lv105, Ch2, 3)'

// zh
quickAddFormat: '格式: [等級][頻道][狀態]\n單位數頻道: 721.5 (7等, 2頻, 1.5)\n雙位數頻道: 68141 (68等, 14頻, 1)\n高等級: 10523 (105等, 2頻, 3)'

// ja
quickAddFormat: 'フォーマット: [レベル][チャンネル][ステータス]\n1桁チャンネル: 721.5 (Lv7, Ch2, 1.5)\n2桁チャンネル: 68141 (Lv68, Ch14, 1)\n高レベル: 10523 (Lv105, Ch2, 3)'
```

### 5. Alert Messages
**Current (multiple locations):**
```javascript
alert('Status must be between 0 and 5')
alert('Invalid time format. Use:\n- Plain minutes: 480\n- hhmmss: 53000 (5h 30m), 64000 (6h 40m)')
```

**Should be:**
```javascript
alert(t('errors.statusRange'))
alert(t('errors.invalidTimeFormat'))
```

**Need to add to i18n:**
```javascript
errors: {
  statusRange: 'Status must be between 0 and 5',
  invalidTimeFormat: 'Invalid time format. Use:\n- Plain minutes: 480\n- hhmmss: 53000 (5h 30m), 64000 (6h 40m)',
  failedToUpdate: 'Failed to update tracker',
  failedToDelete: 'Failed to delete tracker',
  failedToSetCountdown: 'Failed to set countdown',
  failedToToggleReminder: 'Failed to toggle reminder'
}

// And Chinese/Japanese translations...
```

### 6. List View "Last Updated" Format
**Current:** Uses hardcoded 'zh-TW' locale
```javascript
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
```

**Should be:**
```javascript
function formatFullTime(timestamp) {
  const currentLocale = localStorage.getItem('locale') || 'zh'
  const locale = currentLocale === 'zh' ? 'zh-TW' :
                 currentLocale === 'ja' ? 'ja-JP' :
                 'en-US'

  return new Date(timestamp).toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}
```

---

## 📝 Summary of Changes Needed

### Quick Wins (Easy to Fix):
1. ✅ Voice reminder - DONE!
2. Replace sort option labels with `t()`
3. Replace "Show Only Full Parties" with `t()`
4. Fix `formatFullTime()` to use dynamic locale

### Medium Effort:
5. Add all error messages to i18n
6. Add quick add format tooltip to i18n
7. Connect `speakReminder` to Socket.io event

### Implementation Priority:
1. **High:** Connect voice reminder to Socket.io (needed for feature to work)
2. **High:** Fix `formatFullTime()` locale (affects all users)
3. **Medium:** Replace sort labels (visible UI)
4. **Medium:** Add error message i18n (better UX)
5. **Low:** Quick add tooltip i18n (advanced users only)

---

## 🎯 Next Steps

### To Complete Voice Reminder Feature:

1. **Backend** - Add to `src/jobs/countdownChecker.js`:
```javascript
if (updated.reminderEnabled) {
  io.emit('tracker:reminder', {
    id: updated.id,
    level: updated.level,
    channelId: updated.channelId,
    status: updated.status,  // ← Important: needed for phase calculation
    mapName: updated.map?.name
  });
}
```

2. **Frontend** - Add Socket.io listener (shown above)

3. **Testing:**
   - Create tracker with reminder enabled
   - Wait for countdown to expire
   - Should hear: "Level X, Channel Y, Phase 1" in your chosen language

---

## ✨ Benefits of i18n Voice Reminder

- 🌍 **Multi-language:** Works for EN/ZH/JA users
- 🔊 **Native pronunciation:** Browser's TTS uses correct language
- ⚙️ **Customizable:** Volume/rate/pitch from localStorage
- 📱 **Accessible:** Helps users who aren't watching screen
- 🎮 **Gaming friendly:** Can hear reminders while playing

---

**Status:** Voice reminder function is ready! Just needs to be connected to Socket.io and backend event.
