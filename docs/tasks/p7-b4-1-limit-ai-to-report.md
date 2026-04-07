# P7-B4.1: Limit AI Narrations to Report Page Only

## What
Skip the `/v1/ai-guide/narrate` API call for landing and QuickScan pages. Use hardcoded narrations for those pages (they're static — the content never changes). Only call Haiku for the report page, where narrations are personalized to the specific property.

## Why
Landing and QuickScan narrations are the same every time — the page content doesn't change between visitors. Calling Haiku to regenerate identical-purpose text wastes money and adds latency. The handwritten Lithuanian narrations from B1–B2 are already good. Only the report page benefits from AI generation (every property is different).

## How

In `src/components/guide/AIGuide.tsx`, change the `fetchAINarrations` call:

```typescript
// Only fetch AI narrations for the report page
if (tourId === 'report') {
  fetchAINarrations(tourId, tourSteps, reportToken).then(result => {
    if (result) {
      setAiNarrations(result);
    }
  });
}
// Landing and QuickScan: skip fetch, use hardcoded narrations (already the default)
```

## Files to touch
- `src/components/guide/AIGuide.tsx` — wrap `fetchAINarrations` in `if (tourId === 'report')`

## Constraints
- One line change (conditional around the fetch call)
- Hardcoded narrations remain unchanged — they're already the fallback
- Report page still calls Haiku and gets personalized narrations
- All tests must pass