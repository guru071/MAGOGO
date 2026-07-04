// This script ensures the Next.js dev server stays running
import { spawn } from 'child_process';

const server = spawn('bun', ['--bun', 'run', 'dev'], {
  cwd: '/home/z/my-project',
  stdio: 'inherit',
  env: { ...process.env },
});

server.on('exit', (code) => {
  console.log(`Server exited with code ${code}, restarting in 3s...`);
  setTimeout(() => process.exit(1), 3000);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

console.log('Web server manager started');
