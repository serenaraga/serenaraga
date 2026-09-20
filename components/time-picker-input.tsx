"use client";

import * as React from "react";
import { Clock, X } from "lucide-react";
import type { InputProps } from "ra-core";
import { useInput, FieldTitle, useResourceContext, useLocaleState } from "ra-core";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FormField, FormLabel, FormError } from "@/components/form";
import { InputHelperText } from "@/components/input-helper-text";
import { cn } from "@/lib/utils";

export type TimePickerInputProps = InputProps & {
  className?: string;
  helperText?: string;
  placeholder?: string;
  required?: boolean;
  isRequired?: boolean;
  minuteStep?: number;
};

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));

/**
 * Minimalist localized shadcn TimePicker input component for react-admin forms.
 */
export const TimePickerInput = (props: TimePickerInputProps) => {
  const resource = useResourceContext(props);
  const [locale] = useLocaleState();

  const defaultPlaceholder = locale === "en" ? "Select time" : "Pilih jam layanan";
  const hourLabel = locale === "en" ? "Hour" : "Jam";
  const minLabel = locale === "en" ? "Minute" : "Menit";

  const {
    label,
    source,
    className,
    helperText,
    placeholder = defaultPlaceholder,
    required,
    isRequired: isRequiredProp,
    minuteStep = 15,
    validate: _validateProp,
    format: _formatProp,
    ...rest
  } = props;

  const { id, field, isRequired } = useInput({
    ...props,
    isRequired: isRequiredProp ?? required,
  });

  const [open, setOpen] = React.useState(false);

  // Auto-sync defaultValue if field.value is empty on mount
  React.useEffect(() => {
    if (!field.value && props.defaultValue) {
      field.onChange(props.defaultValue);
    }
  }, [props.defaultValue]);

  // Minutes options (00, 15, 30, 45 by default or 5 min steps)
  const minutes = React.useMemo(() => {
    const list: string[] = [];
    for (let i = 0; i < 60; i += minuteStep) {
      list.push(String(i).padStart(2, "0"));
    }
    return list;
  }, [minuteStep]);

  // Parse current value ("HH:mm")
  const { currentHour, currentMinute } = React.useMemo(() => {
    const val = typeof field.value === "string" ? field.value.trim() : "";
    if (!val) return { currentHour: "", currentMinute: "" };
    const parts = val.split(":");
    return {
      currentHour: parts[0] ? parts[0].padStart(2, "0") : "",
      currentMinute: parts[1] ? parts[1].padStart(2, "0") : "00",
    };
  }, [field.value]);

  const hourRef = React.useRef<HTMLDivElement>(null);
  const minRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to selected items
  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        if (hourRef.current) {
          const selectedEl = hourRef.current.querySelector<HTMLElement>('[data-selected="true"]');
          if (selectedEl) {
            hourRef.current.scrollTop = selectedEl.offsetTop - hourRef.current.clientHeight / 2 + selectedEl.clientHeight / 2;
          }
        }
        if (minRef.current) {
          const selectedEl = minRef.current.querySelector<HTMLElement>('[data-selected="true"]');
          if (selectedEl) {
            minRef.current.scrollTop = selectedEl.offsetTop - minRef.current.clientHeight / 2 + selectedEl.clientHeight / 2;
          }
        }
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleSelectHour = (h: string) => {
    const m = currentMinute || "00";
    field.onChange(`${h}:${m}`);
  };

  const handleSelectMinute = (m: string) => {
    const h = currentHour || "09";
    field.onChange(`${h}:${m}`);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    field.onChange("");
  };

  const formattedTime = field.value
    ? locale === "en"
      ? field.value
      : `${field.value} WIB`
    : "";

  return (
    <FormField id={id} className={cn("w-full min-w-0", className)} name={field.name}>
      {label !== false && (
        <FormLabel>
          <FieldTitle
            label={label}
            source={source}
            resource={resource}
            isRequired={isRequired}
          />
        </FormLabel>
      )}
      <div className="relative w-full">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-9 px-3 text-sm bg-background border-input hover:bg-accent/40",
                  !field.value && "text-muted-foreground"
                )}
                disabled={field.disabled}
              />
            }
          >
            <Clock className="mr-2 h-4 w-4 shrink-0 text-muted-foreground opacity-60" />
            <span className="truncate flex-1">
              {field.value ? (
                <span className="font-medium text-foreground">{formattedTime}</span>
              ) : (
                <span>{placeholder}</span>
              )}
            </span>
            {field.value ? (
              <span
                role="button"
                tabIndex={0}
                aria-label={locale === "en" ? "Clear time" : "Hapus jam"}
                onClick={handleClear}
                className="p-1 -mr-1 hover:bg-muted rounded text-muted-foreground opacity-60 hover:opacity-100 flex items-center justify-center shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            ) : null}
          </PopoverTrigger>

          <PopoverContent
            className="w-48 p-2 z-50 bg-popover border border-border shadow-md rounded-xl"
            align="start"
          >
            <div className="grid grid-cols-2 divide-x divide-border text-center">
              {/* Jam / Hour */}
              <div className="pr-1">
                <div className="text-[11px] font-medium text-muted-foreground pb-1.5 border-b border-border/50">
                  {hourLabel}
                </div>
                <div
                  ref={hourRef}
                  className="h-48 overflow-y-auto pt-1 space-y-0.5 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                >
                  {HOURS.map((h) => {
                    const isSelected = currentHour === h;
                    return (
                      <button
                        key={h}
                        type="button"
                        data-selected={isSelected}
                        onClick={() => handleSelectHour(h)}
                        className={cn(
                          "w-full text-center py-1.5 text-xs rounded-md transition-colors",
                          isSelected
                            ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                            : "hover:bg-accent hover:text-accent-foreground text-foreground"
                        )}
                      >
                        {h}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Menit / Minute */}
              <div className="pl-1">
                <div className="text-[11px] font-medium text-muted-foreground pb-1.5 border-b border-border/50">
                  {minLabel}
                </div>
                <div
                  ref={minRef}
                  className="h-48 overflow-y-auto pt-1 space-y-0.5 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                >
                  {minutes.map((m) => {
                    const isSelected = currentMinute === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        data-selected={isSelected}
                        onClick={() => handleSelectMinute(m)}
                        className={cn(
                          "w-full text-center py-1.5 text-xs rounded-md transition-colors",
                          isSelected
                            ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                            : "hover:bg-accent hover:text-accent-foreground text-foreground"
                        )}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <InputHelperText helperText={helperText} />
      <FormError />
    </FormField>
  );
};
