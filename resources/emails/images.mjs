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
    const { __iconNode } = await import(pathToFileURL(resolve(`node_modules/lucide-react/dist/esm/icons/${name}.js`)).href);
    const children = __iconNode
        .map(([tag, { key, ...attributes }]) => `<${tag} ${Object.entries(attributes).map(([k, v]) => `${k}="${v}"`).join(' ')} />`)
        .join('');

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${colour}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: ${colour}">${children}</svg>`;
}

mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 3 });

async function draw(html, file) {
    await page.setContent(`<body style="margin: 0">${html}</body>`);
    await page.locator('body > *').first().screenshot({ path: `${out}/${file}`, omitBackground: true });
}

// The logo: a white key on an indigo square, shown at 36px.
await draw(
    `<div style="display: flex; width: 36px; height: 36px; align-items: center; justify-content: center; border-radius: 9px; background: linear-gradient(135deg, #6366f1, #4338ca)">${await svg('key-round', '#ffffff', 20)}</div>`,
    'logo.png',
);

// Each icon at 24px.
for (const [name, toneNames] of Object.entries(icons)) {
    for (const tone of toneNames) {
        await draw(await svg(name, tones[tone], 24), `${name}-${tone}.png`);
    }
}

await browser.close();
