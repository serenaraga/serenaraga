"use client";

import * as React from "react";
import {
  useRecordContext,
  useTranslate,
  useLocaleState,
  useNavigate,
  required,
} from "ra-core";
import { useFormContext } from "react-hook-form";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { List } from "@/components/list";
import { DataTable, DataTableCol } from "@/components/data-table";
import { TextField } from "@/components/text-field";
import { NumberField } from "@/components/number-field";
import { BadgeField } from "@/components/badge-field";
import { Edit } from "@/components/edit";
import { Create } from "@/components/create";
import { Show } from "@/components/show";
import { SimpleForm } from "@/components/simple-form";
import { TextInput } from "@/components/text-input";
import { NumberInput } from "@/components/number-input";
import { SelectInput } from "@/components/select-input";
import { DatePickerInput } from "@/components/date-picker-input";
import { PhoneInput } from "@/components/phone-input";
import { RowActions } from "@/components/row-actions";
import { HDFileUpload } from "@/components/hd-file-upload";
import { SaveButton } from "@/components/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatIDR } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  UserCheck,
  ShieldCheck,
  Phone,
  CreditCard,
  MapPin,
  Calendar,
  FileText,
  Award,
  Sparkles,
  Eye,
  ExternalLink,
  Copy,
  Check,
  HeartPulse,
  Building,
  Building2,
  User,
  Star,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  ArrowLeft,
  ReceiptText,
  Wallet,
  CalendarDays,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { cleanWhatsAppNumber } from "@/lib/brand-settings";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Custom Column: Therapist Profile with Avatar & NIK (No Background Avatar)
 */
const TherapistNameCol = () => {
  const record = useRecordContext();
  if (!record) return null;

  const initial = record.name?.charAt(0).toUpperCase() || "T";

  return (
    <div className="flex items-center gap-3 py-0.5">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={record.photo_url} alt={record.name} />
        <AvatarFallback className="text-xs font-semibold">
          {initial}
        </AvatarFallback>
      </Avatar>
      <div className="grid text-left leading-tight min-w-0">
        <span className="font-semibold text-foreground truncate max-w-[180px]">
          {record.name}
        </span>
        <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">
          {record.nik ? `NIK: ${record.nik}` : record.gender || "Therapist"}
        </span>
      </div>
    </div>
  );
};

/**
 * List View for Therapists
 */
export const TherapistList = () => {
  return (
    <List>
      <DataTable>
        <DataTableCol
          source="id"
          label="#"
          headerClassName="w-14"
          cellClassName="text-xs font-bold text-primary"
        />
        <DataTableCol
          source="name"
          headerClassName="min-w-[180px]"
          render={() => <TherapistNameCol />}
        />
        <DataTableCol source="phone" cellClassName="text-xs" />
        <DataTableCol
          source="specialties"
          cellClassName="text-xs text-muted-foreground truncate max-w-[180px]"
        />
        <DataTableCol
          source="rating"
          render={(record) =>
            record.rating != null ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                <span>{Number(record.rating).toFixed(1)}</span>
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">-</span>
            )
          }
        />
        <DataTableCol
          source="commission_rate"
          render={(record) => (
            <span className="text-xs text-foreground font-medium">
              {record.commission_rate != null ? `${record.commission_rate}%` : "-"}
            </span>
          )}
        />
        <DataTableCol source="status">
          <BadgeField source="status" />
        </DataTableCol>
        <DataTableCol
          label="ra.action.name"
          headerClassName="text-right w-16"
          cellClassName="text-right"
        >
          <RowActions />
        </DataTableCol>
      </DataTable>
    </List>
  );
};

/**
 * Multi-Step Wizard Form for Registering & Editing Therapists
 */
const TherapistWizardForm: React.FC<{ mode: "create" | "edit" }> = ({ mode }) => {
  const [currentStep, setCurrentStep] = React.useState<number>(1);
  const { getValues, setError, clearErrors } = useFormContext();
  const translate = useTranslate();
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  const steps = [
    {
      id: 1,
      title: isEn ? "Identity & KTP" : "Identitas & KTP",
      subtitle: isEn ? "Personal info & verification" : "Data diri & legalitas",
      icon: ShieldCheck,
    },
    {
      id: 2,
      title: isEn ? "Profile & Documents" : "Kualifikasi & Dokumen",
      subtitle: isEn ? "Uniform photo, CV & skills" : "Foto seragam, CV & keahlian",
      icon: Sparkles,
    },
    {
      id: 3,
      title: isEn ? "Operations & Payroll" : "Finansial & Operasional",
      subtitle: isEn ? "Bank account & fee rate" : "Rekening, komisi & area",
      icon: CreditCard,
    },
  ];

  /**
   * Validate required fields before allowing next step or final submit
   */
  const validateStep = (stepNumber: number): boolean => {
    const values = getValues();
    if (stepNumber === 1 || stepNumber > 1) {
      const name = values?.name ? String(values.name).trim() : "";
      const phone = values?.phone ? String(values.phone).trim() : "";
      let hasError = false;

      if (!name) {
        setError("name", {
          type: "manual",
          message: isEn ? "Full Name is required" : "Nama lengkap wajib diisi",
        });
        hasError = true;
      } else {
        clearErrors("name");
      }

      if (!phone) {
        setError("phone", {
          type: "manual",
          message: isEn ? "WhatsApp phone is required" : "Nomor WhatsApp wajib diisi",
        });
        hasError = true;
      } else {
        clearErrors("phone");
      }

      if (hasError) {
        toast.error(
          isEn
            ? "Please enter Therapist Name and Phone Number first!"
            : "Mohon lengkapi Nama Lengkap dan Nomor WhatsApp terapis terlebih dahulu!"
        );
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !validateStep(1)) {
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. Interactive Stepper Header */}
      <div className="rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
        <div className="grid grid-cols-3 gap-2">
          {steps.map((step) => {
            const StepIcon = step.icon;
            const isCompleted = currentStep > step.id;
            const isActive = currentStep === step.id;

            return (
              <Button
                key={step.id}
                type="button"
                variant="ghost"
                onClick={() => {
                  if (step.id > 1 && !validateStep(1)) {
                    setCurrentStep(1);
                    return;
                  }
                  setCurrentStep(step.id);
                }}
                className={cn(
                  "h-auto flex flex-col sm:flex-row items-center sm:items-start gap-2.5 p-2.5 rounded-lg text-left transition-all justify-start",
                  isActive
                    ? "bg-primary/10 border border-primary/30"
                    : isCompleted
                    ? "hover:bg-muted/40 opacity-90"
                    : "opacity-40 hover:opacity-60"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : isCompleted
                      ? "bg-emerald-600 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                </div>

                <div className="grid text-center sm:text-left min-w-0">
                  <span
                    className={cn(
                      "text-xs font-bold truncate",
                      isActive ? "text-primary" : "text-foreground"
                    )}
                  >
                    {step.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground hidden md:block truncate">
                    {step.subtitle}
                  </span>
                </div>
              </Button>
            );
          })}
        </div>

        {/* Progress Bar Indicator */}
        <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* 2. Step Form Contents with Smooth Animated Transition */}
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 rounded-xl border border-border/70 bg-card p-5"
          >
            <div className="flex items-center gap-2 pb-3 border-b border-border/50">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {isEn ? "Personal Identity & National ID" : "Data Pribadi & KTP"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isEn ? "Therapist personal information and legal identity." : "Informasi data diri dan identitas resmi terapis."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <TextInput
                source="name"
                label={translate("resources.therapists.fields.name")}
                placeholder={isEn ? "e.g. Siti Nurhaliza" : "Contoh: Siti Rahmawati"}
                validate={required(isEn ? "Full Name is required" : "Nama lengkap wajib diisi")}
                required
              />
              <TextInput
                source="nik"
                label={translate("resources.therapists.fields.nik")}
                placeholder="3276012345670001"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              <PhoneInput
                source="phone"
                label={translate("resources.therapists.fields.phone")}
                placeholder="812-3456-7890"
                validate={required(isEn ? "Phone is required" : "Nomor WhatsApp wajib diisi")}
                required
              />
              <SelectInput
                source="gender"
                label={translate("resources.therapists.fields.gender")}
                defaultValue="Female"
                choices={[
                  { id: "Female", name: "resources.therapists.gender.Female" },
                  { id: "Male", name: "resources.therapists.gender.Male" },
                ]}
              />
              <DatePickerInput
                source="birth_date"
                label={translate("resources.therapists.fields.birth_date")}
                isBirthDate
              />
            </div>

            <TextInput
              source="domicile_address"
              label={translate("resources.therapists.fields.domicile_address")}
              placeholder={isEn ? "Current residential address in operational coverage..." : "Alamat tempat tinggal / domisili saat ini..."}
              multiline
              rows={2}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start pt-2 border-t border-border/40">
              <TextInput
                source="emergency_contact_name"
                label={translate("resources.therapists.fields.emergency_contact_name")}
                placeholder={isEn ? "e.g. Ahmad (Family)" : "Contoh: Budi (Keluarga)"}
              />
              <PhoneInput
                source="emergency_contact_phone"
                label={translate("resources.therapists.fields.emergency_contact_phone")}
                placeholder="812-9999-8888"
              />
            </div>

            {/* KTP Upload */}
            <HDFileUpload
              source="ktp_photo_url"
              label={isEn ? "National ID Photo (KTP)" : "Foto KTP Asli"}
              bucketName="therapist-documents"
              fileType="image"
            />
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 rounded-xl border border-border/70 bg-card p-5"
          >
            <div className="flex items-center gap-2 pb-3 border-b border-border/50">
              <Sparkles className="w-4 h-4 text-primary" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {isEn ? "Therapist Profile & Documents" : "Profil Terapis & Dokumen"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isEn ? "Upload uniform portrait, CV, and competency certificate." : "Upload foto seragam, CV, dan sertifikat keahlian terapis."}
                </p>
              </div>
            </div>

            <HDFileUpload
              source="photo_url"
              label={isEn ? "Uniform Profile Photo" : "Foto Profil Seragam"}
              bucketName="therapist-photos"
              fileType="image"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              <TextInput
                source="specialties"
                label={translate("resources.therapists.fields.specialties")}
                defaultValue={mode === "create" ? "Traditional, Reflexology, Deep Tissue" : undefined}
                placeholder="Traditional, Reflexology, Deep Tissue"
                className="sm:col-span-2"
              />
              <NumberInput
                source="experience_years"
                label={translate("resources.therapists.fields.experience_years")}
                defaultValue={mode === "create" ? 2 : undefined}
                min={0}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <HDFileUpload
                source="cv_url"
                label={isEn ? "CV / Resume" : "Dokumen CV / Resume"}
                bucketName="therapist-documents"
                fileType="document"
              />
              <HDFileUpload
                source="certificate_url"
                label={isEn ? "Competency Certificate / BNSP" : "Sertifikat Keahlian / BNSP"}
                bucketName="therapist-documents"
                fileType="document"
              />
            </div>
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 rounded-xl border border-border/70 bg-card p-5"
          >
            <div className="flex items-center gap-2 pb-3 border-b border-border/50">
              <CreditCard className="w-4 h-4 text-primary" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {isEn ? "Payroll & Operations" : "Finansial & Operasional"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isEn ? "Set commission fee rate, bank account details, and operational areas." : "Pengaturan bagi hasil fee komisi, rekening bank, dan area operasional."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <NumberInput
                source="commission_rate"
                label={translate("resources.therapists.fields.commission_rate")}
                min={0}
                max={100}
                defaultValue={60}
                required
              />
              <SelectInput
                source="status"
                label={translate("resources.therapists.fields.status")}
                defaultValue={mode === "create" ? "available" : undefined}
                choices={[
                  { id: "available", name: "resources.therapists.status.available" },
                  { id: "on_duty", name: "resources.therapists.status.on_duty" },
                  { id: "off_duty", name: "resources.therapists.status.off_duty" },
                  { id: "pending_verification", name: "resources.therapists.status.pending_verification" },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              <SelectInput
                source="bank_name"
                label={translate("resources.therapists.fields.bank_name")}
                defaultValue="BCA"
                choices={[
                  { id: "BCA", name: "BCA (Bank Central Asia)" },
                  { id: "Mandiri", name: "Bank Mandiri" },
                  { id: "BRI", name: "Bank Rakyat Indonesia (BRI)" },
                  { id: "BNI", name: "Bank Negara Indonesia (BNI)" },
                  { id: "BSI", name: "Bank Syariah Indonesia (BSI)" },
                  { id: "CIMB", name: "CIMB Niaga" },
                  { id: "Jago", name: "Bank Jago" },
                  { id: "SeaBank", name: "SeaBank" },
                  { id: "GoPay / OVO / Dana", name: "E-Wallet (GoPay/OVO/Dana)" },
                ]}
              />
              <TextInput
                source="bank_account_number"
                label={translate("resources.therapists.fields.bank_account_number")}
                placeholder="1234-5678-90"
              />
              <TextInput
                source="bank_account_name"
                label={translate("resources.therapists.fields.bank_account_name")}
                placeholder={isEn ? "Account holder name" : "Nama pemilik rekening"}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <TextInput
                source="coverage_areas"
                label={translate("resources.therapists.fields.coverage_areas")}
                defaultValue={mode === "create" ? "Jakarta Selatan, Tangerang Selatan" : undefined}
                placeholder={isEn ? "e.g. Jakarta Selatan, BSD" : "Contoh: Jakarta Selatan, Tangerang Selatan"}
              />
              <DatePickerInput
                source="joined_date"
                label={translate("resources.therapists.fields.joined_date")}
                defaultValue={mode === "create" ? new Date().toISOString().split("T")[0] : undefined}
              />
            </div>

            <TextInput
              source="notes"
              label={translate("resources.therapists.fields.notes")}
              placeholder={isEn ? "Internal HR notes, evaluation..." : "Catatan verifikasi dokumen atau catatan HR internal..."}
              multiline
              rows={2}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Bottom Step Navigation Toolbar */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevStep}
          disabled={currentStep === 1}
          className="h-9 text-xs gap-1.5 shadow-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isEn ? "Back" : "Kembali"}</span>
        </Button>

        <div className="flex items-center gap-2">
          {currentStep < 3 ? (
            <Button
              type="button"
              onClick={handleNextStep}
              className="h-9 text-xs gap-1.5 shadow-none"
            >
              <span>
                {currentStep === 1
                  ? isEn
                    ? "Next: Qualifications & Documents"
                    : "Lanjut: Kualifikasi & Dokumen"
                  : isEn
                  ? "Next: Operations & Payroll"
                  : "Lanjut: Finansial & Operasional"}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <SaveButton
              onClick={(e: React.MouseEvent) => {
                if (!validateStep(1)) {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentStep(1);
                }
              }}
              label={
                mode === "create"
                  ? isEn
                    ? "✓ Register Therapist"
                    : "✓ Selesai & Daftarkan Terapis"
                  : isEn
                  ? "✓ Save Changes"
                  : "✓ Simpan Perubahan"
              }
              className="h-9 text-xs gap-1.5 shadow-none"
            />
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Edit View for Therapists
 */
export const TherapistEdit = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <Edit title={isEn ? "Edit Therapist Data" : "Ubah Data Terapis"}>
      <SimpleForm toolbar={false}>
        <TherapistWizardForm mode="edit" />
      </SimpleForm>
    </Edit>
  );
};

/**
 * Create View for Therapists (Multi-Step Form)
 */
export const TherapistCreate = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <Create title={isEn ? "Register New Therapist" : "Tambah Terapis Baru"}>
      <SimpleForm toolbar={false}>
        <TherapistWizardForm mode="create" />
      </SimpleForm>
    </Create>
  );
};

/**
 * Row Actions Dropdown for Payout Slips with reactive Optimistic Deletion & Sonner Undo support
 */
interface PayoutRowActionsProps {
  payout: any;
  onDeleted?: (deletedId: number | string) => void;
  onRestore?: () => void;
}

const PayoutRowActions = ({ payout, onDeleted, onRestore }: PayoutRowActionsProps) => {
  const navigate = useNavigate();
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const confirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialogOpen(false);

    // 1. Optimistic removal from table immediately
    if (onDeleted) {
      onDeleted(payout.id);
    }

    let isCancelled = false;

    // 2. Set timeout before executing permanent DB deletion
    const timer = setTimeout(async () => {
      if (isCancelled) return;
      try {
        const { error } = await supabase
          .from("therapist_payouts")
          .delete()
          .eq("id", payout.id);

        if (error) {
          console.error("Error deleting payout:", error);
          toast.error(
            isEn ? "Failed to delete payout slip" : "Gagal menghapus slip bagi hasil"
          );
          if (onRestore) onRestore();
        }
      } catch (err: any) {
        console.error("Delete payout error:", err);
        if (onRestore) onRestore();
      }
    }, 5500);

    // 3. Show Toast with interactive Undo Action Button
    toast(
      isEn
        ? `Payout slip ${payout.payout_number} deleted`
        : `Slip bagi hasil ${payout.payout_number} berhasil dihapus`,
      {
        duration: 5000,
        action: {
          label: isEn ? "Undo" : "Batalkan",
          onClick: () => {
            isCancelled = true;
            clearTimeout(timer);
            if (onRestore) onRestore();
            toast.success(
              isEn
                ? "Payout slip restored successfully"
                : "Penghapusan slip berhasil dibatalkan"
            );
          },
        },
      }
    );
  };

  return (
    <>
      <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md cursor-pointer"
              />
            }
          >
            <span className="sr-only">Open action menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 z-50">
            <DropdownMenuItem
              onClick={() => navigate(`/payouts/${payout.id}/show`)}
              className="cursor-pointer gap-2"
            >
              <ReceiptText className="h-3.5 w-3.5 text-primary" />
              <span>{isEn ? "View Slip" : "Buka Slip"}</span>
            </DropdownMenuItem>
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
              <span>{isEn ? "Delete Slip" : "Hapus Slip"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Confirmation AlertDialog for Deleting Payout Slip with Undo Capability */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border" onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              {isEn ? "Delete Payout Slip?" : "Hapus Slip Bagi Hasil?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-xs leading-relaxed">
              {isEn
                ? `Delete payout slip ${payout?.payout_number}? You will be able to undo this action from the notification banner.`
                : `Hapus slip bagi hasil ${payout?.payout_number}? Anda dapat membatalkan (Undo) penghapusan ini melalui notifikasi setelahnya.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteDialogOpen(false);
              }}
              className="h-8 text-xs shadow-none cursor-pointer"
            >
              {isEn ? "Cancel" : "Batal"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmDelete}
              className="h-8 text-xs shadow-none cursor-pointer gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isEn ? "Delete Slip" : "Hapus Slip"}</span>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

/**
 * Show View: Comprehensive Therapist Dossier
 */
const TherapistShowView = () => {
  const record = useRecordContext();
  const translate = useTranslate();
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const navigate = useNavigate();

  const [ktpModalOpen, setKtpModalOpen] = React.useState(false);
  const [copiedBank, setCopiedBank] = React.useState(false);
  const [payoutsHistory, setPayoutsHistory] = React.useState<any[]>([]);
  const [loadingPayouts, setLoadingPayouts] = React.useState(false);

  const therapistId = record?.id;

  const loadPayoutHistory = React.useCallback(async () => {
    if (!therapistId) return;
    try {
      setLoadingPayouts(true);
      const { data, error } = await supabase
        .from("therapist_payouts")
        .select("*")
        .eq("therapist_id", therapistId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading payout history:", error);
        return;
      }
      setPayoutsHistory(data || []);
    } finally {
      setLoadingPayouts(false);
    }
  }, [therapistId]);

  React.useEffect(() => {
    loadPayoutHistory();
  }, [loadPayoutHistory]);

  if (!record) return null;

  const initial = record.name?.charAt(0).toUpperCase() || "T";
  const cleanPhone = record.phone ? cleanWhatsAppNumber(record.phone) : "";
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        `Halo ${record.name}, kami dari tim manajemen Serena Raga.`
      )}`
    : "#";

  const handleCopyAccount = () => {
    if (record.bank_account_number) {
      navigator.clipboard.writeText(record.bank_account_number);
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Profile Dossier Card */}
      <div className="rounded-xl border border-border/70 bg-card p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Profile Avatar */}
            <Avatar className="h-14 w-14 shrink-0">
              <AvatarImage src={record.photo_url} alt={record.name} className="object-cover" />
              <AvatarFallback className="text-base font-semibold">
                {initial}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-foreground">{record.name}</h2>
                <span className="text-xs text-muted-foreground font-medium">
                  • {record.gender === "Male" ? (isEn ? "Male" : "Pria") : (isEn ? "Female" : "Wanita")}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  • ({record.commission_rate ?? 60}% {isEn ? "Fee" : "Bagi Hasil"})
                </span>
              </div>

              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <span>{record.nik ? `NIK: ${record.nik}` : (isEn ? "No NIK recorded" : "NIK belum tercatat")}</span>
                <span>•</span>
                <span>{record.experience_years ?? 1} {isEn ? "Years Exp." : "Tahun Pengalaman"}</span>
                <span>•</span>
                {record.rating != null ? (
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{Number(record.rating).toFixed(1)}</span>
                  </span>
                ) : (
                  <span>{isEn ? "Rating: -" : "Rating: -"}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-start md:justify-end flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/payouts/create?therapist_id=${record.id}`)}
              className="h-9 gap-1.5 text-xs shadow-none cursor-pointer"
            >
              <ReceiptText className="w-3.5 h-3.5 text-primary" />
              <span>{isEn ? "Make Payout" : "Rekap Bagi Hasil"}</span>
            </Button>
            {cleanPhone && (
              <a href={waUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="h-9 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-none cursor-pointer">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{isEn ? "Chat WhatsApp" : "Hubungi WhatsApp"}</span>
                </Button>
              </a>
            )}
            <div className="flex items-center">
              <BadgeField source="status" />
            </div>
          </div>
        </div>
      </div>

      {/* 4 Grid Dossier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Identitas Pribadi & Domisili */}
        <Card className="border border-border/70 bg-card shadow-none">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <span>{isEn ? "Personal Identity & Domicile" : "Data Pribadi & Domisili"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground block text-[11px]">{translate("resources.therapists.fields.nik")}</span>
                <span className="font-semibold text-foreground">{record.nik || "-"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">{translate("resources.therapists.fields.birth_date")}</span>
                <span className="font-medium text-foreground">{record.birth_date || "-"}</span>
              </div>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">{translate("resources.therapists.fields.phone")}</span>
              <span className="font-medium text-foreground">{record.phone || "-"}</span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">{translate("resources.therapists.fields.domicile_address")}</span>
              <p className="font-medium text-foreground mt-0.5 leading-relaxed">{record.domicile_address || "-"}</p>
            </div>

            <div className="pt-2 border-t border-border/50">
              <span className="text-muted-foreground block text-[11px] flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                <HeartPulse className="w-3 h-3" />
                {isEn ? "Emergency Contact:" : "Kontak Darurat (Keluarga):"}
              </span>
              <p className="font-medium text-foreground mt-0.5">
                {record.emergency_contact_name || "-"} {record.emergency_contact_phone ? `(${record.emergency_contact_phone})` : ""}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Foto KTP & Dokumen Kualifikasi */}
        <Card className="border border-border/70 bg-card shadow-none">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>{isEn ? "Verified Documents & Credentials" : "Verifikasi KTP & Dokumen HD"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 space-y-3 text-xs">
            {/* KTP HD Preview Box */}
            <div>
              <span className="text-muted-foreground block text-[11px] mb-1.5 font-medium">
                {isEn ? "National ID Card (KTP):" : "Foto KTP Terverifikasi:"}
              </span>
              {record.ktp_photo_url ? (
                <div className="flex items-center gap-3 p-2 rounded-xl bg-muted/30 border border-border/60">
                  <div
                    onClick={() => setKtpModalOpen(true)}
                    className="relative h-16 w-24 rounded-lg overflow-hidden border border-border bg-black/5 shrink-0 cursor-pointer group"
                  >
                    <img
                      src={record.ktp_photo_url}
                      alt="Foto KTP"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-medium">
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="grid text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      {isEn ? "KTP Document Stored" : "Dokumen KTP Tersimpan"}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setKtpModalOpen(true)}
                      className="h-7 text-xs mt-1.5 gap-1 shadow-none w-fit"
                    >
                      <Eye className="w-3 h-3 text-muted-foreground" />
                      <span>{isEn ? "Inspect KTP" : "Lihat KTP"}</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-muted/20 border border-dashed border-border text-center text-muted-foreground text-xs">
                  {isEn ? "No KTP photo uploaded yet" : "Foto KTP belum diunggah"}
                </div>
              )}
            </div>

            {/* CV & Certificate Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border/50">
              <div>
                <span className="text-muted-foreground block text-[11px] mb-1">
                  {isEn ? "CV / Resume:" : "Dokumen CV / Riwayat Kerja:"}
                </span>
                {record.cv_url ? (
                  <a href={record.cv_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 w-full shadow-none">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      <span>{isEn ? "View CV" : "Buka Dokumen CV"}</span>
                    </Button>
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px] mb-1">
                  {isEn ? "Competency Certificate:" : "Sertifikat Keahlian:"}
                </span>
                {record.certificate_url ? (
                  <a href={record.certificate_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 w-full shadow-none">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      <span>{isEn ? "View Certificate" : "Buka Sertifikat"}</span>
                    </Button>
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-border/50">
              <span className="text-muted-foreground block text-[11px]">{translate("resources.therapists.fields.specialties")}</span>
              <p className="font-semibold text-foreground mt-0.5">{record.specialties || "-"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Rekening Bank & Komisi Bagi Hasil */}
        <Card className="border border-border/70 bg-card shadow-none">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <span>{isEn ? "Payroll & Bank Disbursement" : "Rekening Bank & Bagi Hasil"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2 pb-2.5 border-b border-border/50">
              <div>
                <span className="text-muted-foreground block text-[11px]">{translate("resources.therapists.fields.commission_rate")}</span>
                <span className="font-semibold text-foreground text-sm">{record.commission_rate ?? 60}% {isEn ? "Therapist Share" : "Hak Terapis"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">{isEn ? "Company Share" : "Hak Serena Raga"}</span>
                <span className="font-medium text-muted-foreground text-sm">{100 - (record.commission_rate ?? 60)}%</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-muted-foreground block text-[11px]">{translate("resources.therapists.fields.bank_name")}</span>
                  <span className="font-bold text-foreground text-sm flex items-center gap-1.5 mt-0.5">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    {record.bank_name || "BCA"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/60">
                <div>
                  <span className="text-muted-foreground block text-[10px]">
                    {translate("resources.therapists.fields.bank_account_number")}
                  </span>
                  <span className="font-bold text-foreground text-sm tracking-wider">
                    {record.bank_account_number || "-"}
                  </span>
                </div>
                {record.bank_account_number && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyAccount}
                    className="h-7 text-xs gap-1"
                  >
                    {copiedBank ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">{isEn ? "Copied" : "Disalin"}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{isEn ? "Copy" : "Salin"}</span>
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px]">{translate("resources.therapists.fields.bank_account_name")}</span>
                <span className="font-semibold text-foreground">{record.bank_account_name || record.name || "-"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Operasional & Catatan Internal HR */}
        <Card className="border border-border/70 bg-card shadow-none">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{isEn ? "Operations & HR Records" : "Operasional & Catatan Internal HR"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 space-y-3 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">{translate("resources.therapists.fields.coverage_areas")}</span>
              <p className="font-medium text-foreground mt-0.5">{record.coverage_areas || "Jakarta Selatan, Tangerang Selatan"}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
              <div>
                <span className="text-muted-foreground block text-[11px]">{translate("resources.therapists.fields.joined_date")}</span>
                <span className="font-medium text-foreground">{record.joined_date || "-"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">{translate("resources.therapists.fields.created_at")}</span>
                <span className="font-medium text-muted-foreground">{record.created_at || "-"}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-border/50">
              <span className="text-muted-foreground block text-[11px]">{translate("resources.therapists.fields.notes")}</span>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed bg-muted/20 p-2.5 rounded-lg border border-border/50">
                {record.notes || (isEn ? "No specific HR remarks recorded." : "Tidak ada catatan khusus dari HR.")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Riwayat Slip Bagi Hasil & Payout Terapis */}
      <Card className="border border-border/70 bg-card shadow-none">
        <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />
            <span>{isEn ? "Payout & Commission History" : "Riwayat Slip Bagi Hasil Terapis"}</span>
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/payouts/create?therapist_id=${record.id}`)}
            className="h-8 gap-1.5 text-xs shadow-none cursor-pointer"
          >
            <ReceiptText className="w-3.5 h-3.5 text-primary" />
            <span>{isEn ? "+ Make New Payout" : "+ Buat Slip Bagi Hasil"}</span>
          </Button>
        </CardHeader>
        <CardContent className="pt-3 p-0">
          {loadingPayouts ? (
            <div className="p-4 space-y-2.5">
              <Skeleton className="h-8 w-full rounded-md" />
              <Skeleton className="h-8 w-full rounded-md" />
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
          ) : payoutsHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs">
              <ReceiptText className="w-8 h-8 mx-auto mb-2 opacity-40 text-muted-foreground" />
              <p className="font-medium">{isEn ? "No payout slips issued yet." : "Belum ada riwayat slip bagi hasil untuk terapis ini."}</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {isEn ? "Click '+ Make New Payout' to generate a recap." : "Klik tombol '+ Buat Slip Bagi Hasil' untuk merekap komisi."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs">{isEn ? "Slip Number" : "No. Slip"}</TableHead>
                    <TableHead className="text-xs">{isEn ? "Period" : "Periode"}</TableHead>
                    <TableHead className="text-xs text-center">{isEn ? "Bookings" : "Total Order"}</TableHead>
                    <TableHead className="text-xs text-right">{isEn ? "Gross" : "Omset Bruto"}</TableHead>
                    <TableHead className="text-xs text-right">{isEn ? "Net Payout" : "Total Bersih"}</TableHead>
                    <TableHead className="text-xs text-center">{isEn ? "Status" : "Status"}</TableHead>
                    <TableHead className="text-xs text-right">{isEn ? "Action" : "Aksi"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payoutsHistory.map((p) => (
                    <TableRow
                      key={p.id}
                      onClick={() => navigate(`/payouts/${p.id}/show`)}
                      className="hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <TableCell className="font-mono text-xs font-semibold text-foreground">
                        {p.payout_number}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {p.period_start} sd {p.period_end}
                      </TableCell>
                      <TableCell className="text-xs text-center font-medium">
                        {p.total_bookings} Order
                      </TableCell>
                      <TableCell className="text-xs text-right text-muted-foreground">
                        {formatIDR(p.gross_amount)}
                      </TableCell>
                      <TableCell className="text-xs text-right font-bold text-foreground">
                        {formatIDR(p.net_amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-xs font-medium text-foreground tracking-tight whitespace-nowrap inline-flex items-center gap-1.5 justify-center">
                          {p.payment_status === "paid" ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              <span>{isEn ? "Paid" : "Ditransfer"}</span>
                            </>
                          ) : (
                            <>
                              <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                              <span>{isEn ? "Pending" : "Menunggu"}</span>
                            </>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <PayoutRowActions
                          payout={p}
                          onDeleted={(deletedId) => {
                            setPayoutsHistory((prev) =>
                              prev.filter((item) => String(item.id) !== String(deletedId))
                            );
                          }}
                          onRestore={loadPayoutHistory}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Lightbox for KTP Inspection */}
      {record.ktp_photo_url && (
        <Dialog open={ktpModalOpen} onOpenChange={setKtpModalOpen}>
          <DialogContent className="max-w-3xl p-4 bg-card border-border">
            <DialogHeader className="pb-2 border-b border-border/60">
              <DialogTitle className="text-sm font-bold flex items-center justify-between">
                <span>{isEn ? `National ID (KTP): ${record.name}` : `Foto KTP: ${record.name}`}</span>
                <span className="text-[11px] text-muted-foreground font-normal">
                  {record.nik ? `NIK: ${record.nik}` : "Document Preview"}
                </span>
              </DialogTitle>
            </DialogHeader>
            <div className="relative max-h-[75vh] overflow-auto rounded-lg bg-black/5 dark:bg-black/40 flex items-center justify-center p-2">
              <img
                src={record.ktp_photo_url}
                alt={`KTP ${record.name}`}
                className="max-h-[70vh] w-auto object-contain rounded-md shadow-sm"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export const TherapistShow = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <Show title={isEn ? "Therapist Dossier" : "Detail Profil Terapis"}>
      <TherapistShowView />
    </Show>
  );
};
