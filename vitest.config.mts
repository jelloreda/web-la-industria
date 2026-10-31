import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./app/src', import.meta.url)) } },
  test: {
    include: ['tests-unit/**/*.test.ts'],
    environment: 'node',
    env: { YEASY_PROXY_SECRET: 'secreto-de-prueba' },
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
  },
})
