import { defineConfig } from 'tsup';

export default defineConfig([
  {
    dts: true,
    entry: {
      'message-port-rpc': './src/index.ts'
    },
    format: ['cjs', 'esm'],
    sourcemap: true,
    target: 'esnext'
  }
]);
