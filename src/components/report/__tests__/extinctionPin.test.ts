/**
 * THE EXTINCTION PIN — authored Lithuanian in a report component fails the build.
 *
 * WHAT IT IS FOR. Every string this batch moved to the backend had lived twice:
 * once in a React literal, once in a Jinja one. Several had already drifted
 * before anyone noticed — print headed the bibliography „Šaltiniai ir nuorodos"
 * while the web said „Šaltiniai"; the monthly chart carried two different
 * titles; print's spoken chart description dropped the month names the web's
 * named. A customer got a different document depending on which one they
 * opened, and every test was green throughout, because each side's fixtures
 * were written by the hand that wrote its code.
 *
 * Moving the strings fixes today. This fixes tomorrow: the next report string
 * typed into a component reddens here, and the author is pointed at
 * `reports/report_copy_lt.py` instead.
 *
 * WHY A TEST AND NOT A LINT RULE. There is no ESLint in this repo, and
 * `astro build` does not typecheck. The precedent for source-inspection guards
 * is `__tests__/candidateWireContract.test.ts`, which reads a component off
 * disk and asserts patterns are absent for exactly that reason.
 *
 * WHAT IT CANNOT SEE — stated because a guard whose limits are unstated gets
 * mistaken for a complete one, which is the flattering marker this whole batch
 * exists to distrust:
 *
 *   1. The signal is Lithuanian-SPECIFIC letters (ąčęėįšųūž). A Lithuanian
 *      string spelled without one — „Pagrindiniai veiksniai", „Statybos
 *      leidimai (Infostatyba)" — passes straight through. What saves the gated
 *      vocabulary is that ALL EIGHTEEN ruled strings carry at least one such
 *      letter, so the pin does cover what the gate ruled. It does not cover
 *      every Lithuanian word that could be typed here.
 *   2. Quoted literals are matched line by line, so a string BROKEN ACROSS A
 *      LINE with `+` reads as two short fragments. (JSX text spanning lines IS
 *      captured — the first version of this file did not, and three headings
 *      walked through the gap. It was found by rendering the page, not by
 *      reading the guard; the matcher was widened rather than the allowlist.)
 *
 * The answer to a blind spot is a better signal, never another allowlist row.
 *
 * WHAT IT SCANS AND WHAT IT DOES NOT. Only REPORT-SURFACE components — the
 * report is where the backend-origin rule binds. The order journey's own
 * Lithuanian is parked for its own sitting and is guarded separately
 * (`__tests__/ruledCopy.test.tsx`). Comments are stripped before scanning: a
 * component may RECORD a retired wording in its history — that is how these
 * files explain themselves — but it may not RENDER one. The backend's own
 * template-side pin strips Jinja comments for the same reason.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const COMPONENTS = resolve(HERE, '..');

/**
 * The report-surface files this rule binds. `ReportViewer.tsx` is the page
 * itself and holds `DriversSection` inline, so it counts — leaving it out was
 * the first thing the staleness check below caught.
 */
const SCANNED = [
  '../ReportViewer.tsx',
  'Block2Section.tsx',
  'Citations.tsx',
  'ComfortBar.tsx',
  'AdditionalDocuments.tsx',
  'PropertyProfile.tsx',
  'InfoSection.tsx',
  'Block8Section.tsx',
];

/**
 * Deliberate survivors, each with the reason it survives. Anything not on this
 * list that carries Lithuanian letters in a string or JSX text position is a
 * new violation.
 *
 * A LIST THAT NEVER SHRINKS IS A LIST NOBODY READS, so each entry names what
 * would retire it.
 */
const ALLOWLIST: { text: string; reason: string }[] = [
  // ── Cross-repo PINNED pairs: two copies, held equal by a backend disk-read
  //    test. Not in the ruled eighteen, so no served field exists to read.
  //    Each retires when a sitting rules it and the backend serves it.
  {
    text: 'Tipinės namų ūkio elektros sąnaudos',
    reason:
      'Reference-table caption (§7.7). Backend twin: templates_lt.'
      + 'HOUSEHOLD_REFERENCE_CAPTION_LT, pinned character-equal by '
      + 'tests/reports/test_info_section.py.',
  },
  {
    text: 'Kokia informacija remiamės?',
    reason:
      "InfoSection's DEFAULT title. Block 2 already passes the served "
      + '`info_section.title_lt`; BLOCK 1 does not — its keyed payload carries no '
      + 'title at all, so the default renders. Backend twin: '
      + 'block2/templates_lt.INFO_SECTION_TITLE_LT, pinned equal. Retires when '
      + "block1's info box is served its title too.",
  },
  {
    text: 'Vidutinė mėnesinė kaina',
    reason:
      "The monthly chart's average-line label. Copied verbatim from the PDF legend "
      + 'to close a parity gap; not ruled, not served.',
  },

  // ── Chart band labels. One set of five, rendered in the legend and the
  //    tooltips. The PDF draws its own from the backend's band vocabulary, so
  //    these are a second copy — unruled, and a divergence waiting to happen.
  {
    text: 'Pastovūs mokesčiai',
    reason: 'Chart band label (fixed charges). Unruled; PDF draws its own. → copy sitting.',
  },
  {
    text: 'Karštas vanduo',
    reason: 'Chart band label (hot water). Unruled; PDF draws its own. → copy sitting.',
  },
  {
    text: 'Šildymas',
    reason: 'Chart band label (heating). Unruled; PDF draws its own. → copy sitting.',
  },
  {
    text: 'Vėsinimas',
    reason: 'Chart band label (cooling). Unruled; PDF draws its own. → copy sitting.',
  },
  {
    text: 'Buitinė elektra',
    reason: 'Chart band label (household electricity). Unruled; PDF draws its own. → copy sitting.',
  },

  // ── Block and card structure copy: headings, row labels, units.
  {
    text: '2) Energijos sąnaudos',
    reason:
      "Block 2's own heading. The PDF reads a served `block2.heading`; the web "
      + 'numbers and titles the section itself. Unruled. → copy sitting.',
  },
  {
    text: '/ mėn.',
    reason:
      'The metric unit beside the headline €. ALREADY SERVED as '
      + '`block2.metric.unit_lt` and already read by the PDF '
      + '(`block2.metric_unit_lt or "/ mėn."`); the web still prints its own. A '
      + 'live one-sided divergence, reported not closed — closing it is a wire '
      + 'change outside the ruled eighteen.',
  },
  {
    text: 'Pagrindiniai veiksniai',
    reason:
      "DriversSection's DEFAULT heading, used by the summer-drivers caller. The "
      + 'winter caller now passes the served №9. Retires when the summer heading is '
      + 'ruled and served alongside it. (Carries no Lithuanian-specific letter, so '
      + 'the scan below cannot see it — it is here for the staleness check, which '
      + 'searches every rendered string.)',
  },
  {
    text: '1) Vidaus patalpų klimato komfortas',
    reason:
      "Block 1's own heading — same class as Block 2's above: the web numbers and "
      + 'titles its sections, print reads a served heading. Unruled. → copy sitting.',
  },
  {
    text: 'Neįvertinta',
    reason:
      'The chip on the not-assessed winter band. Its SENTENCE is ruled (№11–14) '
      + 'and served; the one-word chip is not. → copy sitting.',
  },
  {
    text: 'Žiema',
    reason: "The summary section's winter column heading. Unruled. → copy sitting.",
  },
  {
    text: 'Ruošiama...',
    reason:
      "The recalc action button's busy state. Journey copy, parked for the "
      + 'journey-copy sitting with the Screen-1/D8 surfaces.',
  },
  {
    text: 'Bandykite dar kartą.',
    reason:
      "The report page's own error state (not the ruled №35 line below it, which "
      + 'is served). Journey/error copy, parked for the journey-copy sitting.',
  },
  {
    text: 'sandėliukas',
    reason: 'Bundle-item kind label („Komplekte taip pat yra"). Unruled. → copy sitting.',
  },
  {
    text: 'garažas',
    reason: 'Bundle-item kind label. Unruled. → copy sitting.',
  },

  // ── Section and block headings the web authors. Print heads the blocks it
  //    renders from served copy; these are the web's own. All unruled.
  ...[
    'Vieši šaltiniai',
    'Savininko prieiga',
    'Vasaros perkaitimo rizika',
    'Ką tai reiškia praktiškai?',
    'Derybų kampai',
    'Ką patikrinti apžiūros metu',
  ].map((text) => ({
    text,
    reason:
      'Section heading authored on the web. Unruled — one sitting should rule '
      + 'the heading set together rather than move them one at a time.',
  })),

  // ── In-report explainers and markers.
  {
    text: 'Jūsų pastatas',
    reason:
      'The marker beside the active comfort band. Print uses the ◄ glyph ALONE, '
      + 'so a print reader is never told what the arrow means — a live '
      + 'divergence. → ruling owed.',
  },
  {
    text: 'Šiems dokumentams reikalinga Registrų centro savitarnos paskyra (savininko arba įgalioto asmens prieiga).',
    reason: 'Owner-access explainer. Web-only panel; print has no owner section. → copy sitting.',
  },
  {
    text: 'Šiame bloke apžvelgiame, kiek lengva šiame būste palaikyti komfortišką temperatūrą žiemą ir kokia yra perkaitimo rizika vasarą.',
    reason:
      "Block 1's intro paragraph — the counterpart of Block 2's `intro_lt`, which "
      + 'the backend DOES serve. Retires when Block 1 serves its intro too.',
  },

  // ── Page chrome and error states. Journey copy, parked for the journey-copy
  //    sitting together with the Screen-1/D8 surfaces.
  ...[
    'Atsisiųsti PDF',
    'Grįžti į pradžią',
    'Bandyti dar kartą',
    'Nepavyko įkelti ataskaitos',
    'Nuoroda gali būti netinkama arba pasibaigusi.',
  ].map((text) => ({
    text,
    reason: 'Page chrome / error state. Journey copy, parked for the journey-copy sitting.',
  })),

  // ── Property-card row labels. The PDF prints its own set, and they are not
  //    all identical — the card and the print table have drifted before.
  ...[
    'Žemės sklypas',
    'Šildomas plotas',
    'Naudojimo grupė',
    'Aukštų skaičius',
    'Sienų medžiaga',
    'Šildymo tipas',
    'Energinė klasė',
    'Energijos sąnaudos',
    'Duomenų šaltinis',
    'Langų dalis fasade',
    'Langų duomenų šaltinis',
  ].map((text) => ({
    text,
    reason:
      'Property-card row label. Unruled, and the PDF prints its own copy of the '
      + 'same table — the whole label set wants one sitting and one served '
      + 'vocabulary, not eleven separate moves.',
  })),

  // ── Accessible names composed in the card.
  {
    text: 'Energinė klasė ${active} skalėje nuo ${lo} iki ${hi}',
    reason:
      'The class ladder\'s accessible name, composed from the served class. '
      + 'Unruled; print has no accessibility layer to diverge from. → copy sitting.',
  },
  {
    text: 'Energinės klasės skalė nuo ${lo} iki ${hi}',
    reason: 'The empty-state variant of the same accessible name. → copy sitting.',
  },

  // ── Document-panel link labels. The DESCRIPTIONS are served (№15–18); the
  //    labels are not, and web and print disagree on them today (web „Kadastro
  //    žemėlapis (REGIA)" vs print „REGIA kadastro žemėlapis"), as do three of
  //    the URLs. Reported at this sitting; needs a ruling on which form is right.
  {
    text: 'Kadastro žemėlapis (REGIA)',
    reason: 'Document link label; diverges from the PDF\'s own wording. → ruling owed.',
  },
  {
    text: 'Teritorijų planavimo dokumentai (TPDR)',
    reason: 'Document link label; diverges from the PDF\'s own wording. → ruling owed.',
  },
  {
    text: 'Kadastro duomenų byla ir aukštų planai',
    reason:
      'Owner-access link label. Web-only panel (print has no owner section at '
      + 'all), so nothing to diverge from yet. → ruling owed.',
  },
];

/** Lithuanian-specific letters — the cheapest unambiguous signal. */
const LT_LETTERS = /[ąčęėįšųūžĄČĘĖĮŠŲŪŽ]/;

/**
 * Source with comments removed, so a documented history cannot read as copy.
 * Line comments and block comments both go; JSX `{/* … *\/}` is a block comment
 * inside braces, so stripping block comments covers it.
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

/**
 * Candidate rendered strings: quoted literals and JSX text.
 *
 * Deliberately broad — a pin that only checked one shape would miss the next
 * one. False positives are cheap (one allowlist line with a reason); a miss is
 * the defect this exists to prevent.
 */
function renderedStrings(source: string): string[] {
  const stripped = stripComments(source);
  const found: string[] = [];

  // NEWLINES EXCLUDED FROM ALL THREE, template literals included. Without that
  // the backtick arm ran across the multi-line `className={`…`}` blobs these
  // components are full of and swallowed hundreds of lines as ONE "string",
  // hiding every real literal inside it — the pin reported one absurd match and
  // looked like it was working. Report copy is never a multi-line template.
  for (const match of stripped.matchAll(/'([^'\\\n]{3,})'|"([^"\\\n]{3,})"|`([^`\\\n]{3,})`/g)) {
    found.push(match[1] ?? match[2] ?? match[3]);
  }
  // JSX text between tags, e.g. `<span>Jūsų pastatas</span>` — NEWLINES
  // ALLOWED here and whitespace collapsed, because these components wrap their
  // JSX and the heading that reads
  //
  //     <h2 className="…">
  //       Vieši šaltiniai
  //     </h2>
  //
  // is exactly as rendered as one written on a single line. The first version
  // of this matcher stopped at the newline and let three headings through —
  // found by rendering the page, not by reading the guard.
  for (const match of stripped.matchAll(/>([^<>{}]{3,})</g)) {
    found.push(match[1].replace(/\s+/g, ' '));
  }

  return found.map((s) => s.trim()).filter(Boolean);
}

const allowed = new Set(ALLOWLIST.map((a) => a.text));

describe('the report components author no Lithuanian', () => {
  it.each(SCANNED)('★ %s renders only served copy', (file) => {
    const source = readFileSync(resolve(COMPONENTS, file), 'utf-8');

    const violations = renderedStrings(source)
      .filter((text) => LT_LETTERS.test(text))
      .filter((text) => !allowed.has(text));

    expect(
      violations,
      `${file} authors report copy in TypeScript.\n\n` +
        violations.map((v) => `  • ${v}`).join('\n') +
        '\n\nReport strings are produced ONCE, in the backend, and read by both ' +
        'the web and the PDF — see bustodnr/bustodnr_api/reports/report_copy_lt.py. ' +
        'If a string genuinely belongs here, add it to ALLOWLIST above WITH THE ' +
        'REASON and what would retire it.',
    ).toEqual([]);
  });

  it('★ every allowlist entry is still real — a stale exemption is a hole', () => {
    const all = SCANNED.map((f) =>
      renderedStrings(readFileSync(resolve(COMPONENTS, f), 'utf-8')),
    ).flat();

    for (const entry of ALLOWLIST) {
      expect(
        all,
        `"${entry.text}" is allowlisted but no longer appears in any scanned ` +
          'component. Delete the entry — an exemption for a string that is gone ' +
          'silently exempts whatever takes its place.',
      ).toContain(entry.text);
    }
  });

  it('★ the pin can fail — a planted literal is caught', () => {
    const planted = "const x = 'Žiemos komforto įvertinti nepavyko';";

    const violations = renderedStrings(planted)
      .filter((text) => LT_LETTERS.test(text))
      .filter((text) => !allowed.has(text));

    expect(violations).toEqual(['Žiemos komforto įvertinti nepavyko']);
  });

  it('★ a documented history is not a violation — comments are stripped', () => {
    const documented = [
      "// It used to say 'Šaltiniai ir nuorodos' here.",
      '/* The retired wording was „Bandykite vėliau". */',
      '{/* №8 — „Žiemos komfortas" is served now. */}',
    ].join('\n');

    const violations = renderedStrings(documented).filter((t) => LT_LETTERS.test(t));

    expect(violations).toEqual([]);
  });
});
