import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import { pathToFileURL } from 'node:url';

const directory = await mkdtemp(join(tmpdir(), 'umlforge-tests-'));
try {
  const outfile = join(directory, 'editor-tests.mjs');
  await build({ entryPoints: ['tests/editor.test.ts'], bundle: true, platform: 'node', format: 'esm', outfile,
    alias: { '@': resolve('src') }, jsx: 'automatic', define: { 'import.meta.env': JSON.stringify({ VITE_API_URL: 'http://umlforge.test' }) } });
  await import(pathToFileURL(outfile).href);
} finally {
  if (dirname(resolve(directory)) !== resolve(tmpdir()) || !basename(directory).startsWith('umlforge-tests-')) throw new Error('Unexpected test output directory');
  await rm(directory, { recursive: true, force: true });
}
