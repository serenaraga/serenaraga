"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { BrandLogo } from "@/components/brand-logo";
import { useBrandSettings, cleanWhatsAppNumber, formatDisplayPhone } from "@/lib/brand-settings";
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

const SacredLotusLogo = ({ className = "w-8 h-8 sm:w-9 sm:h-9" }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("shrink-0 text-[#2b2420]", className)}
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Geometric 8-petal sacred lotus bloom matching reference */}
    <ellipse cx="50" cy="28" rx="14" ry="22" />
    <ellipse cx="50" cy="72" rx="14" ry="22" />
    <ellipse cx="28" cy="50" rx="22" ry="14" />
    <ellipse cx="72" cy="50" rx="22" ry="14" />
    <ellipse cx="34.5" cy="34.5" rx="20" ry="12" transform="rotate(45 34.5 34.5)" />
    <ellipse cx="65.5" cy="65.5" rx="20" ry="12" transform="rotate(45 65.5 65.5)" />
    <ellipse cx="65.5" cy="34.5" rx="20" ry="12" transform="rotate(-45 65.5 34.5)" />
    <ellipse cx="34.5" cy="65.5" rx="20" ry="12" transform="rotate(-45 34.5 65.5)" />
    <circle cx="50" cy="50" r="3.5" fill="none" strokeWidth="2" />
  </svg>
);

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
      ? selectedDate.toLocaleDateString(isEn ? "en-US" : "id-ID", { day: "numeric", month: "long", year: "numeric" })
      : (isEn ? "Today" : "Hari ini");

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
      {/* 1. TOP PROMO NOTIFICATION BANNER (Seamless, Thin Minimalist & Elegant) */}
      <div className="w-full bg-[#f6f3ee] text-stone-700 py-1.5 sm:py-2 px-4 text-center font-sans font-[350] text-[12.5px] sm:text-[13px] tracking-[0.03em] relative z-50">
        <span>
          {isEn
            ? "5% Discount for first customer"
            : "Diskon 5% untuk Pelanggan Pertama"}
        </span>
      </div>

      {/* 2. TOP NAVBAR — PURE WHITE LUXURY EDITORIAL */}
      <header className="sticky top-0 z-50 w-full bg-white border-b border-stone-200/70 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 md:h-22 flex items-center justify-between">
          {/* Left: Authentic Serena Raga Brand Logo */}
          <Link href="/" className="inline-flex items-center group">
            <BrandLogo variant="full" className="h-7 sm:h-8 md:h-9 w-auto hover:opacity-85 transition-opacity" />
          </Link>

          {/* Right: Desktop Horizontal Links in Thin Minimalist Elegant Typography */}
          <nav className="hidden xl:flex items-center gap-6 lg:gap-7.5">
            {[
              { href: "#", label: "Home", active: true },
              { href: "#about", label: isEn ? "About Us" : "Tentang Kami" },
              { href: "#services", label: isEn ? "Wellness Treatments" : "Layanan Wellness" },
              { href: "#services", label: isEn ? "Mix Body Treatments" : "Layanan Kombinasi" },
              { href: "#benefits", label: isEn ? "Service Areas" : "Area Layanan" },
              { href: "#testimonials", label: isEn ? "Testimonials" : "Testimoni" },
              { href: "#faq", label: isEn ? "Articles" : "Artikel" },
              { href: "#gallery", label: isEn ? "Gallery" : "Galeri" },
              { href: "#book-now", label: isEn ? "Contact" : "Kontak" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={cn(
                  "text-[13px] lg:text-[13.5px] tracking-[0.03em] transition-colors duration-200 font-sans",
                  item.active
                    ? "text-[#9a6a43] font-medium"
                    : "text-stone-600 hover:text-stone-950 font-[350]"
                )}
              >
                {item.label}
              </a>
            ))}

            {/* Action Group: Shadcn Language & Theme Mode Dropdowns */}
            <div className="flex items-center gap-1 pl-3 border-l border-stone-200">
              {/* Shadcn Language Switcher Dropdown */}
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs text-stone-700 hover:text-stone-950 hover:bg-stone-100/80 font-sans font-normal flex items-center gap-1.5 border-0 shadow-none transition-colors cursor-pointer"
                    />
                  }
                >
                  <Globe className="w-3.5 h-3.5 text-stone-500" />
                  <span className="font-medium text-[#9a6a43]">{locale.toUpperCase()}</span>
                  <ChevronDown className="w-3 h-3 text-stone-400 opacity-80" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={() => setLocale("en")}
                    className="flex items-center justify-between text-xs cursor-pointer py-2"
                  >
                    <span>English (EN)</span>
                    <Check className={cn("w-4 h-4 text-[#9a6a43]", locale !== "en" && "hidden")} />
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setLocale("id")}
                    className="flex items-center justify-between text-xs cursor-pointer py-2"
                  >
                    <span>Indonesia (ID)</span>
                    <Check className={cn("w-4 h-4 text-[#9a6a43]", locale !== "id" && "hidden")} />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Shadcn Theme Mode Toggle Dropdown */}
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-stone-700 hover:text-stone-950 hover:bg-stone-100/80 border-0 shadow-none transition-colors cursor-pointer"
                    />
                  }
                >
                  {theme === "dark" ? (
                    <Moon className="w-4 h-4 text-[#9a6a43]" />
                  ) : (
                    <Sun className="w-4 h-4 text-[#9a6a43]" />
                  )}
                  <span className="sr-only">Toggle theme</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  <DropdownMenuItem
                    onClick={() => setTheme("light")}
                    className="flex items-center justify-between text-xs cursor-pointer py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Sun className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
                      <span>{isEn ? "Light" : "Terang"}</span>
                    </div>
                    <Check className={cn("w-4 h-4 text-[#9a6a43]", theme !== "light" && "hidden")} />
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme("dark")}
                    className="flex items-center justify-between text-xs cursor-pointer py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Moon className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
                      <span>{isEn ? "Dark" : "Gelap"}</span>
                    </div>
                    <Check className={cn("w-4 h-4 text-[#9a6a43]", theme !== "dark" && "hidden")} />
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme("system")}
                    className="flex items-center justify-between text-xs cursor-pointer py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-stone-400" />
                      <span>{isEn ? "System" : "Sistem"}</span>
                    </div>
                    <Check className={cn("w-4 h-4 text-[#9a6a43]", theme !== "system" && "hidden")} />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </nav>

          {/* Mobile / Tablet: Hamburger Trigger for Sheet */}
          <div className="xl:hidden flex items-center gap-3">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger
                render={
                  <button
                    type="button"
                    aria-label="Open Navigation Menu"
                    className="p-2 text-stone-700 hover:text-stone-900 transition-colors cursor-pointer"
                  />
                }
              >
                <span className="flex flex-col justify-center gap-[5px] w-6">
                  <span className="h-[2px] w-full bg-[#2b2420] rounded-full" />
                  <span className="h-[2px] w-full bg-[#2b2420] rounded-full" />
                  <span className="h-[2px] w-full bg-[#2b2420] rounded-full" />
                </span>
              </SheetTrigger>

              <SheetContent side="right" className="bg-[#fcfaf7] border-l border-[#ebe6df] text-stone-900 p-5 sm:p-7 w-[300px] sm:w-[340px] max-w-[85vw] flex flex-col justify-between shadow-2xl overflow-y-auto max-h-screen">
                <div>
                  <SheetHeader className="text-left pb-4 border-b border-[#eee8df] mb-2 p-0">
                    <SheetTitle className="text-stone-900 flex items-center">
                      <BrandLogo variant="full" className="h-7 sm:h-8 w-auto" />
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col py-2">
                    {[
                      { href: "#", label: "Home", active: true },
                      { href: "#about", label: isEn ? "About Us" : "Tentang Kami" },
                      { href: "#services", label: isEn ? "Wellness Treatments" : "Layanan Wellness" },
                      { href: "#services", label: isEn ? "Mix Body Treatments" : "Layanan Kombinasi" },
                      { href: "#benefits", label: isEn ? "Service Areas" : "Area Layanan" },
                      { href: "#testimonials", label: isEn ? "Testimonials" : "Testimoni" },
                      { href: "#faq", label: isEn ? "Articles & FAQ" : "Artikel & FAQ" },
                      { href: "#gallery", label: isEn ? "Gallery" : "Galeri" },
                      { href: "#book-now", label: isEn ? "Contact & Booking" : "Kontak & Pemesanan" },
                    ].map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "text-[14px] sm:text-[14.5px] font-sans tracking-[0.03em] py-2.5 px-1 border-b border-[#f0ece4] transition-colors flex items-center justify-between group",
                          item.active
                            ? "text-[#9a6a43] font-medium"
                            : "text-[#3c342f] hover:text-[#9a6a43] font-[350]"
                        )}
                      >
                        <span>{item.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-[#9a6a43] group-hover:translate-x-0.5 transition-all" />
                      </a>
                    ))}
                  </nav>
                </div>

                <div className="pt-5 space-y-4 border-t border-[#eee8df]">
                  {/* Hero Outlined Style WhatsApp CTA */}
                  <button
                    type="button"
                    onClick={() => { setMobileMenuOpen(false); handleQuickBook(); }}
                    className="w-full py-3 px-4 border border-[#3c342f] text-[#3c342f] hover:bg-[#3c342f] hover:text-white flex items-center justify-center gap-2.5 text-xs tracking-[0.16em] uppercase font-normal transition-all duration-300 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{isEn ? "Book via WhatsApp" : "Pesan via WhatsApp"}</span>
                  </button>

                  {/* Shadcn UI Language & Theme Selectors for Mobile Drawer */}
                  <div className="grid grid-cols-2 gap-2 pt-1 font-sans text-xs">
                    {/* Language Dropdown */}
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-8.5 justify-between px-2 text-xs text-stone-700 hover:bg-[#eee7dc]/60 rounded-md font-normal cursor-pointer border-0 shadow-none"
                          />
                        }
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <Globe className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                          <span className="font-medium text-[#9a6a43] truncate">
                            {locale === "en" ? "EN" : "ID"}
                          </span>
                        </div>
                        <ChevronDown className="w-3 h-3 text-stone-400 shrink-0" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-44">
                        <DropdownMenuItem
                          onClick={() => setLocale("en")}
                          className="flex items-center justify-between text-xs cursor-pointer py-2"
                        >
                          <span>English (EN)</span>
                          <Check className={cn("w-4 h-4 text-[#9a6a43]", locale !== "en" && "hidden")} />
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setLocale("id")}
                          className="flex items-center justify-between text-xs cursor-pointer py-2"
                        >
                          <span>Bahasa Indonesia (ID)</span>
                          <Check className={cn("w-4 h-4 text-[#9a6a43]", locale !== "id" && "hidden")} />
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Theme Mode Dropdown */}
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-8.5 justify-between px-2 text-xs text-stone-700 hover:bg-[#eee7dc]/60 rounded-md font-normal cursor-pointer border-0 shadow-none"
                          />
                        }
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {theme === "dark" ? (
                            <Moon className="w-3.5 h-3.5 text-[#9a6a43] shrink-0" />
                          ) : (
                            <Sun className="w-3.5 h-3.5 text-[#9a6a43] shrink-0" />
                          )}
                          <span className="capitalize font-medium text-[#9a6a43] truncate">
                            {theme === "dark" ? (isEn ? "Dark" : "Gelap") : theme === "light" ? (isEn ? "Light" : "Terang") : (isEn ? "System" : "Sistem")}
                          </span>
                        </div>
                        <ChevronDown className="w-3 h-3 text-stone-400 shrink-0" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem
                          onClick={() => setTheme("light")}
                          className="flex items-center justify-between text-xs cursor-pointer py-2"
                        >
                          <div className="flex items-center gap-2">
                            <Sun className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
                            <span>{isEn ? "Light" : "Terang"}</span>
                          </div>
                          <Check className={cn("w-4 h-4 text-[#9a6a43]", theme !== "light" && "hidden")} />
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setTheme("dark")}
                          className="flex items-center justify-between text-xs cursor-pointer py-2"
                        >
                          <div className="flex items-center gap-2">
                            <Moon className="w-3.5 h-3.5 text-stone-600" />
                            <span>{isEn ? "Dark" : "Gelap"}</span>
                          </div>
                          <Check className={cn("w-4 h-4 text-[#9a6a43]", theme !== "dark" && "hidden")} />
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setTheme("system")}
                          className="flex items-center justify-between text-xs cursor-pointer py-2"
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-stone-400" />
                            <span>{isEn ? "System" : "Sistem"}</span>
                          </div>
                          <Check className={cn("w-4 h-4 text-[#9a6a43]", theme !== "system" && "hidden")} />
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* 2. CINEMATIC HERO SECTION (Matching Reference Screenshot) */}
      <section className="relative w-full overflow-hidden flex items-center justify-center min-h-[480px] sm:min-h-[620px] md:min-h-[680px] lg:min-h-[740px] bg-stone-950">
        {/* Full-bleed Sanctuary Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-sanctuary.jpg"
            alt="So Bali SPA - Sanctuary Wellness Experience"
            className="w-full h-full object-cover object-center"
          />
          {/* Subtle contrast overlay */}
          <div className="absolute inset-0 bg-black/20 md:bg-black/15" />
        </div>

        {/* Center Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center justify-center py-16 sm:py-28">
          {/* Main Title: SoBali SPA in Gallient Luxury Roman Serif */}
          <h1
            className="text-4xl sm:text-6xl md:text-7xl lg:text-[84px] text-white font-normal tracking-[0.14em] sm:tracking-[0.22em] leading-tight drop-shadow-[0_3px_15px_rgba(0,0,0,0.45)] uppercase select-none"
            style={{ fontFamily: "var(--font-gallient), Georgia, serif" }}
          >
            {settings.brand_name || "SoBali SPA"}
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-base md:text-lg text-white/95 font-light tracking-wide mt-3 sm:mt-4 max-w-xl mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] px-2">
            {isEn
              ? "Professional spa care, wherever you stay."
              : "Layanan spa profesional, di mana pun Anda menginap."}
          </p>

          {/* 24 hours online booking outlined button */}
          <a
            href="#services"
            onClick={(e) => {
              const el = document.getElementById("services");
              if (el) {
                e.preventDefault();
                el.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="mt-6 sm:mt-8 inline-flex items-center justify-center px-6 sm:px-10 py-3 sm:py-3.5 border border-white/85 hover:border-white hover:bg-white/10 text-white text-xs sm:text-[13px] tracking-[0.14em] sm:tracking-[0.18em] font-normal transition-all duration-300 backdrop-blur-[2px] cursor-pointer"
          >
            <span>
              {isEn ? "24 hours online booking" : "Pemesanan online 24 jam"}
            </span>
          </a>
        </div>
      </section>

      {/* 3. ABOUT / NARRATIVE SECTION (Matching Reference Screenshot) */}
      <section id="about" className="py-14 sm:py-28 lg:py-36 bg-[#f6f3ee] text-stone-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 xl:gap-16 items-center">
            
            {/* Left Column: 2 Images Collage */}
            <div className="lg:col-span-6 xl:col-span-7 flex items-center justify-center gap-3.5 sm:gap-6 lg:gap-7">
              {/* Left Vertical Image (Massage with Oil) */}
              <div className="w-[38%] sm:w-[35%] aspect-[3/4] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.06)] shrink-0">
                <img
                  src="/images/about-massage-oil.jpg"
                  alt="Professional massage with natural essential oils"
                  className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-700"
                />
              </div>

              {/* Right Wider Image (Couple Relaxing on Mosaic Loungers) */}
              <div className="w-[62%] sm:w-[65%] aspect-[4/3] overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.08)]">
                <img
                  src="/images/about-couple-mosaic.jpg"
                  alt="Couple relaxing on wellness spa loungers"
                  className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>

            {/* Right Column: Editorial Text */}
            <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center text-left">
              {/* Main Headline */}
              <h2
                className="text-2.5xl sm:text-4xl lg:text-[42px] xl:text-[46px] text-[#221c19] font-normal leading-[1.14] tracking-tight"
                style={{ fontFamily: "var(--font-gallient), Georgia, serif" }}
              >
                {settings.brand_name ? `${settings.brand_name} Homeservice` : "SoBali SPA Homeservice"}
              </h2>

              {/* Tagline Subtitle */}
              <h3 className="font-serif text-[#2b2420] text-base sm:text-xl lg:text-[22px] font-normal leading-snug mt-2.5 sm:mt-4">
                {isEn ? (
                  <>
                    Experience Authentic Balinese Wellness,<br className="hidden sm:inline" />
                    {" "}Thoughtfully Brought to Your Villa or Resort
                  </>
                ) : (
                  <>
                    Rasakan Ketenangan Tradisi Spa Bali Otentik,<br className="hidden sm:inline" />
                    {" "}Dihadirkan Eksklusif ke Villa atau Hotel Anda
                  </>
                )}
              </h3>

              {/* Body Paragraph */}
              <p className="text-[#685f58] text-[14px] sm:text-[15px] leading-relaxed font-sans font-[350] mt-5 sm:mt-6">
                {isEn
                  ? "At So Bali SPA, we believe true wellness begins with balance, tranquility, and authentic care. Inspired by the timeless traditions of Balinese healing, we bring professional wellness treatments to your villa or resort, allowing you to experience genuine Balinese wellness in the comfort, privacy, and serenity of your surroundings."
                  : "Di Serena Raga, kami meyakini bahwa ketenangan sejati berawal dari keseimbangan tubuh, ketenteraman jiwa, dan sentuhan otentik. Terinspirasi oleh kearifan tradisi penyembuhan Bali yang melegenda, kami menghadirkan layanan spa profesional langsung ke villa atau hotel pilihan Anda—menghadirkan relaksasi sejati dalam kenyamanan, privasi, dan kedamaian ruang Anda."}
              </p>

              {/* Read More Link */}
              <div className="mt-6 sm:mt-8">
                <a
                  href="#services"
                  onClick={(e) => {
                    const el = document.getElementById("services");
                    if (el) {
                      e.preventDefault();
                      el.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="inline-flex items-center gap-2 text-[#9a6a43] hover:text-[#785033] font-serif text-[15px] sm:text-base font-normal tracking-wide transition-colors group cursor-pointer"
                >
                  <span>{isEn ? "Read More" : "Pelajari Lebih Lanjut"}</span>
                  <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. WELLNESS TREATMENTS INTRO BANNER (Matching Reference Screenshot) */}
      <section className="py-12 sm:py-20 lg:py-24 bg-white text-stone-900 overflow-hidden border-t border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          {/* Top Header Row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 pb-6 sm:pb-12">
            {/* Left: Two-Tone Large Headline */}
            <div>
              <h2
                className="text-3xl sm:text-4xl lg:text-[46px] xl:text-[52px] text-[#221c19] font-normal leading-[1.14] tracking-tight"
                style={{ fontFamily: "var(--font-gallient), Georgia, serif" }}
              >
                <span className="text-[#1c1815] block">Wellness</span>
                <span className="text-[#b3a498] block">Treatments</span>
              </h2>
            </div>

            {/* Right: Subtitle Description */}
            <div className="md:max-w-xs lg:max-w-sm">
              <p className="text-[#4a423d] text-[13.5px] sm:text-[15px] leading-relaxed font-sans font-[350]">
                {isEn
                  ? "Authentic Balinese wellness treatments designed for relaxation, renewal, and complete wellbeing."
                  : "Layanan perawatan spa Bali otentik yang dirancang khusus untuk relaksasi, pemulihan energi, dan kesehatan menyeluruh."}
              </p>
            </div>
          </div>

          {/* Panoramic Banner Photo */}
          <div className="w-full aspect-[16/9] sm:aspect-[21/8.5] md:aspect-[21/8] overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.07)]">
            <img
              src="/images/wellness-treatment-banner.jpg"
              alt="Authentic Balinese Wellness Treatment Massage Experience"
              className="w-full h-full object-cover object-[center_35%] hover:scale-[1.02] transition-transform duration-700"
            />
          </div>
        </div>
      </section>

      {/* 5. UNIFIED SECTION: OUR SERVICES & WHY CHOOSE US (MATCHING REFERENCE SCREENSHOT) */}
      <section id="services" className="py-14 sm:py-28 lg:py-32 bg-[#f6f3ee] text-stone-900 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          
          {/* PART 1: OUR SERVICES */}
          <div className="text-center mb-8 sm:mb-14">
            <h2
              className="text-2.5xl sm:text-4xl lg:text-[44px] text-[#1c1815] font-normal tracking-tight"
              style={{ fontFamily: "var(--font-gallient), Georgia, serif" }}
            >
              {isEn ? "Our Services" : "Layanan Kami"}
            </h2>
          </div>

          {/* 4-Card Service Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
            {[
              {
                id: "balinese",
                title: "Balinese",
                titleId: "Pijat Bali",
                tagline: "Authentic Relaxation",
                taglineId: "Relaksasi Otentik",
                image: "/images/service-balinese.jpg",
                alt: "Traditional Balinese Massage",
              },
              {
                id: "foot",
                title: "Foot Reflexology",
                titleId: "Refleksi Kaki",
                tagline: "Relax Tired Feet",
                taglineId: "Redakan Kaki Lelah",
                image: "/images/service-foot-reflexology.jpg",
                alt: "Foot Reflexology Treatment",
              },
              {
                id: "back-neck",
                title: "Back, Neck & Shoulder",
                titleId: "Punggung, Leher & Pundak",
                tagline: "Release Everyday Tension",
                taglineId: "Lepaskan Ketegangan Otot",
                image: "/images/service-back-neck.jpg",
                alt: "Back, Neck and Shoulder Massage",
              },
              {
                id: "face-lifting",
                title: "Face Lifting & Acupressure",
                titleId: "Totok Wajah & Akupresur",
                tagline: "Lift, Refresh & Relax",
                taglineId: "Segarkan & Kencangkan Wajah",
                image: "/images/service-face-lifting.jpg",
                alt: "Face Lifting and Acupressure Massage",
              },
            ].map((service) => (
              <div
                key={service.id}
                onClick={() => handleQuickBook(service.title)}
                className="group relative aspect-[4/3] sm:aspect-[3/4] overflow-hidden cursor-pointer shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] transition-all duration-500"
              >
                {/* Background Image */}
                <img
                  src={service.image}
                  alt={service.alt}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />

                {/* Dark Gradient Overlay for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-4 sm:p-6 text-center text-white" />

                {/* Text Content Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 text-center text-white flex flex-col items-center justify-end">
                  <h3
                    className="text-lg sm:text-xl font-normal text-stone-100 tracking-wide"
                    style={{ fontFamily: "var(--font-gallient), Georgia, serif" }}
                  >
                    {isEn ? service.title : service.titleId}
                  </h3>
                  <p className="text-[12px] sm:text-[13px] text-stone-300 font-light font-sans mt-1">
                    {isEn ? service.tagline : service.taglineId}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Explore Other Treatments Link */}
          <div className="text-center mt-7 sm:mt-12">
            <button
              type="button"
              onClick={() => handleQuickBook()}
              className="inline-flex items-center gap-1.5 text-[#9a6a43] hover:text-[#785033] font-serif text-[14.5px] sm:text-base font-normal tracking-wide transition-colors cursor-pointer group"
            >
              <span>{isEn ? "Explore Other Treatments" : "Jelajahi Layanan Lainnya"}</span>
              <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
            </button>
          </div>

          {/* PART 2: WHY CHOOSE US ? */}
          <div id="benefits" className="mt-14 sm:mt-28 lg:mt-32 pt-12 sm:pt-20 border-t border-stone-300/60 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 xl:gap-16 items-start">
            {/* Left Column: Heading */}
            <div className="lg:col-span-4 xl:col-span-4 lg:sticky lg:top-28">
              <h3
                className="text-3xl sm:text-5xl lg:text-[54px] text-[#1c1815] font-normal leading-[1.08] tracking-tight"
                style={{ fontFamily: "var(--font-gallient), Georgia, serif" }}
              >
                {isEn ? (
                  <>
                    Why <br />
                    Choose Us ?
                  </>
                ) : (
                  <>
                    Mengapa <br />
                    Memilih Kami ?
                  </>
                )}
              </h3>
            </div>

            {/* Right Column: 2x3 Grid of 6 Benefit Cards */}
            <div className="lg:col-span-8 xl:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 lg:gap-x-12 lg:gap-y-12">
              {[
                {
                  titleEn: "Authentic Balinese Wellness Traditions",
                  titleId: "Tradisi Spa Bali Otentik",
                  descEn: "Inspired by timeless Balinese spa traditions and rituals.",
                  descId: "Terinspirasi oleh tradisi penyembuhan dan ritual spa Bali yang melegenda.",
                },
                {
                  titleEn: "Premium Natural Oils and Wellness Products",
                  titleId: "Minyak Alami & Produk Herbal Premium",
                  descEn: "Quality natural oils and selected products enhance every treatment.",
                  descId: "Minyak esensial murni organik dan produk pilihan terbaik untuk kenyamanan tubuh.",
                },
                {
                  titleEn: "Professional Wellness Treatments at Your Villa or Resort",
                  titleId: "Layanan Spa Profesional di Villa atau Hotel Anda",
                  descEn: "Enjoy professional spa treatments in the comfort of your accommodation.",
                  descId: "Nikmati perawatan spa profesional langsung dalam kenyamanan dan privasi tempat Anda menginap.",
                },
                {
                  titleEn: "Personalized Treatments Tailored to Your Individual Needs",
                  titleId: "Perawatan Fleksibel Sesuai Kebutuhan Tubuh",
                  descEn: "Every treatment is adapted to your preferences, comfort, and needs.",
                  descId: "Tekanan dan fokus pemijatan disesuaikan penuh dengan kenyamanan tubuh Anda.",
                },
                {
                  titleEn: "Respectful, Discreet, and Professional Therapists",
                  titleId: "Terapis Ramah, Bersertifikat & Menjaga Privasi",
                  descEn: "Our therapists provide skilled, respectful, and attentive service.",
                  descId: "Terapis kami bersertifikasi resmi, santun, terampil, dan melayani dengan sepenuh hati.",
                },
                {
                  titleEn: "Flexible Appointments Across Bali's Destinations",
                  titleId: "Jangkauan Layanan Luas & Jadwal Fleksibel",
                  descEn: "Enjoy convenient spa treatments across Bali's most popular destinations.",
                  descId: "Pemesanan fleksibel yang menjangkau seluruh area tujuan utama di kota Anda.",
                },
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-3.5 sm:gap-4.5">
                  {/* Rounded Lotus Icon Badge */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#6f665e] text-[#f6f3ee] flex items-center justify-center shrink-0 shadow-sm">
                    <SacredLotusLogo className="w-5.5 h-5.5 sm:w-6.5 sm:h-6.5 text-[#f6f3ee]" />
                  </div>

                  {/* Benefit Content */}
                  <div className="space-y-1 sm:space-y-1.5 pt-0.5">
                    <h4 className="font-serif text-[#1c1815] text-[14.5px] sm:text-base font-normal leading-snug">
                      {isEn ? benefit.titleEn : benefit.titleId}
                    </h4>
                    <p className="text-[#685f58] text-[12.5px] sm:text-[13.5px] leading-relaxed font-sans font-[350]">
                      {isEn ? benefit.descEn : benefit.descId}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 8. COMBINED CUSTOMER TESTIMONIALS & FAQ SECTION (DARK ESPRESSO BACKGROUND) */}
      <section id="testimonials" className="py-14 sm:py-24 lg:py-28 bg-[#241c17] text-stone-100 border-t border-stone-800/80 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 space-y-12 sm:space-y-20 lg:space-y-24">
          
          {/* PART 1: CUSTOMER TESTIMONIALS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center">
            {/* Left: Balanced Photo */}
            <div className="lg:col-span-5 xl:col-span-5 relative">
              <div className="relative aspect-[16/11] sm:aspect-[4/3] lg:aspect-[4/3.8] max-w-lg mx-auto lg:max-w-none overflow-hidden shadow-2xl bg-stone-900">
                <img
                  src={currentTestimonial.image}
                  alt="Therapist performing authentic relaxation massage"
                  className="w-full h-full object-cover transition-opacity duration-500 animate-in fade-in"
                />
              </div>
            </div>

            {/* Right: Testimonials Content */}
            <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-center space-y-5 sm:space-y-6 lg:pl-4">
              <div className="space-y-3 sm:space-y-5">
                <h2
                  className="text-2.5xl sm:text-4xl lg:text-[42px] xl:text-[46px] text-stone-100 leading-[1.14] tracking-tight"
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

                <p className="text-[13.5px] sm:text-[15px] lg:text-base text-stone-200 font-light leading-relaxed max-w-xl">
                  "{isEn ? currentTestimonial.text_en : currentTestimonial.text_id}"
                </p>

                <div className="space-y-0.5 pt-1">
                  <div className="text-[15px] sm:text-lg font-medium text-stone-100">
                    {currentTestimonial.name}
                  </div>
                  <div className="text-xs sm:text-[13px] text-stone-400 font-light">
                    {isEn ? currentTestimonial.role_en : currentTestimonial.role_id}
                  </div>
                </div>
              </div>

              {/* Navigation Arrows */}
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={prevTestimonial}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#382b23] hover:bg-[#46362c] text-stone-300 flex items-center justify-center transition-colors cursor-pointer"
                  title="Previous Testimonial"
                >
                  <ArrowLeft className="w-4 h-4 stroke-[1.5]" />
                </button>
                <button
                  type="button"
                  onClick={nextTestimonial}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#eed7a1] hover:bg-[#e4cb91] text-[#241c17] flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                  title="Next Testimonial"
                >
                  <ArrowRight className="w-4 h-4 stroke-[1.5]" />
                </button>
              </div>
            </div>
          </div>

          {/* PART 2: FREQUENTLY ASKED QUESTIONS (FAQS) */}
          <div id="faq" className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start pt-10 sm:pt-16 border-t border-stone-800/60">
            {/* Left: Heading & Accordion List */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6">
              <div>
                <h2
                  className="text-2.5xl sm:text-4xl lg:text-[42px] xl:text-[46px] text-stone-100 leading-[1.14] tracking-tight mb-2"
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
                <p className="text-xs sm:text-[13.5px] text-stone-400 font-light tracking-wide max-w-xl">
                  {isEn
                    ? "Escape the Ordinary. Indulge in Ultimate Relaxation, Anytime, Anywhere."
                    : "Lepaskan Kepenatan. Nikmati Relaksasi Mewah Kapan Saja, di Mana Saja."}
                </p>
              </div>

              {/* Clean Luxury Accordion */}
              <div className="space-y-3 pt-1">
                {FAQ_ITEMS.map((item, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="border-b border-stone-800/80 pb-3 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between text-left py-2 gap-3 group cursor-pointer"
                      >
                        <span className="text-[13px] sm:text-[14.5px] font-medium text-stone-100 group-hover:text-[#eed7a1] transition-colors">
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
                        <div className="pt-1.5 pb-1 pr-2 text-xs sm:text-[13px] text-stone-400 font-light leading-relaxed animate-in fade-in duration-300">
                          {isEn ? item.a_en : item.a_id}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Faceless Relaxing Back Massage Photo */}
            <div className="lg:col-span-5 pt-2 lg:pt-4">
              <div className="relative aspect-[16/10] max-w-lg mx-auto lg:max-w-none overflow-hidden shadow-2xl bg-stone-900 border border-stone-800/80">
                <img
                  src="/images/faq-back-massage.jpg"
                  alt="Therapist performing authentic soothing back massage"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 10. FINAL LUXURY BOOKING BANNER (MATCHING REFERENCE SCREENSHOT) */}
      <section className="relative py-14 sm:py-24 lg:py-28 overflow-hidden bg-[#18120f] border-t border-stone-800 flex items-center justify-center">
        {/* Full-bleed Warm Spa Background Photo */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/reservation-back-massage.jpg"
            alt="Relaxing luxury Balinese back massage experience with soothing oil and candles"
            className="w-full h-full object-cover object-center"
          />
          {/* Subtle warm translucent overlay */}
          <div className="absolute inset-0 bg-black/30 sm:bg-black/25" />
        </div>

        <div className="relative z-10 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          {/* Translucent Luxury Booking Glass Card (No border, No rounded corners, Wider) */}
          <div className="max-w-4xl mx-auto rounded-none overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-md sm:backdrop-blur-lg">
            {/* Top Gold Header Strip */}
            <div className="bg-[#eed8a1] text-[#241c17] py-2 sm:py-3 text-xs sm:text-[13px] font-medium tracking-[0.06em] uppercase text-center rounded-none">
              {isEn ? "Reservation" : "Reservasi"}
            </div>

            {/* Card Content Body */}
            <div className="bg-stone-950/45 sm:bg-stone-950/50 p-5 sm:p-11 lg:p-14 text-stone-100 flex flex-col items-center text-center">
              {/* Gallient Headline */}
              <h2
                className="text-2.5xl sm:text-4xl lg:text-[48px] text-white leading-[1.14] tracking-tight font-normal"
                style={{ fontFamily: "var(--font-gallient), Georgia, serif" }}
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
              <p className="text-xs sm:text-[14px] text-stone-200/90 font-light tracking-wide mt-2.5 sm:mt-4 max-w-xl mx-auto">
                {isEn
                  ? `Escape. Relax. Rejuvenate. Anytime, Anywhere in ${settings.service_areas ? settings.service_areas.split(",")[0] : "Bali"}.`
                  : "Lepaskan Kepenatan. Nikmati Relaksasi Mewah Kapan Saja, di Mana Saja."}
              </p>

              {/* Mocha Fast Banner */}
              <div className="mt-5 sm:mt-8">
                <div className="bg-[#947864]/90 text-stone-100 py-1.5 sm:py-2.5 px-5 sm:px-12 rounded-none text-xs sm:text-[13px] font-normal inline-block shadow-sm">
                  {isEn ? "Easy Booking in Just Seconds" : "Pemesanan Mudah dalam Hitungan Detik"}
                </div>
              </div>

              {/* 2 Booking Channels Grid (WhatsApp & Online Booking) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-0 mt-6 sm:mt-9 w-full max-w-lg mx-auto items-center text-center">
                {/* Channel 1: WhatsApp */}
                <div className="space-y-1 pb-3 sm:pb-0 border-b sm:border-b-0 sm:border-r border-white/20 sm:pr-6">
                  <span className="text-[10.5px] sm:text-[11px] text-stone-300 uppercase tracking-wider block font-light">
                    WhatsApp
                  </span>
                  <a
                    href={`https://wa.me/${cleanWhatsAppNumber(settings.whatsapp_number || "6281234567890")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-[14px] text-white hover:text-[#eed8a1] font-mono transition-colors block tracking-wide font-medium"
                    suppressHydrationWarning
                  >
                    {formatDisplayPhone(settings.whatsapp_number)}
                  </a>
                </div>

                {/* Channel 2: Online Booking */}
                <div className="space-y-1 sm:pl-6">
                  <span className="text-[10.5px] sm:text-[11px] text-stone-300 uppercase tracking-wider block font-light">
                    {isEn ? "Online Booking" : "Reservasi Online"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuickBook()}
                    className="text-xs sm:text-[14px] text-white hover:text-[#eed8a1] font-medium underline underline-offset-4 cursor-pointer transition-colors block mx-auto"
                  >
                    {isEn ? "Book Now" : "Pesan Sekarang"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Footnote underneath the card */}
          <div className="mt-7 sm:mt-9 space-y-2 text-center max-w-2xl mx-auto px-4">
            <span className="text-xs sm:text-[13.5px] font-medium text-[#eed8a1] flex items-center justify-center gap-1">
              <span>📍</span>
              <span>
                {isEn
                  ? `Serving All of ${settings.service_areas ? settings.service_areas.split(",")[0] : "Bali"} – Hotels, Private Residences & More`
                  : "Melayani Seluruh Wilayah Kota – Hotel, Rumah Tinggal & Apartemen"}
              </span>
            </span>
            <p className="text-xs sm:text-[13px] text-stone-200/90 font-light leading-relaxed">
              {isEn
                ? "Indulge in the finest authentic spa massage experience without leaving your space. Book now and transform your surroundings into a sanctuary of relaxation."
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
                href={`tel:${cleanWhatsAppNumber(settings.phone_number || settings.whatsapp_number || "6281234567890")}`}
                className="hover:text-stone-900 transition-colors"
              >
                {formatDisplayPhone(settings.phone_number || settings.whatsapp_number)}
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
