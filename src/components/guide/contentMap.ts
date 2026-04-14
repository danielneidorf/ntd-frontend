// P7-B8.4: Content map — topic → tour step for show-don't-tell navigation.

export interface ContentMapEntry {
  topic: string;
  tourId: string;
  stepId: string;
  label: string;
}

export const CONTENT_MAP: ContentMapEntry[] = [
  // Landing page
  {
    topic: 'report_contents',
    tourId: 'landing',
    stepId: 'data-categories',
    label: 'Ką gausite ataskaitoje',
  },
  {
    topic: 'pricing',
    tourId: 'landing',
    stepId: 'pricing',
    label: 'Kaina',
  },
  {
    topic: 'how_it_works',
    tourId: 'landing',
    stepId: 'how-it-works',
    label: 'Kaip tai veikia',
  },
  {
    topic: 'situations',
    tourId: 'landing',
    stepId: 'cta',
    label: 'Situacijos, kurioms tinka ataskaita',
  },

  // Report page
  {
    topic: 'thermal_comfort',
    tourId: 'report',
    stepId: 'climate-assessment',
    label: 'Šiluminis komfortas',
  },
  {
    topic: 'energy_costs',
    tourId: 'report',
    stepId: 'drivers',
    label: 'Energijos sąnaudos',
  },
  {
    topic: 'permits',
    tourId: 'report',
    stepId: 'permits',
    label: 'Statybos leidimai',
  },
];

export function findContentByTopic(topic: string): ContentMapEntry | undefined {
  return CONTENT_MAP.find((e) => e.topic === topic);
}

// P7-B8.5: Cross-page navigation helpers

export interface CrossPageDetour {
  returnPath: string;
  returnTourId: string;
  returnStepIndex: number;
  targetTopic: string;
  voiceWasActive: boolean;
  seenSteps: number[];
}

export function getPagePath(tourId: string): string {
  switch (tourId) {
    case 'landing':
      return '/';
    case 'quickscan':
      return '/quickscan/';
    default:
      return '/';
  }
}
