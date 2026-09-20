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

  const { handleDelete } = useDeleteWithUndoController({
    record,
    resource,
  });

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
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteDialogOpen(true);
                  }}
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

      {/* Mitigation AlertDialog before Permanent Deletion */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isEn ? "Are you sure you want to delete this record?" : "Apakah Anda yakin ingin menghapus data ini?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isEn
                ? `This action cannot be undone. This ${resource} record (#${record.id}) will be permanently removed from the database.`
                : `Tindakan ini tidak dapat dibatalkan. Data ${resource} (#${record.id}) akan dihapus secara permanen dari database.`}
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
              onClick={(e) => {
                handleDelete(e as any);
                setDeleteDialogOpen(false);
              }}
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
