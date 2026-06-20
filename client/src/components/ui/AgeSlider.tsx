import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "../../lib/utils"

export interface AgeSliderProps {
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export const AgeSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  AgeSliderProps
>(({ value, onValueChange, min = 18, max = 80, step = 1, className, ...props }, ref) => {
  return (
    <div className={cn("space-y-4 w-full", className)}>
      <SliderPrimitive.Root
        ref={ref}
        className="relative flex items-center select-none touch-none w-full h-5 cursor-pointer"
        value={value}
        onValueChange={(val) => onValueChange(val as [number, number])}
        min={min}
        max={max}
        step={step}
        minStepsBetweenThumbs={1}
        {...props}
      >
        <SliderPrimitive.Track className="relative grow h-1.5 rounded-full bg-outline-variant/20">
          <SliderPrimitive.Range className="absolute bg-lustre-purple h-full rounded-full" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className="block w-5 h-5 bg-white border-2 border-lustre-purple rounded-full shadow-[var(--shadow-card)] hover:scale-110 focus:outline-none focus:ring-2 focus:ring-lustre-purple transition-all cursor-grab active:cursor-grabbing"
          aria-label="Minimum Age"
        />
        <SliderPrimitive.Thumb
          className="block w-5 h-5 bg-white border-2 border-lustre-purple rounded-full shadow-[var(--shadow-card)] hover:scale-110 focus:outline-none focus:ring-2 focus:ring-lustre-purple transition-all cursor-grab active:cursor-grabbing"
          aria-label="Maximum Age"
        />
      </SliderPrimitive.Root>
    </div>
  )
})
AgeSlider.displayName = "AgeSlider"
