# P7-C4+C5 — Wire PDF Download Button + Tests

## What
Two small deliverables combined:
1. **C4:** Wire the existing "Atsisiųsti PDF" button on the report page to `GET /v1/reports/{token}/pdf`.
2. **C5:** Backend tests for the PDF renderer and endpoint.

## C4: Frontend button wiring

The "Atsisiųsti PDF" button already exists in the report page header. It needs to point to the backend PDF endpoint with the current report's token.

### Implementation

In the report page component (likely `ReportViewer.tsx` or the Astro page `src/pages/report/[token].astro`), find the "Atsisiųsti PDF" button/link. Claude Code must inspect the current code to see how it's implemented — it may be a dead link, a placeholder `href="#"`, or a `window.print()` handler.

Replace with:
```typescript
const token = /* read from URL params or props */;
const pdfUrl = `${API_BASE}/v1/reports/${token}/pdf`;

<a href={pdfUrl} download className="...">Atsisiųsti PDF</a>
```

Or if it's a button with an onClick:
```typescript
<button onClick={() => window.open(pdfUrl, '_blank')}>Atsisiųsti PDF</button>
```

The `download` attribute on `<a>` triggers a download. If the backend returns `Content-Disposition: attachment` (it does), the browser will download regardless.

**For dev tokens** (`dev-existing`, `dev-land`): the button should work immediately since the endpoint already handles dev tokens.

**For real tokens:** Works once P7-D wires real report_access data. The endpoint returns 404 for unknown tokens — the button won't break, it'll just show a 404 page.

### Loading state (optional polish)

PDF rendering takes ~1-2s. Optionally show a spinner or "Generuojama..." state while the PDF is being fetched:

```typescript
const [downloading, setDownloading] = useState(false);

const handleDownload = async () => {
  setDownloading(true);
  try {
    const response = await fetch(pdfUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NTD_QuickScan_report.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } finally {
    setDownloading(false);
  }
};
```

This is optional — a simple `<a href download>` link works fine without a loading state. The user just waits 1-2s for the download to start.

## C5: Backend tests

New test file: `tests/reports/test_pdf.py`

### Test 1: Renderer produces valid PDF
```python
def test_render_report_pdf_returns_valid_pdf():
    """render_report_pdf with mock data returns bytes starting with %PDF."""
    from bustodnr_api.reports.pdf_renderer import render_report_pdf
    # Use the same mock data structure as the dev endpoint
    pdf_bytes = render_report_pdf(envelope=mock_envelope, blocks=mock_blocks, ...)
    assert pdf_bytes[:5] == b"%PDF-"
    assert len(pdf_bytes) > 1000  # non-trivial PDF
```

### Test 2: PDF contains expected text
```python
def test_render_report_pdf_contains_address():
    """PDF contains the property address."""
    pdf_bytes = render_report_pdf(...)
    # Extract text from PDF (use pdfplumber or just search bytes)
    assert b"Vilnius" in pdf_bytes or "Vilnius" in extract_text(pdf_bytes)
```

### Test 3: PDF contains thermal comfort section
```python
def test_render_report_pdf_contains_thermal_section():
    """PDF contains Block 1 thermal comfort heading."""
    pdf_bytes = render_report_pdf(...)
    text = extract_text(pdf_bytes)
    assert "klimato komfortas" in text.lower()
```

### Test 4: PDF contains citations
```python
def test_render_report_pdf_contains_citations():
    """PDF contains citations section."""
    pdf_bytes = render_report_pdf(...)
    text = extract_text(pdf_bytes)
    assert "šaltiniai" in text.lower() or "nuorodos" in text.lower()
```

### Test 5: Land-only variant renders
```python
def test_render_report_pdf_land_only():
    """Land-only report renders without crash, shows Netaikoma."""
    pdf_bytes = render_report_pdf(envelope=land_envelope, blocks=land_blocks, ...)
    assert pdf_bytes[:5] == b"%PDF-"
    text = extract_text(pdf_bytes)
    assert "netaikoma" in text.lower()
```

### Test 6: Filename generation
```python
def test_generate_pdf_filename():
    """Filename is clean ASCII with address slug."""
    from bustodnr_api.reports.pdf_renderer import generate_pdf_filename
    filename = generate_pdf_filename({"address": "Vilnius, Žirmūnų g. 12-5"})
    assert filename.startswith("NTD_QuickScan_")
    assert filename.endswith(".pdf")
    assert " " not in filename
```

### Test 7: Endpoint returns PDF for dev token
```python
def test_pdf_endpoint_dev_existing(client):
    """GET /v1/reports/dev-existing/pdf returns 200 with PDF content type."""
    response = client.get("/v1/reports/dev-existing/pdf")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content[:5] == b"%PDF-"
```

### Test 8: Endpoint returns 404 for unknown token
```python
def test_pdf_endpoint_unknown_token(client):
    """GET /v1/reports/nonexistent/pdf returns 404."""
    response = client.get("/v1/reports/nonexistent-token/pdf")
    assert response.status_code == 404
```

### Note on text extraction
For tests that check PDF text content, use `pdfplumber` (pure Python, no system deps):
```bash
pip install pdfplumber --break-system-packages
```
Or search the raw PDF bytes for expected strings (less reliable but zero dependencies).

**Important:** Tests 1-5 and 7 require WeasyPrint system libraries. On macOS without them, these tests will fail. Mark them with `@pytest.mark.skipif` if `weasyprint` import fails, or run them only on the VPS/CI. Test 6 and 8 work everywhere.

## Constraints

- **Frontend: minimal change.** Just wire the URL. Don't redesign the button.
- **Backend tests must not break on macOS.** Skip WeasyPrint-dependent tests gracefully if the system libraries aren't available.
- **Add `pdfplumber` to dev dependencies only** (not main requirements.txt) if used for text extraction in tests.

## Files to touch

### Frontend (`~/dev/ntd`):
- `src/pages/report/[token].astro` or `src/components/ReportViewer.tsx` — wire PDF button URL

### Backend (`~/dev/bustodnr`):
- `tests/reports/__init__.py` — empty init
- `tests/reports/test_pdf.py` — 8 tests
- `requirements-dev.txt` or `requirements.txt` — add `pdfplumber` (dev only)

## Verification

1. Open `http://localhost:4321/report/dev-existing` → click "Atsisiųsti PDF" → PDF downloads.
2. Run `pytest tests/reports/test_pdf.py` on VPS (or locally with WeasyPrint libs) → all pass.
3. Run full suite → 523 + 8 = ~531 tests pass.