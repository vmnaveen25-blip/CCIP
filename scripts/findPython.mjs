import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const isWindows = process.platform === 'win32';

/**
 * Dynamically and reliably resolves the Python executable and virtual environment.
 * Handles Windows Store app execution aliases, Windows Python Launcher (py),
 * LocalAppData Python installations, virtual environments, and system Python.
 */
export function resolvePythonEnvironment(rootDir, backendDir) {
  const candidateVenvs = [
    path.join(backendDir, 'venv'),
    path.join(backendDir, '.venv'),
    path.join(rootDir, 'venv'),
    path.join(rootDir, '.venv')
  ];

  for (const venvPath of candidateVenvs) {
    if (fs.existsSync(venvPath)) {
      const pythonExe = isWindows
        ? path.join(venvPath, 'Scripts', 'python.exe')
        : path.join(venvPath, 'bin', 'python');
      if (fs.existsSync(pythonExe)) {
        try {
          execSync(`"${pythonExe}" -c "import uvicorn, fastapi"`, { stdio: 'ignore' });
          return {
            python: pythonExe,
            venv: venvPath
          };
        } catch {
          // Virtual environment exists but lacks required packages; continue searching
        }
      }
    }
  }

  if (isWindows) {
    // 1. Try Windows Python Launcher `py`
    try {
      const pyOutput = execSync('py -c "import sys; print(sys.executable)"', {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore']
      }).trim();
      if (pyOutput && fs.existsSync(pyOutput)) {
        return {
          python: pyOutput,
          venv: null
        };
      }
    } catch {
      // ignore
    }

    // 2. Check %LOCALAPPDATA%\Programs\Python\Python*\python.exe
    if (process.env.LOCALAPPDATA) {
      const programsDir = path.join(process.env.LOCALAPPDATA, 'Programs', 'Python');
      if (fs.existsSync(programsDir)) {
        try {
          const dirs = fs.readdirSync(programsDir);
          for (const d of dirs.reverse()) {
            const candidate = path.join(programsDir, d, 'python.exe');
            if (fs.existsSync(candidate)) {
              return {
                python: candidate,
                venv: null
              };
            }
          }
        } catch {
          // ignore
        }
      }
    }

    // 3. Test if `python` in PATH works and is not the Microsoft Store placeholder
    try {
      const test = execSync('python -c "import sys; print(sys.executable)"', {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore']
      }).trim();
      if (test && fs.existsSync(test)) {
        return {
          python: test,
          venv: null
        };
      }
    } catch {
      // ignore
    }
  } else {
    for (const bin of ['python3', 'python']) {
      try {
        const out = execSync(`${bin} -c "import sys; print(sys.executable)"`, {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore']
        }).trim();
        if (out && fs.existsSync(out)) {
          return {
            python: out,
            venv: null
          };
        }
      } catch {
        // ignore
      }
    }
  }

  return {
    python: isWindows ? 'python' : 'python3',
    venv: null
  };
}
