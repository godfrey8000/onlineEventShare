# 🌐 i18n Multi-Language Guide

## ✅ What's Working Now

Your multi-language feature is now fully functional!

### Supported Languages:
- 🇬🇧 **English** (en) - Default
- 🇹🇼 **繁體中文** (zh) - Traditional Chinese
- 🇯🇵 **日本語** (ja) - Japanese

---

## 🎯 How to Use

### For Users:
1. Look at the top-right corner of the app
2. Find the language dropdown selector
3. Click and choose your language
4. The UI will instantly update!

### Current Translations:
- ✅ Login Bar (title, buttons, placeholders)
- ✅ Auth messages (login, logout, errors)
- ✅ Tracker section (labels, buttons)
- ✅ Chat section (ready for implementation)
- ✅ Status messages
- ✅ Common UI elements

---

## 💻 For Developers: How to Add More Translations

### 1. Add Translation Keys

Edit `src/i18n/index.js` and add your text under each language:

```javascript
const messages = {
  en: {
    mySection: {
      myText: 'Hello World'
    }
  },
  zh: {
    mySection: {
      myText: '你好世界'
    }
  },
  ja: {
    mySection: {
      myText: 'こんにちは世界'
    }
  }
}
```

### 2. Use in Components

In your Vue component:

```vue
<template>
  <div>
    {{ t('mySection.myText') }}
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
```

### 3. With Variables

In i18n file:
```javascript
messages: {
  en: {
    greeting: 'Hello {name}!'
  }
}
```

In component:
```vue
{{ t('greeting', { name: 'John' }) }}
<!-- Result: Hello John! -->
```

---

## 📝 Adding More Components

### Example: Update AddTracker Component

**Before:**
```vue
<button>Add Tracker</button>
```

**After:**
```vue
<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <button>{{ t('tracker.addTracker') }}</button>
</template>
```

---

## 🔧 Advanced Usage

### Pluralization

```javascript
en: {
  items: '{count} item | {count} items'
}
```

```vue
{{ t('items', { count: 5 }, 5) }}
<!-- Result: 5 items -->
```

### Date/Time Formatting

```javascript
import { useI18n } from 'vue-i18n'
const { d } = useI18n()

// In template:
{{ d(new Date(), 'short') }}
```

### Number Formatting

```javascript
const { n } = useI18n()

// In template:
{{ n(1000, 'currency') }}
```

---

## 📦 Translation Categories

Current structure in `src/i18n/index.js`:

```
messages
├── common          # Shared UI elements (buttons, labels)
├── auth            # Login, logout, authentication
├── tracker         # Tracker board, forms
├── chat            # Chat room messages
└── status          # Progress status labels
```

---

## 🎨 Component Integration Checklist

To add i18n to a component:

- [ ] Import `useI18n` from 'vue-i18n'
- [ ] Call `const { t } = useI18n()` in script setup
- [ ] Replace hardcoded strings with `t('key.path')`
- [ ] Add translation keys to all 3 languages in i18n/index.js
- [ ] Test language switching

---

## 🧪 Testing

```bash
# 1. Run dev server
npm run dev

# 2. Open browser
http://localhost:5173

# 3. Test language switching
- Click language dropdown
- Select different language
- Verify UI updates
- Check browser console for errors
```

---

## 🐛 Troubleshooting

### Language doesn't change
**Check:** Is `useI18n()` imported and used in the component?

```vue
<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
```

### Missing translation warning
**Check:** Do all languages have the same keys?

```javascript
// ❌ Wrong - missing 'zh' key
en: { myKey: 'Hello' }
zh: { }  // Missing!

// ✅ Correct
en: { myKey: 'Hello' }
zh: { myKey: '你好' }
```

### Translation shows key instead of text
**Cause:** Key doesn't exist

```vue
{{ t('nonexistent.key') }}
<!-- Shows: "nonexistent.key" -->
```

**Fix:** Add the key to i18n/index.js

---

## 📚 Components Using i18n

### ✅ Fully Translated:
- `LoginBar.vue` - Login, logout, buttons

### 🚧 Ready to Translate:
- `AddTracker.vue` - Use `t('tracker.*')` keys
- `TrackerBoard.vue` - Use `t('tracker.*')` keys
- `ChatRoom.vue` - Use `t('chat.*')` keys
- `TrackerCard.vue` - Use `t('status.*')` for status labels

---

## 🎯 Next Steps

1. **Update AddTracker.vue** to use translations
2. **Update TrackerBoard.vue** filtering/sorting labels
3. **Update ChatRoom.vue** messages
4. **Add more languages** (Korean, Spanish, etc.)

---

## 📖 Resources

- Vue I18n Docs: https://vue-i18n.intlify.dev/
- Composition API: https://vue-i18n.intlify.dev/guide/advanced/composition.html
- Format Syntax: https://vue-i18n.intlify.dev/guide/essentials/syntax.html

---

## ✅ Summary

**Your i18n setup includes:**
- ✅ 3 languages (English, Chinese, Japanese)
- ✅ Persistent language selection (localStorage)
- ✅ Language switcher in header
- ✅ Comprehensive translations for auth & tracker
- ✅ Easy to extend with more components

**Next time you add a component:**
1. Import `useI18n`
2. Use `t('key')` instead of hardcoded text
3. Add translations for all 3 languages
4. Test language switching

Done! 🎉
