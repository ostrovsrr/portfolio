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
| Nav, footer, page `<head>` | `src/layouts/Base.astro` |
| Project cards (home and projects page) | `src/data/projects.ts` |
| Experience and skills (home page) | `src/data/profile.ts` |
| Events | add a Markdown file to `src/content/events/` |
| A page | `src/pages/<name>.astro` (the file name is the URL) |
| Styles | `src/styles/global.css` |
| Images, CNAME, resume.pdf | `public/` (served as-is from the site root) |

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

- **⠿** drag a block to reorder it within its list (sections, cards, experience, skills, events, bullets, tags)
- **Click any text** to rewrite it
- **●** hide a block, **⧉** duplicate it (to add another card or item), **✎** leave a note
- **Copy changes** puts a summary of every edit, across all pages, on your clipboard

Drafts are saved in your browser, so you can close the tab and come back. Draft mode never
edits source files and is never part of the published site: it only loads under `astro dev`
(or a build with `PUBLIC_DRAFT_MODE=true`). The code is in `src/dev-editor/`.

## Deploying

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the site. The publish step
then waits for the owner to approve it in GitHub (Actions → the run → **Review deployments**).
