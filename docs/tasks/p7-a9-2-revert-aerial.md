# P7-A9.2: Revert Vilnius Aerial — Restore Street View to Hero Position

## What
Remove the Vilnius aerial orthophoto (rooftop view is redundant with the Google Maps satellite already in the Pastato card). Restore Google Street View to its original hero position at the top of the report. Restore the Google Map to full-width in the Pastato card.

## Why
The Vilnius 2024 aerial (gis.vplanas.lt orthophoto) shows rooftops — essentially the same visual as the Google Maps satellite view already rendered in the Pastato card. Two top-down views add no value. The diagonal 3D oblique imagery from 3d.vilnius.lt would be different and valuable, but it's not accessible via REST API and is deferred to post-launch (requires partnership with Vilniaus planas).

## How

### Frontend changes:

1. **PropertyPhoto.tsx** — remove Vilnius aerial detection and fetching. Always use Google Street View as the hero image (the behavior from P7-A9 before P7-A9.1). Remove the `onStreetViewData` callback — Street View stays in PropertyPhoto, not passed to Pastato card.

2. **PropertyProfile.tsx** — remove `streetViewData` prop. Restore the map to full-width in the card header (no two-column layout). Map goes back to `h-[400px]` with the "Padidinti" fullscreen button.

3. **StreetViewInline.tsx** — DELETE this file (it was only needed for the two-column layout).

4. **ReportViewer.tsx** — remove `streetViewData` state and the wiring between PropertyPhoto and PropertyProfile. PropertyPhoto renders independently above PropertyIdentity.

### Backend changes:

5. **Remove** the `/v1/enrichment/vilnius-aerial` endpoint from `streetview.py` — or keep the code but don't wire it to the router (it may be useful when oblique imagery becomes available).

6. **Remove** `tests/enrichment/test_aerial.py` — or keep and skip.

### Result — back to P7-A9 layout:

```
PropertyPhoto (Street View)     ← hero position, full width
PropertyIdentity
Pastato charakteristikos
  └─ Google Map (satellite)     ← full width, h-[400px], Padidinti button
```

The "Apžiūrėti Google Street View aplinkoje ↗" link stays on the Street View photo (with the corrected `map_action=pano` URL).

## Constraints
- Keep the vilnius-aerial backend code commented/unused (not deleted) — we'll need it when oblique imagery is available
- All tests must pass
- Build must succeed

## Files to touch
- `src/components/report/PropertyPhoto.tsx` — simplify back to Street View only
- `src/components/report/PropertyProfile.tsx` — remove streetViewData prop, restore full-width map
- `src/components/report/PropertyMap.tsx` — restore h-[400px]
- `src/components/report/StreetViewInline.tsx` — DELETE
- `src/components/ReportViewer.tsx` — remove streetViewData state wiring

## Run after
```bash
cd ~/dev/ntd && npm run build && npm test && npm run dev
```