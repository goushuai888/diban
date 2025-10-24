import { setCORSHeaders, handleOptionsRequest, verifyUser, sendError } from './lib/supabase.js';

// 通用中间件函数
export function withCors(handler) {
  return async (request, response) => {
    // 设置CORS头
    setCORSHeaders(response);

    // 处理OPTIONS预检请求
    if (request.method === 'OPTIONS') {
      return handleOptionsRequest(response);
    }

    // 调用实际处理器
    return handler(request, response);
  };
}

// 需要认证的中间件
export function withAuth(handler) {
  return withCors(async (request, response) => {
    try {
      // 跳过OPTIONS请求
      if (request.method === 'OPTIONS') {
        return handleOptionsRequest(response);
      }

      // 验证用户Token
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return sendError(response, 'Unauthorized', 401);
      }

      const token = authHeader.substring(7);
      const user = await verifyUser(token);

      // 将用户信息添加到请求对象
      request.user = user;

      // 调用实际处理器
      return handler(request, response);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return sendError(response, 'Authentication failed', 401);
    }
  });
}

// 管理员权限中间件
export function withAdminAuth(handler) {
  return withAuth(async (request, response) => {
    try {
      const supabase = (await import('./lib/supabase.js')).getSupabaseClient();

      // 检查用户是否是管理员
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', request.user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        return sendError(response, 'Insufficient permissions', 403);
      }

      return handler(request, response);
    } catch (error) {
      console.error('Admin auth middleware error:', error);
      return sendError(response, 'Permission check failed', 500);
    }
  });
}

// 错误处理中间件
export function withErrorHandling(handler) {
  return async (request, response) => {
    try {
      return await handler(request, response);
    } catch (error) {
      console.error('API Error:', error);
      return sendError(
        response,
        'Internal server error',
        500,
        error instanceof Error ? error.message : String(error)
      );
    }
  };
}

// 组合中间件
export function compose(...middlewares) {
  return (handler) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}