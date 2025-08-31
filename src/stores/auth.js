// src/stores/auth.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabaseClient'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)

  async function checkUser() {
    const { data } = await supabase.auth.getUser()
    user.value = data.user || null
  }

  supabase.auth.onAuthStateChange((_, session) => {
    user.value = session?.user || null
  })

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Error signing out:', error.message)
    user.value = null
  }

  return { user, checkUser, signOut }
})