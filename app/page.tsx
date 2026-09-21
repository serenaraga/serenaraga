"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { BrandLogo } from "@/components/brand-logo";
import { useBrandSettings, cleanWhatsAppNumber } from "@/lib/brand-settings";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sparkles,
  ShieldCheck,
  Clock,
  MapPin,
  Check,
  CheckCircle2,
  Star,
  MessageCircle,
  Phone,
  Mail,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Plus,
  Minus,
  Sun,
  Moon,
  Globe,
  Award,
  HeartHandshake,
  Droplets,
  Calendar as CalendarIcon,
  Menu,
  X,
  Home,
  Building2,
  Heart,
  CalendarClock,
  Sparkle,
  Search,
  ReceiptText,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Curated default services with fallback
const DEFAULT_SERVICES = [
  {
    id: 1,
    name: "Traditional Balinese Massage",
    name_id: "Pijat Tradisional Bali",
    category: "Full Body Massage",
    category_id: "Pijat Seluruh Tubuh",
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
      "Minyak aromaterapi & matras steril disediakan",
    ],
    benefits_en: [
      "Stimulates blood & lymphatic circulation",
      "Relieves back & shoulder tension",
      "Aromatherapy oil & sanitized mattress included",
    ],
  },
  {
    id: 2,
    name: "Aromatherapy Deep Relaxation",
    name_id: "Pijat Relaksasi Aromaterapi",
    category: "Holistic Wellness",
    category_id: "Kebugaran Holistik",
    duration_minutes: 120,
    price: 245000,
    description:
      "Perawatan spa menyeluruh menggunakan minyak esensial organik murni dengan aroma lavender, lemongrass, atau chamomile untuk ketenangan jiwa dan relaksasi sistem saraf.",
    description_en:
      "A complete holistic spa ritual using pure organic essential oils (lavender, lemongrass, chamomile) designed to calm the mind and soothe the central nervous system.",
    highlight: "Sensasi Mewah",
    highlight_en: "Signature Ritual",
    benefits: [
      "100% Minyak esensial organik murni",
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
    category_id: "Terapi Pemulihan",
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
    category_id: "Spa & Lulur Tubuh",
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
    category_id: "Refleksi Terarah",
    duration_minutes: 60,
    price: 145000,
    description:
      "Stimulasi titik-titik saraf telapak kaki yang terhubung dengan organ tubuh, dipadukan totok wajah ringan untuk melancarkan sirkulasi dan menyegarkan paras.",
    description_en:
      "Precise reflexology zone stimulation on the feet paired with gentle facial acupressure for immediate rejuvenation and clarity.",
    highlight: "Cepat & Segar",
    highlight_en: "Quick Refresh",
    benefits: [
      "Meremajakan kaki lelah setelah seharian beraktivitas",
      "Totok wajah menyegarkan sirkulasi paras",
      "Dapat dinikmati santai di sofa rumah",
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
    category_id: "Perawatan Ibu Hamil",
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

// Curated verified testimonials matching editorial design
const TESTIMONIALS = [
  {
    name: "David K.",
    role_en: "Business Traveler",
    role_id: "Wisatawan Bisnis",
    text_en:
      "Escape's at-home massage service is a game-changer. The therapist was incredibly skilled, professional, and created a spa-like atmosphere right in my hotel room. I felt completely refreshed and renewed.",
    text_id:
      "Layanan pijat panggilan Serena Raga benar-benar luar biasa. Terapisnya sangat terampil, profesional, dan menciptakan suasana spa mewah di kamar hotel saya. Tubuh terasa segar dan bugar kembali.",
    image:
      "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&q=80&w=1200",
  },
  {
    name: "Clarissa Wijaya",
    role_en: "Executive Resident",
    role_id: "Eksekutif & Residen",
    text_en:
      "The therapist was exceptionally professional, punctual, and brought clean sanitized linens. The lavender aromatherapy was divine and non-greasy. Truly feels like bringing a 5-star luxury hotel spa directly into my bedroom.",
    text_id:
      "Terapisnya sangat profesional, datang tepat waktu dengan seragam rapi dan perlengkapan higienis. Minyak aromaterapi lavender-nya sangat wangi dan menenangkan. Benar-benar serasa membawa spa hotel bintang lima ke rumah.",
    image:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=1200",
  },
  {
    name: "Dr. Hendra Gunawan",
    role_en: "Medical Specialist",
    role_id: "Dokter Spesialis",
    text_en:
      "After grueling surgical hours, the Deep Tissue massage completely melted away all my shoulder and back tension. Incredibly convenient with zero traffic hassle.",
    text_id:
      "Setelah jadwal operasi yang padat, pijatan Deep Tissue dari Serena Raga benar-benar melegakan ketegangan leher dan punggung saya. Sangat praktis tanpa perlu macet-macetan di jalan.",
    image:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=1200",
  },
  {
    name: "Nadira Salsabila",
    role_en: "Loyal Wellness Client",
    role_id: "Pelanggan Setia",
    text_en:
      "The digital invoice and booking process were seamless and transparent. The female therapist was polite, respectful, and master of acupressure techniques. Definitely our family's weekly routine.",
    text_id:
      "Nota digital dan proses pemesanannya sangat rapi dan transparan. Terapis wanita yang bertugas sangat santun dan paham betul teknik totok relaksasi. Pasti jadi langganan mingguan keluarga kami.",
    image:
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=1200",
  },
];

// Curated FAQ Items
const FAQ_ITEMS = [
  {
    q_en: "How far in advance should I book?",
    q_id: "Berapa lama waktu pemesanan sebelum terapis tiba?",
    a_en:
      "We recommend booking at least 2 hours in advance, but last-minute bookings are available depending on therapist availability.",
    a_id:
      "Kami sarankan memesan setidaknya 1-2 jam sebelumnya agar terapis dapat mempersiapkan perlengkapan steril dan tiba tepat waktu. Pesanan mendesak (last-minute) tetap dilayani selama slot terapis tersedia.",
  },
  {
    q_en: "Do I need to prepare anything for the massage?",
    q_id: "Apa saja yang perlu saya siapkan di rumah atau hotel?",
    a_en:
      "You don't need to prepare anything! Our professional therapist arrives fully equipped with a portable sanitized mattress, fresh sealed linens, organic essential oils, and soothing ambient music.",
    a_id:
      "Anda tidak perlu menyiapkan apa pun! Terapis Serena Raga membawa seluruh perlengkapan lengkap: matras busa empuk portabel, sprei & handuk higienis bersegel, minyak aromaterapi organik, hingga musik relaksasi.",
  },
  {
    q_en: "What massage styles do you offer?",
    q_id: "Layanan dan teknik pijat apa saja yang tersedia?",
    a_en:
      "We specialize in Traditional Balinese Massage, Deep Tissue Acupressure, Aromatherapy Relaxation, Royal Body Scrub & Lulur, Foot Reflexology, and gentle Prenatal Massage.",
    a_id:
      "Kami menyediakan Pijat Tradisional Bali, Deep Tissue & Totok Akupresur, Relaksasi Aromaterapi, Lulur & Body Scrub Keraton, Refleksi Kaki, serta Pijat Lembut Ibu Hamil (Prenatal).",
  },
  {
    q_en: "Is tipping expected?",
    q_id: "Apakah ada kewajiban memberikan tip kepada terapis?",
    a_en:
      "Tipping is completely optional and at your discretion. All our package prices are transparent and all-inclusive with zero hidden travel fees.",
    a_id:
      "Pemberian tip bersifat sepenuhnya sukarela dan tidak wajib. Seluruh tarif layanan yang tercantum sudah bersifat all-inclusive tanpa biaya tersembunyi.",
  },
  {
    q_en: "Are your therapists certified and vetted?",
    q_id: "Apakah terapis Serena Raga wanita dan bersertifikasi?",
    a_en:
      "Yes, 100% of our therapists are certified female practitioners who undergo strict background screening, health checks, and standardized spa hospitality training.",
    a_id:
      "Ya, 100% terapis kami adalah wanita profesional yang telah melalui verifikasi identitas ketat, uji kesehatan, serta sertifikasi keahlian terstandar hotel bintang lima.",
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

  // Theme mode: "light" | "dark" | "system"
  const [theme, setTheme] = React.useState<"light" | "dark" | "system">("light");

  // Booking simulation state
  const [selectedService, setSelectedService] = React.useState<string>("Traditional Balinese Massage");
  const [selectedDuration, setSelectedDuration] = React.useState<string>("90");
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = React.useState<string>("15:00");
  const [datePickerOpen, setDatePickerOpen] = React.useState(false);
  const [invoiceLookupNumber, setInvoiceLookupNumber] = React.useState("");

  // Synchronize theme with document element
  React.useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      let effectiveDark = false;
      if (theme === "dark") {
        effectiveDark = true;
      } else if (theme === "system") {
        effectiveDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      }

      if (effectiveDark) {
        root.classList.remove("light");
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
        root.classList.add("light");
      }
    }
  }, [theme]);

  // Fetch real services from Supabase if available
  React.useEffect(() => {
    async function loadData() {
      try {
        const { data: svcData } = await supabase
          .from("services")
          .select("*")
          .order("id", { ascending: true });

        if (svcData && svcData.length > 0) {
          const mapped = svcData.map((s: any, idx: number) => ({
            id: s.id,
            name: s.name,
            name_id: s.name,
            category: s.category || "Full Body Massage",
            category_id: s.category || "Pijat Seluruh Tubuh",
            duration_minutes: s.duration_minutes || 90,
            price: Number(s.price) || 185000,
            description: s.description || DEFAULT_SERVICES[idx % DEFAULT_SERVICES.length].description,
            description_en: s.description || DEFAULT_SERVICES[idx % DEFAULT_SERVICES.length].description_en,
            highlight: idx === 0 ? "Favorit Pelanggan" : idx === 1 ? "Sensasi Mewah" : "Rekomendasi",
            highlight_en: idx === 0 ? "Most Popular" : idx === 1 ? "Signature Ritual" : "Recommended",
            benefits: DEFAULT_SERVICES[idx % DEFAULT_SERVICES.length].benefits,
            benefits_en: DEFAULT_SERVICES[idx % DEFAULT_SERVICES.length].benefits_en,
          }));
          setServices(mapped);
          if (mapped.length > 0) {
            setSelectedService(mapped[0].name);
          }
        }
      } catch (err) {
        // Fallback to DEFAULT_SERVICES
      }
    }

    loadData();
  }, []);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formattedSelectedDate = React.useMemo(() => {
    if (!selectedDate) return isEn ? "Select Date" : "Pilih Tanggal";
    return selectedDate.toLocaleDateString(isEn ? "en-US" : "id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [selectedDate, isEn]);

  // Direct WhatsApp booking action
  const handleQuickBook = (customServiceName?: string) => {
    const targetService = customServiceName || selectedService;
    const dateStr = selectedDate
      ? selectedDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
      : "Hari ini";

    const message = isEn
      ? `Hello ${settings.brand_name || "Serena Raga"}, I would like to book a home massage session:\n\n✨ Treatment: *${targetService}*\n📅 Date: *${dateStr}*\n⏰ Preferred Time: *${selectedTimeSlot} WIB*\n\nPlease let me know therapist availability and confirmation. Thank you!`
      : `Halo CS ${settings.brand_name || "Serena Raga"}, saya ingin memesan layanan pijat ke rumah:\n\n✨ Layanan: *${targetService}*\n📅 Tanggal: *${dateStr}*\n⏰ Jam: *${selectedTimeSlot} WIB*\n\nMohon info ketersediaan terapis dan konfirmasi pesanannya. Terima kasih!`;

    const cleanNumber = cleanWhatsAppNumber(settings.whatsapp_number);
    const url = cleanNumber
      ? `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`
      : `https://wa.me/6281234567890?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");
  };

  const handleInvoiceLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceLookupNumber.trim()) {
      toast.error(isEn ? "Please enter an invoice number" : "Masukkan nomor invoice");
      return;
    }
    const cleanInv = invoiceLookupNumber.trim().replace(/^#/, "");
    window.location.href = `/invoice/${cleanInv}`;
  };

  const [newsletterEmail, setNewsletterEmail] = React.useState("");
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) {
      toast.error(isEn ? "Please enter your email" : "Masukkan alamat email Anda");
      return;
    }
    toast.success(isEn ? "Thank you for subscribing to Serena Raga newsletter!" : "Terima kasih telah berlangganan newsletter Serena Raga!");
    setNewsletterEmail("");
  };

  const [promoVisible, setPromoVisible] = React.useState(true);
  const [activeBenefitIndex, setActiveBenefitIndex] = React.useState(0);

  const benefitsData = [
    {
      num: "01",
      titleEn: "No Travel Hassle – Pure Relaxation",
      titleId: "Tanpa Repot Keluar Rumah – Relaksasi Murni",
      descEn:
        "Forget about commuting through the city or waiting in a salon. Our professional therapists arrive at your location, allowing you to fully relax before, during, and after your massage.",
      descId:
        "Lupakan macetnya perjalanan atau antrean di salon. Terapis profesional kami hadir langsung di lokasi Anda, memungkinkan Anda bersantai seutuhnya sebelum, saat, dan sesudah sesi pijat.",
      image:
        "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=1200",
      alt: "Woman enjoying deeply soothing facial and temple massage",
    },
    {
      num: "02",
      titleEn: "100% Certified & Vetted Therapists",
      titleId: "Terapis Wanita Bersertifikasi & Terlatih",
      descEn:
        "Every therapist on our team is meticulously screened, certified in authentic techniques, and trained in five-star hospitality etiquette to ensure complete peace of mind.",
      descId:
        "Setiap terapis melalui seleksi ketat, menguasai teknik pemijatan tradisional bersertifikat, dan terlatih dalam etika pelayanan ramah bintang lima demi ketenangan Anda.",
      image:
        "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&q=80&w=1200",
      alt: "Professional therapist performing gentle stretching massage ritual",
    },
    {
      num: "03",
      titleEn: "Pure Organic Aromatherapy & Sterile Equipment",
      titleId: "Minyak Organik Alami & Peralatan Steril",
      descEn:
        "We use only 100% pure organic essential oils, therapeutic balms, and individually sealed sterilized linens so you receive a luxurious, hygienic sanctuary experience.",
      descId:
        "Kami hanya menggunakan minyak aromaterapi murni organik, balsem herbal terapeutik, dan handuk steril tersegel higienis untuk kenyamanan dan kesehatan tubuh Anda.",
      image:
        "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&q=80&w=1200",
      alt: "Aromatherapy oils and warm ambient spa setup",
    },
    {
      num: "04",
      titleEn: "Tailored Treatments for Your Exact Needs",
      titleId: "Paket Fleksibel Sesuai Kebutuhan Tubuh",
      descEn:
        "Whether you need deep tissue recovery after a long workout, jet lag relief after travel, or gentle stress relief, our treatments are customized specifically for your wellness.",
      descId:
        "Apakah Anda membutuhkan pemulihan otot lelah setelah seharian beraktivitas, redakan jet lag, atau relaksasi santai, tekanan dan fokus pijatan disesuaikan penuh dengan kenyamanan Anda.",
      image:
        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=1200",
      alt: "Personalized spa wellness treatment and preparation linens",
    },
  ];

  const nextBenefit = () => {
    setActiveBenefitIndex((prev) => (prev + 1) % benefitsData.length);
  };
  const prevBenefit = () => {
    setActiveBenefitIndex((prev) => (prev - 1 + benefitsData.length) % benefitsData.length);
  };

  const currentBenefit = benefitsData[activeBenefitIndex];

  // Testimonials Carousel & FAQ accordion state
  const [activeTestimonialIndex, setActiveTestimonialIndex] = React.useState(0);
  const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(0);

  const nextTestimonial = () => {
    setActiveTestimonialIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  };
  const prevTestimonial = () => {
    setActiveTestimonialIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };
  const currentTestimonial = TESTIMONIALS[activeTestimonialIndex];
  const currentServiceObj = services.find((s) => s.name === selectedService) || services[0];
  const currentPriceFormatted = currentServiceObj ? formatRupiah(currentServiceObj.price) : "Rp 185.000";

  return (
    <div className="min-h-screen bg-[#241c17] text-stone-100 font-sans antialiased selection:bg-[#8b5e3c]/30 selection:text-amber-200">
      {/* 1. TOP PROMO NOTIFICATION BAR (Matching Reference Clean Gold Banner) */}
      {promoVisible && (
        <div className="w-full bg-[#eed7a1] text-[#241c17] px-4 py-2 sm:py-2.5 text-xs sm:text-[13px] font-medium tracking-wide text-center">
          <span>
            {isEn
              ? "10% Discount on all Credit Cards"
              : "Diskon 10% untuk Semua Kartu Kredit"}
          </span>
        </div>
      )}

      {/* 2. TOP NAVBAR — seamless dark espresso, Menu | Logo | Reservation */}
      <header className="sticky top-0 z-50 w-full bg-[#241c17]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-20 sm:h-24 flex items-center justify-between">

          {/* Left: Hamburger + "Menu" label — plain, seamless, matches reference */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger
              render={
                <button
                  type="button"
                  className="flex items-center gap-2.5 text-stone-200 hover:text-white transition-colors cursor-pointer"
                />
              }
            >
              {/* Classic hamburger: 3 clean lines */}
              <span className="flex flex-col justify-center gap-[4.5px] w-[18px]">
                <span className="h-[1.5px] w-full bg-current rounded-full" />
                <span className="h-[1.5px] w-full bg-current rounded-full" />
                <span className="h-[1.5px] w-full bg-current rounded-full" />
              </span>
              <span className="text-sm font-normal tracking-wide text-stone-200">
                Menu
              </span>
            </SheetTrigger>

            {/* Drawer panel */}
            <SheetContent side="left" className="bg-[#241c17] border-stone-800 text-stone-100 p-7 w-80 flex flex-col justify-between">
              <div>
                <SheetHeader className="text-left pb-5 border-b border-stone-800/80 mb-2">
                  <SheetTitle className="text-stone-100">
                    <BrandLogo variant="full" forceWhite className="h-7 w-auto" />
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 py-5">
                  {([
                    { href: "#about", label: isEn ? "Experience" : "Pengalaman" },
                    { href: "#steps", label: isEn ? "How it Works" : "Cara Pemesanan" },
                    { href: "#services", label: isEn ? "Services & Pricing" : "Layanan & Tarif" },
                    { href: "#benefits", label: isEn ? "Benefits" : "Keunggulan" },
                    { href: "#testimonials", label: isEn ? "Reviews" : "Ulasan" },
                    { href: "#faq", label: "FAQ" },
                  ] as { href: string; label: string }[]).map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-sm text-stone-300 hover:text-amber-300 py-2.5 px-1 border-b border-stone-800/40 transition-colors"
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
              </div>

              {/* Bottom drawer footer: WhatsApp CTA + Language & Theme */}
              <div className="pt-5 space-y-4 border-t border-stone-800/80">
                <Button
                  onClick={() => { setMobileMenuOpen(false); handleQuickBook(); }}
                  className="w-full bg-[#8b5e3c] hover:bg-[#785033] text-white text-sm"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {isEn ? "Book via WhatsApp" : "Pesan via WhatsApp"}
                </Button>

                {/* Language & Theme switches inside Menu */}
                <div className="flex items-center justify-between text-xs text-stone-400 pt-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-stone-400" />
                    <button
                      type="button"
                      onClick={() => setLocale("en")}
                      className={cn("px-2 py-1 rounded transition-colors cursor-pointer", locale === "en" ? "bg-[#382b23] text-amber-200 font-semibold" : "text-stone-400 hover:text-white")}
                    >
                      EN
                    </button>
                    <span>/</span>
                    <button
                      type="button"
                      onClick={() => setLocale("id")}
                      className={cn("px-2 py-1 rounded transition-colors cursor-pointer", locale === "id" ? "bg-[#382b23] text-amber-200 font-semibold" : "text-stone-400 hover:text-white")}
                    >
                      ID
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 bg-[#1b1511] p-1 rounded-md border border-stone-800/60">
                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      className={cn("p-1.5 rounded transition-colors cursor-pointer", theme === "light" ? "bg-[#382b23] text-amber-300" : "text-stone-500 hover:text-stone-300")}
                      title="Light Mode"
                    >
                      <Sun className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme("dark")}
                      className={cn("p-1.5 rounded transition-colors cursor-pointer", theme === "dark" ? "bg-[#382b23] text-amber-300" : "text-stone-500 hover:text-stone-300")}
                      title="Dark Mode"
                    >
                      <Moon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Center: Brand Logo — pure white */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <Link href="/" className="inline-flex items-center hover:opacity-85 transition-opacity">
              <BrandLogo variant="full" forceWhite className="h-8 sm:h-10 w-auto" />
            </Link>
          </div>

          {/* Right: Reservation CTA — dark espresso rounded box, cream text, ↗ */}
          <div className="flex items-center">
            <Button
              onClick={() => handleQuickBook()}
              size="sm"
              className="h-10 px-5 sm:px-6 text-xs sm:text-sm font-normal bg-[#382b23] hover:bg-[#46362c] text-stone-200 hover:text-white border-0 rounded-lg shadow-none transition-all flex items-center gap-2 tracking-wide cursor-pointer"
            >
              <span>{isEn ? "Reservation" : "Reservasi"}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-stone-300" />
            </Button>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION (DARK ESPRESSO WITH GALLIENT LUXURY SERIF) */}
      <section className="relative pt-10 sm:pt-14 pb-14 sm:pb-20 bg-[#241c17] text-center overflow-visible">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Luxury Serif Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl text-stone-100 max-w-4xl mx-auto leading-[1.12] mb-4" style={{ fontFamily: 'var(--font-gallient), Georgia, serif', fontWeight: 400 }}>
            {isEn ? (
              <>
                Traditional massage at Home <br />
                or Hotel in Your City
              </>
            ) : (
              <>
                Pijat Tradisional di Rumah <br />
                atau Hotel Pilihan Anda
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-stone-300 font-light tracking-wide max-w-2xl mx-auto mb-16 sm:mb-24">
            {isEn
              ? "Escape the Ordinary. Indulge in Ultimate Relaxation, Anytime, Anywhere."
              : "Lepaskan Kepenatan. Nikmati Relaksasi Mewah Kapan Saja, di Mana Saja."}
          </p>

          {/* 4. FLOATING ONLINE BOOKING WIDGET (Overlapping seamlessly between Hero and Photo Gallery) */}
          <div className="relative max-w-4xl mx-auto text-left z-30 px-2 sm:px-0 -mb-[70px] sm:-mb-[96px]">
            {/* Top Bar: Online Booking Tab */}
            <div className="inline-block bg-[#8e6851] text-stone-100 text-xs font-medium px-4 sm:px-5 py-2 tracking-wider">
              {isEn ? "Online Booking" : "Pemesanan Online"}
            </div>

            {/* Main Booking Row */}
            <div className="bg-white text-stone-900 shadow-2xl flex flex-col md:flex-row items-stretch overflow-hidden">
              {/* Col 1: Service */}
              <div className="flex-1 p-3.5 sm:p-4 border-b md:border-b-0 md:border-r border-stone-200">
                <span className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold block mb-0.5">
                  {isEn ? "Service" : "Layanan"}
                </span>
                <Select value={selectedService} onValueChange={(val) => { if (val) setSelectedService(val); }}>
                  <SelectTrigger className="w-full bg-transparent border-0 p-0 h-auto text-xs sm:text-sm font-semibold text-stone-900 focus:ring-0 shadow-none">
                    <SelectValue placeholder={isEn ? "Select Treatment" : "Pilih Layanan"} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-stone-200 text-stone-900">
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.name} className="text-xs">
                        {isEn ? s.name : s.name_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Col 2: Time / Duration */}
              <div className="w-full md:w-36 p-3.5 sm:p-4 border-b md:border-b-0 md:border-r border-stone-200">
                <span className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold block mb-0.5">
                  {isEn ? "Time" : "Durasi"}
                </span>
                <Select value={selectedDuration} onValueChange={(val) => { if (val) setSelectedDuration(val); }}>
                  <SelectTrigger className="w-full bg-transparent border-0 p-0 h-auto text-xs sm:text-sm font-semibold text-stone-900 focus:ring-0 shadow-none">
                    <SelectValue placeholder="90 Minute" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-stone-200 text-stone-900">
                    <SelectItem value="60" className="text-xs">{isEn ? "60 Minute" : "60 Menit"}</SelectItem>
                    <SelectItem value="90" className="text-xs">{isEn ? "90 Minute" : "90 Menit"}</SelectItem>
                    <SelectItem value="120" className="text-xs">{isEn ? "120 Minute" : "120 Menit"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Col 3: Price / Currency (IDR) */}
              <div className="w-full md:w-44 p-3.5 sm:p-4 border-b md:border-b-0 md:border-r border-stone-200 flex flex-col justify-center">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold block mb-0.5">
                    {isEn ? "IDR" : "Tarif"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-stone-900 font-mono">
                  {currentPriceFormatted}
                </div>
              </div>

              {/* Col 4: Book Now Button (Pale Golden Yellow) */}
              <div className="w-full md:w-44 flex items-stretch">
                <Button
                  onClick={() => handleQuickBook()}
                  className="w-full h-full min-h-[56px] bg-[#eed7a1] hover:bg-[#e4cb91] text-[#241c17] font-semibold text-xs sm:text-sm tracking-wide rounded-none transition-colors flex items-center justify-center shadow-none cursor-pointer border-0"
                >
                  <span>{isEn ? "Book Now" : "Pesan Sekarang"}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SEAMLESS 5-PHOTO GALLERY (ZERO GAP, FULL BLEED) */}
      <section className="relative z-10 w-full overflow-hidden bg-[#241c17]">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-0 w-full">
          {/* Photo 1: Towel / Setup Preparation */}
          <div className="relative h-64 sm:h-80 md:h-[400px] lg:h-[440px] overflow-hidden bg-stone-900">
            <img
              src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=600"
              alt="Therapist preparing fresh linens and towels"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Photo 2: Living Room / Bedroom Sanctuary */}
          <div className="relative h-64 sm:h-80 md:h-[400px] lg:h-[440px] overflow-hidden bg-stone-900">
            <img
              src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=600"
              alt="Cozy ambient spa sanctuary at home"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Photo 3: Welcoming Client */}
          <div className="relative h-64 sm:h-80 md:h-[400px] lg:h-[440px] overflow-hidden bg-stone-900">
            <img
              src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=600"
              alt="Welcoming client for gentle spa experience"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Photo 4: Aromatherapy Oil Massage Close-up */}
          <div className="relative h-64 sm:h-80 md:h-[400px] lg:h-[440px] overflow-hidden bg-stone-900">
            <img
              src="https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&q=80&w=600"
              alt="Relaxing body massage with organic oils"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Photo 5: Traditional Assisted Stretching Massage */}
          <div className="relative h-64 sm:h-80 md:h-[400px] lg:h-[440px] overflow-hidden bg-stone-900 col-span-2 sm:col-span-1 md:col-span-1">
            <img
              src="https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&q=80&w=600"
              alt="Traditional stretching and acupressure ritual"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      </section>

      {/* 3. PHILOSOPHY & NARRATIVE SECTION ("The Philosophy - Ketenangan di Setiap Sentuhan") */}
      <section id="about" className="py-16 sm:py-24 bg-[#241c17] relative overflow-hidden border-t border-stone-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="w-full flex flex-col lg:flex-row items-stretch relative">
            {/* Left Column: Heading in Gallient Font + Philosophy Intro */}
            <div className="w-full lg:w-[46%] flex flex-col justify-center pr-0 lg:pr-8 py-8 lg:py-16 z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-[1.5px] bg-[#8b5e3c]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d49b6a]">
                  {isEn ? "THE PHILOSOPHY" : "THE PHILOSOPHY"}
                </span>
              </div>
              <h2
                className="text-4xl sm:text-5xl lg:text-6xl text-stone-100 leading-[1.12] tracking-tight mb-4"
                style={{ fontFamily: "var(--font-gallient), Georgia, serif", fontWeight: 400 }}
              >
                {isEn ? (
                  <>
                    Serenity in <br />
                    Every <br />
                    <span className="italic text-[#ecd9a8]">Touch</span>
                  </>
                ) : (
                  <>
                    Ketenangan di <br />
                    Setiap <br />
                    <span className="italic text-[#ecd9a8]">Sentuhan</span>
                  </>
                )}
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 font-light leading-relaxed max-w-sm">
                {isEn
                  ? "SerenaRaga was born from the desire to rekindle harmony between body and soul. We believe that true self-care is best experienced in the space where you feel most at ease—your home."
                  : "SerenaRaga terlahir dari keinginan untuk menghidupkan kembali harmoni antara tubuh dan jiwa. Kami percaya bahwa perawatan diri terbaik adalah yang dilakukan dalam ruang privat yang paling nyaman bagi Anda—rumah sendiri."}
              </p>
            </div>

            {/* Floating Mocha Card + Reservation Button (Overlapping center on desktop) */}
            <div className="lg:absolute lg:left-[35%] xl:left-[36%] lg:top-1/2 lg:-translate-y-1/2 lg:w-[470px] xl:w-[500px] z-20 my-6 lg:my-0">
              {/* Mocha narrative box */}
              <div className="bg-[#967259] p-7 sm:p-8 text-stone-100 shadow-2xl space-y-5">
                {/* Seren Section */}
                <div className="space-y-1.5 pb-4 border-b border-white/15">
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-serif font-bold text-[#ecd9a8]">Seren</span>
                    <span className="text-[10px] uppercase tracking-widest text-stone-200/80 font-medium">
                      {isEn ? "THE ART OF RESTING" : "THE ART OF RESTING"}
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] leading-relaxed font-light text-stone-100">
                    {isEn
                      ? "Seren (in Javanese) signifies rest. True rest begins at home. We bring tranquility and harmonic massage directly to your most sacred space, without stepping outside."
                      : "Seren (dalam bahasa Jawa) memiliki arti istirahat. Istirahat sejati bermula dari rumah. Kami membawa ketenangan dan keharmonisan massage langsung ke ruang paling sakral bagi Anda, tanpa perlu melangkah keluar."}
                  </p>
                </div>

                {/* Raga Section */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-serif font-bold text-[#ecd9a8]">Raga</span>
                    <span className="text-[10px] uppercase tracking-widest text-stone-200/80 font-medium">
                      {isEn ? "BODY RESTORATION" : "BODY RESTORATION"}
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] leading-relaxed font-light text-stone-100">
                    {isEn
                      ? "Your body is the home of your life. Through certified professional therapists who understand every fatigue, we restore complete physical and mental harmony."
                      : "Tubuh adalah rumah bagi hidup Anda. Dengan sentuhan terapis profesional yang memahami setiap lelah, kami memulihkan harmoni fisik secara menyeluruh."}
                  </p>
                </div>
              </div>

              {/* Bottom-left attached white Reservation button */}
              <div className="inline-flex">
                <Button
                  onClick={() => handleQuickBook()}
                  className="bg-white hover:bg-stone-100 text-stone-900 px-6 py-5 rounded-none text-xs sm:text-sm font-medium flex items-center gap-3 cursor-pointer shadow-xl border-0 transition-colors"
                >
                  <span>{isEn ? "Reservation" : "Reservasi"}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Right Column: Spa Image with Orchid and Carousel Arrows */}
            <div className="w-full lg:w-[54%] relative min-h-[380px] sm:min-h-[480px] lg:min-h-[560px] bg-stone-900 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=1400"
                alt="Client with orchid enjoying tranquil head and temple spa massage"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/10" />

              {/* Bottom-Right Slider Arrows */}
              <div className="absolute bottom-6 right-6 flex items-center gap-2 z-10">
                <button
                  type="button"
                  className="w-9 h-9 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Previous"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="w-9 h-9 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Next"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SEAMLESS & HASSLE-FREE BOOKING STEPS */}
      <section id="steps" className="py-16 sm:py-24 bg-white text-stone-900 relative overflow-hidden border-t border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          
          {/* Main Layout Container with Integrated Candle Visual on Right */}
          <div className="relative">
            {/* Right Candle Image Background (Tall vertical block covering top-right and extending behind Step 3 & Step 4) */}
            <div className="hidden lg:block absolute right-0 top-0 w-[49%] h-full min-h-[580px] z-0 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&q=80&w=1200"
                alt="Glowing candles with herbal spa ambiance"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/10" />
            </div>

            {/* Top Row: Left Heading + Subtitle */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-10 sm:mb-14 relative z-10">
              {/* Left Column: Heading and Subtitle */}
              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs sm:text-sm text-stone-500 font-normal tracking-wide block">
                  {isEn ? "Booking Process" : "Proses Pemesanan"}
                </span>
                <h2
                  className="text-4xl sm:text-5xl lg:text-6xl text-stone-900 leading-[1.08] tracking-tight"
                  style={{ fontFamily: "var(--font-gallient), Georgia, serif", fontWeight: 400 }}
                >
                  {isEn ? (
                    <>
                      Booking Seamless <br />
                      & Hassle-Free
                    </>
                  ) : (
                    <>
                      Pemesanan Mudah <br />
                      & Tanpa Repot
                    </>
                  )}
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 font-light leading-relaxed max-w-md pt-1">
                  {isEn
                    ? "Imagine unwinding after a long day with a world-class Thai massage—without stepping outside. Whether you're in a luxury hotel, your private residence."
                    : "Bayangkan melepas lelah setelah hari yang panjang dengan pijatan berkualitas dunia—tanpa perlu melangkah keluar. Baik Anda berada di hotel mewah, apartemen, atau rumah pribadi."}
                </p>
              </div>

              {/* Mobile Right Candle Image Preview */}
              <div className="lg:col-span-6 h-48 sm:h-64 rounded-none overflow-hidden block lg:hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&q=80&w=1000"
                  alt="Glowing candles with herbal spa ambiance"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* 4 Cards Grid: Cards 1 & 2 on white canvas, Cards 3 & 4 overlapping on top of Candle image */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 relative z-10">
              {/* Step 1 */}
              <div className="bg-[#ede4dc] p-6 sm:p-7 flex flex-col justify-between shadow-sm min-h-[340px]">
                <div>
                  <div className="self-start inline-block bg-[#3c2e25] text-stone-200 text-[11px] font-medium px-3.5 py-1 mb-5">
                    Step 1
                  </div>
                  <h3 className="text-xl sm:text-[22px] font-medium text-stone-900 tracking-tight leading-snug mb-3">
                    {isEn ? "Reserve Online" : "Pesan Online"}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-stone-600 leading-relaxed font-light">
                    {isEn
                      ? "Book your Thai massage effortlessly through our website. Choose a time that suits your schedule and enter your location details."
                      : "Pesan layanan massage dengan mudah melalui website kami. Pilih waktu yang sesuai dengan jadwal Anda dan tentukan detail lokasi penjemputan."}
                  </p>
                </div>
                <div className="pt-6 mt-4 border-t border-stone-300/60">
                  <button
                    type="button"
                    onClick={() => handleQuickBook()}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-medium text-stone-900 hover:text-[#8b5e3c] transition-colors cursor-pointer"
                  >
                    <span>{isEn ? "Reservation" : "Reservasi"}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-[#ede4dc] p-6 sm:p-7 flex flex-col justify-between shadow-sm min-h-[340px]">
                <div>
                  <div className="self-start inline-block bg-[#3c2e25] text-stone-200 text-[11px] font-medium px-3.5 py-1 mb-5">
                    Step 2
                  </div>
                  <h3 className="text-xl sm:text-[22px] font-medium text-stone-900 tracking-tight leading-snug mb-3">
                    {isEn ? "Receive Confirmation" : "Konfirmasi Instan"}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-stone-600 leading-relaxed font-light">
                    {isEn
                      ? "Our team will promptly confirm your booking and assign a highly skilled therapist for your session."
                      : "Tim kami akan segera mengonfirmasi pesanan Anda dan menugaskan terapis profesional berlisensi terbaik untuk sesi Anda."}
                  </p>
                </div>
                <div className="pt-6 mt-4 border-t border-stone-300/60">
                  <button
                    type="button"
                    onClick={() => handleQuickBook()}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-medium text-stone-900 hover:text-[#8b5e3c] transition-colors cursor-pointer"
                  >
                    <span>{isEn ? "Reservation" : "Reservasi"}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-[#ede4dc] p-6 sm:p-7 flex flex-col justify-between shadow-sm min-h-[340px]">
                <div>
                  <div className="self-start inline-block bg-[#3c2e25] text-stone-200 text-[11px] font-medium px-3.5 py-1 mb-5">
                    Step 3
                  </div>
                  <h3 className="text-xl sm:text-[22px] font-medium text-stone-900 tracking-tight leading-snug mb-3">
                    {isEn ? "Wait for Your Therapist" : "Terapis Tiba di Lokasi"}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-stone-600 leading-relaxed font-light">
                    {isEn
                      ? "Relax and prepare for your session. Our professional masseuse will arrive at your doorstep on time, bringing everything needed for your massage."
                      : "Bersantailah dan bersiap menikmati sesi relaksasi. Terapis kami tiba tepat waktu di depan pintu Anda lengkap dengan seluruh perlengkapan higienis."}
                  </p>
                </div>
                <div className="pt-6 mt-4 border-t border-stone-300/60">
                  <button
                    type="button"
                    onClick={() => handleQuickBook()}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-medium text-stone-900 hover:text-[#8b5e3c] transition-colors cursor-pointer"
                  >
                    <span>{isEn ? "Reservation" : "Reservasi"}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-[#ede4dc] p-6 sm:p-7 flex flex-col justify-between shadow-sm min-h-[340px]">
                <div>
                  <div className="self-start inline-block bg-[#3c2e25] text-stone-200 text-[11px] font-medium px-3.5 py-1 mb-5">
                    Step 4
                  </div>
                  <h3 className="text-xl sm:text-[22px] font-medium text-stone-900 tracking-tight leading-snug mb-3">
                    {isEn ? "Enjoy a Premium Thai Massage" : "Nikmati Pijatan Premium"}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-stone-600 leading-relaxed font-light">
                    {isEn
                      ? "Experience deep relaxation and rejuvenation from the comfort of your home or hotel room. Let go of stress and enjoy the ultimate indulgence."
                      : "Rasakan relaksasi mendalam dan pemulihan tubuh dari kenyamanan rumah atau kamar hotel Anda. Lepaskan kepenatan dan nikmati kemewahan sejati."}
                  </p>
                </div>
                <div className="pt-6 mt-4 border-t border-stone-300/60">
                  <button
                    type="button"
                    onClick={() => handleQuickBook()}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-medium text-stone-900 hover:text-[#8b5e3c] transition-colors cursor-pointer"
                  >
                    <span>{isEn ? "Reservation" : "Reservasi"}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. WHERE WE SERVE / RELAX, REJUVENATE, AND RECHARGE (EXACT MATCH REFERENCE) */}
      <section className="py-16 sm:py-24 bg-[#241c17] text-stone-100 relative overflow-hidden border-t border-stone-800/80">
        {/* Subtle Decorative Ambient Oval Ring in Background */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[780px] h-[600px] rounded-[100%] border border-stone-700/25 pointer-events-none hidden lg:block -rotate-12" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Top Section Header */}
          <div className="text-left mb-12 sm:mb-16">
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl text-stone-100 leading-[1.08] tracking-tight mb-4"
              style={{ fontFamily: "var(--font-gallient), Georgia, serif", fontWeight: 400 }}
            >
              {isEn ? (
                <>
                  Relax, Rejuvenate, and <br />
                  Recharge—Wherever you are
                </>
              ) : (
                <>
                  Lepaskan, Pulihkan, dan <br />
                  Segarkan Diri—Di Mana Saja
                </>
              )}
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 font-light tracking-wide max-w-xl">
              {isEn
                ? "Escape the Ordinary. Indulge in Ultimate Relaxation, Anytime, Anywhere."
                : "Lepaskan Kepenatan. Nikmati Relaksasi Mewah Kapan Saja, di Mana Saja."}
            </p>
          </div>

          {/* 3-Column Centerpiece Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left 2 Feature Blocks */}
            <div className="lg:col-span-4 space-y-10 sm:space-y-14">
              {/* Feature 1 */}
              <div className="space-y-3">
                <div className="text-stone-300">
                  <svg className="w-5 h-5 stroke-current fill-none stroke-[1.5]" viewBox="0 0 24 24">
                    <path d="M6 3h12l4 6-10 12L2 9z" />
                    <path d="M11 3v6l-5 12" />
                    <path d="M13 3v6l5 12" />
                    <path d="M2 9h20" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-normal text-stone-100 leading-snug tracking-tight">
                  {isEn ? "The Ultimate in Luxury & Convenience" : "Kemewahan & Kenyamanan Tertinggi"}
                </h3>
                <p className="text-xs sm:text-[13px] text-stone-400 leading-relaxed font-light">
                  {isEn
                    ? "Skip the trip to the salon—our professional therapists come to you, fully equipped with everything needed for a high-end Thai massage experience. Whether you're staying in a five-star hotel or simply want to elevate your home relaxation, we ensure a seamless and stress-free experience."
                    : "Tak perlu repot bepergian ke luar—terapis profesional kami datang langsung ke lokasi Anda, dilengkapi seluruh perlengkapan higienis untuk pengalaman spa mewah. Baik Anda berada di hotel bintang lima atau rumah pribadi, kami menjamin pengalaman yang lancar dan bebas repot."}
                </p>
              </div>

              {/* Feature 2 */}
              <div className="space-y-3">
                <div className="text-stone-300">
                  <svg className="w-5 h-5 stroke-current fill-none stroke-[1.5]" viewBox="0 0 24 24">
                    <path d="M6 3h12l4 6-10 12L2 9z" />
                    <path d="M11 3v6l-5 12" />
                    <path d="M13 3v6l5 12" />
                    <path d="M2 9h20" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-normal text-stone-100 leading-snug tracking-tight">
                  {isEn ? "Privacy, Comfort & Exclusivity" : "Privasi, Kenyamanan & Eksklusivitas"}
                </h3>
                <p className="text-xs sm:text-[13px] text-stone-400 leading-relaxed font-light">
                  {isEn
                    ? "Experience a luxury spa-quality massage without interruptions. Whether you prefer a soothing aromatherapy session in your hotel suite or a therapeutic deep-tissue massage in your private residence, we create a personalized ambiance for your comfort."
                    : "Nikmati pijatan kualitas spa mewah tanpa gangguan. Apakah Anda menginginkan sesi aromaterapi yang menenangkan di kamar hotel atau deep-tissue massage di hunian pribadi, kami menciptakan suasana khusus yang nyaman untuk Anda."}
                </p>
              </div>
            </div>

            {/* Center Visual Card with Gold Reservation CTA */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center">
              <div className="w-full max-w-[340px] shadow-2xl overflow-hidden bg-stone-900 border border-stone-800">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=800"
                    alt="Serena Raga luxury massage with orchid flower"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/10" />
                </div>
                <Button
                  onClick={() => handleQuickBook()}
                  className="w-full h-12 bg-[#eed7a1] hover:bg-[#e4cb91] text-[#241c17] font-medium text-xs sm:text-sm tracking-wide rounded-none shadow-none flex items-center justify-center gap-2 cursor-pointer transition-colors border-0"
                >
                  <span>{isEn ? "Reservation" : "Reservasi"}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Right 2 Feature Blocks */}
            <div className="lg:col-span-4 space-y-10 sm:space-y-14">
              {/* Feature 3 */}
              <div className="space-y-3">
                <div className="text-stone-300">
                  <svg className="w-5 h-5 stroke-current fill-none stroke-[1.5]" viewBox="0 0 24 24">
                    <path d="M6 3h12l4 6-10 12L2 9z" />
                    <path d="M11 3v6l-5 12" />
                    <path d="M13 3v6l5 12" />
                    <path d="M2 9h20" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-normal text-stone-100 leading-snug tracking-tight">
                  {isEn ? "Traditional Thai Massage by Certified Experts" : "Pijatan Tradisional oleh Terapis Tersertifikasi"}
                </h3>
                <p className="text-xs sm:text-[13px] text-stone-400 leading-relaxed font-light">
                  {isEn
                    ? "Our team consists of highly trained Thai professionals, specializing in traditional Thai massage, deep tissue therapy, oil massage, and aromatherapy. Each session is tailored to your body's needs, promoting deep relaxation, improved circulation, and complete rejuvenation."
                    : "Tim kami terdiri dari terapis profesional terlatih dan bersertifikat, ahli dalam pijat tradisional, terapi deep-tissue, oil massage, dan aromaterapi. Setiap sesi disesuaikan dengan kebutuhan tubuh Anda untuk melancarkan sirkulasi dan memulihkan vitalitas."}
                </p>
              </div>

              {/* Feature 4 */}
              <div className="space-y-3">
                <div className="text-stone-300">
                  <svg className="w-5 h-5 stroke-current fill-none stroke-[1.5]" viewBox="0 0 24 24">
                    <path d="M6 3h12l4 6-10 12L2 9z" />
                    <path d="M11 3v6l-5 12" />
                    <path d="M13 3v6l5 12" />
                    <path d="M2 9h20" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-normal text-stone-100 leading-snug tracking-tight">
                  {isEn ? "Perfect for Travelers & Busy Professionals" : "Sempurna untuk Eksekutif & Wisatawan"}
                </h3>
                <p className="text-xs sm:text-[13px] text-stone-400 leading-relaxed font-light">
                  {isEn
                    ? "Long flight? Intense work schedule? A professional Thai massage can help reduce jet lag, relieve tension, and restore balance—allowing you to make the most of your time in your city."
                    : "Penerbangan panjang atau jadwal kerja padat? Pijatan terapis kami membantu meredakan jet lag, melemaskan otot kaku, dan memulihkan keseimbangan energi Anda."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PRICING & BOOKING SECTION (COMPACT LUXURY LAYOUT MATCHING REFERENCE) */}
      <section id="services" className="py-12 sm:py-16 bg-[#241c17] border-t border-stone-800/80 text-stone-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Section Header */}
          <div className="mb-8 sm:mb-10">
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl text-stone-100 leading-[1.08] tracking-tight mb-3"
              style={{ fontFamily: "var(--font-gallient), Georgia, serif", fontWeight: 400 }}
            >
              {isEn ? "Pricing & Booking" : "Tarif & Pemesanan"}
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 font-light tracking-wide max-w-xl mx-auto">
              {isEn
                ? "Escape the Ordinary. Indulge in Ultimate Relaxation, Anytime, Anywhere."
                : "Lepaskan Kepenatan. Nikmati Relaksasi Mewah Kapan Saja, di Mana Saja."}
            </p>
          </div>

          {/* Center Light Stone Card */}
          <div className="bg-[#eae5df] text-stone-900 shadow-2xl p-6 sm:p-8 max-w-3xl mx-auto text-left">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 sm:gap-8 items-center">
              {/* Left Column: Price + Min Booking + Button */}
              <div className="sm:col-span-6 space-y-4">
                <div>
                  <div className="text-2xl sm:text-3xl font-semibold text-stone-900 font-sans tracking-tight">
                    {currentPriceFormatted}{" "}
                    <span className="text-xs sm:text-sm font-normal text-stone-600">
                      {isEn ? "/per hour" : "/sesi 60 menit"}
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-stone-700 font-light mt-1">
                    {isEn
                      ? "Minimum booking: 60 Minutes (All-Inclusive)"
                      : "Minimum pemesanan: 60 Menit (Tanpa Biaya Tambahan)"}
                  </p>
                </div>

                <Button
                  onClick={() => handleQuickBook()}
                  className="bg-[#241c17] hover:bg-[#382b23] text-stone-100 px-6 py-3 rounded-none text-xs sm:text-sm font-normal flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-none w-full sm:w-auto border-0"
                >
                  <span>{isEn ? "Reservation" : "Reservasi"}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Right Column: Availability & Service Area Note */}
              <div className="sm:col-span-6 border-t sm:border-t-0 sm:border-l border-stone-300 sm:pl-8 pt-4 sm:pt-0 space-y-2">
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-stone-900">
                    {isEn ? "Available 7 days a week" : "Buka Setiap Hari (7 Hari)"}
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-stone-800">
                    08:00 AM – 10:00 PM WIB
                  </div>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed font-light pt-1">
                  {isEn
                    ? "We provide massage services anywhere in your city, including hotels, private residences, and serviced apartments."
                    : "Kami melayani panggilan massage ke seluruh wilayah kota Anda, termasuk hotel berbintang, rumah tinggal, dan apartemen."}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Fast Contact Channels */}
          <div className="mt-8 sm:mt-10 max-w-3xl mx-auto text-left">
            <div className="text-[11px] sm:text-xs text-stone-400 font-light mb-3">
              {isEn ? "Easy Booking in Just Seconds" : "Pemesanan Mudah dalam Hitungan Detik"}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-1">
              {/* Channel 1: Call */}
              <div className="space-y-1">
                <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-medium">
                  {isEn ? "Call Us" : "Telepon"}
                </span>
                <a
                  href={`tel:${cleanWhatsAppNumber(settings.phone_number || "6281234567890")}`}
                  className="text-xs sm:text-sm text-stone-200 hover:text-white font-mono transition-colors block"
                >
                  {settings.phone_number || "+62 812-XXXX-XXXX"}
                </a>
              </div>

              {/* Channel 2: WhatsApp */}
              <div className="space-y-1 sm:border-l border-stone-800 sm:pl-6">
                <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-medium">
                  WhatsApp
                </span>
                <a
                  href={`https://wa.me/${cleanWhatsAppNumber(settings.whatsapp_number || "6281234567890")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm text-stone-200 hover:text-white font-mono transition-colors block"
                >
                  {settings.whatsapp_number || "+62 812-XXXX-XXXX"}
                </a>
              </div>

              {/* Channel 3: Online Booking */}
              <div className="space-y-1 sm:border-l border-stone-800 sm:pl-6">
                <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-medium">
                  {isEn ? "Online Booking" : "Reservasi Online"}
                </span>
                <button
                  type="button"
                  onClick={() => handleQuickBook()}
                  className="text-xs sm:text-sm text-stone-100 hover:text-amber-200 font-medium underline underline-offset-4 cursor-pointer transition-colors block"
                >
                  {isEn ? "Book Now" : "Pesan Sekarang"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. EXCLUSIVE BENEFITS SLIDER SECTION (WHITE BACKGROUND, TALL LUXURY LAYOUT) */}
      <section id="benefits" className="py-24 sm:py-32 lg:py-36 bg-white text-stone-900 border-t border-stone-200/80 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl text-stone-900 leading-[1.08] tracking-tight mb-4"
              style={{ fontFamily: "var(--font-gallient), Georgia, serif", fontWeight: 400 }}
            >
              {isEn ? (
                <>
                  Exclusive Benefits of Our <br />
                  Private Massage Service
                </>
              ) : (
                <>
                  Keunggulan Eksklusif Layanan <br />
                  Private Massage Kami
                </>
              )}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 font-light tracking-wide max-w-xl mx-auto">
              {isEn
                ? "Escape the Ordinary. Indulge in Ultimate Relaxation, Anytime, Anywhere."
                : "Lepaskan Kepenatan. Nikmati Relaksasi Mewah Kapan Saja, di Mana Saja."}
            </p>
          </div>

          {/* Interactive 2-Column Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Left Column: Number, Title, Description, Button, Carousel Arrows */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs sm:text-sm font-mono text-stone-400 font-medium block">
                  {currentBenefit.num}
                </span>

                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-normal text-stone-900 leading-tight tracking-tight">
                  {isEn ? currentBenefit.titleEn : currentBenefit.titleId}
                </h3>

                <p className="text-xs sm:text-[13px] text-stone-600 leading-relaxed font-light pt-1">
                  {isEn ? currentBenefit.descEn : currentBenefit.descId}
                </p>

                <div className="pt-3">
                  <Button
                    onClick={() => handleQuickBook()}
                    className="bg-[#967259] hover:bg-[#836048] text-stone-100 px-6 py-3 rounded-none text-xs sm:text-sm font-normal flex items-center gap-2 cursor-pointer transition-colors shadow-none border-0"
                  >
                    <span>{isEn ? "Reservation" : "Reservasi"}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Slider Arrows: positioned closer to the image on the right */}
              <div className="flex items-center justify-end gap-3 pt-6 sm:pt-8 pr-0 lg:pr-2">
                <button
                  type="button"
                  onClick={prevBenefit}
                  className="w-11 h-11 rounded-full bg-[#e8e4e0] hover:bg-[#ded8d2] text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
                  title="Previous Benefit"
                >
                  <ArrowLeft className="w-4 h-4 stroke-[1.5]" />
                </button>
                <button
                  type="button"
                  onClick={nextBenefit}
                  className="w-11 h-11 rounded-full bg-[#eed7a1] hover:bg-[#e4cb91] text-[#241c17] flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                  title="Next Benefit"
                >
                  <ArrowRight className="w-4 h-4 stroke-[1.5]" />
                </button>
              </div>
            </div>

            {/* Right Column: Hero Showcase Image with smooth change */}
            <div className="lg:col-span-7">
              <div className="relative aspect-[4/3] sm:aspect-[16/10] min-h-[260px] sm:min-h-[440px] lg:min-h-[520px] overflow-hidden shadow-2xl bg-stone-100">
                <img
                  key={activeBenefitIndex}
                  src={currentBenefit.image}
                  alt={currentBenefit.alt}
                  className="w-full h-full object-cover transition-opacity duration-500 animate-in fade-in"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. COMBINED CUSTOMER TESTIMONIALS & FAQ SECTION (DARK ESPRESSO BACKGROUND) */}
      <section id="testimonials" className="py-16 sm:py-28 lg:py-36 bg-[#241c17] text-stone-100 border-t border-stone-800/80 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-28 lg:space-y-36">
          
          {/* PART 1: CUSTOMER TESTIMONIALS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
            {/* Left: Large Photo (Assisted Stretch / Thai Massage) */}
            <div className="lg:col-span-6 relative">
              <div className="relative aspect-[4/3] sm:aspect-[1/1] lg:aspect-[4/5] min-h-[280px] sm:min-h-[440px] lg:min-h-[540px] overflow-hidden shadow-2xl bg-stone-900">
                <img
                  src={currentTestimonial.image}
                  alt="Therapist performing authentic relaxation massage"
                  className="w-full h-full object-cover transition-opacity duration-500 animate-in fade-in"
                />
              </div>
            </div>

            {/* Right: Testimonials Content */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-8 lg:pl-4">
              <div className="space-y-6">
                <h2
                  className="text-4xl sm:text-5xl lg:text-6xl text-stone-100 leading-[1.08] tracking-tight"
                  style={{ fontFamily: "var(--font-gallient), Georgia, serif", fontWeight: 400 }}
                >
                  {isEn ? (
                    <>
                      Customer Testimonials— <br />
                      What Our Clients Say
                    </>
                  ) : (
                    <>
                      Pengalaman Pelanggan— <br />
                      Kepuasan & Ulasan Nyata
                    </>
                  )}
                </h2>

                <p className="text-sm sm:text-base lg:text-lg text-stone-200 font-light leading-relaxed max-w-xl">
                  "{isEn ? currentTestimonial.text_en : currentTestimonial.text_id}"
                </p>

                <div className="space-y-0.5 pt-2">
                  <div className="text-base sm:text-lg font-semibold text-stone-100">
                    {currentTestimonial.name}
                  </div>
                  <div className="text-xs sm:text-sm text-stone-400 font-light">
                    {isEn ? currentTestimonial.role_en : currentTestimonial.role_id}
                  </div>
                </div>
              </div>

              {/* Navigation Arrows */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={prevTestimonial}
                  className="w-11 h-11 rounded-full bg-[#382b23] hover:bg-[#46362c] text-stone-300 flex items-center justify-center transition-colors cursor-pointer"
                  title="Previous Testimonial"
                >
                  <ArrowLeft className="w-4 h-4 stroke-[1.5]" />
                </button>
                <button
                  type="button"
                  onClick={nextTestimonial}
                  className="w-11 h-11 rounded-full bg-[#eed7a1] hover:bg-[#e4cb91] text-[#241c17] flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                  title="Next Testimonial"
                >
                  <ArrowRight className="w-4 h-4 stroke-[1.5]" />
                </button>
              </div>
            </div>
          </div>

          {/* PART 2: FREQUENTLY ASKED QUESTIONS (FAQS) */}
          <div id="faq" className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start pt-8 border-t border-stone-800/60">
            {/* Left: Heading & Accordion List */}
            <div className="lg:col-span-7 space-y-8">
              <div>
                <h2
                  className="text-4xl sm:text-5xl lg:text-6xl text-stone-100 leading-[1.08] tracking-tight mb-3"
                  style={{ fontFamily: "var(--font-gallient), Georgia, serif", fontWeight: 400 }}
                >
                  {isEn ? (
                    <>
                      Frequently Asked <br />
                      Questions (FAQs)
                    </>
                  ) : (
                    <>
                      Pertanyaan yang <br />
                      Sering Diajukan (FAQ)
                    </>
                  )}
                </h2>
                <p className="text-xs sm:text-sm text-stone-400 font-light tracking-wide max-w-xl">
                  {isEn
                    ? "Escape the Ordinary. Indulge in Ultimate Relaxation, Anytime, Anywhere."
                    : "Lepaskan Kepenatan. Nikmati Relaksasi Mewah Kapan Saja, di Mana Saja."}
                </p>
              </div>

              {/* Clean Luxury Accordion */}
              <div className="space-y-4 pt-2">
                {FAQ_ITEMS.map((item, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="border-b border-stone-800/80 pb-4 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between text-left py-2 gap-4 group cursor-pointer"
                      >
                        <span className="text-sm sm:text-base font-medium text-stone-100 group-hover:text-[#eed7a1] transition-colors">
                          {isEn ? item.q_en : item.q_id}
                        </span>
                        <span className="text-stone-400 shrink-0">
                          {isOpen ? (
                            <Minus className="w-4 h-4 text-stone-300" />
                          ) : (
                            <Plus className="w-4 h-4 text-stone-400 group-hover:text-stone-200" />
                          )}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="pt-2 pr-6 text-xs sm:text-[13px] text-stone-400 font-light leading-relaxed animate-in fade-in duration-300">
                          {isEn ? item.a_en : item.a_id}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Landscape Spa Oil Pouring Photo */}
            <div className="lg:col-span-5 pt-4 lg:pt-8">
              <div className="relative aspect-[16/10] overflow-hidden shadow-2xl bg-stone-900 border border-stone-800/80">
                <img
                  src="https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&q=80&w=1000"
                  alt="Therapist pouring aromatic massage oil on client"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 10. FINAL LUXURY BOOKING BANNER (COMPACT LUXURY GLASS CARD MATCHING REFERENCE) */}
      <section className="relative py-14 sm:py-20 lg:py-24 overflow-hidden bg-[#18120f] border-t border-stone-800 text-center">
        {/* Background Image with Dark Atmospheric Spa Warm Glow */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <img
            src="https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&q=80&w=1600"
            alt="Warm spa atmosphere with therapist and essential oils"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#18120f] via-[#18120f]/75 to-[#18120f]/90" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Framed Translucent Luxury Booking Card */}
          <div className="max-w-3xl mx-auto rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/15 backdrop-blur-md">
            {/* Top Gold Header Strip */}
            <div className="bg-[#eed7a1] text-[#241c17] py-2.5 sm:py-3 text-xs sm:text-[13px] font-medium tracking-wider uppercase text-center">
              {isEn ? "Reservation" : "Reservasi"}
            </div>

            {/* Card Content Body */}
            <div className="bg-stone-950/60 p-6 sm:p-10 text-stone-100 space-y-6 text-center">
              {/* Gallient Headline */}
              <h2
                className="text-3xl sm:text-4xl lg:text-5xl text-stone-100 leading-[1.12] tracking-tight"
                style={{ fontFamily: "var(--font-gallient), Georgia, serif", fontWeight: 400 }}
              >
                {isEn ? (
                  <>
                    Book your luxury <br />
                    thai massage now
                  </>
                ) : (
                  <>
                    Pesan relaksasi mewah <br />
                    pilihan Anda sekarang
                  </>
                )}
              </h2>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm text-stone-300 font-light tracking-wide max-w-lg mx-auto">
                {isEn
                  ? "Escape. Relax. Rejuvenate. Anytime, Anywhere in Your City."
                  : "Lepaskan Kepenatan. Nikmati Relaksasi Mewah Kapan Saja, di Mana Saja."}
              </p>

              {/* Mocha Fast Banner */}
              <div className="pt-1">
                <div className="bg-[#967259]/90 text-stone-100 py-2 px-6 rounded-none text-xs sm:text-[13px] font-normal inline-block max-w-md w-full sm:w-auto mx-auto shadow-sm">
                  {isEn ? "Easy Booking in Just Seconds" : "Pemesanan Mudah dalam Hitungan Detik"}
                </div>
              </div>

              {/* 3 Booking Channels Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-0 pt-2 items-center text-center">
                {/* Channel 1: Call Us */}
                <div className="space-y-1 pb-3 sm:pb-0 border-b sm:border-b-0 border-white/10">
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-medium">
                    {isEn ? "Call Us" : "Telepon"}
                  </span>
                  <a
                    href={`tel:${cleanWhatsAppNumber(settings.phone_number || "6281234567890")}`}
                    className="text-xs sm:text-sm text-stone-100 hover:text-amber-200 font-mono transition-colors block"
                  >
                    {settings.phone_number || "+62 812-XXXX-XXXX"}
                  </a>
                </div>

                {/* Channel 2: WhatsApp */}
                <div className="space-y-1 pb-3 sm:pb-0 border-b sm:border-b-0 sm:border-l border-white/15">
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-medium">
                    WhatsApp
                  </span>
                  <a
                    href={`https://wa.me/${cleanWhatsAppNumber(settings.whatsapp_number || "6281234567890")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm text-stone-100 hover:text-amber-200 font-mono transition-colors block"
                  >
                    {settings.whatsapp_number || "+62 812-XXXX-XXXX"}
                  </a>
                </div>

                {/* Channel 3: Online Booking */}
                <div className="space-y-1 sm:border-l border-white/15">
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-medium">
                    {isEn ? "Online Booking" : "Reservasi Online"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuickBook()}
                    className="text-xs sm:text-sm text-amber-200 hover:text-white font-medium underline underline-offset-4 cursor-pointer transition-colors block mx-auto"
                  >
                    {isEn ? "Book Now" : "Pesan Sekarang"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Footnote underneath the card */}
          <div className="pt-7 sm:pt-9 space-y-2 max-w-2xl mx-auto">
            <span className="text-xs sm:text-sm font-medium text-[#eed7a1] block">
              📍 {isEn ? "Serving All of Your City – Hotels, Private Residences & More" : "Melayani Seluruh Wilayah Kota – Hotel, Rumah Tinggal & Apartemen"}
            </span>
            <p className="text-xs sm:text-sm text-stone-300 font-light leading-relaxed">
              {isEn
                ? "Indulge in the finest Thai massage experience without leaving your space. Book now and transform your surroundings into a sanctuary of relaxation."
                : "Nikmati pengalaman pijat tradisional terbaik tanpa perlu meninggalkan kenyamanan ruangan Anda. Pesan sekarang dan ubah ruangan Anda menjadi tempat peristirahatan yang damai."}
            </p>
          </div>
        </div>
      </section>

      {/* 11. LUXURY EDITORIAL FOOTER (CLEAN WHITE MINIMALIST MATCHING REFERENCE) */}
      <footer className="bg-white text-stone-800 border-t border-stone-200 text-xs sm:text-[13px] pt-16 sm:pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Centered Brand & Contact Info */}
          <div className="flex flex-col items-center text-center space-y-4 max-w-md mx-auto mb-14 sm:mb-20">
            {/* Centered Brand Logo */}
            <Link href="/" className="inline-flex items-center hover:opacity-85 transition-opacity">
              <BrandLogo variant="full" className="h-9 sm:h-11 w-auto text-stone-900" />
            </Link>

            {/* Address */}
            <div className="flex items-center justify-center gap-2 text-stone-600 font-light text-xs sm:text-[13px] pt-2" suppressHydrationWarning>
              <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <span>{settings.service_areas || "Jakarta Selatan, DKI Jakarta, Indonesia"}</span>
            </div>

            {/* Phone */}
            <div className="flex items-center justify-center gap-2 text-stone-600 font-mono text-xs sm:text-[13px]" suppressHydrationWarning>
              <Phone className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <a
                href={`tel:${cleanWhatsAppNumber(settings.phone_number || "6281234567890")}`}
                className="hover:text-stone-900 transition-colors"
              >
                {settings.phone_number || "+62 812-XXXX-XXXX"}
              </a>
            </div>

            {/* Email */}
            <div className="flex items-center justify-center gap-2 text-stone-600 font-mono text-xs sm:text-[13px]" suppressHydrationWarning>
              <Mail className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <a
                href={`mailto:${settings.email || "info@serenaraga.com"}`}
                className="hover:text-stone-900 transition-colors"
              >
                {settings.email || "info@serenaraga.com"}
              </a>
            </div>
          </div>

          {/* Middle 4-Column Grid: Services, Company, Quick Links, Newsletter */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 pb-14 sm:pb-20 items-start">
            {/* Col 1: Service */}
            <div className="space-y-3">
              <span className="text-xs sm:text-sm font-semibold text-stone-900 block mb-1">
                {isEn ? "Service" : "Layanan"}
              </span>
              <ul className="space-y-2 text-stone-600 font-light text-xs sm:text-[13px]">
                <li>
                  <a href="#services" className="hover:text-stone-900 transition-colors">
                    {isEn ? "Massages" : "Pijat Tradisional"}
                  </a>
                </li>
                <li>
                  <a href="#benefits" className="hover:text-stone-900 transition-colors">
                    {isEn ? "Massage Gift Vouchers" : "Voucher Hadiah"}
                  </a>
                </li>
                <li>
                  <a href="#services" className="hover:text-stone-900 transition-colors">
                    {isEn ? "Pricelist" : "Daftar Tarif"}
                  </a>
                </li>
                <li>
                  <button onClick={() => handleQuickBook()} className="hover:text-stone-900 transition-colors text-left cursor-pointer">
                    {isEn ? "Online Booking" : "Reservasi Online"}
                  </button>
                </li>
                <li>
                  <a href="#about" className="hover:text-stone-900 transition-colors">
                    {isEn ? "Corporate Wellness" : "Layanan Korporasi"}
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 2: Company */}
            <div className="space-y-3">
              <span className="text-xs sm:text-sm font-semibold text-stone-900 block mb-1">
                {isEn ? "Company" : "Tentang"}
              </span>
              <ul className="space-y-2 text-stone-600 font-light text-xs sm:text-[13px]">
                <li>
                  <a href="#about" className="hover:text-stone-900 transition-colors">
                    {isEn ? "The Philosophy" : "Filosofi Kami"}
                  </a>
                </li>
                <li>
                  <a href="#steps" className="hover:text-stone-900 transition-colors">
                    {isEn ? "How it Works" : "Cara Pemesanan"}
                  </a>
                </li>
                <li>
                  <a href="#testimonials" className="hover:text-stone-900 transition-colors">
                    {isEn ? "Customer Reviews" : "Ulasan Pelanggan"}
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-stone-900 transition-colors">
                    {isEn ? "FAQ" : "Pusat Bantuan"}
                  </a>
                </li>
                <li>
                  <Link href="/admin" className="text-[#967259] hover:underline transition-colors">
                    {isEn ? "Admin Portal" : "Portal Dashboard"}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Quick Access */}
            <div className="space-y-3">
              <span className="text-xs sm:text-sm font-semibold text-stone-900 block mb-1">
                {isEn ? "Quick Access" : "Akses Cepat"}
              </span>
              <ul className="space-y-2 text-stone-600 font-light text-xs sm:text-[13px]">
                <li>
                  <button onClick={() => handleQuickBook()} className="hover:text-stone-900 transition-colors text-left cursor-pointer">
                    {isEn ? "Reservation" : "Reservasi Cepat"}
                  </button>
                </li>
                <li>
                  <a
                    href={`https://wa.me/${cleanWhatsAppNumber(settings.whatsapp_number || "6281234567890")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-stone-900 transition-colors"
                  >
                    {isEn ? "WhatsApp Support" : "Bantuan WhatsApp"}
                  </a>
                </li>
                <li>
                  <a href="#services" className="hover:text-stone-900 transition-colors">
                    {isEn ? "Pricing & Packages" : "Paket & Tarif"}
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-stone-900 transition-colors">
                    {isEn ? "Terms & Privacy" : "Syarat & Ketentuan"}
                  </a>
                </li>
                <li>
                  <a href="#about" className="hover:text-stone-900 transition-colors">
                    {isEn ? "Sanitary Standards" : "Standar Higienis"}
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Newsletter */}
            <div className="space-y-3 md:border-l md:border-stone-200 md:pl-8">
              <span className="text-sm sm:text-base font-semibold text-stone-900 block mb-1">
                Newsletter
              </span>
              <p className="text-xs text-stone-500 font-light leading-relaxed">
                {isEn
                  ? "Do not miss any interesting offers and new introductions"
                  : "Dapatkan penawaran eksklusif dan info paket relaksasi terbaru"}
              </p>

              <form onSubmit={handleNewsletterSubmit} className="pt-2 flex flex-col sm:flex-row items-stretch max-w-sm gap-2 sm:gap-0">
                <input
                  type="email"
                  placeholder={isEn ? "Enter email" : "Alamat email"}
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="bg-[#e5e5e5] text-stone-800 placeholder:text-stone-500 px-3.5 py-2.5 sm:py-2 text-xs outline-none focus:ring-1 focus:ring-stone-400 w-full rounded-none border-0"
                />
                <Button
                  type="submit"
                  className="bg-[#967259] hover:bg-[#836048] text-white px-5 py-2.5 sm:py-2 text-xs font-normal rounded-none shadow-none border-0 cursor-pointer shrink-0 transition-colors"
                >
                  {isEn ? "Subscribe" : "Langganan"}
                </Button>
              </form>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="pt-8 border-t border-stone-200/80 text-center text-xs text-stone-500 font-light" suppressHydrationWarning>
            Copyright {new Date().getFullYear()} {settings.brand_name ? settings.brand_name.toUpperCase() : "SERENA RAGA"}
          </div>
        </div>
      </footer>
    </div>
  );
}
