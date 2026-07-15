/**
 * B2-16 Commit 3: the user energy-input card's pure logic — payload
 * mapping, echo-back copy, client hints, Screen-2 preflight.
 *
 * The card routes one number by declared source (R1): kWh/m² → the
 * intensity channel (user_epc_kwhm2_year), €/kWh totals → the Channel-2
 * bill (bill_* fields). The WIRE schema is the backend's shipped
 * ConfirmRequest (verified against f217cc6): bill_period ∈
 * "year" | "month" | "month_average", bill_month 1..12 integer only —
 * the UI's „Mėnesio vidurkis" month option flattens into the
 * month_average PERIOD here (the gate sketch's month:"average" shape is
 * REJECTED by the backend validator; contract test pins both ends).
 */

export type EnergyUnit = 'eur' | 'kwh' | 'kwhm2';
export type BillScope = 'heating' | 'heating_dhw';

export interface UserEnergyInput {
  unit: EnergyUnit;
  value?: number;
  /** UI period toggle (€/kWh only). 'month' shows the month selector. */
  period?: 'month' | 'year';
  /** 1..12, or 'average' — the 13th selector option (P1). */
  month?: number | 'average';
  scope?: BillScope;
  /** HP α: the customer's answer to the meter-scope prompt. */
  hp_meter_scope?: 'pump_only';
}

/** Display-logic constants (judgment labelled as judgment — execution
 * record): the client-side kWh/m² rough hint bounds. The authoritative
 * bands are server-side (D12 hard 2–2300, soft per usage group); this
 * hint only resurrects the shipped dead-card heuristic. */
export const KWHM2_HINT_MIN = 10;
export const KWHM2_HINT_MAX = 1000;

const MONTH_GENITIVE_LT = [
  'Sausio', 'Vasario', 'Kovo', 'Balandžio', 'Gegužės', 'Birželio',
  'Liepos', 'Rugpjūčio', 'Rugsėjo', 'Spalio', 'Lapkričio', 'Gruodžio',
] as const;

export function monthGenitiveLt(month: number): string {
  return MONTH_GENITIVE_LT[month - 1] ?? '';
}

const SCOPE_LABEL_LT: Record<BillScope, string> = {
  heating: 'tik šildymas',
  heating_dhw: 'šildymas ir karštas vanduo',
};

/** True when the entry is complete enough to send (and to echo back).
 * An empty card (no value) is trivially "complete" — nothing is sent. */
export function isInputComplete(input: UserEnergyInput | null): boolean {
  if (!input || input.value === undefined || input.value <= 0) return true;
  if (input.unit === 'kwhm2') return true;
  if (!input.scope) return false;
  if (input.period === 'year') return true;
  return input.month !== undefined; // month view needs an active choice
}

/** What still needs choosing before the entry can be used (card note). */
export function missingPartsNoteLt(input: UserEnergyInput | null): string | null {
  if (!input || input.value === undefined || input.value <= 0) return null;
  if (input.unit === 'kwhm2') return null;
  const parts: string[] = [];
  if (input.period !== 'year' && input.month === undefined) {
    parts.push('pasirinkite mėnesį');
  }
  if (!input.scope) parts.push('nurodykite, ką suma apima');
  if (!parts.length) return null;
  return `Kad įvestį panaudotume, ${parts.join(' ir ')}.`;
}

/** The /confirm payload fragment. Returns {} when nothing complete is
 * entered (the optional card sends nothing — never a half entry). */
export function buildUserEnergyPayload(
  input: UserEnergyInput | null,
): Record<string, unknown> {
  if (!input || input.value === undefined || input.value <= 0) return {};
  if (!isInputComplete(input)) return {};
  if (input.unit === 'kwhm2') {
    return { user_epc_kwhm2_year: input.value };
  }
  const fragment: Record<string, unknown> = {
    bill_unit: input.unit,
    bill_value: input.value,
    bill_scope: input.scope,
  };
  if (input.period === 'year') {
    fragment.bill_period = 'year';
  } else if (input.month === 'average') {
    fragment.bill_period = 'month_average'; // shipped literal — no month
  } else {
    fragment.bill_period = 'month';
    fragment.bill_month = input.month;
  }
  if (input.hp_meter_scope) {
    fragment.bill_hp_meter_scope = input.hp_meter_scope;
  }
  return fragment;
}

/** R1/P2 echo-back: the interpretation is always stated; a named month
 * states the MECHANISM (the engine's seasonal profile governs), never a
 * client-approximated number. Null while the entry is incomplete. */
export function echoBackLt(input: UserEnergyInput | null): string | null {
  if (!input || input.value === undefined || input.value <= 0) return null;
  if (input.unit === 'kwhm2') {
    return `Suprasime tai kaip ~${input.value} kWh/m² per metus — patikslins ir komforto, ir kainos vertinimą.`;
  }
  if (!isInputComplete(input) || !input.scope) return null;
  const unitLabel = input.unit === 'eur' ? '€' : 'kWh';
  const scopeLabel = SCOPE_LABEL_LT[input.scope];
  if (input.period === 'year') {
    return `Suprasime tai kaip ${input.value} ${unitLabel} per metus (${scopeLabel}).`;
  }
  if (input.month === 'average') {
    return `Suprasime tai kaip ~${Math.round(input.value * 12)} ${unitLabel} per metus (${scopeLabel}).`;
  }
  return `${monthGenitiveLt(input.month as number)} sąskaita: metinę sumą apskaičiuosime pagal šio pastato sezoninį šildymo profilį.`;
}

/** Client rough hint (kWh/m² only — €/kWh checks are server-owned). */
export function kwhm2HintLt(input: UserEnergyInput | null): string | null {
  if (!input || input.unit !== 'kwhm2' || input.value === undefined) return null;
  if (input.value >= KWHM2_HINT_MIN && input.value <= KWHM2_HINT_MAX) return null;
  return 'Neįprasta reikšmė — patikrinkite.';
}

// ── Screen-2 preflight (the €-gate/HP flags exist only after /resolve) ──

export interface EnergyPreflight {
  /** Blocks confirm until the entry is fixed or removed. */
  blocking: string | null;
  /** Non-blocking steer (HP → pump metering). */
  info: string | null;
}

/** R6 note — mirrors the backend's bill_eur_requires_resolved_carrier copy. */
export const EUR_UNSUPPORTED_NOTE_LT =
  '€ įvestis šiam pastatui negalima — šildymo būdas nustatytas netiesiogiai, '
  + 'todėl patikimo tarifo sumai perskaičiuoti neturime. Galite įvesti kWh.';

/** Mirrors the backend's bill_scope_unsupported_for_hp copy. */
export const HP_COMBINED_NOTE_LT =
  'Šilumos siurbliui nurodykite tik šildymo (siurblio skaitiklio) sumą — '
  + 'suma su karštu vandeniu šiam šildymo tipui nepalaikoma.';

/** Mirrors the backend's bill_whole_house_unsupported decline copy —
 * shown when the customer answers „Visa sąskaita" (the FE then drops the
 * bill and re-confirms; whole_bill is never sent — the 400 is the
 * rogue-payload backstop). */
export const HP_WHOLE_BILL_NOTE_LT =
  'Visos namų sąskaitos vertinimui panaudoti negalime — joje yra ir '
  + 'buitinė elektra. Jei šilumos siurblys turi atskirą skaitiklį, '
  + 'nurodykite jo rodmenis; kitu atveju šį lauką praleiskite.';

/** HP steer (non-blocking; arrives at Screen 2 — known v1 limitation:
 * the guidance follows the entry rather than preceding it). */
export const HP_STEER_NOTE_LT =
  'Šilumos siurblio atveju tiksliausia — paties siurblio skaitiklio '
  + 'rodmenys (kWh).';

export function getEnergyPreflight(
  candidate: { bill_eur_supported?: boolean; bill_hp_metered?: boolean },
  input: UserEnergyInput | null,
): EnergyPreflight {
  const result: EnergyPreflight = { blocking: null, info: null };
  if (!input || input.value === undefined || input.value <= 0) return result;
  if (input.unit === 'kwhm2') return result;
  if (input.unit === 'eur' && candidate.bill_eur_supported === false) {
    result.blocking = EUR_UNSUPPORTED_NOTE_LT;
    return result;
  }
  if (candidate.bill_hp_metered === true) {
    if (input.scope === 'heating_dhw') {
      result.blocking = HP_COMBINED_NOTE_LT;
      return result;
    }
    result.info = HP_STEER_NOTE_LT;
  }
  return result;
}
