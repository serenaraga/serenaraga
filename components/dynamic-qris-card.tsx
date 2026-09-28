import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrandSettings } from "@/lib/brand-settings";
import { QrisCardSkeleton } from "@/components/ui/skeleton";
import {
  generateDynamicQRIS,
  compositeDynamicQRISImage,
  decodeQRFromImage,
} from "@/lib/qris";
import { toast } from "sonner";

export interface DynamicQrisCardProps {
  invoiceNumber: string;
  totalAmount: number;
  isEn?: boolean;
  className?: string;
}

export function DynamicQrisCard({
  invoiceNumber,
  totalAmount,
  isEn = false,
  className,
}: DynamicQrisCardProps) {
  const { settings } = useBrandSettings();
  const [loading, setLoading] = React.useState(true);
  const [compositeImageUrl, setCompositeImageUrl] = React.useState<string>("");

  React.useEffect(() => {
    let active = true;

    async function generateQR() {
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
          // Standard fallback string if setting is empty
          rawStatic =
            "00020101021126570011ID.DANA.WWW011893600915387201928302098720192830303UMI51440014ID.CO.QRIS.WWW0215ID10200234567890303UMI5204729953033605802ID5911SERENA RAGA6010YOGYAKARTA6105552816304D1A4";
        }

        // 2. Generate dynamic QRIS string with exact nominal
        const dynamicStr = generateDynamicQRIS(rawStatic, totalAmount);

        // 3. Composite new QR matrix + embedded nominal text into original merchant template
        const compositeUrl = await compositeDynamicQRISImage({
          templateImageUrl: settings.qris_image_url || undefined,
          dynamicPayload: dynamicStr,
          amount: totalAmount,
        });

        if (!active) return;
        setCompositeImageUrl(compositeUrl);
      } catch (err: any) {
        console.error("Dynamic QRIS generation failed:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    generateQR();

    return () => {
      active = false;
    };
  }, [totalAmount, settings.qris_payload, settings.qris_image_url]);

  const handleDownloadQR = () => {
    if (!compositeImageUrl) return;
    const link = document.createElement("a");
    link.href = compositeImageUrl;
    link.download = `QRIS_${(settings.brand_name || "Serena_Raga").replace(/\s+/g, "_")}_${invoiceNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(isEn ? "QRIS image downloaded!" : "Gambar QRIS berhasil diunduh!");
  };

  if (loading) {
    return <QrisCardSkeleton className={className} />;
  }

  return (
    <Card
      className={cn(
        "border border-border bg-card text-card-foreground shadow-none rounded-xl overflow-hidden ring-0 w-full max-w-[380px] mx-auto",
        className
      )}
    >
      <CardContent className="p-4 sm:p-5 space-y-4 flex flex-col items-center">
        {/* Clean Composite QRIS Image */}
        <div className="relative w-full rounded-lg overflow-hidden border border-border/80 bg-white p-1.5 shadow-xs flex items-center justify-center min-h-[320px]">
          {compositeImageUrl ? (
            <img
              src={compositeImageUrl}
              alt="QRIS Dinamis Serena Raga"
              className="w-full h-auto object-contain rounded"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <QrCode className="w-10 h-10 stroke-1" />
              <p className="text-xs">{isEn ? "QRIS unavailable" : "QRIS tidak tersedia"}</p>
            </div>
          )}
        </div>

        {/* Single Clean Download Button */}
        <Button
          type="button"
          variant="outline"
          disabled={!compositeImageUrl}
          onClick={handleDownloadQR}
          className="w-full h-9 text-xs gap-1.5 shadow-none border-border hover:bg-muted cursor-pointer font-medium"
        >
          <Download className="w-3.5 h-3.5 text-muted-foreground" />
          <span>{isEn ? "Download QRIS (PNG)" : "Unduh QRIS (PNG)"}</span>
        </Button>
      </CardContent>
    </Card>
  );
}
