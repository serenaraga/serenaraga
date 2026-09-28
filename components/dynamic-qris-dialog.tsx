"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  QrCode,
  Download,
  Copy,
  Check,
  Sparkles,
  Loader2,
  Store,
  ShieldCheck,
  Info,
  Smartphone,
  CheckCircle2,
} from "lucide-react";
import { cn, formatIDR } from "@/lib/utils";
import { useBrandSettings } from "@/lib/brand-settings";
import {
  generateDynamicQRIS,
  compositeDynamicQRISImage,
  parseQRIS,
  decodeQRFromImage,
  type QRISInfo,
} from "@/lib/qris";
import { toast } from "sonner";

export interface DynamicQrisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceNumber: string;
  customerName?: string;
  totalAmount: number;
  isEn?: boolean;
}

export function DynamicQrisDialog({
  open,
  onOpenChange,
  invoiceNumber,
  customerName,
  totalAmount,
  isEn = false,
}: DynamicQrisDialogProps) {
  const { settings } = useBrandSettings();
  const [loading, setLoading] = React.useState(true);
  const [compositeImageUrl, setCompositeImageUrl] = React.useState<string>("");
  const [dynamicPayload, setDynamicPayload] = React.useState<string>("");
  const [qrisInfo, setQrisInfo] = React.useState<QRISInfo | null>(null);
  const [copiedNominal, setCopiedNominal] = React.useState(false);
  const [copiedPayload, setCopiedPayload] = React.useState(false);

  // Generate dynamic QRIS whenever dialog opens or total changes
  React.useEffect(() => {
    let active = true;

    async function generateQR() {
      if (!open) return;

      try {
        setLoading(true);

        // 1. Determine raw static QRIS string
        let rawStatic = (settings.qris_payload || "").trim();

        // If payload is not in brand settings yet, try decoding from image URL
        if (!rawStatic && settings.qris_image_url) {
          try {
            const decoded = await decodeQRFromImage(settings.qris_image_url);
            if (decoded.payload) {
              rawStatic = decoded.payload;
            }
          } catch (e) {
            console.warn("Could not decode QR payload from image URL:", e);
          }
        }

        if (!rawStatic) {
          // Fallback demo payload if not configured yet
          rawStatic =
            "00020101021126570011ID.DANA.WWW011893600915387201928302098720192830303UMI51440014ID.CO.QRIS.WWW0215ID10200234567890303UMI5204729953033605802ID5911SERENA RAGA6010YOGYAKARTA6105552816304D1A4";
        }

        // 2. Generate dynamic QRIS string with exact nominal
        const dynamicStr = generateDynamicQRIS(rawStatic, totalAmount);
        const parsed = parseQRIS(dynamicStr);

        if (!active) return;
        setDynamicPayload(dynamicStr);
        setQrisInfo(parsed);

        // 3. Composite new QR matrix into original merchant image template
        const compositeUrl = await compositeDynamicQRISImage({
          templateImageUrl: settings.qris_image_url || undefined,
          dynamicPayload: dynamicStr,
        });

        if (!active) return;
        setCompositeImageUrl(compositeUrl);
      } catch (err: any) {
        console.error("Dynamic QRIS generation failed:", err);
        toast.error(
          isEn
            ? `Failed to generate dynamic QR: ${err.message}`
            : `Gagal membuat QRIS dinamis: ${err.message}`
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    generateQR();

    return () => {
      active = false;
    };
  }, [open, totalAmount, settings.qris_payload, settings.qris_image_url, isEn]);

  const handleCopyNominal = () => {
    navigator.clipboard.writeText(Math.round(totalAmount).toString());
    setCopiedNominal(true);
    toast.success(isEn ? "Nominal amount copied!" : "Nominal tagihan berhasil disalin!");
    setTimeout(() => setCopiedNominal(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!compositeImageUrl) return;
    const link = document.createElement("a");
    link.href = compositeImageUrl;
    link.download = `QRIS_${settings.brand_name.replace(/\s+/g, "_")}_${invoiceNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(isEn ? "QRIS image downloaded!" : "Gambar QRIS berhasil diunduh!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full p-0 overflow-hidden rounded-2xl bg-card border border-border shadow-2xl">
        <DialogHeader className="p-5 pb-3 border-b border-border/80">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#8b5e3c]/10 text-[#8b5e3c] dark:text-[#d49b6a] flex items-center justify-center">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-foreground">
                  {isEn ? "Official Dynamic QRIS" : "Pembayaran QRIS Dinamis"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {settings.brand_name || "Serena Raga"} • {invoiceNumber}
                </DialogDescription>
              </div>
            </div>

            <Badge
              variant="outline"
              className="border-[#8b5e3c]/40 bg-[#8b5e3c]/10 text-[#8b5e3c] dark:text-[#d49b6a] gap-1 text-[11px] font-semibold px-2 py-0.5"
            >
              <Sparkles className="w-3 h-3" />
              <span>{isEn ? "Exact Nominal" : "Nominal Pas"}</span>
            </Badge>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Prominent Amount Card */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {isEn ? "PAYMENT TOTAL" : "TOTAL PEMBAYARAN"}
              </p>
              <h3 className="text-xl font-bold tracking-tight text-[#8b5e3c] dark:text-[#d49b6a]">
                {formatIDR(totalAmount)}
              </h3>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyNominal}
              className="h-8 text-xs gap-1.5 shadow-none border-border hover:bg-muted cursor-pointer"
            >
              {copiedNominal ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <span>{copiedNominal ? (isEn ? "Copied" : "Tersalin") : isEn ? "Copy" : "Salin"}</span>
            </Button>
          </div>

          {/* Dynamic QRIS Image Container */}
          <div className="relative rounded-xl border border-border bg-muted/20 p-4 flex flex-col items-center justify-center min-h-[300px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#8b5e3c] dark:text-[#d49b6a]" />
                <p className="text-xs font-semibold text-foreground">
                  {isEn ? "Generating Dynamic QRIS..." : "Membuat QRIS Dinamis..."}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isEn ? "Injecting exact nominal & CRC checksum" : "Menyisipkan nominal pas & memvalidasi CRC"}
                </p>
              </div>
            ) : compositeImageUrl ? (
              <div className="space-y-3 w-full flex flex-col items-center">
                <div className="relative max-w-[280px] sm:max-w-[300px] w-full rounded-lg overflow-hidden border border-border/80 bg-white p-2 shadow-xs group">
                  <img
                    src={compositeImageUrl}
                    alt="QRIS Dinamis Serena Raga"
                    className="w-full h-auto object-contain rounded"
                  />
                </div>

                <p className="text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {isEn
                      ? "Nominal is locked. No manual amount entry needed."
                      : "Nominal terkunci otomatis. Bebas dari kesalahan ketik."}
                  </span>
                </p>
              </div>
            ) : null}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              disabled={loading || !compositeImageUrl}
              onClick={handleDownloadQR}
              className="w-full h-9 text-xs gap-1.5 shadow-none border-border hover:bg-muted cursor-pointer font-medium"
            >
              <Download className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{isEn ? "Download QRIS (PNG)" : "Unduh QRIS (PNG)"}</span>
            </Button>

            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-full h-9 text-xs font-semibold bg-[#8b5e3c] hover:bg-[#785033] dark:bg-[#d49b6a] dark:hover:bg-[#c28a5a] text-white dark:text-zinc-950 shadow-none cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isEn ? "Done / Close" : "Selesai / Tutup"}</span>
            </Button>
          </div>

          {/* Payment Guidance Steps */}
          <div className="p-3 rounded-xl bg-muted/30 border border-border/70 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Smartphone className="w-3.5 h-3.5 text-[#8b5e3c] dark:text-[#d49b6a]" />
              <span>{isEn ? "How to Pay with QRIS:" : "Cara Pembayaran:"}</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground leading-relaxed text-[11px]">
              <li>
                {isEn
                  ? "Open BCA Mobile, Livin' Mandiri, GoPay, ShopeePay, OVO, or DANA."
                  : "Buka aplikasi m-Banking (BCA, Mandiri, BRI, BNI) atau e-Wallet (GoPay, OVO, DANA, ShopeePay)."}
              </li>
              <li>
                {isEn
                  ? "Scan the QR code above or import from gallery."
                  : "Pilih menu Scan / QRIS dan arahkan kamera ke barcode di atas."}
              </li>
              <li>
                {isEn
                  ? "Nominal will appear automatically. Confirm payment."
                  : "Nominal pembayaran akan otomatis muncul pas. Periksa nama merchant dan konfirmasi pembayaran."}
              </li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
