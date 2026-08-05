/**
 * The offer under a missing winter rating — rendered, never decided.
 *
 * The report page does not know which failures deserve a free rebuild, does
 * not know whether one has already been spent, and does not write the sentence
 * either. It renders the object the backend serves, or nothing at all. These
 * tests drive the three states the backend can hand it.
 *
 * The sentence itself is served too: until this commit the web report and the
 * PDF each carried their own hand-written copy of it, and the two had already
 * drifted. The local map stays as the default for reports stored before the
 * field existed.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ReportViewer from '../../ReportViewer';
import { DEV_MOCKS } from '../mockReportData';

const BASE = JSON.parse(JSON.stringify(DEV_MOCKS['dev-existing']));

function reportWith(overrides: Record<string, unknown>) {
  const data = JSON.parse(JSON.stringify(BASE));
  data.block1.winter = {
    ...data.block1.winter,
    level: 'NOT_ASSESSED',
    not_assessed_reason: 'technical_error',
    not_assessed_message_lt:
      'Šio pastato energinio naudingumo sertifikato nepavyko pasiekti registre generuojant ataskaitą, todėl žiemos komforto neįvertinome.',
  };
  return { ...data, ...overrides };
}

function stubReport(data: unknown) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (String(url).includes('/v1/reports/')) {
      return new Response(JSON.stringify({ ok: true, data }));
    }
    return new Response(JSON.stringify({ ok: true, data: {} }));
  }));
}

beforeEach(() => {
  vi.unstubAllGlobals();
  // ReportViewer reads its token from the path, not from a prop.
  window.history.pushState({}, '', '/report/tok');
});

describe('the free-rebuild offer on a failed report', () => {
  it('★ shows the served sentence and the button when the backend offers one', async () => {
    stubReport(reportWith({
      recourse: {
        kind: 'recalc_pass',
        state: 'offer',
        sentence_lt: 'Perskaičiuosime nemokamai: sertifikatą galėsite įkelti arba įvesti jo numerį.',
        action_label_lt: 'Užsakyti nemokamą perskaičiavimą',
        mint_path: '/v1/reports/tok/recalc-pass',
      },
    }));

    render(<ReportViewer />);

    await waitFor(() =>
      expect(screen.getByText(/nepavyko pasiekti registre/)).toBeInTheDocument(),
    );
    expect(screen.getByText('Užsakyti nemokamą perskaičiavimą')).toBeInTheDocument();
  });

  it('shows the rebuilt report instead once the pass has been spent', async () => {
    stubReport(reportWith({
      recourse: {
        kind: 'recalc_pass',
        state: 'rebuilt',
        sentence_lt: 'Šią ataskaitą jau perskaičiavome — naujoji ataskaita yra čia.',
        action_label_lt: 'Atverti perskaičiuotą ataskaitą',
        report_url: 'https://ntd.lt/report/rebuilt-token',
      },
    }));

    render(<ReportViewer />);

    const link = await screen.findByText('Atverti perskaičiuotą ataskaitą');
    expect(link.getAttribute('href')).toBe('https://ntd.lt/report/rebuilt-token');
    expect(screen.queryByText('Užsakyti nemokamą perskaičiavimą')).not.toBeInTheDocument();
  });

  it('★ offers nothing when the backend offers nothing', async () => {
    stubReport(reportWith({}));

    render(<ReportViewer />);

    await waitFor(() =>
      expect(screen.getByText(/nepavyko pasiekti registre/)).toBeInTheDocument(),
    );
    expect(screen.queryByText('Užsakyti nemokamą perskaičiavimą')).not.toBeInTheDocument();
    expect(document.querySelector('[data-winter-recourse]')).toBeNull();
  });

  it('falls back to the local sentence for a report stored before the field existed', async () => {
    const data = reportWith({});
    delete data.block1.winter.not_assessed_message_lt;
    data.block1.winter.not_assessed_reason = 'new_build_no_epc_yet';
    stubReport(data);

    render(<ReportViewer />);

    await waitFor(() =>
      expect(screen.getByText(/Naujam pastatui dar nėra/)).toBeInTheDocument(),
    );
  });
});
