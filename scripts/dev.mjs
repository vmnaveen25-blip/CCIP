#!/usr/bin/env node

/**
 * CCIP / Astraea Enclave Unified Development Orchestrator
 * Starts FastAPI Backend + React/Vite Frontend concurrently with:
 * - Pre-flight port collision detection (ports 8000 and 5173)
 * - Dynamic Python environment discovery (.venv, venv, or PATH)
 * - Real-time startup telemetry banner and health probe
 * - Zero-orphan process cleanup on SIGINT / SIGTERM / Ctrl+C
 */

import { spawn, execSync } from 'node:child_process';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolvePythonEnvironment as findPyEnv } from './findPython.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');

const isWindows = process.platform === 'win32';
const args = process.argv.slice(2);
const isBackendOnly = args.includes('--backend-only');
const isFrontendOnly = args.includes('--frontend-only');
const shouldKillConflicts = args.includes('--kill-conflicts') || args.includes('--force');

const BACKEND_PORT = 8000;
const FRONTEND_PORT = 5173;

let backendProcess = null;
let frontendProcess = null;
let isShuttingDown = false;

// ANSI Colors
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

/**
 * Check if a port is in use
 */
/**
 * Find all process PIDs listening on a given port (IPv4 & IPv6)
 */
function getAllPidsForPort(port) {
  const pids = new Set();
  try {
    if (isWindows) {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      for (const line of output.trim().split('\n')) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5 && parts[1].includes(`:${port}`) && parts[3] === 'LISTENING') {
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0') pids.add(pid);
        }
      }
    } else {
      const output = execSync(`lsof -ti :${port}`, { encoding: 'utf8' });
      for (const pid of output.trim().split('\n')) {
        if (pid.trim()) pids.add(pid.trim());
      }
    }
  } catch {
    // ignore
  }
  return Array.from(pids);
}

/**
 * Check if a port is in use
 */
async function isPortInUse(port) {
  const pids = getAllPidsForPort(port);
  if (pids.length > 0) return true;

  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      resolve(err.code === 'EADDRINUSE');
    });
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port, '0.0.0.0');
  });
}

/**
 * Kill process occupying a port
 */
function killPid(pid) {

  try {
    if (isWindows) {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
    } else {
      process.kill(-Number(pid), 'SIGKILL');
    }
  } catch {
    try {
      process.kill(Number(pid), 'SIGKILL');
    } catch {
      // ignore
    }
  }
}

/**
 * Dynamically locate Python and Uvicorn executables
 */
function resolvePythonEnvironment() {
  return findPyEnv(ROOT_DIR, BACKEND_DIR);
}

/**
 * Terminate child process tree cleanly
 */
function killProcessTree(proc) {
  if (!proc || !proc.pid) return;
  try {
    if (isWindows) {
      execSync(`taskkill /PID ${proc.pid} /T /F`, { stdio: 'ignore' });
    } else {
      try {
        process.kill(-proc.pid, 'SIGTERM');
      } catch {
        proc.kill('SIGTERM');
      }
    }
  } catch {
    // Process might already be dead
  }
}

/**
 * Clean shutdown handler
 */
function cleanupAndExit(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n${YELLOW}===========================================${RESET}`);
  console.log(`${YELLOW}Stopping CCIP services gracefully...${RESET}`);
  console.log(`${YELLOW}===========================================${RESET}`);

  if (frontendProcess) {
    killProcessTree(frontendProcess);
    frontendProcess = null;
  }
  if (backendProcess) {
    killProcessTree(backendProcess);
    backendProcess = null;
  }

  setTimeout(() => {
    process.exit(code);
  }, 300);
}

// Register signal handlers
process.on('SIGINT', () => cleanupAndExit(0));
process.on('SIGTERM', () => cleanupAndExit(0));
process.on('SIGHUP', () => cleanupAndExit(0));
process.on('exit', () => {
  if (frontendProcess) killProcessTree(frontendProcess);
  if (backendProcess) killProcessTree(backendProcess);
});

/**
 * Probe backend health endpoint until online
 */
function waitForBackendReady(maxWaitMs = 60000) {
  const startTime = Date.now();
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      const req = http.get(`http://localhost:${BACKEND_PORT}/health`, (res) => {
        if (res.statusCode === 200) {
          clearInterval(checkInterval);
          resolve(true);
        }
      });

      req.on('error', () => {
        if (Date.now() - startTime > maxWaitMs) {
          clearInterval(checkInterval);
          resolve(false);
        }
      });
      req.end();
    }, 400);
  });
}

/**
 * Main execution flow
 */
async function main() {
  // 1. Port conflict pre-flight checks
  if (!isFrontendOnly) {
    const backendPortBusy = await isPortInUse(BACKEND_PORT);
    if (backendPortBusy) {
      const pids = getAllPidsForPort(BACKEND_PORT);
      if (shouldKillConflicts && pids.length > 0) {
        console.log(`${YELLOW}[PORT CONFLICT] Freeing port ${BACKEND_PORT} (killing PID(s): ${pids.join(', ')})...${RESET}`);
        pids.forEach(killPid);
      } else {
        console.error(`\n${RED}${BOLD}[PORT CONFLICT ERROR]${RESET} ${RED}Port ${BACKEND_PORT} is already in use${pids.length ? ` by PID(s): ${pids.join(', ')}` : ''}!${RESET}`);
        console.error(`${YELLOW}Another backend server or process is occupying port ${BACKEND_PORT}.${RESET}`);
        console.error(`To automatically terminate conflicting processes, re-run with:\n  ${BOLD}npm run dev -- --kill-conflicts${RESET}\n`);
        process.exit(1);
      }
    }
  }

  if (!isBackendOnly) {
    const frontendPortBusy = await isPortInUse(FRONTEND_PORT);
    if (frontendPortBusy) {
      const pids = getAllPidsForPort(FRONTEND_PORT);
      if (shouldKillConflicts && pids.length > 0) {
        console.log(`${YELLOW}[PORT CONFLICT] Freeing port ${FRONTEND_PORT} (killing PID(s): ${pids.join(', ')})...${RESET}`);
        pids.forEach(killPid);
      } else {
        console.error(`\n${RED}${BOLD}[PORT CONFLICT ERROR]${RESET} ${RED}Port ${FRONTEND_PORT} is already in use${pids.length ? ` by PID(s): ${pids.join(', ')}` : ''}!${RESET}`);
        console.error(`${YELLOW}Another Vite server or web service is occupying port ${FRONTEND_PORT}.${RESET}`);
        console.error(`To automatically terminate conflicting processes, re-run with:\n  ${BOLD}npm run dev -- --kill-conflicts${RESET}\n`);
        process.exit(1);
      }
    }
  }


  // 2. Resolve Python environment
  const pyEnv = resolvePythonEnvironment();

  // 3. Print Startup Banner
  console.log(`\n${CYAN}===========================================${RESET}`);
  console.log(`${CYAN}${BOLD}CCIP / ASTRAEA ENCLAVE STARTING${RESET}`);
  console.log(``);
  if (!isBackendOnly) console.log(`${BLUE}Frontend:${RESET} STARTING`);
  if (!isFrontendOnly) console.log(`${GREEN}Backend:${RESET}  STARTING ${pyEnv.venv ? `(venv: ${path.basename(pyEnv.venv)})` : '(system python)'}`);
  console.log(`${CYAN}===========================================${RESET}\n`);

  // 4. Start Backend
  if (!isFrontendOnly) {
    backendProcess = spawn(
      pyEnv.python,
      ['-m', 'uvicorn', 'app.main:app', '--reload', '--host', '0.0.0.0', '--port', String(BACKEND_PORT)],
      {
        cwd: BACKEND_DIR,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1'
        }
      }
    );

    backendProcess.stdout.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          console.log(`${GREEN}[BACKEND]${RESET} ${line.trim()}`);
        }
      }
    });

    backendProcess.stderr.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          console.log(`${GREEN}[BACKEND]${RESET} ${line.trim()}`);
        }
      }
    });

    backendProcess.on('exit', (code) => {
      if (!isShuttingDown) {
        console.error(`${RED}[BACKEND] Process exited with code ${code}${RESET}`);
        cleanupAndExit(code || 1);
      }
    });
  }

  // 5. Start Frontend
  if (!isBackendOnly) {
    const npmCmd = isWindows ? 'npm.cmd' : 'npm';
    frontendProcess = spawn(npmCmd, ['run', 'dev'], {
      cwd: FRONTEND_DIR,
      shell: isWindows,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        VITE_API_BASE_URL: '/api/v1'
      }
    });


    frontendProcess.stdout.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          console.log(`${BLUE}[FRONTEND]${RESET} ${line.trim()}`);
        }
      }
    });

    frontendProcess.stderr.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          console.log(`${BLUE}[FRONTEND]${RESET} ${line.trim()}`);
        }
      }
    });

    frontendProcess.on('exit', (code) => {
      if (!isShuttingDown) {
        console.error(`${RED}[FRONTEND] Process exited with code ${code}${RESET}`);
        cleanupAndExit(code || 1);
      }
    });
  }

  // 6. Readiness Verification
  if (!isFrontendOnly) {
    const isReady = await waitForBackendReady(30000);
    if (isReady) {
      console.log(`\n${GREEN}===========================================${RESET}`);
      console.log(`${GREEN}${BOLD}BACKEND ONLINE${RESET}`);
      console.log(`http://localhost:${BACKEND_PORT}`);
      console.log(``);
      console.log(`${CYAN}${BOLD}API DOCUMENTATION${RESET}`);
      console.log(`http://localhost:${BACKEND_PORT}/docs`);
      console.log(``);
      if (!isBackendOnly) {
        console.log(`${BLUE}${BOLD}FRONTEND ONLINE${RESET}`);
        console.log(`http://localhost:${FRONTEND_PORT}`);
        console.log(`===========================================`);
      }
      console.log(`${GREEN}${BOLD}CCIP DEVELOPMENT ENVIRONMENT READY${RESET}`);
      console.log(`${GREEN}===========================================${RESET}\n`);
    } else {
      console.warn(`${YELLOW}[WARNING] Backend readiness check timed out. Verify logs above.${RESET}`);
    }
  }
}

main().catch((err) => {
  console.error(`${RED}[FATAL ERROR]${RESET}`, err);
  cleanupAndExit(1);
});
