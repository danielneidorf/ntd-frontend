// P7-B1 / P7-B2: Tour state machine hook with step skipping + MutationObserver waiting
import { useState, useEffect, useCallback, useRef } from 'react';
import type { TourStep, TourState } from './types';

function stepIsValid(step: TourStep): boolean {
  if (step.skipIf?.()) return false;
  // Support comma-separated selectors — valid if at least one exists
  const selectors = step.selector.split(',').map((s) => s.trim());
  return selectors.some((sel) => !!document.querySelector(sel));
}

// Find the next valid step index, searching forward from `from`
function findNextValid(steps: TourStep[], from: number): number | null {
  for (let i = from; i < steps.length; i++) {
    if (stepIsValid(steps[i])) return i;
  }
  return null;
}

// Find the previous valid step index, searching backward from `from`
function findPrevValid(steps: TourStep[], from: number): number | null {
  for (let i = from; i >= 0; i--) {
    if (stepIsValid(steps[i])) return i;
  }
  return null;
}

export default function useTour(steps: TourStep[]) {
  const [state, setState] = useState<TourState>({
    active: false,
    currentStep: 0,
    steps,
  });

  // Keep state.steps in sync when the steps prop changes (e.g. report tour built async)
  const stepsRef = useRef(steps);
  useEffect(() => {
    stepsRef.current = steps;
    setState((s) => ({ ...s, steps }));
  }, [steps]);

  // MutationObserver: watches for a missing step's element to appear
  const waitingIndexRef = useRef<number | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  const scrollToTarget = useCallback((selector: string, behavior: ScrollLogicalPosition = 'center') => {
    // Support comma-separated selectors — scroll to center the union of all elements
    const selectors = selector.split(',').map((s) => s.trim());
    const elements = selectors.map((s) => document.querySelector(s)).filter(Boolean) as Element[];
    if (elements.length === 0) return;

    if (elements.length === 1) {
      elements[0].scrollIntoView({ behavior: 'smooth', block: behavior });
      return;
    }

    // Compute union bounding box and scroll its center into view
    let top = Infinity, bottom = -Infinity;
    for (const el of elements) {
      const r = el.getBoundingClientRect();
      top = Math.min(top, r.top);
      bottom = Math.max(bottom, r.bottom);
    }
    const unionCenter = window.scrollY + top + (bottom - top) / 2;
    const viewportCenter = window.innerHeight / 2;
    window.scrollTo({ top: unionCenter - viewportCenter, behavior: 'smooth' });
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
      if (document.querySelector(selector)) {
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
    const currentSteps = stepsRef.current;
    const first = findNextValid(currentSteps, 0);
    if (first === null) return; // no valid steps at all
    setState({ active: true, currentStep: first, steps: currentSteps });
    const step = currentSteps[first];
    if (step) {
      setTimeout(() => scrollToTarget(step.selector, step.scrollBehavior ?? 'center'), 100);
    }
  }, [scrollToTarget]);

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
      if (!document.querySelector(s.steps[index].selector)) return s;
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

  // Proactive DOM watching while tour is active:
  // 1. If the next step's element appears → auto-advance (e.g. payment methods grid)
  // 2. If the current step's element disappears → find nearest valid step
  //    (e.g. user clicks "Ne, ieškoti kito" → Screen 2 unmounts, go back to Screen 1)
  useEffect(() => {
    if (!state.active) return;
    const currentIdx = state.currentStep;
    const currentStep = steps[currentIdx];
    if (!currentStep) return;

    // Check if the next step is currently absent — only auto-advance if it was absent and then appears
    const nextIdx = currentIdx + 1;
    const nextWasAbsent = nextIdx < steps.length && !stepIsValid(steps[nextIdx]);

    const observer = new MutationObserver(() => {
      // Case 1: current step's element disappeared or became invalid
      if (!stepIsValid(currentStep)) {
        // First try forward — if a later step is valid, advance
        const forward = findNextValid(steps, currentIdx + 1);
        if (forward !== null) {
          observer.disconnect();
          goToValidStep(forward);
          return;
        }
        // No forward step — try backward (e.g. Screen 2→1 revert via "Ne, ieškoti kito")
        // But only if the current step's DOM element is completely gone (not just skipIf)
        const elementGone = !document.querySelector(currentStep.selector);
        if (elementGone) {
          const backward = findNextValid(steps, 0);
          if (backward !== null && backward !== currentIdx) {
            observer.disconnect();
            goToValidStep(backward);
            return;
          }
        }
        // No valid steps in either direction — end tour + clear guide mode
        observer.disconnect();
        sessionStorage.removeItem('ntd-guide-mode');
        stop();
        return;
      }

      // Case 2: next step's element appeared (was absent, now exists) — auto-advance
      // Only triggers if the next step was absent when the observer was created
      if (nextWasAbsent && nextIdx < steps.length) {
        const nextStep = steps[nextIdx];
        if (nextStep && stepIsValid(nextStep)) {
          observer.disconnect();
          goToValidStep(nextIdx);
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [state.active, state.currentStep, steps, goToValidStep]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  // Count visible steps (valid = element exists + not skipped)
  const visibleStepCount = state.active
    ? steps.filter((s) => stepIsValid(s)).length
    : steps.length;

  // Compute visible step number (1-based index among visible steps)
  const visibleStepNumber = state.active
    ? steps.slice(0, state.currentStep + 1).filter((s) => stepIsValid(s)).length
    : 1;

  return { state, start, stop, next, back, goToStep, visibleStepCount, visibleStepNumber };
}
