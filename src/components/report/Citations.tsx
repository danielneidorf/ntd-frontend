// P7-A3.3: Citations section — LST ISO 690 format, dynamic based on snapshot
import type { ReportData } from './mockReportData';

type Snapshot = ReportData['block1']['inputs_snapshot'];

function buildCitations(
  snapshot: Snapshot,
  generatedAt: string,
  glazingSource: string | null
): string[] {
  const date = new Date(generatedAt).toLocaleDateString('lt-LT');
  const citations: string[] = [];
  const isLand = snapshot.evaluation_target === 'land_only';

  // NTR — always
  citations.push(
    `VĮ REGISTRŲ CENTRAS. Nekilnojamojo turto registras: objekto duomenys [interaktyvus]. Vilnius: VĮ Registrų centras [žiūrėta ${date}]. Prieiga per internetą: https://www.registrucentras.lt`
  );

  // PENS or customer EPC
  const src = snapshot.epc_source_class.toUpperCase();
  if (src === 'REGISTRY') {
    citations.push(
      `VĮ REGISTRŲ CENTRAS. Pastatų energinio naudingumo sertifikatų registras (PENS): energinio naudingumo sertifikatas [interaktyvus]. Vilnius: VĮ Registrų centras [žiūrėta ${date}]. Prieiga per internetą: https://www.registrucentras.lt`
    );
  } else if (src === 'USER') {
    citations.push(
      `Kliento pateikti duomenys: energinė klasė ir (arba) metinės energijos sąnaudos. Pateikta užsakymo metu, ${date}.`
    );
  }

  // STR — heated buildings only
  if (!isLand) {
    citations.push(
      `Lietuvos Respublikos aplinkos ministerija. Statybos techninis reglamentas STR 2.01.02:2016 „Pastatų energinio naudingumo projektavimas ir sertifikavimas". Vilnius, 2016.`
    );
  }

  // EPC studies — if glazing typology defaults were used
  const usedTypology =
    glazingSource != null &&
    (glazingSource.toLowerCase().includes('numatytoji') ||
      glazingSource.toLowerCase().includes('tipolog'));

  if (!isLand && usedTypology) {
    citations.push(
      `BIEKŠA, D., ŠIUPŠINSKAS, G., MARTINAITIS, V. ir JARAMINIENĖ, E. Energy Efficiency Challenges in Multi-Apartment Building Renovation in Lithuania. Energies, 2024, t. 17, Nr. 3. ISSN 1996-1073.`
    );
    citations.push(
      `MALŪNAVIČIŪTĖ, R., et al. Analysis of Energy Performance Certificates for Single-Family and Duplex Residential Buildings in Lithuania. 2023.`
    );
    citations.push(
      `PUPEIKIS, D., MONSTVILAS, E. ir BIEKŠA, D. Analysis of Improvement in the Energy Efficiency of Office Buildings Based on Energy Performance Certificates. Buildings, 2024, t. 14, Nr. 9. ISSN 2075-5309.`
    );
  }

  // NTD baseline — always
  citations.push(
    `NT DUOMENYS. Vidaus klimato etalono bazė v2026.1: lyginamieji parametrai pagal pastato tipą ir statybos laikotarpį. Vilnius: NT Duomenys, 2026.`
  );

  return citations;
}

export default function Citations({
  snapshot,
  generatedAt,
  glazingSource,
}: {
  snapshot: Snapshot;
  generatedAt: string;
  glazingSource: string | null;
}) {
  const citations = buildCitations(snapshot, generatedAt, glazingSource);

  return (
    <section className="mt-10 border-t border-gray-200 pt-6">
      <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">Šaltiniai</h2>
      <ol className="list-none space-y-3 m-0 p-0">
        {citations.map((text, i) => (
          <li key={i} className="text-sm text-slate-600 leading-relaxed pl-8 -indent-8">
            <span className="font-medium text-slate-500">[{i + 1}]</span>{' '}
            {text}
          </li>
        ))}
      </ol>
    </section>
  );
}
