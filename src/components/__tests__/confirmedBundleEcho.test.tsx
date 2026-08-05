/**
 * The browser echoes the frozen choice's identifier at payment.
 *
 * WHY THIS EXISTS (2026-08-05)
 * ============================
 * The backend has expected `confirmed_bundle_id` at /payment-intent since the
 * freeze-at-confirm rollout: it is what ties the payment to the property the
 * customer confirmed. The server reads that frozen row for two things — the
 * property's stable key, and the inputs the report is built from.
 *
 * The browser had never sent it. Not once: the identifier appeared in this
 * repo only inside a test's mocked *response*, never in a request. So every
 * card order was stored under the browser's own candidate id (a value that
 * changes with the day and the road, invisible to the duplicate check), and
 * the report task found nothing frozen to build from and gave up — a paid
 * customer with no report.
 *
 * A backend comment asserted the opposite ("the live FE always sends it"),
 * which is exactly the class of claim the house rule says to verify against
 * the artifact rather than believe.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QuickScanFlow from '../QuickScanFlow';

const NTR = '4400-1234-5678';
const CONFIRMED_BUNDLE_ID = 'cb-frozen-1';

const CANDIDATE = {
  candidate_id: 'cand-001',
  address_text: 'Vilnius, Žirmūnų g. 12',
  ntr_unique_number: NTR,
  municipality: 'Vilniaus m. sav.',
  kind: 'whole_building',
  coverage_level: 'HIGH',
  purpose: 'Gyvenamoji',
  heated_area_m2: 120,
  building_year_built: 1985,
  bundle_items: [],
};

const QUOTE = {
  quote_id: 'q-1',
  bundle_id: 'cand-001',
  base_price_eur: 39,
  final_price_eur: 39,
  discount_amount_eur: 0,
  pricing_label: 'Standartinis',
  pricing_version: 'pricing_v1',
  currency: 'EUR',
  ui_explanation_block: [],
  expires_at: '2099-12-31T23:59:59Z',
  has_active_discount: false,
  special_discount_applied: false,
  discount_context: null,
};

function stubFetch(paymentBodies: Record<string, unknown>[]) {
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const u = String(url);
    if (u.includes('/resolve')) {
      return new Response(JSON.stringify({
        ok: true, data: { status: 'resolved', candidates: [CANDIDATE] },
      }));
    }
    if (u.includes('/confirm')) {
      return new Response(JSON.stringify({
        ok: true,
        data: {
          bundle_signature: 'a'.repeat(64),
          bundle_id: 'cand-001',
          bundle_size: 1,
          has_new_build_project: false,
          confirmed_bundle_id: CONFIRMED_BUNDLE_ID,
          warnings: [], rejected: [], questions: [],
        },
      }));
    }
    if (u.includes('/quote')) {
      return new Response(JSON.stringify({ ok: true, data: QUOTE }));
    }
    if (u.includes('/payment-intent')) {
      paymentBodies.push(JSON.parse(String(init?.body ?? '{}')));
      return new Response(JSON.stringify({
        ok: true, data: { client_secret: 'pi_stub_secret', order_id: 'ord-1' },
      }));
    }
    return new Response(JSON.stringify({ ok: true, data: {} }));
  }));
}

async function payByCard() {
  render(<QuickScanFlow />);
  fireEvent.click(screen.getByText('Esamą pastatą ar patalpas'));
  fireEvent.click(screen.getByText('Unikalus Nr.'));
  fireEvent.change(screen.getByPlaceholderText(/1234-5678-9012/), { target: { value: NTR } });
  fireEvent.click(screen.getByText('Tęsti'));
  await waitFor(
    () => expect(screen.getByText('Patvirtinkite objektą')).toBeInTheDocument(),
    { timeout: 4000 },
  );
  fireEvent.click(screen.getByText('Taip, teisingas'));
  await waitFor(() => expect(screen.getByPlaceholderText('vardas@pastas.lt')).toBeInTheDocument());
  fireEvent.change(screen.getByPlaceholderText('vardas@pastas.lt'), {
    target: { value: 'pirkejas@ntd.lt' },
  });
  fireEvent.click(screen.getByRole('checkbox', { name: /Sutinku su/ }));
  await waitFor(() => expect(screen.getByText('Mokėti ir gauti ataskaitą')).toBeEnabled());
  fireEvent.click(screen.getByText('Mokėti ir gauti ataskaitą'));
  fireEvent.click(await screen.findByText('Visa / MC'));
  fireEvent.click(screen.getByText(/Patvirtinti mokėjimą/));
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe('the frozen choice reaches the payment', () => {
  it('★ sends the confirmed_bundle_id /confirm handed back', async () => {
    const bodies: Record<string, unknown>[] = [];
    stubFetch(bodies);

    await payByCard();

    await waitFor(() => expect(bodies.length).toBe(1));
    expect(bodies[0].confirmed_bundle_id).toBe(CONFIRMED_BUNDLE_ID);
  });

  it('does not invent one when confirm served none — the server logs that case', async () => {
    const bodies: Record<string, unknown>[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      const u = String(url);
      if (u.includes('/resolve')) {
        return new Response(JSON.stringify({
          ok: true, data: { status: 'resolved', candidates: [CANDIDATE] },
        }));
      }
      if (u.includes('/confirm')) {
        return new Response(JSON.stringify({
          ok: true,
          data: {
            bundle_signature: 'a'.repeat(64), bundle_id: 'cand-001',
            bundle_size: 1, has_new_build_project: false,
            warnings: [], rejected: [], questions: [],
          },
        }));
      }
      if (u.includes('/quote')) return new Response(JSON.stringify({ ok: true, data: QUOTE }));
      if (u.includes('/payment-intent')) {
        bodies.push(JSON.parse(String(init?.body ?? '{}')));
        return new Response(JSON.stringify({
          ok: true, data: { client_secret: 'pi_stub_secret', order_id: 'ord-1' },
        }));
      }
      return new Response(JSON.stringify({ ok: true, data: {} }));
    }));

    await payByCard();

    await waitFor(() => expect(bodies.length).toBe(1));
    expect(bodies[0].confirmed_bundle_id).toBeUndefined();
  });
});
