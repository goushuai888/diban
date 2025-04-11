// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { modelRoutes } from './models';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: {
      title: 'Fal.AI Studio'
    }
  },
  {
    path: '/models',
    name: 'Models',
    component: () => import('@/views/ModelsPage.vue'),
    meta: {
      title: '所有模型 - Fal.AI'
    }
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('@/views/HistoryPage.vue'),
    meta: {
      title: '生成历史 - Fal.AI'
    }
  },
  // 动态添加所有模型路由
  ...modelRoutes,
  // 添加 404 错误页面路由，放在最后捕获所有未定义的路径
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 全局前置守卫 - 设置页面标题
router.beforeEach((to, _from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title as string;
  }
  next();
});

export default router;