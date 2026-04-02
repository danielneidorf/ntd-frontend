// P7-A9: Property hero photo — Google Street View with graceful fallback
import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.PUBLIC_API_BASE ?? 'http://127.0.0.1:8100';
const MAPS_KEY = import.meta.env.PUBLIC_GOOGLE_MAPS_KEY ?? '';

export interface StreetViewData {
  available: boolean;
  image_url: string | null;
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
    // Dev mock: construct URL directly
    if (devToken === 'dev-existing' && MAPS_KEY) {
      setResult({
        available: true,
        image_url: `https://maps.googleapis.com/maps/api/streetview?size=800x400&location=${lat},${lng}&heading=0&pitch=10&fov=90&key=${MAPS_KEY}`,
        heading: 0,
      });
      setLoading(false);
      return;
    }
    if (devToken === 'dev-land') {
      setResult({ available: false, image_url: null, heading: null });
      setLoading(false);
      return;
    }

    // Real API fetch
    fetch(`${API_BASE}/v1/enrichment/streetview?lat=${lat}&lng=${lng}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setResult(data);
        else setResult({ available: false, image_url: null, heading: null });
      })
      .catch(() => setResult({ available: false, image_url: null, heading: null }))
      .finally(() => setLoading(false));
  }, [lat, lng]);

  if (loading) {
    return <div className="w-full h-[300px] bg-slate-100 rounded-xl animate-pulse" />;
  }

  if (!result?.available || !result.image_url || imgError) return null;

  return (
    <div>
      <img
        src={result.image_url}
        alt={`Gatvės vaizdas: ${address}`}
        className="w-full h-[300px] object-cover rounded-xl"
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
