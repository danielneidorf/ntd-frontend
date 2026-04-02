// P7-A8: Construction permits from Infostatyba — async enrichment display

export interface Permit {
  project_name: string | null;
  construction_type: string | null;
  building_name: string | null;
  document_type: string | null;
  document_status: string | null;
  document_date: string | null;
  ntr_number: string | null;
  address: string | null;
  purpose: string | null;
}

export default function ConstructionPermits({
  permits,
  loading,
}: {
  permits: Permit[];
  loading: boolean;
}) {
  if (!loading && permits.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
      <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">
        Statybos leidimai ir dokumentai (Infostatyba)
      </h2>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {permits.map((p, i) => (
            <div key={i} className="border-l-2 border-slate-200 pl-4 py-1">
              <p className="text-base font-medium text-[#1E3A5F]">
                {p.project_name || p.building_name || 'Statybos dokumentas'}
              </p>
              <div className="text-sm text-slate-500 space-y-0.5 mt-1">
                {p.construction_type && <p>{p.construction_type}</p>}
                <p>
                  {p.document_type}
                  {p.document_status && (
                    <span
                      className={`ml-2 text-xs font-medium px-1.5 py-0.5 rounded ${
                        p.document_status === 'Galiojantis'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {p.document_status}
                    </span>
                  )}
                  {p.document_date && (
                    <span className="ml-2 text-slate-400">
                      {new Date(p.document_date).toLocaleDateString('lt-LT')}
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
          <p className="text-xs text-slate-400 mt-2">
            Šaltinis: Infostatyba (IS) / data.gov.lt
          </p>
        </div>
      )}
    </div>
  );
}
