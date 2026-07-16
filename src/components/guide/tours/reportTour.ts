// P7-B3: Report tour — property-specific narrations with data injection
import type { TourStep } from '../types';

interface ReportTourData {
  address: string;
  buildingType: string;
  yearBuilt: number | null;
  energyClass: string | null;
  winterLevel: string;
  summerLevel: string;
  hasPermits: boolean;
  permitCount: number;
  isLandOnly: boolean;
  // B8-3: Block 8 (recommendations) DOM-scraped content
  block8Intro: string | null;
  block8ViewingQuestions: string[];
  block8NegotiationAngles: string[];
  // B2-17 (R2): Block 2 (energy costs) DOM-scraped content — one scrape,
  // both consumers (chat + realtime). Angles deliberately NOT re-added.
  energyMetric: string | null;
  energyCarrier: string | null;
  energyConfidence: string | null;
  /** null = no selector on the page; { size, totalMonth } when selected. */
  householdSelection: { size: string; totalMonth: string | null } | null | undefined;
  measuredBasis: boolean;
  solarNote: string | null;
}

const COMFORT_LABELS: Record<string, string> = {
  A: 'A (Puikiai)',
  B: 'B (Gerai)',
  C: 'C (Vidutiniškai)',
  D: 'D (Silpnai)',
  E: 'E (Labai silpnai)',
};

const SUMMER_LABELS: Record<string, string> = {
  A: 'A (Minimali)',
  B: 'B (Maža)',
  C: 'C (Vidutinė)',
  D: 'D (Didelė)',
  E: 'E (Kritinė)',
};

export function extractReportData(): ReportTourData {
  // Extract from DOM — the report components render data-guide attributes and visible text
  const address =
    document.querySelector('[data-guide="property-identity"] h1')?.textContent?.trim() ??
    'Jūsų objektas';

  const profileFields = document.querySelectorAll('[data-guide="property-profile"] p, [data-guide="energy-profile"] p');
  let buildingType = '';
  let yearBuilt: number | null = null;
  let energyClass: string | null = null;

  profileFields.forEach((p) => {
    const label = p.previousElementSibling?.textContent?.trim();
    const value = p.textContent?.trim() ?? '';
    if (label === 'Tipas') buildingType = value;
    if (label === 'Statybos metai') yearBuilt = parseInt(value) || null;
    if (label === 'Energinė klasė') energyClass = value.charAt(0);
  });

  // Winter/summer levels from the comfort bars
  // The active bar has opacity: 1 and a taller height (34px)
  const climateSection = document.querySelector('[data-guide="climate-assessment"]');
  let winterLevel = 'C';
  let summerLevel = 'C';

  if (climateSection) {
    // The active bar has full opacity + taller height (34px).
    const allBars = climateSection.querySelectorAll('[style*="height: 34px"]');
    const winterNotAssessed = !!climateSection.querySelector('[data-winter-not-assessed]');
    if (winterNotAssessed) {
      // No winter band — say so to the assistant; the only active bar is summer.
      winterLevel = 'Neįvertinta';
      if (allBars.length >= 1) {
        const lbl = allBars[0]?.querySelector('.text-white.text-xs.font-semibold');
        if (lbl) summerLevel = lbl.textContent?.trim() ?? 'C';
      }
    } else {
      // Normal: allBars[0] = winter, allBars[1] = summer.
      if (allBars.length >= 1) {
        const firstLabel = allBars[0]?.querySelector('.text-white.text-xs.font-semibold');
        if (firstLabel) winterLevel = firstLabel.textContent?.trim() ?? 'C';
      }
      if (allBars.length >= 2) {
        const secondLabel = allBars[1]?.querySelector('.text-white.text-xs.font-semibold');
        if (secondLabel) summerLevel = secondLabel.textContent?.trim() ?? 'C';
      }
    }
  }

  // Permits
  const permitsSection = document.querySelector('[data-guide="permits"]');
  const permitItems = permitsSection?.querySelectorAll('[class*="border-l-2"]') ?? [];
  const hasPermits = permitItems.length > 0;

  // Land-only
  const isLandOnly = !document.querySelector('[data-guide="climate-assessment"]');

  // B8-3: Block 8 — Recommendations (status="ready" only; absent in land-only mocks)
  const block8Section = document.querySelector('[data-guide="block8"]');
  let block8Intro: string | null = null;
  let block8ViewingQuestions: string[] = [];
  let block8NegotiationAngles: string[] = [];

  if (block8Section) {
    block8Intro =
      block8Section.querySelector('[data-block8="intro"]')?.textContent?.trim() ?? null;
    block8ViewingQuestions = Array.from(
      block8Section.querySelectorAll('[data-block8="viewing-questions"] li'),
    )
      .map((li) => li.textContent?.trim() ?? '')
      .filter((s) => s.length > 0);
    block8NegotiationAngles = Array.from(
      block8Section.querySelectorAll('[data-block8="negotiation-angles"] li'),
    )
      .map((li) => li.textContent?.trim() ?? '')
      .filter((s) => s.length > 0);
  }

  // B2-17 (R2): Block 2 scrape — every read conditional on its hook
  // (absent DOM → null/undefined → the context line is omitted).
  const block2Section = document.querySelector('[data-guide="block2"]');
  let energyMetric: string | null = null;
  let energyCarrier: string | null = null;
  let energyConfidence: string | null = null;
  let householdSelection: ReportTourData['householdSelection'] = undefined;
  let measuredBasis = false;
  let solarNote: string | null = null;

  if (block2Section) {
    // metric textContent renders as "~€76/ mėn." + subtext — normalize
    // whitespace and keep only the price part (subtext is boilerplate).
    const metricRaw = block2Section
      .querySelector('[data-block2="metric"]')?.textContent ?? '';
    const metricMatch = metricRaw.replace(/\s+/g, '').match(/~€[\d.,]+\/mėn\./);
    energyMetric = metricMatch ? metricMatch[0] : null;

    // primary carrier = the first breakdown row's label, scraped faithfully
    energyCarrier = block2Section
      .querySelector('[data-block2="breakdown"] tbody tr td')
      ?.textContent?.trim() ?? null;

    // confidence sentence (strip the leading ℹ️ marker)
    energyConfidence = block2Section
      .querySelector('[data-block2="confidence"]')
      ?.textContent?.replace(/^\s*ℹ️\s*/, '').trim() || null;

    // family-modelling state: selector present → report selection or its
    // absence; selected → the personalised total from the breakdown total row
    const selector = block2Section.querySelector('[data-block2="household-selector"]');
    if (selector) {
      const active = selector.querySelector('button[aria-pressed="true"]');
      if (active) {
        const rows = block2Section.querySelectorAll('[data-block2="breakdown"] tbody tr');
        const totalRow = rows[rows.length - 1];
        // row shape: label | €/yr | €/mo | source-indicator (empty on the
        // total row) — the personalised monthly total is the THIRD cell
        const totalMonth = totalRow?.querySelector('td:nth-child(3)')
          ?.textContent?.trim() || null;
        householdSelection = {
          size: active.textContent?.trim() ?? '',
          totalMonth,
        };
      } else {
        householdSelection = null;
      }
    }

    // measured basis: the B2-16 bill note's presence is the flag (the note
    // text itself is tariff jargon — the flag line suffices)
    measuredBasis = !!block2Section.querySelector('[data-block2="bill-note"]');

    // solar note: the B2-17 served note, verbatim
    solarNote = block2Section
      .querySelector('[data-block2="solar-note"]')?.textContent?.trim() ?? null;
  }

  return {
    address,
    buildingType: buildingType || 'Pastatas',
    yearBuilt,
    energyClass,
    winterLevel,
    summerLevel,
    hasPermits,
    permitCount: permitItems.length,
    isLandOnly,
    block8Intro,
    block8ViewingQuestions,
    block8NegotiationAngles,
    energyMetric,
    energyCarrier,
    energyConfidence,
    householdSelection,
    measuredBasis,
    solarNote,
  };
}

export function buildReportTour(data: ReportTourData): TourStep[] {
  const steps: TourStep[] = [
    {
      id: 'street-view',
      selector: '[data-guide="street-view"], [data-guide="property-identity"]',
      narration: `Čia matote jūsų pastato gatvės vaizdą — ${data.address}. Galite atidaryti ir apžiūrėti interaktyvioje Google aplinkoje.`,
    },
    {
      id: 'property-profile',
      selector: '[data-guide="property-profile"]',
      narration: data.yearBuilt && data.energyClass
        ? `Pastato pagrindiniai duomenys: ${data.buildingType}, pastatytas ${data.yearBuilt} m., energinė klasė — ${data.energyClass}. Visa tai gauta iš oficialių registrų.`
        : `Pastato pagrindiniai duomenys: ${data.address}. Visa tai gauta iš oficialių registrų.`,
    },
    {
      id: 'property-map',
      selector: '[data-guide="property-identity"], [data-guide="property-map"]',
      narration: `Objekto identifikavimas — adresas, NTR numeris, savivaldybė — ir vieta žemėlapyje. Paspaudę „Padidinti" atsidarys pilno ekrano žemėlapis.`,
    },
    {
      id: 'climate-assessment',
      selector: '[data-guide="climate-assessment"]',
      narration: `Vidaus patalpų klimato vertinimas. Žiemos komfortas — ${COMFORT_LABELS[data.winterLevel] ?? data.winterLevel}, vasaros perkaitimo rizika — ${SUMMER_LABELS[data.summerLevel] ?? data.summerLevel}. Žemiau pamatysite, ką tai reiškia praktiškai.`,
      skipIf: () => data.isLandOnly,
    },
    {
      id: 'drivers',
      selector: '[data-guide="drivers"]',
      narration: 'Čia — pagrindiniai veiksniai, kurie lemia vertinimą. Kiekvienas veiksnys parodo, kaip konkreti savybė veikia jūsų pastato komfortą.',
      skipIf: () => data.isLandOnly,
    },
    {
      id: 'block8',
      selector: '[data-guide="block8"]',
      narration: data.block8Intro
        ? `8 blokas — rekomendacijos. ${data.block8Intro.split('—')[0].trim()}. Žemiau rasite konkrečius klausimus apžiūrai ir derybų kampus.`
        : 'Čia 8 blokas — rekomendacijos ir sprendimai. Konkretūs patarimai, ką patikrinti apžiūros metu ir kokius derybų kampus naudoti.',
      skipIf: () => !document.querySelector('[data-guide="block8"]'),
    },
    {
      id: 'permits',
      selector: '[data-guide="permits"]',
      narration: 'Čia matote statybos leidimus ir dokumentus, rastus Infostatyba sistemoje šiuo adresu. Tai gali reikšti renovaciją, priestatą ar kitą statybos darbą.',
      // Skip only if the permits wrapper has no visible content (ConstructionPermits returned null)
      skipIf: () => {
        const el = document.querySelector('[data-guide="permits"]');
        return !el || el.children.length === 0 || el.textContent?.trim() === '';
      },
    },
    {
      id: 'public-documents',
      selector: '[data-guide="public-documents"]',
      narration: 'Čia rasite viešai prieinamus šaltinius — kadastro žemėlapį, statybos leidimus ir teritorijų planavimo dokumentus. Viskas atvira ir prieinama be registracijos.',
    },
    {
      id: 'owner-documents',
      selector: '[data-guide="owner-documents"]',
      narration: 'O šie dokumentai prieinami tik savininko arba įgalioto asmens prieiga per Registrų centro savitarną — kadastro byla, aukštų planai, išsamūs registro duomenys.',
    },
  ];

  return steps;
}
