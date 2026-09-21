"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbPage,
  useResourceParent,
} from "@/components/breadcrumb";
import type { ShowBaseProps } from "ra-core";
import {
  LinkBase,
  ShowBase,
  Translate,
  useCreatePath,
  useHasDashboard,
  useShowContext,
  useGetRecordRepresentation,
  useGetResourceLabel,
  useResourceContext,
  useResourceDefinition,
} from "ra-core";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { EditButton } from "@/components/edit-button";
import { Skeleton, CardSkeleton, AvatarSkeleton } from "@/components/ui/skeleton";

export interface ShowProps
  extends ShowViewProps, Omit<ShowBaseProps, "children"> {}

/**
 * A complete show page with breadcrumb, title, and default actions.
 *
 * Combines data fetching and UI layout for displaying record details. Inside, use
 * RecordField to display individual fields with labels.
 *
 * @see {@link https://marmelab.com/shadcn-admin-kit/docs/show/ Show documentation}
 *
 * @example
 * import { RecordField, NumberField, ReferenceField, Show } from "@/components/admin";
 *
 * export const ProductShow = () => (
 *   <Show>
 *     <div className="flex flex-col gap-4">
 *       <RecordField source="reference" />
 *       <RecordField source="category_id">
 *         <ReferenceField source="category_id" reference="categories" />
 *       </RecordField>
 *       <RecordField
 *         source="price"
 *         render={(record) => Intl.NumberFormat().format(record.price)}
 *       />
 *       <RecordField source="size" field={NumberField} />
 *     </div>
 *   </Show>
 * );
 */
export const Show = ({
  actions,
  children,
  className,
  disableAuthentication,
  disableBreadcrumb,
  id,
  loading,
  queryOptions,
  render,
  resource,
  title,
}: ShowProps) => (
  <ShowBase
    id={id}
    resource={resource}
    queryOptions={queryOptions}
    disableAuthentication={disableAuthentication}
    render={render}
    loading={loading}
  >
    <ShowView
      title={title}
      actions={actions}
      className={className}
      disableBreadcrumb={disableBreadcrumb}
    >
      {children}
    </ShowView>
  </ShowBase>
);

export interface ShowViewProps {
  actions?: ReactNode;
  disableBreadcrumb?: boolean;
  children: ReactNode;
  className?: string;
  emptyWhileLoading?: boolean;
  title?: ReactNode | string | false;
}

/**
 * The view component for Show pages with layout and UI.
 *
 * Renders breadcrumb, title, and default actions for show pages. Use Show instead unless you need
 * custom data fetching logic with ShowBase.
 *
 * @example
 * import { ShowBase, ShowView, SimpleShowLayout } from '@/components/admin';
 *
 * export const PostShow = () => (
 *     <ShowBase>
 *         <ShowView>
 *             <SimpleShowLayout>...</SimpleShowLayout>
 *         </ShowView>
 *     </ShowBase>
 * );
 */
export const ShowView = ({
  actions,
  children,
  className,
  disableBreadcrumb,
  emptyWhileLoading,
  title,
}: ShowViewProps) => {
  const context = useShowContext();

  const resource = useResourceContext();
  if (!resource) {
    throw new Error(
      "The ShowView component must be used within a ResourceContextProvider",
    );
  }
  const getResourceLabel = useGetResourceLabel();
  const listLabel = getResourceLabel(resource, 2);
  const createPath = useCreatePath();
  const listLink = createPath({
    resource,
    type: "list",
  });

  const getRecordRepresentation = useGetRecordRepresentation(resource);
  const recordRepresentation = getRecordRepresentation(context.record);

  const { hasEdit } = useResourceDefinition({ resource });
  const hasDashboard = useHasDashboard();

  if (context.isPending || context.isLoading) {
    return (
      <div className="space-y-4 my-4 animate-in fade-in-50 duration-200">
        <div className="flex items-center justify-between pb-2">
          <Skeleton className="h-7 w-48 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>

        {/* Profile / Main Dossier Header Skeleton */}
        <div className="rounded-xl border border-border/80 bg-card p-5 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <AvatarSkeleton size="lg" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-28 rounded-md" />
              <Skeleton className="h-8 w-28 rounded-md" />
            </div>
          </div>
        </div>

        {/* 2 Grid Cards Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardSkeleton lines={4} />
          <CardSkeleton lines={4} />
          <CardSkeleton lines={4} />
          <CardSkeleton lines={4} />
        </div>
      </div>
    );
  }

  if (context.error || (!context.record && !context.isLoading)) {
    return (
      <div className="p-8 text-center space-y-3 rounded-xl border border-dashed border-border/80 bg-muted/20 my-4">
        <p className="text-sm text-destructive font-medium">
          {context.error ? String(context.error) : "Data tidak ditemukan atau belum tersedia."}
        </p>
        <LinkBase to={listLink} className="inline-flex items-center justify-center rounded-md text-xs font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4">
          Kembali ke Daftar {listLabel}
        </LinkBase>
      </div>
    );
  }

  const parent = useResourceParent(resource);

  return (
    <>
      {!disableBreadcrumb && (
        <Breadcrumb>
          {hasDashboard && (
            <BreadcrumbItem>
              <LinkBase to="/">
                <Translate i18nKey="ra.page.dashboard">Home</Translate>
              </LinkBase>
            </BreadcrumbItem>
          )}
          {parent && (
            <BreadcrumbItem>
              <LinkBase to={parent.path}>{parent.label}</LinkBase>
            </BreadcrumbItem>
          )}
          <BreadcrumbItem>
            <LinkBase to={listLink}>{listLabel}</LinkBase>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbPage>{recordRepresentation}</BreadcrumbPage>
          </BreadcrumbItem>
        </Breadcrumb>
      )}
      <div
        className={cn(
          "flex justify-between items-start flex-wrap gap-2 my-2",
          className,
        )}
      >
        <h2 className="text-2xl font-bold tracking-tight">
          {title !== undefined ? title : context.defaultTitle}
        </h2>
        {actions ?? (
          <div className="flex justify-end items-center">
            {hasEdit ? <EditButton /> : null}
          </div>
        )}
      </div>
      <div className="my-2">{children}</div>
    </>
  );
};
