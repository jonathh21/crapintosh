// Generates a flat print design and a realistic product photo for each shirt using Gemini (Nano Banana).
//
// Usage:
//   npm run images                     shirts without an `image` only
//   npm run images -- off-by-one       just these shirt ids (regenerates)
//   npm run images -- --force          every shirt with print lines, overwriting existing images
//
// Needs GEMINI_API_KEY in the environment (or the Windows user environment).
// Set GEMINI_IMAGE_MODEL to override the model.

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { parse } from 'yaml';

const SHIRTS_DIR = path.resolve('src/content/shirts');
const IMAGES_DIR = path.join(SHIRTS_DIR, 'images');
const MODEL = process.env.GEMINI_IMAGE_MODEL ?? 'gemini-nano-banana-2.1';
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';

function apiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  if (process.platform === 'win32') {
    const k = execSync(
      `powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('GEMINI_API_KEY','User')"`,
    )
      .toString()
      .trim();
    if (k) return k;
  }
  throw new Error('GEMINI_API_KEY is not set.');
}

const KEY = apiKey();
const args = process.argv.slice(2);
const force = args.includes('--force');
const only = args.filter((a) => !a.startsWith('--'));

// Finds the last inline image in the response, whatever shape the API wraps it in.
function findImage(node, found = []) {
  if (Array.isArray(node)) node.forEach((n) => findImage(n, found));
  else if (node && typeof node === 'object') {
    const mime = node.mime_type ?? node.mimeType;
    if (typeof node.data === 'string' && typeof mime === 'string' && mime.startsWith('image/')) {
      found.push({ data: node.data, mime });
    }
    Object.values(node).forEach((v) => findImage(v, found));
  }
  return found.at(-1);
}

async function generate(parts) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'x-goog-api-key': KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, input: parts }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      const img = findImage(body);
      if (img) return img;
      console.warn(`  no image returned (attempt ${attempt})`);
      continue;
    }
    const msg = body?.error?.message ?? res.statusText;
    if (msg.includes('limit: 0')) throw new Error(`No quota for ${MODEL}. Enable billing on the key's project.`);
    if (res.status !== 429 && res.status < 500) throw new Error(`${res.status}: ${msg}`);
    console.warn(`  ${res.status}: ${msg} (attempt ${attempt})`);
    await new Promise((r) => setTimeout(r, 15000 * attempt));
  }
  throw new Error('Gave up after 3 attempts.');
}

const ext = (mime) => (mime === 'image/jpeg' ? 'jpg' : mime.split('/')[1]);

function designPrompt(d) {
  return [
    'Flat, print-ready t-shirt graphic for a geeky, retro computing humour brand.',
    'The design must contain exactly this text, spelled exactly, line by line:',
    ...d.print.map((l) => `"${l}"`),
    `The joke behind it: ${d.tagline}`,
    `Style: bold screen-printed look, 1 to 3 ink colours, main ink ${d.inkColour}, with a simple retro`,
    'illustration or icon that suits the joke (old computers, terminals, pixel art, floppy disks and so on).',
    `Centred composition on a plain solid ${d.shirtColour} background, square format. No shirt, no mockup,`,
    'no extra words, no watermark.',
  ].join('\n');
}

function photoPrompt(d) {
  return [
    `Realistic e-commerce product photo of a plain crew-neck cotton t-shirt in colour ${d.shirtColour},`,
    'screen printed on the chest with exactly the attached artwork (same text, same layout, same colours).',
    'Shirt laid flat or on an invisible mannequin, soft studio lighting, natural fabric folds and texture,',
    'neutral light grey background, whole shirt in frame, square format. No people, no extra text, no logos.',
  ].join('\n');
}

// Replaces or inserts frontmatter keys straight after `tagline:`, leaving everything else untouched.
function setFrontmatter(src, fields) {
  const [, fm, rest] = src.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n[\s\S]*)$/);
  const lines = fm
    .split(/\r?\n/)
    .filter((l) => !Object.keys(fields).some((k) => l.startsWith(`${k}:`)));
  const at = lines.findIndex((l) => l.startsWith('tagline:')) + 1;
  lines.splice(at, 0, ...Object.entries(fields).map(([k, v]) => `${k}: ${JSON.stringify(v)}`));
  return `---\n${lines.join('\n')}\n---${rest}`;
}

const files = (await readdir(SHIRTS_DIR)).filter((f) => f.endsWith('.md'));
for (const file of files) {
  const id = file.replace(/\.md$/, '');
  const src = await readFile(path.join(SHIRTS_DIR, file), 'utf8');
  const d = parse(src.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]);
  d.shirtColour ??= '#e8e2d0';
  d.inkColour ??= '#1a1a1a';

  if (only.length ? !only.includes(id) : !force && d.image) continue;
  if (!d.print?.length) {
    console.log(`- ${id}: no print lines, skipping`);
    continue;
  }

  console.log(`- ${id}: design`);
  const design = await generate([{ type: 'text', text: designPrompt(d) }]);
  const designFile = `${id}-design.${ext(design.mime)}`;
  await writeFile(path.join(IMAGES_DIR, designFile), Buffer.from(design.data, 'base64'));

  console.log(`- ${id}: photo`);
  const photo = await generate([
    { type: 'text', text: photoPrompt(d) },
    { type: 'image', mime_type: design.mime, data: design.data },
  ]);
  const photoFile = `${id}.${ext(photo.mime)}`;
  await writeFile(path.join(IMAGES_DIR, photoFile), Buffer.from(photo.data, 'base64'));

  const text = d.print.join(' / ');
  await writeFile(
    path.join(SHIRTS_DIR, file),
    setFrontmatter(src, {
      image: `./images/${photoFile}`,
      imageAlt: `${d.title} t-shirt printed with "${text}"`,
      design: `./images/${designFile}`,
      designAlt: `${d.title} print artwork: "${text}"`,
    }),
  );
  console.log(`  saved ${photoFile} and ${designFile}`);
}
