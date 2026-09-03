// One-off script: generates all PWA icon assets from the logo master.
// Run with: node scripts/generate-icons.mjs
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LOGO = path.join(ROOT, 'docs', 'assets', 'logo.png');
const BG = '#0a0e27';

async function generateStandardIcon(size, outPath) {
    await sharp(LOGO)
        .resize(size, size, { fit: 'contain', background: BG })
        .flatten({ background: BG })
        .png()
        .toFile(outPath);
    console.log('  ->', path.relative(ROOT, outPath));
}

async function generateMaskableIcon(size, outPath) {
    // Maskable icons get cropped to a circle/squircle by the OS, so the logo
    // must sit inside the ~80% "safe zone" with the background bleeding to
    // the edges — otherwise parts of the logo get clipped off.
    const logoSize = Math.round(size * 0.65);
    const logoBuffer = await sharp(LOGO)
        .resize(logoSize, logoSize, { fit: 'contain' })
        .toBuffer();

    await sharp({
        create: { width: size, height: size, channels: 4, background: BG },
    })
        .composite([{ input: logoBuffer, gravity: 'center' }])
        .png()
        .toFile(outPath);
    console.log('  ->', path.relative(ROOT, outPath));
}

async function main() {
    if (!fs.existsSync(LOGO)) {
        console.error('Logo master not found at', LOGO);
        process.exit(1);
    }

    const iconsDir = path.join(ROOT, 'public', 'icons');
    await fs.promises.mkdir(iconsDir, { recursive: true });

    console.log('Generating PWA icons from', path.relative(ROOT, LOGO), '...');
    await generateStandardIcon(192, path.join(iconsDir, 'icon-192.png'));
    await generateStandardIcon(512, path.join(iconsDir, 'icon-512.png'));
    await generateMaskableIcon(512, path.join(iconsDir, 'icon-maskable-512.png'));
    await generateStandardIcon(180, path.join(ROOT, 'app', 'apple-icon.png'));
    console.log('Done.');
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
