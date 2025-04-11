import type { RouteRecordRaw } from 'vue-router';
import { allModels } from '@/lib/models/registry';

// 为每个模型创建路由配置
export const modelRoutes: RouteRecordRaw[] = allModels.map(model => {
  const routeId = model.id.replace(/\//g, '-');
  return {
    path: `/models/${routeId}`,
    name: `Model-${routeId}`,
    component: () => import('@/views/FluxModelPage.vue'),
    props: { modelId: routeId },
    meta: {
      title: `${model.name} - FAL.AI`,
      model
    }
  };
});

// 创建模型分类
export const modelCategories = [
  {
    title: 'Flux 模型',
    models: allModels.filter(model => model.id.includes('flux'))
  }
];

// 获取模型信息的辅助函数
export function getModelById(id: string) {
  return allModels.find(model => model.id.replace(/\//g, '-') === id);
}
