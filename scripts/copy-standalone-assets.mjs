import { cp, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const standaloneDir = path.join(root, '.next', 'standalone');
const standaloneNextDir = path.join(standaloneDir, '.next');

if (!existsSync(standaloneDir)) {
  console.log('[build] Standalone output not found; skipping asset copy.');
  process.exit(0);
}

await mkdir(standaloneNextDir, { recursive: true });

const copies = [
  [path.join(root, '.next', 'static'), path.join(standaloneNextDir, 'static')],
  [path.join(root, 'public'), path.join(standaloneDir, 'public')],
];

for (const [source, destination] of copies) {
  if (!existsSync(source)) continue;
  await cp(source, destination, { recursive: true, force: true });
}

console.log('[build] Standalone assets copied.');
