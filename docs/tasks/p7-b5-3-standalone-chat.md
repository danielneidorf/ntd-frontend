# P7-B5.3: Standalone Chat on Avatar Hover

## What
Show the chat input card on avatar hover even when no tour is active. Currently the chat is only visible during the guided tour (Mode 2). With this change, any user can hover over the Robocat, see the mode selector AND a chat input, and ask a question without starting the full tour.

## Why
The chat is valuable independently of the tour. A user browsing "Savarankiškai" might look at the comfort bars and wonder "Ką reiškia C klasė?" — they shouldn't have to start a guided tour to ask. The Robocat should always be a helpful assistant, not just a tour guide.

## How

### Hover state (no tour active)

Currently on hover, the mode selector card appears above the avatar:
```
┌──────────────────────────────┐
│ Kaip norite naudotis?         │
│ ○ Savarankiškai               │
│ ● Su AI gidu                  │
│ ○ Balso asistentas  (Greitai!)│
│ [Pradėti ▶]                  │
└──────────────────────────────┘
         8px gap
┌──────────────────────────────┐
│ 💬 Turite klausimų?     [→] │  ← NEW: chat card always visible on hover
└──────────────────────────────┘
              △
          ┌────────┐
          │ 🐱     │
          └────────┘
```

The chat card appears below the mode selector card (or directly above the avatar if the mode selector is not shown). Same styling as B5.1 — white card, 8px gap, teal send button.

### During tour (Mode 2 active)

No change — the narration bubble + chat card work as they do now. The mode selector is hidden (replaced by narration).

### Implementation

In `AIGuideToggle.tsx`:

1. The chat card component is extracted into a reusable `ChatInput` component (or the existing chat card from `NarrationBubble.tsx` is made reusable)
2. When `showDropdown` is true (hover state) AND tour is NOT active:
   - Render the mode selector card
   - Render the chat input card below it
3. When tour IS active:
   - The chat input is part of the narration bubble (existing B5 behavior)
   - The mode selector is not shown

### Chat without tour context

When the user sends a message from the standalone chat (no tour active):
- `page` is determined from the current URL (landing / quickscan / report)
- `step_id` is `"standalone"` — tells Haiku there's no specific tour step
- `property_context` is extracted from the DOM if on the report page (same as B5.2)
- The conversation thread appears in the chat card, expanding it upward

The expanded chat card:
```
┌──────────────────────────────┐
│ Kaip norite naudotis?         │  ← mode selector (still visible)
│ ...                           │
└──────────────────────────────┘
         8px gap
┌──────────────────────────────┐
│ 🧑 Ką reiškia C klasė?      │  ← conversation thread
│                              │
│ 🤖 C klasė reiškia, kad     │
│ pastatas naudoja vidutiniškai│
│ energijos šildymui...        │
│                              │
├──────────────────────────────┤
│ 💬 Klauskite dar...     [→] │
└──────────────────────────────┘
              △
          ┌────────┐
          │ 🐱     │
          └────────┘
```

### Mouse leave behavior

The chat card stays open as long as the mouse is within the hover zone (avatar + cards). On mouse leave:
- If there's an active conversation (messages exist), the chat card stays visible for 3 seconds before fading out (so the user can read the response)
- If no conversation, the card disappears with the normal 200ms fade (same as mode selector)

### Keyboard shortcut

Clicking the chat input should keep the hover zone active (prevent it from closing). Once the user has focused the chat input, the cards stay open until they click elsewhere or press Escape.

## Constraints
- The chat card uses the same `/v1/ai-guide/chat` endpoint from B5
- Same rate limiting (20 messages/day per IP)
- Same property context extraction from DOM on report page
- The standalone chat and the tour chat share the same backend — only the `step_id` differs
- The chat card is always the bottom card (closest to avatar, has the triangle pointer)
- On mobile: chat card appears on tap (same as mode selector)
- All tests must pass

## Files to touch
- `src/components/guide/AIGuideToggle.tsx` — render chat card in hover state, manage standalone chat state
- `src/components/guide/AIGuide.tsx` — expose `sendChatMessage` for standalone use (not just tour mode)
- Possibly extract a shared `ChatInputCard` component from `NarrationBubble.tsx` for reuse

## Visual QA
- [ ] Hover over avatar (no tour active) → mode selector + chat card both appear
- [ ] Type a question in standalone chat → "..." appears → AI responds
- [ ] AI response references property data on the report page
- [ ] Conversation thread expands the chat card upward
- [ ] Mouse leave with active conversation → card stays 3 seconds before fading
- [ ] Click into chat input → cards stay open (don't fade on hover leave)
- [ ] Start guided tour → chat moves into narration bubble (existing behavior)
- [ ] Standalone chat works on all pages (landing, QuickScan, report)
- [ ] `step_id: "standalone"` sent when no tour is active