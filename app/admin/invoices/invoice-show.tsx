"use client";

import * as React from "react";
import { useShowContext, useLocaleState } from "ra-core";
import { Show } from "@/components/show";
import { InvoiceCard } from "@/components/invoice-card";
import { DynamicQrisCard } from "@/components/dynamic-qris-card";
import { InvoiceCardSkeleton, QrisCardSkeleton } from "@/components/ui/skeleton";

/**
 * Detailed view of an existing Invoice
 */
export const InvoiceShowView = () => {
  const { record, isPending } = useShowContext();
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  if (isPending || !record) {
    return (
      <div className="max-w-5xl mx-auto py-4">
        <div className="flex flex-col lg:flex-row items-start justify-center gap-6 w-full">
          <div className="w-full flex-1 min-w-0 flex justify-center">
            <InvoiceCardSkeleton />
          </div>
          <div className="w-full lg:w-[360px] shrink-0 flex justify-center">
            <QrisCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-4">
      <div className="flex flex-col lg:flex-row items-start justify-center gap-6 w-full">
        {/* Left: Invoice Document */}
        <div className="w-full flex-1 min-w-0 flex justify-center">
          <InvoiceCard invoice={record as any} showShareActions={true} forcedLocale={locale} />
        </div>

        {/* Right: Dynamic QRIS Card */}
        <div className="w-full lg:w-[360px] shrink-0 flex justify-center">
          <DynamicQrisCard
            invoiceNumber={(record as any).invoice_number || ""}
            totalAmount={Number((record as any).total_amount || 0)}
            isEn={isEn}
          />
        </div>
      </div>
    </div>
  );
};

export const InvoiceShow = () => (
  <Show>
    <InvoiceShowView />
  </Show>
);
