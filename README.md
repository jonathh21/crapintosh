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
print: ["There's no place", 'like', '127.0.0.1'] # text for the generated mockup
image: ./images/my-shirt.jpg # optional photo; replaces the generated mockup
imageAlt: Description of the photo
imageFocus: left # optional; which part of the photo to keep in the cropped catalogue thumbnail
design: ./images/my-shirt-design.jpg # optional flat artwork, shown as "The print" on the shirt page
designAlt: Description of the artwork
designPrompt: Full description of the artwork # optional, used instead of the generated design prompt
shirtColour: '#1f2a44'
inkColour: '#7cf29a'
tags: [networking, classic]
price: 20
sizes: [S, M, L, XL, XXL] # optional, this is the default
order: 2 # position in the catalogue
---

Longer description shown on the shirt page.
```

Put photos in `src/content/shirts/images/`; Astro resizes and optimises them at build time. Shirts without an `image` get an SVG mockup generated from `print`.

### Generating images with Gemini

Both scripts take the `print` lines, shirt colour and tagline, create a flat design, then a product photo of a shirt wearing it. They save `<id>-design.jpg` and `<id>.jpg` and fill in `image`, `imageAlt`, `design` and `designAlt`. With no arguments they only do shirts that have no `image`; pass shirt ids to (re)generate specific ones.

- `npm run images:browser -- my-shirt`: free. Drives gemini.google.com in your own signed-in Chrome; see the top of `scripts/generate-images-browser.mjs` for how to start Chrome. Waits 2 minutes between images.
- `npm run images -- my-shirt`: uses the Gemini API. Needs `GEMINI_API_KEY` with billing enabled (the free tier has no image quota). Set `GEMINI_IMAGE_MODEL` to change model.

Always check the text in the results; image models still misspell things now and then.
## Express interest

Each shirt page has a form that posts to Formspree (`https://formspree.io/f/mvkzdkgv`, set in
`src/config.ts`). Formspree emails each submission, with these fields:

- `shirt`: the shirt id (its file name)
- `size`
- `email`: Formspree uses this as the reply-to address
- `_subject`: "Interest: <shirt title>", used as the email subject

`_gotcha` is a hidden honeypot that Formspree uses to drop spam bots. With JavaScript the form submits
in place; without it, it falls back to a normal POST and Formspree's own thank-you page. To test
against a different form, set `PUBLIC_INTEREST_ENDPOINT` in `.env` (see `.env.example`).
## T-shirt ideas

`/ideas/` ("Got an idea?" in the menu) lets visitors pitch designs. It posts `idea`, optional `name`
and optional `email` to the same Formspree form, with the subject "T-shirt idea" and `type=idea`, so
you can tell them apart from interest sign-ups. To send ideas to their own Formspree form, set
`PUBLIC_IDEAS_ENDPOINT` in `.env`.

Both forms use `src/scripts/formspree.ts`, which submits any `<form data-formspree>` in place and shows
the `data-success` message.

## Deploying (GitHub Pages)

Every push to `main` builds and deploys the site via `.github/workflows/deploy.yml`.

One-off setup:

1. In the repo on GitHub, go to **Settings > Pages** and set **Source** to **GitHub Actions**.
2. At your DNS provider for `crapintosh.co.uk` (remove any existing A/AAAA/CNAME records for these
   names first, e.g. Fastmail's default website records):

   | Type  | Name  | Value                                                                         |
   | ----- | ----- | ----------------------------------------------------------------------------- |
   | A     | `@`   | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`    |
   | AAAA  | `@`   | `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153` |
   | CNAME | `www` | `jonathh21.github.io`                                                         |

   Leave MX and other email records alone.
3. In **Settings > Pages**, set the custom domain to `crapintosh.co.uk`, wait for the DNS check to
   pass, then tick **Enforce HTTPS**. (`public/CNAME` keeps the domain set on every deploy.)
4. Optional but recommended: verify the domain under your GitHub account's **Settings > Pages** to
   stop anyone else claiming it.
