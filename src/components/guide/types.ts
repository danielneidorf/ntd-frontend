// P7-B1: AI Guide shared types

export interface TourStep {
  id: string;
  /** CSS selector for the primary target element, or multiple selectors separated by commas */
  selector: string;
  narration: string;
  position?: 'above' | 'below' | 'left' | 'right' | 'auto';
  animation?: 'pulse' | 'ring' | 'arrow' | 'sequence';
  scrollBehavior?: ScrollLogicalPosition;
  /** If provided and returns true, this step is skipped */
  skipIf?: () => boolean;
}

export interface TourState {
  active: boolean;
  currentStep: number;
  steps: TourStep[];
}

export type GuideMode = 'self' | 'guided' | 'voice';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
