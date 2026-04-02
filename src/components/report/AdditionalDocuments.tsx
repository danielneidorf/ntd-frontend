// P7-A6: Additional documents and sources — links to official Lithuanian registries

const LINKS = [
  {
    label: 'Kadastro duomenų byla ir aukštų planai',
    helper:
      'Savininkai gali užsisakyti detalų aukštų planą, eksplikaciją ir kadastro bylą. Kaina: 0,58–9,27\u00a0€. Pristatoma per 1\u00a0d.\u00a0d.',
    url: 'https://www.registrucentras.lt/savitarna',
  },
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
    label: 'Teritorijų planavimo dokumentai',
    helper: 'Detalieji ir bendrieji planai, specialieji planai, žemėtvarkos projektai.',
    url: 'https://external.tpdr.lt/?formId=tpsearch',
  },
  {
    label: 'Nekilnojamojo turto registras',
    helper: 'Viešai prieinami registro duomenys apie nekilnojamąjį turtą.',
    url: 'https://www.registrucentras.lt/ntr/',
  },
];

export default function AdditionalDocuments() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
      <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-5">
        Papildomi dokumentai ir šaltiniai
      </h2>
      <div className="space-y-4">
        {LINKS.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 group no-underline"
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
    </div>
  );
}
