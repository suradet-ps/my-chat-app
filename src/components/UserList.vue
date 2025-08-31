<template>
  <div class="user-list-container">
    <div class="header">รายชื่อผู้ใช้</div>
    <ul class="user-list">
      <li v-for="user in users" 
          :key="user.id" 
          @click="$emit('userSelected', user.id)"
          :class="{ 'active': user.id === activeUserId }">
        <div class="avatar">{{ getInitials(user.username) }}</div>
        <span class="username">{{ user.username || user.id.substring(0, 8) }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../stores/auth';

defineProps({
  activeUserId: String
});
defineEmits(['userSelected']);

const users = ref([]);
const authStore = useAuthStore(); // <-- ดึง store มาเก็บไว้

const fetchUsers = async () => {
  const currentUser = authStore.user; // <-- ดึง user จาก store

  // ############ จุดแก้ไขที่สำคัญ ############
  // เพิ่มการตรวจสอบว่า currentUser มีข้อมูลแล้วหรือยัง
  if (!currentUser) {
    console.warn("User data not available yet, skipping fetchUsers.");
    return; // ออกจากฟังก์ชันไปก่อนถ้า user ยังไม่พร้อม
  }
  // #########################################

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username')
    .not('id', 'eq', currentUser.id); // <-- บรรทัดนี้จะปลอดภัยแล้ว

  if (error) console.error('Error fetching users:', error);
  else users.value = data;
};

const getInitials = (username) => {
  if (!username) return '?';
  return username.substring(0, 2).toUpperCase();
};

onMounted(fetchUsers);

// เพิ่ม Watcher เพื่อรอให้ข้อมูล user พร้อม
authStore.$subscribe((mutation, state) => {
  if (state.user && users.value.length === 0) {
    fetchUsers();
  }
});

</script>

<style scoped>
/* สไตล์เดิมทั้งหมด ไม่ต้องแก้ไข */
.user-list-container {
  overflow-y: auto;
  flex: 1;
}
.header {
  padding: 1rem;
  font-weight: bold;
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  background-color: #fcfcfc;
}
.user-list { list-style: none; }
.user-list li {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}
.user-list li:hover { background-color: #f5f5f5; }
.user-list li.active {
  background-color: var(--primary-color);
  color: white;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #a5b4fc;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 12px;
}
li.active .avatar {
  background-color: white;
  color: var(--primary-color);
}
</style>