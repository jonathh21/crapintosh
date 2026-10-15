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

## Deploying to Fastmail

1. `npm run build`
2. In Fastmail, go to Files and upload the contents of `dist/` to a folder.
3. In Settings > Domains, point `crapintosh.co.uk` at Fastmail and set that folder as the website.
