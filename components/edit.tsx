"use client";

import type { EditBaseProps } from "ra-core";
import {
  EditBase,
  LinkBase,
  Translate,
  useCreatePath,
  useEditContext,
  useGetRecordRepresentation,
  useGetResourceLabel,
  useHasDashboard,
  useResourceContext,
  useResourceDefinition,
} from "ra-core";
import type { ReactNode } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbPage,
  useResourceParent,
} from "@/components/breadcrumb";
import { cn } from "@/lib/utils";
import { ShowButton } from "@/components/show-button";
import { DeleteButton } from "./delete-button";
import { Skeleton, FormSkeleton } from "@/components/ui/skeleton";

export interface EditProps extends EditViewProps, EditBaseProps {}

/**
 * A complete edit page with breadcrumb, title, and default actions.
 *
 * Combines data fetching, form context, and UI layout for editing records. Renders breadcrumb,
 * page title, Show and Delete buttons, and wraps your form components.
 *
 * @see {@link https://marmelab.com/shadcn-admin-kit/docs/edit/ Edit documentation}
 *
 * @example
 * import { Edit, SimpleForm, BooleanInput, TextInput } from "@/components/admin";
 * import { required } from 'ra-core';
 *
 * export const CustomerEdit = () => (
 *   <Edit>
 *     <SimpleForm>
 *       <TextInput source="first_name" validate={required()} />
 *       <TextInput source="last_name" validate={required()} />
 *       <TextInput source="email" validate={required()} />
 *       <BooleanInput source="has_ordered" />
 *       <TextInput multiline source="notes" />
 *     </SimpleForm>
 *   </Edit>
 * );
 */
export const Edit = ({
  actions,
  children,
  className,
  disableBreadcrumb,
  title,
  ...rest
}: EditProps) => (
  <EditBase {...rest}>
    <EditView
      actions={actions}
      className={className}
      disableBreadcrumb={disableBreadcrumb}
      title={title}
    >
      {children}
    </EditView>
  </EditBase>
);

export interface EditViewProps {
  disableBreadcrumb?: boolean;
  title?: ReactNode | string | false;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/**
 * The view component for Edit pages with layout and UI.
 *
 * @internal
 */
export const EditView = ({
  disableBreadcrumb,
  title,
  actions,
  className,
  children,
}: EditViewProps) => {
  const context = useEditContext();

  const resource = useResourceContext();
  if (!resource) {
    throw new Error(
      "The EditView component must be used within a ResourceContextProvider",
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

  const { hasShow } = useResourceDefinition({ resource });
  const hasDashboard = useHasDashboard();

  if (context.isPending || context.isLoading) {
    return (
      <div className="space-y-6 my-4 animate-in fade-in-50 duration-200">
        <div className="flex items-center justify-between pb-2">
          <Skeleton className="h-7 w-48 rounded-md" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md" />
          </div>
        </div>
        <div className="rounded-xl border border-border/80 bg-card p-6 shadow-2xs">
          <FormSkeleton fields={6} columns={2} />
        </div>
      </div>
    );
  }

  if (context.error || (!context.record && !context.isLoading)) {
    return (
      <div className="p-8 text-center space-y-3 rounded-xl border border-dashed border-border/80 bg-muted/20 my-4">
        <p className="text-sm text-destructive font-medium">
          {context.error ? String(context.error) : "Data tidak ditemukan atau gagal dimuat."}
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
          <div className="flex justify-end items-center gap-2 flex-wrap">
            {hasShow ? <ShowButton /> : null}
            <DeleteButton />
          </div>
        )}
      </div>
      <div className="my-2">{children}</div>
    </>
  );
};
