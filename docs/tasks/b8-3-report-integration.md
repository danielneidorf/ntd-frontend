# B8-3 — Block 8 Report Integration

## What
Wire Block 8 v1 into the existing report pipeline: envelope builder, PDF template, web report frontend, archive, and voice concierge prompt. After B8-3, every completed report includes Block 8 as its final section — visible in the interactive web view, the PDF download, the archive record, and the voice guide's narration.

## Why / Context
B8-1 (rules engine) and B8-2 (Lithuanian copy) are done. The domain layer produces `Block8Output` from `render_block8_v1()`. But nothing calls it yet. B8-3 connects this to the five existing integration points listed in the Block 8 v1 Initial Scope Brief.

## How

### Step 1 — Envelope builder (backend)

**File:** `bustodnr_api/quickscan_lite.py`

In `generate_report_envelope()`, after the existing Block 1 block is built (the `BlockReportBase` with `id="thermal_comfort_proxy"`), call `render_block8_v1()` and add Block 8 as a second block in the envelope.

```python
from bustodnr_api.domain.block8_renderer import render_block8_v1

# After block1 is built and appended to blocks list:
if status == "ready":
    # block1_data is the dict from block.data
    # evaluation_target comes from the payload or block1 inputs_snapshot
    # inputs_snapshot is the resolver snapshot dict
    block8_output = render_block8_v1(block1_data, evaluation_target, inputs_snapshot)

    block8 = BlockReportBase(
        id="recommendations",
        label_lt="8) Rekomendacijos ir sprendimai",
        status=block8_output.status,
        summary_lt=None,
        required_inputs=[],
        data=block8_output.model_dump(),
    )
    blocks.append(block8)
```

**Key questions for Claude Code to resolve:**
- Where exactly does `evaluation_target` come from in the envelope builder? Check `block1_data`, the `inputs_snapshot`, or the `payload`. It's likely in `inputs_snapshot["evaluation_target"]`.
- Where is `inputs_snapshot` available? It's already used for Block 1 — check the `resolver_result` or `block1_data["inputs_snapshot"]`.
- If `status != "ready"` (e.g. `needs_inputs`, `needs_location`), do NOT call `render_block8_v1()` — Block 8 only appears when Block 1 has run.

**`land_only` handling:** When `evaluation_target == "land_only"`, `render_block8_v1()` returns `Block8Output(status="not_applicable", data=None)`. The `BlockReportBase` should still be added to the envelope with `status="not_applicable"` — the frontend and PDF template decide whether to show it.

### Step 2 — Report data endpoint

**File:** Check `bustodnr_api/reports/` or wherever `GET /v1/reports/{token}` is defined.

The report data JSON stored in `report_access.report_data_json` is built from the envelope. If Block 8 is in the envelope's blocks list, it will automatically appear in the stored JSON. Verify:

1. The `build_report_envelope_from_snapshot()` function (used in the background job after payment) also calls `render_block8_v1()`.
2. The `GET /v1/reports/{token}` response includes Block 8 data in the `blocks` array or as a top-level `block8` key — check the existing response shape and follow the same pattern used for Block 1.

If the report data is stored as a flat dict (not from the envelope), you may need to add a `block8` key explicitly. Follow the existing pattern.

### Step 3 — PDF template

**File:** `bustodnr_api/templates/report_pdf.html`

Add a Block 8 section after Block 1 (and after any existing sections like Infostatyba). The section should appear only when `block8.status == "ready"`.

Layout from the Block 8 v1 Initial Scope Brief:

```html
{% if block8 and block8.status == "ready" %}
<div class="section block8">
    <h2>8) Rekomendacijos ir sprendimai</h2>

    {% if block8.data.caveat_lt %}
    <div class="caveat">
        <p>⚠️ {{ block8.data.caveat_lt }}</p>
    </div>
    {% endif %}

    <p class="intro">{{ block8.data.intro_lt }}</p>

    <h3>📋 Ką patikrinti apžiūros metu</h3>
    <ul>
    {% for q in block8.data.viewing_questions_lt %}
        <li>{{ q }}</li>
    {% endfor %}
    </ul>

    <h3>💬 Derybų kampai</h3>
    <ul>
    {% for a in block8.data.negotiation_angles_lt %}
        <li>{{ a }}</li>
    {% endfor %}
    </ul>

    <h3>🔮 Toliau</h3>
    <p>{{ block8.data.forward_note_lt }}</p>

    <div class="disclaimer">
        <p>ℹ️ {{ block8.data.scope_disclaimer_lt }}</p>
    </div>
</div>
{% endif %}
```

**Styling:** Match the existing Block 1 section styling. The `.caveat` box should have a light amber/yellow background with a border, similar to warning callouts. The `.disclaimer` should be small text, grey, with an info icon — similar to the existing footer disclaimers.

**PDF renderer:** Check `bustodnr_api/reports/pdf_renderer.py` (or wherever `render_report_pdf()` is). It passes data to the Jinja2 template. Ensure `block8` is available in the template context. This likely means extracting Block 8 from the envelope's blocks list:

```python
block8_data = None
for block in envelope_data.get("blocks", []):
    if block.get("id") == "recommendations":
        block8_data = block
        break
# Pass block8=block8_data to template.render(...)
```

### Step 4 — Frontend web report

**File:** `src/components/ReportViewer.tsx` (frontend repo `~/dev/ntd`)

Add a `Block8Section` component that renders Block 8 content. Insert it in the section order **after Block 1** and **before locked blocks (2–5)**.

Updated section order:
1. ReportHeader
2. PropertyIdentity
3. Pastato charakteristikos (with map)
4. Energinis naudingumas
5. Block-1: Vidaus patalpų klimato komfortas
6. **Block-8: Rekomendacijos ir sprendimai** ← NEW
7. Statybos leidimai (Infostatyba) — if permits found
8. Papildomi dokumentai ir šaltiniai
9. Locked blocks (2–5)
10. Citations
11. ReportFooter

**Component structure:**

```tsx
function Block8Section({ block8 }: { block8: Block8Data }) {
  if (!block8 || block8.status !== "ready" || !block8.data) return null;
  const d = block8.data;
  return (
    <section className="...">
      <h2>{block8.label_lt || "8) Rekomendacijos ir sprendimai"}</h2>
      {d.caveat_lt && <div className="caveat-box">⚠️ {d.caveat_lt}</div>}
      <p>{d.intro_lt}</p>
      <h3>📋 Ką patikrinti apžiūros metu</h3>
      <ul>{d.viewing_questions_lt.map((q, i) => <li key={i}>{q}</li>)}</ul>
      <h3>💬 Derybų kampai</h3>
      <ul>{d.negotiation_angles_lt.map((a, i) => <li key={i}>{a}</li>)}</ul>
      <h3>🔮 Toliau</h3>
      <p>{d.forward_note_lt}</p>
      <p className="text-sm text-gray-500 mt-4">ℹ️ {d.scope_disclaimer_lt}</p>
    </section>
  );
}
```

**Mock data:** Add Block 8 to `mockReportData.ts` for both `MOCK_EXISTING` (pattern B, medium winter, low summer) and `MOCK_LAND_ONLY` (status="not_applicable"). This enables visual QA without a backend.

**TypeScript type:** Add `Block8Data` type matching the Pydantic model shape.

### Step 5 — Archive extension

**File:** `bustodnr_api/domain/archive.py`

The P7-G1 archive schema reserves fields. Add `block8_v1_data` to the archive dict. In the archive writer (P7-G2), include the Block 8 output:

```python
archive_data = {
    "block1_block_data": block1_data_dict,
    "inputs_snapshot": snapshot_dict,
    "pricing_snapshot": build_pricing_snapshot_for_archive(order_item),
    "block8_v1_data": block8_output.model_dump() if block8_output else None,  # NEW
    "report_access_token": access_token,
    "report_generated_at": utcnow().isoformat(),
}
```

If the archive writer hasn't been fully wired yet (P7-G2 may be incomplete), just extend the schema documentation in `archive.py` to include the `block8_v1_data` key with a comment. The actual write can happen when P7-G2 lands.

### Step 6 — Voice concierge prompt

**File:** Check `bustodnr_api/ai_guide.py` or the OpenAI Realtime session config for the system prompt.

Add Block 8 to Ona's narration. The voice concierge already reads Block 1 as the report's main content. Block 8 should be read as the closing section — "here's what I'd suggest."

In the system prompt, add after Block 1 instructions:

```
Kai klientas prašo perskaityti ataskaitą arba nori sužinoti rekomendacijas,
perskaityk 8 bloko turinį: pradėk nuo įžangos, tada apžiūros klausimus,
derybų kampus ir perspektyvą. Jei yra įspėjimas (caveat), perskaityk jį
prieš įžangą. Visada baik su atsakomybės apribojimu (disclaimer).
```

Also pass the Block 8 data into the session context so Ona has the actual recommendation text to read. Check how Block 1 data is currently passed — follow the same pattern.

**If the voice concierge prompt is managed as a template string:** add Block 8 content to the data dict that populates it.

**If it's a static system prompt:** add a section describing how to narrate Block 8.

### Step 7 — Tests

**Backend tests** (new file or extend existing):

Create `tests/integration/test_block8_integration.py`:

1. **Envelope includes Block 8** — call `generate_report_envelope()` with ready Block 1 data, verify `blocks` has 2 entries, second has `id="recommendations"`
2. **Envelope Block 8 content** — verify second block's data contains expected pattern, viewing_questions, negotiation_angles
3. **land_only envelope** — verify Block 8 status is "not_applicable"
4. **needs_inputs envelope** — verify no Block 8 block is present (Block 1 didn't run)
5. **PDF renders Block 8** — render PDF from envelope with Block 8, verify PDF bytes contain "Rekomendacijos" (skip if WeasyPrint not available — use existing skip pattern)
6. **PDF hides Block 8 when not_applicable** — render with land_only data, verify "Rekomendacijos" not in PDF
7. **Archive includes block8_v1_data** — verify archive dict has the key

**Frontend tests** (if time allows):
8. **Block8Section renders** — pass mock data, verify heading and list items render
9. **Block8Section hidden when not_applicable** — pass status="not_applicable", verify component returns null

Expected: ~7–9 tests.

## Constraints

- **Do not break existing tests.** All 667 backend + 12 skipped must remain unchanged. All ~95 frontend tests must pass.
- **Block 8 only appears when Block 1 status is "ready".** Never call `render_block8_v1()` for needs_inputs/needs_location/error states.
- **Follow existing patterns.** The envelope already has a blocks list, the PDF template already loops blocks, the frontend already renders sections. Extend, don't reinvent.
- **PDF and web must show identical content.** Same text, same order, same structure. The only difference is styling (CSS for web, WeasyPrint CSS for PDF).
- **The voice concierge addition is best-effort.** If the prompt structure makes it complex, defer to a follow-up. The critical path is envelope → PDF → web → archive.

## Files to touch

### Backend (`~/dev/bustodnr`):
**Modify:**
- `bustodnr_api/quickscan_lite.py` — envelope builder adds Block 8
- `bustodnr_api/templates/report_pdf.html` — Block 8 section
- `bustodnr_api/reports/pdf_renderer.py` — pass Block 8 to template context
- `bustodnr_api/domain/archive.py` — add `block8_v1_data` key
- `bustodnr_api/ai_guide.py` — voice concierge prompt + data (best-effort)
- Report data builder (wherever `report_data_json` is assembled) — include Block 8

**Create:**
- `tests/integration/test_block8_integration.py` — ~7 integration tests

### Frontend (`~/dev/ntd`):
**Modify:**
- `src/components/ReportViewer.tsx` — add Block8Section in section order
- `src/components/report/mockReportData.ts` — add Block 8 mock data

**Create:**
- `src/components/report/Block8Section.tsx` — new component

## Verification

1. `npm run dev` → `/report/dev-existing` shows Block 8 section after Block 1 with viewing questions + negotiation angles
2. `/report/dev-land` → no Block 8 section visible
3. Backend: `pytest -q` → 667 + ~7 = ~674 passed, 12 skipped
4. Frontend: `npm test` → all pass including any new Block8Section tests
5. PDF: render test report → "Rekomendacijos" appears in PDF content
6. Both builds pass: `npm run build` and backend test suite