/**
 * PropertyMap — the FIRST tests for this component (untested before Stream 1).
 * Regression guard over §0b (ODbL): the „© OpenStreetMap contributors" credit
 * must render whenever the OSM building outline is drawn — and must NOT render
 * when no OSM data is shown. A light google.maps stub + a mocked Overpass
 * response exercise the contour path in jsdom.
 */
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const LAT = 54.7008;
const LNG = 25.2993;

// loadGoogleMaps short-circuits when window.google.maps exists, so the map +
// polygon "draw" as no-op constructors — no external script, no real SDK.
function stubGoogleMaps() {
  (window as any).google = {
    maps: {
      Map: class { constructor() {} },
      Marker: class { constructor() {} },
      Polygon: class { constructor() {} },
      MapTypeId: { HYBRID: 'hybrid' },
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
  delete (window as any).google;
});

describe('PropertyMap — OSM attribution (ODbL, §0b regression guard)', () => {
  it('shows the „© OpenStreetMap contributors" credit once the outline draws', async () => {
    vi.stubEnv('PUBLIC_GOOGLE_MAPS_KEY', 'PUBLIC-REFERRER-KEY');
    stubGoogleMaps();
    // Overpass returns one building way whose geometry is a small ring.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          elements: [
            {
              type: 'way',
              geometry: [
                { lat: LAT, lon: LNG },
                { lat: LAT + 0.0002, lon: LNG },
                { lat: LAT + 0.0002, lon: LNG + 0.0002 },
                { lat: LAT, lon: LNG + 0.0002 },
              ],
            },
          ],
        }),
      }),
    );
    const { default: PropertyMap } = await import('../PropertyMap');

    render(<PropertyMap lat={LAT} lng={LNG} address="Žirmūnų g. 12" />);

    // The credit appears only after Overpass resolves + the polygon is drawn.
    const osm = await screen.findByText('OpenStreetMap');
    expect(osm.getAttribute('href')).toBe('https://www.openstreetmap.org/copyright');
    expect(osm.closest('p')?.textContent).toContain('contributors');
  });

  it('shows NO OSM credit when Overpass returns no building (no data → no attribution)', async () => {
    vi.stubEnv('PUBLIC_GOOGLE_MAPS_KEY', 'PUBLIC-REFERRER-KEY');
    stubGoogleMaps();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ elements: [] }) }),
    );
    const { default: PropertyMap } = await import('../PropertyMap');

    const { container } = render(<PropertyMap lat={LAT} lng={LNG} address="x" />);
    await new Promise((r) => setTimeout(r, 0)); // let the Overpass fetch resolve
    expect(container.textContent).not.toContain('OpenStreetMap');
  });
});
