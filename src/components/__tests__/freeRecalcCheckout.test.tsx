/**
 * Spending a free recalculation pass: no bank to choose, no card to enter.
 *
 * The customer arrives from the invitation in their report, walks the same
 * journey for the same property, and the total is zero. There is nothing to
 * pay with — so the payment-method grid never appears, and the one button
 * orders the rebuild directly. The backend settles the order and starts the
 * report; the browser goes straight to the success screen.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QuickScanFlow from '../QuickScanFlow';

const NTR = '4400-1234-5678';

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

function quote(finalPrice: string) {
  return {
    quote_id: 'q-1',
    bundle_id: 'cand-001',
    base_price_eur: '39.00',
    final_price_eur: finalPrice,
    discount_amount_eur: finalPrice === '0.00' ? '39.00' : '0.00',
    pricing_label: 'Standartinis',
    pricing_version: 'pricing_v1',
    currency: 'EUR',
    ui_explanation_block: [],
    expires_at: '2099-12-31T23:59:59Z',
    has_active_discount: finalPrice === '0.00',
    special_discount_applied: finalPrice === '0.00',
    discount_context: null,
  };
}

function stubFetch(finalPrice: string, intentData: Record<string, unknown>) {
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
          bundle_signature: 'a'.repeat(64), bundle_id: 'cand-001', bundle_size: 1,
          has_new_build_project: false, confirmed_bundle_id: 'cb-1',
          warnings: [], rejected: [], questions: [],
        },
      }));
    }
    if (u.includes('/quote')) {
      return new Response(JSON.stringify({ ok: true, data: quote(finalPrice) }));
    }
    if (u.includes('/payment-intent')) {
      bodies.push(JSON.parse(String(init?.body ?? '{}')));
      return new Response(JSON.stringify({ ok: true, data: intentData }));
    }
    return new Response(JSON.stringify({ ok: true, data: {} }));
  }));
  return bodies;
}

async function driveToCheckout() {
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
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe('the free rebuild', () => {
  it('★ orders directly — no payment method to choose, and lands on success', async () => {
    const bodies = stubFetch('0.00', {
      client_secret: null, order_id: 'ord-free-1', zero_total: true,
    });

    await driveToCheckout();
    const orderButton = await screen.findByText('Gauti nemokamą perskaičiavimą');
    expect(screen.queryByText('Pasirinkite mokėjimo būdą:')).not.toBeInTheDocument();

    fireEvent.click(orderButton);

    await waitFor(() => expect(bodies.length).toBe(1));
    await waitFor(() =>
      expect(screen.getByText('Užsakymas priimtas.')).toBeInTheDocument(),
    );
  });

  it('a paid order still asks which bank or card — the free path is scoped', async () => {
    stubFetch('39.00', { client_secret: 'pi_stub_secret', order_id: 'ord-paid-1' });

    await driveToCheckout();
    const payButton = await screen.findByText('Mokėti ir gauti ataskaitą');
    expect(screen.queryByText('Gauti nemokamą perskaičiavimą')).not.toBeInTheDocument();

    fireEvent.click(payButton);

    await waitFor(() =>
      expect(screen.getByText('Pasirinkite mokėjimo būdą:')).toBeInTheDocument(),
    );
  });
});
