// Draft mode: a local-only editor for proposing changes to the site.
//
// It never ships to visitors (Base.astro only renders it in `astro dev`). Nothing here
// edits source files: you rearrange, rewrite, hide, duplicate and annotate blocks on the
// real page, then "Copy changes" produces a summary to hand over for implementation.
//
// How it tracks changes: on every load the fresh page is the "original". Each movable
// block, each container of blocks and each piece of text gets a stable id (by DOM order),
// and the original text/order is recorded. A draft is a saved snapshot of the edited page
// plus a fingerprint of the original; if the source changes, the old draft is set aside
// instead of being restored onto a page it no longer matches.

import Sortable from 'sortablejs';

// Elements whose children can be reordered. Children of these become "blocks".
const CONTAINER_SELECTORS = [
  'main',
  '.project-details',
  '.case',
  '.projects',
  '.timeline',
  '.content-list',
  '.events',
  '.facts',
  '.steps',
  '.results',
  '.bullets',
  '.tags',
  '.header__actions',
  '.project-details__actions',
  '.project__stats',
];

// Regions of the page that are snapshotted and restored. Nav and footer are left out:
// replacing them would detach their scripts (the dark-mode switch). Use a note for those.
const REGION_SELECTOR = 'body > header.header, body > main';

const UI = '[data-ed-ui]';
const KEY_PREFIX = 'ed:draft:';
const STALE_PREFIX = 'ed:stale:';
const MODE_KEY = 'ed:mode';

interface BlockInfo { label: string; container: string; }
interface Original {
  texts: Record<string, string>;
  blocks: Record<string, BlockInfo>;
  order: Record<string, string[]>;
  containerLabels: Record<string, string>;
}
interface Draft {
  page: string;
  title: string;
  fingerprint: string;
  regions: string[];
  changes: Change[];
  savedAt: string;
}
type Change =
  | { type: 'text'; where: string; from: string; to: string }
  | { type: 'move'; where: string; from: string[]; to: string[] }
  | { type: 'hide'; block: string }
  | { type: 'add'; copyOf: string; after: string; text: string }
  | { type: 'note'; block: string; note: string };

const page = location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/') || '/';
const storageKey = KEY_PREFIX + page;

// ---------------------------------------------------------------- helpers

const store = {
  get(key: string): string | null { try { return localStorage.getItem(key); } catch { return null; } },
  set(key: string, value: string) { try { localStorage.setItem(key, value); } catch { /* quota or blocked */ } },
  remove(key: string) { try { localStorage.removeItem(key); } catch { /* blocked */ } },
  keys(): string[] { try { return Object.keys(localStorage); } catch { return []; } },
};

const clean = (s: string) => s.replace(/\s+/g, ' ').trim();

function textOf(el: Element): string {
  const copy = el.cloneNode(true) as Element;
  copy.querySelectorAll(UI).forEach((n) => n.remove());
  copy.querySelectorAll('br').forEach((br) => br.replaceWith(' '));
  return clean((copy as HTMLElement).innerText ?? copy.textContent ?? '');
}

function short(s: string, n = 70): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function regions(): Element[] {
  return [...document.querySelectorAll(REGION_SELECTOR)];
}

function blockLabel(el: Element): string {
  const heading = ['.project__title', '.timeline__title', '.event__title', 'h1', 'h2', 'h3', 'dt', 'b']
    .map((sel) => el.querySelector(sel))
    .find((found) => found && !found.closest(UI));
  const text = heading ? textOf(heading) : textOf(el);
  const tag = el.matches('section') ? 'section' : el.classList[0] ?? el.tagName.toLowerCase();
  return `${tag} "${short(text || '(empty)', 50)}"`;
}

function containerLabel(el: Element): string {
  if (el.matches('main')) return 'page sections';
  const section = el.closest('section, header, nav, footer, .project-details, main');
  const heading = section?.querySelector('h1, h2');
  const where = heading ? `"${short(textOf(heading), 40)}"` : (section?.tagName.toLowerCase() ?? 'page');
  return `${el.classList[0] ?? el.tagName.toLowerCase()} in ${where}`;
}

// A text element is one that has its own (non-whitespace) text and isn't inside another.
function isTextLeaf(el: Element): boolean {
  if (el.closest(UI) || el.matches('script, style, svg, img')) return false;
  return [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim() !== '');
}

// ---------------------------------------------------------------- ids + originals

function assignIds(): void {
  let c = 0, b = 0, t = 0;
  for (const region of regions()) {
    const containers = [
      ...(region.matches(CONTAINER_SELECTORS.join(',')) ? [region] : []),
      ...region.querySelectorAll(CONTAINER_SELECTORS.join(',')),
    ];
    for (const container of containers) {
      (container as HTMLElement).dataset.edContainer = `c${++c}`;
      for (const child of container.children) {
        if (child.matches(`${UI}, script, style`)) continue;
        (child as HTMLElement).dataset.edBlock ??= `b${++b}`;
      }
    }
    const all = region.querySelectorAll('*');
    for (const el of all) {
      if (!isTextLeaf(el)) continue;
      if (el.parentElement?.closest('[data-ed-text]')) continue;
      (el as HTMLElement).dataset.edText = `t${++t}`;
    }
    if (isTextLeaf(region)) (region as HTMLElement).dataset.edText = `t${++t}`;
  }
}

function readOriginal(): Original {
  const original: Original = { texts: {}, blocks: {}, order: {}, containerLabels: {} };
  document.querySelectorAll<HTMLElement>('[data-ed-text]').forEach((el) => {
    original.texts[el.dataset.edText!] = textOf(el);
  });
  document.querySelectorAll<HTMLElement>('[data-ed-container]').forEach((el) => {
    const id = el.dataset.edContainer!;
    original.containerLabels[id] = containerLabel(el);
    original.order[id] = childBlocks(el).map((b) => b.dataset.edBlock!);
    for (const block of childBlocks(el)) {
      original.blocks[block.dataset.edBlock!] = { label: blockLabel(block), container: id };
    }
  });
  return original;
}

function childBlocks(container: Element): HTMLElement[] {
  return [...container.children].filter((c): c is HTMLElement => (c as HTMLElement).dataset?.edBlock !== undefined);
}

// ---------------------------------------------------------------- change detection

function computeChanges(original: Original): Change[] {
  const changes: Change[] = [];
  const labelOf = (id: string) => original.blocks[id]?.label ?? `new block ${id}`;

  // Reordered containers (comparing only blocks that existed originally)
  document.querySelectorAll<HTMLElement>('[data-ed-container]').forEach((el) => {
    const id = el.dataset.edContainer!;
    const before = original.order[id];
    if (!before || el.closest('[data-ed-dup]')) return;
    const now = childBlocks(el).map((b) => b.dataset.edBlock!).filter((b) => before.includes(b));
    if (now.join() !== before.join()) {
      changes.push({ type: 'move', where: original.containerLabels[id], from: before.map(labelOf), to: now.map(labelOf) });
    }
  });

  // Added (duplicated) blocks
  document.querySelectorAll<HTMLElement>('[data-ed-dup]').forEach((el) => {
    if (el.parentElement?.closest('[data-ed-dup]')) return;
    const prev = el.previousElementSibling as HTMLElement | null;
    changes.push({
      type: 'add',
      copyOf: labelOf(el.dataset.edDup!),
      after: prev?.dataset.edBlock ? labelOf(prev.dataset.edBlock) : 'start',
      text: [...el.querySelectorAll<HTMLElement>('[data-ed-text]')].map(textOf).filter(Boolean).join(' | '),
    });
  });

  // Edited text (outside added blocks, which are reported whole above)
  document.querySelectorAll<HTMLElement>('[data-ed-text]').forEach((el) => {
    if (el.closest('[data-ed-dup]')) return;
    const id = el.dataset.edText!;
    const from = original.texts[id];
    const to = textOf(el);
    if (from !== undefined && from !== to) {
      const block = el.closest<HTMLElement>('[data-ed-block]');
      const where = block ? labelOf(block.dataset.edBlock!) : el.closest('header') ? 'the top banner' : 'the page';
      changes.push({ type: 'text', where, from, to });
    }
  });

  // Hidden blocks and notes
  document.querySelectorAll<HTMLElement>('[data-ed-hidden]').forEach((el) => {
    changes.push({ type: 'hide', block: labelOf(el.dataset.edBlock!) });
  });
  document.querySelectorAll<HTMLElement>('[data-ed-note]').forEach((el) => {
    const id = el.dataset.edDup ? `copy of ${labelOf(el.dataset.edDup)}` : labelOf(el.dataset.edBlock!);
    changes.push({ type: 'note', block: id, note: el.dataset.edNote! });
  });

  return changes;
}

// ---------------------------------------------------------------- snapshot / restore

function snapshotRegions(): string[] {
  return regions().map((r) => {
    const copy = r.cloneNode(true) as Element;
    copy.querySelectorAll(UI).forEach((n) => n.remove());
    copy.querySelectorAll('[contenteditable]').forEach((n) => n.removeAttribute('contenteditable'));
    copy.querySelectorAll('.ed-hover').forEach((n) => n.classList.remove('ed-hover'));
    copy.querySelectorAll('.sortable-chosen, .sortable-ghost').forEach((n) => n.classList.remove('sortable-chosen', 'sortable-ghost'));
    return copy.outerHTML;
  });
}

function restoreRegions(saved: string[]): boolean {
  const current = regions();
  if (saved.length !== current.length) return false;
  current.forEach((r, i) => { r.outerHTML = saved[i]; });
  return true;
}

// ---------------------------------------------------------------- editing UI

let editing = false;
let original: Original;
let fingerprint = '';
let sortables: Sortable[] = [];
let saveTimer: number | undefined;
let dupCounter = 0;

function save(): void {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    const changes = computeChanges(original);
    if (changes.length === 0) {
      store.remove(storageKey);
    } else {
      const draft: Draft = {
        page, title: document.title, fingerprint, regions: snapshotRegions(), changes,
        savedAt: new Date().toISOString(),
      };
      store.set(storageKey, JSON.stringify(draft));
    }
    renderPanel();
  }, 250);
}

function toolsFor(block: HTMLElement): HTMLElement {
  const tools = document.createElement('div');
  tools.className = 'ed-tools';
  tools.dataset.edUi = '';
  tools.innerHTML = `
    <button type="button" class="ed-handle" title="Drag to move">⠿</button>
    <button type="button" data-act="hide" title="Hide / show">${block.dataset.edHidden !== undefined ? '◌' : '●'}</button>
    <button type="button" data-act="dup" title="Duplicate (add another like this)">⧉</button>
    <button type="button" data-act="note" title="Leave a note">✎</button>`;
  return tools;
}

function decorate(): void {
  document.querySelectorAll<HTMLElement>('[data-ed-block]').forEach((block) => {
    if (!block.querySelector(':scope > .ed-tools')) block.prepend(toolsFor(block));
    renderNoteBadge(block);
  });
  document.querySelectorAll<HTMLElement>('[data-ed-text]').forEach((el) => {
    el.contentEditable = 'true';
    el.spellcheck = true;
  });
  document.querySelectorAll<HTMLElement>('[data-ed-container]').forEach((el) => {
    sortables.push(Sortable.create(el, {
      group: el.dataset.edContainer,      // reorder within the same list only
      draggable: '>[data-ed-block]',   // direct children only
      // Start a drag only from this block's own handle, so grabbing a card inside a
      // section moves the card, not the section.
      filter: (evt: Event, target: HTMLElement) => {
        const handle = (evt.target as Element).closest('.ed-handle');
        return !handle || handle.closest('[data-ed-block]') !== target;
      },
      preventOnFilter: false,
      animation: 150,
      onEnd: save,
    }));
  });
}

function undecorate(): void {
  sortables.forEach((s) => s.destroy());
  sortables = [];
  document.querySelectorAll(UI).forEach((n) => n.remove());
  document.querySelectorAll('[contenteditable]').forEach((n) => n.removeAttribute('contenteditable'));
  document.querySelectorAll('.ed-hover').forEach((n) => n.classList.remove('ed-hover'));
}

function renderNoteBadge(block: HTMLElement): void {
  block.querySelector(':scope > .ed-note')?.remove();
  if (!block.dataset.edNote) return;
  const badge = document.createElement('div');
  badge.className = 'ed-note';
  badge.dataset.edUi = '';
  badge.textContent = '✎ ' + block.dataset.edNote;
  block.append(badge);
}

function setEditing(on: boolean): void {
  editing = on;
  document.documentElement.classList.toggle('ed-on', on);
  try { sessionStorage.setItem(MODE_KEY, on ? '1' : '0'); } catch { /* blocked */ }
  if (on) decorate(); else undecorate();
  renderPanel();
}

function onClick(e: MouseEvent): void {
  if (!editing) return;
  const target = e.target as HTMLElement;
  if (target.closest('#ed-panel')) return;
  const button = target.closest<HTMLButtonElement>('.ed-tools button[data-act]');
  // In draft mode links and buttons on the page must not navigate or toggle.
  if (target.closest('a, button')) e.preventDefault();
  if (!button) return;
  e.stopPropagation();
  const block = button.closest<HTMLElement>('[data-ed-block]')!;
  const act = button.dataset.act;
  if (act === 'hide') {
    if (block.dataset.edHidden !== undefined) delete block.dataset.edHidden; else block.dataset.edHidden = '';
    button.textContent = block.dataset.edHidden !== undefined ? '◌' : '●';
  } else if (act === 'dup') {
    const copy = block.cloneNode(true) as HTMLElement;
    const n = ++dupCounter + Date.now().toString(36);
    copy.dataset.edDup = block.dataset.edDup ?? block.dataset.edBlock!;
    copy.dataset.edBlock = `${block.dataset.edBlock}-copy${n}`;
    delete copy.dataset.edNote;
    copy.querySelectorAll<HTMLElement>('[data-ed-block]').forEach((b) => { b.dataset.edBlock += `-copy${n}`; });
    copy.querySelectorAll<HTMLElement>('[data-ed-text]').forEach((t) => { t.dataset.edText += `-copy${n}`; });
    copy.querySelectorAll<HTMLElement>('[data-ed-container]').forEach((c) => { c.dataset.edContainer += `-copy${n}`; });
    copy.querySelector(':scope > .ed-note')?.remove();
    block.after(copy);
  } else if (act === 'note') {
    const note = window.prompt('Note for this block (leave empty to remove):', block.dataset.edNote ?? '');
    if (note === null) return;
    if (note.trim()) block.dataset.edNote = note.trim(); else delete block.dataset.edNote;
    renderNoteBadge(block);
  }
  save();
}

function onKeydown(e: KeyboardEvent): void {
  // Keep edits to plain single-line text so the summary stays readable.
  if (editing && e.key === 'Enter' && (e.target as HTMLElement).isContentEditable) e.preventDefault();
}

function onPaste(e: ClipboardEvent): void {
  if (!editing || !(e.target as HTMLElement).isContentEditable) return;
  e.preventDefault();
  document.execCommand('insertText', false, e.clipboardData?.getData('text/plain') ?? '');
}

function onMouseOver(e: MouseEvent): void {
  if (!editing) return;
  const block = (e.target as HTMLElement).closest('[data-ed-block]');
  document.querySelectorAll('.ed-hover').forEach((n) => { if (n !== block) n.classList.remove('ed-hover'); });
  block?.classList.add('ed-hover');
}

// ---------------------------------------------------------------- export

function allDrafts(): { draft: Draft; stale: boolean }[] {
  return store.keys()
    .filter((k) => k.startsWith(KEY_PREFIX) || k.startsWith(STALE_PREFIX))
    .map((k) => ({ raw: store.get(k), stale: k.startsWith(STALE_PREFIX) }))
    .filter((d): d is { raw: string; stale: boolean } => !!d.raw)
    .map(({ raw, stale }) => ({ draft: JSON.parse(raw) as Draft, stale }))
    .sort((a, b) => a.draft.page.localeCompare(b.draft.page));
}

function describe(c: Change): string {
  switch (c.type) {
    case 'text': return `- **Edit text** in ${c.where}\n  - from: "${c.from}"\n  - to: "${c.to}"`;
    case 'move': return `- **Reorder** ${c.where}\n  - was: ${c.from.join(' → ')}\n  - now: ${c.to.join(' → ')}`;
    case 'hide': return `- **Remove** ${c.block}`;
    case 'add': return `- **Add** a new block like ${c.copyOf}, placed after ${c.after}\n  - its text: "${short(c.text, 400)}"`;
    case 'note': return `- **Note** on ${c.block}: ${c.note}`;
  }
}

function exportText(): string {
  const drafts = allDrafts();
  if (drafts.length === 0) return 'No changes yet.';
  const parts = ['# Portfolio change request', ''];
  for (const { draft, stale } of drafts) {
    parts.push(`## Page ${draft.page}${stale ? ' (older draft, page has changed since)' : ''}`, '');
    parts.push(...draft.changes.map(describe), '');
  }
  return parts.join('\n');
}

async function copyChanges(): Promise<void> {
  const text = exportText();
  try {
    await navigator.clipboard.writeText(text);
    flash('Copied. Paste it into the chat.');
  } catch {
    showText(text);
  }
}

function downloadChanges(): void {
  const blob = new Blob([exportText()], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `portfolio-changes-${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function showText(text: string): void {
  const box = document.createElement('div');
  box.className = 'ed-modal';
  box.dataset.edUi = '';
  box.innerHTML = '<div><p>Copy this and paste it into the chat:</p><textarea readonly></textarea><button type="button">Close</button></div>';
  box.querySelector('textarea')!.value = text;
  box.querySelector('button')!.addEventListener('click', () => box.remove());
  document.body.append(box);
  box.querySelector('textarea')!.select();
}

// ---------------------------------------------------------------- panel

const panel = document.createElement('div');
panel.id = 'ed-panel';   // not tagged data-ed-ui: that would get it removed with the per-block tools
let flashText = '';

function flash(text: string): void {
  flashText = text;
  renderPanel();
  window.setTimeout(() => { flashText = ''; renderPanel(); }, 2500);
}

function renderPanel(): void {
  const here = computeChanges(original).length;
  const total = allDrafts().reduce((n, d) => n + d.draft.changes.length, 0);
  if (!editing) {
    panel.innerHTML = `<button type="button" data-p="on" class="ed-primary">✎ Draft mode${total ? ` · ${total}` : ''}</button>`;
    return;
  }
  panel.innerHTML = `
    <div class="ed-head"><b>Draft mode</b><span>${here} change${here === 1 ? '' : 's'} on this page · ${total} total</span></div>
    <p class="ed-hint">⠿ drag to move · click text to edit · ● hide · ⧉ duplicate · ✎ note</p>
    ${flashText ? `<p class="ed-flash">${flashText}</p>` : ''}
    <div class="ed-row">
      <button type="button" data-p="copy" class="ed-primary">Copy changes</button>
      <button type="button" data-p="download">Download</button>
    </div>
    <div class="ed-row">
      <button type="button" data-p="reset">Reset this page</button>
      <button type="button" data-p="resetall">Reset all</button>
      <button type="button" data-p="off">Done</button>
    </div>`;
}

panel.addEventListener('click', (e) => {
  const act = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-p]')?.dataset.p;
  if (act === 'on') setEditing(true);
  else if (act === 'off') setEditing(false);
  else if (act === 'copy') void copyChanges();
  else if (act === 'download') downloadChanges();
  else if (act === 'reset' && confirm('Discard your changes on this page?')) { store.remove(storageKey); location.reload(); }
  else if (act === 'resetall' && confirm('Discard your changes on every page?')) {
    store.keys().filter((k) => k.startsWith(KEY_PREFIX) || k.startsWith(STALE_PREFIX)).forEach((k) => store.remove(k));
    location.reload();
  }
});

// ---------------------------------------------------------------- boot

function boot(): void {
  assignIds();
  original = readOriginal();
  fingerprint = hash(JSON.stringify(original));

  const raw = store.get(storageKey);
  if (raw) {
    const draft = JSON.parse(raw) as Draft;
    if (draft.fingerprint === fingerprint && restoreRegions(draft.regions)) {
      dupCounter = document.querySelectorAll('[data-ed-dup]').length;
    } else {
      // The page changed since this draft was made: keep it for export, don't apply it.
      store.set(`${STALE_PREFIX}${page}:${draft.savedAt}`, raw);
      store.remove(storageKey);
      window.setTimeout(() => flash('This page changed since your last draft. The old draft is kept in Copy changes.'), 0);
    }
  }

  document.body.append(panel);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKeydown, true);
  document.addEventListener('paste', onPaste, true);
  document.addEventListener('input', (e) => { if (editing && (e.target as HTMLElement).isContentEditable) save(); });
  document.addEventListener('mouseover', onMouseOver);

  let wasEditing = false;
  try { wasEditing = sessionStorage.getItem(MODE_KEY) === '1'; } catch { /* blocked */ }
  setEditing(wasEditing);
}

boot();

// For automated checks only.
(window as unknown as { __edExport: () => string }).__edExport = exportText;
