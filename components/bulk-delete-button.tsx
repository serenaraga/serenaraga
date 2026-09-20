import * as React from "react";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import type { RaRecord, UseBulkDeleteControllerParams } from "ra-core";
import {
  useBulkDeleteController,
  useGetResourceLabel,
  useResourceContext,
  useResourceTranslation,
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
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export const BulkDeleteButton = <
  RecordType extends RaRecord = any,
  MutationOptionsError = unknown,
>({
  icon = defaultIcon,
  label: labelProp,
  className,
  ...props
}: BulkDeleteButtonProps<RecordType, MutationOptionsError>) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const { handleDelete, isPending } = useBulkDeleteController(props);
  const resource = useResourceContext(props);
  const getResourceLabel = useGetResourceLabel();
  const label = useResourceTranslation({
    resourceI18nKey: resource
      ? `resources.${resource}.action.delete`
      : undefined,
    baseI18nKey: "ra.action.delete",
    options: {
      name: resource ? getResourceLabel(resource, 1) : undefined,
    },
    userText: labelProp,
  });

  const confirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleDelete();
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <Button
        variant="destructive"
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setDeleteDialogOpen(true);
        }}
        disabled={isPending}
        aria-label={typeof label === "string" ? label : undefined}
        className={cn("h-9 gap-1.5 text-xs font-medium", className)}
      >
        {icon}
        {label}
      </Button>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isEn
                ? "Delete selected records?"
                : "Hapus semua data yang dipilih?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isEn
                ? `This action cannot be undone. All selected ${resource} items will be permanently removed from the database.`
                : `Tindakan ini tidak dapat dibatalkan. Semua data ${resource} yang dipilih akan dihapus secara permanen dari database.`}
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
              {isEn ? "Yes, Delete Selected" : "Ya, Hapus Data Terpilih"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export type BulkDeleteButtonProps<
  RecordType extends RaRecord = any,
  MutationOptionsError = unknown,
> = {
  label?: string;
  icon?: ReactNode;
} & React.ComponentPropsWithoutRef<"button"> &
  UseBulkDeleteControllerParams<RecordType, MutationOptionsError>;

const defaultIcon = <Trash />;
