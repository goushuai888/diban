# 更新日志 (CHANGELOG)

## [未发布] - 2023-xx-xx

### 新增
- 优化了图像生成组件的参数初始化逻辑
- 改进了DefaultSettingsToolbar组件的用户界面

### 变更
- 更新了UI组件导入方式，从单文件导入改为统一模块导入
- 修改了ImageGenerator.vue中的参数初始化逻辑
- 优化了GenerationSettings.vue的用户界面
- 更新了多个视图页面的布局和样式
- 调整了样式表以提升用户体验

### 移除
- 删除了未使用的视图组件：
  - AdminDashboard.vue
  - TeacherDashboard.vue
  - Login.vue
  - NotFound.vue
- 删除了旧版布局组件：
  - AppFooter.vue
  - AppHeader.vue
  - AppLayout.vue
- 移除了独立的Alert相关组件，改为使用统一导入方式

### 修复
- 修复了FluxModelPage和其他模型页面的显示问题
- 改进了HistoryPage的用户体验
- 优化了Home页面的布局
