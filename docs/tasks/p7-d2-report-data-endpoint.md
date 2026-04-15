# P7-D2 — Report Data API Endpoint

## What
Add `GET /v1/reports/{access_token}` — loads report data from `report_access` table, returns JSON for the frontend `ReportViewer.tsx` to render. Also update the PDF endpoint (`GET /v1/reports/{token}/pdf`) to read from the same table for real tokens.

## Why / Context
D1 created the `report_access` table. The interactive report page currently uses frontend mock data. This endpoint connects the page to real stored data: customer clicks email link → Astro loads token from URL → React fetches this endpoint → renders the report.

The PDF endpoint (C3) currently handles dev tokens with inline mock data and returns 404 for real tokens. After D2, both endpoints share the same data loading logic.

## How

### 1. Report data endpoint

Add to `bustodnr_api/reports/routes.py` (where the PDF endpoint already lives):

```python
@router.get("/reports/{access_token}")
async def get_report_data(access_token: str, db: Session = Depends(get_db)):
    """Return report data JSON for the interactive report page."""

    # Dev tokens — keep working for development
    if access_token.startswith("dev-") and settings.PAYMENT_MODE != "live":
        return {"ok": True, "data": build_dev_report_data(access_token)}

    # Real token — load from DB
    report = db.query(ReportAccessORM).filter(
        ReportAccessORM.access_token == access_token
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Check expiry
    if report.expires_at and report.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="Report expired")

    # Increment view count
    report.view_count = (report.view_count or 0) + 1
    db.commit()

    # Parse and return stored data
    report_data = json.loads(report.report_data_json)

    return {
        "ok": True,
        "data": report_data,
        "meta": {
            "access_token": access_token,
            "created_at": report.created_at.isoformat() if report.created_at else None,
            "view_count": report.view_count,
        }
    }
```

### 2. Refactor PDF endpoint to share data loading

The PDF endpoint (C3) already has dev token handling and a 404 for real tokens. Refactor both endpoints to share a common loader:

```python
def _load_report_data(access_token: str, db: Session) -> dict:
    """Load report data by token. Returns dict or raises HTTPException."""

    # Dev tokens
    if access_token.startswith("dev-") and settings.PAYMENT_MODE != "live":
        return build_dev_report_data(access_token)

    # Real token
    report = db.query(ReportAccessORM).filter(
        ReportAccessORM.access_token == access_token
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if report.expires_at and report.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="Report expired")

    return json.loads(report.report_data_json)


def _get_report_orm(access_token: str, db: Session) -> ReportAccessORM | None:
    """Get the ORM object for view count / chat rate limit updates."""
    return db.query(ReportAccessORM).filter(
        ReportAccessORM.access_token == access_token
    ).first()
```

Both `get_report_data` and `download_report_pdf` call `_load_report_data`. The data endpoint also calls `_get_report_orm` to increment `view_count`.

### 3. Frontend wiring

The report page (`ReportViewer.tsx`) needs to fetch from this endpoint instead of using mock data. Claude Code must inspect how `ReportViewer.tsx` currently gets its data:

- If it uses hardcoded mock data → replace with a `fetch` call to `${API_BASE}/v1/reports/${token}`
- If it already has a fetch call pointing elsewhere → update the URL
- If the Astro page (`[token].astro`) does SSR data loading → wire the fetch there

The response shape `{ ok: true, data: { ... } }` should match what the component expects. Claude Code must compare the endpoint response fields with what `ReportViewer.tsx` renders and adapt if needed.

**Loading state:** Add a loading spinner while the fetch is in-flight. Show "Kraunama ataskaita..." and render the report once data arrives.

**Error state:** If the endpoint returns 404 or 410, show a Lithuanian error message: "Ataskaita nerasta" (404) or "Ataskaitos galiojimas pasibaigė" (410).

### 4. Dev tokens continue working

Both endpoints must continue serving dev tokens (`dev-existing`, `dev-land`) when `PAYMENT_MODE != "live"`. This is essential for development and testing. The existing `build_dev_report_data()` function (or equivalent) stays.

## Constraints

- **No authentication beyond the token.** The token IS the auth. No cookies, no sessions, no login.
- **Don't change the `report_access` table.** D1 already created it.
- **View count increments on data endpoint only**, not on PDF download (avoids double-counting when user downloads PDF from the report page).
- **No CORS issues.** The report page is on `localhost:4321` (frontend) calling `localhost:8100` (backend). CORS must allow this — verify the existing CORS config covers it.
- **The response `data` shape must match what `ReportViewer.tsx` expects.** If there's a mismatch (e.g., the stored JSON uses different field names than the component expects), adapt at the endpoint level, not by changing the stored data.
- **Tests deferred to D4.** But the endpoint should work with dev tokens immediately.

## Files to touch

### Modified files (backend `~/dev/bustodnr`):
- `bustodnr_api/reports/routes.py` — add `GET /reports/{token}` endpoint, refactor shared data loader, update PDF endpoint to use shared loader

### Modified files (frontend `~/dev/ntd`):
- `src/components/ReportViewer.tsx` (or equivalent) — fetch from API instead of mock data, add loading/error states
- Possibly `src/pages/report/[token].astro` — if data loading happens at the Astro level

### Not touched:
- `bustodnr_api/db/models/report_access.py` — no changes
- Migration files — no changes

## Verification

1. `GET http://localhost:8100/v1/reports/dev-existing` → returns `{ ok: true, data: { ... } }` with full report data.
2. `GET http://localhost:8100/v1/reports/nonexistent` → 404.
3. Open `http://localhost:4321/report/dev-existing` → report page loads data from API, renders correctly (same as before but now via fetch).
4. PDF endpoint still works: `GET http://localhost:8100/v1/reports/dev-existing/pdf` → PDF downloads.
5. View count: fetch the data endpoint twice, then check the response `meta.view_count` → should be 2.
6. All existing tests pass.