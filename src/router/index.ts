// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: {
      title: '特斯拉 FSD 权限交易平台'
    }
  },
  {
    path: '/tradinghall',
    name: 'TradingHall',
    component: () => import('@/views/TradingHallPage.vue'),
    meta: {
      title: '交易大厅 - FSD交易平台'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginPage.vue'),
    meta: {
      title: '登录 - FSD交易平台'
    }
  },
  {
    path: '/signup',
    name: 'SignUp',
    component: () => import('@/views/SignUpPage.vue'),
    meta: {
      title: '注册 - FSD交易平台'
    }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/ForgotPasswordPage.vue'),
    meta: {
      title: '忘记密码 - FSD交易平台'
    }
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('@/views/ResetPasswordPage.vue'),
    meta: {
      title: '重置密码 - FSD交易平台'
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/SettingsPage.vue'),
    meta: {
      title: '个人设置 - FSD交易平台'
    }
  },
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