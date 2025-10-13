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
 * ProgressStepper - Horizontal step indicator
 * 
 * Features:
 * - Current step highlighted in Accent
 * - Completed steps in Ink
 * - Future steps in Gray-3
 * - Optional click navigation with onStepClick
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
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = step.id === currentStep;
          const isFuture = index > currentIndex;
          const isClickable = onStepClick && (isCompleted || isCurrent);

          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => isClickable && onStepClick?.(step.id)}
                disabled={!isClickable}
                className={cn(
                  "group flex flex-col items-center gap-2 transition-opacity",
                  isClickable && "cursor-pointer",
                  !isClickable && "cursor-default"
                )}
                data-testid={`step-${step.id}`}
                aria-current={isCurrent ? "step" : undefined}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                    isCompleted && "border-ink bg-ink text-white",
                    isCurrent && "border-primary bg-primary text-white scale-110",
                    isFuture && "border-gray-3 bg-transparent text-muted-foreground",
                    isClickable && "hover:scale-105"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" data-testid={`check-${step.id}`} />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>

                <span
                  className={cn(
                    "text-xs font-medium transition-colors hidden sm:block",
                    isCurrent && "text-foreground",
                    isCompleted && "text-foreground",
                    isFuture && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </button>

              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 transition-colors",
                    index < currentIndex && "bg-ink",
                    index >= currentIndex && "bg-gray-3"
                  )}
                  data-testid={`connector-${index}`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
