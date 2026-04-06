// P7-B1 / P7-B2: Tour state machine hook with step skipping + MutationObserver waiting
import { useState, useEffect, useCallback, useRef } from 'react';
import type { TourStep, TourState } from './types';

function elementExists(selector: string): boolean {
  return !!document.querySelector(selector);
}

// Find the next valid step index (element exists in DOM), searching forward from `from`
function findNextValid(steps: TourStep[], from: number): number | null {
  for (let i = from; i < steps.length; i++) {
    if (elementExists(steps[i].selector)) return i;
  }
  return null;
}

// Find the previous valid step index, searching backward from `from`
function findPrevValid(steps: TourStep[], from: number): number | null {
  for (let i = from; i >= 0; i--) {
    if (elementExists(steps[i].selector)) return i;
  }
  return null;
}

export default function useTour(steps: TourStep[]) {
  const [state, setState] = useState<TourState>({
    active: false,
    currentStep: 0,
    steps,
  });

  // MutationObserver: watches for a missing step's element to appear
  const waitingIndexRef = useRef<number | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  const scrollToTarget = useCallback((selector: string, behavior: ScrollLogicalPosition = 'center') => {
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: behavior });
    }
  }, []);

  const goToValidStep = useCallback((index: number) => {
    const step = steps[index];
    if (step) {
      setTimeout(() => scrollToTarget(step.selector, step.scrollBehavior ?? 'center'), 100);
    }
    setState((s) => ({ ...s, currentStep: index }));
  }, [steps, scrollToTarget]);

  // Start watching for a missing element to appear
  const startWaiting = useCallback((stepIndex: number) => {
    waitingIndexRef.current = stepIndex;
    if (observerRef.current) observerRef.current.disconnect();

    const selector = steps[stepIndex]?.selector;
    if (!selector) return;

    const observer = new MutationObserver(() => {
      if (elementExists(selector)) {
        observer.disconnect();
        observerRef.current = null;
        waitingIndexRef.current = null;
        goToValidStep(stepIndex);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    observerRef.current = observer;
  }, [steps, goToValidStep]);

  const start = useCallback(() => {
    const first = findNextValid(steps, 0);
    if (first === null) return; // no valid steps at all
    setState({ active: true, currentStep: first, steps });
    const step = steps[first];
    if (step) {
      setTimeout(() => scrollToTarget(step.selector, step.scrollBehavior ?? 'center'), 100);
    }
  }, [steps, scrollToTarget]);

  const stop = useCallback(() => {
    setState((s) => ({ ...s, active: false, currentStep: 0 }));
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    waitingIndexRef.current = null;
  }, []);

  const next = useCallback(() => {
    setState((s) => {
      const nextValid = findNextValid(s.steps, s.currentStep + 1);
      if (nextValid !== null) {
        const step = s.steps[nextValid];
        if (step) {
          setTimeout(() => scrollToTarget(step.selector, step.scrollBehavior ?? 'center'), 100);
        }
        return { ...s, currentStep: nextValid };
      }
      // No valid forward step found — check if there are more steps ahead (just not in DOM yet)
      if (s.currentStep + 1 < s.steps.length) {
        // Enter waiting state for the next step's element to appear
        startWaiting(s.currentStep + 1);
        return s; // stay on current step
      }
      // Truly at the end
      return { ...s, active: false, currentStep: 0 };
    });
  }, [scrollToTarget, startWaiting]);

  const back = useCallback(() => {
    setState((s) => {
      if (s.currentStep <= 0) return s;
      const prevValid = findPrevValid(s.steps, s.currentStep - 1);
      if (prevValid === null) return s;
      const step = s.steps[prevValid];
      if (step) {
        setTimeout(() => scrollToTarget(step.selector, step.scrollBehavior ?? 'center'), 100);
      }
      return { ...s, currentStep: prevValid };
    });
  }, [scrollToTarget]);

  const goToStep = useCallback((index: number) => {
    setState((s) => {
      if (index < 0 || index >= s.steps.length) return s;
      if (!elementExists(s.steps[index].selector)) return s;
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

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  // Count visible steps (elements that exist in the DOM)
  const visibleStepCount = state.active
    ? steps.filter((s) => elementExists(s.selector)).length
    : steps.length;

  // Compute visible step number (1-based index among visible steps)
  const visibleStepNumber = state.active
    ? steps.slice(0, state.currentStep + 1).filter((s) => elementExists(s.selector)).length
    : 1;

  return { state, start, stop, next, back, goToStep, visibleStepCount, visibleStepNumber };
}
