# P7-B5.1: Chat Card Styling + Overlap Fix

## What
Two changes:
1. **Restyle the chat input card** — change from teal (`bg-[#0D7377]`) to white, matching the narration bubble. Keep a small gap (8px) between the narration card and the chat card to visually separate them while making them feel like a unified pair.
2. **Fix overlap** — some narrations extend below the bubble and overlap with the chat card. The chat card's position must account for the narration bubble's actual rendered height.

## How

### 1. Chat card styling

Change in `NarrationBubble.tsx`:

**Before:** `bg-[#0D7377]` with white text, 💬 icon
**After:** `bg-white` with slate text, same shadow and border-radius as the narration card. The chat input and send button use teal accents (input border on focus, send button background) but the card itself is white.

```
┌──────────────────────────────┐
│ Narration text here.         │  ← white card (narration)
│ 2 iš 6    ◀ Atgal  Toliau ▶ │
└──────────────────────────────┘
        8px gap
┌──────────────────────────────┐
│ 💬 Turite klausimų?     [→] │  ← white card (chat), same style
└──────────────────────────────┘
              △
          ┌────────┐
          │ 🐱     │
          └────────┘
```

Styling for the chat card:
- `bg-white rounded-xl shadow-lg` — same as narration bubble
- Input: `text-sm text-slate-600 placeholder:text-slate-400 border border-slate-200 focus:border-[#0D7377]`
- Send button: `bg-[#0D7377] text-white rounded-lg` (teal accent stays on the button only)
- 💬 icon: `text-slate-400` (subtle, not dominant)
- The speech triangle pointer moves from the narration card to the chat card (since chat card is now the bottom element closest to the avatar)

### 2. Overlap fix

The chat card must be positioned relative to the narration bubble's bottom edge, not at a hardcoded offset. Two approaches:

**Option A (simpler):** Render both cards in a single flex column container with `gap-2` (8px). The container is positioned above the avatar. No hardcoded heights — the flex layout handles spacing automatically.

```tsx
<div className="fixed z-[51]" style={{ bottom: BUBBLE_BOTTOM, right: BUBBLE_RIGHT }}>
  <div className="flex flex-col gap-2">
    {/* Narration card */}
    <div className="bg-white rounded-xl shadow-lg p-4 ...">
      {narrationContent}
    </div>
    {/* Chat card */}
    <div className="bg-white rounded-xl shadow-lg p-3 ...">
      {chatInput}
    </div>
  </div>
  {/* Triangle pointer on the chat card */}
</div>
```

**Option B:** Keep separate positioning but measure the narration card's height dynamically via `useRef` + `getBoundingClientRect()` and offset the chat card accordingly.

**Recommendation: Option A** — wrapping both in a flex column is simpler and automatically handles any narration text length.

### 3. Triangle pointer

Move the speech triangle from the narration card to the bottom of the chat card (since that's now the element closest to the avatar):

```css
/* Triangle on the chat card, pointing down toward avatar */
.chat-card::after {
  bottom: -8px;
  right: 50px;
  border-top: 8px solid white;
}
```

## Constraints
- Both cards are white with identical shadow/border-radius
- 8px gap between them (`gap-2`)
- Chat card is always visible when tour is active (not hidden until interaction)
- The triangle pointer is on the bottom card (chat card)
- Flex column layout prevents any overlap regardless of narration text length
- All tests must pass

## Files to touch
- `src/components/guide/NarrationBubble.tsx` — restyle chat card, wrap in flex column, move triangle

## Visual QA
- [ ] Both cards are white with matching shadow/radius
- [ ] 8px gap visible between narration card and chat card
- [ ] No overlap between narration text and chat card at any step
- [ ] Chat input has slate text, teal focus border, teal send button
- [ ] Triangle pointer on the chat card points toward avatar
- [ ] Long narrations push the chat card down without overlap
- [ ] Chat mode (conversation view) still works correctly within the white card