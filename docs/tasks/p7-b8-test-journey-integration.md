# P7-B8-test — Voice Guide Journey Integration Tests

## What
A comprehensive integration test suite that simulates full customer journeys through direct `formActionsRegistry` handler calls. Every tool is exercised in realistic sequences — forward, backward, cross-page detours, nested detours, error recovery, and edge cases. Claude Code writes the tests, runs them, fixes whatever breaks, and iterates until all pass.

This is NOT unit testing individual tools (that's already done — 78 tests). This tests **sequences** — the state machine behavior when tools are called in the order a real customer would trigger them.

## Why
Every bug found so far was in handler interaction, not in individual tool logic: race conditions on `tour_next` after `show_section`, `elementExists` crash on `goToStep`, detour return replaying the same step, `session.update` overwriting the system prompt. These only surface when tools are called in sequence. Unit tests missed all of them.

## How

### Test infrastructure

Create a new test file: `src/components/guide/__tests__/journeyIntegration.test.ts`

The test harness needs to:
1. Mock `window.location` (for cross-page navigation assertions — don't actually navigate)
2. Mock `sessionStorage` (read/write detour state)
3. Initialize `formActionsRegistry` with all actions registered (landing + screen1 + screen2 + common)
4. Provide mock tour state (steps array, currentStepIndex, goToStep, next, back)
5. Provide mock QuickScanFlow state (case type, address, email, consent, payment method, etc.)
6. Track all state mutations (which setter was called with what value)
7. Track all `sessionStorage` writes and reads

Each test scenario calls handlers sequentially via `formActionsRegistry.get(name)(args)` and asserts state after each call.

### Journey 1: Happy path — landing through payment

```
1. get_current_screen → { screen: "landing", step: 0 }
2. tour_next → advances to step 1, returns narration
3. tour_next → step 2
4. tour_next → step 3
5. tour_next → step 4
6. tour_next → step 5 (last landing step)
7. tour_next → { error: "last_step" }
   (user navigates to /quickscan/ manually or via link)
8. get_current_screen → { screen: "screen1" }
9. select_case_type({ case_type: "existing_object" }) → success
10. fill_address({ address: "Žirmūnų g. 12" }) → candidates returned
11. select_address_candidate({ index: 0 }) → address confirmed
12. click_continue → success, triggers resolver
13. get_current_screen → { screen: "screen2" }
14. confirm_property → success
15. fill_email({ email: "jonas@gmail.com" }) → success
16. toggle_consent({ checked: true }) → success
17. select_payment_method({ method: "card" }) → success
18. click_pay → success
```

Verify at each step: correct state mutation, correct return shape, no crashes.

### Journey 2: Curious browser — detours from every page

```
Landing, step 1:
1. tour_next → step 2
2. show_section({ topic: "pricing" }) → detour to pricing step (same page)
3. Verify: returnStepRef is set, currentStep is pricing step
4. tour_next → returns to step 2+1 = step 3 (not step 2 again)
5. Verify: pricing step is in seenSteps

6. show_section({ topic: "how_it_works" }) → same-page detour to how_it_works
7. tour_next → returns to step 4 (advances past step 3)
8. Verify: how_it_works step is in seenSteps

Navigate to /quickscan/:
9. get_current_screen → { screen: "screen1" }
10. show_section({ topic: "report_contents" }) → CROSS-PAGE to landing
11. Verify: sessionStorage has ntd-guide-detour with returnPath="/quickscan/"
12. Verify: detour.returnStepIndex matches where we were
13. Verify: detour.voiceWasActive = true (or whatever was set)

Simulate arrival on landing page (read sessionStorage):
14. Verify: crossPageReturnRef would be set
15. Verify: tour would jump to the data-categories step
16. tour_next → cross-page return
17. Verify: sessionStorage has ntd-guide-return with stepIndex = original+1
18. Verify: ntd-guide-detour is cleared

Simulate arrival back on /quickscan/:
19. Verify: tour resumes at correct step
20. Verify: seenSteps restored from sessionStorage
```

### Journey 3: Skeptical researcher — Screen 2 back to landing, then forward again

```
Start on Screen 2 (property confirmed, filling payment details):
1. fill_email({ email: "ona@paštas.lt" }) → success
2. toggle_consent({ checked: true }) → success

User asks "o ką tiksliai gauname ataskaitoje?"
3. show_section({ topic: "report_contents" }) → cross-page to landing
4. Verify: detour saved with returnPath="/quickscan/", returnStepIndex from screen2

Simulate arrival on landing:
5. Step jumps to data-categories
6. User says "o kiek tai kainuoja?"
7. show_section({ topic: "pricing" }) → same-page detour ON TOP of cross-page
8. Verify: crossPageReturnRef is still set (not overwritten by same-page detour)
9. Verify: returnStepRef is set for same-page pricing detour
10. tour_next → returns from same-page pricing detour to data-categories
11. tour_next → triggers cross-page return to /quickscan/

Simulate return to /quickscan/:
12. Verify: Screen 2 state is restored
13. Verify: email and consent are still set (not cleared by navigation)
14. select_payment_method({ method: "swedbank" }) → success
15. click_pay → success
```

### Journey 4: Confused user — back and forth

```
Screen 1:
1. select_case_type({ case_type: "new_build_project" }) → success
2. fill_address({ address: "Konstitucijos pr. 20" }) → candidates
3. select_address_candidate({ index: 0 }) → confirmed
4. User changes mind: select_case_type({ case_type: "existing_object" }) → overwrites
5. Verify: case_type is now existing_object

6. click_continue → success (resolver runs)

Screen 2:
7. confirm_property → success
8. User says "ne, ne tas objektas"
9. navigate_back → returns to Screen 1
10. Verify: case_type preserved (existing_object)

11. fill_address({ address: "Gedimino pr. 1" }) → new candidates
12. select_address_candidate({ index: 0 }) → new address
13. click_continue → success

Screen 2 again:
14. confirm_property → success
15. fill_email({ email: "invalid-email" }) → { error: "invalid_email" }
16. fill_email({ email: "petras@gmail.com" }) → success
17. click_pay → { error: "missing_fields", missing: ["sutikimas su sąlygomis", "mokėjimo būdas"] }
18. toggle_consent({ checked: true }) → success
19. select_payment_method({ method: "card" }) → success
20. click_pay → success
```

### Journey 5: Edge cases — rapid navigation and boundary conditions

```
Test A: tour_next on empty/inactive tour
1. tour_next with tour not active → { error: "tour_not_active" }

Test B: tour_back on first step
1. Set currentStepIndex = 0
2. tour_back → { error: "first_step" }

Test C: show_section with unknown topic
1. show_section({ topic: "nonexistent" }) → { error: "unknown_topic" }

Test D: Double detour same-page — show_section while already on detour
1. tour_next to step 2
2. show_section({ topic: "pricing" }) → detour
3. show_section({ topic: "how_it_works" }) → SECOND detour while on first
4. Verify: returnStepRef updated correctly (should return to pricing? or to step 2?)
5. tour_next → returns somewhere sane, no crash

Test E: click_continue when form not ready
1. No case type, no address
2. click_continue → { error: "form_not_ready" }

Test F: click_pay with partial fields
1. Email set, consent not set, no payment method
2. click_pay → { error: "missing_fields", message includes all missing }

Test G: fill_address with zero results
1. fill_address({ address: "xyznonexistent123" }) → mock geocode returns []
2. Result: { success: false, error: "no_results" }

Test H: select_address_candidate with stale ref
1. fill_address returns candidates
2. fill_address called again (new search clears old)
3. select_address_candidate({ index: 2 }) with old index → { error: "invalid_index" } or valid if new results have index 2

Test I: fill_ntr with invalid format
1. fill_ntr({ ntr: "abc" }) → { error: "invalid_format" }
2. fill_ntr({ ntr: "1234-5678-9012" }) → success

Test J: select_payment_method with invalid method
1. select_payment_method({ method: "bitcoin" }) → { error: "invalid_method" }

Test K: toggle operations are idempotent
1. toggle_consent({ checked: true }) → success
2. toggle_consent({ checked: true }) → success (no crash, same state)
3. toggle_consent({ checked: false }) → success
4. toggle_consent({ checked: false }) → success

Test L: Cross-page detour with stale sessionStorage
1. Set ntd-guide-detour with a targetTopic that doesn't exist on current page
2. Mount effect runs → should clean up gracefully, no crash
3. sessionStorage key removed

Test M: seen steps persistence across cross-page roundtrip
1. Visit steps 0, 1, 2 on landing
2. Cross-page detour to /quickscan/
3. Return to landing
4. Verify: steps 0, 1, 2 still in seenSteps
5. tour_next → skips to step 3 (first unseen)

Test N: Multiple cross-page roundtrips
1. Landing → detour to /quickscan/ (show data sources) → return
2. Landing → detour to /quickscan/ again (different topic) → return
3. Verify: all sessionStorage keys clean, seenSteps accumulated correctly, no stale refs

Test O: navigate_back clears detour state
1. On Screen 2, show_section triggers cross-page detour state saved
2. Before navigation actually happens, navigate_back is called
3. Verify: detour state cleaned up, returns to Screen 1 normally
```

### Journey 6: Full E2E — the demo scenario

The sequence a sales demo would follow:

```
Landing page:
1. Voice connects
2. Narration: step 1 (hero) — "Sveiki! Padėsiu apžvelgti..."
3. "toliau" → step 2 (situation cards)
4. "toliau" → step 3 (data categories / "Ką gausite")
5. "kiek kainuoja?" → show_section("pricing") → detour to pricing step
6. Reads pricing narration
7. "toliau" → returns to step 4 (skips step 3, already seen)
8. "toliau" → step 5
9. "toliau" → last step → "Tai paskutinis žingsnis"

Screen 1:
10. "Noriu patikrinti esamą butą" → select_case_type("existing_object")
11. "Adresas Žirmūnų gatvė dvylika" → fill_address → auto-selects
12. "Taip, teisingas" → model confirms
13. "ką tiksliai gausiu ataskaitoje?" → show_section("report_contents") → cross-page to landing
14. Landing: data-categories step shows, narration reads
15. "toliau" → returns to Screen 1
16. "Tęsti" → click_continue → resolver

Screen 2:
17. "Taip, teisingas" → confirm_property
18. "paštas jonas@gmail.com, sutinku su sąlygomis, mokėsiu kortele"
    → fill_email + toggle_consent + select_payment_method (three calls)
19. Model: "Ataskaita kainuoja 39 eurų. Ar patvirtinate?"
20. "Taip" → click_pay → success
```

Assert entire state at end: email set, consent true, payment method "card", order submitted.

## Execution approach

Claude Code should:

1. **Write all tests first** based on the scenarios above. Expect some to fail.
2. **Run them.** Identify failures.
3. **Fix the handler code** where tests reveal real bugs (not just test setup issues).
4. **Iterate** until all pass. Each fix gets its own commit with a descriptive message.
5. **Report** which handlers had bugs, what was fixed, and the final test count.

If a test scenario reveals that the architecture can't support it (e.g., nested detours on top of cross-page detours), document it as a known limitation rather than over-engineering a fix.

## Constraints

- **Don't mock the handlers themselves.** Mock the *dependencies* (DOM, fetch, sessionStorage, tour state), but call the real registered handler functions. The point is to test the handler logic, not the mock.
- **Each journey is one test function** (or a small group), not split into individual assertions. The sequence matters.
- **State must be reset between journeys.** Clean `formActionsRegistry`, `sessionStorage`, all refs.
- **Lithuanian strings in assertions** where the handler returns Lithuanian messages.
- **Don't change tool definitions or system prompts.** This is a test-only brief. If a bug is found in handler logic, fix the handler — don't change the tool schema.

## Files to touch

### New files:
- `src/components/guide/__tests__/journeyIntegration.test.ts` — all journey tests

### Modified files (only if bugs are found):
- `src/components/guide/AIGuide.tsx` — handler fixes
- `src/components/QuickScanFlow.tsx` — handler fixes
- `src/components/guide/contentMap.ts` — if cross-page logic has issues
- `src/hooks/useTour.ts` — if goToStep/seenSteps has issues

## Target
All journey tests pass. Final test count: 78 + journey tests (~30-40 individual test cases across 6 journeys + edge cases) = ~110-120 total.