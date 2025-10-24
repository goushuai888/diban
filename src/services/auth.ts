// 认证服务 - 基于 Supabase Auth
import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import type { User, AuthError } from '@supabase/supabase-js';

/**
 * 检查 Supabase 是否已配置
 * @returns 配置检查结果
 */
function checkSupabaseConfig() {
  if (!isSupabaseEnabled) {
    return {
      success: false,
      error: null,
      message: 'Supabase 未配置。请在 .env 文件中配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY',
    };
  }
  return null;
}

/**
 * 用户注册
 * @param email 邮箱
 * @param password 密码
 * @returns 注册结果
 */
export async function signUp(email: string, password: string) {
  // 检查 Supabase 配置
  const configCheck = checkSupabaseConfig();
  if (configCheck) return configCheck;

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    return {
      success: true,
      data,
      message: '注册成功！请查收邮箱验证邮件。',
    };
  } catch (error) {
    const authError = error as AuthError;
    return {
      success: false,
      error: authError,
      message: getErrorMessage(authError),
    };
  }
}

/**
 * 用户登录
 * @param email 邮箱
 * @param password 密码
 * @returns 登录结果
 */
export async function signIn(email: string, password: string) {
  // 检查 Supabase 配置
  const configCheck = checkSupabaseConfig();
  if (configCheck) return configCheck;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // 登录成功后，将用户ID存储到localStorage
    if (data.user) {
      localStorage.setItem('fal-ai-user-id', data.user.id);
    }

    return {
      success: true,
      data,
      message: '登录成功！',
    };
  } catch (error) {
    const authError = error as AuthError;
    return {
      success: false,
      error: authError,
      message: getErrorMessage(authError),
    };
  }
}

/**
 * 用户登出
 * @returns 登出结果
 */
export async function signOut() {
  // 检查 Supabase 配置
  const configCheck = checkSupabaseConfig();
  if (configCheck) return configCheck;

  try {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    // 清除localStorage中的用户ID
    localStorage.removeItem('fal-ai-user-id');

    return {
      success: true,
      message: '登出成功！',
    };
  } catch (error) {
    const authError = error as AuthError;
    return {
      success: false,
      error: authError,
      message: getErrorMessage(authError),
    };
  }
}

/**
 * 获取当前用户
 * @returns 当前登录用户
 */
export async function getCurrentUser(): Promise<User | null> {
  // 如果 Supabase 未配置，直接返回 null
  if (!isSupabaseEnabled) {
    return null;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('获取当前用户失败:', error);
    return null;
  }
}

/**
 * 发送密码重置邮件
 * @param email 邮箱
 * @returns 发送结果
 */
export async function resetPassword(email: string) {
  // 检查 Supabase 配置
  const configCheck = checkSupabaseConfig();
  if (configCheck) return configCheck;

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;

    return {
      success: true,
      message: '密码重置邮件已发送，请查收邮箱。',
    };
  } catch (error) {
    const authError = error as AuthError;
    return {
      success: false,
      error: authError,
      message: getErrorMessage(authError),
    };
  }
}

/**
 * 更新密码（用于重置密码流程，无需验证旧密码）
 * @param newPassword 新密码
 * @returns 更新结果
 */
export async function updatePassword(newPassword: string) {
  // 检查 Supabase 配置
  const configCheck = checkSupabaseConfig();
  if (configCheck) return configCheck;

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;

    return {
      success: true,
      message: '密码更新成功！',
    };
  } catch (error) {
    const authError = error as AuthError;
    return {
      success: false,
      error: authError,
      message: getErrorMessage(authError),
    };
  }
}

/**
 * 修改密码（已登录状态，需要验证旧密码）
 * @param email 用户邮箱
 * @param oldPassword 旧密码
 * @param newPassword 新密码
 * @returns 修改结果
 */
export async function changePassword(email: string, oldPassword: string, newPassword: string) {
  // 检查 Supabase 配置
  const configCheck = checkSupabaseConfig();
  if (configCheck) return configCheck;

  try {
    // 首先验证旧密码是否正确
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: oldPassword,
    });

    if (signInError) {
      return {
        success: false,
        error: signInError,
        message: '旧密码错误',
      };
    }

    // 旧密码验证成功，更新为新密码
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) throw updateError;

    return {
      success: true,
      message: '密码修改成功！',
    };
  } catch (error) {
    const authError = error as AuthError;
    return {
      success: false,
      error: authError,
      message: getErrorMessage(authError),
    };
  }
}

/**
 * 更新用户邮箱
 * @param newEmail 新邮箱
 * @returns 更新结果
 */
export async function updateEmail(newEmail: string) {
  // 检查 Supabase 配置
  const configCheck = checkSupabaseConfig();
  if (configCheck) return configCheck;

  try {
    const { error } = await supabase.auth.updateUser({
      email: newEmail,
    });

    if (error) throw error;

    return {
      success: true,
      message: '邮箱更新成功！验证邮件已发送到新邮箱，请查收。',
    };
  } catch (error) {
    const authError = error as AuthError;
    return {
      success: false,
      error: authError,
      message: getErrorMessage(authError),
    };
  }
}

/**
 * 检查账户是否处于待删除状态
 * @returns 待删除信息
 */
export async function getPendingDeletion() {
  // 检查 Supabase 配置
  const configCheck = checkSupabaseConfig();
  if (configCheck) return null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('pending_deletions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // 如果是 PGRST116 错误（未找到记录），返回 null 而不是错误
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('检查待删除状态失败:', error);
    return null;
  }
}

/**
 * 申请删除账户（进入 30 天冷静期）
 * @param reason 删除原因（可选）
 * @returns 申请结果
 */
export async function requestAccountDeletion(reason?: string) {
  // 检查 Supabase 配置
  const configCheck = checkSupabaseConfig();
  if (configCheck) return configCheck;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        message: '请先登录',
      };
    }

    // 检查是否已经申请过删除
    const existingDeletion = await getPendingDeletion();
    if (existingDeletion) {
      return {
        success: false,
        message: '您已经申请过删除账户，请勿重复操作',
      };
    }

    // 计算删除时间（30 天后）
    const scheduledDeletionAt = new Date();
    scheduledDeletionAt.setDate(scheduledDeletionAt.getDate() + 30);

    // 生成取消令牌
    const cancelToken = crypto.randomUUID();

    // 插入待删除记录
    const { error } = await supabase
      .from('pending_deletions')
      .insert({
        user_id: user.id,
        scheduled_deletion_at: scheduledDeletionAt.toISOString(),
        cancel_token: cancelToken,
        reason: reason || null,
      });

    if (error) throw error;

    return {
      success: true,
      message: '删除申请已提交。您的账户将在 30 天后被永久删除，期间您可以随时取消删除。',
      data: {
        scheduledDeletionAt: scheduledDeletionAt.toISOString(),
        cancelToken,
      },
    };
  } catch (error) {
    const authError = error as AuthError;
    return {
      success: false,
      error: authError,
      message: getErrorMessage(authError),
    };
  }
}

/**
 * 取消账户删除申请
 * @returns 取消结果
 */
export async function cancelAccountDeletion() {
  // 检查 Supabase 配置
  const configCheck = checkSupabaseConfig();
  if (configCheck) return configCheck;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        message: '请先登录',
      };
    }

    // 删除待删除记录
    const { error } = await supabase
      .from('pending_deletions')
      .delete()
      .eq('user_id', user.id);

    if (error) throw error;

    return {
      success: true,
      message: '删除申请已取消，您的账户将继续保留。',
    };
  } catch (error) {
    const authError = error as AuthError;
    return {
      success: false,
      error: authError,
      message: getErrorMessage(authError),
    };
  }
}

/**
 * 立即删除用户账户（仅供管理员或定时任务调用，绕过冷静期）
 * @returns 删除结果
 */
export async function deleteAccountImmediately() {
  // 检查 Supabase 配置
  const configCheck = checkSupabaseConfig();
  if (configCheck) return configCheck;

  try {
    // 尝试调用 RPC 函数删除用户
    const { error } = await supabase.rpc('delete_user');

    if (error) {
      // 如果没有配置 RPC 函数，提供降级方案：只删除本地数据和登出
      if (error.message.includes('function') || error.code === '42883') {
        // 清除本地存储的数据
        localStorage.removeItem('fal-ai-user-id');
        localStorage.removeItem('fal-ai-generations');
        localStorage.removeItem('fal-ai-api-keys');
        localStorage.removeItem('fal-ai-active-key-index');
        localStorage.removeItem('fal-ai-active-key');

        // 登出用户
        await signOut();

        return {
          success: true,
          message: '本地数据已清除并已登出。注意：账户仍存在于服务器，如需完全删除请在 Supabase Dashboard 中手动删除。',
        };
      }
      throw error;
    }

    // RPC 函数执行成功，删除本地数据并登出
    localStorage.removeItem('fal-ai-user-id');
    localStorage.removeItem('fal-ai-generations');

    await signOut();

    return {
      success: true,
      message: '账户已成功删除',
    };
  } catch (error) {
    const authError = error as AuthError;
    return {
      success: false,
      error: authError,
      message: getErrorMessage(authError),
    };
  }
}

/**
 * 删除用户账户（保留旧函数名，调用新的申请删除）
 * @deprecated 请使用 requestAccountDeletion 替代
 * @returns 删除结果
 */
export async function deleteAccount() {
  return requestAccountDeletion();
}

/**
 * 获取友好的错误消息
 * @param error Supabase 认证错误
 * @returns 错误消息
 */
function getErrorMessage(error: AuthError): string {
  // 常见错误消息映射
  const errorMessages: Record<string, string> = {
    'Invalid login credentials': '邮箱或密码错误',
    'Email not confirmed': '邮箱未验证，请查收验证邮件',
    'User already registered': '该邮箱已被注册',
    'Password should be at least 6 characters': '密码至少需要 6 个字符',
    'Unable to validate email address: invalid format': '邮箱格式不正确',
    'Email rate limit exceeded': '邮件发送过于频繁，请稍后再试',
  };

  // 返回映射的错误消息，如果没有映射则返回原始消息
  return errorMessages[error.message] || error.message || '操作失败，请重试';
}
