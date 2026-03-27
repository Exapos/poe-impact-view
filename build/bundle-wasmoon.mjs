// build/bundle-wasmoon.mjs
// Bundles wasmoon ESM into IIFE for Chrome MV3 content scripts
import { build, context } from 'esbuild';
import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const outputFile = join(rootDir, 'lib/wasmoon-bundle.js');

function stripRemoteWasmFallback() {
  const output = readFileSync(outputFile, 'utf8');
  const patched = output.replace(
    /if \(customWasmUri === void 0\) \{\s+const isBrowser =[^]*?if \(isBrowser\) \{\s+customWasmUri = `https:\/\/unpkg\.com\/wasmoon@\$\{version\}\/dist\/glue\.wasm`;\s+\}\s+\}/,
    `if (customWasmUri === void 0) {
              throw new Error("Wasmoon glue.wasm URL must be provided explicitly.");
            }`
  );

  if (patched === output) {
    throw new Error('Failed to strip wasmoon remote WASM fallback from bundle output');
  }

  writeFileSync(outputFile, patched);
  console.log('Removed remote wasmoon WASM fallback from lib/wasmoon-bundle.js');
}

async function bundle() {
  const watch = process.argv.includes('--watch');

  // 1. Bundle wasmoon ESM → IIFE
  const buildOptions = {
    entryPoints: [join(rootDir, 'node_modules/wasmoon/dist/index.js')],
    bundle: true,
    format: 'iife',
    globalName: 'Wasmoon',
    outfile: join(rootDir, 'lib/wasmoon-bundle.js'),
    platform: 'browser',
    target: ['chrome110'],
    minify: false, // Keep readable for debugging during development
    sourcemap: false,
    // Exclude the .wasm file from the bundle - we load it separately
    loader: { '.wasm': 'empty' },
    define: {
      'process.env.NODE_ENV': '"production"',
      'process.env.WASMOON_WASM_URI': '""',
    },
    // Shim Node.js built-ins that wasmoon conditionally imports
    alias: {
      'module': join(rootDir, 'build/empty-module.mjs'),
      'url': join(rootDir, 'build/empty-module.mjs'),
    },
    plugins: [
      {
        name: 'strip-remote-wasm-fallback',
        setup(pluginBuild) {
          pluginBuild.onEnd((result) => {
            if (!result.errors.length && existsSync(outputFile)) {
              stripRemoteWasmFallback();
            }
          });
        },
      },
    ],
  };

  if (watch) {
    const ctx = await context(buildOptions);
    await ctx.watch();
    console.log('Watching for changes...');
  } else {
    await build(buildOptions);
    console.log('wasmoon bundled → lib/wasmoon-bundle.js');
  }

  // 2. Copy glue.wasm to lib/
  const wasmSrc = join(rootDir, 'node_modules/wasmoon/dist/glue.wasm');
  const wasmDest = join(rootDir, 'lib/glue.wasm');
  if (existsSync(wasmSrc)) {
    mkdirSync(dirname(wasmDest), { recursive: true });
    copyFileSync(wasmSrc, wasmDest);
    console.log('glue.wasm copied → lib/glue.wasm');
  } else {
    console.error('WARNING: glue.wasm not found at', wasmSrc);
  }

  console.log('Build complete.');
}

bundle().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
