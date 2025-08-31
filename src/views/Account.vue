<template>
  <div class="account-view">
    <div class="account-container">
      <header class="account-header">
        <router-link to="/chat" class="back-button">
          <ArrowLeft :size="20" />
        </router-link>
        <h1>Profile Settings</h1>
      </header>
      
      <form @submit.prevent="updateProfile" class="account-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input id="email" type="text" :value="user?.email" disabled />
          <p class="form-hint">You cannot change your email address.</p>
        </div>
        
        <div class="form-group">
          <label for="username">Username</label>
          <input id="username" type="text" v-model="username" placeholder="Enter your display name" />
          <p class="form-hint">This will be your display name in chats.</p>
        </div>

        <footer class="form-footer">
          <div v-if="message" class="message success">{{ message }}</div>
          <div v-if="errorMsg" class="message error">{{ errorMsg }}</div>
          <button type="submit" :disabled="loading" class="save-button">
            {{ loading ? 'Saving...' : 'Save Changes' }}
          </button>
        </footer>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../stores/auth';
import { ArrowLeft } from 'lucide-vue-next';

const authStore = useAuthStore();
const user = authStore.user;

const loading = ref(true);
const username = ref('');
const message = ref('');
const errorMsg = ref('');

async function getProfile() {
  try {
    loading.value = true;
    if (!user) return;

    const { data, error, status } = await supabase
      .from('profiles')
      .select(`username`)
      .eq('id', user.id)
      .single();

    if (error && status !== 406) throw error;
    if (data) {
      username.value = data.username;
    }
  } catch (error) {
    errorMsg.value = error.message;
  } finally {
    loading.value = false;
  }
}

async function updateProfile() {
  try {
    loading.value = true;
    message.value = '';
    errorMsg.value = '';

    const updates = {
      id: user.id,
      username: username.value,
      updated_at: new Date(),
    };

    const { error } = await supabase.from('profiles').upsert(updates);
    if (error) throw error;
    message.value = "Profile updated successfully!";

  } catch (error) {
    errorMsg.value = error.message;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  getProfile();
});
</script>

<style scoped>
.account-view {
  display: flex;
  justify-content: center;
  align-items: flex-start; /* Align to top */
  padding: 2rem;
  height: 100vh;
  background-color: var(--background);
}

.account-container {
  width: 100%;
  max-width: 600px;
  background-color: var(--surface);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.account-header {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border);
}

.account-header h1 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  flex-grow: 1;
  text-align: center;
}

.back-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  color: var(--text-muted);
  display: flex;
  transition: background-color 0.2s;
}
.back-button:hover {
  background-color: var(--background);
}

.account-form {
  display: flex;
  flex-direction: column;
}

.form-group {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border);
}
.form-group:last-child {
  border-bottom: none;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--text-main);
}

.form-group input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border);
  border-radius: var(--border-radius-sm);
  font-size: 1rem;
  background-color: var(--background);
}
.form-group input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-light);
}
.form-group input:disabled {
  background-color: #f1f5f9; /* Slate-100 */
  cursor: not-allowed;
  color: var(--text-muted);
}

.form-hint {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 0.5rem;
}

.form-footer {
  padding: 1.5rem;
  background-color: #f8fafc; /* Slate-50 */
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
}

.save-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--border-radius-sm);
  background-color: var(--primary);
  color: var(--text-on-primary);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}
.save-button:hover {
  background-color: var(--primary-hover);
}
.save-button:disabled {
  background-color: #cbd5e1;
  cursor: not-allowed;
}

.message {
  padding: 0.75rem;
  border-radius: 4px;
  text-align: center;
  font-weight: 500;
  flex-grow: 1; /* Take up available space */
}
.success { color: #166534; } /* Green-800 */
.error { color: #991b1b; } /* Red-800 */
</style>