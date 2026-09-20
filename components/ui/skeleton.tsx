"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Base Shadcn UI Skeleton Component
 * @see https://ui.shadcn.com/docs/components/base/skeleton
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted/70 dark:bg-muted/50", className)}
      {...props}
    />
  );
}

/**
 * Reusable Avatar with Text Skeleton
 */
function AvatarSkeleton({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-14 w-14",
    xl: "h-20 w-20",
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Skeleton className={cn("rounded-full shrink-0", sizeClasses[size])} />
      <div className="space-y-1.5 flex-1 min-w-0">
        <Skeleton className="h-4 w-3/4 max-w-[180px]" />
        <Skeleton className="h-3 w-1/2 max-w-[120px]" />
      </div>
    </div>
  );
}

/**
 * Reusable Card Skeleton
 */
function CardSkeleton({
  className,
  header = true,
  lines = 3,
}: {
  className?: string;
  header?: boolean;
  lines?: number;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card p-5 space-y-4 shadow-2xs",
        className
      )}
    >
      {header && (
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      )}
      <div className="space-y-2.5 pt-1">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              "h-3.5",
              i === lines - 1 ? "w-4/5" : i % 2 === 0 ? "w-full" : "w-11/12"
            )}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Reusable Form Skeleton (Inputs, Selects, Labels, Buttons)
 */
function FormSkeleton({
  className,
  fields = 4,
  columns = 2,
}: {
  className?: string;
  fields?: number;
  columns?: 1 | 2 | 3;
}) {
  const colClass =
    columns === 3
      ? "grid-cols-1 sm:grid-cols-3"
      : columns === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : "grid-cols-1";

  return (
    <div className={cn("space-y-5", className)}>
      <div className={cn("grid gap-4", colClass)}>
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        ))}
      </div>

      <div className="space-y-2 pt-2">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-20 w-full rounded-md" />
      </div>

      <div className="flex items-center gap-3 pt-3 border-t border-border/60">
        <Skeleton className="h-9 w-28 rounded-md" />
        <Skeleton className="h-9 w-20 rounded-md" />
      </div>
    </div>
  );
}

/**
 * Reusable Data Table Skeleton with Search Bar, Header, and Rows
 */
function TableSkeleton({
  rows = 6,
  columns = 5,
  hasToolbar = true,
  className,
}: {
  rows?: number;
  columns?: number;
  hasToolbar?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {hasToolbar && (
        <div className="flex items-center justify-between flex-wrap gap-2 py-1">
          <Skeleton className="h-9 w-64 max-w-full rounded-md" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs">
        {/* Table Header Row */}
        <div className="flex items-center gap-4 p-3.5 bg-muted/40 border-b border-border/70">
          <Skeleton className="h-4 w-6 rounded" />
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn(
                "h-4 flex-1",
                i === 0 ? "w-28" : i === columns - 1 ? "w-16" : "w-20"
              )}
            />
          ))}
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-border/60">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="flex items-center gap-4 p-3.5">
              <Skeleton className="h-4 w-6 rounded" />
              {Array.from({ length: columns }).map((_, c) => (
                <div key={c} className="flex-1 min-w-0">
                  {c === 1 ? (
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                      <Skeleton className="h-3.5 w-24" />
                    </div>
                  ) : (
                    <Skeleton
                      className={cn(
                        "h-3.5",
                        c === 0
                          ? "w-16"
                          : c === columns - 1
                          ? "w-12 ml-auto"
                          : "w-3/4"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Pagination Skeleton */}
        <div className="flex items-center justify-between p-3.5 bg-muted/20 border-t border-border/60">
          <Skeleton className="h-3.5 w-32" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-7 w-7 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Reusable Dashboard KPI & Grid Skeleton
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-3.5 w-80 max-w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/80 bg-card p-5 space-y-3 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        ))}
      </div>

      {/* Middle Chart & Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-xl border border-border/80 bg-card p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>

        <div className="lg:col-span-4 rounded-xl border border-border/80 bg-card p-6 space-y-4 shadow-2xs">
          <Skeleton className="h-4 w-32" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3.5 w-12" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Reusable Document / Slip / Invoice Skeleton
 */
function DocumentSlipSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card p-6 sm:p-8 space-y-6 shadow-sm max-w-2xl mx-auto",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-border/60">
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-3 w-48" />
        </div>
        <div className="space-y-1.5 text-right">
          <Skeleton className="h-3 w-24 ml-auto" />
          <Skeleton className="h-4 w-32 ml-auto" />
          <Skeleton className="h-5 w-20 rounded-full ml-auto" />
        </div>
      </div>

      {/* 2 Meta Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-muted/30 border border-border/60 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="p-4 rounded-lg bg-muted/30 border border-border/60 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-lg border border-border/60 overflow-hidden divide-y divide-border/60">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-between p-3.5">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3.5 w-24" />
          </div>
        ))}
      </div>

      {/* Total Box */}
      <div className="p-4 rounded-lg bg-muted/20 border border-border/60 flex justify-between items-center">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-36" />
      </div>
    </div>
  );
}

export {
  Skeleton,
  AvatarSkeleton,
  CardSkeleton,
  FormSkeleton,
  TableSkeleton,
  DashboardSkeleton,
  DocumentSlipSkeleton,
};
