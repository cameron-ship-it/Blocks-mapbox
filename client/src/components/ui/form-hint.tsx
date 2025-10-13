import * as React from "react";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface FormHintProps {
  children: React.ReactNode;
  tooltip?: string;
  className?: string;
}

/**
 * FormHint - Helper text with optional info tooltip
 * 
 * Displays small helper text below form fields.
 * Optionally shows an info icon with tooltip for additional context.
 */
export const FormHint: React.FC<FormHintProps> = ({
  children,
  tooltip,
  className,
}) => {
  return (
    <div className={cn("flex items-center gap-1.5 text-sm text-muted-foreground", className)}>
      <span data-testid="hint-text">{children}</span>
      {tooltip && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex hover-elevate rounded-full p-0.5"
              data-testid="hint-tooltip-trigger"
            >
              <Info className="h-3.5 w-3.5" />
              <span className="sr-only">More information</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs" data-testid="hint-tooltip-content">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};
