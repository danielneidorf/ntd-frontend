// AI Act Art. 50(1) — the single origin for every customer-facing disclosure string.
//
// WHY THIS MODULE EXISTS. Art. 50(1) requires the system be *designed* so the
// person is informed they are dealing with an AI. Five short strings scattered
// across four components is how one gets edited and the others drift — and a
// disclosure that drifts is a disclosure that stopped being designed in. Every
// component imports from here; none may hardcode one of these strings.
//
// WHY NOT THE BACKEND. The house rule is that customer-facing Lithuanian lives
// in backend templates. That rule exists so *report content* stays identical
// across the web report and the PDF — one source, two renderings. This is not
// report content: the guide card renders on the landing page, which makes no
// backend call at all, and has no PDF surface. Fetching these at runtime would
// make the disclosure **fail open** — backend unreachable or CORS blocked and
// the widget still renders while the disclosure silently vanishes. A disclosure
// should no more depend on a network call than on a model choosing to speak it.
//
// TERMINOLOGY. „DI", not „AI" — the native Lithuanian form, and the term RRT
// and the Lithuanian press use for the „DI aktas" itself.

/** Guide card header. Carries the disclosure in the first line of the reading
 *  order, at the moment the user decides whether to press „Pradėti". */
export const GUIDE_CARD_TITLE = 'Naršyti su DI gido pagalba';

/** The full disclosure sentence, per NTD_AI_Guide_Concept.md §8.5.
 *
 *  CONDITIONAL — DO NOT MOVE OR DROP WITHOUT READING THIS. This sentence is the
 *  gloss that licenses the abbreviation „DI" in GUIDE_CARD_TITLE and
 *  AVATAR_BADGE_LABEL: abbreviation and full form appear on the same surface, so
 *  „DI" cannot be misread by someone who does not already know the term. The
 *  project's no-abbreviations rule is waived for „DI" only on that condition.
 *  If this sentence is ever dropped from the guide card, the title and the badge
 *  must revert to the fully spelled-out form. */
export const GUIDE_DISCLOSURE_SENTENCE = 'Šis asistentas naudoja dirbtinį intelektą.';

/** Persistent visible label under the avatar. Must render at all times — never a
 *  `title` attribute, a `:hover` rule or a timed fade. It is the carrier for
 *  users who reach the widget without opening the card, and the only one that
 *  reaches sighted touch users, who have no hover event at all. */
export const AVATAR_BADGE_LABEL = 'DI asistentas';

/** Rendered beneath the chat input. The chat box is a separate entry point — it
 *  can be typed into without ever opening the guide card or hovering the avatar
 *  — so it discloses on its own. */
export const CHAT_DISCLOSURE_LINE = 'Atsako dirbtinio intelekto asistentas.';

/** Shown on screen when a voice session opens, before the model's first turn.
 *
 *  Phrased in the first person because it was written to be *spoken*: a
 *  pre-recorded clip was to play it aloud at session start, on the reasoning
 *  that a voice user may not be looking at the screen. That clip was deferred to
 *  backlog on 2026-07-31 — reaching voice already passes three always-visible
 *  disclosures (badge, card title, disclosure sentence), and the session then
 *  carries this line plus live subtitles. It reopens only if voice activation
 *  ever gains a path that bypasses the avatar surface. See
 *  `docs/deferred_backlog.md` in bustodnr; no audio asset depends on this string
 *  today, so it can be edited freely. */
export const VOICE_DISCLOSURE_SPOKEN = 'Sveiki, esu dirbtinio intelekto asistentė.';
