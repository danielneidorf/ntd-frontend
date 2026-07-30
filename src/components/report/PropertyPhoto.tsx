// P7-A9: Property hero photo — Google Street View with graceful fallback
import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.PUBLIC_API_BASE ?? 'http://127.0.0.1:8100';
const MAPS_KEY = import.meta.env.PUBLIC_GOOGLE_MAPS_KEY ?? '';

// The <img> URL is built HERE, client-side, from a referrer-restricted PUBLIC
// key — the backend returns only {available, heading}, so the server Places key
// never reaches the browser. A referrer-restricted key needs no URL signature.
function streetViewImageUrl(lat: number, lng: number, heading: number | null): string {
  return (
    `https://maps.googleapis.com/maps/api/streetview?size=800x400` +
    `&location=${lat},${lng}&heading=${heading ?? 0}&pitch=10&fov=90&key=${MAPS_KEY}`
  );
}

export interface StreetViewData {
  available: boolean;
  heading: number | null;
}

export default function PropertyPhoto({
  lat,
  lng,
  address,
  devToken,
}: {
  lat: number;
  lng: number;
  address: string;
  devToken?: string;
}) {
  const [result, setResult] = useState<StreetViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    // Dev mock: availability only — the URL is built at render, like production.
    if (devToken === 'dev-existing' && MAPS_KEY) {
      setResult({ available: true, heading: 0 });
      setLoading(false);
      return;
    }
    if (devToken === 'dev-land') {
      setResult({ available: false, heading: null });
      setLoading(false);
      return;
    }

    // Real API fetch — backend returns {available, heading, lat, lng}; we build the URL.
    fetch(`${API_BASE}/v1/enrichment/streetview?lat=${lat}&lng=${lng}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setResult({ available: !!data.available, heading: data.heading ?? null });
        else setResult({ available: false, heading: null });
      })
      .catch(() => setResult({ available: false, heading: null }))
      .finally(() => setLoading(false));
  }, [lat, lng]);

  if (loading) {
    return <div className="w-full aspect-[2/1] bg-slate-100 rounded-xl animate-pulse" />;
  }

  // Need availability AND a key to build the URL client-side.
  if (!result?.available || !MAPS_KEY || imgError) return null;

  return (
    <div>
      {/* h-auto (not a fixed height + object-cover): letterbox the 2:1 image so
          Google's baked-in credit at the bottom is never clipped (§3.2.2(b)). */}
      <img
        src={streetViewImageUrl(lat, lng, result.heading)}
        alt={`Gatvės vaizdas: ${address}`}
        className="w-full h-auto rounded-xl"
        onError={() => setImgError(true)}
      />
      <div className="flex items-center justify-between mt-1.5">
        <a
          href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}${result.heading != null ? `&heading=${result.heading}` : ''}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-base font-medium text-[#0D7377] hover:underline"
        >
          Apžiūrėti Google Street View aplinkoje ↗
        </a>
        <span className="text-xs text-slate-400">Gatvės vaizdas · Google Street View</span>
      </div>
    </div>
  );
}
