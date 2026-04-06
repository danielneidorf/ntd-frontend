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
    id: 'qs-sources',
    selector: '[data-guide="sources"]',
    narration:
      'Apačioje matote šaltinius, iš kurių renkame duomenis — Nekilnojamojo turto registras, Kadastras, Pastatų energinio naudingumo sertifikatų registras ir kiti oficialūs registrai.',
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
      'Sistema rado jūsų objektą. Patikrinkite — ar adresas, NTR numeris ir savivaldybė teisingi? Jei viskas gerai, spauskite „Taip, teisingas".',
  },
  {
    id: 'qs-report-blocks',
    selector: '[data-guide="qs-report-blocks"]',
    narration:
      'Čia matote, kokias dalis apims jūsų ataskaita — šiluminis komfortas, energija, triukšmas, teisinės rizikos ir dar kelios. Viskas vienoje ataskaitoje.',
  },
  {
    id: 'qs-payment',
    selector: '[data-guide="qs-payment"]',
    narration:
      'Patvirtinus objektą, čia matysite kainą ir galėsite užsakyti. El. paštas, sutikimas ir mokėjimo būdas — viskas vienoje vietoje.',
  },
  {
    id: 'qs-email-consent',
    selector: '[data-guide="qs-email-consent"]',
    narration:
      'Įveskite el. paštą, kuriuo gausite ataskaitą, ir sutikite su sąlygomis. Ataskaitą gausite iškart po apmokėjimo.',
  },
  {
    id: 'qs-pay-methods',
    selector: '[data-guide="qs-pay-methods"]',
    narration:
      'Pasirinkite mokėjimo būdą — banko pavedimas, kortelė, ar kitas būdas. Apmokėjus, ataskaita parengiama automatiškai.',
  },
];
