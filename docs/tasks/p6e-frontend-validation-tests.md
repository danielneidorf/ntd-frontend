# P6-E: Frontend Test Infrastructure + Validation Tests

## What
Set up Vitest + @testing-library/react in the NTD frontend repo (`~/dev/ntd`) and write 6 validation tests specified in Phase 6 Section 6.2.

## Why / Context
The frontend repo has zero test infrastructure. The Phase 6 plan requires frontend validation tests that verify input validation, button state, and conditional field visibility — all critical for preventing bad data from reaching the backend. These are pure logic/component tests, not browser tests.

## How

### 1. Install test dependencies

```bash
cd ~/dev/ntd
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### 2. Configure Vitest

Create `vitest.config.ts` in the repo root:

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@astrojs/react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
```

Create `src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom';
```

### 3. Add test script to package.json

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

### 4. Write validation utility tests

The validation logic likely lives in (or should be extracted to) pure utility functions that the React components call. If validation is currently inline in components, extract it first into `src/utils/validation.ts`:

```typescript
// src/utils/validation.ts

/** NTR unique number format: XXXX-XXXX-XXXX or similar registry pattern */
export function isValidNtr(value: string): boolean { ... }

/** Basic email format validation */
export function isValidEmail(value: string): boolean { ... }

/** Screen 1: can the user proceed? */
export function isScreen1Valid(caseType: string | null, locationProvided: boolean): boolean { ... }

/** EPC card: is year required given current field state? */
export function isEpcYearRequired(energyClass: string | null, yearUnknownChecked: boolean): boolean { ... }

/** Screen 2/3: can the user click the payment button? */
export function isPaymentEnabled(emailValid: boolean, consentChecked: boolean): boolean { ... }
```

If these functions already exist somewhere in the components, import them. If they're inline, extract them as a prerequisite step.

### 5. Write the 6 tests

Create `src/utils/validation.test.ts` (or `src/components/__tests__/` if testing component rendering):

**Test F1: NTR format validation catches invalid formats**

```typescript
describe('NTR validation', () => {
  it('accepts valid NTR format XXXX-XXXX-XXXX', () => {
    expect(isValidNtr('4400-1234-5678')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidNtr('')).toBe(false);
  });

  it('rejects too-short input', () => {
    expect(isValidNtr('4400-123')).toBe(false);
  });

  it('rejects letters in numeric positions', () => {
    expect(isValidNtr('ABCD-EFGH-IJKL')).toBe(false);
  });

  it('rejects input without dashes', () => {
    expect(isValidNtr('440012345678')).toBe(false);
  });
});
```

Adjust the valid format pattern to match whatever the frontend currently enforces (check the NTR input component for the regex).

**Test F2: "Tęsti" button disabled until case + location valid**

```typescript
describe('Screen 1 submit readiness', () => {
  it('is invalid when no case type selected', () => {
    expect(isScreen1Valid(null, true)).toBe(false);
  });

  it('is invalid when no location provided', () => {
    expect(isScreen1Valid('existing_object', false)).toBe(false);
  });

  it('is valid when case type selected AND location provided', () => {
    expect(isScreen1Valid('existing_object', true)).toBe(true);
  });

  it('is valid for new_build_project with location', () => {
    expect(isScreen1Valid('new_build_project', true)).toBe(true);
  });
});
```

If the validation is deeply embedded in React state and can't be easily extracted, test the component instead:

```typescript
import { render, screen } from '@testing-library/react';
// import the Screen1 component or the submit button component
// render it with various props, assert button disabled state
```

**Test F3: EPC card — class filled + year_unknown unchecked → year required**

```typescript
describe('EPC card year requirement', () => {
  it('year required when class is selected and year_unknown is unchecked', () => {
    expect(isEpcYearRequired('A++', false)).toBe(true);
  });

  it('year NOT required when year_unknown is checked', () => {
    expect(isEpcYearRequired('A++', true)).toBe(false);
  });

  it('year NOT required when no class selected', () => {
    expect(isEpcYearRequired(null, false)).toBe(false);
  });

  it('year NOT required when class is empty string', () => {
    expect(isEpcYearRequired('', false)).toBe(false);
  });
});
```

**Test F4: Email validation catches invalid formats**

```typescript
describe('Email validation', () => {
  it('accepts valid email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('accepts email with subdomain', () => {
    expect(isValidEmail('user@mail.example.lt')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('rejects missing @', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
  });

  it('rejects missing domain', () => {
    expect(isValidEmail('user@')).toBe(false);
  });

  it('rejects missing local part', () => {
    expect(isValidEmail('@example.com')).toBe(false);
  });
});
```

**Test F5: Consent checkbox unchecked → payment button disabled**

```typescript
describe('Payment button enablement', () => {
  it('disabled when consent unchecked', () => {
    expect(isPaymentEnabled(true, false)).toBe(false);
  });

  it('disabled when email invalid', () => {
    expect(isPaymentEnabled(false, true)).toBe(false);
  });

  it('disabled when both invalid', () => {
    expect(isPaymentEnabled(false, false)).toBe(false);
  });

  it('enabled when email valid AND consent checked', () => {
    expect(isPaymentEnabled(true, true)).toBe(true);
  });
});
```

**Test F6: Invoice fields toggle visibility**

This one likely needs component rendering to test conditional display:

```typescript
describe('Invoice fields visibility', () => {
  it('invoice fields hidden when checkbox unchecked', () => {
    // Render the payment/invoice component with invoiceRequested=false
    // Assert company name, invoice email fields are NOT in the document
  });

  it('invoice fields shown when checkbox checked', () => {
    // Render with invoiceRequested=true
    // Assert company name, invoice email fields ARE in the document
  });

  it('company fields shown only for Juridinis asmuo', () => {
    // Render with invoiceRequested=true, entityType='juridinis'
    // Assert pavadinimas, kodas, PVM fields are present
  });

  it('company fields hidden for Fizinis asmuo', () => {
    // Render with invoiceRequested=true, entityType='fizinis'
    // Assert pavadinimas, kodas, PVM fields are NOT present
  });
});
```

### 6. Adapt to actual component structure

The test patterns above assume validation functions can be extracted or already exist. When implementing:

1. First check if validation logic is already in separate functions — use them directly
2. If validation is inline in React components, extract to `src/utils/validation.ts` first, then import in both the component and the test
3. For F6 (invoice toggle), component rendering with @testing-library/react is likely necessary — import the actual React component and render with different props

### 7. Verify

```bash
cd ~/dev/ntd
npm test
```

All 6 test files should pass. Also verify the Astro build still works:

```bash
npm run build
```

## Constraints
- Do NOT break the Astro build — Vitest config must coexist with Astro config
- Do NOT test backend API calls — these are pure validation/UI logic tests
- Use jsdom environment (lightweight, no real browser needed)
- Extract validation logic into pure functions where possible — makes tests simpler and components cleaner
- Test file naming: `*.test.ts` for pure logic, `*.test.tsx` for component rendering
- Match the NTR format regex to whatever the frontend currently uses (check the NTR input component)

## Files to touch
- `package.json` — add dev dependencies + test scripts
- `vitest.config.ts` — NEW: Vitest configuration
- `src/test/setup.ts` — NEW: test setup (jest-dom matchers)
- `src/utils/validation.ts` — NEW or refactored: extracted validation functions
- `src/utils/validation.test.ts` — NEW: tests F1–F5 (pure logic)
- `src/components/__tests__/InvoiceFields.test.tsx` — NEW: test F6 (component rendering)

## Run after
```bash
cd ~/dev/ntd
npm test
```
Target: 6 test suites, all passing. Plus `npm run build` still succeeds.