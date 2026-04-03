// P7-B1: AI Guide shared types

export interface TourStep {
  id: string;
  selector: string;
  narration: string;
  position?: 'above' | 'below' | 'left' | 'right' | 'auto';
  animation?: 'pulse' | 'ring' | 'arrow' | 'sequence';
  scrollBehavior?: ScrollLogicalPosition;
}

export interface TourState {
  active: boolean;
  currentStep: number;
  steps: TourStep[];
}

export type GuideMode = 'self' | 'guided' | 'voice';
