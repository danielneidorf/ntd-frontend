// P7-A7: Property location map — Google Maps satellite view with optional OSM building contour
import { useEffect, useRef, useState } from 'react';

const MAPS_KEY = import.meta.env.PUBLIC_GOOGLE_MAPS_KEY ?? '';

function loadGoogleMaps(callback: () => void) {
  if ((window as any).google?.maps) {
    callback();
    return;
  }
  const existing = document.querySelector(
    'script[src*="maps.googleapis.com/maps/api/js"]'
  );
  if (existing) {
    existing.addEventListener('load', callback);
    return;
  }
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}`;
  script.async = true;
  script.onload = callback;
  document.head.appendChild(script);
}

async function fetchBuildingContour(
  lat: number,
  lng: number
): Promise<{ lat: number; lng: number }[] | null> {
  try {
    const query = `[out:json][timeout:5];way["building"](around:50,${lat},${lng});out geom;`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();

    let bestWay: any = null;
    let bestDist = Infinity;
    for (const el of data.elements ?? []) {
      if (el.type !== 'way' || !el.geometry?.length) continue;
      const cx = el.geometry.reduce((s: number, n: any) => s + n.lat, 0) / el.geometry.length;
      const cy = el.geometry.reduce((s: number, n: any) => s + n.lon, 0) / el.geometry.length;
      const dist = Math.hypot(cx - lat, cy - lng);
      if (dist < bestDist) {
        bestDist = dist;
        bestWay = el;
      }
    }
    if (!bestWay) return null;
    return bestWay.geometry.map((p: any) => ({ lat: p.lat, lng: p.lon }));
  } catch {
    return null;
  }
}

export default function PropertyMap({
  lat,
  lng,
  address,
}: {
  lat: number;
  lng: number;
  address: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const fullscreenMapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const fullscreenMapInstanceRef = useRef<any>(null);
  const contourRef = useRef<{ lat: number; lng: number }[] | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!MAPS_KEY || !mapRef.current) {
      setFailed(true);
      return;
    }

    const timer = setTimeout(() => {
      if (!loaded) setFailed(true);
    }, 10000);

    loadGoogleMaps(() => {
      clearTimeout(timer);
      if (!mapRef.current || mapInstanceRef.current) return;

      const google = (window as any).google;
      const map = new google.maps.Map(mapRef.current, {
        center: { lat, lng },
        zoom: 18,
        mapTypeId: google.maps.MapTypeId.HYBRID,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        gestureHandling: 'cooperative',
      });

      new google.maps.Marker({
        map,
        position: { lat, lng },
        title: address,
      });

      mapInstanceRef.current = map;
      setLoaded(true);

      fetchBuildingContour(lat, lng).then((polygon) => {
        contourRef.current = polygon;
        if (!polygon || !mapInstanceRef.current) return;
        new google.maps.Polygon({
          map: mapInstanceRef.current,
          paths: polygon,
          strokeColor: '#0D7377',
          strokeOpacity: 0.7,
          strokeWeight: 2,
          fillColor: '#0D7377',
          fillOpacity: 0.15,
        });
      });
    });

    return () => clearTimeout(timer);
  }, [lat, lng]);

  // Initialize fullscreen map when overlay opens
  useEffect(() => {
    if (!fullscreen || !fullscreenMapRef.current || fullscreenMapInstanceRef.current) return;

    const google = (window as any).google;
    if (!google?.maps) return;

    const map = new google.maps.Map(fullscreenMapRef.current, {
      center: { lat, lng },
      zoom: 18,
      mapTypeId: google.maps.MapTypeId.HYBRID,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      gestureHandling: 'greedy',
    });

    new google.maps.Marker({
      map,
      position: { lat, lng },
      title: address,
    });

    if (contourRef.current) {
      new google.maps.Polygon({
        map,
        paths: contourRef.current,
        strokeColor: '#0D7377',
        strokeOpacity: 0.7,
        strokeWeight: 2,
        fillColor: '#0D7377',
        fillOpacity: 0.15,
      });
    }

    fullscreenMapInstanceRef.current = map;

    return () => {
      fullscreenMapInstanceRef.current = null;
    };
  }, [fullscreen]);

  // Close on Escape
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  if (failed) return null;

  return (
    <>
      {/* Inline map */}
      <div className="relative mb-5" data-guide="property-map">
        <div
          ref={mapRef}
          className="w-full h-[400px] rounded-lg overflow-hidden"
        />
        {loaded && (
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className="absolute top-3 right-3 bg-white/90 hover:bg-white text-[#1E3A5F] text-sm font-medium px-3 py-1.5 rounded shadow-md cursor-pointer border border-gray-200 transition-colors"
          >
            Padidinti
          </button>
        )}
      </div>

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center">
          <div className="relative w-[95vw] h-[90vh] rounded-xl overflow-hidden">
            <div ref={fullscreenMapRef} className="w-full h-full" />
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white text-[#1E3A5F] text-base font-medium px-4 py-2 rounded-lg shadow-lg cursor-pointer border border-gray-200 transition-colors z-10"
            >
              Uždaryti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
