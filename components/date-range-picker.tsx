"use client";

import * as React from "react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { id as idLocale, enUS as enLocale } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  onChange: (range: { startDate: string; endDate: string }) => void;
  className?: string;
  locale?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  className,
  locale = "id",
}: DateRangePickerProps) {
  const isEn = locale === "en";
  const dateFnsLocale = isEn ? enLocale : idLocale;

  const [date, setDate] = React.useState<DateRange | undefined>(() => {
    if (startDate && endDate) {
      return {
        from: new Date(startDate),
        to: new Date(endDate),
      };
    }
    return {
      from: new Date(),
      to: new Date(),
    };
  });

  const [open, setOpen] = React.useState(false);

  // Sync when props change
  React.useEffect(() => {
    if (startDate && endDate) {
      setDate({
        from: new Date(startDate),
        to: new Date(endDate),
      });
    }
  }, [startDate, endDate]);

  const handleSelect = (selectedRange: DateRange | undefined) => {
    setDate(selectedRange);
    if (selectedRange?.from) {
      const fromStr = format(selectedRange.from, "yyyy-MM-dd");
      const toStr = selectedRange.to
        ? format(selectedRange.to, "yyyy-MM-dd")
        : fromStr;
      onChange({ startDate: fromStr, endDate: toStr });
    }
  };

  const setPreset = (preset: "today" | "week" | "month" | "last_month") => {
    const today = new Date();
    let from = today;
    let to = today;

    if (preset === "today") {
      from = today;
      to = today;
    } else if (preset === "week") {
      from = subDays(today, 6);
      to = today;
    } else if (preset === "month") {
      from = startOfMonth(today);
      to = today;
    } else if (preset === "last_month") {
      const prevMonth = subMonths(today, 1);
      from = startOfMonth(prevMonth);
      to = endOfMonth(prevMonth);
    }

    const newRange = { from, to };
    setDate(newRange);
    onChange({
      startDate: format(from, "yyyy-MM-dd"),
      endDate: format(to, "yyyy-MM-dd"),
    });
    setOpen(false);
  };

  const displayText = React.useMemo(() => {
    if (date?.from) {
      if (date.to) {
        return `${format(date.from, "dd MMM yyyy", { locale: dateFnsLocale })} - ${format(
          date.to,
          "dd MMM yyyy",
          { locale: dateFnsLocale }
        )}`;
      }
      return format(date.from, "dd MMM yyyy", { locale: dateFnsLocale });
    }
    return isEn ? "Pick a date range" : "Pilih rentang tanggal";
  }, [date, dateFnsLocale, isEn]);

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id="date-range"
              variant="outline"
              className={cn(
                "w-full justify-between text-left font-normal h-9 text-xs border-input shadow-2xs hover:bg-accent/50",
                !date && "text-muted-foreground"
              )}
            >
              <div className="flex items-center gap-2 truncate">
                <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate font-medium text-foreground">{displayText}</span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-60" />
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0 border border-border shadow-md" align="start">
          <div className="p-2 border-b border-border/60 flex items-center gap-1.5 flex-wrap bg-muted/30">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPreset("today")}
              className="h-7 text-[11px] px-2 font-medium"
            >
              {isEn ? "Today" : "Hari Ini"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPreset("week")}
              className="h-7 text-[11px] px-2 font-medium"
            >
              {isEn ? "Last 7 Days" : "7 Hari Terakhir"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPreset("month")}
              className="h-7 text-[11px] px-2 font-medium"
            >
              {isEn ? "This Month" : "Bulan Ini"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPreset("last_month")}
              className="h-7 text-[11px] px-2 font-medium"
            >
              {isEn ? "Last Month" : "Bulan Lalu"}
            </Button>
          </div>
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={1}
            locale={dateFnsLocale}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
