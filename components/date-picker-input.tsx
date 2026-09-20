"use client";

import * as React from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale/id";
import { enUS as localeEn } from "date-fns/locale/en-US";
import { CalendarIcon, X } from "lucide-react";
import type { InputProps } from "ra-core";
import { useInput, FieldTitle, useResourceContext, useLocaleState, useTranslate } from "ra-core";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FormField, FormLabel, FormError } from "@/components/form";
import { InputHelperText } from "@/components/input-helper-text";
import { cn } from "@/lib/utils";

export type DatePickerInputProps = InputProps & {
  className?: string;
  helperText?: string;
  placeholder?: string;
  required?: boolean;
  isRequired?: boolean;
  captionLayout?: "label" | "dropdown" | "dropdown-months" | "dropdown-years";
  fromYear?: number;
  toYear?: number;
  startMonth?: Date;
  endMonth?: Date;
  defaultMonth?: Date;
  isBirthDate?: boolean;
};

/**
 * Modern localized shadcn DatePicker input component for react-admin forms.
 *
 * Uses shadcn Popover + Calendar and stores the selected date as "YYYY-MM-DD".
 * Automatically adapts formatting and calendar locale to Indonesian or English.
 * Supports "dropdown" captionLayout with month & year selection for Date of Birth.
 */
export const DatePickerInput = (props: DatePickerInputProps) => {
  const resource = useResourceContext(props);
  const [locale] = useLocaleState();
  const translate = useTranslate();
  const isEn = locale === "en";
  const currentLocaleObj = isEn ? localeEn : localeId;

  const {
    label,
    source,
    className,
    helperText,
    placeholder,
    required,
    isRequired: isRequiredProp,
    validate: _validateProp,
    format: _formatProp,
    captionLayout: captionLayoutProp,
    fromYear = 1940,
    toYear = new Date().getFullYear(),
    startMonth: startMonthProp,
    endMonth: endMonthProp,
    defaultMonth: defaultMonthProp,
    isBirthDate = false,
    ...rest
  } = props;

  const defaultPlaceholder = placeholder || (
    isBirthDate
      ? (isEn ? "Select birth date" : "Pilih tanggal lahir")
      : (isEn ? "Select date" : "Pilih tanggal layanan")
  );

  const { id, field, fieldState, isRequired } = useInput({
    ...props,
    isRequired: isRequiredProp ?? required,
  });

  const hasError = !!fieldState.error;
  const [open, setOpen] = React.useState(false);

  // Auto-sync defaultValue if field.value is empty on mount
  React.useEffect(() => {
    if (!field.value && props.defaultValue) {
      field.onChange(props.defaultValue);
    }
  }, [props.defaultValue]);

  // Parse current value (supports YYYY-MM-DD, ISO string, Date object)
  const selectedDate = React.useMemo(() => {
    if (!field.value) return undefined;
    if (field.value instanceof Date) return field.value;
    if (typeof field.value === "string" && field.value.trim() !== "") {
      const parts = field.value.split("T")[0].split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        return isNaN(d.getTime()) ? undefined : d;
      }
      const d = new Date(field.value);
      return isNaN(d.getTime()) ? undefined : d;
    }
    return undefined;
  }, [field.value]);

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      field.onChange("");
    } else {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      field.onChange(`${year}-${month}-${day}`);
    }
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    field.onChange("");
  };

  const formattedDisplay = selectedDate
    ? format(selectedDate, isEn ? "MMMM dd, yyyy" : "dd MMMM yyyy", {
      locale: currentLocaleObj,
    })
    : "";

  const effectiveCaptionLayout = captionLayoutProp || (isBirthDate ? "dropdown" : "label");
  const effectiveStartMonth = startMonthProp || (isBirthDate ? new Date(fromYear, 0) : undefined);
  const effectiveEndMonth = endMonthProp || (isBirthDate ? new Date(toYear, 11) : undefined);
  const effectiveDefaultMonth = selectedDate || defaultMonthProp || (isBirthDate ? new Date(1995, 0) : undefined);

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
                  !field.value && "text-muted-foreground",
                  hasError && "border-destructive text-destructive"
                )}
                disabled={field.disabled}
                aria-invalid={hasError}
              />
            }
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground opacity-60" />
            <span className="truncate flex-1">
              {selectedDate ? (
                <span>{formattedDisplay}</span>
              ) : (
                <span>{defaultPlaceholder}</span>
              )}
            </span>
            {field.value ? (
              <span
                role="button"
                tabIndex={0}
                aria-label={isEn ? "Clear date" : "Hapus tanggal"}
                onClick={handleClear}
                className="p-1 -mr-1 hover:bg-muted rounded text-muted-foreground opacity-60 hover:opacity-100 flex items-center justify-center shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            ) : null}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-50 bg-popover border border-border shadow-md" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelect}
              locale={currentLocaleObj}
              captionLayout={effectiveCaptionLayout}
              startMonth={effectiveStartMonth}
              endMonth={effectiveEndMonth}
              defaultMonth={effectiveDefaultMonth}
              disabled={isBirthDate ? (date: Date) => date > new Date() || date < new Date("1930-01-01") : undefined}
            />
          </PopoverContent>
        </Popover>
      </div>
      <InputHelperText helperText={helperText} />
      <FormError />
    </FormField>
  );
};
