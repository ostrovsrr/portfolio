# rodion-ostrovskii.com

Personal portfolio, built with [Astro](https://astro.build) and TypeScript. Astro renders
everything to static HTML at build time, so the live site ships no framework JavaScript.

## Commands

```bash
npm install       # once
npm run dev       # local dev server at http://localhost:4321
npm run build     # build the static site into dist/
npm run preview   # serve dist/ locally
npm run check     # type-check .astro and .ts files
```

## Where things live

| To change | Edit |
|---|---|
| Header, footer, page `<head>` | `src/layouts/Base.astro` |
| Projects (home and projects page) | `src/data/projects.ts` |
| Experience and skills (home page) | `src/data/profile.ts` |
| About text and hero lettering (home page) | `src/pages/index.astro`, `public/img/rodion-letters.webp` |
| Events | add a Markdown file to `src/content/events/` |
| A page | `src/pages/<name>.astro` (the file name is the URL) |
| Styles | `src/styles/global.css` (design system, all pages), `src/styles/case-study.css` (case studies) |
| Images, CNAME, resume.pdf | `public/` (served as-is from the site root) |

### The design

Light grey page (`#eaeaea`, the same grey as the lettering image), ink type in Inter Tight,
hairline rules. Every page is a stack of `.section`s: a 12-column grid that starts with a
hairline, a small `(label)` in columns 1–2 and the content in columns 3–12. Colours and the
page margin are tokens at the top of `global.css`.

On the home page the "Rodion" lettering is drawn into a canvas that pushes square tiles
around as the mouse moves over it, and settles back to the image when it stops. The script is
inline at the bottom of `src/pages/index.astro`, with its tuning constants at the top.
Touch devices and visitors who prefer reduced motion get the plain image.

### Adding an event

Create `src/content/events/my-event.md`:

```markdown
---
title: Event name
date: 2026-05-10
role: Speaker
tags: [Shopify]
link: https://example.com   # optional
---
One or two sentences about what you did.
```

The fields are checked by the schema in `src/content.config.ts`; a typo fails the build
instead of publishing a broken page.

### Adding a page

Create `src/pages/hobbies.astro`, wrap its content in `<Base title="..." description="...">`,
and add it to the `nav` list in `src/layouts/Base.astro`.

## Draft mode: propose changes visually

Run `npm run dev`, open http://localhost:4321 and click **✎ Draft mode** (bottom right).

- **⠿** drag a block to reorder it within its list (sections, project rows, experience, skills, events, bullets, tags)
- **Click any text** to rewrite it
- **●** hide a block, **⧉** duplicate it (to add another card or item), **✎** leave a note
- **Copy changes** puts a summary of every edit, across all pages, on your clipboard

Drafts are saved in your browser, so you can close the tab and come back. Draft mode never
edits source files and is never part of the published site: it only loads under `astro dev`
(or a build with `PUBLIC_DRAFT_MODE=true`). The code is in `src/dev-editor/`.

## Deploying

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the site. The publish step
then waits for the owner to approve it in GitHub (Actions → the run → **Review deployments**).
