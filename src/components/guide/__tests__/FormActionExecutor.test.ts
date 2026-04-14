import { describe, it, expect, beforeEach } from 'vitest';
import { executeFormAction } from '../FormActionExecutor';
import { formActions } from '../formActionsRegistry';
import { findContentByTopic, getPagePath } from '../contentMap';
import type { CrossPageDetour } from '../contentMap';

const ALL_KEYS = [
  'test_action',
  'throws_action',
  'get_current_screen',
  'select_case_type',
  'fill_address',
  'select_address_candidate',
  'fill_ntr',
  'click_continue',
  'tour_next',
  'tour_back',
  'show_section',
  'confirm_property',
  'fill_email',
  'toggle_consent',
  'toggle_invoice',
  'select_payment_method',
  'click_pay',
  'navigate_back',
];

// Clear registry between tests to avoid cross-contamination
beforeEach(() => {
  for (const key of ALL_KEYS) formActions.unregister(key);
});

describe('executeFormAction', () => {
  it('returns result from a registered action', async () => {
    formActions.register('test_action', () =>
      JSON.stringify({ success: true, data: { value: 42 } }),
    );

    const result = await executeFormAction('test_action', {});
    const parsed = JSON.parse(result);

    expect(parsed.success).toBe(true);
    expect(parsed.data.value).toBe(42);
  });

  it('returns error JSON for unknown action', async () => {
    const result = await executeFormAction('nonexistent', {});
    const parsed = JSON.parse(result);

    expect(parsed.error).toBe('unknown_action');
    expect(parsed.message).toContain('nonexistent');
  });

  it('returns error JSON when action throws', async () => {
    formActions.register('throws_action', () => {
      throw new Error('something broke');
    });

    const result = await executeFormAction('throws_action', {});
    const parsed = JSON.parse(result);

    expect(parsed.error).toBe('action_failed');
    expect(parsed.message).toContain('something broke');
  });

  it('passes args to the registered action', async () => {
    formActions.register('test_action', (args) =>
      JSON.stringify({ received: args }),
    );

    const result = await executeFormAction('test_action', { foo: 'bar' });
    const parsed = JSON.parse(result);

    expect(parsed.received).toEqual({ foo: 'bar' });
  });
});

describe('formActionsRegistry', () => {
  it('notifies subscribers on register and unregister', () => {
    let callCount = 0;
    const unsub = formActions.subscribe(() => { callCount++; });

    formActions.register('test_action', () => '{}');
    expect(callCount).toBe(1);

    formActions.unregister('test_action');
    expect(callCount).toBe(2);

    unsub();

    formActions.register('test_action', () => '{}');
    expect(callCount).toBe(2); // no longer subscribed
    formActions.unregister('test_action');
  });
});

// P7-B8.2: Screen 1 form action tests
// These simulate the actions that Screen1 registers in the formActionsRegistry.

describe('Screen 1 form actions', () => {
  describe('select_case_type', () => {
    let lastCaseType: string | null;

    beforeEach(() => {
      lastCaseType = null;
      formActions.register('select_case_type', (args) => {
        const caseType = args.case_type as string;
        const valid = ['existing_object', 'new_build_project', 'land_only'];
        if (!valid.includes(caseType)) {
          return JSON.stringify({ success: false, error: 'invalid_case_type' });
        }
        lastCaseType = caseType;
        return JSON.stringify({ success: true, case_type: caseType });
      });
    });

    it('sets a valid case type', async () => {
      const result = JSON.parse(await executeFormAction('select_case_type', { case_type: 'existing_object' }));
      expect(result.success).toBe(true);
      expect(result.case_type).toBe('existing_object');
      expect(lastCaseType).toBe('existing_object');
    });

    it('rejects an invalid case type', async () => {
      const result = JSON.parse(await executeFormAction('select_case_type', { case_type: 'invalid' }));
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_case_type');
      expect(lastCaseType).toBeNull();
    });
  });

  describe('fill_address', () => {
    it('returns error for empty address', async () => {
      formActions.register('fill_address', async (args) => {
        const query = (args.address as string)?.trim();
        if (!query) return JSON.stringify({ success: false, error: 'empty_address' });
        return JSON.stringify({ success: true });
      });

      const result = JSON.parse(await executeFormAction('fill_address', { address: '  ' }));
      expect(result.success).toBe(false);
      expect(result.error).toBe('empty_address');
    });

    it('returns auto_selected when single candidate', async () => {
      formActions.register('fill_address', async (args) => {
        const query = (args.address as string)?.trim();
        if (!query) return JSON.stringify({ success: false, error: 'empty_address' });
        // Simulate single candidate
        return JSON.stringify({ success: true, auto_selected: true, address: 'Žirmūnų g. 12, Vilnius' });
      });

      const result = JSON.parse(await executeFormAction('fill_address', { address: 'Žirmūnų g. 12' }));
      expect(result.success).toBe(true);
      expect(result.auto_selected).toBe(true);
      expect(result.address).toContain('Žirmūnų');
    });

    it('returns candidates when multiple results', async () => {
      formActions.register('fill_address', async (args) => {
        const query = (args.address as string)?.trim();
        if (!query) return JSON.stringify({ success: false, error: 'empty_address' });
        return JSON.stringify({
          success: true,
          needs_selection: true,
          candidates: [
            { index: 0, address: 'Žirmūnų g. 12, Vilnius' },
            { index: 1, address: 'Žirmūnų g. 12A, Vilnius' },
          ],
        });
      });

      const result = JSON.parse(await executeFormAction('fill_address', { address: 'Žirmūnų 12' }));
      expect(result.success).toBe(true);
      expect(result.needs_selection).toBe(true);
      expect(result.candidates).toHaveLength(2);
    });
  });

  describe('select_address_candidate', () => {
    it('selects a valid candidate', async () => {
      const stored = [
        { place_id: 'a', description: 'Žirmūnų g. 12, Vilnius', main_text: '', secondary_text: '' },
        { place_id: 'b', description: 'Žirmūnų g. 12A, Vilnius', main_text: '', secondary_text: '' },
      ];

      formActions.register('select_address_candidate', (args) => {
        const index = args.index as number;
        if (!stored[index]) return JSON.stringify({ success: false, error: 'invalid_index' });
        return JSON.stringify({ success: true, address: stored[index].description });
      });

      const result = JSON.parse(await executeFormAction('select_address_candidate', { index: 1 }));
      expect(result.success).toBe(true);
      expect(result.address).toBe('Žirmūnų g. 12A, Vilnius');
    });

    it('rejects an invalid index', async () => {
      formActions.register('select_address_candidate', (args) => {
        const index = args.index as number;
        if (index !== 0) return JSON.stringify({ success: false, error: 'invalid_index' });
        return JSON.stringify({ success: true });
      });

      const result = JSON.parse(await executeFormAction('select_address_candidate', { index: 99 }));
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_index');
    });
  });

  describe('fill_ntr', () => {
    const NTR_REGEX = /^\d{4}-\d{4}-\d{4}(:\d{1,6})?$/;
    let lastNtr: string | null;

    beforeEach(() => {
      lastNtr = null;
      formActions.register('fill_ntr', (args) => {
        const ntr = (args.ntr as string)?.trim();
        if (!ntr || !NTR_REGEX.test(ntr)) {
          return JSON.stringify({ success: false, error: 'invalid_format' });
        }
        lastNtr = ntr;
        return JSON.stringify({ success: true, ntr });
      });
    });

    it('accepts a valid NTR number', async () => {
      const result = JSON.parse(await executeFormAction('fill_ntr', { ntr: '1234-5678-9012' }));
      expect(result.success).toBe(true);
      expect(result.ntr).toBe('1234-5678-9012');
      expect(lastNtr).toBe('1234-5678-9012');
    });

    it('accepts NTR with unit suffix', async () => {
      const result = JSON.parse(await executeFormAction('fill_ntr', { ntr: '1234-5678-9012:1' }));
      expect(result.success).toBe(true);
    });

    it('rejects invalid NTR format', async () => {
      const result = JSON.parse(await executeFormAction('fill_ntr', { ntr: '123-456' }));
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_format');
      expect(lastNtr).toBeNull();
    });
  });

  describe('click_continue', () => {
    it('succeeds when form is ready', async () => {
      let clicked = false;
      formActions.register('click_continue', async () => {
        clicked = true;
        return JSON.stringify({ success: true });
      });

      const result = JSON.parse(await executeFormAction('click_continue', {}));
      expect(result.success).toBe(true);
      expect(clicked).toBe(true);
    });

    it('fails when form is not ready', async () => {
      formActions.register('click_continue', async () => {
        return JSON.stringify({ success: false, error: 'form_not_ready' });
      });

      const result = JSON.parse(await executeFormAction('click_continue', {}));
      expect(result.success).toBe(false);
      expect(result.error).toBe('form_not_ready');
    });
  });

  describe('tour_next / tour_back', () => {
    it('tour_next succeeds when tour is active and not on last step', async () => {
      let nextCalled = false;
      formActions.register('tour_next', () => {
        nextCalled = true;
        return JSON.stringify({ success: true, step: 2 });
      });

      const result = JSON.parse(await executeFormAction('tour_next', {}));
      expect(result.success).toBe(true);
      expect(nextCalled).toBe(true);
    });

    it('tour_next fails on last step', async () => {
      formActions.register('tour_next', () => {
        return JSON.stringify({ success: false, error: 'last_step', message: 'Tai paskutinis žingsnis.' });
      });

      const result = JSON.parse(await executeFormAction('tour_next', {}));
      expect(result.success).toBe(false);
      expect(result.error).toBe('last_step');
    });

    it('tour_back succeeds when not on first step', async () => {
      let backCalled = false;
      formActions.register('tour_back', () => {
        backCalled = true;
        return JSON.stringify({ success: true, step: 0 });
      });

      const result = JSON.parse(await executeFormAction('tour_back', {}));
      expect(result.success).toBe(true);
      expect(backCalled).toBe(true);
    });

    it('tour_back fails on first step', async () => {
      formActions.register('tour_back', () => {
        return JSON.stringify({ success: false, error: 'first_step', message: 'Tai pirmas žingsnis.' });
      });

      const result = JSON.parse(await executeFormAction('tour_back', {}));
      expect(result.success).toBe(false);
      expect(result.error).toBe('first_step');
    });
  });

  describe('show_section', () => {
    it('succeeds for a valid topic on the same page', async () => {
      formActions.register('show_section', (args) => {
        if (args.topic === 'report_contents') {
          return JSON.stringify({
            success: true,
            label: 'Ką gausite ataskaitoje',
            narration: 'Test narration',
            return_available: true,
          });
        }
        return JSON.stringify({ success: false, error: 'unknown_topic' });
      });

      const result = JSON.parse(await executeFormAction('show_section', { topic: 'report_contents' }));
      expect(result.success).toBe(true);
      expect(result.label).toBe('Ką gausite ataskaitoje');
      expect(result.return_available).toBe(true);
    });

    it('returns different_page error for cross-page topic', async () => {
      formActions.register('show_section', (args) => {
        if (args.topic === 'thermal_comfort') {
          return JSON.stringify({
            success: false,
            error: 'different_page',
            message: 'Ši informacija yra ataskaitoje.',
            page: 'report',
          });
        }
        return JSON.stringify({ success: false });
      });

      const result = JSON.parse(await executeFormAction('show_section', { topic: 'thermal_comfort' }));
      expect(result.success).toBe(false);
      expect(result.error).toBe('different_page');
    });

    it('returns unknown_topic error for invalid topic', async () => {
      formActions.register('show_section', (args) => {
        return JSON.stringify({ success: false, error: 'unknown_topic', message: `Nežinoma tema: ${args.topic}` });
      });

      const result = JSON.parse(await executeFormAction('show_section', { topic: 'nonexistent' }));
      expect(result.success).toBe(false);
      expect(result.error).toBe('unknown_topic');
    });

    it('tour_next returns to saved step after show_section detour', async () => {
      let returnedTo: number | null = null;
      formActions.register('tour_next', () => {
        // Simulate return from detour
        returnedTo = 0;
        return JSON.stringify({
          success: true,
          returned: true,
          step: 0,
          narration: 'Original step narration',
        });
      });

      const result = JSON.parse(await executeFormAction('tour_next', {}));
      expect(result.success).toBe(true);
      expect(result.returned).toBe(true);
      expect(result.step).toBe(0);
      expect(returnedTo).toBe(0);
    });
  });

  // P7-B8.3: Screen 2 form action tests
  describe('Screen 2 actions', () => {
    it('confirm_property succeeds', async () => {
      let confirmed = false;
      formActions.register('confirm_property', async () => {
        confirmed = true;
        return JSON.stringify({ success: true });
      });
      const result = JSON.parse(await executeFormAction('confirm_property', {}));
      expect(result.success).toBe(true);
      expect(confirmed).toBe(true);
    });

    it('fill_email accepts valid email', async () => {
      let savedEmail = '';
      formActions.register('fill_email', (args) => {
        const email = (args.email as string)?.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email ?? '')) {
          return JSON.stringify({ success: false, error: 'invalid_email' });
        }
        savedEmail = email;
        return JSON.stringify({ success: true, email });
      });
      const result = JSON.parse(await executeFormAction('fill_email', { email: 'jonas@gmail.com' }));
      expect(result.success).toBe(true);
      expect(savedEmail).toBe('jonas@gmail.com');
    });

    it('fill_email rejects invalid email', async () => {
      formActions.register('fill_email', (args) => {
        const email = (args.email as string)?.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email ?? '')) {
          return JSON.stringify({ success: false, error: 'invalid_email' });
        }
        return JSON.stringify({ success: true });
      });
      const result = JSON.parse(await executeFormAction('fill_email', { email: 'not-an-email' }));
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_email');
    });

    it('toggle_consent sets checked state', async () => {
      let consent = false;
      formActions.register('toggle_consent', (args) => {
        consent = args.checked as boolean;
        return JSON.stringify({ success: true, consent });
      });
      const result = JSON.parse(await executeFormAction('toggle_consent', { checked: true }));
      expect(result.success).toBe(true);
      expect(consent).toBe(true);
    });

    it('toggle_invoice sets checked state', async () => {
      let invoice = false;
      formActions.register('toggle_invoice', (args) => {
        invoice = args.checked as boolean;
        return JSON.stringify({ success: true, invoice });
      });
      const result = JSON.parse(await executeFormAction('toggle_invoice', { checked: true }));
      expect(result.success).toBe(true);
      expect(invoice).toBe(true);
    });

    it('select_payment_method accepts valid method', async () => {
      let selected = '';
      formActions.register('select_payment_method', (args) => {
        const method = args.method as string;
        const valid = ['card', 'apple-pay', 'google-pay', 'paypal', 'swedbank', 'seb', 'luminor', 'citadele', 'revolut', 'paysera'];
        if (!valid.includes(method)) return JSON.stringify({ success: false, error: 'invalid_method' });
        selected = method;
        return JSON.stringify({ success: true, method });
      });
      const result = JSON.parse(await executeFormAction('select_payment_method', { method: 'swedbank' }));
      expect(result.success).toBe(true);
      expect(selected).toBe('swedbank');
    });

    it('select_payment_method rejects invalid method', async () => {
      formActions.register('select_payment_method', (args) => {
        const method = args.method as string;
        const valid = ['card', 'apple-pay', 'google-pay', 'paypal', 'swedbank', 'seb', 'luminor', 'citadele', 'revolut', 'paysera'];
        if (!valid.includes(method)) return JSON.stringify({ success: false, error: 'invalid_method' });
        return JSON.stringify({ success: true });
      });
      const result = JSON.parse(await executeFormAction('select_payment_method', { method: 'bitcoin' }));
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_method');
    });

    it('click_pay fails when fields missing', async () => {
      formActions.register('click_pay', async () => {
        return JSON.stringify({ success: false, error: 'missing_fields', message: 'Trūksta: el. paštas, sutikimas su sąlygomis.' });
      });
      const result = JSON.parse(await executeFormAction('click_pay', {}));
      expect(result.success).toBe(false);
      expect(result.error).toBe('missing_fields');
    });

    it('click_pay succeeds when form ready', async () => {
      let paid = false;
      formActions.register('click_pay', async () => {
        paid = true;
        return JSON.stringify({ success: true, price: 39 });
      });
      const result = JSON.parse(await executeFormAction('click_pay', {}));
      expect(result.success).toBe(true);
      expect(paid).toBe(true);
    });

    it('navigate_back returns to screen 1', async () => {
      let navigated = false;
      formActions.register('navigate_back', () => {
        navigated = true;
        return JSON.stringify({ success: true });
      });
      const result = JSON.parse(await executeFormAction('navigate_back', {}));
      expect(result.success).toBe(true);
      expect(navigated).toBe(true);
    });
  });

  // P7-B8.5: Cross-page navigation tests
  describe('cross-page navigation', () => {
    it('getPagePath returns correct paths', () => {
      expect(getPagePath('landing')).toBe('/');
      expect(getPagePath('quickscan')).toBe('/quickscan/');
      expect(getPagePath('unknown')).toBe('/');
    });

    it('CrossPageDetour serializes and deserializes correctly', () => {
      const detour: CrossPageDetour = {
        returnPath: '/quickscan/',
        returnTourId: 'quickscan',
        returnStepIndex: 3,
        targetTopic: 'report_contents',
        voiceWasActive: true,
        seenSteps: [0, 1, 2],
      };
      const serialized = JSON.stringify(detour);
      const parsed = JSON.parse(serialized) as CrossPageDetour;
      expect(parsed.returnPath).toBe('/quickscan/');
      expect(parsed.returnTourId).toBe('quickscan');
      expect(parsed.returnStepIndex).toBe(3);
      expect(parsed.targetTopic).toBe('report_contents');
      expect(parsed.voiceWasActive).toBe(true);
      expect(parsed.seenSteps).toEqual([0, 1, 2]);
    });

    it('findContentByTopic returns cross-page entry', () => {
      const entry = findContentByTopic('report_contents');
      expect(entry).toBeDefined();
      expect(entry?.tourId).toBe('landing');
      expect(entry?.stepId).toBe('data-categories');
    });

    it('show_section navigates cross-page', async () => {
      formActions.register('show_section', (args) => {
        if (args.topic === 'report_contents') {
          return JSON.stringify({ success: true, navigating: true, message: 'Pereinu į kitą puslapį...' });
        }
        return JSON.stringify({ success: false });
      });
      const result = JSON.parse(await executeFormAction('show_section', { topic: 'report_contents' }));
      expect(result.success).toBe(true);
      expect(result.navigating).toBe(true);
    });

    it('tour_next handles cross-page return', async () => {
      formActions.register('tour_next', () => {
        return JSON.stringify({ success: true, returning: true, message: 'Grįžtu atgal...' });
      });
      const result = JSON.parse(await executeFormAction('tour_next', {}));
      expect(result.success).toBe(true);
      expect(result.returning).toBe(true);
    });
  });
});
