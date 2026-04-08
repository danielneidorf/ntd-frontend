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
    // Find all ComfortBar letter labels (A/B/C/D/E) — the active one has full opacity
    const allBars = climateSection.querySelectorAll('[style*="height: 34px"]');
    if (allBars.length >= 1) {
      const firstLabel = allBars[0]?.querySelector('.text-white.text-xs.font-semibold');
      if (firstLabel) winterLevel = firstLabel.textContent?.trim() ?? 'C';
    }
    if (allBars.length >= 2) {
      const secondLabel = allBars[1]?.querySelector('.text-white.text-xs.font-semibold');
      if (secondLabel) summerLevel = secondLabel.textContent?.trim() ?? 'C';
    }
  }

  // Permits
  const permitsSection = document.querySelector('[data-guide="permits"]');
  const permitItems = permitsSection?.querySelectorAll('[class*="border-l-2"]') ?? [];
  const hasPermits = permitItems.length > 0;

  // Land-only
  const isLandOnly = !document.querySelector('[data-guide="climate-assessment"]');

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
