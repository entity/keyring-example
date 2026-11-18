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
        for (const file of files) {
            writeFileSync(file, unescapeBlade(readFileSync(file, 'utf8')));
        }

        for (const file of files.filter((file) => file.includes('/text/'))) {
            const text = readFileSync(file, 'utf8')
                .replace(/\{\{\s*(.+?)\s*\}\}/g, '{!! $1 !!}')
                // The support contact reads as its own link in plain
                // text, so it isn't followed by the address it links to.
                .replace(
                    /@isset\(\$contactUrl\)[\s\S]*?@endisset/g,
                    '{!! $contact !!}',
                );

            writeFileSync(file, tidy(text));
        }
    },
});

/**
 * Puts each Blade directive on a line of its own, which PHP leaves out of
 * the email along with its line break. The view then tidies what it prints:
 * whichever parts are shown, paragraphs are a single blank line apart.
 */
function tidy(text) {
    const directive =
        /[ \t]*(@(?:if|elseif|else|endif|isset|endisset|unless|endunless|foreach|endforeach|php)\b(?:\s*\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\))?)[ \t]*/g;

    const body = text
        .replace(directive, '\n$1\n')
        .replace(/\n[ \t]+/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    return `@php(ob_start())\n${body}\n{!! trim(preg_replace('/\\n\\s*\\n/', "\\n\\n", ob_get_clean())) !!}\n`;
}

/**
 * Maizzle writes the HTML out escaped, so a `->` or `>` in Blade's {{ }} or
 * a directive's arguments would reach PHP as `-&gt;`. Undo that inside them.
 */
function unescapeBlade(html) {
    const decode = (code) =>
        code
            .replace(/&gt;/g, '>')
            .replace(/&lt;/g, '<')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, '&');

    return html
        .replace(/\{\{[\s\S]*?\}\}/g, decode)
        .replace(
            /@(?:if|elseif|unless|isset|foreach|php)\s*\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\)/g,
            decode,
        );
}
