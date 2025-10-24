-- ========================================
-- 完整的冷静期机制部署脚本（一键执行）
-- 执行顺序：pending_deletions 表 → delete_user 函数 → 清理多余函数
-- ========================================

-- ========================================
-- 第一步：创建 pending_deletions 表
-- ========================================

DROP TABLE IF EXISTS pending_deletions CASCADE;

CREATE TABLE pending_deletions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_deletion_at TIMESTAMPTZ NOT NULL,
  cancel_token TEXT NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pending_deletions_user_id ON pending_deletions(user_id);
CREATE INDEX idx_pending_deletions_scheduled ON pending_deletions(scheduled_deletion_at);

ALTER TABLE pending_deletions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pending deletions"
  ON pending_deletions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can request deletion of their own account"
  ON pending_deletions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel their own account deletion"
  ON pending_deletions FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE pending_deletions IS '待删除账户表：记录用户的删除申请，支持 30 天冷静期机制';


-- ========================================
-- 第二步：创建 delete_user 函数
-- ========================================

DROP FUNCTION IF EXISTS delete_user(UUID);

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
  IF target_user_id IS NULL THEN
    user_to_delete := auth.uid();
  ELSE
    user_to_delete := target_user_id;
  END IF;

  IF user_to_delete IS NULL THEN
    RETURN json_build_object('success', false, 'message', '无法确定要删除的用户，请先登录');
  END IF;

  BEGIN
    DELETE FROM public.pending_deletions WHERE user_id = user_to_delete;
    DELETE FROM auth.users WHERE id = user_to_delete;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    IF deleted_count > 0 THEN
      RETURN json_build_object('success', true, 'message', format('用户 %s 已成功删除', user_to_delete), 'user_id', user_to_delete);
    ELSE
      RETURN json_build_object('success', false, 'message', '用户不存在或已被删除', 'user_id', user_to_delete);
    END IF;

  EXCEPTION
    WHEN insufficient_privilege THEN
      RETURN json_build_object('success', false, 'message', '权限不足：无法删除 auth.users 表中的用户', 'error_code', 'INSUFFICIENT_PRIVILEGE');
    WHEN foreign_key_violation THEN
      RETURN json_build_object('success', false, 'message', '删除失败：存在关联数据未清理', 'error_code', 'FOREIGN_KEY_VIOLATION');
    WHEN OTHERS THEN
      RETURN json_build_object('success', false, 'message', format('删除失败：%s', SQLERRM), 'error_code', SQLSTATE);
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user(UUID) TO service_role;

COMMENT ON FUNCTION delete_user IS '删除用户账户及其相关数据。返回 JSON 格式的执行结果。';


-- ========================================
-- 第三步：清理多余函数
-- ========================================

DROP FUNCTION IF EXISTS delete_user();
DROP FUNCTION IF EXISTS cleanup_user_data(uuid);
DROP FUNCTION IF EXISTS request_account_deletion(text);


-- ========================================
-- 第四步：验证
-- ========================================

SELECT
  'pending_deletions 表已创建' AS status,
  COUNT(*) AS row_count
FROM pending_deletions;

SELECT
  proname AS function_name,
  pg_get_function_arguments(oid) AS arguments
FROM pg_proc
WHERE proname IN ('delete_user', 'cleanup_user_data')
ORDER BY proname;
