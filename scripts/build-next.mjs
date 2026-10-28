#!/usr/bin/env node
/**
 * Hostinger 共享主机专用 `next build` 包装器
 * ---------------------------------------------------------------------------
 * 背景（2026-10-27 / 10-28 排查）：
 *   Hostinger 构建容器按 CPU 数并行 fork 静态生成 worker，worker 内部的 Rust
 *   (tokio / rayon) 线程池也按 CPU 数开线程，撞上共享主机的进程/线程上限：
 *     OS can't spawn worker thread: Resource temporarily unavailable (os error 11)
 *     → panic → SIGABRT → "Failed to build the application"
 *   next.config.mjs 里的 `experimental.cpus: 1` + `workerThreads: false` 只压住了
 *   *进程*并行度；Rust/libuv 的线程池大小仍由容器 CPU 数决定，所以还会复发。
 *
 * 本脚本做两件事，都不改变构建产物：
 *   1. 把 Rust 线程池与 libuv 线程池钉死为 1（环境变量会被 Next 传给 worker 子进程，
 *      见 next/dist/build/index.js 的 forkOptions.env 透传 process.env）。
 *   2. 构建失败后自动重试（默认 3 次，间隔 15s）。这类 EAGAIN 是瞬时资源争用，
 *      重试通常就能过；真正的代码错误重试也是失败，不会掩盖问题（退出码照传）。
 *
 * 可用环境变量覆盖：
 *   NEXT_BUILD_ATTEMPTS        总尝试次数（默认 3）
 *   NEXT_BUILD_RETRY_DELAY_MS  每次重试前等待（默认 15000）
 *   NEXT_BIN                   直接指定 next CLI 路径（调试用）
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

const cwd = process.cwd();

function intEnv(name, fallback, min) {
  const raw = process.env[name];
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, n);
}

const attempts = intEnv("NEXT_BUILD_ATTEMPTS", 3, 1);
const retryDelayMs = intEnv("NEXT_BUILD_RETRY_DELAY_MS", 15000, 0);

function resolveNextBin() {
  if (process.env.NEXT_BIN) return process.env.NEXT_BIN;
  const require = createRequire(path.join(cwd, "package.json"));
  return require.resolve("next/dist/bin/next");
}

// 关键：这三项让 Rust(tokio/rayon) 与 libuv 都只开 1 个线程
const childEnv = {
  ...process.env,
  TOKIO_WORKER_THREADS: "1",
  RAYON_NUM_THREADS: "1",
  UV_THREADPOOL_SIZE: "1",
  NEXT_TELEMETRY_DISABLED: "1",
};

function log(msg) {
  console.log(`[build-next] ${msg}`);
}

function sleepSync(ms) {
  if (ms <= 0) return;
  log(`等待 ${Math.round(ms / 1000)}s 再重试…`);
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

let nextBin;
try {
  nextBin = resolveNextBin();
} catch (err) {
  console.error(
    `[build-next] 找不到 next CLI（是否忘了 npm install？）：${err instanceof Error ? err.message : err}`
  );
  process.exit(1);
}

log(`node ${process.version} · next CLI: ${nextBin}`);
log(`线程上限 TOKIO_WORKER_THREADS=1 RAYON_NUM_THREADS=1 UV_THREADPOOL_SIZE=1`);
log(`最多尝试 ${attempts} 次，重试间隔 ${retryDelayMs}ms`);

let lastStatus = null;
for (let attempt = 1; attempt <= attempts; attempt++) {
  const startedAt = Date.now();
  log(`第 ${attempt}/${attempts} 次构建开始 ${new Date().toISOString()}`);

  const result = spawnSync(process.execPath, [nextBin, "build"], {
    stdio: "inherit",
    env: childEnv,
    cwd,
  });

  const seconds = Math.round((Date.now() - startedAt) / 1000);

  if (result.error) {
    lastStatus = 1;
    console.error(
      `[build-next] 第 ${attempt} 次：进程启动失败 ${result.error.message}（${seconds}s）`
    );
  } else if (result.status === 0) {
    log(`第 ${attempt} 次构建成功，用时 ${seconds}s`);
    process.exit(0);
  } else {
    lastStatus = result.status ?? 1;
    const signal = result.signal ? ` 信号 ${result.signal}` : "";
    console.error(
      `[build-next] 第 ${attempt} 次构建失败：退出码 ${lastStatus}${signal}（${seconds}s）`
    );
  }

  if (attempt < attempts) {
    // 不删 .next：next build 自己会清理，删除只会让重试变慢
    sleepSync(retryDelayMs);
  }
}

console.error(`[build-next] ${attempts} 次尝试全部失败，放弃。`);
process.exit(lastStatus ?? 1);
