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
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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
  const [isCheckingHistory, setIsCheckingHistory] = React.useState(false);
  const [linkedCount, setLinkedCount] = React.useState<number | null>(null);
  const [isDeactivating, setIsDeactivating] = React.useState(false);
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

  const recordId = record?.id;

  const handleOpenDeleteDialog = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    }
    if (!recordId || !resource) return;

    setIsCheckingHistory(true);
    try {
      let count = 0;
      if (resource === "therapists") {
        const { count: bCount } = await supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("therapist_id", recordId);
        const { count: pCount } = await supabase
          .from("therapist_payouts")
          .select("id", { count: "exact", head: true })
          .eq("therapist_id", recordId);
        count = (bCount || 0) + (pCount || 0);
      } else if (resource === "services") {
        const { count: bCount } = await supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("service_id", recordId);
        count = bCount || 0;
      } else if (resource === "customers") {
        const { count: bCount } = await supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("customer_id", recordId);
        count = bCount || 0;
      } else if (resource === "promotions") {
        const { count: invCount } = await supabase
          .from("invoices")
          .select("id", { count: "exact", head: true })
          .eq("promo_id", recordId);
        count = invCount || 0;
      }

      setLinkedCount(count);
      setDeleteDialogOpen(true);
    } catch (err) {
      console.error("Error checking linked relations in DeleteButton:", err);
      setLinkedCount(0);
      setDeleteDialogOpen(true);
    } finally {
      setIsCheckingHistory(false);
    }
  };

  const handleDeactivate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!recordId) return;
    setIsDeactivating(true);
    try {
      if (resource === "therapists") {
        await supabase.from("therapists").update({ status: "off_duty" }).eq("id", recordId);
      } else if (resource === "services") {
        await supabase.from("services").update({ is_active: false }).eq("id", recordId);
      } else if (resource === "promotions") {
        await supabase.from("promotions").update({ is_active: false }).eq("id", recordId);
      }
      toast.success(
        isEn
          ? "Status successfully set to inactive. Historical transactions preserved."
          : "Status berhasil dinonaktifkan. Data riwayat transaksi tetap aman terjaga."
      );
      setDeleteDialogOpen(false);
      setTimeout(() => {
        window.location.reload();
      }, 400);
    } catch (err: any) {
      toast.error(err?.message || (isEn ? "Failed to update status" : "Gagal mengubah status"));
    } finally {
      setIsDeactivating(false);
    }
  };

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

  const hasLinkedHistory = typeof linkedCount === "number" && linkedCount > 0;

  return (
    <>
      <Button
        variant={variant}
        type="button"
        onClick={handleOpenDeleteDialog}
        disabled={isPending || isCheckingHistory}
        aria-label={typeof label === "string" ? label : undefined}
        size={size}
        className={className}
      >
        <Trash />
        {label}
      </Button>

      {/* Mitigation AlertDialog before Deletion or Deactivation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {hasLinkedHistory
                ? isEn
                  ? "Record Linked to Active History"
                  : "Data Terikat Riwayat Transaksi Resmi"
                : isEn
                ? "Are you sure you want to delete this record?"
                : "Apakah Anda yakin ingin menghapus data ini?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {hasLinkedHistory ? (
                isEn ? (
                  `This ${resource} record (${recordRepresentation}) is linked to ${linkedCount} official booking/transaction records. To protect financial audit integrity, it cannot be permanently deleted. You can set its status to inactive instead.`
                ) : (
                  `Data ${resource} (${recordRepresentation}) terikat dengan ${linkedCount} riwayat transaksi/booking resmi. Untuk menjaga keabsahan riwayat keuangan & audit, data tidak dapat dihapus permanen. Anda dapat menonaktifkan statusnya agar tidak muncul pada pemesanan baru.`
                )
              ) : isEn ? (
                `This action cannot be undone. This ${resource} record (${recordRepresentation}) has no transaction history and will be permanently removed from the database.`
              ) : (
                `Tindakan ini tidak dapat dibatalkan. Data ${resource} (${recordRepresentation}) belum memiliki riwayat transaksi dan akan dihapus bersih secara permanen dari database.`
              )}
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
              className="h-8 text-xs font-medium cursor-pointer"
            >
              {isEn ? "Cancel" : "Batal"}
            </Button>
            {hasLinkedHistory ? (
              <Button
                type="button"
                variant="default"
                disabled={isDeactivating}
                onClick={handleDeactivate}
                className="h-8 text-xs font-medium bg-[#8b5e3c] hover:bg-[#724b30] text-white cursor-pointer"
              >
                {isEn ? "Deactivate Status" : "Nonaktifkan Status"}
              </Button>
            ) : (
              <Button
                type="button"
                variant="destructive"
                onClick={confirmDelete}
                className="h-8 text-xs font-medium cursor-pointer"
              >
                {isEn ? "Yes, Delete Cleanly" : "Ya, Hapus Bersih"}
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
