# P7-B1.2: Hover-to-Open Mode Selector

## What
Change the AI Guide mode selector from click-to-open to hover-to-open. Remove the "Padėti?" tooltip entirely. The mode selector card appears directly when the user hovers over the Robocat avatar, with a 300ms delay to prevent accidental triggers.

## Why
The current flow is: hover → see "Padėti?" tooltip → click → see mode selector. That's two steps where one will do. The user hovers, immediately sees the three modes, decides. No guessing what "Padėti?" means.

## How

In `src/components/guide/AIGuideToggle.tsx`:

1. **Remove** the "Padėti?" tooltip element entirely

2. **Change `showDropdown` trigger** from `onClick` to `onMouseEnter` with a 300ms delay:
```typescript
const [showDropdown, setShowDropdown] = useState(false);
const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

const handleMouseEnter = () => {
  hoverTimeoutRef.current = setTimeout(() => {
    setShowDropdown(true);
  }, 300);
};

const handleMouseLeave = () => {
  if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  setShowDropdown(false);
};
```

3. **Apply hover handlers to a shared wrapper** that includes both the avatar and the dropdown card. This prevents the card from closing when the mouse moves from the avatar to the card:
```tsx
<div
  onMouseEnter={handleMouseEnter}
  onMouseLeave={handleMouseLeave}
  className="fixed bottom-24 right-12 z-50"
>
  {showDropdown && <ModeSelector ... />}  {/* positioned above avatar */}
  <RiveAvatar ... />
</div>
```

4. **Keep click as fallback** for mobile (no hover on touch devices). The `onClick` handler on the avatar should still toggle the dropdown.

5. **Card enter animation:** When `showDropdown` becomes true, the card animates in:
```css
opacity: 0 → 1 over 200ms
transform: translateY(8px) → translateY(0) over 200ms
```

## Constraints
- The 300ms delay is important — prevents accidental triggers on mouse flyovers
- The shared hover zone must cover both avatar + card (no gap that closes the card)
- Mobile: click still works as trigger (fallback for no-hover devices)
- The dropdown still opens upward (above the avatar)
- Cleanup: clear the timeout on unmount (`useEffect` cleanup)
- All 38 tests must pass, build must succeed

## Files to touch
- `src/components/guide/AIGuideToggle.tsx` — remove tooltip, add hover handlers with 300ms delay

## Visual QA
- [ ] Hover over avatar → 300ms pause → card fades in smoothly
- [ ] Move mouse from avatar to card → card stays open
- [ ] Move mouse away from both → card fades out
- [ ] Quick mouse flyover (< 300ms) → card does NOT appear
- [ ] Click on avatar still opens card (mobile fallback)
- [ ] No "Padėti?" tooltip visible anywhere
- [ ] Tour still starts when "Pradėti ▶" is clicked