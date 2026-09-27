"use client";

import * as React from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale/id";
import { enUS as localeEn } from "date-fns/locale/en-US";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Official Shadcn Date Picker Component for POS Form
 */
export const POSDatePicker: React.FC<{
  value?: string;
  onChange: (dateStr: string) => void;
  isEn: boolean;
}> = ({ value, onChange, isEn }) => {
  const [open, setOpen] = React.useState(false);
  const currentLocaleObj = isEn ? localeEn : localeId;

  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    const parts = value.split("-");
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return isNaN(d.getTime()) ? undefined : d;
    }
    const d = new Date(value);
    return isNaN(d.getTime()) ? undefined : d;
  }, [value]);

  const formattedDisplay = selectedDate
    ? format(selectedDate, isEn ? "MMM dd, yyyy" : "dd MMMM yyyy", {
        locale: currentLocaleObj,
      })
    : isEn ? "Pick a date" : "Pilih tanggal layanan";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-9 px-3 text-xs bg-background border-input hover:bg-accent/40",
              !value && "text-muted-foreground"
            )}
          />
        }
      >
        <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-70" />
        <span className="truncate flex-1 font-medium">{formattedDisplay}</span>
        {value && (
          <span
            role="button"
            tabIndex={0}
            aria-label={isEn ? "Clear date" : "Hapus tanggal"}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onChange("");
            }}
            className="p-0.5 -mr-1 hover:bg-muted rounded text-muted-foreground opacity-60 hover:opacity-100 flex items-center justify-center shrink-0"
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-50 bg-popover border border-border shadow-md rounded-xl" align="start">
        <ShadcnCalendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (!date) {
              onChange("");
            } else {
              const y = date.getFullYear();
              const m = String(date.getMonth() + 1).padStart(2, "0");
              const d = String(date.getDate()).padStart(2, "0");
              onChange(`${y}-${m}-${d}`);
            }
            setOpen(false);
          }}
          locale={currentLocaleObj}
          defaultMonth={selectedDate || new Date()}
        />
      </PopoverContent>
    </Popover>
  );
};

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

/**
 * Official Shadcn Time Picker Component for POS Form
 */
export const POSTimePicker: React.FC<{
  value?: string;
  onChange: (timeStr: string) => void;
  isEn: boolean;
}> = ({ value, onChange, isEn }) => {
  const [open, setOpen] = React.useState(false);
  const hourRef = React.useRef<HTMLDivElement>(null);
  const minRef = React.useRef<HTMLDivElement>(null);

  const { currentHour, currentMinute } = React.useMemo(() => {
    const val = value ? value.trim() : "";
    if (!val) return { currentHour: "", currentMinute: "" };
    const parts = val.split(":");
    return {
      currentHour: parts[0] ? parts[0].padStart(2, "0") : "",
      currentMinute: parts[1] ? parts[1].padStart(2, "0") : "00",
    };
  }, [value]);

  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        if (hourRef.current) {
          const sel = hourRef.current.querySelector<HTMLElement>('[data-selected="true"]');
          if (sel) {
            hourRef.current.scrollTop = sel.offsetTop - hourRef.current.clientHeight / 2 + sel.clientHeight / 2;
          }
        }
        if (minRef.current) {
          const sel = minRef.current.querySelector<HTMLElement>('[data-selected="true"]');
          if (sel) {
            minRef.current.scrollTop = sel.offsetTop - minRef.current.clientHeight / 2 + sel.clientHeight / 2;
          }
        }
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const formattedDisplay = value
    ? isEn
      ? value
      : `${value} WIB`
    : isEn ? "Pick a time" : "Pilih jam layanan";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-9 px-3 text-xs bg-background border-input hover:bg-accent/40",
              !value && "text-muted-foreground"
            )}
          />
        }
      >
        <Clock className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-70" />
        <span className="truncate flex-1 font-medium">{formattedDisplay}</span>
        {value && (
          <span
            role="button"
            tabIndex={0}
            aria-label={isEn ? "Clear time" : "Hapus jam"}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onChange("");
            }}
            className="p-0.5 -mr-1 hover:bg-muted rounded text-muted-foreground opacity-60 hover:opacity-100 flex items-center justify-center shrink-0"
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2 z-50 bg-popover border border-border shadow-md rounded-xl" align="start">
        <div className="grid grid-cols-2 divide-x divide-border text-center">
          <div className="pr-1">
            <div className="text-[11px] font-medium text-muted-foreground pb-1.5 border-b border-border/50">
              {isEn ? "Hour" : "Jam"}
            </div>
            <div
              ref={hourRef}
              className="h-44 overflow-y-auto pt-1 space-y-0.5 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {HOURS.map((h) => {
                const isSelected = currentHour === h;
                return (
                  <Button
                    key={h}
                    type="button"
                    variant={isSelected ? "default" : "ghost"}
                    size="sm"
                    data-selected={isSelected}
                    onClick={() => {
                      const m = currentMinute || "00";
                      onChange(`${h}:${m}`);
                    }}
                    className={cn(
                      "w-full h-7 text-center py-1 text-xs rounded-md transition-colors font-normal",
                      isSelected && "font-semibold shadow-xs"
                    )}
                  >
                    {h}
                  </Button>
                );
              })}
            </div>
          </div>
          <div className="pl-1">
            <div className="text-[11px] font-medium text-muted-foreground pb-1.5 border-b border-border/50">
              {isEn ? "Minute" : "Menit"}
            </div>
            <div
              ref={minRef}
              className="h-44 overflow-y-auto pt-1 space-y-0.5 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {MINUTES.map((m) => {
                const isSelected = currentMinute === m;
                return (
                  <Button
                    key={m}
                    type="button"
                    variant={isSelected ? "default" : "ghost"}
                    size="sm"
                    data-selected={isSelected}
                    onClick={() => {
                      const h = currentHour || "10";
                      onChange(`${h}:${m}`);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full h-7 text-center py-1 text-xs rounded-md transition-colors font-normal",
                      isSelected && "font-semibold shadow-xs"
                    )}
                  >
                    {m}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
