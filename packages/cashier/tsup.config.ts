import { defineConfig, type Options } from 'tsup';

const INTEROP_NAMESPACE = 'recurly-esm-interop';

const recurlyEsmInterop: NonNullable<Options['esbuildPlugins']>[number] = {
  name: INTEROP_NAMESPACE,
  setup(build) {
    const isEsm = build.initialOptions.format === 'esm';

    build.onResolve({ filter: /^recurly$/ }, (args) =>
      isEsm && args.namespace !== INTEROP_NAMESPACE
        ? { path: 'recurly', namespace: INTEROP_NAMESPACE }
        : { path: 'recurly', external: true },
    );

    build.onLoad({ filter: /.*/, namespace: INTEROP_NAMESPACE }, () => ({
      contents:
        "import recurly from 'recurly'; export const { Client, ApiError, errors } = recurly;",
      loader: 'js',
    }));
  },
};

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  target: 'es2022',
  platform: 'node',
  dts: true,
  clean: true,
  keepNames: true,
  tsconfig: 'tsconfig.json',
  noExternal: [/^recurly$/],
  esbuildPlugins: [recurlyEsmInterop],
});
