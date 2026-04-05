// P7-B1.3: Landing page tour — 6 steps, observational tone
import type { TourStep } from '../types';

export const landingTour: TourStep[] = [
  {
    id: 'hero',
    selector: '[data-guide="hero"]',
    narration:
      'Sveiki! Padėsiu apžvelgti svetainę. Čia matote pagrindinį puslapį — trumpai, NT Duomenys padeda sužinoti apie nekilnojamąjį turtą tai, ko skelbime nematysite. O dešinėje — dešimtys situacijų, kurioms ataskaita praverčia. Eime toliau?',
    animation: 'pulse',
  },
  {
    id: 'data-categories',
    selector: '[data-guide="data-categories"]',
    narration:
      'Ataskaitoje rasite šias dalis. Visa tai — vienoje vietoje, iš oficialių šaltinių. Dauguma šios informacijos kitur kainuoja šimtus eurų ir trunka savaites.',
    animation: 'sequence',
  },
  {
    id: 'how-it-works',
    selector: '[data-guide="how-it-works"]',
    narration:
      'Palyginkite: nepriklausomo vertintojo vizitas kainuoja 150–300\u00a0€, o čia gaunate panašų informacijos kiekį per mažiau nei valandą.',
    animation: 'pulse',
  },
  {
    id: 'property-types',
    selector: '[data-guide="property-types"]',
    narration:
      'Matote, kiek skirtingų objektų tipų galima patikrinti. Nesvarbu, koks turtas — kiekvienas vertinamas vienodai nuodugniai.',
    animation: 'pulse',
  },
  {
    id: 'pricing',
    selector: '[data-guide="pricing"]',
    narration:
      'Kaina — nuo 39\u00a0€, priklauso nuo objekto sudėtingumo. Vienkartinis mokėjimas, jokių prenumeratų ar paslėptų mokesčių.',
    animation: 'ring',
  },
  {
    id: 'cta',
    selector: '[data-guide="situation-cards"]',
    narration:
      'Procesas paprastas — trys žingsniai: nurodote adresą, apmokate, ir ataskaitą gaunate iškart. Pasirinkite savo situaciją ir pradėkime! O jei norite naršyti patys — tiesiog uždarykite gidą.',
    animation: 'pulse',
  },
];
