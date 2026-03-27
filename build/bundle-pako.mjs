import { build } from 'esbuild';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

async function main() {
  await build({
    entryPoints: [join(rootDir, 'node_modules/pako/dist/pako.esm.mjs')],
    bundle: true,
    format: 'iife',
    globalName: 'Pako',
    outfile: join(rootDir, 'lib/pako-bundle.js'),
    platform: 'browser',
    target: ['chrome110'],
    minify: false,
    sourcemap: false,
  });

  console.log('pako bundled -> lib/pako-bundle.js');
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});