import { useState, type ReactNode } from 'react';

// The ONE title for every „what we based this on" surface, both blocks, both
// surfaces (ruling 2026-07-25). Kept character-identical to the backend's
// INFO_SECTION_TITLE_LT (bustodnr block2/templates_lt.py) — a backend test reads
// this file and pins the two equal (the register-name / forecast-title pattern).
// It retires three older titles (Block 1's + Block 2's assumptions box both read
// „Iš ko remiamės…", the data-sources box read „Duomenų šaltiniai"). → B8-4.
export const INFO_SECTION_TITLE = 'Kokia informacija remiamės?';

/** The ONE collapsible info-section idiom — Block 1's basis box and Block 2's
 *  merged section both use it, so they read as siblings (one icon, one chevron,
 *  one default). Collapsed by default on the web (ruling 2026-07-25); the PDF
 *  renders the full body unconditionally, so whoever keeps the document keeps
 *  the complete one.
 *
 *  The header carries a clear clickable affordance — background, hover, chevron,
 *  a ≥44px hit target — because when collapsed it is the section's only visible
 *  trace (the selector-panel lesson: a control that doesn't look like one gets
 *  missed). */
export function InfoSection({
  title = INFO_SECTION_TITLE,
  defaultOpen = false,
  children,
}: {
  title?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div data-info-section className="mb-6">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full text-left cursor-pointer bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 min-h-[44px] hover:bg-slate-100 transition-colors"
      >
        <span className="text-base" aria-hidden="true">&#9432;</span>
        <span className="text-base font-medium text-[#1E3A5F]">{title}</span>
        <span
          className="ml-auto text-[12px] text-slate-400 transition-transform duration-200"
          style={{ display: 'inline-block', transform: open ? 'rotate(90deg)' : 'rotate(0)' }}
          aria-hidden="true"
        >
          &#9654;
        </span>
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? '3000px' : '0', opacity: open ? 1 : 0 }}
      >
        {children}
      </div>
    </div>
  );
}
