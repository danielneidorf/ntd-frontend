// P7-A6.1: Split documents — public sources vs owner/institution access

const PUBLIC_LINKS = [
  {
    label: 'Kadastro žemėlapis (REGIA)',
    helper: 'Žemės sklypų ribos, pastatų kontūrai ir adresai interaktyviame žemėlapyje.',
    url: 'https://www.regia.lt/lt/zemelapis/',
  },
  {
    label: 'Statybos leidimai (Infostatyba)',
    helper: 'Statybos leidimai, projektiniai pasiūlymai ir statybos dokumentacija šiuo adresu.',
    url: 'https://infostatyba.planuojustatau.lt/',
  },
  {
    label: 'Teritorijų planavimo dokumentai (TPDR)',
    helper: 'Detalieji ir bendrieji planai, specialieji planai, žemėtvarkos projektai.',
    url: 'https://external.tpdr.lt/?formId=tpsearch',
  },
];

const OWNER_LINKS = [
  {
    label: 'Kadastro duomenų byla ir aukštų planai',
    helper:
      'Savininkai gali užsisakyti detalų aukštų planą, eksplikaciją ir kadastro bylą. Kaina: 0,58–9,27\u00a0€. Pristatoma per 1\u00a0d.\u00a0d.',
    url: 'https://www.registrucentras.lt/savitarna',
  },
  {
    label: 'Nekilnojamojo turto registras',
    helper: 'Išsamūs registro duomenys: savininkai, suvaržymai, sandorių istorija ir kita teisinė informacija.',
    url: 'https://www.registrucentras.lt/savitarna',
  },
];

function LinkList({ links }: { links: typeof PUBLIC_LINKS }) {
  return (
    <div className="space-y-4">
      {links.map((link) => (
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
            <p className="text-sm text-slate-500 mt-0.5">{link.helper}</p>
          </div>
        </a>
      ))}
    </div>
  );
}

export function PublicDocuments() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 md:p-8" data-guide="public-documents">
      <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-5">
        Vieši šaltiniai
      </h2>
      <LinkList links={PUBLIC_LINKS} />
    </div>
  );
}

export function OwnerDocuments() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 md:p-8" data-guide="owner-documents">
      <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-2">
        Savininko prieiga
      </h2>
      <p className="text-xs text-slate-400 mb-5">
        Šiems dokumentams reikalinga Registrų centro savitarnos paskyra (savininko arba įgalioto asmens prieiga).
      </p>
      <LinkList links={OWNER_LINKS} />
    </div>
  );
}

// Keep default export for backwards compatibility
export default function AdditionalDocuments() {
  return (
    <>
      <PublicDocuments />
      <OwnerDocuments />
    </>
  );
}
