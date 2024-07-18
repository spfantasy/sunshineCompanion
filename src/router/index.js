import { createRouter, createWebHistory } from 'vue-router'
import ServerStats from "../views/ServerStats.vue";
import BizFlow from "../views/BizFlow.vue";
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/status',
      name: 'status',
      component: ServerStats
    },
    {
      path: '/flow',
      name: 'flow',
      component: BizFlow
    },
    {
      path: '/',
      name: 'home',
      redirect: '/status'
    }
  ]
})

export default router
