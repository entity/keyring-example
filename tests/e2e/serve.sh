#!/usr/bin/env bash
# Builds the assets, starts the browser tests' database from scratch and
# serves the app. Playwright runs this with the variables from env.ts, which
# take precedence over .env.
set -euo pipefail
cd "$(dirname "$0")/../.."

# Never point the browser tests at a real database.
if [[ "${DB_CONNECTION:-}" != sqlite || "${DB_DATABASE:-}" != */database/e2e.sqlite ]]; then
    echo "serve.sh expects the e2e SQLite database; run it through Playwright." >&2
    exit 1
fi

rm -f "$DB_DATABASE" public/hot
touch "$DB_DATABASE"
php artisan migrate --seed --force --no-interaction >/dev/null
npm run build >/dev/null

# PHP's own server, so every variable above reaches the app. Laravel's router
# script finds index.php in the working directory.
export PHP_CLI_SERVER_WORKERS=4
cd public
exec php -S "localhost:$PORT" ../vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php
