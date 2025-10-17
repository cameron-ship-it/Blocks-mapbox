import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface Step {
  id: string;
  label: string;
}

export interface ProgressStepperProps {
  steps: Step[];
  currentStep: string;
  onStepClick?: (stepId: string) => void;
  className?: string;
}

/**
 * ProgressStepper - Minimal horizontal breadcrumb-style progress indicator
 * 
 * Features:
 * - Current step highlighted with bold weight
 * - Completed steps shown with check icon
 * - Clean text-based design inspired by Linear
 */
export const ProgressStepper: React.FC<ProgressStepperProps> = ({
  steps,
  currentStep,
  onStepClick,
  className,
}) => {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <div className={cn("w-full", className)} data-testid="progress-stepper">
      <div className="flex items-center justify-center gap-3">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = step.id === currentStep;
          const isClickable = onStepClick && (isCompleted || isCurrent);

          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => isClickable && onStepClick?.(step.id)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center gap-1.5 transition-colors text-sm",
                  isClickable && "cursor-pointer hover:text-foreground",
                  !isClickable && "cursor-default"
                )}
                data-testid={`step-${step.id}`}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isCompleted && (
                  <Check className="h-3.5 w-3.5 text-primary" data-testid={`check-${step.id}`} />
                )}
                <span
                  className={cn(
                    "transition-all",
                    isCurrent && "text-foreground font-semibold",
                    isCompleted && "text-muted-foreground font-normal",
                    !isCompleted && !isCurrent && "text-muted-foreground/50 font-normal"
                  )}
                >
                  {step.label}
                </span>
              </button>

              {index < steps.length - 1 && (
                <span className="text-muted-foreground/30 select-none">/</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
