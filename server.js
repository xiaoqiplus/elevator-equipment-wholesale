// Hostinger startup script - ensures DATABASE_URL is set before starting Next.js
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Read .env file if it exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

// Hard-coded fallback
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'mysql://u899509956_elevator_user:QuickEase2024%21@127.0.0.1:3306/u899509956_elevator_db';
}

console.log('[startup] DATABASE_URL configured. Starting Next.js...');

// Run next start with the inherited + modified env
const child = spawn('npx', ['next', 'start'], {
  stdio: 'inherit',
  env: process.env,
  cwd: __dirname,
});

child.on('exit', (code) => {
  console.log('[startup] Next.js exited with code:', code);
  process.exit(code);
});
