/**
 * PropertyPhoto — the FIRST tests for this component (untested before Stream 1).
 * Guards the Street View key fix: the backend no longer returns an image URL;
 * the frontend builds it from a referrer-restricted PUBLIC key, so the server
 * Places key never reaches the browser. Also guards the crop fix (§3.2.2(b)) —
 * Google's baked-in credit must not be clipped by an object-cover crop.
 */
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const LAT = 54.7008;
const LNG = 25.2993;

function mockStreetview(payload: unknown) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('PropertyPhoto — Street View built client-side (no server key)', () => {
  it('builds the <img> URL from the PUBLIC key + backend heading; the wire carries no image_url', async () => {
    vi.stubEnv('PUBLIC_GOOGLE_MAPS_KEY', 'PUBLIC-REFERRER-KEY');
    // Backend returns availability + heading ONLY — never an image URL or key.
    mockStreetview({ available: true, heading: 42, lat: LAT, lng: LNG });
    const { default: PropertyPhoto } = await import('../PropertyPhoto');

    render(<PropertyPhoto lat={LAT} lng={LNG} address="Žirmūnų g. 12" />);

    const img = await screen.findByRole('img');
    const src = img.getAttribute('src') ?? '';
    expect(src).toContain('maps.googleapis.com/maps/api/streetview');
    expect(src).toContain(`location=${LAT},${LNG}`);
    expect(src).toContain('heading=42');
    // The security property: the URL is built from the referrer-restricted
    // PUBLIC key — no server Places key is involved.
    expect(src).toContain('key=PUBLIC-REFERRER-KEY');
    // Google's credit caption renders beneath the photo.
    expect(screen.getByText('Gatvės vaizdas · Google Street View')).toBeTruthy();
    // Crop fix: the fixed-height object-cover crop that clipped Google's
    // baked-in watermark is gone (§3.2.2(b)).
    expect(img.className).not.toContain('object-cover');
  });

  it('renders nothing when Street View is unavailable', async () => {
    vi.stubEnv('PUBLIC_GOOGLE_MAPS_KEY', 'PUBLIC-REFERRER-KEY');
    mockStreetview({ available: false, heading: null });
    const { default: PropertyPhoto } = await import('../PropertyPhoto');

    const { container } = render(<PropertyPhoto lat={LAT} lng={LNG} address="x" />);
    await new Promise((r) => setTimeout(r, 0)); // let the fetch effect resolve
    expect(container.querySelector('img')).toBeNull();
  });
});
