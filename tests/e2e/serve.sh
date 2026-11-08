#!/usr/bin/env bash
# A throwaway app for the browser tests: its own SQLite database (also for
# sessions and the cache), no queue, no real mail. Builds the assets, starts
# the database from scratch, then serves the app with PHP's own server, or
# with Octane when E2E_SERVER=octane. Playwright runs this.
set -euo pipefail
cd "$(dirname "$0")/../.."

export APP_ENV=e2e
database="$PWD/database/e2e.sqlite"

cat > .env.e2e <<ENV
APP_NAME="Keyring Example"
APP_ENV=e2e
APP_KEY=base64:$(head -c 32 /dev/urandom | base64)
APP_DEBUG=true
APP_URL=http://localhost:$PORT
DB_CONNECTION=sqlite
DB_DATABASE=$database
SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=sync
MAIL_MAILER=array
BCRYPT_ROUNDS=4
LOG_CHANNEL=single
ENV

# Never point the browser tests at a real database: ask the app itself.
actual=$(php artisan tinker --execute 'echo config("database.default")."|".config("database.connections.sqlite.database");')
if [[ "$actual" != "sqlite|$database" ]]; then
    echo "The e2e app would use '$actual', not $database. Stopping." >&2
    exit 1
fi

rm -f "$database" public/hot
touch "$database"
php artisan migrate --seed --force --no-interaction >/dev/null
npm run build >/dev/null

# One Octane worker, so every request runs in the same long-lived app: the
# strictest test for state leaking from one person's request to the next.
if [[ "${E2E_SERVER:-php}" == octane ]]; then
    exec php artisan octane:frankenphp --host=localhost --port="$PORT" --workers=1 --max-requests=1000
fi

# PHP's own server; Laravel's router script finds index.php in the working
# directory.
export PHP_CLI_SERVER_WORKERS=4
cd public
exec php -S "localhost:$PORT" ../vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php
