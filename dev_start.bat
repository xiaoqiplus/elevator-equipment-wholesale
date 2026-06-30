@echo off
REM 启动 SSH 隧道和 Next.js 开发服务器
echo Starting SSH tunnel...
start /B "" "C:\Program Files\Git\usr\bin\ssh.exe" -i %USERPROFILE%\.ssh\ecs_key -L 5433:localhost:5432 -N root@121.40.125.78
timeout /t 3 /nobreak >nul
echo Starting Next.js dev server on port 3458...
cd /d %USERPROFILE%\.openclaw\workspace\elevator-equipment-wholesale
npx next dev -p 3458
