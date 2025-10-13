<template>
  <div>
    <!-- Floating Toggle Button -->
    <button class="chat-toggle" @click="visible = !visible">
      💬
    </button>

    <!-- Floating Chat Window -->
    <div class="chat-room" :class="{ hidden: !visible }">
      <div class="chat-header" @click="visible = !visible">
        💬 Global Chat
        <span class="status" :class="{ online: connected }">
          {{ connected ? '🟢' : '🟠' }}
        </span>
      </div>

      <div class="chat-body" ref="chatBox">
        <div v-for="m in messages" :key="m.id" class="chat-msg">
          <b>[{{ m.user?.nickname || 'Visitor' }}]</b> {{ m.content }}
          <span class="time">{{ new Date(m.createdAt).toLocaleTimeString() }}</span>
        </div>
      </div>

      <div v-if="canChat" class="chat-input">
        <input v-model="text" @keyup.enter="send" placeholder="Type message…" />
        <button @click="send">Send</button>
      </div>
      <div v-else class="chat-disabled">
        🔒 Only CHATTER+ roles can send messages
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { getSocket, loadChatHistory, sendChatMessage, onChatMessage, offChatMessage } from '../services/socket';

const props = defineProps({ token: String, role: String });

const messages = ref([]);
const text = ref('');
const connected = ref(false);
const canChat = ['CHATTER', 'EDITOR', 'ADMIN'].includes(props.role);
const visible = ref(false);

let socket = null;

onMounted(async () => {
  // ✅ Get existing socket connection (don't create a new one!)
  socket = getSocket();

  if (!socket) {
    console.error('[ChatRoom] Socket not initialized');
    return;
  }

  // ✅ Update connection status
  connected.value = socket.connected;
  socket.on('connect', () => (connected.value = true));
  socket.on('disconnect', () => (connected.value = false));

  // ✅ Load chat history via Socket.IO
  loadChatHistory({ limit: 100 }, (response) => {
    if (response?.ok) {
      messages.value = response.messages || [];
      console.log('[ChatRoom] Loaded', messages.value.length, 'messages');
      nextTick(scrollToBottom);
    } else {
      console.error('[ChatRoom] Failed to load history:', response?.error);
    }
  });

  // ✅ Listen for new chat messages
  const handleNewMessage = (msg) => {
    messages.value.push(msg);
    nextTick(scrollToBottom);
  };

  onChatMessage(handleNewMessage);

  // ✅ Cleanup on unmount
  onUnmounted(() => {
    offChatMessage(handleNewMessage);
  });
});

function scrollToBottom() {
  const box = document.querySelector('.chat-body');
  if (box) {
    box.scrollTop = box.scrollHeight;
  }
}

function send() {
  if (!text.value.trim() || !canChat) return;

  sendChatMessage(text.value.trim(), (response) => {
    if (response?.error) {
      console.error('[ChatRoom] Failed to send:', response.error);
      alert('Failed to send message: ' + response.error);
    } else {
      console.log('[ChatRoom] Message sent');
    }
  });

  text.value = '';
}
</script>

<style scoped>
.chat-room {
  position: fixed;
  bottom: 80px; /* keep above update timestamp */
  right: 20px;
  width: 320px;
  height: 420px;
  background: #1e1e1e;
  color: #eee;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.chat-room.hidden {
  transform: translateY(30px);
  opacity: 0;
  pointer-events: none;
}
.chat-header {
  font-weight: bold;
  padding: 6px 10px;
  background: #2b2b2b;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 10px 10px 0 0;
  cursor: pointer;
}
.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 6px;
  background: #222;
  border-top: 1px solid #333;
}
.chat-msg {
  margin-bottom: 4px;
  font-size: 13px;
}
.chat-msg .time {
  opacity: 0.5;
  font-size: 10px;
  margin-left: 6px;
}
.chat-input {
  display: flex;
  margin-top: 4px;
  padding: 6px;
  background: #2b2b2b;
  border-radius: 0 0 10px 10px;
}
.chat-input input {
  flex: 1;
  padding: 5px 6px;
  border: none;
  border-radius: 4px;
  background: #333;
  color: white;
}
.chat-input button {
  margin-left: 6px;
  border: none;
  background: #3b82f6;
  color: white;
  border-radius: 4px;
  padding: 5px 8px;
  cursor: pointer;
}
.chat-toggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  font-size: 20px;
  cursor: pointer;
  z-index: 1001;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
}
</style>
