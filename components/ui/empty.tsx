import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const emptyMediaVariants = cva(
  "flex items-center justify-center rounded-2xl transition-colors",
  {
    variants: {
      variant: {
        default: "text-muted-foreground",
        icon: "h-14 w-14 rounded-2xl bg-muted/60 text-muted-foreground border border-border/60 [&_svg]:h-6 [&_svg]:w-6 shadow-2xs",
        outline: "h-14 w-14 rounded-2xl border border-dashed border-border/80 text-muted-foreground [&_svg]:h-6 [&_svg]:w-6",
        primary: "h-14 w-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 [&_svg]:h-6 [&_svg]:w-6",
      },
    },
    defaultVariants: {
      variant: "icon",
    },
  }
);

export interface EmptyProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Empty({ className, ...props }: EmptyProps) {
  return (
    <div
      data-slot="empty"
      className={cn(
        "flex min-h-[280px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/50 p-8 text-center animate-in fade-in-50",
        className
      )}
      {...props}
    />
  );
}

export interface EmptyHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function EmptyHeader({ className, ...props }: EmptyHeaderProps) {
  return (
    <div
      data-slot="empty-header"
      className={cn("flex flex-col items-center space-y-2 max-w-md", className)}
      {...props}
    />
  );
}

export interface EmptyMediaProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyMediaVariants> {}

export function EmptyMedia({
  className,
  variant = "icon",
  ...props
}: EmptyMediaProps) {
  return (
    <div
      data-slot="empty-media"
      className={cn(emptyMediaVariants({ variant }), "mb-2", className)}
      {...props}
    />
  );
}

export interface EmptyTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function EmptyTitle({ className, ...props }: EmptyTitleProps) {
  return (
    <h3
      data-slot="empty-title"
      className={cn("text-sm font-semibold tracking-tight text-foreground", className)}
      {...props}
    />
  );
}

export interface EmptyDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

export function EmptyDescription({ className, ...props }: EmptyDescriptionProps) {
  return (
    <p
      data-slot="empty-description"
      className={cn("text-xs text-muted-foreground leading-relaxed", className)}
      {...props}
    />
  );
}

export interface EmptyContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function EmptyContent({ className, ...props }: EmptyContentProps) {
  return (
    <div
      data-slot="empty-content"
      className={cn("mt-4 flex flex-wrap items-center justify-center gap-2", className)}
      {...props}
    />
  );
}
