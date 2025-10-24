import { createClient } from '@supabase/supabase-js';

// Supabase 客户端单例
let supabase = null;

export function getSupabaseClient() {
  if (!supabase) {
    supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );
  }
  return supabase;
}

// 验证用户Token
export async function verifyUser(token) {
  if (!token) {
    throw new Error('No token provided');
  }

  const supabase = getSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error('Invalid token');
  }

  return user;
}

// 设置CORS头
export function setCORSHeaders(response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// 处理OPTIONS预检请求
export function handleOptionsRequest(response) {
  setCORSHeaders(response);
  return response.status(200).end();
}

// 统一错误响应
export function sendError(response, message, status = 500, details = null) {
  return response.status(status).json({
    error: message,
    ...(details && { details })
  });
}

// 统一成功响应
export function sendSuccess(response, data, message = 'Success') {
  return response.status(200).json({
    message,
    data
  });
}