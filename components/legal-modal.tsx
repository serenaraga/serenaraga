"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, FileText, Lock, AlertCircle, HeartHandshake, PhoneCall, Sparkles } from "lucide-react";
import { useBrandSettings } from "@/lib/brand-settings";

interface LegalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "terms" | "privacy";
  isEn?: boolean;
}

export function LegalModal({
  open,
  onOpenChange,
  defaultTab = "terms",
  isEn = false,
}: LegalModalProps) {
  const { settings } = useBrandSettings();
  const brandName = settings.brand_name || "Serena Raga";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] max-h-[88vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 shadow-2xl rounded-none">
        {/* Header Dialog */}
        <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-none bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100">
                {isEn ? "Legal & Privacy Terms" : "Ketentuan Hukum & Privasi"}
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-light">
                {isEn
                  ? `Official Terms of Service & Privacy Policy for ${brandName}`
                  : `Pedoman resmi Syarat & Ketentuan dan Kebijakan Privasi ${brandName}`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Selector & Scrollable Content */}
        <Tabs defaultValue={defaultTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-5 sm:px-6 pt-3 pb-2 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
            <TabsList className="grid grid-cols-2 w-full max-w-xs h-9 bg-stone-100 dark:bg-stone-800 p-0.5 rounded-none">
              <TabsTrigger
                value="terms"
                className="text-xs font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-stone-900 data-[state=active]:shadow-sm rounded-none transition-all"
              >
                <FileText className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                {isEn ? "Terms of Service" : "Syarat & Ketentuan"}
              </TabsTrigger>
              <TabsTrigger
                value="privacy"
                className="text-xs font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-stone-900 data-[state=active]:shadow-sm rounded-none transition-all"
              >
                <Lock className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                {isEn ? "Privacy Policy" : "Kebijakan Privasi"}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-6 text-xs sm:text-[13px] leading-relaxed text-stone-700 dark:text-stone-300">
            {/* TAB 1: TERMS & CONDITIONS */}
            <TabsContent value="terms" className="m-0 space-y-5 focus-visible:outline-none">
              {/* Box 1: Layanan Profesional Murni */}
              <div className="p-4 rounded-none bg-amber-500/5 border border-amber-500/20 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-xs sm:text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    {isEn
                      ? "1. Strict Professional Wellness & Zero Tolerance Policy"
                      : "1. Layanan Pijat Kesehatan Murni & Kebijakan Nol Toleransi"}
                  </span>
                </div>
                <p className="font-light">
                  {isEn
                    ? `${brandName} operates exclusively as a legitimate, professional therapeutic health & wellness service. Any solicitations for non-therapeutic, sexual, or improper conduct are STRICTLY PROHIBITED.`
                    : `${brandName} adalah penyedia jasa pijat dan relaksasi kesehatan keluarga profesional. Segala bentuk permintaan layanan asusila, pelecehan verbal maupun fisik, atau tindakan di luar prosedur kesehatan DILARANG KERAS.`}
                </p>
                <p className="font-light text-stone-600 dark:text-stone-400">
                  {isEn
                    ? `Therapists reserve the absolute right to terminate a session immediately without refund should any inappropriate behavior occur. Legal action will be pursued in accordance with Indonesian Law (UU TPKS No. 12/2022 & Criminal Code).`
                    : `Terapis berhak menghentikan sesi seketika tanpa pengembalian biaya jika terjadi perilaku yang tidak pantas. Pihak manajemen berhak melaporkan tindakan tersebut kepada aparat penegak hukum sesuai UU No. 12 Tahun 2022 (TPKS) dan KUHP.`}
                </p>
              </div>

              {/* Box 2: Kesehatan & Informed Consent */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-semibold text-stone-900 dark:text-stone-100">
                  <HeartHandshake className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    {isEn
                      ? "2. Health Declaration & Medical Disclaimer"
                      : "2. Kondisi Kesehatan & Persetujuan Tindakan (Informed Consent)"}
                  </span>
                </div>
                <p className="font-light">
                  {isEn
                    ? `Clients are required to disclose any pre-existing health conditions (including but not limited to pregnancy, acute hypertension, recent surgery, bone fractures, contagious skin disorders, or essential oil allergies) prior to treatment.`
                    : `Pelanggan wajib menginformasikan kondisi kesehatan khusus (seperti kehamilan, cedera patah tulang, riwayat pasca operasi, hipertensi akut, penyakit kulit menular, atau alergi minyak tertentu) kepada terapis sebelum treatment dimulai.`}
                </p>
                <p className="font-light text-stone-600 dark:text-stone-400">
                  {isEn
                    ? `Our treatments are designed for holistic relaxation and do not replace professional medical diagnosis, surgery, or prescribed medical therapy.`
                    : `Layanan pijat dan spa ini bertujuan untuk relaksasi dan kebugaran tubuh, serta bukan merupakan pengganti penanganan medis dokter atau rumah sakit.`}
                </p>
              </div>

              {/* Box 3: Pemesanan & Pembatalan */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-semibold text-stone-900 dark:text-stone-100">
                  <Sparkles className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    {isEn
                      ? "3. Booking, Rescheduling & Cancellation Policy"
                      : "3. Ketentuan Reservasi, Penjadwalan Ulang & Pembatalan"}
                  </span>
                </div>
                <ul className="list-disc pl-5 space-y-1 font-light">
                  <li>
                    {isEn
                      ? "Rescheduling or cancellation must be requested at least 2 hours prior to the scheduled appointment time."
                      : "Permintaan penjadwalan ulang (reschedule) atau pembatalan pemesanan wajib dikonfirmasikan selambatnya 2 jam sebelum jam sesi yang disepakati."}
                  </li>
                  <li>
                    {isEn
                      ? "If cancellation occurs after the therapist is already en route or has arrived at the location, transportation fees shall remain payable."
                      : "Apabila pembatalan dilakukan saat terapis telah berada dalam perjalanan menuju lokasi atau telah tiba di lokasi pelanggan, biaya transportasi terapis tetap wajib dibayarkan."}
                  </li>
                </ul>
              </div>

              {/* Box 4: Keamanan Lokasi & Pembayaran */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-semibold text-stone-900 dark:text-stone-100">
                  <PhoneCall className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    {isEn
                      ? "4. Safe Environment & Official Payment"
                      : "4. Keamanan Lokasi Layanan & Bukti Pembayaran Resmi"}
                  </span>
                </div>
                <p className="font-light">
                  {isEn
                    ? `Clients must ensure a safe and respectful environment at the service location (home, apartment, or hotel room). All transactions must match the official digital invoice provided via WhatsApp or QRIS.`
                    : `Pelanggan wajib memastikan tempat layanan (rumah, apartemen, atau hotel) dalam kondisi aman, kondusif, dan tertib bagi terapis. Pembayaran dilakukan sesuai rincian nota resmi ${brandName} melalui Tunai, QRIS, atau Transfer Bank resmi.`}
                </p>
              </div>
            </TabsContent>

            {/* TAB 2: PRIVACY POLICY */}
            <TabsContent value="privacy" className="m-0 space-y-5 focus-visible:outline-none">
              {/* Privasi 1: Kepatuhan UU PDP */}
              <div className="p-4 rounded-none bg-sky-500/5 border border-sky-500/20 space-y-2">
                <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 font-semibold text-xs sm:text-sm">
                  <Lock className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span>
                    {isEn
                      ? "1. Data Protection Commitment (Indonesian PDP Law)"
                      : "1. Komitmen Perlindungan Data Pribadi (UU PDP No. 27/2022)"}
                  </span>
                </div>
                <p className="font-light">
                  {isEn
                    ? `${brandName} is committed to safeguarding client confidentiality in accordance with Law No. 27 of 2022 on Personal Data Protection. Your contact info and address are treated with strict confidentiality.`
                    : `${brandName} berkomitmen penuh untuk melindungi privasi dan keamanan data pelanggan sesuai Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).`}
                </p>
              </div>

              {/* Privasi 2: Data yang Dikumpulkan */}
              <div className="space-y-2">
                <h4 className="font-semibold text-stone-900 dark:text-stone-100">
                  {isEn ? "2. Data We Collect" : "2. Informasi yang Kami Kumpulkan"}
                </h4>
                <ul className="list-disc pl-5 space-y-1 font-light">
                  <li>
                    {isEn
                      ? "Identity details: Full name and contact WhatsApp/phone number."
                      : "Identitas dasar: Nama lengkap dan nomor kontak telepon / WhatsApp aktif."}
                  </li>
                  <li>
                    {isEn
                      ? "Location address: Home, apartment, or hotel address for therapist dispatch."
                      : "Alamat layanan: Alamat rumah, apartemen, atau hotel untuk keperluan kedatangan terapis."}
                  </li>
                  <li>
                    {isEn
                      ? "Order transaction logs and digital service reviews for service quality assurance."
                      : "Riwayat transaksi pesanan dan ulasan kepuasan untuk peningkatan kualitas mutu layanan."}
                  </li>
                </ul>
              </div>

              {/* Privasi 3: Penggunaan Data */}
              <div className="space-y-2">
                <h4 className="font-semibold text-stone-900 dark:text-stone-100">
                  {isEn ? "3. How We Use Your Data" : "3. Penggunaan Informasi"}
                </h4>
                <p className="font-light">
                  {isEn
                    ? "Your information is used strictly for scheduling appointments, dispatching therapists, issuing official digital receipts (invoices), and providing customer support."
                    : "Data Anda hanya digunakan untuk konfirmasi jadwal reservasi, panduan alamat terapis, pengiriman nota digital resmi (invoice), serta layanan purna jual."}
                </p>
              </div>

              {/* Privasi 4: Kerahasiaan Mutlak */}
              <div className="space-y-2">
                <h4 className="font-semibold text-stone-900 dark:text-stone-100">
                  {isEn ? "4. No Third-Party Commercial Sharing" : "4. Jaminan Kerahasiaan Mutlak (Tanpa Pihak Ketiga)"}
                </h4>
                <p className="font-light">
                  {isEn
                    ? "We NEVER sell, rent, or distribute your personal details to outside commercial entities or unauthorized advertising networks."
                    : `${brandName} TIDAK PERNAH menjual, menyewakan, atau membagikan data nomor telepon maupun alamat pelanggan kepada pihak ketiga untuk tujuan periklanan komersial di luar layanan kami.`}
                </p>
              </div>
            </TabsContent>
          </div>

          {/* Footer Dialog */}
          <div className="px-5 sm:px-6 py-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/70 flex items-center justify-between text-[11px] text-stone-500 font-light">
            <span>
              {isEn
                ? "Last updated: October 2026"
                : "Terakhir diperbarui: Oktober 2026"}
            </span>
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-1.5 rounded-none bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 hover:opacity-90 font-medium transition-opacity text-xs cursor-pointer"
            >
              {isEn ? "Close" : "Tutup"}
            </button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
