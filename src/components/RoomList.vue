<template>
  <div class="room-list-container">
    <form @submit.prevent="createRoom" class="create-room-form">
      <input v-model="newRoomName" type="text" placeholder="สร้างห้องใหม่..." />
      <button type="submit">สร้าง</button>
    </form>
    
    <ul class="room-list">
      <li v-for="room in rooms" 
          :key="room.id" 
          @click="$emit('roomSelected', room.id)"
          :class="{ 'active': room.id === activeRoomId }">
        {{ room.name }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../stores/auth';

defineProps({
  activeRoomId: Number
});

const emit = defineEmits(['roomSelected']);
const authStore = useAuthStore();
const rooms = ref([]); // <-- ประกาศตัวแปร rooms ที่ template ต้องการ
const newRoomName = ref(''); // <-- ประกาศตัวแปร newRoomName ที่ template ต้องการ
let roomChannel = null;

const fetchRooms = async () => {
  const { data, error } = await supabase.from('rooms').select('*').order('created_at', { ascending: false });
  if (error) console.error('Error fetching rooms:', error);
  else rooms.value = data;
};

const createRoom = async () => {
  if (!newRoomName.value.trim()) return;
  const { data, error } = await supabase.from('rooms').insert({
    name: newRoomName.value,
    created_by: authStore.user.id
  }).select();
  
  if (error) {
    console.error('Error creating room:', error);
  } else {
    newRoomName.value = '';
  }
};

onMounted(() => {
  fetchRooms();

  roomChannel = supabase.channel('public:rooms')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rooms' }, payload => {
      rooms.value.unshift(payload.new);
    })
    .subscribe();
});

onUnmounted(() => {
  if (roomChannel) {
    supabase.removeChannel(roomChannel);
  }
});
</script>

<style scoped>
.room-list-container {
  padding: 0.5rem;
  overflow-y: auto;
}

.create-room-form {
  padding: 0.5rem;
  margin-bottom: 1rem;
}

.create-room-form input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.create-room-form button {
  width: 100%;
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  background-color: var(--primary-color);
  color: white;
  cursor: pointer;
}

.create-room-form button:hover {
  background-color: var(--primary-hover-color);
}

.room-list {
  list-style-type: none;
}

.room-list li {
  padding: 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.room-list li:hover {
  background-color: #f0f0f0;
}

.room-list li.active {
  background-color: var(--primary-color);
  color: white;
  font-weight: bold;
}
</style>