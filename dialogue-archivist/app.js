/*
dialogue-archivist/app.js
Browser-only Dialogue Archivist: parse pasted flattened transcripts,
detect speaker blocks with conservative heuristics, provide manual correction,
and export Markdown. No external libs, no network calls.
*/

document.addEventListener('DOMContentLoaded', () => {
  // Config
  const MAX_PARTICIPANTS = 10;
  const MIN_PARTICIPANTS = 2;
  const DEMO_NAMES = ['Thera Medica','Miss Vika','Calm Harbor','Librarian of the Ghost','Renars Odins','ChatGPT','Assistant','User','NAFO','Eila'];

  // DOM refs
  const participantsContainer = document.getElementById('participants');
  const addParticipantBtn = document.getElementById('addParticipant');
  const rawInput = document.getElementById('raw');
  const splitBlankRadio = document.getElementById('splitBlank');
  const splitLineRadio = document.getElementById('splitLine');
  const addLabelsBtn = document.getElementById('addLabels');
  const blocksContainer = document.getElementById('blocksContainer');
  const outputArea = document.getElementById('output');
  const copyBtn = document.getElementById('copyOutput');
  const downloadBtn = document.getElementById('downloadMd');
  const regenerateBtn = document.getElementById('regenerateFromEdits');

  // Create initial participant inputs (start with 2)
  function createParticipantRow(name = '') {
    const wrapper = document.createElement('div');
    wrapper.className = 'participant-row';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'participant-input';
    input.placeholder = 'Participant name';
    input.value = name || '';
    wrapper.appendChild(input);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'small remove-participant';
    removeBtn.title = 'Remove participant';
    removeBtn.textContent = '−';
    removeBtn.addEventListener('click', () => {
      // Only remove if more than MIN_PARTICIPANTS remain
      const count = participantsContainer.querySelectorAll('.participant-row').length;
      if (count > MIN_PARTICIPANTS) {
        wrapper.remove();
      } else {
        // clear value instead
        input.value = '';
      }
    });
    wrapper.appendChild(removeBtn);

    return wrapper;
  }

  function buildInitialParticipantInputs() {
    participantsContainer.innerHTML = '';
    for (let i = 0; i < MIN_PARTICIPANTS; i++) {
      const name = DEMO_NAMES[i] || '';
      participantsContainer.appendChild(createParticipantRow(name));
    }
  }

  buildInitialParticipantInputs();

  addParticipantBtn.addEventListener('click', () => {
    const current = participantsContainer.querySelectorAll('.participant-row').length;
    if (current >= MAX_PARTICIPANTS) {
      alert(`Maximum ${MAX_PARTICIPANTS} participants reached.`);
      return;
    }
    const nextName = DEMO_NAMES[current] || '';
    participantsContainer.appendChild(createParticipantRow(nextName));
  });

  // Utilities
  function normalizeNewlines(s) {
    return (s || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  function isCodeFence(line) {
    return /^\s*```/.test(line);
  }

  function escapeForRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Conservative prefix trimming: remove a single common prefix at start of block
  function trimCommonPrefix(text) {
    if (!text) return text;
    const firstLine = text.split('\n')[0];
    if (/^\s*```/.test(firstLine)) return text; // do not strip inside code fences
    const patterns = [
      /^\s*(User|Assistant|ChatGPT|System)\s*:\s*/i,
      /^\s*([\w\-\s]{1,60}?)\s*(?:said|says|writes)\s*[:\-]\s*/i,
      /^\s*([\w\-\s]{1,60}?)\s*:\s*/i
    ];
    for (const p of patterns) {
      const m = firstLine.match(p);
      if (m) {
        const rest = firstLine.replace(p, '').trim();
        const remaining = text.split('\n').slice(1).join('\n');
        return (rest + (remaining ? '\n' + remaining : '')).trim();
      }
    }
    return text;
  }

  // Detect explicit label at start of line (conservative)
  function detectExplicitLabel(line) {
    if (!line) return null;
    if (/^\s*```/.test(line)) return null;
    const m = line.match(/^\s*\**\s*([A-Za-z\u00C0-\u017F][A-Za-z0-9 _\-\u00C0-\u017F]{1,40}?)\s*\**\s*(?:[:\-—–]|(?:said|says|writes)\b[:\-]?)\s*/i);
    if (m) return m[1].trim();
    return null;
  }

  function stripDetectedPrefixFromLine(line, label) {
    if (!label) return line;
    const re = new RegExp('^\\s*\\**\\s*' + escapeForRegex(label) + '\\s*\\**\\s*(?:[:\\-—–]|(?:said|says|writes)\\b[:\\-]?)\\s*', 'i');
    return line.replace(re, '').trim();
  }

  // Parsing: split text into blocks depending on mode, respecting code fences and explicit labels.
  // Returns array of { explicit: string|null, text: string, hadBlankBefore: boolean }
  function parseTextIntoBlocks(rawText, splitMode) {
    const text = normalizeNewlines(rawText || '');
    const lines = text.split('\n');
    const blocks = [];
    let inFence = false;
    let current = { explicit: null, lines: [], hadBlankBefore: false };

    function pushCurrent() {
      const joined = current.lines.join('\n').trim();
      if (joined.length > 0 || current.explicit) {
        blocks.push({ explicit: current.explicit, text: joined, hadBlankBefore: current.hadBlankBefore });
      }
      current = { explicit: null, lines: [], hadBlankBefore: false };
    }

    let hadPrevBlank = true;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Toggle fence state
      if (isCodeFence(line)) {
        // Always include fence line in current block
        current.lines.push(line);
        inFence = !inFence;
        hadPrevBlank = false;
        continue;
      }

      if (inFence) {
        // Within code fence, do not examine for labels or splitting
        current.lines.push(line);
        hadPrevBlank = false;
        continue;
      }

      const explicit = detectExplicitLabel(line);
      const isBlank = /^\s*$/.test(line);

      if (explicit) {
        // If current has content, push it first as separate block
        if (current.lines.length) {
          pushCurrent();
        }
        // Start new block with explicit label; store the rest of the line as content if any
        const rest = stripDetectedPrefixFromLine(line, explicit);
        current.explicit = explicit;
        if (rest) current.lines.push(rest);
        current.hadBlankBefore = hadPrevBlank;
        hadPrevBlank = false;
        continue;
      }

      if (splitMode === 'line') {
        // Every non-empty line becomes its own block
        if (isBlank) {
          hadPrevBlank = true;
          continue;
        } else {
          if (current.lines.length) pushCurrent();
          blocks.push({ explicit: null, text: line.trim(), hadBlankBefore: hadPrevBlank });
          hadPrevBlank = false;
          continue;
        }
      }

      // splitMode === 'blank' (default)
      if (isBlank) {
        pushCurrent();
        hadPrevBlank = true;
        continue;
      }

      // accumulate into current paragraph block
      current.lines.push(line);
      current.hadBlankBefore = hadPrevBlank;
      hadPrevBlank = false;
    }

    pushCurrent();
    return blocks;
  }

  // Assignment strategy: conservative and in prioritized order
  function assignSpeakers(blocks, participantNames, splitMode) {
    const normalizedParticipants = (participantNames || []).map(p => p.trim()).filter(Boolean);
    const anyExplicit = blocks.some(b => b.explicit && b.explicit.length);
    const assigned = new Array(blocks.length).fill(null);

    // 1) explicit labels map
    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i].explicit) {
        // prefer participant exact match (case-insensitive)
        const explicit = blocks[i].explicit;
        const matchIndex = normalizedParticipants.findIndex(p => p.toLowerCase() === explicit.toLowerCase());
        assigned[i] = matchIndex >= 0 ? normalizedParticipants[matchIndex] : explicit;
      }
    }

    // 2) strip simple prefixes like User: Assistant: if present in first line and not captured
    for (let i = 0; i < blocks.length; i++) {
      if (assigned[i]) continue;
      const firstLine = (blocks[i].text || '').split('\n')[0] || '';
      const smallPrefix = firstLine.match(/^\s*(User|Assistant|ChatGPT|System)\s*:\s*(.+)?/i);
      if (smallPrefix) {
        const label = smallPrefix[1];
        const mapIndex = normalizedParticipants.findIndex(p => p.toLowerCase() === label.toLowerCase());
        assigned[i] = mapIndex >= 0 ? normalizedParticipants[mapIndex] : label;
        // strip from block text
        blocks[i].text = blocks[i].text.replace(/^\s*(User|Assistant|ChatGPT|System)\s*:\s*/i, '').trim();
      }
    }

    // 3) paragraph continuity: if current had no blank before, assume continuity with previous speaker
    for (let i = 0; i < blocks.length; i++) {
      if (assigned[i]) continue;
      if (i > 0 && assigned[i - 1] && !blocks[i].hadBlankBefore) {
        assigned[i] = assigned[i - 1];
      }
    }

    // 4) short-chain fallback (weak): short lines likely continuation -> assign to neighbor
    for (let i = 0; i < blocks.length; i++) {
      if (assigned[i]) continue;
      const len = (blocks[i].text || '').replace(/\s+/g, ' ').trim().length;
      if (len > 0 && len <= 30) {
        if (i > 0 && assigned[i - 1]) {
          assigned[i] = assigned[i - 1];
        } else if (i + 1 < blocks.length && assigned[i + 1]) {
          assigned[i] = assigned[i + 1];
        }
      }
    }

    // 5) alternating fallback only when no explicit labels exist anywhere and participants provided
    if (!anyExplicit && normalizedParticipants.length) {
      let idx = 0;
      for (let i = 0; i < blocks.length; i++) {
        if (!assigned[i]) {
          assigned[i] = normalizedParticipants[idx % normalizedParticipants.length];
          idx++;
        } else {
          const pos = normalizedParticipants.findIndex(p => p === assigned[i]);
          if (pos >= 0) idx = (pos + 1) % normalizedParticipants.length;
        }
      }
    }

    // leave remaining unassigned as null (so user can correct)
    for (let i = 0; i < blocks.length; i++) {
      if (!assigned[i]) assigned[i] = null;
    }

    return assigned;
  }

  // Preserve code fences and basic paragraph shapes; produce markdown for one block
  function preserveCodeFences(text) {
    if (!text) return '';
    // Split on fence lines while keeping them in output; for non-fence parts, normalize multi-newlines
    const parts = text.split(/(^\s*```.*$)/m);
    for (let i = 0; i < parts.length; i++) {
      if (/^\s*```/.test(parts[i])) {
        // leave fence and subsequent block untouched
        continue;
      }
      // compress 3+ newlines to two newlines, keep other newlines as-is
      parts[i] = parts[i].replace(/\n{3,}/g, '\n\n');
    }
    return parts.join('');
  }

  function sanitizeForOutput(text) {
    // apply conservative prefix trim to avoid duplicate "Renars said: said:"
    return trimCommonPrefix(text);
  }

  function buildMarkdownFromBlocks(blocks, assigned) {
    const lines = [];
    for (let i = 0; i < blocks.length; i++) {
      const speaker = assigned[i];
      const rawText = blocks[i].text || '';
      const cleaned = sanitizeForOutput(rawText);
      const body = preserveCodeFences(cleaned);
      if (speaker) {
        lines.push(`**${speaker}:**  `);
        lines.push(body);
        lines.push('');
      } else {
        // unassigned block: keep content but no label
        lines.push(body);
        lines.push('');
      }
    }
    return lines.join('\n').trim() + '\n';
  }

  // UI: present blocks for manual correction. Each block: dropdown (speaker) + textarea
  function showBlocksForReview(blocks, assigned, participantNames) {
    blocksContainer.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'blocks-header';
    header.innerHTML = `<strong>Review parsed blocks</strong> — edit text or change speaker for each block, then click "Regenerate from edits".`;
    blocksContainer.appendChild(header);

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      const wrap = document.createElement('div');
      wrap.className = 'block-wrap';

      const labelRow = document.createElement('div');
      labelRow.className = 'block-label-row';

      const sel = document.createElement('select');
      sel.className = 'block-speaker-select';

      const emptyOpt = document.createElement('option');
      emptyOpt.value = '';
      emptyOpt.textContent = '(Unassigned)';
      sel.appendChild(emptyOpt);

      participantNames.forEach(p => {
        if (!p) return;
        const opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p;
        sel.appendChild(opt);
      });

      if (b.explicit && !participantNames.some(p => p.toLowerCase() === b.explicit.toLowerCase())) {
        const opt = document.createElement('option');
        opt.value = b.explicit;
        opt.textContent = `${b.explicit} (from text)`;
        sel.appendChild(opt);
      }

      sel.value = assigned[i] || '';
      labelRow.appendChild(sel);

      const meta = document.createElement('span');
      meta.className = 'block-meta';
      meta.textContent = b.explicit ? ` (detected: ${b.explicit})` : (b.hadBlankBefore ? ' (new paragraph)' : '');
      labelRow.appendChild(meta);

      wrap.appendChild(labelRow);

      const ta = document.createElement('textarea');
      ta.className = 'block-text';
      const linesCount = Math.min(12, Math.max(2, (b.text || '').split('\n').length));
      ta.rows = linesCount;
      ta.value = b.text || '';
      wrap.appendChild(ta);

      blocksContainer.appendChild(wrap);
    }

    regenerateBtn.style.display = 'inline-block';
    // ensure regenerate button available
    regenerateBtn.focus();
  }

  // Regenerate output from edited blocks
  function regenerateOutputFromEdits() {
    const wraps = Array.from(blocksContainer.querySelectorAll('.block-wrap'));
    const newBlocks = [];
    const newAssigned = [];
    wraps.forEach(wrap => {
      const sel = wrap.querySelector('.block-speaker-select');
      const ta = wrap.querySelector('.block-text');
      newBlocks.push({ explicit: null, text: ta.value, hadBlankBefore: false });
      newAssigned.push(sel.value ? sel.value : null);
    });
    const md = buildMarkdownFromBlocks(newBlocks, newAssigned);
    outputArea.value = md;
    outputArea.scrollIntoView({ behavior: 'smooth' });
  }

  // Copy output to clipboard
  copyBtn.addEventListener('click', () => {
    outputArea.select();
    try {
      document.execCommand('copy');
      copyBtn.textContent = 'Copied';
      setTimeout(() => { copyBtn.textContent = 'Copy output'; }, 1500);
    } catch (e) {
      alert('Copy failed; please select and copy manually.');
    }
  });

  // Download markdown
  downloadBtn.addEventListener('click', () => {
    const blob = new Blob([outputArea.value], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dialogue_repaired.md';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  regenerateBtn.addEventListener('click', regenerateOutputFromEdits);

  // Primary flow: Add labels -> parse -> assign -> show review -> generate initial md
  addLabelsBtn.addEventListener('click', () => {
    const raw = rawInput.value || '';
    const splitMode = splitLineRadio.checked ? 'line' : 'blank';
    const participantNames = Array.from(participantsContainer.querySelectorAll('.participant-input')).map(i => i.value.trim()).filter(Boolean);
    if (!raw.trim()) {
      alert('Please paste a transcript into the input area.');
      return;
    }
    const blocks = parseTextIntoBlocks(raw, splitMode);
    const assigned = assignSpeakers(blocks, participantNames, splitMode);
    showBlocksForReview(blocks, assigned, participantNames);
    const md = buildMarkdownFromBlocks(blocks, assigned);
    outputArea.value = md;
    // show regenerate button if not already visible
    regenerateBtn.style.display = 'inline-block';
    blocksContainer.scrollIntoView({ behavior: 'smooth' });
  });

  // Accessibility: allow Ctrl/Cmd+Enter in raw input to trigger Add labels
  rawInput.addEventListener('keydown', (ev) => {
    if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') {
      addLabelsBtn.click();
    }
  });

  // Expose small debugging helper in devtools (not necessary for users)
  window.__dialogue_archivist = {
    parseTextIntoBlocks,
    assignSpeakers,
    buildMarkdownFromBlocks
  };
});
