"use client";

import * as React from "react";
import { Slider } from "@/components/ui/slider";
import { formatIDR, cn } from "@/lib/utils";

export interface TherapistShareSliderProps {
  label: string;
  totalAmount: number;
  therapistShare: number; // in IDR
  onChange: (shareAmount: number) => void;
  therapistName?: string;
  isEn?: boolean;
  className?: string;
}

/**
 * Clean & responsive slider allocation component for Transport Fee & Additional Charge.
 * Allows setting percentage (0-100% with step 1) or direct rupiah amount with live therapist/management breakdown.
 */
export const TherapistShareSlider: React.FC<TherapistShareSliderProps> = ({
  label,
  totalAmount,
  therapistShare,
  onChange,
  therapistName,
  isEn = false,
  className,
}) => {
  if (totalAmount <= 0) return null;

  // Percentage from 0 to 100
  const percentage = Math.max(
    0,
    Math.min(100, Math.round((therapistShare / totalAmount) * 100))
  );

  const managementShare = Math.max(0, totalAmount - therapistShare);

  const handleSliderChange = (val: number | number[]) => {
    const p = Array.isArray(val) ? val[0] : val;
    const computed = Math.round((totalAmount * p) / 100);
    onChange(computed);
  };

  const handleCustomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value) || 0;
    const clamped = Math.max(0, Math.min(totalAmount, val));
    onChange(clamped);
  };

  return (
    <div
      className={cn(
        "p-2.5 rounded-lg bg-background/80 border border-border/70 space-y-2 text-xs",
        className
      )}
    >
      {/* Top Header: Label, Percentage Badge, and Breakdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
          <span>{label}</span>
          {therapistName ? (
            <span className="font-semibold text-foreground">({therapistName})</span>
          ) : null}
          <span className="font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10 text-[10.5px]">
            {percentage}%
          </span>
        </span>
        <div className="flex items-center gap-1.5 text-[10.5px]">
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {isEn ? "Therapist" : "Terapis"}: {formatIDR(therapistShare)}
          </span>
          <span className="text-muted-foreground/40">|</span>
          <span className="text-muted-foreground">
            {isEn ? "Office" : "Manajemen"}: {formatIDR(managementShare)}
          </span>
        </div>
      </div>

      {/* Slider with Step 1 & Inline Rupiah Input */}
      <div className="flex items-center gap-3 pt-0.5">
        <div className="flex-1 px-1">
          <Slider
            value={percentage}
            min={0}
            max={100}
            step={1}
            onValueChange={handleSliderChange}
          />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] text-muted-foreground font-medium">Rp:</span>
          <input
            type="number"
            step={1000}
            min={0}
            max={totalAmount}
            value={therapistShare}
            onChange={handleCustomInput}
            className="w-24 h-6 text-[10.5px] font-semibold px-1.5 text-right bg-background border border-border/80 rounded focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
    </div>
  );
};
