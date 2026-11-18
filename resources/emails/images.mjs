/**
 * Draws the logo and icon badges the emails show into public/images/emails,
 * as PNGs: many mail clients won't show an SVG. Each badge is one of
 * Lucide's icons, in white on a round gradient of its tone, like the badge
 * on the sign-in challenge. Its halo is a see-through tint, so the same
 * image sits well on a light or a dark card. Run `npm run emails:images`
 * after changing the list below, and commit the images.
 */
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const out = 'public/images/emails';

// Each tone: its colour as [red, green, blue], for the halo, and the top
// and bottom of its gradient. Info is the app's blue accent (accent-400 to
// accent-700). The tone only ever colours the badge.
const tones = {
    critical: { rgb: [229, 72, 77], from: '#ef6a6e', to: '#b42a30' },
    warning: { rgb: [232, 145, 12], from: '#f3aa3c', to: '#b56a05' },
    success: { rgb: [22, 163, 107], from: '#34bd84', to: '#0e6d47' },
    info: { rgb: [75, 111, 206], from: '#5b81e0', to: '#324993' },
};

const rgb = ([r, g, b], alpha = 1) => `rgba(${r}, ${g}, ${b}, ${alpha})`;

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
const logoMark = `<svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" viewBox="0 0 40 40" fill="#ffffff"><g transform="translate(20 20) rotate(45) scale(0.85) translate(-19.5 -21.5)"><path fill-rule="evenodd" clip-rule="evenodd" d="M9 11a9 9 0 1 1 0 18A9 9 0 0 1 9 11Zm0 5.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" /><path d="M16 17.75h23v4.5H16z" /><path d="M28.5 22h3.5v5h-3.5zM34.5 22H39v6.5h-4.5z" /></g></svg>`;

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
// a white key on the near-black square the sidebar shows it on, at 40px.
// The soft light from the top and the faint inner edge keep the square
// visible on a dark mail client's background.
await draw(
    `<div style="display: flex; box-sizing: border-box; width: 40px; height: 40px; align-items: center; justify-content: center; border-radius: 11px; background: linear-gradient(180deg, #3a3938 0%, #1b1a1a 55%, #121111 100%); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12), inset 0 1px 0 0 rgba(255, 255, 255, 0.18)">${logoMark}</div>`,
    'logo.png',
);

// Each badge at 60px: the icon at 20px in white on a 44px circle, lit from
// the top, inside a soft halo of its tone and a thin edge, with a small
// shadow under it. The halo and edge are see-through, so the card shows
// through them in light and dark.
for (const [name, toneNames] of Object.entries(icons)) {
    for (const toneName of toneNames) {
        const tone = tones[toneName];

        await draw(
            `<div style="display: flex; width: 60px; height: 60px; align-items: center; justify-content: center"><div style="display: flex; box-sizing: border-box; width: 44px; height: 44px; margin-top: -1px; align-items: center; justify-content: center; border-radius: 50%; background: linear-gradient(180deg, ${tone.from}, ${tone.to}); box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.28), 0 0 0 4px ${rgb(tone.rgb, 0.1)}, 0 0 0 5px ${rgb(tone.rgb, 0.2)}, 0 2px 4px 0 rgba(0, 0, 0, 0.16)">${await svg(name, '#ffffff', 20)}</div></div>`,
            `${name}-${toneName}.png`,
        );
    }
}

await browser.close();
