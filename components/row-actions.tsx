"use client";

import * as React from "react";
import {
  useRecordContext,
  useResourceContext,
  useCreatePath,
  useDeleteWithUndoController,
  useLocaleState,
  useNavigate,
} from "ra-core";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ReceiptText,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface RowActionsProps {
  showView?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
  showCreateInvoice?: boolean;
  showMakePayout?: boolean;
  customActions?: React.ReactNode;
  className?: string;
}

/**
 * Standard shadcn/ui Dropdown Action Menu for DataTable rows.
 * Provides clean, space-efficient, and elegant action triggers with Lucide icons.
 */
export const RowActions = ({
  showView = true,
  showEdit = true,
  showDelete = true,
  showCreateInvoice = false,
  showMakePayout = false,
  customActions,
  className,
}: RowActionsProps) => {
  const record = useRecordContext();
  const resource = useResourceContext();
  const createPath = useCreatePath();
  const navigate = useNavigate();
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [isCheckingHistory, setIsCheckingHistory] = React.useState(false);
  const [linkedCount, setLinkedCount] = React.useState<number | null>(null);
  const [isDeactivating, setIsDeactivating] = React.useState(false);

  const { handleDelete } = useDeleteWithUndoController({
    record,
    resource,
  });

  const recordId = record?.id;

  const handleOpenDeleteDialog = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
      console.error("Error checking linked relations:", err);
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

  if (!record || !resource) return null;

  const showPath = createPath({ resource, type: "show", id: record.id });
  const editPath = createPath({ resource, type: "edit", id: record.id });

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleCreateInvoice = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate("/invoices/create");
  };

  const handleMakePayout = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/payouts/create?therapist_id=${record.id}`);
  };

  const isTherapist = resource === "therapists";
  const hasLinkedHistory = typeof linkedCount === "number" && linkedCount > 0;

  return (
    <>
      <div
        className={cn("flex items-center justify-end", className)}
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md data-[state=open]:bg-accent cursor-pointer"
              />
            }
          >
            <span className="sr-only">Open actions menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 z-50">
            {showView && (
              <DropdownMenuItem
                onClick={() => handleNavigate(showPath)}
                className="cursor-pointer gap-2"
              >
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{isEn ? "View Details" : "Lihat Detail"}</span>
              </DropdownMenuItem>
            )}

            {showEdit && (
              <DropdownMenuItem
                onClick={() => handleNavigate(editPath)}
                className="cursor-pointer gap-2"
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{isEn ? "Edit" : "Ubah Data"}</span>
              </DropdownMenuItem>
            )}

            {(showMakePayout || isTherapist) && (
              <DropdownMenuItem
                onClick={handleMakePayout}
                className="cursor-pointer gap-2 text-foreground font-medium"
              >
                <ReceiptText className="h-3.5 w-3.5 text-primary" />
                <span>{isEn ? "Make Payout" : "Rekap Bagi Hasil"}</span>
              </DropdownMenuItem>
            )}

            {showCreateInvoice && (
              <DropdownMenuItem
                onClick={handleCreateInvoice}
                className="cursor-pointer gap-2 text-primary focus:text-primary"
              >
                <ReceiptText className="h-3.5 w-3.5 text-primary" />
                <span>{isEn ? "Create Invoice" : "Buat Nota / POS"}</span>
              </DropdownMenuItem>
            )}

            {customActions}

            {showDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={handleOpenDeleteDialog}
                  disabled={isCheckingHistory}
                  className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{isEn ? "Delete" : "Hapus"}</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
                  `This ${resource} record has ${linkedCount} official booking/transaction records. To protect financial audit integrity, it cannot be permanently deleted. You can set its status to inactive instead.`
                ) : (
                  `Data ${resource} (#${record.id}) terikat dengan ${linkedCount} riwayat transaksi/booking resmi. Untuk menjaga keabsahan riwayat keuangan & audit, data tidak dapat dihapus permanen. Anda dapat menonaktifkan statusnya agar tidak muncul pada pemesanan baru.`
                )
              ) : isEn ? (
                `This action cannot be undone. This ${resource} record (#${record.id}) has no transaction history and will be permanently removed from the database.`
              ) : (
                `Tindakan ini tidak dapat dibatalkan. Data ${resource} (#${record.id}) belum memiliki riwayat transaksi dan akan dihapus bersih secara permanen dari database.`
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
                onClick={(e) => {
                  handleDelete(e as any);
                  setDeleteDialogOpen(false);
                }}
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
