"use client";

import * as React from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

export interface SearchableComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
  [key: string]: any;
}

export interface SearchableComboboxProps {
  options: SearchableComboboxOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  size?: "sm" | "default";
}

export function SearchableCombobox({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  disabled = false,
  className,
  triggerClassName,
  contentClassName,
  size = "default",
}: SearchableComboboxProps) {
  const selectedOption = React.useMemo(() => {
    if (!value) return null;
    return options.find((opt) => opt.value === value) || null;
  }, [options, value]);

  return (
    <div className={cn("relative w-full min-w-0", className)}>
      <Combobox
        key={`searchable-combobox:${value ?? ""}`}
        items={options}
        value={selectedOption}
        onValueChange={(selected) => {
          onValueChange(selected ? selected.value : "");
        }}
        itemToStringLabel={(item) => item?.label ?? ""}
        itemToStringValue={(item) => item?.value ?? ""}
        disabled={disabled}
      >
        <ComboboxTrigger
          render={
            <button
              type="button"
              className={cn(
                "flex w-full items-center justify-between rounded-md border border-input bg-background/80 dark:bg-zinc-900/70 text-foreground shadow-xs transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                size === "sm" ? "h-7 px-2 text-xs" : "h-8 px-2.5 text-xs",
                disabled && "opacity-50 pointer-events-none",
                triggerClassName
              )}
              disabled={disabled}
            />
          }
        >
          <span
            className={cn(
              "truncate text-left flex-1 font-normal text-xs",
              !selectedOption && "text-muted-foreground"
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </ComboboxTrigger>
        <ComboboxContent
          className={cn(
            "z-50 min-w-[var(--anchor-width)] max-w-md p-1 shadow-lg border border-border rounded-lg bg-popover dark:bg-zinc-950 text-popover-foreground",
            contentClassName
          )}
        >
          <ComboboxInput
            showTrigger={false}
            showClear={true}
            placeholder={searchPlaceholder}
            className="h-7 text-xs mb-1"
            autoFocus
          />
          <ComboboxEmpty className="py-2 text-center text-xs text-muted-foreground">
            {emptyText}
          </ComboboxEmpty>
          <ComboboxList className="max-h-60 overflow-y-auto p-0.5 space-y-0.5">
            {(item) => (
              <ComboboxItem
                key={item.value}
                value={item}
                disabled={item.disabled}
                className="cursor-pointer text-xs py-1 px-2 rounded-md"
              >
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
