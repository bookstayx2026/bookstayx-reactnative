const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const STARTUP_KEY = Symbol.for('bookstayx.backend.startedByExpo');
const HEALTH_PATH = '/api/health';
const STARTUP_TIMEOUT_MS = 15_000;

function isExpoStartCommand() {
  const cmdLine = process.argv.join(' ').toLowerCase();
  if (cmdLine.includes('export')) return false;
  return true;
}

function readBackendPort(backendDirectory) {
  if (process.env.BOOKSTAYX_API_PORT) {
    return Number(process.env.BOOKSTAYX_API_PORT);
  }

  try {
    const envContents = fs.readFileSync(path.join(backendDirectory, '.env'), 'utf8');
    const portMatch = envContents.match(/^PORT\s*=\s*([0-9]+)\s*$/m);
    if (portMatch) {
      return Number(portMatch[1]);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`[BookStayX] Could not read backend port: ${error.message}`);
    }
  }

  return 5001;
}

function isBackendRunning(port) {
  return new Promise((resolve) => {
    const request = http.get(
      {
        hostname: '127.0.0.1',
        port,
        path: HEALTH_PATH,
        timeout: 1000,
      },
      (response) => {
        response.resume();
        resolve(response.statusCode >= 200 && response.statusCode < 300);
      },
    );

    request.on('timeout', () => {
      request.destroy();
      resolve(false);
    });
    request.on('error', () => resolve(false));
  });
}

async function waitForBackend(port, child) {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Backend exited with code ${child.exitCode} before becoming ready.`);
    }

    if (await isBackendRunning(port)) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Backend did not become ready within ${STARTUP_TIMEOUT_MS / 1000} seconds.`);
}

function attachCleanup(child) {
  let stopping = false;

  const stopBackend = () => {
    if (stopping || child.killed || child.exitCode !== null) {
      return;
    }

    stopping = true;
    child.kill('SIGTERM');
  };

  process.once('exit', stopBackend);
  process.once('SIGINT', stopBackend);
  process.once('SIGTERM', stopBackend);
}

async function startBackendWithExpo() {
  if (
    !isExpoStartCommand() ||
    process.env.BOOKSTAYX_SKIP_BACKEND_AUTOSTART === 'true' ||
    globalThis[STARTUP_KEY]
  ) {
    return;
  }

  globalThis[STARTUP_KEY] = true;

  const projectDirectory = path.resolve(__dirname, '..');
  const backendDirectory = path.join(projectDirectory, 'backend');
  const backendEntry = path.join(backendDirectory, 'server.js');
  const port = readBackendPort(backendDirectory);

  if (await isBackendRunning(port)) {
    console.log(`[BookStayX] Backend is already running at http://localhost:${port}`);
    return;
  }

  console.log(`[BookStayX] Starting backend at http://localhost:${port} ...`);

  const child = spawn(process.execPath, [backendEntry], {
    cwd: backendDirectory,
    env: process.env,
    stdio: 'inherit',
    windowsHide: true,
  });

  attachCleanup(child);

  child.once('error', (error) => {
    console.error(`[BookStayX] Backend could not start: ${error.message}`);
  });

  child.once('exit', (code, signal) => {
    if (code && code !== 0) {
      console.error(`[BookStayX] Backend stopped unexpectedly (exit code ${code}).`);
    } else if (signal && signal !== 'SIGTERM' && signal !== 'SIGINT') {
      console.warn(`[BookStayX] Backend stopped by ${signal}.`);
    }
  });

  try {
    await waitForBackend(port, child);
    console.log(`[BookStayX] Backend is ready at http://localhost:${port}${HEALTH_PATH}`);
  } catch (error) {
    console.error(`[BookStayX] Backend startup failed: ${error.message}`);
  }
}

module.exports = { startBackendWithExpo };
