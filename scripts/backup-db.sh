#!/bin/bash
# ─── Supabase PostgreSQL 自动备份脚本 ─────────────────────────────────────────
# 用法: 在 .backup-env 中配置以下变量后，添加 cron 每天执行
#
# 配置示例:
#   SUPABASE_URL="postgresql://postgres.project:password@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
#   OSS_ENDPOINT="oss-cn-hangzhou.aliyuncs.com"
#   OSS_BUCKET="elevator-backup"
#   OSS_ACCESS_KEY_ID="your-key"
#   OSS_ACCESS_KEY_SECRET="your-secret"
#
# 备份保留天数
RETENTION_DAYS=30

# 持久化备份目录（非/tmp，ECS重启不丢）
BACKUP_DIR="/opt/backup/dumps"

# 加载配置
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$SCRIPT_DIR/.backup-env" ]; then
  source "$SCRIPT_DIR/.backup-env"
else
  echo "[ERROR] 找不到配置文件: $SCRIPT_DIR/.backup-env"
  echo "请复制 .backup-env.example 为 .backup-env 并填入数据库地址和 OSS 配置"
  exit 1
fi

# 必要变量检查
if [ -z "$SUPABASE_URL" ]; then
  echo "[ERROR] SUPABASE_URL 未配置"
  exit 1
fi

# ── 确保备份目录存在
mkdir -p "$BACKUP_DIR"

# 生成文件名
DATE_TAG=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/elevator-db-backup-${DATE_TAG}.sql.gz"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始备份数据库..."

# 1. pg_dump 导出并压缩
# 使用 DIRECT_URL 而非 DATABASE_URL（pgbouncer 不支持 pg_dump）
# 注意：如你的 Supabase 配置了 DIRECT_URL 使用 5432 端口而非 6543，请替换
pg_dump \
  --dbname="$SUPABASE_URL" \
  --no-owner \
  --no-acl \
  --format=custom \
  2>/dev/null | gzip > "$BACKUP_FILE"

BACKUP_EXIT=$?
if [ $BACKUP_EXIT -ne 0 ]; then
  echo "[ERROR] pg_dump 失败 (exit code: $BACKUP_EXIT)"
  rm -f "$BACKUP_FILE"
  exit 1
fi

BACKUP_SIZE=$(stat -c%s "$BACKUP_FILE" 2>/dev/null || stat -f%z "$BACKUP_FILE" 2>/dev/null)
echo "[OK] 备份完成: $BACKUP_FILE ($(numfmt --to=iec $BACKUP_SIZE 2>/dev/null || echo ${BACKUP_SIZE}B))"

# 2. 上传到 OSS（如果已配置）
if [ -n "$OSS_ENDPOINT" ] && [ -n "$OSS_BUCKET" ] && [ -n "$OSS_ACCESS_KEY_ID" ] && [ -n "$OSS_ACCESS_KEY_SECRET" ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 上传到 OSS://${OSS_BUCKET}/backups/..."

  OSS_REMOTE_PATH="oss://${OSS_BUCKET}/db-backups/elevator-${DATE_TAG}.sql.gz"

  /usr/local/bin/ossutil \
    -e "$OSS_ENDPOINT" \
    -i "$OSS_ACCESS_KEY_ID" \
    -k "$OSS_ACCESS_KEY_SECRET" \
    cp "$BACKUP_FILE" "$OSS_REMOTE_PATH" \
    2>&1

  OSS_EXIT=$?
  if [ $OSS_EXIT -eq 0 ]; then
    echo "[OK] OSS 上传成功: $OSS_REMOTE_PATH"
    # 删除本地临时文件
    rm -f "$BACKUP_FILE"
  else
    echo "[WARN] OSS 上传失败，备份文件保留在本地: $BACKUP_FILE"
  fi

  # 3. 清理 OSS 上超过保留天数的旧备份
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 清理 ${RETENTION_DAYS} 天前的旧备份..."
  /usr/local/bin/ossutil \
    -e "$OSS_ENDPOINT" \
    -i "$OSS_ACCESS_KEY_ID" \
    -k "$OSS_ACCESS_KEY_SECRET" \
    rm "oss://${OSS_BUCKET}/db-backups/" --all-versions \
    --include "*.sql.gz" \
    --age "$((RETENTION_DAYS * 86400))" \
    2>&1 | grep -v "^\|" || true
else
  echo "[WARN] OSS 未配置，备份文件仅保留在本地: $BACKUP_FILE"
  echo "提示: 配置 OSS_ENDPOINT/OSS_BUCKET/OSS_ACCESS_KEY_ID/OSS_ACCESS_KEY_SECRET 后会自动上传"
fi

# 4. 清理本地超过保留天数的旧备份
find "$BACKUP_DIR" -name 'elevator-db-backup-*.sql.gz' -mtime "+${RETENTION_DAYS}" -delete 2>/dev/null

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 备份流程完成 ✅"
