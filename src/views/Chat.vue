<template>
  <div class="chat-app-layout">
    <div class="conversation-list-view" :class="{ 'view-hidden-mobile': !!selectedConversationId }">
      <div class="sidebar-header">
        <h2 class="header-title">BossChi Messages</h2>
        <div class="user-menu" ref="menuRef">
          <button class="menu-button" @click="toggleMenu">
            <MoreHorizontal :size="20" />
          </button>
          <div v-if="isMenuOpen" class="dropdown-content">
            <router-link to="/account" @click="isMenuOpen = false">
              <User :size="16" />
              <span>Profile</span>
            </router-link>
            <a href="#" @click.prevent="performSignOut">
              <LogOut :size="16" />
              <span>Logout</span>
            </a>
          </div>
        </div>
      </div>
      
      <!-- เพิ่ม Listener สำหรับ @user-selected -->
      <ConversationList 
        @conversation-selected="selectConversation" 
        @user-selected="startNewConversation"  
        :active-conversation-id="selectedConversationId" 
      />
    </div>

    <div class="chat-window-view" :class="{ 'view-active': !!selectedConversationId }">
      <ChatWindow
        v-if="selectedConversationId"
        :key="selectedConversationId"
        :conversationId="selectedConversationId"
        @close-chat="deselectConversation"
      />
      <div v-else class="welcome-view">
         <MessageSquareText :size="64" stroke-width="1" />
         <p>Select a conversation to start messaging</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'; 
import { useRouter } from 'vue-router';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../stores/auth';
import { MoreHorizontal, User, LogOut, MessageSquareText } from 'lucide-vue-next';
import ConversationList from '../components/ConversationList.vue';
import ChatWindow from '../components/ChatWindow.vue';

// --- STATE ---
const selectedConversationId = ref(null);
const isMenuOpen = ref(false);
const menuRef = ref(null);

// --- ROUTER & STORE ---
const authStore = useAuthStore();
const router = useRouter();

// --- FUNCTIONS ---

// This function handles clicks on existing conversations
const selectConversation = (conversationId) => {
  selectedConversationId.value = conversationId;
};

// This new function handles clicks on new users from search results
const startNewConversation = async (userId) => {
  try {
    // Call the RPC to get or create a conversation
    const { data, error } = await supabase.rpc('create_or_get_conversation', {
      target_user_id: userId
    });
    if (error) throw error;
    
    // Set the selected conversation ID to the one returned by the RPC
    selectedConversationId.value = data;
    
    // TODO: Ideally, you would refresh the conversation list here as well
    // so the new chat appears in the default view.
    
  } catch (error) {
    console.error("Failed to start new conversation:", error);
    // You could show an error notification to the user here
  }
};

const deselectConversation = () => {
  selectedConversationId.value = null;
};

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const performSignOut = async () => {
  await authStore.signOut();
  isMenuOpen.value = false;
  router.push('/');
};

// Logic for closing menu on outside click
const handleClickOutside = (event) => {
  if (isMenuOpen.value && menuRef.value && !menuRef.value.contains(event.target)) {
    isMenuOpen.value = false;
  }
};
onMounted(() => { document.addEventListener('mousedown', handleClickOutside); });
onUnmounted(() => { document.removeEventListener('mousedown', handleClickOutside); });
</script>

<style scoped>
/* ส่วนของ <style scoped> ไม่มีการเปลี่ยนแปลงจากเวอร์ชันก่อนหน้า */
/* คุณสามารถใช้โค้ด style เดิมได้เลย */

.chat-app-layout {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  background-color: var(--surface);
}
.conversation-list-view, .chat-window-view {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  background-color: var(--surface);
  display: flex;
  flex-direction: column;
}
.chat-window-view {
  transform: translateX(100%);
  z-index: 10;
}
.chat-window-view.view-active {
  transform: translateX(0);
}
.conversation-list-view.view-hidden-mobile {
  transform: translateX(-30%);
  opacity: 0.7;
}
.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.header-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-main);
}
.user-menu {
  position: relative;
}
.menu-button {
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  transition: background-color 0.2s, color 0.2s;
}
.menu-button:hover, .menu-button:focus {
  background-color: var(--background);
  color: var(--text-main);
  outline: none;
}
.dropdown-content {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  background-color: var(--surface);
  min-width: 180px;
  box-shadow: var(--shadow-md);
  z-index: 100;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border);
  padding: 0.5rem;
  overflow: hidden;
}
.dropdown-content a {
  color: var(--text-main);
  padding: 0.75rem 1rem;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 6px;
  transition: background-color 0.2s;
}
.dropdown-content a:hover {
  background-color: var(--background);
}
.welcome-view {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: var(--text-muted);
  background-color: var(--background);
}
.welcome-view p {
  margin-top: 1rem;
  font-size: 1.1rem;
  font-weight: 500;
}
@media (min-width: 768px) {
  .conversation-list-view, .chat-window-view {
    position: static;
    transform: none !important;
    opacity: 1 !important;
  }
  .conversation-list-view {
    width: 380px;
    flex-shrink: 0;
    border-right: 1px solid var(--border);
  }
  .chat-window-view {
    flex-grow: 1;
  }
}
</style>