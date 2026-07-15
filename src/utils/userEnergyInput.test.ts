/**
 * B2-16 Commit 3: payload mapping + echo-back + hints + preflight.
 *
 * The average-case payload asserts the SHIPPED backend literals
 * (bill_period: "month_average", no bill_month) — the backend contract
 * test (bustodnr tests/test_user_energy_inputs_leg.py::
 * test_month_average_fragment_round_trips_real_endpoint) round-trips
 * this exact fragment through the real /confirm; together the two ends
 * pin the same schema.
 */
import { describe, expect, it } from 'vitest';

import {
  buildUserEnergyPayload,
  echoBackLt,
  EUR_UNSUPPORTED_NOTE_LT,
  getEnergyPreflight,
  HP_COMBINED_NOTE_LT,
  HP_STEER_NOTE_LT,
  isInputComplete,
  kwhm2HintLt,
  missingPartsNoteLt,
} from './userEnergyInput';

describe('buildUserEnergyPayload', () => {
  it('maps kWh/m² to the intensity channel only', () => {
    expect(buildUserEnergyPayload({ unit: 'kwhm2', value: 145 })).toEqual({
      user_epc_kwhm2_year: 145,
    });
  });

  it('maps an annual € bill', () => {
    expect(buildUserEnergyPayload({
      unit: 'eur', value: 650, period: 'year', scope: 'heating',
    })).toEqual({
      bill_unit: 'eur', bill_value: 650,
      bill_period: 'year', bill_scope: 'heating',
    });
  });

  it('maps a named-month kWh bill with an integer month', () => {
    expect(buildUserEnergyPayload({
      unit: 'kwh', value: 900, period: 'month', month: 1,
      scope: 'heating_dhw',
    })).toEqual({
      bill_unit: 'kwh', bill_value: 900, bill_period: 'month',
      bill_month: 1, bill_scope: 'heating_dhw',
    });
  });

  it('flattens „Mėnesio vidurkis" into the month_average PERIOD (shipped schema — never month:"average")', () => {
    const fragment = buildUserEnergyPayload({
      unit: 'eur', value: 65, period: 'month', month: 'average',
      scope: 'heating',
    });
    expect(fragment).toEqual({
      bill_unit: 'eur', bill_value: 65,
      bill_period: 'month_average', bill_scope: 'heating',
    });
    expect(fragment).not.toHaveProperty('bill_month');
  });

  it('pairs the pump_only answer WITH the bill fields in one fragment (rider 3)', () => {
    expect(buildUserEnergyPayload({
      unit: 'kwh', value: 6000, period: 'year', scope: 'heating',
      hp_meter_scope: 'pump_only',
    })).toEqual({
      bill_unit: 'kwh', bill_value: 6000, bill_period: 'year',
      bill_scope: 'heating', bill_hp_meter_scope: 'pump_only',
    });
  });

  it('sends NOTHING for an empty or incomplete entry (never a half entry)', () => {
    expect(buildUserEnergyPayload(null)).toEqual({});
    expect(buildUserEnergyPayload({ unit: 'eur' })).toEqual({});
    // value entered, scope missing → incomplete, nothing sent
    expect(buildUserEnergyPayload({
      unit: 'eur', value: 65, period: 'year',
    })).toEqual({});
    // named-month view without an active month choice
    expect(buildUserEnergyPayload({
      unit: 'kwh', value: 900, period: 'month', scope: 'heating',
    })).toEqual({});
  });
});

describe('completeness + card note', () => {
  it('flags the missing pieces by name', () => {
    expect(missingPartsNoteLt({ unit: 'eur', value: 65, period: 'month' }))
      .toBe('Kad įvestį panaudotume, pasirinkite mėnesį ir nurodykite, ką suma apima.');
    expect(missingPartsNoteLt({
      unit: 'eur', value: 65, period: 'year',
    })).toBe('Kad įvestį panaudotume, nurodykite, ką suma apima.');
    expect(missingPartsNoteLt({
      unit: 'eur', value: 65, period: 'year', scope: 'heating',
    })).toBeNull();
    expect(missingPartsNoteLt({ unit: 'kwhm2', value: 145 })).toBeNull();
    expect(missingPartsNoteLt(null)).toBeNull();
  });

  it('an empty card is trivially complete (optional field)', () => {
    expect(isInputComplete(null)).toBe(true);
    expect(isInputComplete({ unit: 'eur' })).toBe(true);
    expect(isInputComplete({ unit: 'eur', value: 65 })).toBe(false);
  });
});

describe('echoBackLt (R1/P2)', () => {
  it('kWh/m² echoes the intensity interpretation', () => {
    expect(echoBackLt({ unit: 'kwhm2', value: 145 })).toBe(
      'Suprasime tai kaip ~145 kWh/m² per metus — patikslins ir komforto, ir kainos vertinimą.',
    );
  });

  it('annual entries echo value + scope', () => {
    expect(echoBackLt({
      unit: 'eur', value: 650, period: 'year', scope: 'heating',
    })).toBe('Suprasime tai kaip 650 € per metus (tik šildymas).');
    expect(echoBackLt({
      unit: 'kwh', value: 9000, period: 'year', scope: 'heating_dhw',
    })).toBe('Suprasime tai kaip 9000 kWh per metus (šildymas ir karštas vanduo).');
  });

  it('a named month states the MECHANISM, not a client-faked number (P2)', () => {
    const echo = echoBackLt({
      unit: 'eur', value: 112, period: 'month', month: 1, scope: 'heating',
    });
    expect(echo).toBe(
      'Sausio sąskaita: metinę sumą apskaičiuosime pagal šio pastato sezoninį šildymo profilį.',
    );
    expect(echo).not.toMatch(/\d{3,}/); // no annualized figure faked client-side
  });

  it('the monthly average echoes the honest ×12', () => {
    expect(echoBackLt({
      unit: 'eur', value: 65, period: 'month', month: 'average',
      scope: 'heating',
    })).toBe('Suprasime tai kaip ~780 € per metus (tik šildymas).');
  });

  it('stays silent while incomplete', () => {
    expect(echoBackLt(null)).toBeNull();
    expect(echoBackLt({ unit: 'eur', value: 65, period: 'month' })).toBeNull();
  });
});

describe('kwhm2HintLt (display-logic bounds 10–1000)', () => {
  it('hints outside the bounds, silent inside, kwhm2 only', () => {
    expect(kwhm2HintLt({ unit: 'kwhm2', value: 2000 })).toBe('Neįprasta reikšmė — patikrinkite.');
    expect(kwhm2HintLt({ unit: 'kwhm2', value: 5 })).toBe('Neįprasta reikšmė — patikrinkite.');
    expect(kwhm2HintLt({ unit: 'kwhm2', value: 145 })).toBeNull();
    expect(kwhm2HintLt({ unit: 'eur', value: 99999 })).toBeNull();
  });
});

describe('getEnergyPreflight (Screen 2 — flags exist only after /resolve)', () => {
  it('blocks a € entry on an inferred-carrier property (R6)', () => {
    const p = getEnergyPreflight({ bill_eur_supported: false }, {
      unit: 'eur', value: 65, period: 'year', scope: 'heating',
    });
    expect(p.blocking).toBe(EUR_UNSUPPORTED_NOTE_LT);
  });

  it('blocks combined scope on an HP property', () => {
    const p = getEnergyPreflight({ bill_hp_metered: true }, {
      unit: 'kwh', value: 9000, period: 'year', scope: 'heating_dhw',
    });
    expect(p.blocking).toBe(HP_COMBINED_NOTE_LT);
  });

  it('steers HP heating entries to pump metering (non-blocking)', () => {
    const p = getEnergyPreflight({ bill_hp_metered: true }, {
      unit: 'kwh', value: 3000, period: 'year', scope: 'heating',
    });
    expect(p.blocking).toBeNull();
    expect(p.info).toBe(HP_STEER_NOTE_LT);
  });

  it('is silent with no entry, a kwhm2 entry, or a supported carrier', () => {
    expect(getEnergyPreflight({ bill_eur_supported: false }, null).blocking).toBeNull();
    expect(getEnergyPreflight({ bill_eur_supported: false }, {
      unit: 'kwhm2', value: 145,
    }).blocking).toBeNull();
    expect(getEnergyPreflight({ bill_eur_supported: true }, {
      unit: 'eur', value: 65, period: 'year', scope: 'heating',
    }).blocking).toBeNull();
  });
});
