-- 创建删除用户的 RPC 函数
-- 此函数用于安全地删除用户账户（包括 auth.users 和相关数据）

-- 先删除旧函数（如果存在）
DROP FUNCTION IF EXISTS delete_user(UUID);

-- 创建新函数
CREATE OR REPLACE FUNCTION delete_user(target_user_id UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_to_delete UUID;
  deleted_count INT := 0;
BEGIN
  -- 如果没有传入 user_id，则删除当前登录用户
  IF target_user_id IS NULL THEN
    user_to_delete := auth.uid();
  ELSE
    user_to_delete := target_user_id;
  END IF;

  -- 确保 user_id 不为空
  IF user_to_delete IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', '无法确定要删除的用户，请先登录'
    );
  END IF;

  -- 开始删除流程
  BEGIN
    -- 1. 删除待删除记录（pending_deletions 表）
    DELETE FROM public.pending_deletions WHERE user_id = user_to_delete;

    -- 2. 删除用户相关的业务数据（根据你的数据库结构调整）
    -- 例如：DELETE FROM public.user_profiles WHERE user_id = user_to_delete;
    -- 例如：DELETE FROM public.generations WHERE user_id = user_to_delete;

    -- 3. 删除 auth.users 表中的用户（这是关键步骤）
    DELETE FROM auth.users WHERE id = user_to_delete;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- 检查是否成功删除
    IF deleted_count > 0 THEN
      RETURN json_build_object(
        'success', true,
        'message', format('用户 %s 已成功删除', user_to_delete),
        'user_id', user_to_delete
      );
    ELSE
      RETURN json_build_object(
        'success', false,
        'message', '用户不存在或已被删除',
        'user_id', user_to_delete
      );
    END IF;

  EXCEPTION
    WHEN insufficient_privilege THEN
      -- 权限不足，返回友好错误
      RETURN json_build_object(
        'success', false,
        'message', '权限不足：无法删除 auth.users 表中的用户。请在 Supabase Dashboard 中手动删除或联系管理员。',
        'error_code', 'INSUFFICIENT_PRIVILEGE'
      );
    WHEN foreign_key_violation THEN
      -- 外键约束冲突
      RETURN json_build_object(
        'success', false,
        'message', '删除失败：存在关联数据未清理。请先删除用户的所有相关数据。',
        'error_code', 'FOREIGN_KEY_VIOLATION'
      );
    WHEN OTHERS THEN
      -- 其他未知错误
      RETURN json_build_object(
        'success', false,
        'message', format('删除失败：%s', SQLERRM),
        'error_code', SQLSTATE
      );
  END;
END;
$$;

-- 允许认证用户调用此函数（删除自己的账户）
GRANT EXECUTE ON FUNCTION delete_user(UUID) TO authenticated;

-- 允许 service_role 调用（Edge Function 使用）
GRANT EXECUTE ON FUNCTION delete_user(UUID) TO service_role;

-- 注释
COMMENT ON FUNCTION delete_user IS '删除用户账户及其相关数据（支持传入 user_id 或使用当前登录用户）。返回 JSON 格式的执行结果。';
