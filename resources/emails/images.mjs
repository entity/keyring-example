/**
 * Draws the logo and icons the emails show into public/images/emails, as
 * PNGs: many mail clients won't show an SVG. The icons are Lucide's, in the
 * colour of each tone they're used with. Run `npm run emails:images` after
 * changing the list below, and commit the images.
 */
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const out = 'public/images/emails';

// The colours match the tones in resources/emails/components/Badge.vue.
const tones = {
    critical: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981',
    info: '#6366f1',
};

// Each icon with the tones it's drawn in.
const icons = {
    'monitor-smartphone': ['warning'],
    'rectangle-ellipsis': ['success'],
    'key-round': ['success', 'info'],
    'shield-alert': ['critical', 'warning'],
    'life-buoy': ['warning', 'success'],
    'lock-keyhole': ['critical', 'info'],
    copy: ['critical'],
    'mail-check': ['success', 'info'],
    'undo-2': ['warning'],
    'shield-check': ['info'],
    'mail-warning': ['warning'],
    'at-sign': ['info'],
    'user-round-check': ['info'],
};

// Lucide's icons as [tag, attributes] pairs, read from lucide-react, which
// doesn't export them by name.
async function svg(name, colour, size) {
    const { __iconNode } = await import(
        pathToFileURL(
            resolve(`node_modules/lucide-react/dist/esm/icons/${name}.js`),
        ).href
    );
    const children = __iconNode
        .map(
            ([tag, { key: _key, ...attributes }]) =>
                `<${tag} ${Object.entries(attributes)
                    .map(([k, v]) => `${k}="${v}"`)
                    .join(' ')} />`,
        )
        .join('');

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${colour}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: ${colour}">${children}</svg>`;
}

// The paths of app-logo-icon.tsx, kept in step with it by hand.
const logoMark = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 40 40" fill="#ffffff"><g transform="translate(20 20) rotate(45) scale(0.85) translate(-19.5 -21.5)"><path fill-rule="evenodd" clip-rule="evenodd" d="M9 11a9 9 0 1 1 0 18A9 9 0 0 1 9 11Zm0 5.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" /><path d="M16 17.75h23v4.5H16z" /><path d="M28.5 22h3.5v5h-3.5zM34.5 22H39v6.5h-4.5z" /></g></svg>`;

mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 3 });

async function draw(html, file) {
    await page.setContent(`<body style="margin: 0">${html}</body>`);
    await page
        .locator('body > *')
        .first()
        .screenshot({ path: `${out}/${file}`, omitBackground: true });
}

// The logo: the app's own mark (resources/js/components/app-logo-icon.tsx),
// a white key on the near-black square the sidebar shows it on, at 36px.
// The faint inner edge keeps the square visible on a dark mail client's
// background.
await draw(
    `<div style="display: flex; box-sizing: border-box; width: 36px; height: 36px; align-items: center; justify-content: center; border-radius: 9px; background: #171717; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14)">${logoMark}</div>`,
    'logo.png',
);

// Each icon at 24px.
for (const [name, toneNames] of Object.entries(icons)) {
    for (const tone of toneNames) {
        await draw(await svg(name, tones[tone], 24), `${name}-${tone}.png`);
    }
}

await browser.close();
