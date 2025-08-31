<template>
  <form @submit.prevent="handleLogin" class="space-y-4">
    <div>
      <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
      <input type="email" v-model="email" id="email" required class="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
    </div>
    <button type="submit" :disabled="loading" class="w-full px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50">
      {{ loading ? 'กำลังส่ง...' : 'ส่ง Magic Link' }}
    </button>
    <div v-if="message" class="p-3 mt-4 text-center text-green-700 bg-green-100 rounded-md">{{ message }}</div>
    <div v-if="errorMsg" class="p-3 mt-4 text-center text-red-700 bg-red-100 rounded-md">{{ errorMsg }}</div>
  </form>
</template>

<script setup>
import { ref } from 'vue';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'vue-router';

const email = ref('');
const loading = ref(false);
const message = ref('');
const errorMsg = ref('');
const router = useRouter();

const handleLogin = async () => {
  try {
    loading.value = true;
    errorMsg.value = '';
    message.value = '';
    const { error } = await supabase.auth.signInWithOtp({
      email: email.value,
    });
    if (error) throw error;
    message.value = 'ตรวจสอบอีเมลของคุณสำหรับ Magic Link!';
  } catch (error) {
    errorMsg.value = error.message;
  } finally {
    loading.value = false;
  }
};

// ตรวจสอบเมื่อมีการ Login สำเร็จผ่าน Magic Link
supabase.auth.onAuthStateChange((_, session) => {
  if (session) {
    router.push('/chat');
  }
});
</script>