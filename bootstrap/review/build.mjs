#!/usr/bin/env node
// bootstrap/review/build.mjs
//
// Builds sitting-purpose-2026-09-03.html from sitting-purpose-2026-09-03.yaml,
// the record of the alignment sitting on commons.systems/disposition-graph/purpose.
// Everything is rendered statically here; the page's own script only handles
// navigation and response persistence.
//
// `yaml` resolves from this repo's ancestor node_modules, exactly as
// packages/disposition/read.mjs does.
import YAML from 'yaml';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const YAML_PATH = path.join(__dirname, 'sitting-purpose-2026-09-03.yaml');
const OUT_PATH = path.join(__dirname, 'sitting-purpose-2026-09-03.html');
const DISPOSITION_ROOT = path.join(__dirname, '..', '..', 'disposition');

// ---------------------------------------------------------------------------
// Escaping
// ---------------------------------------------------------------------------

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------------------------------------------------------------------
// Inline markdown: backtick code spans and *emphasis*, escaped into HTML.
// ---------------------------------------------------------------------------

function inlineParse(text) {
  const segments = [];
  const re = /`([^`\n]+)`|\*([^*\n]+)\*/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) segments.push({ type: 'text', value: text.slice(last, m.index) });
    if (m[1] !== undefined) segments.push({ type: 'code', value: m[1] });
    else segments.push({ type: 'em', value: m[2] });
    last = re.lastIndex;
  }
  if (last < text.length) segments.push({ type: 'text', value: text.slice(last) });
  if (segments.length === 0) segments.push({ type: 'text', value: '' });
  return segments;
}

// Plain (non-diffed) inline render of a single-paragraph string.
function renderInline(text) {
  const norm = String(text == null ? '' : text).replace(/[ \t\n]+/g, ' ').trim();
  const segments = inlineParse(norm);
  return segments
    .map((seg) => {
      if (seg.type === 'code') return `<code>${escapeHtml(seg.value)}</code>`;
      if (seg.type === 'em') return `<em>${escapeHtml(seg.value)}</em>`;
      return escapeHtml(seg.value);
    })
    .join('');
}

// ---------------------------------------------------------------------------
// Word-level LCS diff, operating on tokens built from inline-parsed segments.
// A code/em span is one atomic token; plain text splits on whitespace runs.
// ---------------------------------------------------------------------------

function toDiffTokens(text) {
  const segments = inlineParse(text || '');
  const tokens = [];
  for (const seg of segments) {
    if (seg.type === 'text') {
      const parts = seg.value.split(/(\s+)/);
      for (const p of parts) {
        if (p.length === 0) continue;
        tokens.push({ key: p, html: escapeHtml(p) });
      }
    } else if (seg.type === 'code') {
      tokens.push({ key: 'CODE:' + seg.value, html: '<code>' + escapeHtml(seg.value) + '</code>' });
    } else if (seg.type === 'em') {
      tokens.push({ key: 'EM:' + seg.value, html: '<em>' + escapeHtml(seg.value) + '</em>' });
    }
  }
  return tokens;
}

// Classic LCS diff: backward DP fill, forward backtrack into an edit script.
function lcsDiff(a, b) {
  const n = a.length;
  const m = b.length;
  const dp = new Array(n + 1);
  for (let i = 0; i <= n; i++) dp[i] = new Int32Array(m + 1);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i].key === b[j].key ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ops = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i].key === b[j].key) {
      ops.push({ type: 'equal', token: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: 'del', token: a[i] });
      i++;
    } else {
      ops.push({ type: 'ins', token: b[j] });
      j++;
    }
  }
  while (i < n) {
    ops.push({ type: 'del', token: a[i] });
    i++;
  }
  while (j < m) {
    ops.push({ type: 'ins', token: b[j] });
    j++;
  }
  return ops;
}

// Renders an edit script to HTML. wrapParagraphs=true groups on tokens whose
// key contains a blank-line break (from flattenForDiff) into <p> elements,
// dropping ins/del styling on the break itself since a paragraph boundary is
// structural, not content.
function renderDiffOps(ops, wrapParagraphs) {
  let html = '';
  let openPara = false;
  const openP = () => {
    if (wrapParagraphs && !openPara) {
      html += '<p>';
      openPara = true;
    }
  };
  const closeP = () => {
    if (wrapParagraphs && openPara) {
      html += '</p>';
      openPara = false;
    }
  };
  for (const op of ops) {
    const tok = op.token;
    if (wrapParagraphs && tok.key.indexOf('\n\n') !== -1) {
      closeP();
      continue;
    }
    openP();
    if (op.type === 'equal') html += tok.html;
    else if (op.type === 'del') html += '<del>' + tok.html + '</del>';
    else html += '<ins>' + tok.html + '</ins>';
  }
  closeP();
  return html;
}

function diffInline(currentDisplay, proposedDisplay) {
  const ops = lcsDiff(toDiffTokens(currentDisplay || ''), toDiffTokens(proposedDisplay || ''));
  return renderDiffOps(ops, false);
}

function renderDiffedSection(currentRaw, proposedRaw) {
  const curFlat = currentRaw ? flattenForDiff(currentRaw) : '';
  const propFlat = proposedRaw ? flattenForDiff(proposedRaw) : '';
  const ops = lcsDiff(toDiffTokens(curFlat), toDiffTokens(propFlat));
  return renderDiffOps(ops, true);
}

// ---------------------------------------------------------------------------
// Lightweight block-markdown: paragraphs, #-headings, - and 1. lists.
// splitBlocks strips markers, keeping just each block's text, in order.
// ---------------------------------------------------------------------------

function splitBlocks(rawText) {
  const lines = String(rawText || '').replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let para = [];
  const flushPara = () => {
    if (para.length) {
      const text = para.join(' ').trim();
      if (text) blocks.push({ type: 'para', text });
      para = [];
    }
  };
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') {
      flushPara();
      continue;
    }
    const h = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushPara();
      const t = h[2].trim();
      if (t) blocks.push({ type: 'heading', text: t });
      continue;
    }
    const ul = trimmed.match(/^[-*]\s+(.*)$/);
    if (ul) {
      flushPara();
      const t = ul[1].trim();
      if (t) blocks.push({ type: 'list-item', ordered: false, text: t });
      continue;
    }
    const ol = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (ol) {
      flushPara();
      const t = ol[2].trim();
      if (t) blocks.push({ type: 'list-item', ordered: true, num: Number(ol[1]), text: t });
      continue;
    }
    para.push(trimmed);
  }
  flushPara();
  return blocks;
}

// Flattens block structure into paragraph-separated text for diffing: each
// block (heading, list item, or paragraph) becomes one \n\n-delimited chunk,
// with its marker dropped. This lets the word-level diff run across a
// current file's headings/lists against a proposed draft's plain prose
// without literal "###"/"-" markup leaking into the diff as noise.
function flattenForDiff(rawText) {
  return splitBlocks(rawText)
    .map((b) => b.text)
    .join('\n\n');
}

function renderBlocksPlain(rawText) {
  const blocks = splitBlocks(rawText);
  let html = '';
  let i = 0;
  while (i < blocks.length) {
    const b = blocks[i];
    if (b.type === 'heading') {
      html += '<h5>' + renderInline(b.text) + '</h5>';
      i++;
    } else if (b.type === 'list-item') {
      const ordered = b.ordered;
      const tag = ordered ? 'ol' : 'ul';
      const startAttr = ordered && b.num ? ` start="${b.num}"` : '';
      let items = '';
      while (i < blocks.length && blocks[i].type === 'list-item' && blocks[i].ordered === ordered) {
        items += '<li>' + renderInline(blocks[i].text) + '</li>';
        i++;
      }
      html += '<' + tag + startAttr + '>' + items + '</' + tag + '>';
    } else {
      html += '<p>' + renderInline(b.text) + '</p>';
      i++;
    }
  }
  return html;
}

// ---------------------------------------------------------------------------
// Lenient node-text parsing: frontmatter (YAML mapping) + named ## sections.
// Used for both current graph files and the sitting's proposed markdown
// drafts, which is why it does not enforce the live validator's key set --
// several proposed drafts use the `criteria` field the validator does not
// know about yet (that migration is what this very sitting is ruling on).
// ---------------------------------------------------------------------------

function splitSections(bodyText) {
  const lines = String(bodyText || '').split('\n');
  const headingRe = /^(#{2,6})\s+(.+?)\s*$/;
  const fenceRe = /^[ \t]*(`{3,}|~{3,})/;
  const boundaries = [];
  let fenceChar = null;
  lines.forEach((line, index) => {
    const fence = line.match(fenceRe);
    if (fence) {
      if (fenceChar === null) fenceChar = fence[1][0];
      else if (fence[1][0] === fenceChar) fenceChar = null;
      return;
    }
    if (fenceChar !== null) return;
    const m = line.match(headingRe);
    if (m && m[1].length === 2) boundaries.push({ name: m[2].trim(), index });
  });
  const sections = {};
  boundaries.forEach((b, idx) => {
    const endIdx = idx + 1 < boundaries.length ? boundaries[idx + 1].index : lines.length;
    sections[b.name] = lines.slice(b.index + 1, endIdx).join('\n').trim();
  });
  return sections;
}

function parseNodeText(text) {
  const normalized = String(text || '').replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  let start = 0;
  while (start < lines.length && lines[start].trim() === '') start++;
  if (lines[start] === undefined || lines[start].trim() !== '---') {
    return { frontmatter: {}, sections: splitSections(normalized) };
  }
  let end = -1;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      end = i;
      break;
    }
  }
  if (end === -1) return { frontmatter: {}, sections: splitSections(normalized) };
  const fmText = lines.slice(start + 1, end).join('\n');
  const bodyText = lines.slice(end + 1).join('\n');
  let fm = {};
  try {
    const parsed = YAML.parse(fmText);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) fm = parsed;
  } catch {
    fm = {};
  }
  return { frontmatter: fm, sections: splitSections(bodyText) };
}

const KNOWN_SECTION_ORDER = ['Answer', 'Rationale', 'Proposal'];

function unionSectionNames(a, b) {
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  const ordered = KNOWN_SECTION_ORDER.filter((k) => keys.has(k));
  const extra = [...keys].filter((k) => !KNOWN_SECTION_ORDER.includes(k));
  return [...ordered, ...extra];
}

// ---------------------------------------------------------------------------
// Frontmatter -> definition list, current schema fields only (per the brief):
// question, form, authority, under, criteria-or-instrument, defines, shims,
// source, relation -- rendered "as present" in the side being displayed.
// ---------------------------------------------------------------------------

const FIELD_ORDER = ['question', 'form', 'authority', 'under', 'criteria', 'defines', 'shims', 'source', 'relation'];

function criterionToDisplay(c) {
  if (!c) return '';
  const kind = c.kind ? '`' + c.kind + '`' : '';
  const ref = c.ref || '';
  const note = c.note ? ' — ' + c.note : '';
  return `${kind}: ${ref}${note}`;
}

function shimToDisplay(s) {
  if (!s) return '';
  // s.artifact often already carries its own backtick spans (e.g. "`LEDGER.md`
  // on the implementation ref"); pass it through as-is so inlineParse renders
  // those spans as code rather than wrapping the whole phrase a second time.
  const artifact = s.artifact || '';
  const forText = s.for ? `; for ${s.for}` : '';
  const liq = s.liquidation ? `; liquidates when ${s.liquidation}` : '';
  const declared = s.declared ? ` (declared ${s.declared})` : '';
  return `${artifact}${forText}${liq}${declared}`;
}

function fieldToDisplay(fm, key) {
  fm = fm || {};
  switch (key) {
    case 'question':
      return fm.question || '';
    case 'form':
      return fm.form || '';
    case 'authority': {
      const a = fm.authority;
      if (!a) return '';
      return `${a.class || ''} by ${a.by || ''} on ${a.date || ''}`;
    }
    case 'under': {
      const list = Array.isArray(fm.under) ? fm.under : [];
      return list.map((id) => '`' + id + '`').join('; ');
    }
    case 'criteria': {
      if (Array.isArray(fm.criteria) && fm.criteria.length) {
        return fm.criteria.map(criterionToDisplay).join(' • ');
      }
      if (fm.instrument) return criterionToDisplay(fm.instrument);
      return '';
    }
    case 'defines': {
      const list = Array.isArray(fm.defines) ? fm.defines : [];
      return list.map((d) => '`' + d + '`').join(', ');
    }
    case 'shims': {
      const list = Array.isArray(fm.shims) ? fm.shims : [];
      return list.map(shimToDisplay).join(' • ');
    }
    case 'source':
      return fm.source || '';
    case 'relation':
      return fm.relation || '';
    default:
      return '';
  }
}

function labelFor(key, fm) {
  if (key === 'criteria') {
    if (Array.isArray(fm.criteria) && fm.criteria.length) return 'criteria';
    if (fm.instrument) return 'instrument';
    return null;
  }
  return key;
}

function renderFrontmatterDiff(curFm, propFm) {
  curFm = curFm || {};
  propFm = propFm || {};
  const rows = [];
  for (const key of FIELD_ORDER) {
    const propDisplay = fieldToDisplay(propFm, key);
    if (!propDisplay) continue;
    const curDisplay = fieldToDisplay(curFm, key);
    const label = labelFor(key, propFm) || key;
    rows.push(`<div class="fm-row"><dt>${escapeHtml(label)}</dt><dd>${diffInline(curDisplay, propDisplay)}</dd></div>`);
  }
  if (!rows.length) return '<p class="notice">No frontmatter fields recorded.</p>';
  return `<div class="scroll-x"><dl class="frontmatter">${rows.join('')}</dl></div>`;
}

function renderFrontmatterPlain(fm) {
  fm = fm || {};
  const rows = [];
  for (const key of FIELD_ORDER) {
    const display = fieldToDisplay(fm, key);
    if (!display) continue;
    const label = labelFor(key, fm) || key;
    rows.push(`<div class="fm-row"><dt>${escapeHtml(label)}</dt><dd>${renderInline(display)}</dd></div>`);
  }
  if (!rows.length) return '<p class="notice">No frontmatter fields recorded.</p>';
  return `<div class="scroll-x"><dl class="frontmatter">${rows.join('')}</dl></div>`;
}

function renderPlainNode(current) {
  const fmHtml = renderFrontmatterPlain(current.frontmatter);
  const names = unionSectionNames(current.sections, {});
  const bodyHtml = names
    .map((name) => `<div class="proposal-section"><h4>${escapeHtml(name)}</h4>${renderBlocksPlain(current.sections[name])}</div>`)
    .join('');
  return fmHtml + bodyHtml;
}

function renderCurrentCollapsible(current, summaryLabel) {
  return `<details class="current-collapsible"><summary>${escapeHtml(summaryLabel)}</summary><div class="current-body">${renderPlainNode(current)}</div></details>`;
}

function classifyProposed(value) {
  if (value === 'current') return 'current';
  if (value === 'pending') return 'pending';
  if (value === 'deleted') return 'deleted';
  if (value === 'none') return 'none';
  if (typeof value === 'string') return 'markdown';
  return 'none';
}

// ---------------------------------------------------------------------------
// Facts chips, evidence quotes, alternatives, cross-references.
// ---------------------------------------------------------------------------

const AUTHORITY_KEYWORDS = ['ratified', 'delegated', 'deferred'];
const PERSISTENCE_KEYWORDS = ['standing', 'shim', 'proposal', 'open question', 'evidence', 'not recorded'];

function detectKeywordClass(text, keywords) {
  const lower = String(text).toLowerCase();
  let best = null;
  let bestIdx = Infinity;
  for (const kw of keywords) {
    const idx = lower.indexOf(kw);
    if (idx !== -1 && idx < bestIdx) {
      bestIdx = idx;
      best = kw;
    }
  }
  return best;
}

function renderFactsChips(facts) {
  if (!facts || typeof facts !== 'object' || Object.keys(facts).length === 0) {
    return '<p class="notice">No facts recorded.</p>';
  }
  const chips = Object.keys(facts).map((key) => {
    const value = String(facts[key]);
    let cls = 'chip';
    let dot = '';
    if (key === 'authority') {
      const k = detectKeywordClass(value, AUTHORITY_KEYWORDS);
      if (k) cls += ` chip-authority-${k.replace(/\s+/g, '-')}`;
    } else if (key === 'persistence') {
      const k = detectKeywordClass(value, PERSISTENCE_KEYWORDS);
      if (k) dot = `<span class="chip-dot chip-dot-${k.replace(/\s+/g, '-')}" aria-hidden="true"></span>`;
    }
    return `<span class="${cls}" data-fact-key="${escapeHtml(key)}">${dot}<span class="chip-label">${escapeHtml(key)}</span><span class="chip-value">${renderInline(value)}</span></span>`;
  });
  return `<div class="chips">${chips.join('')}</div>`;
}

function renderEvidence(word) {
  return `<blockquote class="evidence"><p>${renderInline(word.text)}</p><cite>${escapeHtml(word.date)}</cite></blockquote>`;
}

function renderAlternatives(list) {
  list = list || [];
  if (!list.length) return '<p class="notice">None recorded.</p>';
  return (
    '<ul class="alternatives">' +
    list.map((a) => `<li><p class="alt-text">${renderInline(a.text)}</p><p class="alt-why">${renderInline(a.why)}</p></li>`).join('') +
    '</ul>'
  );
}

function renderRefLinks(ids, ctx) {
  ids = ids || [];
  if (!ids.length) return '<p class="notice">None.</p>';
  return (
    '<ul class="ref-links">' +
    ids
      .map((id) => {
        const title = ctx.titleById.get(id);
        if (title) {
          return `<li><a class="ref-link" href="#${escapeHtml(id)}">${renderInline(title)}</a> <code class="ref-id">${escapeHtml(id)}</code></li>`;
        }
        ctx.missingRefs.push(id);
        return `<li><span class="ref-missing">${escapeHtml(id)}</span> <span class="notice-inline">(not found in this sitting)</span></li>`;
      })
      .join('') +
    '</ul>'
  );
}

// ---------------------------------------------------------------------------
// Entry renderers: recorded, node item, question.
// ---------------------------------------------------------------------------

function renderRecordedEntry(rec, sittingDate) {
  return `
  <article class="entry entry-recorded" id="${escapeHtml(rec.id)}" data-kind="recorded" hidden>
    <p class="eyebrow">Recorded today</p>
    <h2>${renderInline(rec.title)}</h2>
    <blockquote class="evidence evidence-ruling">
      <p>${renderInline(rec.ruling)}</p>
      <cite>Nathan Buesgens, ${escapeHtml(sittingDate)}</cite>
    </blockquote>
    <p class="recorded-prose">${renderInline(rec.recorded)}</p>
    ${renderFactsChips(rec.facts)}
  </article>`;
}

function renderProposalBlock(item, current) {
  const kind = classifyProposed(item.proposed);
  let proposalHtml = '';
  let currentCollapsibleHtml = '';

  if (kind === 'markdown') {
    const proposed = parseNodeText(item.proposed);
    const curFm = current ? current.frontmatter : {};
    const curSections = current ? current.sections : {};
    const fmDiffHtml = renderFrontmatterDiff(curFm, proposed.frontmatter);
    const sectionNames = unionSectionNames(curSections, proposed.sections);
    const bodyHtml = sectionNames
      .map((name) => {
        const curText = curSections[name] || '';
        const propText = proposed.sections[name] || '';
        return `<div class="proposal-section"><h4>${escapeHtml(name)}</h4>${renderDiffedSection(curText, propText)}</div>`;
      })
      .join('');
    const uid = 'diffbody-' + item.id;
    proposalHtml = `
      <div class="diff-toolbar">
        <button type="button" class="toggle-diff" data-toggle-for="${escapeHtml(uid)}" aria-pressed="true"><span class="toggle-diff-label">Show clean version</span></button>
        <p class="diff-legend"><span class="legend-swatch legend-ins">inserted</span><span class="legend-swatch legend-del">deleted</span></p>
      </div>
      <div class="proposal-body diff-view" id="${escapeHtml(uid)}">
        <h4 class="fm-heading">Frontmatter</h4>
        ${fmDiffHtml}
        ${bodyHtml}
      </div>`;
    if (current) currentCollapsibleHtml = renderCurrentCollapsible(current, 'Current text, as it stands in the graph');
  } else if (kind === 'current') {
    proposalHtml =
      '<p class="notice">As it stands in the graph is the proposal, recorded as of this sitting.</p>' +
      (current ? renderPlainNode(current) : '<p class="notice">No current file was found at the recorded node id.</p>');
  } else if (kind === 'pending') {
    proposalHtml = `<p class="notice">Pending — no draft yet.</p><p>${renderInline(item.pending_note || '')}</p>`;
    if (current) currentCollapsibleHtml = renderCurrentCollapsible(current, 'Current text, as it stands in the graph');
  } else if (kind === 'deleted') {
    proposalHtml =
      '<p class="notice">This node is proposed for deletion.</p>' +
      (current ? renderCurrentCollapsible(current, 'The current text, proposed for deletion') : '');
  } else {
    proposalHtml = '<p class="notice">No node is proposed for this item.</p>';
  }

  return proposalHtml + currentCollapsibleHtml;
}

function renderNodeItem(item, ctx) {
  const current = ctx.currentByItemId.get(item.id) || null;
  const rulingRadios = ctx.rulings
    .map(
      ([key, meaning]) => `
    <label class="ruling-option">
      <input type="radio" name="ruling-${escapeHtml(item.id)}" value="${escapeHtml(key)}" data-item="${escapeHtml(item.id)}">
      <span class="option-text"><span class="ruling-key">${escapeHtml(key)}</span><span class="ruling-meaning">${escapeHtml(meaning)}</span></span>
    </label>`
    )
    .join('');

  return `
  <article class="entry entry-node" id="${escapeHtml(item.id)}" data-kind="node" hidden>
    <p class="eyebrow">Node for ruling</p>
    <h2>${renderInline(item.title)}</h2>
    <p class="entry-subhead"><code class="node-id">${escapeHtml(item.node)}</code></p>
    <p class="entry-question">${renderInline(item.question)}</p>
    ${renderFactsChips(item.facts)}

    <section class="block">
      <h3>What changes</h3>
      <p>${renderInline(item.change || '')}</p>
    </section>

    <section class="block">
      <h3>The author's words</h3>
      ${(item.author_words || []).map(renderEvidence).join('')}
    </section>

    <section class="block">
      <h3>As it would stand</h3>
      ${renderProposalBlock(item, current)}
    </section>

    <section class="block">
      <h3>Alternatives</h3>
      ${renderAlternatives(item.alternatives)}
    </section>

    <section class="block">
      <h3>Depends on</h3>
      ${renderRefLinks(item.depends_on, ctx)}
    </section>

    <section class="block ruling-block">
      <h3>Ruling</h3>
      <div class="ruling-group" role="radiogroup" aria-label="Ruling">
        ${rulingRadios}
      </div>
      <label class="note-label" for="note-${escapeHtml(item.id)}">Edits or note</label>
      <textarea id="note-${escapeHtml(item.id)}" class="note-field" data-note-for="${escapeHtml(item.id)}" rows="3"></textarea>
      <p class="save-status" data-save-for="${escapeHtml(item.id)}" hidden></p>
    </section>
  </article>`;
}

function renderQuestion(q, ctx) {
  const optionsWithIdx = (q.options || []).map((o, idx) => ({ ...o, idx }));
  const ordered = [...optionsWithIdx.filter((o) => o.recommended), ...optionsWithIdx.filter((o) => !o.recommended)];
  const optionsHtml = ordered
    .map(
      (o) => `
    <label class="option-choice">
      <input type="radio" name="option-${escapeHtml(q.id)}" value="${o.idx}" data-question="${escapeHtml(q.id)}" data-label="${escapeHtml(o.label)}">
      <span class="option-text">
        <span class="option-label">${renderInline(o.label)}${o.recommended ? '<span class="recommended-tag">recommended</span>' : ''}</span>
        ${renderFactsChips(o.facts)}
      </span>
    </label>`
    )
    .join('');

  return `
  <article class="entry entry-question" id="${escapeHtml(q.id)}" data-kind="question" hidden>
    <p class="eyebrow">Open question</p>
    <h2>${renderInline(q.title)}</h2>
    <p class="entry-question">${renderInline(q.question)}</p>

    <section class="block">
      <h3>Context</h3>
      <p>${renderInline(q.context || '')}</p>
    </section>

    <section class="block ruling-block">
      <h3>Options</h3>
      <div class="option-group" role="radiogroup" aria-label="Options">
        ${optionsHtml}
      </div>
      <label class="note-label" for="note-${escapeHtml(q.id)}">Note</label>
      <textarea id="note-${escapeHtml(q.id)}" class="note-field" data-note-for="${escapeHtml(q.id)}" rows="3"></textarea>
      <p class="save-status" data-save-for="${escapeHtml(q.id)}" hidden></p>
    </section>

    <section class="block">
      <h3>Feeds</h3>
      ${renderRefLinks(q.feeds, ctx)}
    </section>
  </article>`;
}

// ---------------------------------------------------------------------------
// Rail, key, header.
// ---------------------------------------------------------------------------

function renderRailGroup(label, entries) {
  const items = entries
    .map(
      (e) => `
    <li>
      <a class="rail-link" href="#${escapeHtml(e.id)}" data-target="${escapeHtml(e.id)}">
        <span class="rail-status ${e.fixed ? 'status-fixed' : 'status-open'}" data-status-for="${escapeHtml(e.id)}" aria-hidden="true"></span>
        <span class="rail-title">${renderInline(e.title)}</span>
      </a>
    </li>`
    )
    .join('');
  return `<div class="rail-group"><h3 class="rail-group-title">${escapeHtml(label)}</h3><ul>${items}</ul></div>`;
}

function renderKey(key) {
  const group = (title, obj) => {
    const rows = Object.entries(obj || {})
      .map(([k, v]) => `<div class="key-row"><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd></div>`)
      .join('');
    return `<div class="key-group"><h4>${escapeHtml(title)}</h4><dl>${rows}</dl></div>`;
  };
  return `<div class="key-groups">
    ${group('Authority', key.authority)}
    ${group('Boldness', key.boldness)}
    ${group('Persistence', key.persistence)}
    ${group('Rulings', key.rulings)}
  </div>`;
}

function renderHeader(data, purposeItem, totalAnswerable) {
  return `
  <header class="masthead">
    <div class="masthead-main">
      <p class="eyebrow">Alignment sitting</p>
      <h1><code class="sitting-id">${escapeHtml(data.sitting)}</code></h1>
      <p class="sitting-question">${renderInline(purposeItem ? purposeItem.question : '')}</p>
      <p class="sitting-meta">${escapeHtml(data.date)} — ${escapeHtml(data.stage)}</p>
    </div>
    <div class="masthead-progress">
      <p class="progress-counter"><span id="progress-count">0</span> of <span id="progress-total">${totalAnswerable}</span> answered</p>
      <p id="storage-notice" class="notice storage-notice" hidden>Responses are kept in this browser only — no shared database is connected for this view.</p>
    </div>
  </header>
  <details class="key-details">
    <summary>Key: authority, boldness, persistence, rulings</summary>
    ${renderKey(data.key)}
  </details>`;
}

// ---------------------------------------------------------------------------
// Stylesheet.
// ---------------------------------------------------------------------------

const STYLES = `
:root {
  color-scheme: light dark;
  --paper: #F1F3EE;
  --surface: #FFFFFF;
  --surface-sunken: #E7EBE1;
  --line: #D9DED3;
  --line-strong: #BFC8B7;
  --ink: #1B211C;
  --ink-soft: #545E51;
  --ink-faint: #7C8578;
  --seal: #2E4374;
  --seal-strong: #1F2F52;
  --seal-soft: #E3E8F1;
  --amber: #8A5A16;
  --amber-soft: #F3E6CE;
  --teal: #3C6E64;
  --teal-soft: #DEEBE6;
  --ins: #1E6B3A;
  --ins-bg: #DEF0E2;
  --del: #9C2B2E;
  --del-bg: #F7DEDC;
  --focus-ring: #2A5FD1;
  --shadow-toolbar: 0 -2px 10px rgba(20, 23, 15, 0.08);
  --font-body: 'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-serif: 'Newsreader', Georgia, 'Iowan Old Style', serif;
  --font-mono: 'JetBrains Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --paper: #14170F;
    --surface: #1B1F16;
    --surface-sunken: #10130C;
    --line: #333A2C;
    --line-strong: #48513D;
    --ink: #E9ECE2;
    --ink-soft: #ADB6A2;
    --ink-faint: #808A72;
    --seal: #93ACE3;
    --seal-strong: #C1D1F2;
    --seal-soft: #223252;
    --amber: #E5B26A;
    --amber-soft: #3B2E15;
    --teal: #92D2C4;
    --teal-soft: #1C332B;
    --ins: #7FDB9C;
    --ins-bg: #163420;
    --del: #F2999B;
    --del-bg: #3C1A1B;
    --focus-ring: #9FC0FF;
    --shadow-toolbar: 0 -2px 10px rgba(0, 0, 0, 0.5);
  }
}
:root[data-theme="dark"] {
  color-scheme: dark;
  --paper: #14170F;
  --surface: #1B1F16;
  --surface-sunken: #10130C;
  --line: #333A2C;
  --line-strong: #48513D;
  --ink: #E9ECE2;
  --ink-soft: #ADB6A2;
  --ink-faint: #808A72;
  --seal: #93ACE3;
  --seal-strong: #C1D1F2;
  --seal-soft: #223252;
  --amber: #E5B26A;
  --amber-soft: #3B2E15;
  --teal: #92D2C4;
  --teal-soft: #1C332B;
  --ins: #7FDB9C;
  --ins-bg: #163420;
  --del: #F2999B;
  --del-bg: #3C1A1B;
  --focus-ring: #9FC0FF;
  --shadow-toolbar: 0 -2px 10px rgba(0, 0, 0, 0.5);
}

* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.55;
}
h1, h2, h3, h4, h5 { text-wrap: balance; font-weight: 600; }
code { font-family: var(--font-mono); word-break: break-word; }
a { color: var(--seal-strong); }
:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
.scroll-x { overflow-x: auto; }
.progress-counter, .sitting-meta, code { font-variant-numeric: tabular-nums; }

.app { min-height: 100vh; display: flex; flex-direction: column; }

.eyebrow {
  text-transform: uppercase;
  letter-spacing: .06em;
  font-size: .72rem;
  font-weight: 700;
  color: var(--ink-faint);
  margin: 0 0 .35rem;
}
.notice { color: var(--ink-soft); font-style: italic; }
.notice-inline { color: var(--ink-faint); font-size: .85rem; }

/* Masthead */
.masthead {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 2rem;
  justify-content: space-between;
  align-items: flex-end;
  background: var(--surface);
  border-bottom: 1px solid var(--line);
  padding: 1.25rem 1.5rem;
}
.masthead-main h1 { margin: 0 0 .5rem; font-size: 1.4rem; }
.sitting-id { background: var(--surface-sunken); padding: .15rem .5rem; border-radius: .3rem; font-size: .85rem; }
.sitting-question {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 1.2rem;
  margin: 0 0 .4rem;
  max-width: 46ch;
}
.sitting-meta { margin: 0; color: var(--ink-soft); font-size: .85rem; }
.masthead-progress { text-align: right; min-width: 14rem; }
.progress-counter { margin: 0 0 .4rem; font-size: 1.05rem; font-weight: 600; }
.storage-notice { max-width: 22rem; margin-left: auto; font-size: .82rem; }

.key-details { background: var(--surface); border-bottom: 1px solid var(--line); padding: .5rem 1.5rem; }
.key-details summary { cursor: pointer; font-size: .85rem; color: var(--ink-soft); padding: .35rem 0; }
.key-groups { display: grid; grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); gap: 1rem; padding: .5rem 0 1rem; }
.key-group h4 { margin: 0 0 .3rem; font-size: .78rem; text-transform: uppercase; letter-spacing: .04em; color: var(--ink-faint); }
.key-group dl { margin: 0; font-size: .82rem; }
.key-row { padding: .2rem 0; border-bottom: 1px dashed var(--line); }
.key-row dt { font-family: var(--font-mono); color: var(--seal-strong); }
.key-row dd { margin: 0 0 .2rem; color: var(--ink-soft); }

/* Layout */
.layout {
  flex: 1 0 auto;
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1.5rem;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 1.5rem;
}
.rail-summary { display: none; cursor: pointer; padding: .5rem .75rem; background: var(--surface); border: 1px solid var(--line); border-radius: .4rem; font-weight: 600; }
.rail { position: sticky; top: 1rem; align-self: start; max-height: calc(100vh - 2rem); overflow-y: auto; background: var(--surface); border: 1px solid var(--line); border-radius: .5rem; padding: 1rem; }
.rail ul { list-style: none; margin: 0 0 1rem; padding: 0; }
.rail-group:last-child ul { margin-bottom: 0; }
.rail-group-title { margin: 0 0 .4rem; font-size: .7rem; text-transform: uppercase; letter-spacing: .05em; color: var(--ink-faint); }
.rail-link { display: flex; align-items: center; gap: .5rem; padding: .35rem .5rem; border-radius: .35rem; text-decoration: none; color: var(--ink); font-size: .88rem; }
.rail-link:hover { background: var(--surface-sunken); }
.rail-link.current { background: var(--seal-soft); color: var(--seal-strong); font-weight: 600; }
.rail-status { width: .8rem; height: .8rem; border-radius: 50%; flex: none; display: inline-flex; align-items: center; justify-content: center; font-size: .55rem; color: var(--surface); }
.rail-status.status-open { background: transparent; border: 1.5px solid var(--ink-faint); }
.rail-status.status-answered { background: var(--seal); }
.rail-status.status-answered::before, .rail-status.status-fixed::before { content: '\\2713'; }
.rail-status.status-fixed { background: var(--ink-faint); }

.content { background: var(--surface); border: 1px solid var(--line); border-radius: .5rem; padding: 1.75rem 2rem; min-width: 0; }
.entry h2 { font-family: var(--font-serif); font-weight: 600; font-size: 1.55rem; margin: 0 0 .5rem; }
.entry-subhead { margin: 0 0 .5rem; }
.entry-subhead .node-id { background: var(--surface-sunken); padding: .2rem .5rem; border-radius: .3rem; font-size: .82rem; }
.entry-question { font-family: var(--font-serif); font-style: italic; font-size: 1.1rem; color: var(--ink); margin: 0 0 1rem; max-width: 62ch; }
.recorded-prose { max-width: 68ch; }

.block { margin-top: 1.85rem; }
.block h3 {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: .76rem;
  text-transform: uppercase;
  letter-spacing: .045em;
  color: var(--ink-soft);
  border-bottom: 1px solid var(--line);
  padding-bottom: .35rem;
  margin: 0 0 .85rem;
}
.block > p { max-width: 68ch; }

.chips { display: flex; flex-wrap: wrap; gap: .4rem; margin: .75rem 0; }
.chip { display: inline-flex; align-items: center; gap: .35rem; padding: .2rem .6rem; border-radius: 999px; background: var(--surface-sunken); border: 1px solid var(--line); font-size: .8rem; }
.chip-label { font-weight: 700; color: var(--ink-soft); text-transform: uppercase; font-size: .65rem; letter-spacing: .03em; }
.chip-value { color: var(--ink); }
.chip-dot { width: .5rem; height: .5rem; border-radius: 50%; display: inline-block; background: var(--ink-faint); }
.chip-dot-shim { background: var(--amber); }
.chip-dot-evidence { background: var(--teal); }
.chip-dot-open-question { background: transparent; border: 1.5px solid var(--ink-faint); }
.chip-dot-not-recorded { background: transparent; border: 1px dashed var(--ink-faint); }
.chip-authority-ratified { background: var(--seal-soft); }
.chip-authority-ratified .chip-value { color: var(--seal-strong); font-weight: 600; }
.chip-authority-delegated { background: var(--teal-soft); }
.chip-authority-delegated .chip-value { color: var(--teal); font-weight: 600; }
.chip-authority-deferred { background: var(--amber-soft); }
.chip-authority-deferred .chip-value { color: var(--amber); font-weight: 600; }

.evidence {
  font-family: var(--font-serif);
  font-style: italic;
  border-left: 3px solid var(--seal);
  background: var(--seal-soft);
  padding: .65rem 1rem;
  border-radius: 0 .3rem .3rem 0;
  margin: 0 0 .75rem;
  max-width: 68ch;
}
.evidence p { margin: 0; }
.evidence cite {
  display: block;
  font-style: normal;
  font-family: var(--font-body);
  font-size: .75rem;
  color: var(--ink-soft);
  margin-top: .4rem;
}

.diff-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: .75rem 1.25rem; margin-bottom: .85rem; }
.toggle-diff { font: inherit; font-size: .82rem; font-weight: 600; padding: .4rem .8rem; border-radius: .4rem; border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink); cursor: pointer; }
.toggle-diff:hover { background: var(--surface-sunken); }
.diff-legend { margin: 0; font-size: .78rem; color: var(--ink-soft); display: flex; gap: .75rem; }
.legend-swatch { padding: .05rem .4rem; border-radius: .2rem; }
.legend-ins { background: var(--ins-bg); color: var(--ins); }
.legend-del { background: var(--del-bg); color: var(--del); text-decoration: line-through; }

.fm-heading { font-size: .95rem; color: var(--seal-strong); margin: 0 0 .5rem; }
.frontmatter { margin: 0 0 1.25rem; min-width: 30rem; }
.fm-row { display: grid; grid-template-columns: 8rem 1fr; gap: .5rem 1rem; padding: .4rem 0; border-bottom: 1px dashed var(--line); }
.fm-row dt { font-family: var(--font-mono); font-size: .78rem; color: var(--ink-soft); margin: 0; }
.fm-row dd { margin: 0; }

.proposal-section { margin-bottom: 1.25rem; }
.proposal-section h4 { font-size: .95rem; color: var(--seal-strong); margin: 0 0 .5rem; }
.proposal-section p, .current-body p { max-width: 68ch; }
.proposal-section h5, .current-body h5 { font-size: .92rem; margin: 1rem 0 .4rem; }

ins { color: var(--ins); background: var(--ins-bg); text-decoration: none; border-radius: .15rem; padding: 0 .1rem; }
del { color: var(--del); background: var(--del-bg); text-decoration: line-through; border-radius: .15rem; padding: 0 .1rem; }
.clean-view del { display: none; }
.clean-view ins { color: inherit; background: none; padding: 0; }

.current-collapsible { margin-top: 1rem; border: 1px solid var(--line); border-radius: .4rem; padding: .25rem .9rem; background: var(--surface-sunken); }
.current-collapsible summary { cursor: pointer; padding: .6rem 0; font-weight: 600; font-size: .88rem; }
.current-collapsible .current-body { padding: .25rem 0 .9rem; }

.alternatives { list-style: none; margin: 0; padding: 0; display: grid; gap: .75rem; }
.alternatives li { border: 1px solid var(--line); border-radius: .4rem; padding: .7rem .9rem; background: var(--surface-sunken); }
.alt-text { margin: 0 0 .35rem; font-weight: 600; max-width: 68ch; }
.alt-why { margin: 0; color: var(--ink-soft); font-size: .92rem; max-width: 68ch; }

.ref-links { list-style: none; margin: 0; padding: 0; display: grid; gap: .35rem; }
.ref-links li { display: flex; flex-wrap: wrap; align-items: baseline; gap: .5rem; }
.ref-id { font-size: .75rem; color: var(--ink-faint); background: var(--surface-sunken); padding: .1rem .4rem; border-radius: .25rem; }
.ref-missing { color: var(--del); font-family: var(--font-mono); font-size: .85rem; }

.ruling-group, .option-group { display: grid; gap: .6rem; margin-bottom: 1rem; }
.ruling-option, .option-choice {
  display: flex;
  align-items: flex-start;
  gap: .65rem;
  border: 1px solid var(--line);
  border-radius: .45rem;
  padding: .65rem .85rem;
  cursor: pointer;
  background: var(--surface);
}
.ruling-option:hover, .option-choice:hover { background: var(--surface-sunken); }
.ruling-option:has(input:checked), .option-choice:has(input:checked) { border-color: var(--seal); background: var(--seal-soft); }
.ruling-option input, .option-choice input { margin-top: .2rem; flex: none; }
.option-text { display: flex; flex-direction: column; gap: .35rem; }
.ruling-key { font-family: var(--font-mono); font-weight: 600; color: var(--seal-strong); font-size: .88rem; }
.ruling-meaning { color: var(--ink-soft); font-size: .88rem; margin-left: .5rem; }
.option-label { font-weight: 600; }
.recommended-tag { margin-left: .5rem; font-size: .68rem; text-transform: uppercase; letter-spacing: .03em; background: var(--seal-soft); color: var(--seal-strong); padding: .1rem .45rem; border-radius: 999px; font-weight: 700; }

.note-label { display: block; font-size: .82rem; font-weight: 600; color: var(--ink-soft); margin-bottom: .35rem; }
.note-field { width: 100%; max-width: 68ch; min-height: 4.5rem; padding: .6rem .75rem; border: 1px solid var(--line-strong); border-radius: .4rem; background: var(--surface); color: var(--ink); font-family: inherit; font-size: .92rem; resize: vertical; }
.save-status { margin: .5rem 0 0; font-size: .82rem; color: var(--ink-soft); }
.save-status.save-error { color: var(--del); }

.toolbar {
  position: sticky;
  bottom: 0;
  flex: 0 0 auto;
  background: var(--surface);
  border-top: 1px solid var(--line);
  box-shadow: var(--shadow-toolbar);
  padding: .85rem 1.5rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: .5rem 1rem;
}
.toolbar-actions { display: flex; gap: .75rem; flex-wrap: wrap; }
.btn { font: inherit; font-size: .88rem; font-weight: 600; padding: .55rem 1.1rem; border-radius: .4rem; border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink); cursor: pointer; }
.btn:hover { background: var(--surface-sunken); }
.btn-primary { background: var(--seal); border-color: var(--seal); color: var(--surface); }
.btn-primary:hover { background: var(--seal-strong); }
.copy-fallback { width: 100%; min-height: 8rem; margin-top: .5rem; font-family: var(--font-mono); font-size: .82rem; padding: .6rem; border-radius: .4rem; border: 1px solid var(--line-strong); background: var(--surface-sunken); color: var(--ink); }
#global-notice, #copy-status, #done-status { width: 100%; margin: 0; font-size: .84rem; color: var(--ink-soft); }

@media (max-width: 860px) {
  .layout { grid-template-columns: 1fr; }
  .rail-summary { display: flex; }
  .rail { position: static; max-height: none; margin-bottom: 0; }
  .masthead-progress { text-align: left; }
  .storage-notice { margin-left: 0; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .001ms !important;
    scroll-behavior: auto !important;
  }
}
`;

// ---------------------------------------------------------------------------
// Client script. Written with plain quotes and string concatenation only
// (no template literals) so it can be embedded inside this build script's
// own template-literal strings without a stray backtick closing them early.
// ---------------------------------------------------------------------------

function buildClientScript(defaultId, sittingId, sittingDate, itemMeta) {
  const safeJson = (obj) =>
    JSON.stringify(obj)
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/\u2028/g, "\\u2028")
      .replace(/\u2029/g, "\\u2029");

  const lines = [];
  lines.push('(function () {');
  lines.push('  "use strict";');
  lines.push('  var DEFAULT_ID = ' + safeJson(defaultId) + ';');
  lines.push('  var SITTING_ID = ' + safeJson(sittingId) + ';');
  lines.push('  var SITTING_DATE = ' + safeJson(sittingDate) + ';');
  lines.push('  var ITEM_META = ' + safeJson(itemMeta) + ';');
  lines.push('  var LOCAL_KEY = "sitting-responses:" + SITTING_ID + ":" + SITTING_DATE;');
  lines.push('  var responses = Object.create(null);');
  lines.push('  var db = null;');
  lines.push('  var storageMode = "pending";');
  lines.push('');
  lines.push('  function allEntries() { return Array.prototype.slice.call(document.querySelectorAll(".entry")); }');
  lines.push('');
  lines.push('  function showEntry(id) {');
  lines.push('    var target = document.getElementById(id);');
  lines.push('    if (!target || target.className.indexOf("entry") === -1) target = document.getElementById(DEFAULT_ID);');
  lines.push('    if (!target) return;');
  lines.push('    allEntries().forEach(function (el) { el.hidden = (el !== target); });');
  lines.push('    var links = document.querySelectorAll(".rail-link");');
  lines.push('    for (var i = 0; i < links.length; i++) {');
  lines.push('      var a = links[i];');
  lines.push('      if (a.getAttribute("data-target") === target.id) { a.setAttribute("aria-current", "true"); a.className = "rail-link current"; }');
  lines.push('      else { a.removeAttribute("aria-current"); a.className = "rail-link"; }');
  lines.push('    }');
  lines.push('    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;');
  lines.push('    try { target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); } catch (e) { try { target.scrollIntoView(); } catch (e2) {} }');
  lines.push('  }');
  lines.push('');
  lines.push('  function currentIdFromHash() {');
  lines.push('    var h = window.location.hash || "";');
  lines.push('    if (h.charAt(0) === "#") h = h.slice(1);');
  lines.push('    try { h = decodeURIComponent(h); } catch (e) {}');
  lines.push('    return h || DEFAULT_ID;');
  lines.push('  }');
  lines.push('  function onHashChange() { showEntry(currentIdFromHash()); }');
  lines.push('  window.addEventListener("hashchange", onHashChange);');
  lines.push('  document.querySelectorAll(".rail-link").forEach(function (a) {');
  lines.push('    a.addEventListener("click", function () {');
  lines.push('      var wrap = document.getElementById("railWrap");');
  lines.push('      if (wrap && window.matchMedia && window.matchMedia("(max-width: 860px)").matches) wrap.open = false;');
  lines.push('    });');
  lines.push('  });');
  lines.push('  onHashChange();');
  lines.push('');
  lines.push('  document.querySelectorAll(".toggle-diff").forEach(function (btn) {');
  lines.push('    btn.addEventListener("click", function () {');
  lines.push('      var body = document.getElementById(btn.getAttribute("data-toggle-for"));');
  lines.push('      if (!body) return;');
  lines.push('      var label = btn.querySelector(".toggle-diff-label");');
  lines.push('      if (body.classList.contains("diff-view")) {');
  lines.push('        body.classList.remove("diff-view"); body.classList.add("clean-view");');
  lines.push('        btn.setAttribute("aria-pressed", "false"); if (label) label.textContent = "Show changes";');
  lines.push('      } else {');
  lines.push('        body.classList.remove("clean-view"); body.classList.add("diff-view");');
  lines.push('        btn.setAttribute("aria-pressed", "true"); if (label) label.textContent = "Show clean version";');
  lines.push('      }');
  lines.push('    });');
  lines.push('  });');
  lines.push('');
  lines.push('  var TOTAL = document.querySelectorAll("[data-save-for]").length;');
  lines.push('  function isAnswered(r) { return !!(r && (r.ruling || (r.option !== undefined && r.option !== null))); }');
  lines.push('  function countAnswered() {');
  lines.push('    var n = 0;');
  lines.push('    Object.keys(responses).forEach(function (id) { if (isAnswered(responses[id])) n++; });');
  lines.push('    return n;');
  lines.push('  }');
  lines.push('  function updateStatusMark(id) {');
  lines.push('    var mark = document.querySelector("[data-status-for=\\"" + id + "\\"]");');
  lines.push('    if (!mark || mark.className.indexOf("status-fixed") !== -1) return;');
  lines.push('    var answered = isAnswered(responses[id]);');
  lines.push('    mark.className = "rail-status " + (answered ? "status-answered" : "status-open");');
  lines.push('  }');
  lines.push('  function updateProgress() {');
  lines.push('    var el = document.getElementById("progress-count");');
  lines.push('    if (el) el.textContent = String(countAnswered());');
  lines.push('    Object.keys(responses).forEach(updateStatusMark);');
  lines.push('  }');
  lines.push('');
  lines.push('  function showSaveMessage(id, message, isError) {');
  lines.push('    var el = document.querySelector("[data-save-for=\\"" + id + "\\"]");');
  lines.push('    if (!el) return;');
  lines.push('    el.textContent = message;');
  lines.push('    el.hidden = false;');
  lines.push('    el.className = "save-status" + (isError ? " save-error" : "");');
  lines.push('    if (!isError) setTimeout(function () { el.hidden = true; }, 2500);');
  lines.push('  }');
  lines.push('');
  lines.push('  function loadLocalAll() {');
  lines.push('    try { var raw = window.localStorage.getItem(LOCAL_KEY); return raw ? JSON.parse(raw) : {}; }');
  lines.push('    catch (e) { return {}; }');
  lines.push('  }');
  lines.push('  function saveLocalOne(id, data) {');
  lines.push('    try { var all = loadLocalAll(); all[id] = data; window.localStorage.setItem(LOCAL_KEY, JSON.stringify(all)); return true; }');
  lines.push('    catch (e) { return false; }');
  lines.push('  }');
  lines.push('  function saveLocalStatus(data) {');
  lines.push('    try { window.localStorage.setItem(LOCAL_KEY + ":status", JSON.stringify(data)); return true; }');
  lines.push('    catch (e) { return false; }');
  lines.push('  }');
  lines.push('');
  lines.push('  function applyResponseToUI(id, data) {');
  lines.push('    if (!data) return;');
  lines.push('    responses[id] = data;');
  lines.push('    if (data.ruling) {');
  lines.push('      var r = document.querySelector("input[name=\\"ruling-" + id + "\\"][value=\\"" + data.ruling + "\\"]");');
  lines.push('      if (r) r.checked = true;');
  lines.push('    }');
  lines.push('    if (data.option !== undefined && data.option !== null) {');
  lines.push('      var o = document.querySelector("input[name=\\"option-" + id + "\\"][value=\\"" + data.option + "\\"]");');
  lines.push('      if (o) o.checked = true;');
  lines.push('    }');
  lines.push('    var ta = document.querySelector("textarea[data-note-for=\\"" + id + "\\"]");');
  lines.push('    if (ta && data.note && document.activeElement !== ta) ta.value = data.note;');
  lines.push('    updateStatusMark(id);');
  lines.push('  }');
  lines.push('');
  lines.push('  function persistResponse(id, data) {');
  lines.push('    responses[id] = data;');
  lines.push('    updateStatusMark(id);');
  lines.push('    updateProgress();');
  lines.push('    if (storageMode === "db" && db) {');
  lines.push('      db.collection("responses").doc(id).set(data).catch(function (e) {');
  lines.push('        showSaveMessage(id, "Could not save (" + (e && e.code ? e.code : "error") + "). Try again.", true);');
  lines.push('      });');
  lines.push('    } else {');
  lines.push('      var ok = false;');
  lines.push('      try { ok = saveLocalOne(id, data); } catch (e) { ok = false; }');
  lines.push('      if (!ok) showSaveMessage(id, "Could not save locally (storage may be full or blocked).", true);');
  lines.push('    }');
  lines.push('  }');
  lines.push('');
  lines.push('  function debounce(fn, wait) {');
  lines.push('    var t = null;');
  lines.push('    return function () {');
  lines.push('      var args = arguments, ctx = this;');
  lines.push('      if (t) clearTimeout(t);');
  lines.push('      t = setTimeout(function () { fn.apply(ctx, args); }, wait);');
  lines.push('    };');
  lines.push('  }');
  lines.push('');
  lines.push('  document.querySelectorAll("input[type=radio][data-item]").forEach(function (input) {');
  lines.push('    input.addEventListener("change", function () {');
  lines.push('      var id = input.getAttribute("data-item");');
  lines.push('      var prev = responses[id] || {};');
  lines.push('      persistResponse(id, { ruling: input.value, note: prev.note || "", updated: new Date().toISOString() });');
  lines.push('    });');
  lines.push('  });');
  lines.push('  document.querySelectorAll("input[type=radio][data-question]").forEach(function (input) {');
  lines.push('    input.addEventListener("change", function () {');
  lines.push('      var id = input.getAttribute("data-question");');
  lines.push('      var prev = responses[id] || {};');
  lines.push('      persistResponse(id, { option: Number(input.value), label: input.getAttribute("data-label") || "", note: prev.note || "", updated: new Date().toISOString() });');
  lines.push('    });');
  lines.push('  });');
  lines.push('  document.querySelectorAll("textarea[data-note-for]").forEach(function (ta) {');
  lines.push('    var id = ta.getAttribute("data-note-for");');
  lines.push('    var save = debounce(function () {');
  lines.push('      var prev = responses[id] || {};');
  lines.push('      var data = { note: ta.value, updated: new Date().toISOString() };');
  lines.push('      if (prev.ruling !== undefined) data.ruling = prev.ruling;');
  lines.push('      if (prev.option !== undefined) { data.option = prev.option; data.label = prev.label; }');
  lines.push('      persistResponse(id, data);');
  lines.push('    }, 600);');
  lines.push('    ta.addEventListener("input", save);');
  lines.push('  });');
  lines.push('');
  lines.push('  function showGlobalNotice(msg) {');
  lines.push('    var el = document.getElementById("global-notice");');
  lines.push('    if (el) { el.textContent = msg; el.hidden = false; }');
  lines.push('  }');
  lines.push('');
  lines.push('  async function initStorage() {');
  lines.push('    if (window.claude && typeof window.claude.use === "function") {');
  lines.push('      try { db = await window.claude.use("db"); } catch (e) { db = null; }');
  lines.push('    }');
  lines.push('    if (db) {');
  lines.push('      storageMode = "db";');
  lines.push('      try {');
  lines.push('        var snap = await db.collection("responses").get();');
  lines.push('        (snap.docs || []).forEach(function (d) { if (d.exists) applyResponseToUI(d.id, d.data()); });');
  lines.push('      } catch (e) {}');
  lines.push('      try {');
  lines.push('        db.collection("responses").onSnapshot(function (snap) {');
  lines.push('          snap.docs.forEach(function (d) { if (d.exists) applyResponseToUI(d.id, d.data()); });');
  lines.push('          updateProgress();');
  lines.push('        }, function (err) {');
  lines.push('          showGlobalNotice("Live updates stopped (" + (err && err.code ? err.code : "error") + ").");');
  lines.push('        });');
  lines.push('      } catch (e) {}');
  lines.push('    } else {');
  lines.push('      storageMode = "local";');
  lines.push('      var notice = document.getElementById("storage-notice");');
  lines.push('      if (notice) notice.hidden = false;');
  lines.push('      try {');
  lines.push('        var all = loadLocalAll();');
  lines.push('        Object.keys(all).forEach(function (id) { applyResponseToUI(id, all[id]); });');
  lines.push('      } catch (e) {}');
  lines.push('    }');
  lines.push('    updateProgress();');
  lines.push('  }');
  lines.push('  initStorage();');
  lines.push('');
  lines.push('  function buildCopyText() {');
  lines.push('    var lines2 = [];');
  lines.push('    lines2.push("sitting: " + SITTING_ID + " " + SITTING_DATE);');
  lines.push('    ITEM_META.forEach(function (meta) {');
  lines.push('      var r = responses[meta.id];');
  lines.push('      var val;');
  lines.push('      if (meta.kind === "item") { val = (r && r.ruling) ? r.ruling : "(none)"; }');
  lines.push('      else { val = (r && r.option !== undefined && r.option !== null) ? (r.option + 1) + " (" + (r.label || "") + ")" : "(none)"; }');
  lines.push('      lines2.push(meta.id + ": " + val);');
  lines.push('      if (r && r.note) lines2.push("    note: " + r.note);');
  lines.push('    });');
  lines.push('    return lines2.join("\\n");');
  lines.push('  }');
  lines.push('');
  lines.push('  function copyAllResponses() {');
  lines.push('    var text = buildCopyText();');
  lines.push('    var statusEl = document.getElementById("copy-status");');
  lines.push('    function showCopied(msg) {');
  lines.push('      if (statusEl) { statusEl.textContent = msg; statusEl.hidden = false; setTimeout(function () { statusEl.hidden = true; }, 3000); }');
  lines.push('    }');
  lines.push('    function fallback() {');
  lines.push('      var ta = document.getElementById("copy-fallback");');
  lines.push('      if (ta) { ta.value = text; ta.hidden = false; ta.focus(); ta.select(); }');
  lines.push('      showCopied("Clipboard unavailable — copy the text below.");');
  lines.push('    }');
  lines.push('    if (navigator.clipboard && navigator.clipboard.writeText) {');
  lines.push('      navigator.clipboard.writeText(text).then(function () {');
  lines.push('        showCopied("Copied.");');
  lines.push('        var ta = document.getElementById("copy-fallback");');
  lines.push('        if (ta) ta.hidden = true;');
  lines.push('      }).catch(fallback);');
  lines.push('    } else { fallback(); }');
  lines.push('  }');
  lines.push('  var copyBtn = document.getElementById("copy-all-btn");');
  lines.push('  if (copyBtn) copyBtn.addEventListener("click", copyAllResponses);');
  lines.push('');
  lines.push('  var doneBtn = document.getElementById("done-btn");');
  lines.push('  if (doneBtn) doneBtn.addEventListener("click", async function () {');
  lines.push('    var answered = countAnswered();');
  lines.push('    var payload = { done: true, at: new Date().toISOString(), answered: answered, total: TOTAL };');
  lines.push('    var statusEl = document.getElementById("done-status");');
  lines.push('    function confirmDone() {');
  lines.push('      if (statusEl) { statusEl.textContent = "Marked done — " + answered + " of " + TOTAL + " answered, saved."; statusEl.hidden = false; }');
  lines.push('    }');
  lines.push('    if (storageMode === "db" && db) {');
  lines.push('      try { await db.doc("meta/status").set(payload); confirmDone(); }');
  lines.push('      catch (e) { if (statusEl) { statusEl.textContent = "Could not save (" + (e && e.code ? e.code : "error") + ")."; statusEl.hidden = false; } }');
  lines.push('    } else {');
  lines.push('      var ok = false;');
  lines.push('      try { ok = saveLocalStatus(payload); } catch (e) { ok = false; }');
  lines.push('      if (ok) confirmDone();');
  lines.push('      else if (statusEl) { statusEl.textContent = "Could not save locally."; statusEl.hidden = false; }');
  lines.push('    }');
  lines.push('  });');
  lines.push('})();');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Page assembly.
// ---------------------------------------------------------------------------

function assemblePage(parts) {
  return `<title>Purpose Sitting</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&family=Newsreader:ital,wght@0,400;0,500;0,600;1,400;1,500&family=JetBrains+Mono:wght@400;500;600&display=swap">
<style>${STYLES}</style>

<div class="app">
  ${parts.headerHtml}
  <div class="layout">
    <details class="rail-wrap" id="railWrap" open>
      <summary class="rail-summary">Contents</summary>
      <nav class="rail" aria-label="Sitting index">
        ${parts.railRecorded}
        ${parts.railItems}
        ${parts.railQuestions}
      </nav>
    </details>
    <main class="content" id="content">
      ${parts.recordedHtml}
      ${parts.itemsHtml}
      ${parts.questionsHtml}
    </main>
  </div>
  <footer class="toolbar">
    <p id="global-notice" class="notice" hidden></p>
    <div class="toolbar-actions">
      <button type="button" id="copy-all-btn" class="btn">Copy all responses</button>
      <button type="button" id="done-btn" class="btn btn-primary">Done reviewing</button>
    </div>
    <p id="copy-status" class="notice" hidden></p>
    <p id="done-status" class="notice" hidden></p>
    <textarea id="copy-fallback" class="copy-fallback" readonly hidden aria-label="Copyable text of all responses"></textarea>
  </footer>
</div>

<script>
${parts.clientScript}
</script>`;
}

// ---------------------------------------------------------------------------
// Current-node loading.
// ---------------------------------------------------------------------------

const CANONICAL_ID_RE = /^commons\.systems\/([^/\s]+)\/([^/\s]+)$/;

async function loadCurrentNodeById(id) {
  const m = CANONICAL_ID_RE.exec(id || '');
  if (!m) return null;
  const [, graph, slug] = m;
  const filePath = path.join(DISPOSITION_ROOT, graph, `${slug}.md`);
  let text;
  try {
    text = await readFile(filePath, 'utf8');
  } catch {
    return null;
  }
  const parsed = parseNodeText(text);
  return { ...parsed, path: filePath };
}

// ---------------------------------------------------------------------------
// Main.
// ---------------------------------------------------------------------------

async function main() {
  const yamlText = await readFile(YAML_PATH, 'utf8');
  const data = YAML.parse(yamlText);

  const ctx = {
    titleById: new Map(),
    currentByItemId: new Map(),
    missingRefs: [],
    rulings: Object.entries(data.key.rulings),
  };
  for (const it of data.items) ctx.titleById.set(it.id, it.title);
  for (const q of data.questions) ctx.titleById.set(q.id, q.title);

  for (const it of data.items) {
    for (const dep of it.depends_on || []) {
      if (!ctx.titleById.has(dep)) ctx.missingRefs.push(`item "${it.id}" depends_on unknown id "${dep}"`);
    }
    const current = await loadCurrentNodeById(it.node);
    ctx.currentByItemId.set(it.id, current);
    if (CANONICAL_ID_RE.test(it.node) && !current) {
      ctx.missingRefs.push(`item "${it.id}" node id "${it.node}" looks canonical but no file was found`);
    }
  }
  for (const q of data.questions) {
    for (const f of q.feeds || []) {
      if (!ctx.titleById.has(f)) ctx.missingRefs.push(`question "${q.id}" feeds unknown id "${f}"`);
    }
  }

  const purposeItem = data.items.find((it) => it.node === data.sitting) || null;
  const totalAnswerable = data.items.length + data.questions.length;

  const railRecorded = renderRailGroup(
    'Recorded today',
    data.recorded.map((r) => ({ id: r.id, title: r.title, fixed: true }))
  );
  const railItems = renderRailGroup(
    'Nodes for ruling',
    data.items.map((it) => ({ id: it.id, title: it.title, fixed: false }))
  );
  const railQuestions = renderRailGroup(
    'Questions',
    data.questions.map((q) => ({ id: q.id, title: q.title, fixed: false }))
  );

  const recordedHtml = data.recorded.map((r) => renderRecordedEntry(r, data.date)).join('\n');
  const itemsHtml = data.items.map((it) => renderNodeItem(it, ctx)).join('\n');
  const questionsHtml = data.questions.map((q) => renderQuestion(q, ctx)).join('\n');

  const headerHtml = renderHeader(data, purposeItem, totalAnswerable);

  const defaultId = purposeItem ? purposeItem.id : data.items[0] ? data.items[0].id : data.recorded[0].id;
  const itemMeta = [
    ...data.items.map((it) => ({ id: it.id, kind: 'item' })),
    ...data.questions.map((q) => ({ id: q.id, kind: 'question' })),
  ];
  const clientScript = buildClientScript(defaultId, data.sitting, data.date, itemMeta);

  const html = assemblePage({
    headerHtml,
    railRecorded,
    railItems,
    railQuestions,
    recordedHtml,
    itemsHtml,
    questionsHtml,
    clientScript,
  });

  await writeFile(OUT_PATH, html, 'utf8');

  console.log(`Wrote ${OUT_PATH}`);
  console.log(`Recorded entries: ${data.recorded.length}`);
  console.log(`Items: ${data.items.length}`);
  console.log(`Questions: ${data.questions.length}`);
  if (ctx.missingRefs.length) {
    console.log('Input inconsistencies found:');
    for (const m of ctx.missingRefs) console.log(' - ' + m);
  } else {
    console.log('No input inconsistencies found: all depends_on/feeds ids resolve within the sitting, and every canonical node id has a matching file.');
  }
}

// Runs as a script by default; also importable (e.g. for a smoke test of the
// diff/escaping helpers) without triggering the file read + write, matching
// the isMain convention packages/disposition/read.mjs uses.
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}

export { escapeHtml, inlineParse, renderInline, toDiffTokens, lcsDiff, renderDiffOps, renderDiffedSection, splitBlocks, flattenForDiff, renderBlocksPlain, parseNodeText, renderFrontmatterDiff, renderFrontmatterPlain };
