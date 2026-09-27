"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "@base-ui/react/slider"
import { cn } from "@/lib/utils"

function Slider({
  className,
  defaultValue = [0],
  value,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  disabled = false,
  ...props
}: {
  className?: string
  defaultValue?: number | number[]
  value?: number | number[]
  min?: number
  max?: number
  step?: number
  onValueChange?: (value: number | number[]) => void
  disabled?: boolean
  [key: string]: any
}) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      value={value}
      defaultValue={defaultValue}
      min={min}
      max={max}
      step={step}
      onValueChange={onValueChange}
      disabled={disabled}
      className={cn(
        "relative flex w-full touch-none select-none items-center data-[disabled]:opacity-50 data-[disabled]:pointer-events-none py-1.5",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full items-center cursor-pointer py-1">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-secondary/80 dark:bg-muted"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="absolute h-full bg-primary rounded-full"
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          className="block size-4.5 rounded-full border-2 border-primary bg-background shadow-md ring-offset-background transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing"
        />
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
