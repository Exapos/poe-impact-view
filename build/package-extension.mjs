import { cpSync, existsSync, mkdirSync, rmSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist', 'poe-impact-view');

const pathsToCopy = [
  'manifest.json',
  'LICENSE',
  'PRIVACY.md',
  'SECURITY.md',
  'THIRD_PARTY_NOTICES.md',
  'content',
  'icons',
  'lib',
  'options',
  'popup',
  'rules',
  'PathOfBuilding-dev/browser-file-manifest.json',
  'PathOfBuilding-dev/manifest.xml',
  'PathOfBuilding-dev/manifest.cfg',
  'PathOfBuilding-dev/LICENSE.md',
  'PathOfBuilding-dev/src',
  'PathOfBuilding-dev/runtime/lua',
];

function copyPath(relativePath) {
  const sourcePath = join(rootDir, relativePath);
  const targetPath = join(distDir, relativePath);
  if (!existsSync(sourcePath)) {
    throw new Error(`Missing required runtime path: ${relativePath}`);
  }
  mkdirSync(dirname(targetPath), { recursive: true });
  cpSync(sourcePath, targetPath, { recursive: true });
  console.log(`Copied ${relativePath}`);
}

function main() {
  rmSync(distDir, { recursive: true, force: true });
  mkdirSync(distDir, { recursive: true });

  for (const relativePath of pathsToCopy) {
    copyPath(relativePath);
  }

  console.log(`\nPackaged extension -> ${distDir}`);
  console.log('Load this folder via chrome://extensions or zip it for release distribution.');
}

try {
  main();
} catch (err) {
  console.error('Packaging failed:', err);
  process.exit(1);
}