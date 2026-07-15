/**
 * B2-16 Commit 3: the rebuilt energy-input card (Screen 1) + the Screen-2
 * confirm-flow members (warnings / rejected / questions / preflight).
 *
 * These are the first tests that MOUNT QuickScanFlow (nothing existing
 * renders it). Screen-1 card interactions touch no network; the Screen-2
 * scenarios drive the NTR resolve path with a stubbed fetch so the
 * assertions cross the component ↔ payload boundary, not a mock of it.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import QuickScanFlow from '../QuickScanFlow';
import {
  EUR_UNSUPPORTED_NOTE_LT,
  HP_WHOLE_BILL_NOTE_LT,
} from '../../utils/userEnergyInput';

function renderScreen1() {
  const utils = render(<QuickScanFlow />);
  // The energy card renders for existing_object only.
  fireEvent.click(screen.getByText('Esamą pastatą ar patalpas'));
  return utils;
}

function numberField(): HTMLInputElement {
  return screen.getByLabelText('Energijos sąnaudų suma') as HTMLInputElement;
}

describe('energy card — unit router (Screen 1, no network)', () => {
  it('keeps the number field locked until a unit is actively chosen', () => {
    renderScreen1();
    expect(numberField().disabled).toBe(true);
    fireEvent.click(screen.getByText('€'));
    expect(numberField().disabled).toBe(false);
  });

  it('shows period + month + scope controls for €, hides them for kWh/m²', () => {
    renderScreen1();
    fireEvent.click(screen.getByText('€'));
    expect(screen.getByText('per mėnesį')).toBeInTheDocument();
    expect(screen.getByLabelText('Kurio mėnesio sąskaita?')).toBeInTheDocument();
    expect(screen.getByText('Ką apima ši suma?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('kWh/m²'));
    expect(screen.queryByText('per mėnesį')).not.toBeInTheDocument();
    expect(screen.queryByText('Ką apima ši suma?')).not.toBeInTheDocument();
  });

  it('echo-back updates as units and months change', () => {
    renderScreen1();
    fireEvent.click(screen.getByText('kWh/m²'));
    fireEvent.change(numberField(), { target: { value: '145' } });
    expect(screen.getByText(/Suprasime tai kaip ~145 kWh\/m² per metus/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('€'));
    fireEvent.change(numberField(), { target: { value: '112' } });
    fireEvent.click(screen.getByText('Tik šildymą'));
    const monthSelect = screen.getByLabelText('Kurio mėnesio sąskaita?');
    fireEvent.change(monthSelect, { target: { value: '1' } });
    expect(screen.getByText(/Sausio sąskaita: metinę sumą apskaičiuosime pagal šio pastato sezoninį šildymo profilį/)).toBeInTheDocument();

    fireEvent.change(monthSelect, { target: { value: 'average' } });
    expect(screen.getByText(/Suprasime tai kaip ~1344 € per metus \(tik šildymas\)/)).toBeInTheDocument();
  });

  it('names the missing pieces while the entry is incomplete', () => {
    renderScreen1();
    fireEvent.click(screen.getByText('€'));
    fireEvent.change(numberField(), { target: { value: '65' } });
    expect(screen.getByText('Kad įvestį panaudotume, pasirinkite mėnesį ir nurodykite, ką suma apima.')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Tik šildymą'));
    expect(screen.getByText('Kad įvestį panaudotume, pasirinkite mėnesį.')).toBeInTheDocument();
  });

  it('shows the amber hint on an implausible kWh/m² value', () => {
    renderScreen1();
    fireEvent.click(screen.getByText('kWh/m²'));
    fireEvent.change(numberField(), { target: { value: '2000' } });
    expect(screen.getByText('Neįprasta reikšmė — patikrinkite.')).toBeInTheDocument();
    fireEvent.change(numberField(), { target: { value: '145' } });
    expect(screen.queryByText('Neįprasta reikšmė — patikrinkite.')).not.toBeInTheDocument();
  });
});

// ─── Screen 2: confirm-flow members (stubbed fetch, NTR resolve path) ───────

const NTR = '1234-5678-9012:0001';

function makeCandidate(extra: Record<string, unknown> = {}) {
  return {
    candidate_id: 'cand-1',
    address: 'Kaunas, Taikos pr. 1-1',
    ntr_unique_number: NTR,
    municipality: 'Kauno m. sav.',
    kind: 'unit_in_building',
    confidence: 'high',
    bundle_items: [],
    primary_object: {},
    bundle_confidence: 'high',
    ...extra,
  };
}

const QUOTE = {
  quote_id: 'q-1', total_eur: 39, base_price_eur: 39, currency: 'EUR',
  line_items: [], discount_applied: false, special_discount_applied: false,
  ui_explanation_block: [], expires_at: '2099-01-01T00:00:00Z',
  has_active_discount: false, discount_context: null,
};

type FetchPlan = {
  candidate?: Record<string, unknown>;
  confirmData?: Record<string, unknown>;
  confirmError?: { status: number; error_code: string; message: string };
  onConfirmBody?: (body: Record<string, unknown>) => void;
};

function stubFetch(plan: FetchPlan) {
  const confirmBodies: Record<string, unknown>[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const u = String(url);
    if (u.includes('/resolve')) {
      return new Response(JSON.stringify({
        ok: true,
        data: { status: 'resolved', candidates: [plan.candidate ?? makeCandidate()] },
      }));
    }
    if (u.includes('/confirm')) {
      const body = JSON.parse(String(init?.body ?? '{}'));
      confirmBodies.push(body);
      plan.onConfirmBody?.(body);
      if (plan.confirmError) {
        return new Response(JSON.stringify({
          ok: false,
          error_code: plan.confirmError.error_code,
          message: plan.confirmError.message,
        }), { status: plan.confirmError.status });
      }
      return new Response(JSON.stringify({
        ok: true,
        data: {
          bundle_signature: 'sig', bundle_id: 'b-1', bundle_size: 1,
          has_new_build_project: false, confirmed_bundle_id: 'cb-1',
          warnings: [], rejected: [], questions: [],
          ...plan.confirmData,
        },
      }));
    }
    if (u.includes('/quote')) {
      return new Response(JSON.stringify({ ok: true, data: QUOTE }));
    }
    return new Response(JSON.stringify({ ok: true, data: {} }));
  }));
  return confirmBodies;
}

async function driveToScreen2(fillEnergy?: () => void) {
  render(<QuickScanFlow />);
  fireEvent.click(screen.getByText('Esamą pastatą ar patalpas'));
  fillEnergy?.();
  fireEvent.click(screen.getByText('Unikalus Nr.'));
  fireEvent.change(
    screen.getByPlaceholderText(/1234-5678-9012/),
    { target: { value: NTR } },
  );
  fireEvent.click(screen.getByText('Tęsti'));
  await waitFor(
    () => expect(screen.getByText('Patvirtinkite objektą')).toBeInTheDocument(),
    { timeout: 4000 },
  );
}

function fillJulyEurHeating() {
  fireEvent.click(screen.getByText('€'));
  fireEvent.change(numberField(), { target: { value: '30' } });
  fireEvent.change(screen.getByLabelText('Kurio mėnesio sąskaita?'), { target: { value: '7' } });
  fireEvent.click(screen.getByText('Tik šildymą'));
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe('Screen 2 — confirm-response members', () => {
  it('renders the summer decline from `rejected` with the named framing (bill omitted, confirm succeeded)', async () => {
    stubFetch({
      confirmData: {
        rejected: [{
          field: 'bill_value', reason_code: 'bill_month_uninformative',
          message_lt: 'Vasaros mėnesio šildymo sąskaita metinių šildymo sąnaudų neparodo — įveskite metinę sumą arba šildymo sezono mėnesio sąskaitą.',
        }],
      },
    });
    await driveToScreen2(fillJulyEurHeating);
    fireEvent.click(screen.getByText('Taip, teisingas'));
    await waitFor(() => {
      expect(screen.getByText('Sąskaita nebus naudojama')).toBeInTheDocument();
      expect(screen.getByText(/Vasaros mėnesio šildymo sąskaita metinių šildymo sąnaudų neparodo/)).toBeInTheDocument();
    });
  });

  it('sends the exact shipped average-case fragment on confirm', async () => {
    const bodies = stubFetch({});
    await driveToScreen2(() => {
      fireEvent.click(screen.getByText('€'));
      fireEvent.change(numberField(), { target: { value: '65' } });
      fireEvent.change(screen.getByLabelText('Kurio mėnesio sąskaita?'), { target: { value: 'average' } });
      fireEvent.click(screen.getByText('Tik šildymą'));
    });
    fireEvent.click(screen.getByText('Taip, teisingas'));
    await waitFor(() => expect(bodies.length).toBe(1));
    expect(bodies[0].bill_period).toBe('month_average');
    expect(bodies[0].bill_month).toBeUndefined();
    expect(bodies[0].bill_value).toBe(65);
    // R2: the dropped legacy fields are gone from the payload.
    expect(bodies[0]).not.toHaveProperty('user_energy_class');
    expect(bodies[0]).not.toHaveProperty('user_epc_issue_year');
  });

  it('HP prompt: „Tik šilumos siurblio" re-confirms with the answer PAIRED with the bill fields (rider 3)', async () => {
    const bodies = stubFetch({
      confirmData: {
        questions: [{
          code: 'hp_meter_scope', field: 'bill_value',
          message_lt: 'Ši suma panaši į viso namų ūkio elektros sąskaitą. Ar tai tik šilumos siurblio apskaita, ar visa sąskaita?',
          options: [
            { value: 'pump_only', label_lt: 'Tik šilumos siurblio' },
            { value: 'whole_bill', label_lt: 'Visa sąskaita' },
          ],
        }],
      },
    });
    await driveToScreen2(() => {
      fireEvent.click(screen.getByText('kWh'));
      fireEvent.change(numberField(), { target: { value: '6000' } });
      fireEvent.click(screen.getByText('per metus'));
      fireEvent.click(screen.getByText('Tik šildymą'));
    });
    fireEvent.click(screen.getByText('Taip, teisingas'));
    await waitFor(() => expect(screen.getByText('Tik šilumos siurblio')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Tik šilumos siurblio'));
    await waitFor(() => expect(bodies.length).toBe(2));
    expect(bodies[1].bill_hp_meter_scope).toBe('pump_only');
    expect(bodies[1].bill_value).toBe(6000);
    expect(bodies[1].bill_unit).toBe('kwh');
  });

  it('HP prompt: „Visa sąskaita" drops the bill (never sent as whole_bill) and shows the pump-meter note', async () => {
    const bodies = stubFetch({
      confirmData: {
        questions: [{
          code: 'hp_meter_scope', field: 'bill_value',
          message_lt: 'Ši suma panaši į viso namų ūkio elektros sąskaitą. Ar tai tik šilumos siurblio apskaita, ar visa sąskaita?',
          options: [
            { value: 'pump_only', label_lt: 'Tik šilumos siurblio' },
            { value: 'whole_bill', label_lt: 'Visa sąskaita' },
          ],
        }],
      },
    });
    await driveToScreen2(() => {
      fireEvent.click(screen.getByText('kWh'));
      fireEvent.change(numberField(), { target: { value: '6000' } });
      fireEvent.click(screen.getByText('per metus'));
      fireEvent.click(screen.getByText('Tik šildymą'));
    });
    fireEvent.click(screen.getByText('Taip, teisingas'));
    await waitFor(() => expect(screen.getByText('Visa sąskaita')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Visa sąskaita'));
    await waitFor(() => expect(bodies.length).toBe(2));
    expect(bodies[1]).not.toHaveProperty('bill_hp_meter_scope');
    expect(bodies[1]).not.toHaveProperty('bill_value');
    expect(screen.getByText(HP_WHOLE_BILL_NOTE_LT)).toBeInTheDocument();
  });

  it('€ on an inferred-carrier property blocks confirm with the R6 note + removal affordance', async () => {
    stubFetch({ candidate: makeCandidate({ bill_eur_supported: false }) });
    await driveToScreen2(() => {
      fireEvent.click(screen.getByText('€'));
      fireEvent.change(numberField(), { target: { value: '65' } });
      fireEvent.click(screen.getByText('per metus'));
      fireEvent.click(screen.getByText('Tik šildymą'));
    });
    expect(screen.getByText(EUR_UNSUPPORTED_NOTE_LT)).toBeInTheDocument();
    expect((screen.getByText('Taip, teisingas').closest('button') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByText('Pašalinti įvestį'));
    expect(screen.queryByText(EUR_UNSUPPORTED_NOTE_LT)).not.toBeInTheDocument();
    expect((screen.getByText('Taip, teisingas').closest('button') as HTMLButtonElement).disabled).toBe(false);
  });

  it('surfaces a bill-family 400 with its server copy and keeps the user on the proof card', async () => {
    stubFetch({
      confirmError: {
        status: 400, error_code: 'bill_eur_requires_resolved_carrier',
        message: EUR_UNSUPPORTED_NOTE_LT,
      },
    });
    await driveToScreen2(() => {
      fireEvent.click(screen.getByText('€'));
      fireEvent.change(numberField(), { target: { value: '65' } });
      fireEvent.click(screen.getByText('per metus'));
      fireEvent.click(screen.getByText('Tik šildymą'));
    });
    fireEvent.click(screen.getByText('Taip, teisingas'));
    await waitFor(() => expect(screen.getByText(EUR_UNSUPPORTED_NOTE_LT)).toBeInTheDocument());
    expect(screen.getByText('Taip, teisingas')).toBeInTheDocument(); // still on the proof card
  });
});
