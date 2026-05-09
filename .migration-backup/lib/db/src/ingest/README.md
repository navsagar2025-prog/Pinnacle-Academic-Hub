# Question Bank Ingest Scaffold

This folder is the home for **bulk content seeding scripts** that grow the
Pinnacle question bank from ~12K to the 50K target across Class 9–12, NEET,
and JEE.

The runtime infrastructure (schema columns, validators, the AI review queue,
filters, KaTeX rendering) is already shipped in the main app. What lives here
is the **operational pipeline** for getting questions in.

## Source mix (target = 50,000)

| Source              | Rows   | Notes                                                     |
| ------------------- | ------:| --------------------------------------------------------- |
| `PYQ`               | 18,000 | Past-year papers — JEE Main/Adv (2014–25), NEET (2014–25) |
| `AI`                | 15,000 | Generated via `QuestionGenerator`, all reviewed before pub |
| `MANUAL`            |  7,500 | Hand-authored by the academic team                        |
| `NCERT_EXEMPLAR`    |  5,000 | Exemplar problems Class 9–12                              |
| `THIRD_PARTY_FREE`  |  4,500 | Permitted creative-commons / open question banks          |

## Directory layout (planned)

```
src/ingest/
  README.md                  ← this file
  shared/
    csvWriter.ts             ← canonical CSV format used by the import API
    validate.ts              ← row-level checks before POSTing to /import
  pyq/
    pdf-extract.ts           ← parse PYQ PDFs → CSV (uses pdf-parse + heuristics)
    classify.ts              ← assign exam_target, difficulty, topic
  ai/
    batch-generate.ts        ← drive the AI in batches of N, dedupe, save as pending
  ncert-exemplar/
    extract.ts               ← chapter-wise NCERT exemplar parser
  third-party/
    importers/               ← one file per source (license tracked in CSV)
```

## Import payload contract (`POST /api/v1/question-bank/import`)

The API accepts JSON `{ rows: [...] }`. Each row has these fields (the staging
CSV uses the same column names so it can be transformed 1:1 by `csvWriter.ts`
into the import payload):

| Field             | Type                | Notes                                              |
| ----------------- | ------------------- | -------------------------------------------------- |
| `subject`         | string (required)   |                                                    |
| `topic`           | string              |                                                    |
| `classGrade`      | string              | "9" / "10" / "11" / "12"                           |
| `year`            | number              | for PYQ                                            |
| `difficulty`      | enum                | `easy` / `medium` / `hard`                         |
| `type`            | enum                | `mcq` / `short` / `long` / `numerical`             |
| `question`        | string (required)   | LaTeX allowed inside `$...$` and `$$...$$`        |
| `A`,`B`,`C`,`D`   | string              | the four MCQ options                              |
| `correct`         | string (required)   | `A`/`B`/`C`/`D` for MCQ, free-text otherwise      |
| `solution`        | string              |                                                    |
| `imageUrl`        | string              |                                                    |
| `solutionImageUrl`| string              |                                                    |
| `examName`        | string              |                                                    |
| `marks`           | number              | default 4                                          |
| `source`          | enum (required)     | `PYQ` / `AI` / `MANUAL` / `NCERT_EXEMPLAR` / `THIRD_PARTY_FREE` |
| `reviewStatus`    | enum                | `pending` / `approved` / `rejected` (see note)     |
| `examTarget`      | string[]            | **JSON array**, e.g. `["JEE_MAIN","NEET"]`         |

Notes:
- `examTarget` must be a real JSON array in the JSON payload — the validator
  rejects strings. If your staging CSV stores it as a JSON-encoded string,
  parse it back to an array before POSTing (`csvWriter.ts` does this for you
  via `rowsToImportPayload`).
- `reviewStatus` is honoured for non-AI rows only. **AI rows are forced to
  `pending` and `is_published=false`** by the import route regardless of what
  the caller supplies — this is intentional and the central enforcement point.

## Running an ingest batch (manual, for now)

1. Produce a CSV in the format above (one of the scripts below will do it).
2. Sanity-check with `pnpm tsx src/ingest/shared/validate.ts <path.csv>`.
3. POST it to the import API as an authenticated admin:

   ```bash
   curl -X POST "$BASE/pinnacle-website/api/v1/question-bank/import" \
     -H "Content-Type: application/json" \
     --cookie "$ADMIN_SESSION" \
     -d @batch.json
   ```

4. AI rows land in the **review queue** at
   `/portal/admin/question-bank/review` — approve or reject before they go
   live to students.

## Status of seeding work

**Infrastructure: shipped.** The schema, validators, AI review flow,
filters, dashboard counters, and KaTeX rendering are all in production.

**Content: deferred.** The actual 38,000 new rows (PDF extraction, AI
batches at $300–800 estimated cost, hand-authored content, SVG figures)
need a dedicated content sprint and budget approval — they are intentionally
not part of this infrastructure task. See task #112 / #113 for follow-ups.

## Cost & throughput notes

- **AI batch**: ~$0.02–0.05 per question with the current prompt; budget
  $300–800 for 15K rows. Run in batches of 25 with deduplication on
  `(subject, topic, normalized question text)`.
- **PYQ PDF**: roughly 4 hours of script time per ~2K-question paper set
  after the parser is dialled in for that exam's layout.
- **Review throughput**: a teacher reviewing AI questions averages ~60/hour;
  budget ~250 reviewer-hours for 15K AI rows. Bulk-approve is gated to ≤1000
  rows per call to force tighter filters.
