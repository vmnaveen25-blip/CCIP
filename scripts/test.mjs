#!/usr/bin/env node

/**
 * CCIP / Astraea Enclave Backend Test Runner
 * Discovers the virtual environment and runs pytest.
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolvePythonEnvironment } from './findPython.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');

const pyEnv = resolvePythonEnvironment(ROOT_DIR, BACKEND_DIR);
const pythonExe = pyEnv.python;

const userArgs = process.argv.slice(2);
const pytestArgs = ['-m', 'pytest', ...(userArgs.length > 0 ? userArgs : ['tests/', '-v'])];

console.log(`Running backend test suite: ${pythonExe} ${pytestArgs.join(' ')}`);

const proc = spawn(pythonExe, pytestArgs, {
  cwd: BACKEND_DIR,
  stdio: 'inherit'
});

proc.on('exit', (code) => {
  process.exit(code || 0);
});
