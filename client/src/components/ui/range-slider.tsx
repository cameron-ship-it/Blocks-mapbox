import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

export interface RangeSliderProps
  extends Omit<React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>, "value" | "onValueChange" | "onChange"> {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatValue?: (value: number) => string;
  ariaLabel?: [string, string];
}

/**
 * RangeSlider - Dual handle slider with numeric chips
 * 
 * Features:
 * - Dual handles for range selection
 * - Numeric chips above each thumb
 * - Gradient track behind selected range
 * - Keyboard accessible with ARIA labels
 * - Prevents handles from crossing
 */
export const RangeSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  RangeSliderProps
>(({ 
  className, 
  min, 
  max, 
  step = 1, 
  value, 
  onChange, 
  formatValue = (v) => v.toString(),
  ariaLabel = ["Minimum value", "Maximum value"],
  ...props 
}, ref) => {
  // Prevent handles from crossing by clamping values
  const handleValueChange = (newValue: number[]) => {
    if (newValue.length === 2) {
      const [newMin, newMax] = newValue;
      // Ensure min is always less than or equal to max
      const clampedMin = Math.min(newMin, newMax - step);
      const clampedMax = Math.max(newMax, newMin + step);
      onChange([clampedMin, clampedMax] as [number, number]);
    }
  };

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      min={min}
      max={max}
      step={step}
      value={value}
      onValueChange={handleValueChange}
      minStepsBetweenThumbs={1}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range 
          className="absolute h-full" 
          style={{
            background: 'linear-gradient(90deg, hsl(var(--ink)) 0%, hsl(var(--accent)) 100%)'
          }}
        />
      </SliderPrimitive.Track>
      
      {/* First thumb (min) */}
      <SliderPrimitive.Thumb 
        className="relative block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        aria-label={ariaLabel[0]}
        data-testid="slider-thumb-min"
      >
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <div className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground tabular-nums shadow-card">
            {formatValue(value[0])}
          </div>
        </div>
      </SliderPrimitive.Thumb>
      
      {/* Second thumb (max) */}
      <SliderPrimitive.Thumb 
        className="relative block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        aria-label={ariaLabel[1]}
        data-testid="slider-thumb-max"
      >
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <div className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground tabular-nums shadow-card">
            {formatValue(value[1])}
          </div>
        </div>
      </SliderPrimitive.Thumb>
    </SliderPrimitive.Root>
  );
});

RangeSlider.displayName = "RangeSlider";
