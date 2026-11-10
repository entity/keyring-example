import { readFileSync, writeFileSync } from 'node:fs';
import { defineConfig } from '@maizzle/framework';

/**
 * Keyring's emails, built from the Vue templates in resources/emails into
 * Blade views the notifications in app/Notifications/Keyring render.
 * `npm run emails` builds them, `npm run emails:dev` previews them.
 */
export default defineConfig({
    root: 'resources/emails',
    content: ['./keyring/*.vue'],
    components: {
        source: [{ path: 'resources/emails/components', prefix: '' }],
    },
    output: {
        path: 'resources/views/emails/keyring',
        extension: 'blade.php',
    },
    // The plain text part of each email, as a Blade view of its own.
    plaintext: {
        destination: 'resources/views/emails/keyring/text',
        extension: 'blade.php',
    },
    static: { source: [] },
    css: { inline: true, purge: true },
    // Blade's {{ }} escapes for HTML, which the HTML views need: a name
    // someone typed can't add markup. Plain text has no markup to protect,
    // and would show the entities, so its views print values as they are.
    afterBuild({ files }) {
        for (const file of files.filter((file) => file.includes('/text/'))) {
            writeFileSync(
                file,
                readFileSync(file, 'utf8').replace(
                    /\{\{\s*(.+?)\s*\}\}/g,
                    '{!! $1 !!}',
                ),
            );
        }
    },
});
