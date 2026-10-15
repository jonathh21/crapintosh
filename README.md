# Crapintosh

T-shirts for people who remember the dial-up noise. Static [Astro](https://astro.build) site for
[crapintosh.co.uk](https://crapintosh.co.uk).

## Commands

| Command           | Action                                  |
| ----------------- | --------------------------------------- |
| `npm install`     | Install dependencies                    |
| `npm run dev`     | Dev server at `http://localhost:4321`   |
| `npm run build`   | Build the static site to `./dist/`      |
| `npm run preview` | Preview the production build locally    |

## Adding a shirt

Add a Markdown file to `src/content/shirts/`. The file name becomes the URL
(`/shirts/<file-name>/`). Front matter is validated by `src/content.config.ts`:

```md
---
title: No Place Like Home
tagline: Click your heels three times and ping yourself.
print: ["There's no place", 'like', '127.0.0.1'] # lines printed on the mockup
shirtColour: '#1f2a44'
inkColour: '#7cf29a'
tags: [networking, classic]
price: 20
sizes: [S, M, L, XL, XXL] # optional, this is the default
order: 2 # position in the catalogue
---

Longer description shown on the shirt page.
```

Mockups are generated as SVG from `print`, so no image is needed to get started.

## Express interest

Fastmail website hosting is static only, so the form can't save submissions itself. Copy
`.env.example` to `.env` and set:

- `PUBLIC_INTEREST_ENDPOINT`: a form service URL that emails you each submission, for example
  [Formspree](https://formspree.io) (`https://formspree.io/f/xxxx`) or
  [Web3Forms](https://web3forms.com) (`https://api.web3forms.com/submit`). Point it at your Fastmail
  address.
- `PUBLIC_INTEREST_ACCESS_KEY`: only for services that need it (Web3Forms).
- `PUBLIC_INTEREST_EMAIL`: used when no endpoint is set; the form then opens a prefilled email instead.

Each submission includes `shirt` (the shirt id), `size`, `email` and `subject`.

## Deploying to Fastmail

1. `npm run build`
2. In Fastmail, go to Files and upload the contents of `dist/` to a folder.
3. In Settings > Domains, point `crapintosh.co.uk` at Fastmail and set that folder as the website.
