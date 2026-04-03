// P7-B1: Tour state machine hook
import { useState, useEffect, useCallback } from 'react';
import type { TourStep, TourState } from './types';

export default function useTour(steps: TourStep[]) {
  const [state, setState] = useState<TourState>({
    active: false,
    currentStep: 0,
    steps,
  });

  const scrollToTarget = useCallback((selector: string, behavior: ScrollLogicalPosition = 'center') => {
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: behavior });
    }
  }, []);

  const start = useCallback(() => {
    setState({ active: true, currentStep: 0, steps });
    const step = steps[0];
    if (step) {
      setTimeout(() => scrollToTarget(step.selector, step.scrollBehavior ?? 'center'), 100);
    }
  }, [steps, scrollToTarget]);

  const stop = useCallback(() => {
    setState((s) => ({ ...s, active: false, currentStep: 0 }));
  }, []);

  const next = useCallback(() => {
    setState((s) => {
      if (s.currentStep >= s.steps.length - 1) {
        return { ...s, active: false, currentStep: 0 };
      }
      const nextStep = s.currentStep + 1;
      const step = s.steps[nextStep];
      if (step) {
        setTimeout(() => scrollToTarget(step.selector, step.scrollBehavior ?? 'center'), 100);
      }
      return { ...s, currentStep: nextStep };
    });
  }, [scrollToTarget]);

  const back = useCallback(() => {
    setState((s) => {
      if (s.currentStep <= 0) return s;
      const prevStep = s.currentStep - 1;
      const step = s.steps[prevStep];
      if (step) {
        setTimeout(() => scrollToTarget(step.selector, step.scrollBehavior ?? 'center'), 100);
      }
      return { ...s, currentStep: prevStep };
    });
  }, [scrollToTarget]);

  const goToStep = useCallback((index: number) => {
    setState((s) => {
      if (index < 0 || index >= s.steps.length) return s;
      const step = s.steps[index];
      if (step) {
        setTimeout(() => scrollToTarget(step.selector, step.scrollBehavior ?? 'center'), 100);
      }
      return { ...s, currentStep: index };
    });
  }, [scrollToTarget]);

  // Keyboard navigation
  useEffect(() => {
    if (!state.active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stop();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.active, next, back, stop]);

  return { state, start, stop, next, back, goToStep };
}
