"use client";

import * as React from "react";
import { TableSkeleton } from "@/components/ui/skeleton";

/**
 * High-fidelity Skeleton Page Loading fallback for Suspense and route transitions.
 */
export const Loading = (props: LoadingProps) => {
  const { className, ...rest } = props;

  return (
    <div className="w-full space-y-4 py-2 animate-in fade-in-50 duration-200" {...rest}>
      <TableSkeleton rows={8} columns={5} hasToolbar={true} className={className} />
    </div>
  );
};

export interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  loadingPrimary?: string;
  loadingSecondary?: string;
  delay?: number;
}
