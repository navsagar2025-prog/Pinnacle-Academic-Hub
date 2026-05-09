# PYQ (Previous Year Questions) ingest

Heuristic PDF parser for JEE Main / JEE Advanced / NEET / CBSE / NCERT-Exemplar
papers. Output rows have `source='PYQ'` and land in the **review queue**
(`reviewStatus='pending'`, `isPublished=false`) by default — a teacher must
approve them before they appear to students.

## Usage

```bash
# 1. Live ingest from a PDF (review queue):
pnpm --filter @workspace/db run ingest:pyq -- ./jee-main-2023-jan-shift1.pdf \
  --exam JEE_MAIN --year 2023 --subject Physics --class 11 \
  --label "JEE Main 2023 Jan Shift 1 Physics"

# 2. Dry-run (parse + plan, do not touch DB):
pnpm --filter @workspace/db run ingest:pyq -- ./paper.pdf \
  --exam NEET --year 2024 --subject Biology --class 12 --dry-run

# 3. Test the parser on the bundled text fixture (no PDF needed):
pnpm --filter @workspace/db run ingest:pyq -- \
  src/ingest/pyq/fixtures/jee-main-2023-physics-sample.txt \
  --from-text --exam JEE_MAIN --year 2023 --subject Physics --class 11 --dry-run
```

## What the pipeline does

1. **Extract** raw text from the PDF (`pdf-parse`). Scanned PDFs are NOT
   supported — run OCR first.
2. **Segment** questions using regex anchors (monotonic numbering: `1.`, `Q1.`,
   `(1)`, etc.). Questions with no parsed options or fewer than 2 options
   are dropped.
3. **Parse the answer key** at the end of the document. Questions with no
   matching key entry are dropped (counted in `unanswered`).
4. **Dedup in-batch** by `subject + normalizeForDedup(questionText)` (LaTeX
   stripped, punctuation/case folded — same key the Foundation seed uses).
5. **Multi-year merge**: if the question already exists in the DB as a PYQ for
   the same subject, the new year is appended to its `examName` instead of
   creating a duplicate row. Example:
   `"JEE Main 2021 Physics" → "JEE Main 2021 Physics (also appeared 2023, 2024)"`.
6. **Insert** the rest as PYQ rows with `reviewStatus='pending'`.

## Flags

| Flag             | Effect                                                              |
|------------------|---------------------------------------------------------------------|
| `--exam`         | required: `JEE_MAIN \| JEE_ADVANCED \| NEET \| CBSE_BOARDS \| FOUNDATION` |
| `--year`         | required: 4-digit year                                              |
| `--subject`      | required: `Physics \| Chemistry \| Mathematics \| Biology`          |
| `--class`        | optional: `9 \| 10 \| 11 \| 12`                                     |
| `--label`        | optional: human-readable exam name; defaults to "<exam> <year> <subject>" |
| `--from-text`    | treat input as plain `.txt`, skip PDF extraction (good for fixtures) |
| `--dry-run`      | parse + plan inserts but DO NOT write to the DB                     |
| `--auto-approve` | publish immediately (skip review queue). Use only on trusted, hand-cleaned input. |

## Limitations of the heuristic parser

- Text-only PDFs. Scanned papers need OCR (Tesseract, AWS Textract, etc.) first.
- Math notation comes through as plain text (e.g. `9.8 m/s^2`); review and
  re-LaTeX-ify before publishing.
- Figure-based questions ("In the figure shown…") will parse but lack the
  figure — the reviewer must add it.
- Multi-column layouts with broken reading order may segment poorly. Consider
  pre-converting the PDF with `pdftotext -layout` if results are bad.
- Numerical-answer (subjective) questions are not handled — only 4-option MCQs.

## Schema notes

- `source` is set to `PYQ`.
- `examTarget` is a single-element array containing the `--exam` code; multiple
  targets can be added later via the review UI.
- `year` holds the **primary** year of import. Secondary repeat-years live in
  `examName` as "(also appeared YYYY, YYYY)". A future schema migration could
  split this into a dedicated `pyqYears int[]` column.
- `topic` is left as `"Unspecified"` — the reviewer should set it when approving.
- `marks` defaults to 4 (standard for JEE Main / NEET MCQs).
