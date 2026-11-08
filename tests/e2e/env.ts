import { fileURLToPath } from 'node:url';

export const port = 8137;
export const baseURL = `http://localhost:${port}`;

/**
 * A throwaway app for the browser tests: its own SQLite database (also for
 * sessions and the cache), no queue, no real mail. WebAuthn needs a domain,
 * so it's served on localhost rather than 127.0.0.1.
 */
export const env = {
    APP_ENV: 'local',
    APP_URL: baseURL,
    DB_CONNECTION: 'sqlite',
    DB_DATABASE: fileURLToPath(
        new URL('../../database/e2e.sqlite', import.meta.url),
    ),
    DB_URL: '',
    SESSION_DRIVER: 'database',
    CACHE_STORE: 'database',
    QUEUE_CONNECTION: 'sync',
    MAIL_MAILER: 'array',
    BCRYPT_ROUNDS: '4',
};
