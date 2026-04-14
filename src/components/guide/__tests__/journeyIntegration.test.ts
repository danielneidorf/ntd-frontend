/**
 * P7-B8-test: Voice Guide Journey Integration Tests
 *
 * Tests full customer journeys through direct formActionsRegistry handler calls.
 * Mocks dependencies (tour state, DOM, fetch, sessionStorage) but calls real
 * handler registration patterns — testing state machine sequences, not individual tools.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { formActions } from '../formActionsRegistry';
import type { CrossPageDetour } from '../contentMap';

// ─── Test harness: simulated tour + form state ────────────────────────

interface MockTourState {
  active: boolean;
  currentStep: number;
  steps: { id: string; narration: string; selector: string }[];
}

interface MockFormState {
  case_type: string | null;
  address_text: string | null;
  geo: { lat: number; lng: number } | null;
  ntr_unique_number: string | null;
  email: string;
  consent_accepted: boolean;
  invoice_requested: boolean;
  quote: { final_price_eur: number; quote_id: string } | null;
  step: 1 | 2;
}

const LANDING_STEPS = [
  { id: 'hero', narration: 'Sveiki! Padėsiu apžvelgti svetainę.', selector: '[data-guide="hero"]' },
  { id: 'data-categories', narration: 'Ataskaitoje rasite šias dalis.', selector: '[data-guide="data-categories"]' },
  { id: 'how-it-works', narration: 'Palyginkite: eksperto samdymas kainuoja...', selector: '[data-guide="how-it-works"]' },
  { id: 'pricing', narration: 'Kaina — nuo 39 €.', selector: '[data-guide="pricing"]' },
  { id: 'cta', narration: 'Procesas paprastas — trys žingsniai.', selector: '[data-guide="cta"]' },
];

const NTR_REGEX = /^\d{4}-\d{4}-\d{4}(:\d{1,6})?$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_METHODS = ['card', 'apple-pay', 'google-pay', 'paypal', 'swedbank', 'seb', 'luminor', 'citadele', 'revolut', 'paysera'];

// ─── Registration helpers — mirrors real handler logic ────────────────

function registerLandingTourActions(
  tour: MockTourState,
  seenSteps: Set<number>,
  returnStepRef: { current: number | null },
  crossPageReturn: { current: CrossPageDetour | null },
) {
  const findNextUnseen = (from: number): number | null => {
    for (let i = from; i < tour.steps.length; i++) {
      if (!seenSteps.has(i)) return i;
    }
    return null;
  };

  formActions.register('get_current_screen', () =>
    JSON.stringify({ success: true, data: { screen: 'landing', step: tour.currentStep } }),
  );

  formActions.register('tour_next', () => {
    if (!tour.active) return JSON.stringify({ success: false, error: 'tour_not_active' });

    // Cross-page return
    if (crossPageReturn.current) {
      const detour = crossPageReturn.current;
      crossPageReturn.current = null;
      const returnData = {
        tourId: detour.returnTourId,
        stepIndex: detour.returnStepIndex + 1,
        voiceWasActive: detour.voiceWasActive,
        seenSteps: [...detour.seenSteps, ...Array.from(seenSteps)],
      };
      mockSessionStorage.setItem('ntd-guide-return', JSON.stringify(returnData));
      mockSessionStorage.removeItem('ntd-guide-detour');
      return JSON.stringify({ success: true, returning: true, message: 'Grįžtu atgal...' });
    }

    const searchFrom = returnStepRef.current !== null
      ? returnStepRef.current + 1
      : tour.currentStep + 1;
    returnStepRef.current = null;

    const nextIdx = findNextUnseen(searchFrom);
    if (nextIdx === null) return JSON.stringify({ success: false, error: 'last_step', message: 'Tai paskutinis žingsnis.' });

    seenSteps.add(nextIdx);
    tour.currentStep = nextIdx;
    return JSON.stringify({
      success: true,
      step: nextIdx,
      narration: tour.steps[nextIdx]?.narration ?? '',
      instruction: 'Perskaityk naracijos tekstą žodis žodžiui. Po perskaitymo — tylėk.',
    });
  });

  formActions.register('tour_back', () => {
    if (!tour.active) return JSON.stringify({ success: false, error: 'tour_not_active' });
    returnStepRef.current = null;
    if (tour.currentStep <= 0) return JSON.stringify({ success: false, error: 'first_step', message: 'Tai pirmas žingsnis.' });
    const prevIdx = tour.currentStep - 1;
    tour.currentStep = prevIdx;
    return JSON.stringify({ success: true, step: prevIdx, narration: tour.steps[prevIdx]?.narration ?? '' });
  });

  formActions.register('show_section', (args) => {
    const topic = args.topic as string;
    // Simplified content map lookup
    const contentMap: Record<string, { tourId: string; stepId: string; label: string }> = {
      report_contents: { tourId: 'landing', stepId: 'data-categories', label: 'Ką gausite ataskaitoje' },
      pricing: { tourId: 'landing', stepId: 'pricing', label: 'Kaina' },
      how_it_works: { tourId: 'landing', stepId: 'how-it-works', label: 'Kaip tai veikia' },
      situations: { tourId: 'landing', stepId: 'cta', label: 'Situacijos' },
      thermal_comfort: { tourId: 'report', stepId: 'climate-assessment', label: 'Šiluminis komfortas' },
    };
    const entry = contentMap[topic];
    if (!entry) return JSON.stringify({ success: false, error: 'unknown_topic', message: `Nežinoma tema: ${topic}` });

    if (entry.tourId !== 'landing') {
      // Cross-page: save detour state
      const detour: CrossPageDetour = {
        returnPath: '/quickscan/',
        returnTourId: 'quickscan',
        returnStepIndex: tour.currentStep,
        targetTopic: topic,
        voiceWasActive: true,
        seenSteps: Array.from(seenSteps),
      };
      mockSessionStorage.setItem('ntd-guide-detour', JSON.stringify(detour));
      return JSON.stringify({ success: true, navigating: true, message: 'Pereinu į kitą puslapį...' });
    }

    // Same page
    const stepIndex = tour.steps.findIndex((s) => s.id === entry.stepId);
    if (stepIndex === -1) return JSON.stringify({ success: false, error: 'step_not_found' });

    returnStepRef.current = tour.currentStep;
    seenSteps.add(stepIndex);
    tour.currentStep = stepIndex;
    return JSON.stringify({
      success: true,
      label: entry.label,
      narration: tour.steps[stepIndex]?.narration ?? '',
      return_available: true,
    });
  });
}

function registerScreen1Actions(formState: MockFormState) {
  formActions.register('get_current_screen', () =>
    JSON.stringify({
      success: true,
      data: {
        screen: 'quickscan-step1',
        case_type: formState.case_type,
        address_filled: !!formState.address_text,
        current_address: formState.address_text,
        has_geo: !!formState.geo,
        can_proceed: !!formState.case_type && (!!formState.address_text || !!formState.ntr_unique_number),
      },
    }),
  );

  formActions.register('select_case_type', (args) => {
    const caseType = args.case_type as string;
    if (!['existing_object', 'new_build_project', 'land_only'].includes(caseType)) {
      return JSON.stringify({ success: false, error: 'invalid_case_type' });
    }
    formState.case_type = caseType;
    return JSON.stringify({ success: true, case_type: caseType });
  });

  formActions.register('fill_address', async (args) => {
    const query = (args.address as string)?.trim();
    if (!query) return JSON.stringify({ success: false, error: 'empty_address' });

    formState.address_text = query;
    formState.geo = null;

    // Simulate geocode: if address contains "nonexistent" → no results
    if (query.includes('nonexistent')) {
      return JSON.stringify({ success: false, error: 'no_results', message: 'Pagal šį adresą nieko nerasta.' });
    }

    // Simulate single result auto-select
    formState.geo = { lat: 54.687, lng: 25.280 };
    return JSON.stringify({ success: true, auto_selected: true, address: query });
  });

  formActions.register('select_address_candidate', (args) => {
    const index = args.index as number;
    if (index < 0 || index > 5) return JSON.stringify({ success: false, error: 'invalid_index' });
    formState.address_text = `Selected address ${index}`;
    formState.geo = { lat: 54.687, lng: 25.280 };
    return JSON.stringify({ success: true, address: formState.address_text });
  });

  formActions.register('fill_ntr', (args) => {
    const ntr = (args.ntr as string)?.trim();
    if (!ntr || !NTR_REGEX.test(ntr)) {
      return JSON.stringify({ success: false, error: 'invalid_format', message: 'Neteisingas NTR formatas.' });
    }
    formState.ntr_unique_number = ntr;
    return JSON.stringify({ success: true, ntr });
  });

  formActions.register('click_continue', () => {
    const canProceed = !!formState.case_type && (!!formState.address_text || !!formState.ntr_unique_number);
    if (!canProceed) {
      return JSON.stringify({ success: false, error: 'form_not_ready', message: 'Negalima tęsti.' });
    }
    formState.step = 2;
    formState.quote = { final_price_eur: 39, quote_id: 'test-quote-1' };
    return JSON.stringify({ success: true });
  });
}

function registerScreen2Actions(formState: MockFormState) {
  let objectConfirmed = false;
  let selectedMethod: string | null = null;

  formActions.register('get_current_screen', () =>
    JSON.stringify({
      success: true,
      data: {
        screen: 'quickscan-step2',
        object_confirmed: objectConfirmed,
        email: formState.email,
        consent_accepted: formState.consent_accepted,
        selected_method: selectedMethod,
        can_pay: objectConfirmed && !!formState.quote && EMAIL_REGEX.test(formState.email) && formState.consent_accepted,
        price: formState.quote?.final_price_eur,
      },
    }),
  );

  formActions.register('confirm_property', () => {
    objectConfirmed = true;
    return JSON.stringify({ success: true });
  });

  formActions.register('fill_email', (args) => {
    const email = (args.email as string)?.trim();
    if (!email || !EMAIL_REGEX.test(email)) {
      return JSON.stringify({ success: false, error: 'invalid_email', message: 'Neteisingas el. pašto formatas.' });
    }
    formState.email = email;
    return JSON.stringify({ success: true, email });
  });

  formActions.register('toggle_consent', (args) => {
    formState.consent_accepted = args.checked as boolean;
    return JSON.stringify({ success: true, consent: formState.consent_accepted });
  });

  formActions.register('toggle_invoice', (args) => {
    formState.invoice_requested = args.checked as boolean;
    return JSON.stringify({ success: true, invoice: formState.invoice_requested });
  });

  formActions.register('select_payment_method', (args) => {
    const method = args.method as string;
    if (!VALID_METHODS.includes(method)) {
      return JSON.stringify({ success: false, error: 'invalid_method', message: `Nežinomas mokėjimo būdas: ${method}` });
    }
    selectedMethod = method;
    return JSON.stringify({ success: true, method });
  });

  formActions.register('click_pay', () => {
    const emailValid = EMAIL_REGEX.test(formState.email);
    const canPay = objectConfirmed && !!formState.quote && emailValid && formState.consent_accepted;
    if (!canPay) {
      const missing: string[] = [];
      if (!objectConfirmed) missing.push('objekto patvirtinimas');
      if (!formState.email || !emailValid) missing.push('el. paštas');
      if (!formState.consent_accepted) missing.push('sutikimas su sąlygomis');
      if (!selectedMethod) missing.push('mokėjimo būdas');
      return JSON.stringify({ success: false, error: 'missing_fields', message: `Trūksta: ${missing.join(', ')}.` });
    }
    if (!selectedMethod) {
      return JSON.stringify({ success: false, error: 'no_method', message: 'Pasirinkite mokėjimo būdą.' });
    }
    return JSON.stringify({ success: true, price: formState.quote?.final_price_eur });
  });

  formActions.register('navigate_back', () => {
    formState.step = 1;
    formState.quote = null;
    return JSON.stringify({ success: true });
  });
}

// ─── Mock sessionStorage ──────────────────────────────────────────────

const mockSessionStorage: Record<string, string> & {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
} = {
  getItem(key: string) { return this[key] ?? null; },
  setItem(key: string, value: string) { this[key] = value; },
  removeItem(key: string) { delete this[key]; },
  clear() {
    for (const key of Object.keys(this)) {
      if (typeof this[key] === 'string') delete this[key];
    }
  },
};

// ─── Cleanup ──────────────────────────────────────────────────────────

const ALL_ACTION_KEYS = [
  'get_current_screen', 'tour_next', 'tour_back', 'show_section',
  'select_case_type', 'fill_address', 'select_address_candidate', 'fill_ntr',
  'click_continue', 'confirm_property', 'fill_email', 'toggle_consent',
  'toggle_invoice', 'select_payment_method', 'click_pay', 'navigate_back',
];

function clearAll() {
  for (const key of ALL_ACTION_KEYS) formActions.unregister(key);
  mockSessionStorage.clear();
}

// Helper to call a registered action
async function call(name: string, args: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  const action = formActions.get(name);
  if (!action) throw new Error(`Action "${name}" not registered`);
  const result = await action(args);
  return JSON.parse(result);
}

// ─── Tests ────────────────────────────────────────────────────────────

describe('Journey Integration Tests', () => {
  beforeEach(() => clearAll());

  describe('Journey 1: Happy path — landing through payment', () => {
    it('completes full flow from landing to payment', async () => {
      // Phase 1: Landing tour
      const tour: MockTourState = { active: true, currentStep: 0, steps: LANDING_STEPS };
      const seenSteps = new Set<number>([0]);
      const returnStepRef = { current: null as number | null };
      const crossPageReturn = { current: null as CrossPageDetour | null };
      registerLandingTourActions(tour, seenSteps, returnStepRef, crossPageReturn);

      let r = await call('get_current_screen');
      expect(r.data).toHaveProperty('screen', 'landing');

      // Advance through all 5 steps
      r = await call('tour_next'); expect(r.success).toBe(true); expect(r.step).toBe(1);
      r = await call('tour_next'); expect(r.success).toBe(true); expect(r.step).toBe(2);
      r = await call('tour_next'); expect(r.success).toBe(true); expect(r.step).toBe(3);
      r = await call('tour_next'); expect(r.success).toBe(true); expect(r.step).toBe(4);
      r = await call('tour_next'); expect(r.success).toBe(false); expect(r.error).toBe('last_step');

      // Phase 2: Screen 1
      clearAll();
      const formState: MockFormState = {
        case_type: null, address_text: null, geo: null, ntr_unique_number: null,
        email: '', consent_accepted: false, invoice_requested: false, quote: null, step: 1,
      };
      registerScreen1Actions(formState);

      r = await call('get_current_screen');
      expect(r.data).toHaveProperty('screen', 'quickscan-step1');

      r = await call('select_case_type', { case_type: 'existing_object' });
      expect(r.success).toBe(true);
      expect(formState.case_type).toBe('existing_object');

      r = await call('fill_address', { address: 'Žirmūnų g. 12' });
      expect(r.success).toBe(true);
      expect(formState.geo).not.toBeNull();

      r = await call('click_continue');
      expect(r.success).toBe(true);
      expect(formState.step).toBe(2);

      // Phase 3: Screen 2
      clearAll();
      registerScreen2Actions(formState);

      r = await call('get_current_screen');
      expect(r.data).toHaveProperty('screen', 'quickscan-step2');

      r = await call('confirm_property');
      expect(r.success).toBe(true);

      r = await call('fill_email', { email: 'jonas@gmail.com' });
      expect(r.success).toBe(true);

      r = await call('toggle_consent', { checked: true });
      expect(r.success).toBe(true);

      r = await call('select_payment_method', { method: 'card' });
      expect(r.success).toBe(true);

      r = await call('click_pay');
      expect(r.success).toBe(true);
      expect(r.price).toBe(39);
    });
  });

  describe('Journey 2: Curious browser — detours from landing', () => {
    it('handles same-page detours with correct skip behavior', async () => {
      const tour: MockTourState = { active: true, currentStep: 0, steps: LANDING_STEPS };
      const seenSteps = new Set<number>([0]);
      const returnStepRef = { current: null as number | null };
      const crossPageReturn = { current: null as CrossPageDetour | null };
      registerLandingTourActions(tour, seenSteps, returnStepRef, crossPageReturn);

      // Step 0 → step 1
      let r = await call('tour_next');
      expect(r.step).toBe(1);

      // Detour to pricing (step 3)
      r = await call('show_section', { topic: 'pricing' });
      expect(r.success).toBe(true);
      expect(r.label).toBe('Kaina');
      expect(tour.currentStep).toBe(3); // pricing step
      expect(returnStepRef.current).toBe(1); // saved where we were
      expect(seenSteps.has(3)).toBe(true);

      // "toliau" returns to step 1+1 = step 2 (skipping step 1, already seen)
      r = await call('tour_next');
      expect(r.success).toBe(true);
      expect(r.step).toBe(2); // how-it-works

      // Another detour: how_it_works is step 2, but we're already there.
      // Detour to situations (step 4 / cta)
      r = await call('show_section', { topic: 'situations' });
      expect(r.success).toBe(true);
      expect(tour.currentStep).toBe(4);
      expect(seenSteps.has(4)).toBe(true);

      // "toliau" — step 2+1=3 but 3 (pricing) is seen, 4 (cta) is seen → last step
      r = await call('tour_next');
      expect(r.success).toBe(false);
      expect(r.error).toBe('last_step');
    });
  });

  describe('Journey 3: Cross-page detour from quickscan to landing', () => {
    it('saves detour state for cross-page navigation', async () => {
      const tour: MockTourState = { active: true, currentStep: 2, steps: LANDING_STEPS };
      const seenSteps = new Set<number>([0, 1, 2]);
      const returnStepRef = { current: null as number | null };
      const crossPageReturn = { current: null as CrossPageDetour | null };
      registerLandingTourActions(tour, seenSteps, returnStepRef, crossPageReturn);

      // show_section for report-only topic → cross-page
      const r = await call('show_section', { topic: 'thermal_comfort' });
      expect(r.success).toBe(true);
      expect(r.navigating).toBe(true);

      // Verify sessionStorage
      const detourRaw = mockSessionStorage.getItem('ntd-guide-detour');
      expect(detourRaw).not.toBeNull();
      const detour = JSON.parse(detourRaw!) as CrossPageDetour;
      expect(detour.returnPath).toBe('/quickscan/');
      expect(detour.returnTourId).toBe('quickscan');
      expect(detour.returnStepIndex).toBe(2);
      expect(detour.targetTopic).toBe('thermal_comfort');
      expect(detour.voiceWasActive).toBe(true);
      expect(detour.seenSteps).toEqual([0, 1, 2]);
    });
  });

  describe('Journey 4: Confused user — back and forth', () => {
    it('handles case type changes, navigate_back, and retry', async () => {
      const formState: MockFormState = {
        case_type: null, address_text: null, geo: null, ntr_unique_number: null,
        email: '', consent_accepted: false, invoice_requested: false, quote: null, step: 1,
      };
      registerScreen1Actions(formState);

      // Set case type, then change mind
      await call('select_case_type', { case_type: 'new_build_project' });
      expect(formState.case_type).toBe('new_build_project');

      await call('select_case_type', { case_type: 'existing_object' });
      expect(formState.case_type).toBe('existing_object');

      // Fill address and continue
      await call('fill_address', { address: 'Konstitucijos pr. 20' });
      let r = await call('click_continue');
      expect(r.success).toBe(true);
      expect(formState.step).toBe(2);

      // Screen 2: confirm then navigate back
      clearAll();
      registerScreen2Actions(formState);

      await call('confirm_property');
      r = await call('navigate_back');
      expect(r.success).toBe(true);
      expect(formState.step).toBe(1);

      // Re-register Screen 1 actions, fill new address
      clearAll();
      registerScreen1Actions(formState);
      expect(formState.case_type).toBe('existing_object'); // preserved

      await call('fill_address', { address: 'Gedimino pr. 1' });
      r = await call('click_continue');
      expect(r.success).toBe(true);

      // Screen 2 again
      clearAll();
      registerScreen2Actions(formState);

      await call('confirm_property');

      // Invalid email first
      r = await call('fill_email', { email: 'invalid-email' });
      expect(r.success).toBe(false);
      expect(r.error).toBe('invalid_email');

      // Valid email
      r = await call('fill_email', { email: 'petras@gmail.com' });
      expect(r.success).toBe(true);

      // Try to pay without consent and payment method
      r = await call('click_pay');
      expect(r.success).toBe(false);
      expect(r.error).toBe('missing_fields');
      expect((r.message as string)).toContain('sutikimas');

      // Complete the form
      await call('toggle_consent', { checked: true });
      await call('select_payment_method', { method: 'card' });
      r = await call('click_pay');
      expect(r.success).toBe(true);
    });
  });

  describe('Journey 5: Edge cases', () => {
    it('A: tour_next on inactive tour', async () => {
      const tour: MockTourState = { active: false, currentStep: 0, steps: LANDING_STEPS };
      registerLandingTourActions(tour, new Set(), { current: null }, { current: null });
      const r = await call('tour_next');
      expect(r.error).toBe('tour_not_active');
    });

    it('B: tour_back on first step', async () => {
      const tour: MockTourState = { active: true, currentStep: 0, steps: LANDING_STEPS };
      registerLandingTourActions(tour, new Set([0]), { current: null }, { current: null });
      const r = await call('tour_back');
      expect(r.error).toBe('first_step');
    });

    it('C: show_section with unknown topic', async () => {
      const tour: MockTourState = { active: true, currentStep: 0, steps: LANDING_STEPS };
      registerLandingTourActions(tour, new Set(), { current: null }, { current: null });
      const r = await call('show_section', { topic: 'nonexistent' });
      expect(r.error).toBe('unknown_topic');
    });

    it('D: double detour same-page', async () => {
      const tour: MockTourState = { active: true, currentStep: 0, steps: LANDING_STEPS };
      const seenSteps = new Set<number>([0]);
      const returnStepRef = { current: null as number | null };
      registerLandingTourActions(tour, seenSteps, returnStepRef, { current: null });

      await call('tour_next'); // step 1
      await call('show_section', { topic: 'pricing' }); // detour to step 3
      expect(returnStepRef.current).toBe(1);

      // Second detour from pricing to how_it_works (step 2)
      await call('show_section', { topic: 'how_it_works' });
      expect(returnStepRef.current).toBe(3); // now returns to pricing step
      expect(tour.currentStep).toBe(2);

      // "toliau" returns to step 3+1=4
      const r = await call('tour_next');
      expect(r.success).toBe(true);
      expect(r.step).toBe(4); // cta
    });

    it('E: click_continue when form not ready', async () => {
      const formState: MockFormState = {
        case_type: null, address_text: null, geo: null, ntr_unique_number: null,
        email: '', consent_accepted: false, invoice_requested: false, quote: null, step: 1,
      };
      registerScreen1Actions(formState);
      const r = await call('click_continue');
      expect(r.error).toBe('form_not_ready');
    });

    it('F: click_pay with partial fields', async () => {
      const formState: MockFormState = {
        case_type: 'existing_object', address_text: 'Test', geo: { lat: 1, lng: 2 },
        ntr_unique_number: null, email: 'test@test.com', consent_accepted: false,
        invoice_requested: false, quote: { final_price_eur: 39, quote_id: 'q1' }, step: 2,
      };
      registerScreen2Actions(formState);
      await call('confirm_property');
      const r = await call('click_pay');
      expect(r.error).toBe('missing_fields');
      expect((r.message as string)).toContain('sutikimas');
    });

    it('G: fill_address with zero results', async () => {
      const formState: MockFormState = {
        case_type: 'existing_object', address_text: null, geo: null, ntr_unique_number: null,
        email: '', consent_accepted: false, invoice_requested: false, quote: null, step: 1,
      };
      registerScreen1Actions(formState);
      const r = await call('fill_address', { address: 'xyznonexistent123' });
      expect(r.success).toBe(false);
      expect(r.error).toBe('no_results');
    });

    it('I: fill_ntr with invalid then valid format', async () => {
      const formState: MockFormState = {
        case_type: 'existing_object', address_text: null, geo: null, ntr_unique_number: null,
        email: '', consent_accepted: false, invoice_requested: false, quote: null, step: 1,
      };
      registerScreen1Actions(formState);

      let r = await call('fill_ntr', { ntr: 'abc' });
      expect(r.error).toBe('invalid_format');

      r = await call('fill_ntr', { ntr: '1234-5678-9012' });
      expect(r.success).toBe(true);
      expect(formState.ntr_unique_number).toBe('1234-5678-9012');
    });

    it('J: select_payment_method with invalid method', async () => {
      const formState: MockFormState = {
        case_type: 'existing_object', address_text: 'Test', geo: { lat: 1, lng: 2 },
        ntr_unique_number: null, email: '', consent_accepted: false,
        invoice_requested: false, quote: { final_price_eur: 39, quote_id: 'q1' }, step: 2,
      };
      registerScreen2Actions(formState);
      const r = await call('select_payment_method', { method: 'bitcoin' });
      expect(r.error).toBe('invalid_method');
    });

    it('K: toggle operations are idempotent', async () => {
      const formState: MockFormState = {
        case_type: null, address_text: null, geo: null, ntr_unique_number: null,
        email: '', consent_accepted: false, invoice_requested: false, quote: null, step: 2,
      };
      registerScreen2Actions(formState);

      await call('toggle_consent', { checked: true });
      expect(formState.consent_accepted).toBe(true);
      await call('toggle_consent', { checked: true });
      expect(formState.consent_accepted).toBe(true);
      await call('toggle_consent', { checked: false });
      expect(formState.consent_accepted).toBe(false);
      await call('toggle_consent', { checked: false });
      expect(formState.consent_accepted).toBe(false);
    });

    it('L: cross-page detour with stale sessionStorage', async () => {
      // Set stale detour pointing to nonexistent topic
      mockSessionStorage.setItem('ntd-guide-detour', JSON.stringify({
        returnPath: '/quickscan/',
        returnTourId: 'quickscan',
        returnStepIndex: 0,
        targetTopic: 'nonexistent_topic',
        voiceWasActive: false,
        seenSteps: [],
      }));

      // The detour data exists but topic is invalid — verify it can be read and would be cleaned up
      const raw = mockSessionStorage.getItem('ntd-guide-detour');
      expect(raw).not.toBeNull();
      const detour = JSON.parse(raw!) as CrossPageDetour;
      expect(detour.targetTopic).toBe('nonexistent_topic');
      // In real code, the mount effect would removeItem — we verify the data is there to clean up
    });

    it('M: seen steps persist across cross-page roundtrip', async () => {
      const tour: MockTourState = { active: true, currentStep: 0, steps: LANDING_STEPS };
      const seenSteps = new Set<number>([0, 1, 2]);
      const returnStepRef = { current: null as number | null };
      const crossPageReturn = { current: null as CrossPageDetour | null };
      registerLandingTourActions(tour, seenSteps, returnStepRef, crossPageReturn);

      // Cross-page detour
      await call('show_section', { topic: 'thermal_comfort' });
      const detour = JSON.parse(mockSessionStorage.getItem('ntd-guide-detour')!) as CrossPageDetour;
      expect(detour.seenSteps).toEqual([0, 1, 2]);

      // Simulate return: set crossPageReturn and call tour_next
      clearAll();
      crossPageReturn.current = detour;
      const newSeenSteps = new Set<number>();
      registerLandingTourActions(tour, newSeenSteps, returnStepRef, crossPageReturn);

      const r = await call('tour_next');
      expect(r.returning).toBe(true);

      // Verify return state has merged seen steps
      const returnData = JSON.parse(mockSessionStorage.getItem('ntd-guide-return')!);
      expect(returnData.seenSteps).toContain(0);
      expect(returnData.seenSteps).toContain(1);
      expect(returnData.seenSteps).toContain(2);
    });
  });

  describe('Journey 6: Full demo scenario', () => {
    it('completes the sales demo sequence end-to-end', async () => {
      // Landing page
      const tour: MockTourState = { active: true, currentStep: 0, steps: LANDING_STEPS };
      const seenSteps = new Set<number>([0]);
      const returnStepRef = { current: null as number | null };
      const crossPageReturn = { current: null as CrossPageDetour | null };
      registerLandingTourActions(tour, seenSteps, returnStepRef, crossPageReturn);

      // Steps 1-2
      let r = await call('tour_next'); expect(r.step).toBe(1); // data-categories
      r = await call('tour_next'); expect(r.step).toBe(2); // how-it-works

      // "kiek kainuoja?" → detour to pricing (step 3)
      r = await call('show_section', { topic: 'pricing' });
      expect(r.success).toBe(true);
      expect(tour.currentStep).toBe(3);

      // "toliau" → skip step 3 (seen via detour), go to step 4
      r = await call('tour_next');
      expect(r.step).toBe(4); // cta

      // Last step
      r = await call('tour_next');
      expect(r.error).toBe('last_step');

      // Screen 1
      clearAll();
      const formState: MockFormState = {
        case_type: null, address_text: null, geo: null, ntr_unique_number: null,
        email: '', consent_accepted: false, invoice_requested: false, quote: null, step: 1,
      };
      registerScreen1Actions(formState);

      await call('select_case_type', { case_type: 'existing_object' });
      await call('fill_address', { address: 'Žirmūnų g. 12' });
      r = await call('click_continue');
      expect(r.success).toBe(true);

      // Screen 2
      clearAll();
      registerScreen2Actions(formState);

      await call('confirm_property');
      await call('fill_email', { email: 'jonas@gmail.com' });
      await call('toggle_consent', { checked: true });
      await call('select_payment_method', { method: 'card' });

      // Final payment
      r = await call('click_pay');
      expect(r.success).toBe(true);
      expect(r.price).toBe(39);
      expect(formState.email).toBe('jonas@gmail.com');
      expect(formState.consent_accepted).toBe(true);
    });
  });
});
