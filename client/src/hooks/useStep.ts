import { useState, useCallback } from 'react';

export type WizardStep = 'budget' | 'borough' | 'neighborhood' | 'map' | 'review';

const STEPS: WizardStep[] = ['budget', 'borough', 'neighborhood', 'map', 'review'];

export interface UseStepReturn {
  currentStep: WizardStep;
  currentStepIndex: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  next: () => void;
  back: () => void;
  goTo: (step: WizardStep | number) => void;
  canProceed: (validator?: () => boolean) => boolean;
  reset: () => void;
}

/**
 * useStep Hook
 * 
 * Manages wizard step navigation with validation support.
 * Provides guarded transitions that can validate before moving forward.
 * 
 * @param initialStep - The starting step (defaults to 'budget')
 * @returns Step management utilities
 */
export function useStep(initialStep: WizardStep = 'budget'): UseStepReturn {
  const [currentStep, setCurrentStep] = useState<WizardStep>(initialStep);
  
  const currentStepIndex = STEPS.indexOf(currentStep);
  const totalSteps = STEPS.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  /**
   * Move to the next step
   */
  const next = useCallback(() => {
    if (!isLastStep) {
      setCurrentStep(STEPS[currentStepIndex + 1]);
      // Scroll to top on step change
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStepIndex, isLastStep]);

  /**
   * Move to the previous step
   */
  const back = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep(STEPS[currentStepIndex - 1]);
      // Scroll to top on step change
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStepIndex, isFirstStep]);

  /**
   * Jump to a specific step
   */
  const goTo = useCallback((step: WizardStep | number) => {
    if (typeof step === 'number') {
      if (step >= 0 && step < totalSteps) {
        setCurrentStep(STEPS[step]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      if (STEPS.includes(step)) {
        setCurrentStep(step);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [totalSteps]);

  /**
   * Check if user can proceed (with optional validation)
   */
  const canProceed = useCallback((validator?: () => boolean) => {
    if (validator) {
      return validator();
    }
    return true;
  }, []);

  /**
   * Reset to initial step
   */
  const reset = useCallback(() => {
    setCurrentStep(initialStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [initialStep]);

  return {
    currentStep,
    currentStepIndex,
    totalSteps,
    isFirstStep,
    isLastStep,
    next,
    back,
    goTo,
    canProceed,
    reset,
  };
}
