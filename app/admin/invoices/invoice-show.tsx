"use client";

import * as React from "react";
import { useShowContext, useLocaleState } from "ra-core";
import { Show } from "@/components/show";
import { InvoiceCard } from "@/components/invoice-card";

/**
 * Detailed view of an existing Invoice
 */
export const InvoiceShowView = () => {
  const { record, isPending } = useShowContext();
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  if (isPending || !record) {
    return (
      <div className="p-12 text-center text-xs text-muted-foreground animate-pulse">
        {isEn ? "Loading receipt..." : "Memuat nota..."}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-4">
      <InvoiceCard invoice={record as any} showShareActions={true} forcedLocale={locale} />
    </div>
  );
};

export const InvoiceShow = () => (
  <Show>
    <InvoiceShowView />
  </Show>
);
