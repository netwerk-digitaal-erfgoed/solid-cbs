import { defineConfig, loadEnv } from 'vite';

export default defineConfig( ({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  // expose .env as process.env instead of import.meta since jest does not import meta yet
  const envWithProcessPrefix = Object.entries(env).reduce(
    (prev, [key, val]) => {
      return {
        ...prev,
        ['process.env.' + key]: `"${val}"`,
      }
    },
    {},
  );

  return {
    root: 'lib',
    server: {
      port: 3002,
    },
    define: envWithProcessPrefix,
  }
});
