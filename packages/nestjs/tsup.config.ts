import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  target: 'es2022',
  platform: 'node',
  dts: true,
  clean: true,
  keepNames: true,
  tsconfig: 'tsconfig.json',
});
