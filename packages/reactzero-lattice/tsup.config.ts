import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'core/index': 'src/core/index.ts',
    'core/engine': 'src/core/entrypoints/engine.ts',
    'core/types': 'src/core/entrypoints/types.ts',
    'core/utils': 'src/core/entrypoints/utils.ts',
    'react/index': 'src/react/index.ts',
    'react/components': 'src/react/entrypoints/components.ts',
    'react/hooks': 'src/react/entrypoints/hooks.ts',
    'react/utils': 'src/react/entrypoints/utils.ts',
    sort: 'src/sort/index.ts',
    filter: 'src/filter/index.ts',
    paginate: 'src/paginate/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: true,
  treeshake: true,
  external: ['react', 'react-dom'],
})
