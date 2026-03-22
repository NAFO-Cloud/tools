# Dialogue Archivist — Phase 0

This local-first Dialogue Archivist repairs flattened ChatGPT transcripts and produces readable Markdown and Logseq-friendly exports. The repo contains a minimal Python tool, an example input, an AI‑readable Logseq example output, and a GitHub Actions workflow to run the generator on-demand (workflow_dispatch).

## How to use

- Use the repository UI or Codespaces to run the generator, or trigger the workflow `Generate repaired transcript` from the Actions tab.
- The workflow runs `dialogue_archivist.py` on `dialogue-archivist/examples/input_missing_labels.txt` and writes `dialogue-archivist/examples/output_logseq.md`.

## Goals

- Phase 0: repair speaker labels and produce a canonical dialogue Markdown file with YAML frontmatter.
- Provide an "Improve for AI readability" mode that emits a Logseq-friendly header, structured dialogue bullets, and a Conclusion section.

## Files in this folder:
- dialogue_archivist.py — core parser and exporter
- examples/input_missing_labels.txt — sample flattened transcript
- examples/output_logseq.md — expected output (Logseq-ready)

## Design notes

- Local-first, no external APIs
- Workflow in Actions is provided for convenience (runs on manual dispatch)
