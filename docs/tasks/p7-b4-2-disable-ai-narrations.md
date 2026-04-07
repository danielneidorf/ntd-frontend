# P7-B4.2: Disable AI Narrations for All Tours

## What
Remove the Haiku API call from tour narrations entirely — all pages, including the report page. Use hardcoded/template narrations everywhere. Keep the backend endpoint and infrastructure intact for B5 (chat), but don't call it during tour step navigation.

## Why
Tour narrations are a template task, not a reasoning task. The B1–B3 hardcoded narrations and B3 template strings (with property data injection) are precise, instant, consistent, free, and work offline. Haiku just rephrases the same information in slightly different words each time — marginal improvement at best, risk of wrong tone or hallucination at worst.

Haiku earns its cost in B5 (chat) — when the user asks "Kodėl mano pastatas įvertintas C?" and the AI needs to reason about the property data. That's a question-answering task where LLM intelligence matters.

## How

In `src/components/guide/AIGuide.tsx`, remove or comment out the entire `fetchAINarrations` call:

```typescript
// AI narrations disabled for tour steps — hardcoded/template narrations used.
// The /v1/ai-guide/narrate endpoint remains available for B5 (chat).
// if (tourId === 'report') {
//   fetchAINarrations(...)
// }
```

The `aiNarrations` state variable can remain (it'll stay null, so the fallback `currentStep.narration` always wins). Or remove it entirely for cleanliness.

## What stays
- Backend endpoint `POST /v1/ai-guide/narrate` — untouched, ready for B5
- `ANTHROPIC_API_KEY` environment variable — stays configured
- `anthropic` Python package — stays installed
- The JSON fence-stripping fix — stays

## Files to touch
- `src/components/guide/AIGuide.tsx` — comment out or remove the `fetchAINarrations` call

## Constraints
- No backend changes
- No visible difference to the user (they were already seeing hardcoded text on landing/QuickScan, and template text on report)
- All tests must pass