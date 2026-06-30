#!/usr/bin/env python3
"""电梯配件电商 — Supabase 数据库备份脚本

先用 pg_dump（需要 DIRECT_URL 5432端口），失败后用 psycopg2 兜底。
"""
import os, sys, gzip, subprocess, json, urllib.request
from datetime import datetime, timedelta
from pathlib import Path

BACKUP_DIR = Path('/opt/backup/dumps')
RETENTION_DAYS = 30

def load_config():
    env_file = Path('/opt/backup/.backup-env')
    if not env_file.exists():
        print('[ERROR] 配置文件 /opt/backup/.backup-env 不存在')
        print('请先配置数据库连接信息')
        sys.exit(1)
    config = {}
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                key, val = line.split('=', 1)
                config[key.strip()] = val.strip().strip('"').strip("'")
    return config

def wake_supabase(project_ref):
    """尝试唤醒 Supabase 数据库（免费版不活跃7天后会暂停）"""
    try:
        url = f"https://{project_ref}.supabase.co/rest/v1/"
        req = urllib.request.Request(url, method='GET')
        with urllib.request.urlopen(req, timeout=10) as resp:
            print(f'[INFO] Supabase 项目可达 (HTTP {resp.status})')
            return True
    except urllib.error.HTTPError as e:
        if e.code == 401:
            print(f'[INFO] Supabase 项目活跃 (需要认证)')
            return True
        print(f'[WARN] Supabase 项目状态: HTTP {e.code}')
        return False
    except Exception as e:
        print(f'[WARN] Supabase 项目不可达: {e}')
        return False

def backup_pg_dump(dsn):
    """pg_dump 方式"""
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    date_tag = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_file = BACKUP_DIR / f'elevator-db-backup-{date_tag}.sql.gz'

    print('[INFO] 尝试 pg_dump...')

    # 将连接串中的 6543(pgbouncer 端口) 换成 5432
    dsn_pg = dsn.replace(':6543/', ':5432/')

    try:
        result = subprocess.run(
            ['pg_dump', '--dbname', dsn_pg, '--no-owner', '--no-acl', '--format', 'custom'],
            capture_output=True, text=False, timeout=120,
            env={**os.environ, 'PGSSLMODE': 'require'}
        )
        if result.returncode != 0:
            stderr = result.stderr.decode('latin-1', errors='replace')[:200]
            print(f'[WARN] pg_dump 失败: {stderr}')
            return None

        # custom format -> plain SQL -> gzip
        tmp_custom = BACKUP_DIR / f'tmp-{date_tag}.custom'
        tmp_custom.write_bytes(result.stdout)

        with open(backup_file, 'wb') as f_out:
            with gzip.GzipFile(fileobj=f_out, mode='wb') as gz:
                restore = subprocess.Popen(
                    ['pg_restore', str(tmp_custom)], stdout=subprocess.PIPE, stderr=subprocess.PIPE
                )
                stdout, _ = restore.communicate(timeout=120)
                gz.write(stdout)

        tmp_custom.unlink(missing_ok=True)
        size = backup_file.stat().st_size
        if size > 100:
            print(f'[OK] pg_dump 备份完成 ({size} bytes)')
            return backup_file
        backup_file.unlink(missing_ok=True)
        return None
    except FileNotFoundError:
        print('[WARN] pg_dump 未安装')
        return None
    except Exception as e:
        print(f'[WARN] pg_dump 异常: {e}')
        return None

def backup_psycopg2(dsn):
    """psycopg2 方式（pg_dump 不可用时的 fallback）"""
    try:
        import psycopg2
    except ImportError:
        print('[WARN] psycopg2 未安装')
        return None

    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    date_tag = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_file = BACKUP_DIR / f'elevator-db-backup-{date_tag}.sql.gz'

    print('[INFO] 尝试 psycopg2...')

    try:
        conn = psycopg2.connect(dsn, sslmode='require', connect_timeout=10)
        cur = conn.cursor()
        cur.execute("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")
        tables = [r[0] for r in cur.fetchall()]

        if not tables:
            print('[WARN] 数据库无表')
            conn.close()
            return None

        with gzip.open(backup_file, 'wt', encoding='utf-8') as gz:
            gz.write(f'-- Elevator Equipment Wholesale Backup\n')
            gz.write(f'-- Date: {datetime.now().isoformat()}\n')
            gz.write(f'-- Tables: {len(tables)}\n\n')
            for tbl in tables:
                print(f'  -> {tbl}')
                cur.execute(f'SELECT * FROM public."{tbl}"')
                rows = cur.fetchall()
                cols = [d[0] for d in cur.description]
                gz.write(f'-- {tbl} ({len(rows)} rows)\n')
                for row in rows:
                    vals = []
                    for v in row:
                        if v is None: vals.append('NULL')
                        elif isinstance(v, (int, float)): vals.append(str(v))
                        else:
                            sq = chr(39)
                            vals.append(f"{sq}{str(v).replace(sq, sq+sq)}{sq}")
                    gz.write(f'INSERT INTO "{tbl}" (')
                    col_parts = []
                    for c in cols:
                        col_parts.append(f'"{c}"')
                    gz.write(', '.join(col_parts))
                    gz.write(') VALUES (')
                    gz.write(', '.join(vals))
                    gz.write(');\n')
                gz.write('\n')
        conn.close()
        size = backup_file.stat().st_size
        print(f'[OK] psycopg2 备份完成 ({size} bytes, {len(tables)} 张表)')
        return backup_file
    except Exception as e:
        print(f'[ERROR] psycopg2 失败: {e}')
        if backup_file.exists(): backup_file.unlink()
        return None

def clean_old():
    cutoff = datetime.now() - timedelta(days=RETENTION_DAYS)
    for f in BACKUP_DIR.glob('elevator-db-backup-*.sql.gz'):
        if datetime.fromtimestamp(f.stat().st_mtime) < cutoff:
            f.unlink()
            print(f'[INFO] 清理旧备份: {f.name}')

def main():
    now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f'[{now_str}] 开始备份数据库...')

    config = load_config()
    dsn = config.get('SUPABASE_URL', '')

    if not dsn:
        print('[ERROR] SUPABASE_URL 未配置')
        sys.exit(1)

    # 尝试唤醒数据库
    if 'dfjfugfqqdshapspvfzy' in dsn:
        wake_supabase('dfjfugfqqdshapspvfzy')

    result = backup_psycopg2(dsn)
    if not result:
        result = backup_pg_dump(dsn)

    if result:
        print(f'[OK] 备份成功: {result}')
    else:
        print('[ERROR] 所有备份方式均失败。请检查 Supabase 数据库状态：')
        print('  1. 登录 https://supabase.com/dashboard 查看项目是否被暂停')
        print('  2. 如已暂停，在仪表盘点击「Restore」唤醒数据库')
        print('  3. 检查项目设置 → Database → Connection string 确认密码')
        sys.exit(1)

    clean_old()
    now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f'[{now_str}] 备份流程完成 ✅')

if __name__ == '__main__':
    main()
