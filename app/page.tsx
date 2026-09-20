"use client";

import * as React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { useBrandSettings, cleanWhatsAppNumber } from "@/lib/brand-settings";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Sparkles,
  ShieldCheck,
  Clock,
  MapPin,
  CheckCircle2,
  Star,
  MessageCircle,
  Phone,
  ArrowRight,
  ChevronRight,
  Sun,
  Moon,
  Globe,
  Award,
  HeartHandshake,
  Droplets,
  Feather,
  Sparkle,
  Calendar,
  Layers,
  Send,
  Lock,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Curated default services with fallback
const DEFAULT_SERVICES = [
  {
    id: 1,
    name: "Traditional Balinese Massage",
    name_id: "Pijat Tradisional Bali",
    category: "Full Body Massage",
    duration_minutes: 90,
    price: 185000,
    description:
      "Perpaduan pijatan urut mendalam dengan teknik peregangan lembut dan tekanan titik akupresur untuk melancarkan peredaran darah, meredakan nyeri otot, dan mengembalikan energi tubuh.",
    description_en:
      "A harmonious blend of deep palm pressure, gentle stretching, and acupressure points to stimulate circulation, alleviate muscle soreness, and restore vitality.",
    highlight: "Favorit Pelanggan",
    highlight_en: "Most Popular",
    benefits: [
      "Melancarkan sirkulasi darah & getah bening",
      "Meredakan ketegangan otot leher & punggung",
      "Mengurangi stres & meningkatkan kualitas tidur",
    ],
    benefits_en: [
      "Stimulates blood & lymphatic circulation",
      "Relieves back & shoulder tension",
      "Reduces fatigue & improves deep sleep quality",
    ],
  },
  {
    id: 2,
    name: "Aromatherapy Deep Relaxation",
    name_id: "Pijat Relaksasi Aromaterapi",
    category: "Holistic Wellness",
    duration_minutes: 120,
    price: 245000,
    description:
      "Perawatan spa menyeluruh menggunakan minyak esensial organik murni dengan aroma lavender, lemongrass, atau chamomile untuk ketenangan jiwa dan relaksasi sistem saraf.",
    description_en:
      "A complete holistic spa ritual using pure organic essential oils (lavender, lemongrass, chamomile) designed to calm the mind and soothe the central nervous system.",
    highlight: "Sensasi Mewah",
    highlight_en: "Signature Ritual",
    benefits: [
      "100% Pure therapeutic grade organic oils",
      "Menghidrasi & melembutkan kulit tubuh",
      "Pelepas penat dan kecemasan mental",
    ],
    benefits_en: [
      "100% Pure therapeutic grade organic oils",
      "Nourishes & deeply hydrates skin",
      "Melts mental fatigue and everyday stress",
    ],
  },
  {
    id: 3,
    name: "Deep Tissue & Acupressure",
    name_id: "Pijat Deep Tissue & Titik Akupresur",
    category: "Therapeutic",
    duration_minutes: 90,
    price: 215000,
    description:
      "Fokus pada lapisan jaringan otot yang lebih dalam untuk melepaskan simpul ketegangan kronis, kram otot, dan pemulihan tubuh pasca olahraga atau aktivitas berat.",
    description_en:
      "Targeted deep muscle layer therapy designed to break chronic knots, relieve posture stiffness, and accelerate athletic recovery.",
    highlight: "Pemulihan Otot",
    highlight_en: "Deep Recovery",
    benefits: [
      "Mengurai kaku otot & simpul pegal menahun",
      "Membantu perbaikan postur tubuh",
      "Ideal untuk pekerja kantoran & pegiat olahraga",
    ],
    benefits_en: [
      "Releases chronic knots & deep muscle tightness",
      "Aids posture and spinal alignment",
      "Perfect for desk workers & active lifestyles",
    ],
  },
  {
    id: 4,
    name: "Royal Body Scrub & Lulur Keraton",
    name_id: "Perawatan Lulur & Body Scrub Tradisional",
    category: "Body Glow & Spa",
    duration_minutes: 120,
    price: 275000,
    description:
      "Ritual kecantikan khas Nusantara: eksfoliasi sel kulit mati dengan scrub rempah alami beraroma wangi, dilanjutkan pijat relaksasi dan pelembap tubuh.",
    description_en:
      "Heritage Indonesian beauty ritual: gentle natural herbal exfoliation followed by a soothing relaxation massage for radiant, glowing skin.",
    highlight: "Kulit Cerah",
    highlight_en: "Glow & Polish",
    benefits: [
      "Mengangkat sel kulit mati secara lembut",
      "Mencerahkan & menghaluskan tekstur kulit",
      "Aroma rempah tradisional yang menenangkan",
    ],
    benefits_en: [
      "Gently sloughs off dull dead skin cells",
      "Brightens & smoothens skin texture",
      "Infused with calming traditional botanicals",
    ],
  },
  {
    id: 5,
    name: "Foot Reflexology & Acupressure",
    name_id: "Refleksi Kaki & Totok Wajah Relaksasi",
    category: "Targeted Relief",
    duration_minutes: 60,
    price: 145000,
    description:
      "Stimulasi titik-titik saraf telapak kaki yang terhubung dengan organ tubuh, dipadukan totok wajah ringan untuk melancarkan sirkulasi dan menyegarkan paras.",
    description_en:
      "Precise reflexology zone stimulation on the feet paired with gentle facial acupressure for immediate rejuvenation and clarity.",
    highlight: "Cepat & Segar",
    highlight_en: "Quick Refresh",
    benefits: [
      "Meremajakan kaki lelah setelah seharian berjalan",
      "Totok wajah menyegarkan kantung mata lelah",
      "Dapat dinikmati sambil bersantai di sofa rumah",
    ],
    benefits_en: [
      "Revives tired legs after a long day",
      "Facial acupressure relieves eye fatigue",
      "Enjoy comfortably right on your living room sofa",
    ],
  },
  {
    id: 6,
    name: "Prenatal / Maternal Gentle Care",
    name_id: "Pijat Lembut Ibu Hamil (Prenatal)",
    category: "Maternal Wellness",
    duration_minutes: 90,
    price: 235000,
    description:
      "Pijatan dengan posisi miring yang aman dan tekanan yang sangat lembut oleh terapis bersertifikasi khusus untuk mengurangi pegal pinggang dan bengkak pada ibu hamil (usia kandungan > 16 minggu).",
    description_en:
      "Safe side-lying therapeutic massage with ultra-gentle pressure by specialized certified therapists to ease lower back strain and swelling during pregnancy (> 16 weeks).",
    highlight: "Spesialis Ibu Hamil",
    highlight_en: "Maternal Care",
    benefits: [
      "Mengurangi kram kaki & pembengkakan air",
      "Meredakan pegal pinggang & panggul",
      "Menenangkan emosi & memberi rasa rileks pada janin",
    ],
    benefits_en: [
      "Alleviates leg cramps & water retention",
      "Relieves lower back & hip discomfort",
      "Promotes tranquil bonding and better rest",
    ],
  },
];

// Curated verified testimonials
const TESTIMONIALS = [
  {
    name: "Clarissa Wijaya",
    location: "Pondok Indah, Jakarta Selatan",
    rating: 5,
    text: "Terapisnya sangat profesional, datang tepat waktu dengan seragam rapi dan perlengkapan higienis. Minyak aromaterapi lavender-nya sangat wangi dan tidak lengket sama sekali. Rasanya seperti membawa spa hotel bintang lima ke kamar tidur sendiri.",
    service: "Aromatherapy Deep Relaxation",
  },
  {
    name: "Dr. Hendra Gunawan",
    location: "BSD City, Tangerang Selatan",
    rating: 5,
    text: "Setelah jadwal operasi yang padat, pijat Deep Tissue dari Serena Raga benar-benar melegakan ketegangan punggung dan bahu saya. Sangat praktis karena tidak perlu macet-macetan keluar rumah.",
    service: "Deep Tissue & Acupressure",
  },
  {
    name: "Nadira Salsabila",
    location: "Kelapa Gading, Jakarta Utara",
    rating: 5,
    text: "Nota digitalnya sangat rapi dan transparan. Terapis wanita yang bertugas sangat santun dan paham betul teknik totok relaksasi. Pasti akan jadi langganan mingguan keluarga kami.",
    service: "Traditional Balinese Massage",
  },
];

export default function LandingPage() {
  const { settings, adminWhatsAppUrl, formattedPhone } = useBrandSettings();

  const [mounted, setMounted] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [locale, setLocale] = React.useState<"id" | "en">("id");
  const isEn = locale === "en";

  // Dynamic state from database
  const [services, setServices] = React.useState<any[]>(DEFAULT_SERVICES);

  // Booking simulation state
  const [selectedService, setSelectedService] = React.useState<string>("Traditional Balinese Massage");
  const [selectedDuration, setSelectedDuration] = React.useState<string>("90");
  const [selectedArea, setSelectedArea] = React.useState<string>("Jakarta Selatan");
  const [preferredDate, setPreferredDate] = React.useState<string>("");
  const [preferredTime, setPreferredTime] = React.useState<string>("15:00");
  const [guestName, setGuestName] = React.useState<string>("");

  React.useEffect(() => {
    setMounted(true);
    // Set default date to today
    const today = new Date().toISOString().split("T")[0];
    setPreferredDate(today);

    // Fetch live services from Supabase if available
    async function loadServices() {
      try {
        const { data, error } = await supabase
          .from("services")
          .select("*")
          .eq("is_active", true)
          .order("price", { ascending: true });

        if (!error && data && data.length > 0) {
          // Merge database records with enhanced UI metadata
          const merged = data.map((srv, idx) => ({
            ...srv,
            name_id: srv.name,
            highlight: idx === 0 ? "Favorit" : idx === 1 ? "Paling Populer" : "Rekomendasi",
            highlight_en: idx === 0 ? "Popular" : idx === 1 ? "Top Rated" : "Recommended",
            benefits: [
              "Terapis bersertifikasi & berpengalaman",
              "Menggunakan minyak alami bebas lengket",
              "Peralatan steril & kain sekali pakai",
            ],
            benefits_en: [
              "Certified & verified therapist",
              "100% natural residue-free oils",
              "Sterilized linens & single-use equipment",
            ],
          }));
          setServices(merged);
        }
      } catch (e) {
        // keep default services
      }
    }
    loadServices();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleCreateWhatsAppBooking = (serviceName?: string, price?: number) => {
    const sName = serviceName || selectedService;
    const cleanWa = cleanWhatsAppNumber(settings.whatsapp_number || "6281234567890");

    const message = isEn
      ? `Hello *${settings.brand_name || "Serena Raga"}*,\n\nI would like to book a home massage service:\n\n💆 *Service:* ${sName}\n⏱️ *Duration:* ${selectedDuration} Minutes\n📍 *Area / Location:* ${selectedArea}\n📅 *Preferred Schedule:* ${preferredDate} at ${preferredTime} WIB\n👤 *Guest Name:* ${guestName || "Guest"}\n\nPlease let me know therapist availability. Thank you!`
      : `Halo Admin *${settings.brand_name || "Serena Raga"}*,\n\nSaya ingin memesan layanan pijat ke rumah:\n\n💆 *Pilihan Layanan:* ${sName}\n⏱️ *Durasi:* ${selectedDuration} Menit\n📍 *Area / Alamat:* ${selectedArea}\n📅 *Jadwal:* ${preferredDate} jam ${preferredTime} WIB\n👤 *Nama Pemesan:* ${guestName || "Pelanggan"}\n\nMohon konfirmasi ketersediaan terapis. Terima kasih.`;

    const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(message)}`;
    if (typeof window !== "undefined") {
      window.open(waUrl, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* 1. Top Sub-header Announcement Bar */}
      <div className="border-b border-border/40 bg-muted/30 text-muted-foreground text-[11px] sm:text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-foreground">
              {isEn ? "On-Demand & Scheduled Home Spa" : "Layanan Pijat Panggilan & Home Spa Resmi"}
            </span>
            <span className="text-border hidden sm:inline">•</span>
            <span className="hidden sm:inline">
              {settings.operational_hours || "08:00 - 22:00 WIB (Setiap Hari)"}
            </span>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-primary" />
              <span>{settings.service_areas || "Jabodetabek & Sekitarnya"}</span>
            </span>
            <span className="text-border hidden sm:inline">|</span>
            <a
              href={`https://instagram.com/${(settings.instagram_handle || "serenaraga").replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors hidden sm:inline"
            >
              {settings.instagram_handle || "@serenaraga"}
            </a>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Header (Clean Minimalist Luxury) */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/85 border-b border-border/60 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <BrandLogo variant="full" className="h-8 sm:h-9 w-auto text-foreground group-hover:text-primary transition-colors" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs lg:text-sm font-medium text-muted-foreground">
            <a href="#layanan" className="hover:text-foreground transition-colors">
              {isEn ? "Services & Rituals" : "Katalog Layanan"}
            </a>
            <a href="#keunggulan" className="hover:text-foreground transition-colors">
              {isEn ? "Our Standards" : "Standar Kualitas"}
            </a>
            <a href="#simulasi" className="hover:text-foreground transition-colors">
              {isEn ? "Book Schedule" : "Reservasi Cepat"}
            </a>
            <a href="#ulasan" className="hover:text-foreground transition-colors">
              {isEn ? "Client Stories" : "Ulasan Pelanggan"}
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </a>
            <a href="#kontak" className="hover:text-foreground transition-colors">
              {isEn ? "Contact" : "Kontak"}
            </a>
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Locale Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocale(locale === "id" ? "en" : "id")}
              className="h-8 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1"
              title={isEn ? "Ganti ke Bahasa Indonesia" : "Switch to English"}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{isEn ? "EN" : "ID"}</span>
            </Button>

            {/* Admin Portal Shortcut (Desktop) */}
            <Link href="/admin">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-medium gap-1.5 shadow-none border-border/80 hidden sm:flex"
              >
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Portal Admin</span>
              </Button>
            </Link>

            {/* Direct Booking CTA (Desktop & Tablet) */}
            <Button
              size="sm"
              onClick={() => handleCreateWhatsAppBooking()}
              className="h-9 px-3.5 sm:px-4 text-xs sm:text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-sm rounded-lg hidden xs:inline-flex"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>{isEn ? "Book WhatsApp" : "Pesan WA"}</span>
            </Button>

            {/* Mobile Sheet Menu Trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger
                className="inline-flex items-center justify-center h-9 w-9 md:hidden rounded-lg border border-border/80 bg-background hover:bg-muted text-foreground transition-colors cursor-pointer shadow-none"
                aria-label="Open Navigation Menu"
              >
                <Menu className="w-4 h-4 text-foreground" />
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-xs p-6 flex flex-col justify-between bg-card">
                <div className="space-y-6">
                  <SheetHeader className="text-left pb-4 border-b border-border/60">
                    <BrandLogo variant="full" className="h-7 w-auto text-foreground" />
                    <SheetTitle className="text-xs font-mono text-muted-foreground pt-1">
                      {settings.tagline || "Home Massage & Wellness"}
                    </SheetTitle>
                  </SheetHeader>

                  {/* Vertical Navigation Links */}
                  <nav className="flex flex-col space-y-3.5 text-sm font-medium">
                    <a
                      href="#layanan"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-1 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-between"
                    >
                      <span>{isEn ? "Services & Rituals" : "Katalog Layanan"}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                    </a>
                    <a
                      href="#keunggulan"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-1 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-between"
                    >
                      <span>{isEn ? "Our Standards" : "Standar Kualitas"}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                    </a>
                    <a
                      href="#simulasi"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-1 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-between"
                    >
                      <span>{isEn ? "Book Schedule" : "Reservasi Cepat"}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                    </a>
                    <a
                      href="#ulasan"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-1 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-between"
                    >
                      <span>{isEn ? "Client Stories" : "Ulasan Pelanggan"}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                    </a>
                    <a
                      href="#faq"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-1 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-between"
                    >
                      <span>FAQ</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                    </a>
                    <a
                      href="#kontak"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-1 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-between"
                    >
                      <span>{isEn ? "Contact & Areas" : "Kontak & Wilayah"}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                    </a>
                  </nav>

                  {/* Primary Mobile WhatsApp CTA */}
                  <div className="pt-2">
                    <Button
                      size="lg"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleCreateWhatsAppBooking();
                      }}
                      className="w-full h-11 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-xl shadow-xs"
                    >
                      <MessageCircle className="w-4 h-4 fill-current" />
                      <span>{isEn ? "Book via WhatsApp" : "Pesan via WhatsApp"}</span>
                    </Button>
                  </div>
                </div>

                {/* Footer in Mobile Sheet */}
                <div className="pt-6 border-t border-border/60 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-mono">{settings.operational_hours || "08:00 - 22:00 WIB"}</span>
                    <button
                      onClick={() => setLocale(locale === "id" ? "en" : "id")}
                      className="font-semibold text-foreground hover:underline"
                    >
                      {locale === "id" ? "Switch to EN" : "Ganti ke ID"}
                    </button>
                  </div>

                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-border bg-muted/40 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Portal Admin / Staf</span>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* 3. Hero Section (Editorial Luxury Spa Sanctuary) */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-28 border-b border-border/50">
        {/* Subtle Background Glow Accent */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Luxury Pill Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border/80 bg-muted/40 text-xs text-foreground font-medium backdrop-blur-sm shadow-none">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
            <span>{isEn ? "Five-Star Home Spa & Massage Experience" : "Layanan Pijat Panggilan Bintang Lima di Rumah Anda"}</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.15]">
            {isEn ? (
              <>
                Sanctuary of Deep Relaxation, <br className="hidden sm:inline" />
                <span className="text-muted-foreground font-light italic">In the Privacy of Your Home.</span>
              </>
            ) : (
              <>
                Kenyamanan Pijat & Spa Bintang Lima, <br className="hidden sm:inline" />
                <span className="text-muted-foreground font-light italic">Langsung di Rumah & Kamar Anda.</span>
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed font-normal">
            {isEn
              ? "Certified therapists delivering bespoke massage rituals with 100% natural organic essential oils and hospital-grade sterilized linens. No traffic, pure serenity."
              : "Terapis profesional bersertifikasi menghadirkan ritual pemulihan tubuh dengan minyak aromaterapi murni alami serta linen higienis steril. Bebas macet, relaksasi tanpa batas."}
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Button
              size="lg"
              onClick={() => handleCreateWhatsAppBooking()}
              className="w-full sm:w-auto h-12 px-7 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-2.5 shadow-sm rounded-xl cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>{isEn ? "Book a Session (Instant WhatsApp)" : "Reservasi Sekarang via WhatsApp"}</span>
            </Button>

            <a href="#layanan" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-12 px-6 text-sm font-medium border-border/80 shadow-none rounded-xl gap-2 hover:bg-muted/50"
              >
                <span>{isEn ? "Explore Services & Pricing" : "Lihat Katalog Layanan & Tarif"}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Button>
            </a>
          </div>

          {/* Trust Highlights Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 max-w-4xl mx-auto border-t border-border/60 text-left">
            <div className="p-3 rounded-lg bg-card border border-border/50 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Award className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                <span>{isEn ? "Certified Therapists" : "Terapis Tersertifikasi"}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isEn ? "Trained & vetted with 3+ years experience" : "Terlatih, sopan & berpengalaman > 3 tahun"}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-card border border-border/50 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Droplets className="w-4 h-4 text-primary" />
                <span>{isEn ? "100% Organic Oils" : "Minyak Alami Murni"}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isEn ? "Residue-free therapeutic essential oils" : "Tanpa rasa lengket beraroma aromaterapi"}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-card border border-border/50 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                <span>{isEn ? "Hospital Sterility" : "Higienis & Steril"}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isEn ? "Single-use disposable sheets & towels" : "Kain & sprei baru steril sekali pakai"}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-card border border-border/50 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Clock className="w-4 h-4 text-foreground" />
                <span>{isEn ? "Flexible Schedule" : "Jadwal Fleksibel"}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isEn ? "Ready from 08:00 to 22:00 WIB" : "Siap panggil 08.00 - 22.00 WIB"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Services Menu Catalog (Dynamic & Interactive) */}
      <section id="layanan" className="py-20 bg-muted/20 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="outline" className="px-3 py-1 text-xs uppercase tracking-widest font-mono">
              {isEn ? "Menu of Rituals" : "Katalog Pilihan Layanan"}
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
              {isEn ? "Crafted for Your Well-being" : "Ritual Relaksasi & Pemulihan Tubuh"}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {isEn
                ? "Every massage ritual includes free consultation, sanitized linens, and custom aromatherapy selection."
                : "Semua sesi mencakup konsultasi keluhan otot, pemilihan aroma minyak, serta perlengkapan steril."}
            </p>
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => {
              const displayName = isEn ? service.name : service.name_id || service.name;
              const displayDesc = isEn ? service.description_en || service.description : service.description;
              const displayHighlight = isEn ? service.highlight_en || service.highlight : service.highlight;
              const displayBenefits = isEn ? service.benefits_en || service.benefits : service.benefits;

              return (
                <Card
                  key={service.id || index}
                  className="relative flex flex-col justify-between border border-border/70 bg-card rounded-2xl p-6 shadow-none hover:border-foreground/30 transition-all duration-200 group"
                >
                  <div className="space-y-4">
                    {/* Top Row: Category & Highlight */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                        {service.category || "Home Spa"}
                      </span>
                      {displayHighlight && (
                        <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0.5 rounded-full">
                          {displayHighlight}
                        </Badge>
                      )}
                    </div>

                    {/* Title & Duration */}
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {displayName}
                      </h3>
                      <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground font-mono">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>{service.duration_minutes || 90} {isEn ? "Minutes" : "Menit"}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {displayDesc}
                    </p>

                    {/* Key Benefits List */}
                    {displayBenefits && (
                      <div className="pt-2 border-t border-border/50 space-y-1.5">
                        {displayBenefits.map((b: string, bIdx: number) => (
                          <div key={bIdx} className="flex items-start gap-2 text-xs text-foreground/85">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
                            <span className="text-[11px] leading-tight">{b}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pricing & Booking Action */}
                  <div className="pt-6 mt-4 border-t border-border/60 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase font-mono text-muted-foreground">
                        {isEn ? "Investment" : "Tarif Layanan"}
                      </div>
                      <div className="text-base sm:text-lg font-bold font-mono text-foreground">
                        {formatPrice(service.price)}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleCreateWhatsAppBooking(displayName, service.price)}
                      className="h-8 px-3.5 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 gap-1.5 rounded-lg shadow-none"
                    >
                      <span>{isEn ? "Book" : "Pesan"}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Standards of Excellence (Brand Philosophy) */}
      <section id="keunggulan" className="py-20 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="outline" className="px-3 py-1 text-xs uppercase tracking-widest font-mono">
              {isEn ? "Quality Commitment" : "Standar Pelayanan"}
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
              {isEn ? "Why Discerning Clients Choose Serena Raga" : "Mengapa Pelanggan Mempercayai Serena Raga"}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isEn
                ? "We redefine at-home wellness with strict hygiene protocols, transparent pricing, and master-level therapists."
                : "Kami menjamin kenyamanan maksimal di rumah Anda dengan protokol kebersihan ketat dan terapis beretika tinggi."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl border border-border/60 bg-card space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                {isEn ? "1. Background-Checked & Certified" : "1. Terapis Berpengalaman & Terverifikasi"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isEn
                  ? "Every therapist undergoes rigorous technical assessment, background verification, and hospitality ethics training before serving clients."
                  : "Setiap terapis melewati seleksi ketat keahlian pijat, verifikasi identitas resmi, serta pelatihan keramahan dan etika pelayanan privat."}
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border/60 bg-card space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Sparkle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                {isEn ? "2. Hospital-Grade Cleanliness" : "2. Perlengkapan Bersih & Steril"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isEn
                  ? "We bring disposable headrest covers, sanitized body sheets, sealed oil bottles, and sanitizers to ensure maximum peace of mind."
                  : "Terapis membawa kain penutup steril, alas kepala sekali pakai, handuk bersih bersegel, dan hand sanitizer standar medis."}
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border/60 bg-card space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Droplets className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                {isEn ? "3. Non-Sticky Botanical Essential Oils" : "3. Minyak Alami Aromaterapi Murni"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isEn
                  ? "Formulated with premium cold-pressed botanical oils that nourish the skin without leaving an uncomfortable greasy feeling afterwards."
                  : "Minyak pijat kami diformulasikan dari bahan nabati alami murni yang melembapkan kulit tanpa meninggalkan rasa lengket yang mengganggu."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Interactive Quick Booking Simulator */}
      <section id="simulasi" className="py-20 bg-muted/30 border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border border-border/70 bg-card rounded-2xl p-6 sm:p-10 shadow-none space-y-8">
            <div className="text-center space-y-2">
              <Badge variant="outline" className="px-3 py-0.5 text-xs font-mono uppercase">
                {isEn ? "Quick Reservation" : "Formulir Pemesanan Cepat"}
              </Badge>
              <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground">
                {isEn ? "Schedule Your Home Massage in Seconds" : "Atur Jadwal Pijat ke Rumah Anda"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isEn
                  ? "Select your preferences below and connect directly with our dispatch team via WhatsApp."
                  : "Pilih layanan dan waktu yang Anda inginkan, pesan akan otomatis terisi dan siap dikirim ke WhatsApp resmi kami."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {isEn ? "Your Full Name" : "Nama Lengkap"}
                </label>
                <input
                  type="text"
                  placeholder={isEn ? "e.g. Jessica Tan" : "Contoh: Budi Santoso"}
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Service Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {isEn ? "Choose Service" : "Pilihan Layanan"}
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  {services.map((s, idx) => (
                    <option key={idx} value={s.name}>
                      {s.name} ({formatPrice(s.price)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {isEn ? "Duration" : "Durasi Layanan"}
                </label>
                <select
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="60">60 Menit (Express Relief)</option>
                  <option value="90">90 Menit (Full Body Recovery - Rekomendasi)</option>
                  <option value="120">120 Menit (Complete Luxury Ritual)</option>
                </select>
              </div>

              {/* City / Area */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {isEn ? "City / Area" : "Wilayah / Kota Layanan"}
                </label>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="Jakarta Selatan">Jakarta Selatan</option>
                  <option value="Jakarta Pusat">Jakarta Pusat</option>
                  <option value="Jakarta Barat">Jakarta Barat</option>
                  <option value="Jakarta Utara">Jakarta Utara</option>
                  <option value="Jakarta Timur">Jakarta Timur</option>
                  <option value="Tangerang Selatan (BSD / Bintaro)">Tangerang Selatan (BSD / Bintaro / Serpong)</option>
                  <option value="Tangerang Kota">Tangerang Kota / Alam Sutera</option>
                  <option value="Depok">Depok</option>
                  <option value="Bekasi">Bekasi</option>
                </select>
              </div>

              {/* Preferred Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {isEn ? "Date of Service" : "Tanggal Layanan"}
                </label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Preferred Time */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {isEn ? "Preferred Time (WIB)" : "Waktu Layanan (WIB)"}
                </label>
                <input
                  type="time"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <Button
              size="lg"
              onClick={() => handleCreateWhatsAppBooking()}
              className="w-full h-12 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-xl shadow-none cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isEn ? "Proceed to WhatsApp Booking" : "Kirim Format Pemesanan ke WhatsApp"}</span>
            </Button>
          </Card>
        </div>
      </section>

      {/* 7. Verified Customer Reviews & Testimonials */}
      <section id="ulasan" className="py-20 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="outline" className="px-3 py-1 text-xs uppercase tracking-widest font-mono">
              {isEn ? "Client Feedback" : "Testimoni Asli"}
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
              {isEn ? "Loved by Discerning Homeowners" : "Pengalaman Relaksasi Pelanggan Kami"}
            </h2>
            <div className="flex items-center justify-center gap-1.5 pt-1">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-xs font-semibold text-foreground">4.9 / 5.0</span>
              <span className="text-xs text-muted-foreground">• dari 500+ sesi pemesanan</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((review, idx) => (
              <Card
                key={idx}
                className="border border-border/60 bg-card rounded-2xl p-6 shadow-none flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex text-amber-500">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Verified Client
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed italic">
                    &ldquo;{review.text}&rdquo;
                  </p>
                </div>

                <div className="pt-3 border-t border-border/50">
                  <h4 className="text-xs font-bold text-foreground">{review.name}</h4>
                  <div className="text-[11px] text-muted-foreground">{review.location}</div>
                  <div className="text-[10px] text-primary font-medium mt-0.5">{review.service}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Coverage Areas */}
      <section className="py-14 bg-muted/20 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground font-mono">
              {isEn ? "Coverage Area & Dispatch Zones" : "Wilayah Jangkauan Pelayanan"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isEn
                ? "Therapists dispatched promptly to homes, private residences, apartments, and hotels across:"
                : "Terapis siap melayani panggilan ke rumah tinggal, apartemen, perumahan, dan hotel di area:"}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
            {[
              "Jakarta Selatan",
              "Jakarta Pusat",
              "Jakarta Barat",
              "Jakarta Utara",
              "Jakarta Timur",
              "BSD City",
              "Bintaro Jaya",
              "Alam Sutera",
              "Gading Serpong",
              "Tangerang Kota",
              "Depok",
              "Bekasi Barat",
            ].map((area, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full border border-border/70 bg-card text-xs text-foreground font-medium"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FAQ Section (Accordion) */}
      <section id="faq" className="py-20 border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <Badge variant="outline" className="px-3 py-0.5 text-xs font-mono uppercase">
              FAQ
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {isEn ? "Frequently Asked Questions" : "Pertanyaan yang Sering Diajukan"}
            </h2>
          </div>

          <Accordion className="w-full space-y-3">
            <AccordionItem value="item-1" className="border border-border/70 rounded-xl px-4 bg-card">
              <AccordionTrigger className="text-xs sm:text-sm font-semibold text-foreground hover:no-underline">
                {isEn
                  ? "Do therapists bring all required massage equipment?"
                  : "Apakah terapis membawa perlengkapan pijat sendiri?"}
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed pt-1 pb-3">
                {isEn
                  ? "Yes. Our therapists arrive fully prepared with sanitized sheets, single-use headrest covers, premium aromatherapy oils, and clean towels. You only need to prepare a comfortable bed or mattress."
                  : "Ya, betul. Terapis kami membawa perlengkapan lengkap termasuk kain penutup steril, alas kepala sekali pakai, minyak aromaterapi pilihan, dan handuk bersih. Anda cukup menyediakan kasur/tempat yang nyaman."}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border border-border/70 rounded-xl px-4 bg-card">
              <AccordionTrigger className="text-xs sm:text-sm font-semibold text-foreground hover:no-underline">
                {isEn
                  ? "How far in advance should I make a reservation?"
                  : "Berapa lama sebelum sesi saya harus melakukan pemesanan?"}
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed pt-1 pb-3">
                {isEn
                  ? "We recommend booking 1 to 2 hours in advance for on-demand dispatch, or booking 1 day earlier for peak evening & weekend slots."
                  : "Kami sarankan memesan 1–2 jam sebelum jam yang diinginkan agar terapis memiliki waktu perjalanan yang cukup, atau H-1 untuk jam favorit malam hari & akhir pekan."}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border border-border/70 rounded-xl px-4 bg-card">
              <AccordionTrigger className="text-xs sm:text-sm font-semibold text-foreground hover:no-underline">
                {isEn
                  ? "What are the available payment methods?"
                  : "Metode pembayaran apa saja yang diterima?"}
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed pt-1 pb-3">
                {isEn
                  ? "We accept Cash directly to the therapist upon session completion, QRIS (instant scan), or direct Bank Transfer. You will receive an official digital invoice with receipt link."
                  : "Kami menerima Tunai (Cash) langsung kepada terapis setelah sesi selesai, QRIS (Semua E-Wallet/Mobile Banking), dan Transfer Bank. Anda akan menerima nota digital resmi."}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border border-border/70 rounded-xl px-4 bg-card">
              <AccordionTrigger className="text-xs sm:text-sm font-semibold text-foreground hover:no-underline">
                {isEn
                  ? "Can I choose a female or male therapist?"
                  : "Bisakah saya memilih terapis wanita atau pria?"}
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed pt-1 pb-3">
                {isEn
                  ? "Yes. You can specify your preference when booking through WhatsApp, and we will match you with the best available therapist."
                  : "Tentu bisa. Anda dapat menyampaikan preferensi terapis (wanita/pria) saat mengonfirmasi pesanan via WhatsApp, dan kami akan menugaskan terapis yang sesuai."}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* 10. Direct CTA Banner */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
            {isEn ? "Ready for Complete Relaxation Today?" : "Siap Menikmati Relaksasi Terbaik Hari Ini?"}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
            {isEn
              ? "Chat with our friendly concierge team now on WhatsApp. Available daily 08:00 - 22:00 WIB."
              : "Hubungi layanan pelanggan WhatsApp kami sekarang untuk konsultasi dan pemesanan langsung."}
          </p>
          <div className="pt-2">
            <Button
              size="lg"
              onClick={() => handleCreateWhatsAppBooking()}
              className="h-12 px-8 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-xl shadow-sm cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>{isEn ? "Chat with WhatsApp Support" : "Chat Customer Support WhatsApp"}</span>
            </Button>
          </div>
        </div>
      </section>

      {/* 11. Luxury Editorial Footer */}
      <footer id="kontak" className="border-t border-border/60 bg-background py-16 text-muted-foreground text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Column 1: Brand */}
            <div className="space-y-4 md:col-span-2">
              <BrandLogo variant="full" className="h-8 w-auto text-foreground" />
              <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                {settings.description ||
                  "Layanan terapis pijat dan spa profesional langsung ke rumah, hotel, dan apartemen Anda dengan standar kualitas bintang lima."}
              </p>
              <div className="text-[11px] font-mono text-muted-foreground">
                Official WhatsApp: <span className="text-foreground font-bold">{formattedPhone}</span>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground font-mono">
                {isEn ? "Navigation" : "Navigasi"}
              </h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#layanan" className="hover:text-foreground transition-colors">{isEn ? "Services" : "Katalog Layanan"}</a></li>
                <li><a href="#keunggulan" className="hover:text-foreground transition-colors">{isEn ? "Our Standards" : "Standar Higienis"}</a></li>
                <li><a href="#simulasi" className="hover:text-foreground transition-colors">{isEn ? "Reservation" : "Formulir Booking"}</a></li>
                <li><a href="#ulasan" className="hover:text-foreground transition-colors">{isEn ? "Client Reviews" : "Ulasan Pelanggan"}</a></li>
                <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Column 3: Operation & Portal */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground font-mono">
                {isEn ? "Operations" : "Operasional"}
              </h4>
              <div className="space-y-1 text-xs">
                <div>{settings.operational_hours || "08:00 - 22:00 WIB"}</div>
                <div>{settings.service_areas || "Jabodetabek Area"}</div>
                <div className="pt-2">
                  <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium">
                    <Lock className="w-3 h-3" />
                    <span>Portal Administrator</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <p>&copy; {new Date().getFullYear()} {settings.brand_name || "Serena Raga"}. All rights reserved.</p>
            <p className="text-muted-foreground font-light">Comfortable Home Wellness & Massage Sanctuary</p>
          </div>
        </div>
      </footer>

      {/* 12. Floating WhatsApp Button (Fixed Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => handleCreateWhatsAppBooking()}
          size="icon"
          className="h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg cursor-pointer hover:scale-105 transition-all flex items-center justify-center relative group"
          title={isEn ? "Chat with Serena Raga on WhatsApp" : "Hubungi WhatsApp Serena Raga"}
        >
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
          </span>
          <MessageCircle className="w-6 h-6 fill-current" />
        </Button>
      </div>
    </div>
  );
}
