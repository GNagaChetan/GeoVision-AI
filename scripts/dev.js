const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('\x1b[36m%s\x1b[0m', '=====================================================');
console.log('\x1b[36m%s\x1b[0m', '   GeoVision AI - Unified Full-Stack Development     ');
console.log('\x1b[36m%s\x1b[0m', '=====================================================');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

// Determine Python executable
let pythonCmd = 'python';
const isWin = process.platform === 'win32';
const venvPythonWin = path.join(backendDir, '.venv', 'Scripts', 'python.exe');
const venvPythonNix = path.join(backendDir, '.venv', 'bin', 'python');

if (isWin && fs.existsSync(venvPythonWin)) {
  pythonCmd = venvPythonWin;
} else if (!isWin && fs.existsSync(venvPythonNix)) {
  pythonCmd = venvPythonNix;
}

console.log('\x1b[32m%s\x1b[0m', `[Backend] Using Python: ${pythonCmd}`);
console.log('\x1b[34m%s\x1b[0m', `[Frontend] Launching Vite on http://localhost:5173`);

// Spawn Backend
const backend = spawn(pythonCmd, ['-m', 'uvicorn', 'main:app', '--reload', '--port', '8000'], {
  cwd: backendDir,
  shell: true,
  stdio: 'inherit'
});

// Spawn Frontend
const npmCmd = isWin ? 'npm.cmd' : 'npm';
const frontend = spawn(npmCmd, ['run', 'dev'], {
  cwd: frontendDir,
  shell: true,
  stdio: 'inherit'
});

function cleanup() {
  console.log('\nStopping servers...');
  try { backend.kill(); } catch (e) {}
  try { frontend.kill(); } catch (e) {}
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
