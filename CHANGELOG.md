# 更新日志 (CHANGELOG)

### 新增
- 优化了图像生成组件的参数初始化逻辑
- 改进了DefaultSettingsToolbar组件的用户界面
- 添加了图片生成设置中的提示词输入提示，建议用户使用英文标签化形式
- 添加了AI提示词生成功能的余额不足错误处理和充值提示
- 添加了生成历史页面的分页功能，支持浏览超过100张的历史记录
- 实现了图片加载优化，包括HTTP HEAD请求获取图片大小、渐进式加载和懒加载
- 添加了图片加载过程中的Skeleton骨架屏，提升用户体验

### 变更
- 更新了UI组件导入方式，从单文件导入改为统一模块导入
- 修改了ImageGenerator.vue中的参数初始化逻辑
- 优化了GenerationSettings.vue的用户界面
- 更新了多个视图页面的布局和样式
- 调整了样式表以提升用户体验
- 将NSFW标记移至图片右上角，避免与用户徽章视觉冲突
- 优化了Lightbox预览窗格，使用ShadcnUI风格背景替代黑色背景
- 改进了AI提示词生成功能的SYSTEM_PROMPT，使其更适合图像生成项目
- 修改了提示词增强和标签结构化按钮的文本，使其更准确地反映功能

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
- 修复了Lightbox预览窗格中上一张/下一张功能按钮永远禁用的问题
- 修复了当存在下一页时下一张按钮应该可用的问题
- 修复了NSFW开关无法更新图片标记记录的问题
- 添加了DialogTitle以确保Lightbox对话框的可访问性
- 修复了AI提示词生成功能的响应解析问题
