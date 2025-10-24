-- 清理多余的函数，避免冲突
-- 执行此脚本前，请确认你想使用哪个方案（方案 A 或方案 B）

-- ========================================
-- 方案 A：使用 delete_user(uuid) RPC 函数
-- ========================================
-- 如果你选择方案 A，执行以下 SQL：

-- 1. 删除旧的无参数版本
DROP FUNCTION IF EXISTS delete_user();

-- 2. 删除降级方案的函数
DROP FUNCTION IF EXISTS cleanup_user_data(uuid);

-- 3. 删除未知的 request_account_deletion 函数
DROP FUNCTION IF EXISTS request_account_deletion(text);

-- 4. 保留 delete_user(uuid) - 这个是主力函数
-- （不需要删除，已存在）


-- ========================================
-- 方案 B：使用 cleanup_user_data(uuid) + Admin API
-- ========================================
-- 如果你选择方案 B（方案 A 报权限错误），执行以下 SQL：

/*
-- 1. 删除旧的 delete_user 函数（所有版本）
DROP FUNCTION IF EXISTS delete_user();
DROP FUNCTION IF EXISTS delete_user(uuid);

-- 2. 删除未知的 request_account_deletion 函数
DROP FUNCTION IF EXISTS request_account_deletion(text);

-- 3. 保留 cleanup_user_data(uuid) - 这个是主力函数
-- （不需要删除，已存在）
*/


-- ========================================
-- 验证：查看剩余函数
-- ========================================
SELECT
  proname AS function_name,
  pg_get_function_arguments(oid) AS arguments,
  pg_get_functiondef(oid) AS definition
FROM pg_proc
WHERE proname IN ('delete_user', 'cleanup_user_data', 'request_account_deletion')
ORDER BY proname, arguments;
