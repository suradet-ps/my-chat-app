<template>
  <div class="chat-window">
    <!-- Header with Back Button (Mobile) and User Info -->
    <header class="chat-header">
      <button class="back-button" @click="$emit('closeChat')">
        <ArrowLeft :size="20" />
      </button>
      <div class="avatar-header">{{ getInitials(otherUser?.username) }}</div>
      <div class="user-info">
        <h3>{{ otherUser?.username || 'Loading...' }}</h3>
        <p class="status-online">Online</p> <!-- Placeholder, can be dynamic later -->
      </div>
      <!-- Can add more action icons here like call, video, info -->
    </header>

    <!-- Messages Container -->
    <div class="messages-container" ref="messagesContainer">
      <div v-for="message in messages" :key="message.id" 
           class="message-wrapper"
           :class="{ 'my-message': message.user_id === user.id }">
        
        <!-- Avatar for received messages -->
        <div class="avatar" v-if="message.user_id !== user.id">
          {{ getInitials(message.profiles?.username) }}
        </div>

        <div class="message-content">
          <div class="message-bubble">
            <p class="content">{{ message.content }}</p>
            <span class="timestamp">{{ formatTime(message.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Redesigned Message Input Form -->
    <div class="message-input-form">
      <button class="icon-button">
        <Paperclip :size="20" />
      </button>
      <input 
        v-model="newMessage" 
        @keyup.enter="sendMessage" 
        type="text" 
        placeholder="Type a message..." 
      />
      <button 
        class="send-button" 
        @click="sendMessage" 
        :disabled="!newMessage.trim()"
      >
        <SendHorizontal :size="20" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted, nextTick } from 'vue';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../stores/auth';
import { ArrowLeft, SendHorizontal, Paperclip } from 'lucide-vue-next';

// --- PROPS & EMITS ---
defineEmits(['closeChat']);
const props = defineProps({
  conversationId: { type: Number, required: true },
});

// --- STATE ---
const messages = ref([]);
const newMessage = ref('');
const otherUser = ref(null); // State for the other participant's profile
const currentUserProfile = ref(null); // State for our own profile
const messagesContainer = ref(null);
const authStore = useAuthStore();
const user = authStore.user;
let messageChannel = null;

// --- DATA FETCHING ---

// Fetches our own profile once. This is crucial for broadcasting our info.
async function fetchCurrentUserProfile() {
  if (!user) return;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', user.id)
      .single();
    if (error) throw error;
    currentUserProfile.value = data;
  } catch (error) {
    console.error("Error fetching current user profile:", error);
  }
}

// Fetches the profile of the other user in the conversation for the header display.
async function fetchOtherParticipant() {
  if (!props.conversationId || !user) return;
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('profiles(*)')
      .eq('conversation_id', props.conversationId)
      .neq('user_id', user.id)
      .single();

    if (error) throw error;
    if (data) otherUser.value = data.profiles;
  } catch(error) {
    console.error("Error fetching other participant:", error);
  }
}

// Fetches the initial batch of messages when opening a conversation.
const fetchMessages = async (conversationId) => {
  if (!conversationId) return;
  try {
    messages.value = [];
    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles(username)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    messages.value = data;
    scrollToBottom();
  } catch (error) { 
    console.error('Error fetching messages:', error); 
  }
};

// --- ACTIONS & REALTIME (The Performance Boost Logic) ---

// Sends a new message using Optimistic UI and Broadcast.
const sendMessage = async () => {
  if (!newMessage.value.trim() || !props.conversationId || !currentUserProfile.value) return;

  const content = newMessage.value.trim();
  newMessage.value = ''; // Clear input immediately for snappy UI

  // 1. OPTIMISTIC UI: Instantly display the message on our own screen.
  const optimisticMessage = {
    id: Date.now(), // Temporary ID, will be replaced by DB ID on full reload
    conversation_id: props.conversationId,
    user_id: user.id,
    content: content,
    created_at: new Date().toISOString(),
    profiles: currentUserProfile.value, // Use our cached profile
  };
  messages.value.push(optimisticMessage);
  scrollToBottom();

  // 2. BACKGROUND TASK: Send the actual message to the database.
  const { data: insertedMessage, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: props.conversationId,
      user_id: user.id,
      content: content,
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    // TODO: Implement a visual indicator for failed messages.
    // For now, we'll just log the error. The optimistic message will remain.
    return;
  }

  // 3. BROADCAST: Announce the new, confirmed message to others in the channel.
  if (messageChannel) {
    const broadcastPayload = {
      ...insertedMessage,
      profiles: currentUserProfile.value, // Attach our profile to the payload
    };
    messageChannel.send({
      type: 'broadcast',
      event: 'new_message',
      payload: broadcastPayload,
    });
  }
};

// Subscribes to the conversation channel to listen for broadcasts from others.
const subscribeToChannel = (conversationId) => {
  if (messageChannel) {
    supabase.removeChannel(messageChannel);
  }
  
  messageChannel = supabase.channel(`conversation:${conversationId}`);
  
  // We now ONLY listen for 'broadcast' events. No extra DB calls are needed.
  messageChannel
    .on('broadcast', { event: 'new_message' }, ({ payload }) => {
      // We only append the message if it's from the other user.
      // Our own message was already added optimistically.
      if (payload.user_id !== user.id) {
        messages.value.push(payload);
        scrollToBottom();
      }
    })
    .subscribe((status) => {
      if (status !== 'SUBSCRIBED') {
        // Handle potential subscription errors here
        console.error('Failed to subscribe to channel:', status);
      }
    });
};

// --- LIFECYCLE HOOKS & HELPERS ---

// Watch for changes in conversationId to trigger data fetching and subscriptions.
watch(() => props.conversationId, (newId, oldId) => { 
  if (newId && newId !== oldId) { 
    // Fetch all necessary data when the conversation changes
    fetchCurrentUserProfile();
    fetchOtherParticipant();
    fetchMessages(newId); 
    subscribeToChannel(newId); 
  } 
}, { immediate: true });

// Clean up the subscription when the component is unmounted.
onUnmounted(() => { 
  if (messageChannel) { 
    supabase.removeChannel(messageChannel); 
  } 
});

const scrollToBottom = () => { 
  nextTick(() => { 
    if (messagesContainer.value) { 
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight; 
    } 
  }); 
};

const getInitials = (username) => (username ? username.substring(0, 2).toUpperCase() : '?');
const formatTime = (timestamp) => (timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
</script>

<style scoped>
.chat-window {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--background);
}

/* --- Header --- */
.chat-header {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border);
  background-color: var(--surface);
  flex-shrink: 0;
  z-index: 5;
  box-shadow: var(--shadow-sm);
}
.back-button {
  background: none;
  border: none;
  cursor: pointer;
  margin-right: 0.75rem;
  padding: 0.5rem;
  border-radius: 50%;
  color: var(--text-muted);
  display: flex; /* Default for mobile */
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}
.back-button:hover {
  background-color: var(--background);
}
.avatar-header {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #c7d2fe; /* Light Indigo */
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}
.user-info {
  margin-left: 0.75rem;
}
.user-info h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-main);
}
.user-info p {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 500;
  color: #22c55e; /* Green-500 for online */
}

/* --- Messages Area --- */
.messages-container {
  flex-grow: 1;
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.message-wrapper {
  display: flex;
  max-width: 75%;
  align-items: flex-end;
  gap: 0.75rem;
}
.message-wrapper.my-message {
  align-self: flex-end;
}
.message-wrapper:not(.my-message) {
  align-self: flex-start;
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #e0e7ff; /* Lighter Indigo */
  color: #4338ca;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  font-size: 0.9rem;
  flex-shrink: 0;
}
.message-content {
  display: flex;
  flex-direction: column;
}
.message-bubble {
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius-md);
  max-width: 100%;
  word-wrap: break-word;
  white-space: pre-wrap;
}
.message-wrapper:not(.my-message) .message-bubble {
  background-color: var(--surface);
  border-top-left-radius: 0;
  border: 1px solid var(--border);
}
.message-wrapper.my-message .message-bubble {
  background-color: var(--primary);
  color: var(--text-on-primary);
  border-top-right-radius: 0;
}
.content {
  margin: 0;
}
.timestamp {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-align: right;
  margin-top: 0.25rem;
}
.message-wrapper.my-message .timestamp {
  color: #a5b4fc; /* Light indigo */
}

/* --- Input Form --- */
.message-input-form {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border);
  background-color: var(--surface);
  flex-shrink: 0;
}
.message-input-form input {
  flex-grow: 1;
  border: none;
  outline: none;
  padding: 0.75rem;
  border-radius: var(--border-radius-sm);
  background-color: var(--background);
  font-size: 1rem;
  color: var(--text-main);
}
.message-input-form input::placeholder {
  color: var(--text-muted);
}
.icon-button, .send-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  transition: all 0.2s;
}
.icon-button:hover {
  background-color: var(--background);
  color: var(--text-main);
}
.send-button {
  background-color: var(--primary);
  color: var(--text-on-primary);
}
.send-button:disabled {
  background-color: #cbd5e1; /* Gray-300 */
  cursor: not-allowed;
}
.send-button:not(:disabled):hover {
  background-color: var(--primary-hover);
}

/* --- Responsive Adjustments --- */
@media (min-width: 768px) {
  .back-button {
    display: none; /* Hide Back button on larger screens */
  }
}
</style>