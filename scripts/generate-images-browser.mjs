// Generates a print design and a product photo per shirt by driving gemini.google.com in your own Chrome.
// Free alternative to generate-images.mjs (which needs a paid Gemini API key).
//
// 1. Start Chrome with a separate profile and remote debugging, then sign in to Gemini:
//    & "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9333 `
//      --user-data-dir="$env:TEMP\crapintosh-gemini-profile" https://gemini.google.com/app
// 2. npm run images:browser                    shirts without an `image`
//    npm run images:browser -- off-by-one      just these shirt ids (regenerates)
//
// Waits 2 minutes between images to stay well within Gemini's limits.
import { chromium } from 'playwright-core';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

import { parse } from 'yaml';
import sharp from 'sharp';

const PROJECT = process.cwd();
const SHIRTS = `${PROJECT}/src/content/shirts`;
const IMAGES = `${SHIRTS}/images`;
const PAUSE_MS = 120_000;
const ids = process.argv.slice(2);

const log = (...a) => console.log(new Date().toTimeString().slice(0, 8), ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const designPrompt = (d) => [
  'Create an image: a flat, print-ready t-shirt graphic for a geeky, retro computing humour brand.',
  'The design must contain exactly this text, spelled exactly, line by line:',
  ...d.print.map((l) => `"${l}"`),
  `The joke behind it: ${d.tagline}`,
  `Style: bold screen-printed look, 1 to 3 ink colours, main ink ${d.inkColour}, with a simple retro illustration or icon that suits the joke (old computers, terminals, pixel art, floppy disks and so on).`,
  `Centred composition on a plain solid ${d.shirtColour} background, square format. No shirt, no mockup, no extra words.`,
].join('\n');

const photoPrompt = (d) => [
  `Now create a realistic e-commerce product photo of a plain crew-neck cotton t-shirt in colour ${d.shirtColour},`,
  'screen printed on the chest with exactly the design you just made (same text, same layout, same colours).',
  'Shirt laid flat or on an invisible mannequin, soft studio lighting, natural fabric folds and texture,',
  'neutral light grey background, whole shirt in frame, square format. No people, no extra text.',
].join(' ');

function setFrontmatter(src, fields) {
  const [, fm, rest] = src.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n[\s\S]*)$/);
  const lines = fm.split(/\r?\n/).filter((l) => !Object.keys(fields).some((k) => l.startsWith(`${k}:`)));
  const at = lines.findIndex((l) => l.startsWith('tagline:')) + 1;
  lines.splice(at, 0, ...Object.entries(fields).map(([k, v]) => `${k}: ${JSON.stringify(v)}`));
  return `---\n${lines.join('\n')}\n---${rest}`;
}

const browser = await chromium.connectOverCDP('http://127.0.0.1:9333');
const ctx = browser.contexts()[0];
const page = ctx.pages().find((p) => p.url().includes('gemini.google.com')) ?? (await ctx.newPage());

async function bigImages() {
  return page.evaluate(() => {
    const rs = document.querySelectorAll('model-response');
    const last = rs[rs.length - 1];
    if (!last) return [];
    return [...last.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth >= 400).map((i) => i.src);
  });
}

async function ask(prompt, label) {
  const before = await page.locator('model-response').count();
  const box = page.locator('div.ql-editor[contenteditable="true"]').first();
  await box.click();
  await box.fill(prompt);
  await page.keyboard.press('Enter');
  log(`  sent ${label} prompt, waiting...`);
  const deadline = Date.now() + 240_000;
  while (Date.now() < deadline) {
    await sleep(3000);
    if ((await page.locator('model-response').count()) <= before) continue;
    const imgs = await bigImages();
    const busy = await page.locator('button[aria-label*="Stop"]').count();
    if (imgs.length && !busy) { await sleep(3000); return (await bigImages()).at(-1); }
  }
  await page.screenshot({ path: `fail-${label}.png` });
  const text = await page.locator('model-response').last().innerText().catch(() => '');
  throw new Error(`No image for ${label}. Gemini said: ${text.slice(0, 300)}`);
}


// Downloads the full-size image from the given model response via Gemini's own button.
async function save(index, file) {
  const resp = page.locator('model-response').nth(index);
  const img = resp.locator('img').last();
  let input;
  try {
    await img.hover({ timeout: 10_000 });
    const [dl] = await Promise.all([
      page.waitForEvent('download', { timeout: 90_000 }),
      resp.locator('button[aria-label="Download full size image"]').last().click(),
    ]);
    input = path.join(os.tmpdir(), `crapintosh-dl-${file}`);
    await dl.saveAs(input);
  } catch {
    // Download button sometimes does nothing; fall back to the displayed (1024px) image via canvas.
    log('  download failed, copying displayed image instead');
    const dataUrl = await img.evaluate((el) => {
      const c = document.createElement('canvas');
      c.width = el.naturalWidth; c.height = el.naturalHeight;
      c.getContext('2d').drawImage(el, 0, 0);
      return c.toDataURL('image/png');
    });
    input = Buffer.from(dataUrl.split(',')[1], 'base64');
  }
  const name = `${file}.jpg`;
  await sharp(input).resize(2048, 2048, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 88, mozjpeg: true }).toFile(`${IMAGES}/${name}`);
  log(`  saved ${name}`);
  return name;
}
const files = (await readdir(SHIRTS)).filter((f) => f.endsWith('.md'));
let first = true;
for (const f of files) {
  const id = f.replace(/\.md$/, '');
  const src = await readFile(`${SHIRTS}/${f}`, 'utf8');
  const d = parse(src.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]);
  d.shirtColour ??= '#e8e2d0'; d.inkColour ??= '#1a1a1a';
  if (ids.length ? !ids.includes(id) : d.image) continue;
  if (!d.print?.length) continue;

  if (!first) { log(`pausing 2 min`); await sleep(PAUSE_MS); }
  first = false;
  log(`${id}: new chat`);
  await page.goto('https://gemini.google.com/app');
  await page.locator('div.ql-editor[contenteditable="true"]').first().waitFor();

  await ask(d.designPrompt ? `Create an image: ${d.designPrompt}` : designPrompt(d), `${id}-design`);
  const designFile = await save(0, `${id}-design`);

  log(`pausing 2 min`); await sleep(PAUSE_MS);
  await ask(photoPrompt(d), `${id}-photo`);
  const photoFile = await save(1, id);

  const text = d.print.join(' / ');
  await writeFile(`${SHIRTS}/${f}`, setFrontmatter(src, {
    image: `./images/${photoFile}`,
    imageAlt: `${d.title} t-shirt printed with "${text}"`,
    design: `./images/${designFile}`,
    designAlt: `${d.title} print artwork: "${text}"`,
  }));
  log(`${id}: done`);
}
log('all done');
process.exit(0);



