"use client";

import * as React from "react";
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { humanize, singularize } from "inflection";
import type { UseDeleteOptions, RedirectionSideEffect } from "ra-core";
import {
  useDeleteWithUndoController,
  useGetRecordRepresentation,
  useResourceTranslation,
  useRecordContext,
  useResourceContext,
  useTranslate,
  useLocaleState,
} from "ra-core";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";

export type DeleteButtonProps = {
  label?: string;
  size?: "default" | "sm" | "lg" | "icon";
  onClick?: React.ReactEventHandler<HTMLButtonElement>;
  mutationOptions?: UseDeleteOptions;
  redirect?: RedirectionSideEffect;
  resource?: string;
  successMessage?: string;
  className?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
};

/**
 * A button that deletes a record with undo capability.
 *
 * Renders a destructive button that deletes the current record and shows an undo notification.
 * Automatically redirects after deletion and works with the RecordContext.
 *
 * @see {@link https://marmelab.com/shadcn-admin-kit/docs/deletebutton/ DeleteButton documentation}
 *
 * @example
 * import { DeleteButton, Edit } from '@/components/admin';
 *
 * const PostEdit = () => (
 *     <Edit actions={<DeleteButton />}>
 *         ...
 *     </Edit>
 * );
 */
export const DeleteButton = (props: DeleteButtonProps) => {
  const {
    label: labelProp,
    onClick,
    size,
    mutationOptions,
    redirect = "list",
    successMessage,
    variant = "outline",
    className = "cursor-pointer hover:bg-destructive/10! text-destructive! border-destructive! focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
  } = props;
  const record = useRecordContext(props);
  const resource = useResourceContext(props);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  const { isPending, handleDelete } = useDeleteWithUndoController({
    record,
    resource,
    redirect,
    onClick,
    mutationOptions,
    successMessage,
  });
  const translate = useTranslate();
  const getRecordRepresentation = useGetRecordRepresentation(resource);
  let recordRepresentation = getRecordRepresentation(record);
  const resourceName = translate(`resources.${resource}.forcedCaseName`, {
    smart_count: 1,
    _: humanize(
      translate(`resources.${resource}.name`, {
        smart_count: 1,
        _: resource ? singularize(resource) : undefined,
      }),
      true,
    ),
  });
  // We don't support React elements for this
  if (React.isValidElement(recordRepresentation)) {
    recordRepresentation = `#${record?.id}`;
  }
  const label = useResourceTranslation({
    resourceI18nKey: `resources.${resource}.action.delete`,
    baseI18nKey: "ra.action.delete",
    options: {
      name: resourceName,
      recordRepresentation,
    },
    userText: labelProp,
  });

  const confirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleDelete(e as any);
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <Button
        variant={variant}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setDeleteDialogOpen(true);
        }}
        disabled={isPending}
        aria-label={typeof label === "string" ? label : undefined}
        size={size}
        className={className}
      >
        <Trash />
        {label}
      </Button>

      {/* Mitigation AlertDialog before Permanent Deletion */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isEn ? "Are you sure you want to delete this record?" : "Apakah Anda yakin ingin menghapus data ini?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isEn
                ? `This action cannot be undone. This ${resource} record (${recordRepresentation}) will be permanently deleted from the database.`
                : `Tindakan ini tidak dapat dibatalkan. Data ${resource} (${recordRepresentation}) akan dihapus secara permanen dari database.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteDialogOpen(false);
              }}
              className="h-8 text-xs font-medium"
            >
              {isEn ? "Cancel" : "Batal"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              className="h-8 text-xs font-medium"
            >
              {isEn ? "Yes, Delete" : "Ya, Hapus Data"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
