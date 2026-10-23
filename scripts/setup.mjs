#!/usr/bin/env node

/**
 * CCIP / Astraea Enclave Automated Setup Helper
 * Sets up Frontend npm dependencies and Python backend environment.
 */

import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolvePythonEnvironment } from './findPython.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');

const isWindows = process.platform === 'win32';

// Colors
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

console.log(`\n${CYAN}===========================================${RESET}`);
console.log(`${CYAN}${BOLD}CCIP / ASTRAEA ENCLAVE INITIAL SETUP${RESET}`);
console.log(`${CYAN}===========================================${RESET}\n`);

// 1. Root & Frontend dependencies
console.log(`${YELLOW}1/3: Installing Frontend & Root dependencies...${RESET}`);
try {
  const npmCmd = isWindows ? 'npm.cmd' : 'npm';
  execSync(`${npmCmd} install`, { cwd: FRONTEND_DIR, stdio: 'inherit' });
  console.log(`${GREEN}✓ Frontend dependencies installed successfully.${RESET}\n`);
} catch (err) {
  console.error(`${RED}✗ Failed to install frontend dependencies.${RESET}`, err);
  process.exit(1);
}

// 2. Python virtual environment
console.log(`${YELLOW}2/3: Checking Python virtual environment...${RESET}`);
const pyEnv = resolvePythonEnvironment(ROOT_DIR, BACKEND_DIR);
const venvDir = path.join(BACKEND_DIR, 'venv');
let pythonExe = isWindows
  ? path.join(venvDir, 'Scripts', 'python.exe')
  : path.join(venvDir, 'bin', 'python');

if (!fs.existsSync(pythonExe)) {
  console.log(`Creating virtual environment at ${venvDir}...`);
  try {
    const sysPy = pyEnv.python;
    execSync(`"${sysPy}" -m venv venv`, { cwd: BACKEND_DIR, stdio: 'inherit' });
    console.log(`${GREEN}✓ Virtual environment created.${RESET}`);
  } catch (err) {
    console.error(`${RED}✗ Failed to create Python virtual environment. Please install python3-venv or verify python is in PATH.${RESET}`);
    process.exit(1);
  }
} else {
  console.log(`${GREEN}✓ Existing virtual environment detected at backend/venv.${RESET}`);
}

// 3. Backend requirements
console.log(`\n${YELLOW}3/3: Installing Backend Python requirements...${RESET}`);
try {
  execSync(`"${pythonExe}" -m pip install -r requirements.txt`, { cwd: BACKEND_DIR, stdio: 'inherit' });
  console.log(`${GREEN}✓ Python requirements installed successfully.${RESET}\n`);
} catch (err) {
  console.error(`${RED}✗ Failed to install backend requirements.${RESET}`);
  process.exit(1);
}

// 4. Seeding check
const dbFile = path.join(BACKEND_DIR, 'ccip.db');
if (!fs.existsSync(dbFile)) {
  console.log(`${YELLOW}Initializing and seeding database...${RESET}`);
  try {
    execSync(`"${pythonExe}" scripts/seed.py`, { cwd: BACKEND_DIR, stdio: 'inherit' });
    console.log(`${GREEN}✓ Database initialized and seeded with test roles and threat telemetry.${RESET}\n`);
  } catch (err) {
    console.warn(`${YELLOW}! Database seed warning (non-fatal): ${err.message}${RESET}\n`);
  }
}

console.log(`${GREEN}===========================================${RESET}`);
console.log(`${GREEN}${BOLD}SETUP COMPLETE!${RESET}`);
console.log(`You can now start the entire application by running:`);
console.log(`  ${BOLD}${CYAN}npm run dev${RESET}`);
console.log(`${GREEN}===========================================${RESET}\n`);
