// P7-A6.1: Split documents — public sources vs owner/institution access

// №15–18 — the four descriptions are SERVED, keyed by register. They existed
// only here until the gate: print carried the bare links with no explanation of
// what each register holds, so a customer reading the PDF was handed four URLs
// and no reason to click any of them. Each entry now names its served key and
// the component reads the sentence from `documents_lt`.
//
// The LABELS and URLs are deliberately still authored here — they are not in
// the ruled eighteen, and they diverge from the PDF's own (web „Kadastro
// žemėlapis (REGIA)" vs print „REGIA kadastro žemėlapis"; three of the URLs
// differ too). That divergence is REPORTED, not closed here: it needs a ruling
// on which form is right, and the extinction pin's allowlist carries it with
// that reason.
const PUBLIC_LINKS = [
  {
    key: 'regia',
    label: 'Kadastro žemėlapis (REGIA)',
    url: 'https://www.regia.lt/lt/zemelapis/',
  },
  {
    key: 'infostatyba',
    label: 'Statybos leidimai (Infostatyba)',
    url: 'https://infostatyba.planuojustatau.lt/',
  },
  {
    key: 'tpdr',
    label: 'Teritorijų planavimo dokumentai (TPDR)',
    url: 'https://external.tpdr.lt/?formId=tpsearch',
  },
];

const OWNER_LINKS = [
  {
    key: 'rc_savitarna',
    label: 'Kadastro duomenų byla ir aukštų planai',
    // Wave-2 A2: „0,58–9,27 €“ was stale. RC prices document-copy preparation
    // PER PAGE by format (1,45 €/psl. A4 … 2,02 €/psl. A0), so the honest form is a
    // FLOOR — the old range implied a ceiling that does not exist. Sourced by the
    // bibliography entry keyed `rc_fee` (VĮ Registrų centras, „…įkainiai: dokumentų
    // kopijų parengimas, tvirtinimas ir pateikimas“), which the backend emits on
    // every report — this line and that entry are one claim in two places.
    //
    // 2026-07-31: „Pateikiama per 1 d. d.“ was DROPPED. The cited page was read
    // at the primary and carries no delivery term at all — nine probes (darbo
    // dien / d. d. / terminas / per 1 / skubos / vykdymo / valandos …) all
    // negative. It states prices only, which it does confirm exactly: A4 1,45 €,
    // A3 1,53, A2 1,63, A1 1,80, A0 2,02, skaitmeninis rinkinys 1,84 €. A
    // turnaround promise no source supports is a promise we cannot keep.
    helper:
      'Savininkai gali užsisakyti detalų aukštų planą, eksplikaciją ir kadastro bylą. Kaina: nuo 1,45\u00a0€/psl. (dokumento kopija; priklauso nuo formato ir puslapių skaičiaus). Užsakoma internetu.',
    url: 'https://www.registrucentras.lt/savitarna',
  },
  {
    key: 'registru_centras',
    label: 'Nekilnojamojo turto registras',
    url: 'https://www.registrucentras.lt/savitarna',
  },
];

/** The served descriptions, keyed by register (№15–18). */
export type DocumentsLt = Record<string, string> | null | undefined;

type Link = { key: string; label: string; url: string; helper?: string };

function LinkList({ links, documentsLt }: { links: Link[]; documentsLt?: DocumentsLt }) {
  return (
    <div className="space-y-4">
      {links.map((link) => {
        // Served first; a locally-authored `helper` survives only where the
        // backend serves nothing (the owner-access fee line, which is not in
        // the ruled set). No served sentence and no local one ⇒ no paragraph,
        // never an empty one.
        const helper = documentsLt?.[link.key] ?? link.helper;
        return (
          <a
            key={link.url + link.label}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 py-2 group no-underline"
          >
            <span className="text-[#0D7377] mt-0.5 shrink-0" aria-hidden>
              &#8599;
            </span>
            <div>
              <span className="text-base font-medium text-[#1E3A5F] group-hover:underline">
                {link.label}
              </span>
              {helper && <p className="text-sm text-slate-500 mt-0.5">{helper}</p>}
            </div>
          </a>
        );
      })}
    </div>
  );
}

export function PublicDocuments({ documentsLt }: { documentsLt?: DocumentsLt }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 md:p-8" data-guide="public-documents">
      <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-5">
        Vieši šaltiniai
      </h2>
      <LinkList links={PUBLIC_LINKS} documentsLt={documentsLt} />
    </div>
  );
}

export function OwnerDocuments({ documentsLt }: { documentsLt?: DocumentsLt }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 md:p-8" data-guide="owner-documents">
      <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-2">
        Savininko prieiga
      </h2>
      <p className="text-xs text-slate-400 mb-5">
        Šiems dokumentams reikalinga Registrų centro savitarnos paskyra (savininko arba įgalioto asmens prieiga).
      </p>
      <LinkList links={OWNER_LINKS} documentsLt={documentsLt} />
    </div>
  );
}

// Keep default export for backwards compatibility
export default function AdditionalDocuments({ documentsLt }: { documentsLt?: DocumentsLt }) {
  return (
    <>
      <PublicDocuments documentsLt={documentsLt} />
      <OwnerDocuments documentsLt={documentsLt} />
    </>
  );
}
