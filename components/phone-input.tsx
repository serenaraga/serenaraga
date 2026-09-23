"use client";

import * as React from "react";
import type { InputProps } from "ra-core";
import { useInput, FieldTitle, useResourceContext, useLocaleState } from "ra-core";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { FormField, FormLabel, FormError } from "@/components/form";
import { InputHelperText } from "@/components/input-helper-text";
import { cn } from "@/lib/utils";

export interface CountryOption {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: "ID", name: "Indonesia", flag: "🇮🇩", dialCode: "+62" },
  { code: "SG", name: "Singapore", flag: "🇸🇬", dialCode: "+65" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾", dialCode: "+60" },
  { code: "AU", name: "Australia", flag: "🇦🇺", dialCode: "+61" },
  { code: "US", name: "United States", flag: "🇺🇸", dialCode: "+1" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", dialCode: "+44" },
  { code: "JP", name: "Japan", flag: "🇯🇵", dialCode: "+81" },
  { code: "KR", name: "South Korea", flag: "🇰🇷", dialCode: "+82" },
];

export type PhoneInputProps = InputProps & {
  className?: string;
  helperText?: string;
  placeholder?: string;
  required?: boolean;
  isRequired?: boolean;
};

/**
 * Modern Phone Input component with Country Code selector for react-admin.
 *
 * Defaults to Indonesia (+62) and stores full formatted number like "+6281234567890".
 */
export const PhoneInput = (props: PhoneInputProps) => {
  const resource = useResourceContext(props);
  const [locale] = useLocaleState();
  const {
    label,
    source,
    className,
    helperText,
    placeholder = "812-3456-7890",
    required,
    isRequired: isRequiredProp,
    validate: _validateProp,
    format: _formatProp,
    ...rest
  } = props;

  const { id, field, fieldState, isRequired } = useInput({
    ...props,
    isRequired: isRequiredProp ?? required,
  });

  const hasError = !!fieldState.error;
  const [countryCode, setCountryCode] = React.useState("+62");
  const [nationalNumber, setNationalNumber] = React.useState("");

  // Parse existing field.value into country dial code + number
  React.useEffect(() => {
    if (typeof field.value === "string" && field.value.trim() !== "") {
      const val = field.value.trim();
      const matched = COUNTRIES.find((c) => val.startsWith(c.dialCode));
      if (matched) {
        setCountryCode(matched.dialCode);
        setNationalNumber(val.slice(matched.dialCode.length));
      } else if (val.startsWith("0")) {
        setCountryCode("+62");
        setNationalNumber(val.replace(/^0+/, ""));
      } else {
        setNationalNumber(val);
      }
    }
  }, []);

  const updateValue = (dialCode: string, num: string) => {
    const cleaned = num.replace(/[^\d]/g, "").replace(/^0+/, "");
    if (!cleaned) {
      field.onChange("");
    } else {
      field.onChange(`${dialCode}${cleaned}`);
    }
  };

  const handleCountryChange = (dialCode: string | null) => {
    if (!dialCode) return;
    setCountryCode(dialCode);
    updateValue(dialCode, nationalNumber);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNationalNumber(val);
    updateValue(countryCode, val);
  };

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
      <div className="flex items-center gap-2">
        {/* Country Code Selector via Combobox */}
        <div className="shrink-0">
          <Combobox
            key={`country-combobox:${countryCode}`}
            items={COUNTRIES.map((c) => ({
              value: c.dialCode,
              label: `${c.flag} ${c.dialCode} (${c.name})`,
              country: c,
            }))}
            value={(() => {
              const c = COUNTRIES.find((item) => item.dialCode === countryCode) || COUNTRIES[0];
              return {
                value: c.dialCode,
                label: `${c.flag} ${c.dialCode} (${c.name})`,
                country: c,
              };
            })()}
            onValueChange={(item) => {
              if (item) handleCountryChange(item.value);
            }}
            itemToStringLabel={(item) => item?.label ?? ""}
            itemToStringValue={(item) => item?.value ?? ""}
          >
            <ComboboxTrigger
              render={
                <button
                  type="button"
                  aria-invalid={hasError}
                  className={cn(
                    "flex w-[105px] h-9 items-center justify-between rounded-md border border-input bg-background px-2.5 text-xs shadow-xs transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    hasError && "border-destructive text-destructive"
                  )}
                />
              }
            >
              <span className="flex items-center gap-1.5 truncate">
                <span className="text-base leading-none">
                  {COUNTRIES.find((c) => c.dialCode === countryCode)?.flag || "🇮🇩"}
                </span>
                <span className="font-semibold text-foreground text-xs">
                  {countryCode}
                </span>
              </span>
            </ComboboxTrigger>
            <ComboboxContent
              align="start"
              className="w-[260px] min-w-[260px] p-1 shadow-xl border border-border bg-popover rounded-lg text-popover-foreground z-50"
            >
              <ComboboxInput
                showTrigger={false}
                showClear={true}
                placeholder={locale === "en" ? "Search country..." : "Cari negara..."}
                className="h-8 text-xs mb-1"
                autoFocus
              />
              <ComboboxEmpty className="py-2 text-center text-xs text-muted-foreground">
                {locale === "en" ? "No countries found." : "Negara tidak ditemukan."}
              </ComboboxEmpty>
              <ComboboxList className="max-h-56 overflow-y-auto">
                {(item) => (
                  <ComboboxItem
                    key={item.country.code}
                    value={item}
                    className="py-1.5 px-2 text-xs cursor-pointer rounded-md"
                  >
                    <div className="flex items-center gap-2.5 w-full">
                      <span className="text-base leading-none shrink-0">{item.country.flag}</span>
                      <span className="font-semibold text-foreground w-9 shrink-0 text-left">
                        {item.country.dialCode}
                      </span>
                      <span className="text-muted-foreground text-xs truncate flex-1 text-left">
                        ({item.country.name})
                      </span>
                    </div>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        {/* National Number Input */}
        <Input
          id={id}
          type="tel"
          value={nationalNumber}
          onChange={handleNumberChange}
          placeholder={placeholder}
          aria-invalid={hasError}
          className="flex-1 h-9 text-sm bg-background"
          disabled={field.disabled}
        />
      </div>
      <InputHelperText helperText={helperText} />
      <FormError />
    </FormField>
  );
};
