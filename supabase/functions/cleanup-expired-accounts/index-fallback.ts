// Supabase Edge Function: 定时清理过期账户（降级方案）
// 使用 Supabase Admin API 删除用户（不依赖 delete_user RPC 函数）

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface PendingDeletion {
  id: string;
  user_id: string;
  scheduled_deletion_at: string;
}

serve(async (req: Request) => {
  try {
    // 获取 Supabase 客户端
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('缺少 Supabase 环境变量');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 获取当前时间
    const now = new Date().toISOString();

    // 查询所有已过期的待删除账户
    const { data: expiredAccounts, error: fetchError } = await supabase
      .from('pending_deletions')
      .select('*')
      .lte('scheduled_deletion_at', now);

    if (fetchError) {
      throw new Error(`获取过期账户失败: ${fetchError.message}`);
    }

    if (!expiredAccounts || expiredAccounts.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: '没有需要删除的过期账户',
          deleted: 0,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log(`发现 ${expiredAccounts.length} 个过期账户待删除`);

    // 记录删除结果
    const results = {
      total: expiredAccounts.length,
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // 逐个删除账户
    for (const account of expiredAccounts as PendingDeletion[]) {
      try {
        console.log(`正在删除账户: ${account.user_id}`);

        // 方案1：使用 Supabase Admin API 删除用户（推荐）
        const { data: deleteData, error: deleteError } = await supabase.auth.admin.deleteUser(
          account.user_id
        );

        if (deleteError) {
          throw new Error(`删除用户失败: ${deleteError.message}`);
        }

        // 删除成功后，清理业务数据和待删除记录
        // 1. 清理业务数据（如果有 cleanup_user_data 函数）
        const { error: cleanupError } = await supabase.rpc('cleanup_user_data', {
          target_user_id: account.user_id,
        });

        if (cleanupError) {
          console.warn(`清理业务数据失败: ${cleanupError.message}`);
        }

        // 2. 删除待删除记录
        const { error: removePendingError } = await supabase
          .from('pending_deletions')
          .delete()
          .eq('id', account.id);

        if (removePendingError) {
          console.warn(`移除待删除记录失败: ${removePendingError.message}`);
        }

        results.success++;
        console.log(`✅ 账户删除成功: ${account.user_id}`);
      } catch (error) {
        results.failed++;
        const errorMsg = `账户 ${account.user_id} 删除失败: ${error.message}`;
        results.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    // 返回执行结果
    return new Response(
      JSON.stringify({
        success: true,
        message: `账户清理完成`,
        results,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Edge Function 执行失败:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
