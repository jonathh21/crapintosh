---
name: add-shirt
description: Add a new t-shirt to the Crapintosh site, including Gemini-generated print design and product photo, then build, commit and push. Use when the user describes a new shirt idea or design, or asks to add, generate or explore shirt designs. Asks how many designs to make for an idea.
---

# Adding a t-shirt to Crapintosh

Shirts are Astro content entries in `src/content/shirts/<id>.md`. The schema lives in `src/content.config.ts`.
Images are generated through Gemini in a real Chrome window (free) by `scripts/generate-images-browser.mjs`.

## 1. Write the shirt entry

Create `src/content/shirts/<id>.md` (kebab-case id, becomes the URL `/shirts/<id>/`):

```yaml
---
title: Short Shirt Name
tagline: One-line joke shown under the title.
designPrompt: >-
  Full image description for Gemini (optional). Use the user's own description when they give one.
  Spell out every piece of text in quotes and end with "Spell every word exactly as given and add no
  other words."
print: ['LINE ONE', 'LINE TWO']   # the text on the shirt; used for the text-only fallback and alt text
shirtColour: '#111111'
inkColour: '#f0a030'
tags: [retro, games]
price: 22
order: 17                           # next number after the highest existing `order`
---

Two or three sentences of dry, British, slightly self-deprecating copy.
```

Rules:
- Do not add `image`, `imageAlt`, `design` or `designAlt` by hand; the generator writes them after `tagline`.
- Quote YAML strings containing `'` with double quotes, and vice versa.
- Without `designPrompt`, a generic prompt is built from `print`, `tagline` and the colours.
- In written copy avoid em/en dashes, curly quotes, arrows, ellipsis glyphs and emoji.
- If the idea uses film, brand or character IP (Batman, Back to the Future, Guinness, Copilot...), add it but
  briefly flag the trademark/copyright risk to the user.
- When the user gives a short idea rather than a finished design description, first ask (with the
  ask_user tool) how many designs to create for it, defaulting to 3. Then write that many distinct
  takes as separate shirts and push them all. If they give a full design description, make just that one.

## 2. Push straight away

The site renders a text-only print for shirts without images, so build and push the entries immediately:

```powershell
npx astro build
git add -A; git commit -m "Add <name> shirt(s)"; git push
```

Include the `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>` trailer.

## 3. Generate images

Chrome must be running with remote debugging and signed in to Gemini. Check, and launch if needed:

```powershell
try { (Invoke-RestMethod http://127.0.0.1:9333/json/version).Browser } catch {
  Start-Process "C:\Program Files\Google\Chrome\Application\chrome.exe" -ArgumentList `
    '--remote-debugging-port=9333', "--user-data-dir=$env:TEMP\crapintosh-gemini\profile", '--no-first-run', 'https://gemini.google.com/app'
}
```

If Gemini shows a sign-in page, ask the user to sign in in that window.

Then run (async, it takes about 5 minutes per shirt):

```powershell
npm run images:browser -- <id> [<id> ...]
```

- It opens a new chat per shirt, makes the flat design, waits 2 minutes, then makes the product photo.
- Keep the 2-minute pauses; the user asked for them.
- Output: `src/content/shirts/images/<id>-design.jpg` and `<id>.jpg` (max 1400px), plus frontmatter.
- If the download button fails it falls back to copying the on-screen image, which is fine.
- `npm run images` is the API alternative, but needs a billed `GEMINI_API_KEY`.

## 4. Review

View every generated image and check the text is spelled exactly as intended and nothing extra was
added. Report small flaws to the user; regenerate a shirt with `npm run images:browser -- <id>` if the text
is wrong.

## 5. Build, push, verify

```powershell
npx astro build
git add -A; git commit -m "Add images for <name>"; git push
```

GitHub Actions deploys to https://crapintosh.co.uk. Confirm the latest run at
`https://api.github.com/repos/jonathh21/crapintosh/actions/runs?per_page=1` succeeds and
`https://crapintosh.co.uk/shirts/<id>/` returns 200.
