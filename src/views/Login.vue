<template>
  <div class="login-view">
    <!-- 1. Branding Side (Visible on Desktop) -->
    <div class="branding-side">
      <div class="branding-content">
        <MessageSquareText :size="64" stroke-width="1.5" />
        <h1 class="brand-name">Supabase Chat</h1>
        <p class="brand-tagline">Connect and collaborate instantly.</p>
      </div>
    </div>

    <!-- 2. Form Side -->
    <div class="form-side">
      <div class="login-card">
        <h2 class="title">Sign in to your account</h2>
        <p class="subtitle">Enter your email below</p>
        
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email" 
              v-model="email" 
              id="email" 
              required 
              placeholder="your@email.com" 
            />
          </div>
          
          <button type="submit" :disabled="loading" class="login-button">
            <span v-if="!loading">Send Magic Link</span>
            <span v-else class="loading-spinner"></span>
          </button>
          
          <div v-if="message" class="message success">
            <CheckCircle :size="20"/>
            <span>{{ message }}</span>
          </div>
          <div v-if="errorMsg" class="message error">
            <AlertTriangle :size="20"/>
            <span>{{ errorMsg }}</span>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'vue-router';
import { MessageSquareText, CheckCircle, AlertTriangle } from 'lucide-vue-next';

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
    const { error } = await supabase.auth.signInWithOtp({ email: email.value });
    if (error) throw error;
    message.value = 'Check your email for the magic link!';
  } catch (error) {
    errorMsg.value = error.message;
  } finally {
    loading.value = false;
  }
};

supabase.auth.onAuthStateChange((_, session) => {
  if (session) {
    router.push('/chat');
  }
});
</script>

<style scoped>
.login-view {
  display: flex;
  min-height: 100vh;
  width: 100%;
  background-color: var(--background);
}

/* --- Branding Side --- */
.branding-side {
  display: none; /* Hidden on mobile by default */
  flex: 1;
  background-color: var(--primary-light);
  justify-content: center;
  align-items: center;
  color: var(--primary);
}

.branding-content {
  text-align: center;
}

.brand-name {
  font-size: 2.5rem;
  font-weight: 700;
  margin-top: 1rem;
}

.brand-tagline {
  font-size: 1.1rem;
  color: #6366f1; /* Indigo-500 */
  margin-top: 0.5rem;
}

/* --- Form Side --- */
.form-side {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 2.5rem;
  background-color: var(--surface);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border);
}

.title {
  text-align: center;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-main);
}

.subtitle {
  text-align: center;
  margin-top: 0.5rem;
  margin-bottom: 2rem;
  color: var(--text-muted);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-main);
}

.form-group input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border);
  border-radius: var(--border-radius-sm);
  font-size: 1rem;
  background-color: var(--background);
  transition: all 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.login-button {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 48px;
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: var(--border-radius-sm);
  background-color: var(--primary);
  color: var(--text-on-primary);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}
.login-button:hover:not(:disabled) {
  background-color: var(--primary-hover);
}
.login-button:disabled {
  background-color: #94a3b8; /* Gray-400 */
  cursor: not-allowed;
}

.message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius-sm);
  font-weight: 500;
  margin-top: 0.5rem;
}
.success {
  background-color: #dcfce7; /* Green-100 */
  color: #166534; /* Green-800 */
}
.error {
  background-color: #fee2e2; /* Red-100 */
  color: #991b1b; /* Red-800 */
}

/* Loading Spinner Animation */
.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* --- Responsive Layout --- */
@media (min-width: 768px) {
  .branding-side {
    display: flex; /* Show on desktop */
  }
}
</style>