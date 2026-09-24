"use client";

import * as React from "react";
import type { RaRecord } from "ra-core";
import { useFieldValue, useTranslate, useResourceContext } from "ra-core";
import { cn } from "@/lib/utils";
import type { FieldProps } from "@/lib/field.type";
import { resolveChoiceIcon } from "@/components/select-input";

/**
 * Displays a clean, seamless status field with matching Lucide status icons.
 */
export const BadgeField = <RecordType extends RaRecord = RaRecord>({
  defaultValue,
  source,
  record,
  empty,
  className,
  showIcon = true,
}: BadgeFieldProps<RecordType>) => {
  const value = useFieldValue({ defaultValue, source, record });
  const translate = useTranslate();
  const resource = useResourceContext();

  if (value == null) {
    return empty && typeof empty === "string"
      ? translate(empty, { _: empty })
      : empty;
  }

  const strValue = typeof value !== "string" ? value.toString() : value;

  // Try translating from resource specific status dictionaries
  let label = strValue;
  if (resource && source) {
    const translationKey = `resources.${resource}.${source}.${strValue}`;
    const fallbackKey = `resources.${resource}.status.${strValue}`;
    const translated = translate(translationKey, {
      _: translate(fallbackKey, { _: strValue }),
    });
    if (translated && translated !== translationKey && translated !== fallbackKey) {
      label = translated;
    }
  }

  // Fallback human readable formatting if raw underscore string
  if (label === strValue && strValue.includes("_")) {
    label = strValue
      .split("_")
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  const icon = showIcon ? resolveChoiceIcon(strValue) : null;

  return (
    <span
      className={cn(
        "text-xs font-medium text-foreground whitespace-nowrap inline-flex items-center gap-1.5",
        className
      )}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
};

export interface BadgeFieldProps<RecordType extends RaRecord = RaRecord>
  extends FieldProps<RecordType> {
  defaultValue?: any;
  variant?: "default" | "outline" | "secondary" | "destructive";
  className?: string;
  showIcon?: boolean;
}

