<template>
  <div class="conversation-list">
    <div class="search-bar">
      <Search :size="18" />
      <input 
        type="text" 
        placeholder="Search or start a new chat" 
        v-model="searchQuery" 
      />
    </div>
    
    <!-- A. Default View: When search bar is empty -->
    <ul v-if="!searchQuery" class="result-list">
      <li 
        v-for="convo in conversations" 
        :key="convo.conversation_id" 
        @click="selectExistingConversation(convo.conversation_id)"
        :class="{ 'active': convo.conversation_id === activeConversationId }"
      >
        <div class="avatar">{{ getInitials(convo.other_user_username) }}</div>
        <div class="convo-details">
          <p class="username">{{ convo.other_user_username || 'Unknown User' }}</p>
          <p class="last-message">{{ convo.last_message_content || '...' }}</p>
        </div>
        <div class="timestamp">
          {{ formatTimestamp(convo.last_message_created_at) }}
        </div>
      </li>
    </ul>

    <!-- B. Search View: When user is typing -->
    <div v-else class="search-results">
      <!-- Section 1: Filtered existing chats -->
      <div v-if="filteredConversations.length > 0">
        <h3 class="results-header">Chats</h3>
        <ul class="result-list">
          <li v-for="convo in filteredConversations" :key="`filtered-${convo.conversation_id}`" @click="selectExistingConversation(convo.conversation_id)">
            <div class="avatar">{{ getInitials(convo.other_user_username) }}</div>
            <div class="convo-details">
              <p class="username">{{ convo.other_user_username || 'Unknown' }}</p>
              <p class="last-message">In your conversations</p>
            </div>
          </li>
        </ul>
      </div>

      <!-- Section 2: Global user search results -->
      <div v-if="globalSearchResults.length > 0">
        <h3 class="results-header">New Contacts</h3>
        <ul class="result-list">
          <li v-for="user in globalSearchResults" :key="user.id" @click="selectNewUser(user.id)">
            <div class="avatar">{{ getInitials(user.username) }}</div>
            <div class="convo-details">
              <p class="username">{{ user.username }}</p>
              <p class="last-message">Start a new conversation</p>
            </div>
          </li>
        </ul>
      </div>
      
      <!-- Loading / No results state -->
      <div v-if="isSearching" class="info-state">
        <p>Searching...</p>
      </div>
      <div v-if="!isSearching && filteredConversations.length === 0 && globalSearchResults.length === 0" class="info-state">
        <p>No results found for "{{ searchQuery }}"</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../stores/auth';
import { Search } from 'lucide-vue-next';

// --- PROPS & EMITS ---
defineProps({ 
  activeConversationId: Number 
});
const emit = defineEmits(['conversationSelected', 'userSelected']);

// --- STATE ---
const conversations = ref([]); // Holds all existing conversations from RPC
const searchQuery = ref('');   // The text from the input
const globalSearchResults = ref([]); // Holds new users found from DB search
const isSearching = ref(false); // For loading indicator

// --- COMPUTED: For filtering existing chats instantly on the frontend ---
const filteredConversations = computed(() => {
  if (!searchQuery.value) return []; // Only filter when there is a query
  const lowerCaseQuery = searchQuery.value.toLowerCase();
  return conversations.value.filter(convo => 
    convo.other_user_username?.toLowerCase().includes(lowerCaseQuery)
  );
});

// --- BACKEND SEARCH LOGIC (with Debouncing) ---
let debounceTimer;
watch(searchQuery, (newQuery) => {
  clearTimeout(debounceTimer);
  globalSearchResults.value = []; // Clear previous global results

  const trimmedQuery = newQuery.trim();
  if (trimmedQuery.length > 1) { // Start searching after 1 character
    isSearching.value = true;
    debounceTimer = setTimeout(async () => {
      await performGlobalSearch(trimmedQuery);
      isSearching.value = false;
    }, 300); // Debounce for 300ms
  } else {
    isSearching.value = false;
  }
});

async function performGlobalSearch(term) {
  const currentUser = useAuthStore().user;
  if (!currentUser) return;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username')
      .ilike('username', `%${term}%`)
      .neq('id', currentUser.id)
      .limit(10);
    
    if (error) throw error;
    
    // Filter out users we are already chatting with to avoid duplication in results
    const existingChatUserIds = conversations.value.map(c => c.other_user_id);
    globalSearchResults.value = data.filter(user => !existingChatUserIds.includes(user.id));

  } catch (error) {
    console.error("Error searching global users:", error);
  }
}

// --- DATA FETCHING (for existing conversations) ---
async function fetchConversations() {
  try {
    const { data, error } = await supabase.rpc('get_my_conversations');
    if (error) throw error;
    conversations.value = data;
  } catch (error) { 
    console.error("Error fetching conversations:", error); 
  }
}

onMounted(fetchConversations);

// --- EMITTERS ---
// Clear search and emit to parent when selecting a conversation
const selectExistingConversation = (id) => {
  searchQuery.value = '';
  emit('conversationSelected', id);
};

const selectNewUser = (id) => {
  searchQuery.value = '';
  emit('userSelected', id);
};


// --- HELPERS ---
const getInitials = (name) => (name ? name.substring(0, 2).toUpperCase() : '?');
const formatTimestamp = (ts) => {
  if (!ts) return '';
  const date = new Date(ts);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
  }
};
</script>

<style scoped>
.conversation-list {
  overflow-y: auto;
  flex-grow: 1;
}

.search-bar {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-muted);
  position: sticky;
  top: 0;
  background-color: var(--surface);
}

.search-bar input {
  flex-grow: 1;
  border: none;
  outline: none;
  font-size: 1rem;
  background: transparent;
  color: var(--text-main);
}

ul {
  list-style: none;
  padding: 0.5rem;
  margin: 0;
}

li {
  display: flex;
  align-items: center;
  padding: 1rem;
  cursor: pointer;
  border-radius: var(--border-radius-md);
  transition: background-color 0.2s;
  position: relative;
}

li:hover {
  background-color: var(--background);
}

li.active {
  background-color: var(--primary-light);
}

li.active .username {
  color: var(--primary);
  font-weight: 700;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #a5b4fc;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.convo-details {
  flex-grow: 1;
  margin: 0 1rem;
  overflow: hidden;
}

.username {
  font-weight: 600;
  margin: 0;
  color: var(--text-main);
  transition: color 0.2s;
}

.last-message {
  font-size: 0.9rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 4px 0 0;
}

.timestamp {
  font-size: 0.8rem;
  color: var(--text-muted);
  flex-shrink: 0;
  align-self: flex-start;
  padding-top: 2px;
}

.no-conversations {
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100% - 100px); /* Adjust based on search bar height */
  color: var(--text-muted);
  text-align: center;
}
</style>