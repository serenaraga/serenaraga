"use client";

import {
  X,
  Clock,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Banknote,
  QrCode,
  Building2,
  RotateCcw,
  Wallet,
  User,
  Sparkles,
  UserCheck,
  ShieldCheck,
  Calendar,
  BarChart3,
  CalendarDays,
  History,
  Droplet,
  Droplets,
  Scale,
  Package,
  Layers,
  Leaf,
  Boxes,
  Shirt,
  Activity,
  HeartPulse,
  Footprints,
  Flame,
  Award,
} from "lucide-react";
import type {
  ChoicesProps,
  InputProps,
  SupportCreateSuggestionOptions,
} from "ra-core";
import {
  FieldTitle,
  useChoices,
  useChoicesContext,
  useGetRecordRepresentation,
  useInput,
  useSupportCreateSuggestion,
  useTranslate,
} from "ra-core";
import * as React from "react";
import type { ComponentProps, ReactElement } from "react";
import { useCallback, useEffect, useId } from "react";

import { FormError, FormField, FormLabel } from "@/components/form";
import { InputHelperText } from "@/components/input-helper-text";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Resolves icon for a choice safely from string name or ID without circular JSON structures
 */
export function resolveChoiceIcon(iconNameOrId?: string): React.ReactNode {
  if (!iconNameOrId || typeof iconNameOrId !== "string") return null;

  const key = iconNameOrId.toLowerCase().trim();

  switch (key) {
    // Booking / Order Status
    case "pending":
    case "unpaid":
    case "pending_verification":
    case "clock":
      return <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
    case "confirmed":
    case "calendarcheck":
      return <CalendarCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />;
    case "completed":
    case "paid":
    case "available":
    case "checkcircle":
    case "checkcircle2":
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
    case "canceled":
    case "cancelled":
    case "off_duty":
    case "xcircle":
      return <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />;
    case "on_duty":
    case "sparkles":
      return <Sparkles className="h-3.5 w-3.5 text-indigo-500 shrink-0" />;
    case "refunded":
    case "rotateccw":
      return <RotateCcw className="h-3.5 w-3.5 text-rose-500 shrink-0" />;

    // Payment Methods
    case "cash":
    case "banknote":
      return <Banknote className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
    case "qris":
    case "qrcode":
      return <QrCode className="h-3.5 w-3.5 text-purple-500 shrink-0" />;
    case "bank_transfer":
    case "bca":
    case "mandiri":
    case "bri":
    case "bni":
    case "bsi":
    case "cimb":
    case "jago":
    case "seabank":
    case "building2":
      return <Building2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />;
    case "e-wallet":
    case "wallet":
      return <Wallet className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;

    // User Roles & Gender
    case "female":
      return <User className="h-3.5 w-3.5 text-pink-500 shrink-0" />;
    case "male":
      return <User className="h-3.5 w-3.5 text-blue-500 shrink-0" />;
    case "cashier":
    case "usercheck":
      return <UserCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />;
    case "admin":
    case "shieldcheck":
      return <ShieldCheck className="h-3.5 w-3.5 text-amber-500 shrink-0" />;

    // Consumable Units & Categories
    case "ml":
    case "droplets":
    case "oil & lotion":
      return <Droplets className="h-3.5 w-3.5 text-blue-500 shrink-0" />;
    case "gram":
    case "scale":
      return <Scale className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
    case "pcs":
    case "package":
      return <Package className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
    case "set":
    case "layers":
      return <Layers className="h-3.5 w-3.5 text-purple-500 shrink-0" />;
    case "tetes":
    case "droplet":
      return <Droplet className="h-3.5 w-3.5 text-cyan-500 shrink-0" />;
    case "scrub & lulur":
    case "body treatment":
      return <Sparkles className="h-3.5 w-3.5 text-rose-500 shrink-0" />;
    case "essential oil":
    case "leaf":
      return <Leaf className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
    case "spa supplies":
    case "boxes":
      return <Boxes className="h-3.5 w-3.5 text-purple-500 shrink-0" />;
    case "linen & hygiene":
    case "shirt":
      return <Shirt className="h-3.5 w-3.5 text-blue-500 shrink-0" />;

    // Service Categories
    case "body massage":
    case "activity":
      return <Activity className="h-3.5 w-3.5 text-blue-500 shrink-0" />;
    case "therapeutic":
    case "heartpulse":
      return <HeartPulse className="h-3.5 w-3.5 text-rose-500 shrink-0" />;
    case "reflexology":
    case "footprints":
      return <Footprints className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
    case "spa & relax":
    case "flame":
      return <Flame className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
    case "specialized":
    case "award":
      return <Award className="h-3.5 w-3.5 text-purple-500 shrink-0" />;

    // Dashboard Time Filters
    case "today":
    case "calendar":
      return <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />;
    case "yesterday":
      return <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />;
    case "7d":
    case "30d":
    case "barchart3":
      return <BarChart3 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />;
    case "this_month":
    case "this_year":
    case "calendardays":
      return <CalendarDays className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
    case "all":
    case "history":
      return <History className="h-3.5 w-3.5 text-purple-500 shrink-0" />;

    default:
      return null;
  }
}

/**
 * Dropdown select input for choosing a single value from a list of options.
 *
 * Uses official Shadcn Base UI Select for short/fixed options and Shadcn Base UI Combobox for searchable lists.
 */
export const SelectInput = (props: SelectInputProps) => {
  const {
    choices: choicesProp,
    isLoading: isLoadingProp,
    isFetching: isFetchingProp,
    isPending: isPendingProp,
    resource: resourceProp,
    source: sourceProp,

    optionText,
    optionValue,
    disableValue = "disabled",
    translateChoice,
    createValue,
    createHintValue,

    alwaysOn,
    defaultValue,
    format,
    label,
    helperText,
    name,
    onBlur,
    onChange,
    parse,
    validate,
    readOnly,
    disabled,
    placeholder,
    searchable,

    className,
    emptyText = "",
    emptyValue = "",
    filter: _filter,
    create,
    createLabel,
    onCreate,

    ...rest
  } = props;
  const translate = useTranslate();

  useEffect(() => {
    if (emptyValue == null) {
      throw new Error(
        `emptyValue being set to null or undefined is not supported. Use parse to turn the empty string into null.`,
      );
    }
  }, [emptyValue]);

  const {
    allChoices,
    isPending,
    error: fetchError,
    source,
    resource,
    isFromReference,
  } = useChoicesContext({
    choices: choicesProp,
    isLoading: isLoadingProp,
    isFetching: isFetchingProp,
    isPending: isPendingProp,
    resource: resourceProp,
    source: sourceProp,
  });

  if (source === undefined) {
    throw new Error(
      `If you're not wrapping the SelectInput inside a ReferenceInput, you must provide the source prop`,
    );
  }

  if (!isPending && !fetchError && allChoices === undefined) {
    throw new Error(
      `If you're not wrapping the SelectInput inside a ReferenceInput, you must provide the choices prop`,
    );
  }

  const getRecordRepresentation = useGetRecordRepresentation(resource);
  const { getChoiceText, getChoiceValue, getDisableValue } = useChoices({
    optionText:
      optionText ?? (isFromReference ? getRecordRepresentation : undefined),
    optionValue,
    disableValue,
    translateChoice: translateChoice ?? !isFromReference,
    createValue,
    createHintValue,
  });
  const labelId = useId();
  const { id, field, isRequired } = useInput({
    alwaysOn,
    defaultValue,
    format,
    label,
    helperText,
    name,
    onBlur,
    onChange,
    parse,
    resource,
    source,
    validate,
    readOnly,
    disabled,
  });

  const renderEmptyItemOption = useCallback(() => {
    return typeof emptyText === "string"
      ? emptyText === ""
        ? ""
        : translate(emptyText, { _: emptyText })
      : emptyText;
  }, [emptyText, translate]);

  const renderMenuItemOption = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (choice: any) => getChoiceText(choice),
    [getChoiceText],
  );

  const handleChange = useCallback(
    async (value: string) => {
      if (value === emptyValue) {
        field.onChange(emptyValue);
      } else {
        // Find the choice by value and pass it to field.onChange
        const choice = allChoices?.find(
          (choice) => getChoiceValue(choice) === value,
        );
        field.onChange(choice ? getChoiceValue(choice) : value);
      }
    },
    [field, getChoiceValue, emptyValue, allChoices],
  );

  const {
    getCreateItem,
    handleChange: handleChangeWithCreateSupport,
    createElement,
  } = useSupportCreateSuggestion({
    create,
    createLabel,
    createValue,
    createHintValue,
    onCreate,
    handleChange,
    optionText,
  });

  const createItem = create || onCreate ? getCreateItem() : null;
  let finalChoices = fetchError ? [] : allChoices;
  if (create || onCreate) {
    finalChoices = [...(finalChoices || []), createItem];
  }

  const items = React.useMemo(() => {
    return (finalChoices || []).map((choice) => {
      const val = getChoiceValue(choice)?.toString() ?? "";
      const text = renderMenuItemOption(
        !!createItem && choice?.id === createItem.id ? createItem : choice,
      );
      const isDisabled = getDisableValue(choice);
      // Resolve icon from choice.icon (string), choice.id, or val
      const iconKey = typeof choice?.icon === "string" ? choice.icon : choice?.id || val;
      const icon = resolveChoiceIcon(iconKey);
      return {
        value: val,
        label: typeof text === "string" ? text : String(text || val),
        icon,
        disabled: isDisabled,
        raw: choice,
      };
    });
  }, [finalChoices, getChoiceValue, renderMenuItemOption, createItem, getDisableValue]);

  const selectedItem = React.useMemo(() => {
    const currentVal = field.value !== undefined && field.value !== null ? field.value.toString() : "";
    return items.find((item) => item.value === currentVal) || null;
  }, [items, field.value]);

  if (isPending) {
    return (
      <FormField
        id={id}
        name={field.name}
        className={cn("w-full min-w-20", className)}
      >
        {label !== "" && label !== false && (
          <FormLabel id={labelId}>
            <FieldTitle
              label={label}
              source={source}
              resource={resourceProp}
              isRequired={isRequired}
            />
          </FormLabel>
        )}
        <div className="relative">
          <Skeleton className="w-full h-9" />
        </div>
        <InputHelperText helperText={helperText} />
        <FormError />
      </FormField>
    );
  }

  const placeholderText =
    placeholder ||
    (typeof renderEmptyItemOption() === "string" && renderEmptyItemOption()
      ? (renderEmptyItemOption() as string)
      : translate("ra.action.select", { _: "Select..." }));

  // Use Combobox if explicitly requested, if from reference, or if > 5 items.
  const isSearchable =
    searchable !== undefined
      ? searchable
      : isFromReference || items.length > 5;

  return (
    <>
      <FormField
        id={id}
        name={field.name}
        className={cn("w-full min-w-20", className)}
        {...rest}
      >
        {label !== "" && label !== false && (
          <FormLabel id={labelId}>
            <FieldTitle
              label={label}
              source={source}
              resource={resourceProp}
              isRequired={isRequired}
            />
          </FormLabel>
        )}
        <div className="relative">
          {isSearchable ? (
            <Combobox
              key={`combobox:${field.value?.toString() ?? emptyValue}`}
              items={items}
              value={selectedItem}
              onValueChange={(selected) => {
                if (!selected || selected.value === emptyValue) {
                  handleChangeWithCreateSupport(emptyValue);
                } else {
                  handleChangeWithCreateSupport(selected.value);
                }
              }}
              itemToStringLabel={(item) => item?.label ?? ""}
              itemToStringValue={(item) => item?.value ?? ""}
              disabled={field.disabled}
            >
              <ComboboxTrigger
                render={
                  <button
                    type="button"
                    className={cn(
                      "flex h-8 w-full items-center justify-between rounded-md border border-input bg-background/80 dark:bg-zinc-900/70 px-2.5 py-1 text-xs text-foreground shadow-xs transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                      field.disabled && "opacity-50 pointer-events-none"
                    )}
                    disabled={field.disabled}
                    aria-labelledby={labelId}
                  />
                }
              >
                <span className={cn("truncate text-left flex-1 font-normal text-xs flex items-center gap-1.5", !selectedItem && "text-muted-foreground")}>
                  {selectedItem?.icon && <span className="shrink-0 flex items-center">{selectedItem.icon}</span>}
                  <span className="truncate">{selectedItem ? selectedItem.label : placeholderText}</span>
                </span>
              </ComboboxTrigger>
              <ComboboxContent className="z-50 min-w-[var(--anchor-width)] max-w-md p-1 shadow-lg border border-border/80 rounded-lg bg-popover dark:bg-zinc-950 text-popover-foreground">
                <ComboboxInput
                  showTrigger={false}
                  showClear={true}
                  placeholder={typeof placeholder === "string" ? placeholder : "Search..."}
                  className="h-7 text-xs mb-1"
                  autoFocus
                />
                <ComboboxEmpty className="py-2 text-center text-xs text-muted-foreground">
                  {translate("ra.navigation.no_results", { _: "No options found" })}
                </ComboboxEmpty>
                <ComboboxList className="max-h-60 overflow-y-auto p-0.5 space-y-0.5">
                  {(item) => (
                    <ComboboxItem
                      key={item.value}
                      value={item}
                      disabled={item.disabled}
                      className="cursor-pointer text-xs py-1 px-2 rounded-md flex items-center gap-1.5"
                    >
                      {item.icon && <span className="shrink-0 flex items-center">{item.icon}</span>}
                      <span className="truncate">{item.label}</span>
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          ) : (
            <Select
              key={`select:${field.value?.toString() ?? emptyValue}`}
              items={items}
              value={field.value?.toString() || emptyValue}
              onValueChange={handleChangeWithCreateSupport}
            >
              <SelectTrigger
                className="w-full h-8 text-xs rounded-md transition-colors hover:bg-accent/40"
                disabled={field.disabled}
                aria-labelledby={labelId}
              >
                <SelectValue placeholder={placeholderText}>
                  {(val) => {
                    if (!val || val === emptyValue) return placeholderText;
                    const choice = items.find((item) => item.value === val);
                    if (!choice) return val;
                    return (
                      <span className="flex items-center gap-1.5 truncate">
                        {choice.icon && <span className="shrink-0 flex items-center">{choice.icon}</span>}
                        <span className="truncate">{choice.label}</span>
                      </span>
                    );
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="z-50 max-h-60 rounded-lg">
                <SelectGroup>
                  {items.map((item) => (
                    <SelectItem
                      key={item.value}
                      value={item.value}
                      disabled={item.disabled}
                      className="text-xs py-1 px-2 rounded-md cursor-pointer flex items-center gap-1.5"
                    >
                      {item.icon && <span className="shrink-0 flex items-center">{item.icon}</span>}
                      <span className="truncate">{item.label}</span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </div>
        <InputHelperText helperText={helperText} />
      </FormField>
      {createElement}
    </>
  );
};

export type SelectInputProps = ChoicesProps &
  // Source is optional as SelectInput can be used inside a ReferenceInput that already defines the source
  Partial<InputProps> &
  Omit<SupportCreateSuggestionOptions, "handleChange"> & {
    emptyText?: string | ReactElement;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    emptyValue?: any;
    placeholder?: string;
    searchable?: boolean;
    onChange?: (value: string) => void;
    required?: boolean;
  } & Omit<ComponentProps<typeof FormField>, "id" | "name" | "children">;

