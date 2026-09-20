"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { InvoiceCard, type InvoiceData } from "@/components/invoice-card";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Rating02 } from "@/components/shadcn-space/rating/rating-02";
import {
  MessageCircle,
  ShieldCheck,
  Loader2,
  Star,
  Sparkles,
  Send,
  Heart,
  Sun,
  Moon,
  Globe,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useBrandSettings } from "@/lib/brand-settings";
import { supabase } from "@/lib/supabase";

export default function PublicInvoicePage() {
  const params = useParams();
  const invoiceNumber = params?.invoiceNumber as string;
  const rawId = invoiceNumber;
  const { settings, adminWhatsAppUrl } = useBrandSettings();

  const [mounted, setMounted] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [invoice, setInvoice] = React.useState<InvoiceData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Theme state: "light" | "dark" (Strictly default light mode)
  const [theme, setTheme] = React.useState<"light" | "dark">("light");

  // Locale state: "id" | "en" (Default en)
  const [locale, setLocale] = React.useState<"id" | "en">("en");
  const isEn = locale === "en";

  // Review states
  const [rating, setRating] = React.useState<number>(5);
  const [comment, setComment] = React.useState<string>("");
  const [submittingReview, setSubmittingReview] = React.useState<boolean>(false);
  const [reviewSubmitted, setReviewSubmitted] = React.useState<boolean>(false);
  const [existingReview, setExistingReview] = React.useState<any>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Apply theme to document and ensure light mode on load
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      root.classList.remove("dark");
      root.classList.add("light");
    }
  }, []);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      if (theme === "dark") {
        root.classList.remove("light");
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
        root.classList.add("light");
      }
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const toggleLocale = () => {
    setLocale((prev) => (prev === "en" ? "id" : "en"));
  };

  React.useEffect(() => {
    async function fetchInvoice() {
      if (!rawId) return;

      try {
        setLoading(true);

        // Search by invoice_number first, then by id
        let query = supabase
          .from("invoices")
          .select("*")
          .eq("invoice_number", rawId);

        let { data, error: fetchErr } = await query.maybeSingle();

        if (!data && !isNaN(Number(rawId))) {
          const { data: byIdData } = await supabase
            .from("invoices")
            .select("*")
            .eq("id", Number(rawId))
            .maybeSingle();
          data = byIdData;
        }

        if (data) {
          setInvoice(data);

          // Check if review already exists for this invoice or booking
          try {
            let revQuery = supabase.from("reviews").select("*");

            if (data.id) {
              revQuery = revQuery.eq("invoice_id", data.id);
            } else if (data.booking_id) {
              revQuery = revQuery.eq("booking_id", data.booking_id);
            }

            const { data: revData } = await revQuery.maybeSingle();
            if (revData) {
              setExistingReview(revData);
              setReviewSubmitted(true);
            }
          } catch (e) {
            // Non-blocking
          }
        } else {
          // Fallback preview
          setInvoice({
            invoice_number: rawId,
            customer_name: "Pelanggan Serena Raga",
            service_name: "Traditional Body Massage (90 Menit)",
            therapist_name: "Siti Rahmawati",
            booking_date: new Date().toISOString().split("T")[0],
            booking_time: "10:00",
            service_address: "Layanan Home Massage",
            subtotal: 185000,
            discount: 0,
            transport_fee: 0,
            total_amount: 185000,
            payment_method: "qris",
            payment_status: "paid",
            notes: "Nota resmi relaksasi Serena Raga Home Massage.",
          });
        }
      } catch (err: any) {
        setError(err.message || "Failed to load invoice");
      } finally {
        setLoading(false);
      }
    }

    fetchInvoice();
  }, [rawId]);

  // Submit Review Handler
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    try {
      setSubmittingReview(true);

      // Resolve valid booking_id
      let validBookingId: number | null = null;
      if (invoice.booking_id && !isNaN(Number(invoice.booking_id))) {
        validBookingId = Number(invoice.booking_id);
      } else {
        // Fallback to first existing booking if previewing without a booking relation
        try {
          const { data: sampleBookings } = await supabase
            .from("bookings")
            .select("id, therapist_id")
            .limit(1);
          if (sampleBookings && sampleBookings.length > 0) {
            validBookingId = sampleBookings[0].id;
          }
        } catch (e) {
          // Non-blocking
        }
      }

      // 1. Try insert with full extended schema
      const fullPayload: any = {
        booking_id: validBookingId,
        invoice_id: invoice.id && !isNaN(Number(invoice.id)) ? Number(invoice.id) : null,
        therapist_id: invoice.therapist_id && !isNaN(Number(invoice.therapist_id)) ? Number(invoice.therapist_id) : null,
        customer_name: invoice.customer_name || "Pelanggan",
        rating: Number(rating) || 5,
        comment: comment.trim() || null,
        is_read: false,
        created_at: new Date().toISOString(),
      };

      let insertedRecord: any = null;
      const { data: fullData, error: fullErr } = await supabase
        .from("reviews")
        .insert([fullPayload])
        .select()
        .maybeSingle();

      if (!fullErr && fullData) {
        insertedRecord = fullData;
      } else {
        // 2. Fallback to core standard schema (booking_id, rating, comment)
        const corePayload: any = {
          booking_id: validBookingId,
          rating: Number(rating) || 5,
          comment: comment.trim() || null,
        };

        const { data: coreData, error: coreErr } = await supabase
          .from("reviews")
          .insert([corePayload])
          .select()
          .maybeSingle();

        if (coreErr) {
          throw coreErr;
        }
        insertedRecord = coreData || { ...corePayload, customer_name: invoice.customer_name };
      }

      setExistingReview(insertedRecord || fullPayload);
      setReviewSubmitted(true);

      // Auto-update therapist average rating in therapists table
      const targetTherapistId = invoice.therapist_id || (insertedRecord && insertedRecord.therapist_id);
      if (targetTherapistId) {
        try {
          const { data: revs } = await supabase
            .from("reviews")
            .select("rating")
            .eq("therapist_id", targetTherapistId);
          if (revs && revs.length > 0) {
            const total = revs.reduce((acc: number, r: any) => acc + (Number(r.rating) || 0), 0);
            const avg = Number((total / revs.length).toFixed(1));
            await supabase.from("therapists").update({ rating: avg }).eq("id", targetTherapistId);
          }
        } catch (e) {
          console.error("Failed to update therapist average rating:", e);
        }
      }

      toast.success(
        isEn
          ? "Thank you for your review! Your feedback is recorded."
          : "Terima kasih atas ulasan Anda! Ulasan Anda telah tersimpan."
      );
    } catch (err: any) {
      console.error("Submit review error:", err);
      toast.error(
        isEn
          ? `Failed to submit review: ${err.message || "Please try again"}`
          : `Gagal mengirim ulasan: ${err.message || "Silakan coba lagi"}`
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-5 sm:py-8 px-3.5 sm:px-6 lg:px-8">
      {/* Top Header Navigation Bar (Matches Dashboard Header Bar) */}
      <div className="max-w-3xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        {/* Left: Brand Logo */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 hover:opacity-85 transition-opacity"
          title={isEn ? "Back to Home / Landing Page" : "Kembali ke Beranda"}
        >
          <BrandLogo variant="full" className="h-6 sm:h-7 w-auto text-foreground" />
        </Link>

        {/* Right: Actions (Home, Language Switcher, Theme Switcher, CS Help) */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Home Button */}
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 shadow-none border-border"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isEn ? "Home" : "Beranda"}</span>
            </Button>
          </Link>

          {/* Language Switcher */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleLocale}
            className="h-8 text-xs gap-1.5 shadow-none border-border"
            title={isEn ? "Ganti ke Bahasa Indonesia" : "Switch to English"}
          >
            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-semibold">{isEn ? "EN" : "ID"}</span>
          </Button>

          {/* Theme Switcher */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 shadow-none border-border"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? (
              <Moon className="w-3.5 h-3.5 text-foreground" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            )}
          </Button>

          {/* WhatsApp Support Button */}
          <a
            href={
              mounted
                ? adminWhatsAppUrl(
                    isEn
                      ? `Hello ${settings.brand_name || "Serena Raga"} Support, I have a question regarding invoice #${invoice?.invoice_number || ""}`
                      : `Halo CS ${settings.brand_name || "Serena Raga"}, saya ingin bertanya mengenai nota #${invoice?.invoice_number || ""}`
                  )
                : "https://wa.me/6281234567890"
            }
            target="_blank"
            rel="noopener noreferrer"
            suppressHydrationWarning
          >
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 shadow-none border-border cursor-pointer hover:border-emerald-500/50"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
              <span>{isEn ? "Support" : "Bantuan CS"}</span>
            </Button>
          </a>
        </div>
      </div>

      {/* Main Invoice Card Container */}
      <div className="max-w-3xl mx-auto space-y-6">
        {loading ? (
          <Card className="p-16 text-center border border-border/70 shadow-none bg-card space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-foreground mx-auto" />
            <p className="text-xs text-muted-foreground">
              {isEn ? "Loading official Serena Raga receipt..." : "Memuat nota resmi Serena Raga..."}
            </p>
          </Card>
        ) : invoice ? (
          <>
            <InvoiceCard
              invoice={invoice}
              showShareActions={true}
              publicMode={true}
              forcedLocale={locale}
              className="shadow-none"
            />

            {/* Leave Review Section (Shadcn Card with shadow-none) */}
            <Card className="border border-border/70 shadow-none bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                  <span>{isEn ? "Share Your Massage Experience" : "Bagikan Pengalaman Relaksasi Anda"}</span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                  {isEn
                    ? "How was your home massage session? Your feedback helps us continuously deliver premium wellness services."
                    : "Bagaimana kenyamanan layanan pijat yang Anda rasakan? Ulasan Anda sangat berharga bagi peningkatan mutu layanan Serena Raga."}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                {reviewSubmitted ? (
                  <div className="p-5 rounded-xl bg-muted/40 border border-border/70 text-center space-y-2 shadow-none">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 mx-auto">
                      <Heart className="w-4 h-4 fill-amber-600 text-amber-600 dark:fill-amber-500 dark:text-amber-500" />
                    </div>
                    <h4 className="text-sm font-bold text-foreground">
                      {isEn ? "Thank You for Your Review!" : "Terima Kasih Atas Ulasan Anda!"}
                    </h4>
                    <div className="flex justify-center pt-1">
                      <Rating02
                        value={existingReview?.rating || rating}
                        readOnly
                        labels={
                          isEn
                            ? ["Terrible", "Bad", "Okay", "Good", "Awesome"]
                            : ["Kurang Sekali", "Kurang", "Cukup", "Puas", "Sangat Puas"]
                        }
                        size="sm"
                      />
                    </div>
                    {existingReview?.comment && (
                      <p className="text-xs text-muted-foreground italic max-w-md mx-auto pt-1">
                        &ldquo;{existingReview.comment}&rdquo;
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground pt-1">
                      {isEn
                        ? "Your feedback is recorded in our system. See you at your next relaxation session!"
                        : "Ulasan Anda telah tersinkronisasi ke sistem kami. Sampai jumpa di sesi relaksasi berikutnya!"}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="space-y-4 pt-1">
                    {/* Rating 02 from @shadcn-space/rating-02 */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-foreground block">
                        {isEn ? "Select Your Relaxation Experience:" : "Pilih Tingkat Kepuasan Layanan:"}
                      </label>
                      <div className="py-1 flex justify-center sm:justify-start">
                        <Rating02
                          value={rating}
                          onValueChange={(val) => setRating(val)}
                          labels={
                            isEn
                              ? ["Terrible", "Bad", "Okay", "Good", "Awesome"]
                              : ["Kurang Sekali", "Kurang", "Cukup", "Puas", "Sangat Puas"]
                          }
                          size="md"
                        />
                      </div>
                    </div>

                    {/* Comment Textarea */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground block">
                        {isEn ? "Comments or Special Notes (Optional):" : "Komentar atau Pesan Tambahan:"}
                      </label>
                      <Textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={
                          isEn
                            ? "e.g. The therapist was gentle and attentive, feeling very refreshed..."
                            : "Contoh: Terapis sangat ramah, pijatannya pas dan membuat badan segar kembali..."
                        }
                        rows={3}
                        className="text-xs bg-background border-border text-foreground resize-none shadow-none focus-visible:ring-1"
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={submittingReview}
                      className="w-full h-9 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 gap-2 shadow-none cursor-pointer"
                    >
                      {submittingReview ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{isEn ? "Submitting Review..." : "Mengirim Ulasan..."}</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>{isEn ? "Submit Relaxation Review" : "Kirim Ulasan Relaksasi"}</span>
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="p-12 text-center border border-border/70 shadow-none bg-card space-y-3">
            <ShieldCheck className="w-8 h-8 text-muted-foreground mx-auto" />
            <h2 className="text-base font-semibold text-foreground">
              {isEn ? "Receipt Not Found" : "Nota Tidak Ditemukan"}
            </h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {isEn ? "Invoice number " : "Nomor nota "}
              <code className="font-mono font-bold text-foreground">{rawId}</code>
              {isEn ? " was not found in our database." : " tidak ditemukan di sistem kami."}
            </p>
          </Card>
        )}
      </div>

      {/* Bottom Footer */}
      <div className="max-w-3xl mx-auto mt-8 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Serena Raga Home Massage. All rights reserved.</p>
      </div>
    </div>
  );
}
