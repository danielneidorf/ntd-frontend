// P7-B1: Landing page tour — 7 steps with hardcoded Lithuanian narrations
import type { TourStep } from '../types';

export const landingTour: TourStep[] = [
  {
    id: 'hero',
    selector: '[data-guide="hero"]',
    narration:
      'Sveiki! Aš jūsų NT Duomenų asistentas. Padėsiu suprasti, ką šis įrankis gali pasakyti apie jūsų būstą. Spauskite „Toliau" ir apžvelgsime kartu.',
    animation: 'pulse',
  },
  {
    id: 'situation-cards',
    selector: '[data-guide="situation-cards"]',
    narration:
      'Pirmiausia — kokia jūsų situacija? Perkate, nuomojate, renovuojate, ar tiesiog domitės? Pasirinkite, ir pradėsime.',
    animation: 'sequence',
  },
  {
    id: 'data-categories',
    selector: '[data-guide="data-categories"]',
    narration:
      'NTD analizuoja 5 sritis: šiluminį komfortą, triukšmą, energijos sąnaudas, teisines rizikas ir vietos kontekstą. Kiekviena sritis — atskiras ataskaitos blokas.',
    animation: 'sequence',
  },
  {
    id: 'how-it-works',
    selector: '[data-guide="how-it-works"]',
    narration:
      'Procesas paprastas: nurodote objektą, apmokate, ir gaunate ataskaitą el. paštu. Viskas užtrunka kelias minutes.',
    animation: 'pulse',
  },
  {
    id: 'sources',
    selector: '[data-guide="sources"]',
    narration:
      'Duomenys gaunami iš oficialių Lietuvos registrų — Nekilnojamojo turto registro, Kadastro, PENS ir kitų šaltinių. Jokių spėliojimų.',
    animation: 'pulse',
  },
  {
    id: 'pricing',
    selector: '[data-guide="pricing"]',
    narration:
      'Viena ataskaita kainuoja 39 €. Tai vienkartinis mokėjimas — jokių prenumeratų ar paslėptų mokesčių.',
    animation: 'ring',
  },
  {
    id: 'cta',
    selector: '[data-guide="situation-cards"]',
    narration:
      'Pasiruošę? Pasirinkite savo situaciją viršuje ir pradėkime! Arba galite uždaryti gidą ir naršyti savarankiškai.',
    animation: 'pulse',
  },
];
