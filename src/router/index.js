import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../lib/supabaseClient'

// Import Views
import Login from '../views/Login.vue'
import Chat from '../views/Chat.vue'
import Account from '../views/Account.vue' 

const routes = [
  { 
    path: '/', 
    name: 'Login', 
    component: Login 
  },
  {
    path: '/chat',
    name: 'Chat',
    component: Chat,
    meta: { requiresAuth: true }
  },
  { // <-- เพิ่ม Route ใหม่สำหรับหน้า Account
    path: '/account',
    name: 'Account',
    component: Account,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation Guard (เหมือนเดิม)
router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  if (requiresAuth && !session) {
    next({ name: 'Login' })
  } else if (!requiresAuth && session) {
    // ถ้า login แล้วเข้าหน้า root (login) ให้เด้งไปหน้า chat
    if (to.name === 'Login') {
      next({ name: 'Chat' })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router