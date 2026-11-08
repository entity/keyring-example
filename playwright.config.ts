import { defineConfig, devices } from '@playwright/test';
import { baseURL, env, port } from './tests/e2e/env';

export default defineConfig({
    testDir: 'tests/e2e',
    // One app and database, so one test at a time.
    workers: 1,
    retries: 0,
    reporter: process.env.CI ? 'github' : 'list',
    use: {
        baseURL,
        trace: 'retain-on-failure',
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: {
        command: 'tests/e2e/serve.sh',
        url: `${baseURL}/login`,
        env: { ...env, PORT: String(port) },
        timeout: 180_000,
        reuseExistingServer: false,
    },
});
