-- 冷静期机制：待删除账户表
-- 用户申请删除后进入 30 天冷静期，期间可以取消删除
-- 修复版：使用英文策略名称

-- 先删除旧表（如果存在）
DROP TABLE IF EXISTS pending_deletions CASCADE;

-- 创建表
CREATE TABLE pending_deletions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_deletion_at TIMESTAMPTZ NOT NULL,
  cancel_token TEXT NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引优化
CREATE INDEX idx_pending_deletions_user_id
  ON pending_deletions(user_id);

CREATE INDEX idx_pending_deletions_scheduled
  ON pending_deletions(scheduled_deletion_at);

-- Row Level Security (RLS)
ALTER TABLE pending_deletions ENABLE ROW LEVEL SECURITY;

-- 策略：用户只能查看自己的待删除记录
CREATE POLICY "Users can view their own pending deletions"
  ON pending_deletions
  FOR SELECT
  USING (auth.uid() = user_id);

-- 策略：用户只能插入自己的待删除记录
CREATE POLICY "Users can request deletion of their own account"
  ON pending_deletions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 策略：用户只能删除自己的待删除记录（用于取消删除）
CREATE POLICY "Users can cancel their own account deletion"
  ON pending_deletions
  FOR DELETE
  USING (auth.uid() = user_id);

-- 注释（注释可以用中文）
COMMENT ON TABLE pending_deletions IS '待删除账户表：记录用户的删除申请，支持 30 天冷静期机制';
COMMENT ON COLUMN pending_deletions.id IS '主键 UUID';
COMMENT ON COLUMN pending_deletions.user_id IS '用户 ID（关联 auth.users）';
COMMENT ON COLUMN pending_deletions.requested_at IS '申请删除时间';
COMMENT ON COLUMN pending_deletions.scheduled_deletion_at IS '计划删除时间（申请时间 + 30 天）';
COMMENT ON COLUMN pending_deletions.cancel_token IS '取消令牌（UUID 格式，用于邮件链接或前端取消操作）';
COMMENT ON COLUMN pending_deletions.reason IS '删除原因（可选，用于产品改进）';
COMMENT ON COLUMN pending_deletions.created_at IS '记录创建时间';
