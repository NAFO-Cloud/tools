#!/usr/bin/env python3
"""
Dialogue Archivist - Phase 0 with Logseq export / Improve-for-AI-Readability mode

Usage examples:
  python dialogue_archivist.py examples/input_gpt_female.md --participants "Thera Medica,Miss Vika,Calm Harbor,Renars Odins,Librarian of the Ghost" --title "GPT Female workflow" --mode logseq --out examples/output_gpt_female_logseq.md

Modes:
  markdown      - produce canonical dialogue markdown with YAML frontmatter
  logseq       - produce Logseq-friendly export with header and Conclusion section
"""
from datetime import datetime
import re
import argparse
from pathlib import Path
import uuid
import textwrap
import sys

EXPLICIT_LABEL_RE = re.compile(r'^\s*(?P<label>[A-Z][A-Za-z0-9 _\-]{1,40})(?:\s*(?:said|writes|:|—|–)\s*)', re.IGNORECASE)
BOLD_LABEL_RE = re.compile(r'^\s*\**(?P<label>[A-Z][A-Za-z0-9 _\-]{1,40})\**\s*[:\-]\s*', re.IGNORECASE)

def read_text(path_or_dash):
    if path_or_dash == '-':
        return sys.stdin.read()
    return Path(path_or_dash).read_text(encoding='utf-8')

def guess_blocks(text):
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    blocks = [b.strip() for b in re.split(r'\n{2,}', text) if b.strip()]
    return blocks

def detect_label_in_block(block):
    first_line = block.splitlines()[0].strip()
    m = EXPLICIT_LABEL_RE.match(first_line)
    if m:
        return m.group('label').strip()
    m2 = BOLD_LABEL_RE.match(first_line)
    if m2:
        return m2.group('label').strip()
    return None

def strip_initial_label(block, label):
    patterns = [
        r'^\s*\**' + re.escape(label) + r'\**\s*[:\-]\s*',
        r'^\s*' + re.escape(label) + r'\s*(?:said|writes)\s*[:\-\s]*',
        r'^\s*' + re.escape(label) + r'\s*—\s*',
    ]
    for p in patterns:
        new = re.sub(p, '', block, flags=re.IGNORECASE)
        if new != block:
            return new.strip()
    return block

def normalize_label(name):
    return re.sub(r'\s+', ' ', name).strip()

def assign_speakers(blocks, participants):
    parts = [p.strip() for p in participants if p.strip()]
    assigned = []
    alt_index = 0
    for block in blocks:
        label = detect_label_in_block(block)
        if label:
            speaker = normalize_label(label)
            cleaned = strip_initial_label(block, label)
        else:
            if parts:
                speaker = parts[alt_index % len(parts)]
                alt_index += 1
            else:
                speaker = "Unknown"
            cleaned = block
        assigned.append((speaker, cleaned.strip()))
    return assigned

def make_yaml_frontmatter(meta):
    lines = ['---']
    for k, v in meta.items():
        if isinstance(v, list):
            lines.append(f"{k}:")
            for item in v:
                lines.append(f"  - \"{item}\"")
        else:
            safe = str(v).replace('"', '\\"')
            lines.append(f'{k}: \"{safe}\"')
    lines.append('---\n')
    return '\n'.join(lines)

def render_markdown(meta, assigned):
    out = []
    out.append(make_yaml_frontmatter(meta))
    out.append("## Dialogue\n")
    for speaker, text in assigned:
        out.append(f"**{speaker}:**  \n{text}\n")
    out.append("\n## Notes / Insights\n- Repaired by Dialogue Archivist Phase 0\n")
    return '\n'.join(out)

def make_logseq_header(meta):
    lines = []
    lines.append(f"- title:: {meta.get('title')}")
    lines.append(f"  date:: {meta.get('created_at')}")
    parts = meta.get('participants') or []
    if parts:
        participants_line = '  participants:: ' + ' '.join(f'[[{p}]]' for p in parts)
        lines.append(participants_line)
    tags = meta.get('tags') or []
    if tags:
        lines.append('  tags:: ' + ', '.join(tags))
    lines.append('  source:: ' + meta.get('source', 'chatgpt-thread'))
    lines.append('  thread_type:: ' + meta.get('thread_type', 'situational'))
    lines.append('  ---')
    return '\n'.join(lines)

def render_logseq(meta, assigned, conclusion=None):
    lines = []
    lines.append(make_logseq_header(meta))
    lines.append('')  # blank line   
    for i, (speaker, text) in enumerate(assigned, start=1):
        lines.append(f"- **{speaker}** :: {text.splitlines()[0]}")
        rest = '\n'.join(text.splitlines()[1:]).strip()
        if rest:
            wrapped = textwrap.fill(rest, width=100)
            for l in wrapped.splitlines():
                lines.append(f"  - {l}")
    lines.append('')
    lines.append('## Conclusion')
    if conclusion:
        lines.append(conclusion)
    else:
        summary = generate_summary(assigned)
        lines.append(f"- Summary: {summary}")
        lines.append("- Action items:")
        lines.append("  - Clarify participant names / roles in metadata")
        lines.append("  - Verify ambiguous turns and correct if needed")
        lines.append("  - Tag this file with relevant project tags and move to persistent memory if approved")
    return '\n'.join(lines)

def generate_summary(assigned):
    participants = sorted({s for s, _ in assigned})
    first = assigned[0][0] if assigned else ""
    last = assigned[-1][0] if assigned else ""
    return f"Participants: {', '.join(participants)}. First speaker: {first}. Last speaker: {last}."

def canonical_id(title):
    now = datetime.utcnow().isoformat() + 'Z'
    uid = f"dlg-{now[:10]}-{re.sub(r'[^a-z0-9-]', '-', title.lower())[:40]}-{str(uuid.uuid4())[:6]}"
    return uid

def build_meta(args):
    now = datetime.utcnow().isoformat() + 'Z'
    meta = {
        'id': args.id or canonical_id(args.title),
        'type': 'dialogue',
        'title': args.title,
        'created_at': now,
        'updated_at': now,
        'status': args.status,
        'memory_layer': args.memory_layer,
        'visibility': args.visibility,
        'source': args.source,
        'participants': [p.strip() for p in args.participants.split(',')] if args.participants else [],
        'tags': args.tags.split(',') if args.tags else ['transcript-repair'],
        'version': 1,
        'owner': args.owner or '',
        'review_state': 'unreviewed',
        'thread_type': args.thread_type or 'situational'
    }
    return meta

def main():
    ap = argparse.ArgumentParser(description="Dialogue Archivist - Phase 0 (Logseq export mode)")
    ap.add_argument('input', help='input file path or - for stdin')
    ap.add_argument('--participants', default='', help='comma-separated participants')
    ap.add_argument('--title', default='Dialogue', help='human title')
    ap.add_argument('--owner', default='', help='owner name')
    ap.add_argument('--out', default='', help='output file path (default stdout)')
    ap.add_argument('--mode', default='markdown', choices=['markdown', 'logseq'], help='output mode')
    ap.add_argument('--status', default='draft')
    ap.add_argument('--memory_layer', default='io')
    ap.add_argument('--visibility', default='private')
    ap.add_argument('--source', default='chatgpt-thread')
    ap.add_argument('--tags', default='')
    ap.add_argument('--thread_type', default='situational')
    ap.add_argument('--id', default='')
    args = ap.parse_args()

    raw = read_text(args.input)
    blocks = guess_blocks(raw)
    assigned = assign_speakers(blocks, [p.strip() for p in args.participants.split(',')] if args.participants else [])
    meta = build_meta(args)

    if args.mode == 'markdown':
        out = render_markdown(meta, assigned)
    else:
        out = render_logseq(meta, assigned)

    if args.out:
        Path(args.out).write_text(out, encoding='utf-8')
        print(f"WROTE: {args.out}")
    else:
        print(out)

if __name__ == '__main__':
    main()
