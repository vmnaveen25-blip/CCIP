import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { spawn, execSync, ChildProcess } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import net from 'node:net';
import http from 'node:http';

function resolvePython(rootDir: string, backendDir: string): string {
  const isWindows = process.platform === 'win32';
  const candidateVenvs = [
    path.join(backendDir, 'venv'),
    path.join(backendDir, '.venv'),
    path.join(rootDir, 'venv'),
    path.join(rootDir, '.venv'),
  ];

  for (const venvPath of candidateVenvs) {
    if (fs.existsSync(venvPath)) {
      const pythonExe = isWindows
        ? path.join(venvPath, 'Scripts', 'python.exe')
        : path.join(venvPath, 'bin', 'python');
      if (fs.existsSync(pythonExe)) {
        try {
          execSync(`"${pythonExe}" -c "import uvicorn, fastapi"`, { stdio: 'ignore' });
          return pythonExe;
        } catch {
          // Continue searching
        }
      }
    }
  }

  if (isWindows) {
    // Try py launcher
    try {
      const pyOutput = execSync('py -c "import sys; print(sys.executable)"', {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      if (pyOutput && fs.existsSync(pyOutput)) {
        return pyOutput;
      }
    } catch {
      // ignore
    }

    // Try LocalAppData python
    if (process.env.LOCALAPPDATA) {
      const programsDir = path.join(process.env.LOCALAPPDATA, 'Programs', 'Python');
      if (fs.existsSync(programsDir)) {
        try {
          const dirs = fs.readdirSync(programsDir);
          for (const d of dirs.reverse()) {
            const candidate = path.join(programsDir, d, 'python.exe');
            if (fs.existsSync(candidate)) return candidate;
          }
        } catch {
          // ignore
        }
      }
    }
  }

  return isWindows ? 'python' : 'python3';
}

function checkPortActive(port: number, host = '127.0.0.1', timeoutMs = 800): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

function bindBackendPlugin(): Plugin {
  let backendProc: ChildProcess | null = null;
  let isCleanedUp = false;

  const killBackend = () => {
    if (isCleanedUp || !backendProc || !backendProc.pid) return;
    isCleanedUp = true;
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /PID ${backendProc.pid} /T /F`, { stdio: 'ignore' });
      } else {
        try {
          process.kill(-backendProc.pid, 'SIGTERM');
        } catch {
          backendProc.kill('SIGTERM');
        }
      }
    } catch {
      // Process already terminated
    }
    backendProc = null;
  };

  return {
    name: 'ccip-bind-backend',
    async configureServer(server) {
      const BACKEND_PORT = 8000;
      const rootDir = path.resolve(__dirname, '..');
      const backendDir = path.join(rootDir, 'backend');

      const isAlreadyRunning = await checkPortActive(BACKEND_PORT);
      if (isAlreadyRunning) {
        server.config.logger.info(
          `\x1b[36m[CCIP]\x1b[0m Backend service is already active on http://127.0.0.1:${BACKEND_PORT}`
        );
        return;
      }

      const pythonExe = resolvePython(rootDir, backendDir);
      server.config.logger.info(
        `\x1b[36m[CCIP]\x1b[0m Starting FastAPI Backend with: ${pythonExe}`
      );

      backendProc = spawn(
        pythonExe,
        ['-m', 'uvicorn', 'app.main:app', '--reload', '--host', '0.0.0.0', '--port', String(BACKEND_PORT)],
        {
          cwd: backendDir,
          stdio: ['ignore', 'pipe', 'pipe'],
          env: {
            ...process.env,
            PYTHONUNBUFFERED: '1',
          },
        }
      );

      backendProc.stdout?.on('data', (data) => {
        const text = data.toString().trim();
        for (const line of text.split('\n')) {
          if (line.trim()) {
            server.config.logger.info(`\x1b[32m[backend]\x1b[0m ${line.trim()}`);
          }
        }
      });

      backendProc.stderr?.on('data', (data) => {
        const text = data.toString().trim();
        for (const line of text.split('\n')) {
          if (line.trim()) {
            server.config.logger.info(`\x1b[33m[backend]\x1b[0m ${line.trim()}`);
          }
        }
      });

      backendProc.on('exit', (code) => {
        if (!isCleanedUp) {
          server.config.logger.warn(`\x1b[31m[backend]\x1b[0m Backend process exited with code ${code}`);
        }
      });

      // Poll for backend readiness
      const startTime = Date.now();
      const readyInterval = setInterval(() => {
        const req = http.get(`http://127.0.0.1:${BACKEND_PORT}/health`, (res) => {
          if (res.statusCode === 200) {
            clearInterval(readyInterval);
            server.config.logger.info(
              `\x1b[32m✔ CCIP Backend Online: http://127.0.0.1:${BACKEND_PORT} | API Docs: http://127.0.0.1:${BACKEND_PORT}/docs\x1b[0m`
            );
          }
        });
        req.on('error', () => {
          if (Date.now() - startTime > 60000) {
            clearInterval(readyInterval);
          }
        });
        req.end();
      }, 500);

      // Register cleanup hooks
      process.once('SIGINT', () => {
        killBackend();
        process.exit(0);
      });
      process.once('SIGTERM', () => {
        killBackend();
        process.exit(0);
      });
      process.once('exit', () => {
        killBackend();
      });
      server.httpServer?.once('close', () => {
        clearInterval(readyInterval);
        killBackend();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), bindBackendPlugin()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            try {
              if (res && typeof (res as any).writeHead === 'function' && !(res as any).headersSent) {
                (res as any).writeHead(503, {
                  'Content-Type': 'application/json',
                });
                (res as any).end(JSON.stringify({
                  error: {
                    code: 'BACKEND_STARTING',
                    message: 'The CCIP Enclave backend server is starting up or unreachable on port 8000. Please wait a moment...',
                  }
                }));
              } else if (res && typeof (res as any).destroy === 'function') {
                (res as any).destroy();
              }
            } catch {
              // Ignore socket write errors
            }
          });
        }
      },
      '/ws': {
        target: 'ws://127.0.0.1:8000',
        ws: true
      }
    }
  }
});
