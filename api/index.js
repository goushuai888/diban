// API 路由入口文件
import { withErrorHandling, withCors } from './middleware.js';

// 路由映射
const routes = {
  '/api/auth': () => import('./routes/auth.js'),
  '/api/listings': () => import('./routes/listings.js'),
  '/api/payments': () => import('./routes/payments.js'),
};

export default withErrorHandling(withCors(async (request, response) => {
  const { url, method } = request;

  // 处理OPTIONS预检请求
  if (method === 'OPTIONS') {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response.status(200).end();
  }

  // 解析路径
  const parsedUrl = new URL(url, `http://${request.headers.host}`);
  const pathname = parsedUrl.pathname;

  // 查找匹配的路由
  const routeKey = Object.keys(routes).find(key =>
    pathname.startsWith(key)
  );

  if (!routeKey) {
    return response.status(404).json({
      error: 'API endpoint not found',
      available_endpoints: Object.keys(routes)
    });
  }

  try {
    // 动态导入路由处理器
    const routeModule = await routes[routeKey]();
    const handler = routeModule.default;

    if (!handler) {
      return response.status(500).json({
        error: 'Route handler not found'
      });
    }

    // 调用路由处理器
    return await handler(request, response);
  } catch (error) {
    console.error('Route error:', error);
    return response.status(500).json({
      error: 'Failed to load route handler',
      details: error.message
    });
  }
}));