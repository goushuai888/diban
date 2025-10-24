-- 降级方案：如果无法创建 delete_user RPC 函数
-- 使用 Supabase Admin API 在 Edge Function 中删除用户

-- 创建一个轻量级的清理函数（只清理业务数据，不删除 auth.users）
CREATE OR REPLACE FUNCTION cleanup_user_data(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 删除待删除记录
  DELETE FROM public.pending_deletions WHERE user_id = target_user_id;

  -- 删除用户相关的业务数据（根据你的数据库结构调整）
  -- 例如：DELETE FROM public.user_profiles WHERE user_id = target_user_id;
  -- 例如：DELETE FROM public.generations WHERE user_id = target_user_id;

  RETURN json_build_object(
    'success', true,
    'message', format('用户 %s 的业务数据已清理', target_user_id),
    'user_id', target_user_id
  );
END;
$$;

-- 授权
GRANT EXECUTE ON FUNCTION cleanup_user_data(UUID) TO service_role;

-- 注释
COMMENT ON FUNCTION cleanup_user_data IS '清理用户的业务数据（不包括 auth.users，需要使用 Supabase Admin API 删除）';
