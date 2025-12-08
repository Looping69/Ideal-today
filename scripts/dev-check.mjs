import os from 'os';
import fs from 'fs';
import http from 'http';
import { spawn } from 'child_process';
import { createClient } from '@supabase/supabase-js';

/**
 * Runs a series of environment and service diagnostics, then starts the dev server.
 * Inputs: reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from process.env or `.env/.env.local`
 * Outputs: prints emoji-rich status lines; starts Vite dev and shows URL once reachable
 */
async function main() {
  banner('🚀 Starting IdealToday Dev Check');

  const port = 5173;
  const host = 'localhost';

  const env = loadEnvVars(['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']);
  section('🔧 Environment');
  info(`OS: ${os.platform()} ${os.release()}`);
  info(`Node: ${process.version}`);

  section('🔑 Supabase Env');
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    fail('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    process.exitCode = 1;
    return;
  }
  ok('Env variables present');

  section('🌐 Supabase Connectivity');
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) warn(`Profiles query restricted: ${error.message}`);
    else ok(`Profiles query ok (${data?.length || 0} rows)`);

    const buckets = await supabase.storage.listBuckets();
    if ('error' in buckets && buckets.error) warn(`Storage buckets error: ${buckets.error.message}`);
    else ok(`Storage buckets: ${(buckets.data || []).map(b => b.name).join(', ') || 'none'}`);

    const tables = ['properties', 'bookings', 'messages', 'referrals', 'wishlists', 'reviews'];
    for (const t of tables) {
      const { error: te } = await supabase.from(t).select('count', { count: 'exact', head: true });
      if (te) warn(`Table ${t}: ${te.message}`);
      else ok(`Table ${t}: accessible`);
    }
  } catch (e) {
    fail(`Supabase connectivity failed: ${e.message}`);
  }

  section('🧪 Port Check');
  const free = await isPortFree(port);
  if (!free) {
    warn(`Port ${port} in use. Will try strict binding and fail fast.`);
  } else ok(`Port ${port} is free`);

  section('🏁 Launch Dev Server');
  const child = await startDev(port);

  const url = `http://${host}:${port}/`;
  await waitForHttp(url, 60_000);
  ok(`Dev server reachable at ${url}`);
}

/**
 * Prints a section banner
 */
function section(title) { console.log(`\n${title}`); }
/**
 * Prints a success line
 */
function ok(msg) { console.log(`✅ ${msg}`); }
/**
 * Prints a warning line
 */
function warn(msg) { console.log(`⚠️  ${msg}`); }
/**
 * Prints a failure line
 */
function fail(msg) { console.log(`❌ ${msg}`); }
/**
 * Prints the startup banner
 */
function banner(msg) { console.log(`\n==============================\n${msg}\n==============================`); }
/**
 * Prints an info line
 */
function info(msg) { console.log(`ℹ️  ${msg}`); }

/**
 * Loads env vars from process.env; falls back to `.env.local` then `.env` if missing.
 * Inputs: array of keys
 * Outputs: object with keys mapped to values
 */
function loadEnvVars(keys) {
  const result = {};
  for (const k of keys) result[k] = process.env[k];
  if (Object.values(result).some(v => !v)) {
    const candidates = ['.env.local', '.env'];
    for (const file of candidates) {
      if (fs.existsSync(file)) {
        const text = fs.readFileSync(file, 'utf8');
        for (const line of text.split(/\r?\n/)) {
          const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
          if (!m) continue;
          const [, key, val] = m;
          if (keys.includes(key) && !result[key]) result[key] = val.trim();
        }
      }
    }
  }
  return result;
}

/**
 * Checks if a port is free
 * Inputs: port number
 * Outputs: boolean resolved via Promise
 */
function isPortFree(port) {
  return new Promise((resolve) => {
    const srv = http.createServer(() => {});
    srv.once('error', () => resolve(false));
    srv.once('listening', () => srv.close(() => resolve(true)));
    srv.listen(port, '0.0.0.0');
  });
}

/**
 * Waits until HTTP endpoint responds
 * Inputs: url string, timeout ms
 * Outputs: resolves when OK, rejects on timeout
 */
function waitForHttp(url, timeoutMs) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      http.get(url, (res) => {
        if (res.statusCode && res.statusCode < 500) resolve(true);
        else retry();
      }).on('error', retry);
    };
    const retry = () => {
      if (Date.now() - start > timeoutMs) return reject(new Error('Timeout waiting for dev server'));
      setTimeout(tick, 1000);
    };
    tick();
  });
}

/**
 * Starts Vite dev server using npx vite, falling back to npm run dev
 * Inputs: desired port
 * Outputs: child process
 */
function startDev(port) {
  return new Promise((resolve) => {
    const cmd = `npx vite --port ${port} --strictPort --host`;
    let child = spawn(cmd, { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env }, shell: true });
    let resolved = false;

    const finish = (proc) => {
      proc.stdout.on('data', (d) => process.stdout.write(`🟢 ${d}`));
      proc.stderr.on('data', (d) => process.stderr.write(`🔴 ${d}`));
      proc.on('exit', (code) => {
        if (code === 0) ok('Dev server exited cleanly');
        else fail(`Dev server exited with code ${code}`);
      });
      resolved = true;
      resolve(proc);
    };

    child.on('error', () => {
      if (resolved) return;
      warn('npx vite failed; falling back to npm run dev');
      const fallback = `npm run dev -- --port ${port} --strictPort --host`;
      const proc = spawn(fallback, { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env }, shell: true });
      finish(proc);
    });

    // If npx vite starts successfully, attach and resolve
    child.once('spawn', () => finish(child));
  });
}

main().catch((e) => fail(e.message));
