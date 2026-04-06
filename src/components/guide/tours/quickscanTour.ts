// P7-B2: QuickScan tour — Screen 1 (7 steps) + Screen 2 (5 steps)
// Flat array: the tour engine skips steps whose selector has no DOM match
import type { TourStep } from '../types';

export const quickscanTour: TourStep[] = [
  // ── Screen 1: Vieta (property identification) ──────────────

  {
    id: 'qs-case-cards',
    selector: '[data-guide="qs-case-cards"]',
    narration:
      'Pirmiausia nurodykite, ką tiksliai norite patikrinti — pasirinkite vieną iš variantų.',
    // Skip if case type was already pre-selected via URL (e.g. from landing page)
    skipIf: () => {
      const params = new URLSearchParams(window.location.search);
      return params.has('case');
    },
  },
  {
    id: 'qs-location',
    selector: '[data-guide="qs-location"]',
    narration:
      'Čia nurodykite objekto vietą, jums patogiausiu būdu. Unikalus numeris yra greičiausias-tiksliausias būdas.',
  },
  {
    id: 'qs-listing-url',
    selector: '[data-guide="qs-listing-url"]',
    narration:
      'Jei turite skelbimo nuorodą, pvz., iš aruodas.lt — įklijuokite čia. Tai padės patikslinti objekto duomenis. Jei neturite — tiesiog praleiskite.',
  },
  {
    id: 'qs-document',
    selector: '[data-guide="qs-document"]',
    narration:
      'Jei turite energinio naudingumo sertifikatą ar kitą dokumentą — galite jį įkelti čia. Tai suteiks papildomų duomenų ataskaitai.',
  },
  {
    id: 'qs-energy',
    selector: '[data-guide="qs-energy"]',
    narration:
      'Žinote faktines energijos sąnaudas iš sąskaitų? Įveskite čia — tai suteiks naujausių faktinių duomenų vidaus patalpų klimato vertinimui.',
  },
  {
    id: 'qs-submit',
    selector: '[data-guide="qs-submit"]',
    narration:
      'Kai viskas paruošta — spauskite „Tęsti". Sistema pradės ieškoti jūsų objekto registruose. Tai užtrunka kelias sekundes.',
  },

  // ── Screen 2: Patvirtinimas + mokėjimas ────────────────────

  {
    id: 'qs-proof',
    selector: '[data-guide="qs-proof"]',
    narration:
      'Sistema rado jūsų objektą. Patikrinkite — ar adresas, NTR numeris ir savivaldybė atrodo teisingi? Jei viskas gerai, spauskite „Taip, teisingas".',
  },
  {
    id: 'qs-report-blocks',
    selector: '[data-guide="qs-report-blocks"]',
    narration:
      'Čia matote, kokias dalis apims jūsų ataskaita.',
  },
  {
    id: 'qs-payment',
    selector: '[data-guide="qs-payment"]',
    narration:
      'Patvirtinus objektą, čia matysite kainą ir galėsite užsakyti. El. paštas, sutikimas ir mokėjimo būdas — viskas vienoje vietoje.',
    // Skip after object is confirmed — price and inputs are already visible
    skipIf: () => !!document.querySelector('[data-guide="qs-email-consent"] input'),
  },
  {
    id: 'qs-email-consent',
    selector: '[data-guide="qs-payment"]',
    narration:
      'Įveskite el. pašto adresą ataskaitos nuorodai gauti. Sutikite su privatumo sąlygomis. Pažymėkite atitinkamai, jeigu reikia sąskaitos, ir ar sąskaita turėtų būti išrašyta juridiniam asmeniui. Užpildykite atitinkamus laukus. Spauskite „Mokėti ir gauti ataskaitą".',
  },
  {
    id: 'qs-pay-methods',
    selector: '[data-guide="qs-pay-methods"]',
    narration:
      'Pasirinkite mokėjimo būdą — banko pavedimas, kortelė, ar kitas būdas. Apmokėjus, ataskaita parengiama automatiškai.',
    // This is the last guided step. Tour ends when:
    // - User clicks "Baigti ✓" in the narration bubble
    // - Payment starts (spinner appears → element becomes invalid → tour ends)
    // - Page navigates away (Paysera redirect)
    skipIf: () => {
      // Payment in progress (spinner) or payment error shown → tour is done
      const paying = !!document.querySelector('.animate-spin');
      const error = !!document.querySelector('[data-guide="qs-payment"]')?.textContent?.includes('Mokėjimo klaida');
      return paying || error;
    },
  },
];
