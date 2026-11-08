export const port = 8137;
export const baseURL = `http://localhost:${port}`;

/** "php" (PHP's own server) or "octane" (FrankenPHP workers). */
export const server = process.env.E2E_SERVER === 'octane' ? 'octane' : 'php';

/**
 * Everything else lives in .env.e2e, which serve.sh writes: Laravel loads it
 * instead of .env when APP_ENV is "e2e", under either server. (Octane clears
 * variables named in the env file, so plain overrides wouldn't survive.)
 */
export const env = { APP_ENV: 'e2e' };
