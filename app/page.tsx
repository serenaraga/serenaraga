"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "motion/react";
import { BrandLogo } from "@/components/brand-logo";
import {
  useBrandSettings,
  cleanWhatsAppNumber,
  formatDisplayPhone,
  getInstagramUrl,
  getTikTokUrl,
  getFacebookUrl,
  getThreadsUrl,
} from "@/lib/brand-settings";
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
  Globe,
  MessageSquareQuote,
  Calendar as CalendarIcon,
  Menu,
  X,
  Heart,
  Search,
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
    {/* Geometric 8-petal sacred lotus bloom */}
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

// Interface for Dynamic Authentic WhatsApp Testimonials
export interface TestimonialItem {
  id: number;
  customer_name?: string;
  service_name?: string;
  image_url: string;
  caption?: string;
  rating?: number;
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
}

// Curated FAQ Items
const FAQ_ITEMS = [
  {
    q_en: "Do therapists bring their own equipment?",
    q_id: "Apakah terapis membawa perlengkapan sendiri?",
    a_en:
      "Yes, our therapists come fully equipped with specialized aromatherapy oils, clean linens/mats, and standard relaxation equipment. You only need to provide a comfortable space at home.",
    a_id:
      "Ya, terapis kami telah dibekali dengan minyak pijat aromaterapi khusus, kain/alas bersih, dan perlengkapan relaksasi standar. Anda cukup menyiapkan tempat yang nyaman di rumah.",
  },
  {
    q_en: "Can female clients request a female therapist?",
    q_id: "Apakah bisa pilih terapis wanita untuk pelanggan wanita?",
    a_en:
      "Absolutely. Your comfort and peace of mind are our priority. By default, female clients will be serviced by female therapists. Please specify your preference when booking.",
    a_id:
      "Tentu. Kenyamanan Anda adalah prioritas kami. Secara default, pelanggan wanita akan dilayani oleh terapis wanita. Mohon tuliskan preferensi Anda saat mengisi form booking.",
  },
  {
    q_en: "What is the latest time to book (Last order)?",
    q_id: "Sampai jam berapa maksimal pemesanan (Last order)?",
    a_en:
      "Our services operate daily from 08:00 AM to 10:00 PM WIB. We recommend booking by 08:00 PM WIB at the latest to ensure therapist availability.",
    a_id:
      "Layanan kami beroperasi dari jam 08.00 hingga 22.00 WIB. Disarankan melakukan pemesanan (booking) maksimal pukul 20.00 WIB untuk memastikan ketersediaan terapis.",
  },
  {
    q_en: "How does payment work at SerenaRaga?",
    q_id: "Bagaimana sistem pembayaran di SerenaRaga?",
    a_en:
      "Payment can be made once the therapist arrives at your location or after the session ends. We accept Bank Transfer, QRIS, and Cash.",
    a_id:
      "Pembayaran dapat dilakukan setelah terapis tiba di lokasi atau setelah sesi selesai. Kami menerima pembayaran via Transfer Bank, QRIS, maupun Tunai.",
  },
  {
    q_en: "Is there an additional transport fee?",
    q_id: "Apakah ada biaya transport tambahan?",
    a_en:
      "We provide free transport within designated zones in Yogyakarta. For outer areas in Sleman and Bantul, a modest and affordable transport adjustment applies. Feel free to share your location on WhatsApp to confirm.",
    a_id:
      "Kami memberikan gratis biaya transport (ongkir) untuk radius tertentu di wilayah Jogja. Untuk area Sleman dan Bantul yang lebih jauh, akan ada sedikit penyesuaian biaya transport yang sangat terjangkau. Silakan share loc ke WA kami untuk memastikan.",
  },
];

export default function LandingPage() {
  const { settings } = useBrandSettings();

  const [mounted, setMounted] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [locale, setLocale] = React.useState<"id" | "en">("en");
  const isEn = locale === "en";

  // Dynamic state from database
  const [services, setServices] = React.useState<any[]>(DEFAULT_SERVICES);

  // Booking simulation state
  const [selectedService, setSelectedService] = React.useState<string>("Traditional Balinese Massage");
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = React.useState<string>("15:00");
  const [invoiceLookupNumber, setInvoiceLookupNumber] = React.useState("");

  // Enforce light mode
  React.useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      root.classList.remove("dark");
      root.classList.add("light");
    }
  }, []);

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
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");
  };

  // Smooth scroll helper for section navigation
  const handleNavScroll = (e: React.MouseEvent<HTMLElement>, href: string) => {
    e.preventDefault();
    if (href === "#") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const targetId = href.replace(/^#/, "");
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Mobile navigation click helper that closes drawer before scrolling
  const handleMobileNavClick = (e: React.MouseEvent<HTMLElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    setTimeout(() => {
      if (href === "#") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const targetId = href.replace(/^#/, "");
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 150);
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

  // Dynamic Testimonials from Supabase
  const [testimonials, setTestimonials] = React.useState<TestimonialItem[]>([]);
  const [isLoadingTestimonials, setIsLoadingTestimonials] = React.useState(true);

  React.useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const { data, error } = await supabase
          .from("testimonials")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("id", { ascending: false });

        if (!error && data) {
          setTestimonials(data);
        }
      } catch (err) {
        console.warn("Failed to load testimonials from Supabase:", err);
      } finally {
        setIsLoadingTestimonials(false);
      }
    };

    fetchTestimonials();

    const channel = supabase
      .channel("testimonials_realtime_landing")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "testimonials" },
        () => {
          fetchTestimonials();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const [activeTestimonialPage, setActiveTestimonialPage] = React.useState(0);

  const displayTestimonials = React.useMemo(() => {
    if (testimonials.length === 0) return [];
    if (testimonials.length === 1) return testimonials.map((t, idx) => ({ ...t, _key: `${t.id}-${idx}` }));
    if (testimonials.length === 2) {
      return [
        { ...testimonials[0], _key: `${testimonials[0].id}-0` },
        { ...testimonials[1], _key: `${testimonials[1].id}-1` },
        { ...testimonials[0], _key: `${testimonials[0].id}-2` },
        { ...testimonials[1], _key: `${testimonials[1].id}-3` },
      ];
    }
    return testimonials.map((t, idx) => ({ ...t, _key: `${t.id}-${idx}` }));
  }, [testimonials]);

  const paginateTestimonial = React.useCallback(
    (newDirection: number) => {
      if (testimonials.length <= 1) return;
      setActiveTestimonialPage((prev) => prev + newDirection);
    },
    [testimonials.length]
  );

  const lastWheelTriggerRef = React.useRef<number>(0);
  const handleTestimonialWheel = React.useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (testimonials.length <= 1) return;
      const now = Date.now();
      if (now - lastWheelTriggerRef.current < 420) return;

      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (Math.abs(delta) > 15) {
        if (delta > 0) {
          // Scroll down / swipe right -> Next
          paginateTestimonial(1);
          lastWheelTriggerRef.current = now;
        } else if (delta < 0) {
          // Scroll up / swipe left -> Previous
          paginateTestimonial(-1);
          lastWheelTriggerRef.current = now;
        }
      }
    },
    [testimonials.length, paginateTestimonial]
  );

  // Direct touch swipe handlers for mobile screens
  const touchStartXRef = React.useRef<number | null>(null);
  const touchStartYRef = React.useRef<number | null>(null);

  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = React.useCallback(
    (e: React.TouchEvent) => {
      if (touchStartXRef.current === null || touchStartYRef.current === null) return;
      const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
      const diffY = e.changedTouches[0].clientY - touchStartYRef.current;

      // Handle horizontal swipe or vertical swipe gestures on mobile
      if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX < 0) {
          paginateTestimonial(1);
        } else {
          paginateTestimonial(-1);
        }
      } else if (Math.abs(diffY) > 55) {
        if (diffY < 0) {
          paginateTestimonial(1);
        } else {
          paginateTestimonial(-1);
        }
      }

      touchStartXRef.current = null;
      touchStartYRef.current = null;
    },
    [paginateTestimonial]
  );

  // Webpage scroll listener for mobile (HP) & desktop: triggers when user scrolls the webpage past testimonials
  const testimonialSectionRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0;
    let accumulatedDelta = 0;
    let lastTriggerTime = 0;
    const SCROLL_THRESHOLD = 70; // 70px vertical page scroll to trigger next/prev slide on mobile

    const handlePageScroll = () => {
      if (!testimonialSectionRef.current || testimonials.length <= 1) return;
      const rect = testimonialSectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;

      // Trigger while testimonial section is visible on viewport
      const isVisible = rect.top < windowHeight * 0.85 && rect.bottom > windowHeight * 0.15;
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;

      if (!isVisible) {
        accumulatedDelta = 0;
        return;
      }

      accumulatedDelta += delta;
      const now = Date.now();

      if (now - lastTriggerTime > 300) {
        if (accumulatedDelta > SCROLL_THRESHOLD) {
          paginateTestimonial(1);
          accumulatedDelta = 0;
          lastTriggerTime = now;
        } else if (accumulatedDelta < -SCROLL_THRESHOLD) {
          paginateTestimonial(-1);
          accumulatedDelta = 0;
          lastTriggerTime = now;
        }
      }
    };

    window.addEventListener("scroll", handlePageScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handlePageScroll);
    };
  }, [testimonials.length, paginateTestimonial]);

  const getTestimonialDistance = (index: number, page: number, total: number) => {
    if (total <= 1) return 0;
    const currentIdx = ((page % total) + total) % total;
    let diff = index - currentIdx;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return diff;
  };

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
              { href: "#", label: isEn ? "Home" : "Beranda", active: true },
              { href: "#about", label: isEn ? "About Us" : "Tentang Kami" },
              { href: "#services", label: isEn ? "Services" : "Layanan" },
              { href: "#benefits", label: isEn ? "Why Choose Us" : "Keunggulan" },
              { href: "#testimonials", label: isEn ? "Testimonials" : "Testimoni" },
              { href: "#faq", label: isEn ? "FAQ" : "FAQ" },
              { href: "#reservation", label: isEn ? "Reservation" : "Reservasi" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleNavScroll(e, item.href)}
                className={cn(
                  "text-[13px] lg:text-[13.5px] tracking-[0.03em] transition-colors duration-200 font-sans cursor-pointer",
                  item.active
                    ? "text-[#9a6a43] font-medium"
                    : "text-stone-600 hover:text-stone-950 font-[350]"
                )}
              >
                {item.label}
              </a>
            ))}

            {/* Action Group: Shadcn Language Selector */}
            <div className="flex items-center pl-3 border-l border-stone-200">
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
                      { href: "#", label: isEn ? "Home" : "Beranda", active: true },
                      { href: "#about", label: isEn ? "About Us" : "Tentang Kami" },
                      { href: "#services", label: isEn ? "Services" : "Layanan" },
                      { href: "#benefits", label: isEn ? "Why Choose Us" : "Keunggulan" },
                      { href: "#testimonials", label: isEn ? "Testimonials" : "Testimoni" },
                      { href: "#faq", label: isEn ? "FAQ" : "FAQ" },
                      { href: "#reservation", label: isEn ? "Reservation" : "Reservasi" },
                    ].map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        onClick={(e) => handleMobileNavClick(e, item.href)}
                        className={cn(
                          "text-[14px] sm:text-[14.5px] font-sans tracking-[0.03em] py-2.5 px-1 border-b border-[#f0ece4] transition-colors flex items-center justify-between group cursor-pointer",
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

                <div className="pt-5 space-y-3.5 border-t border-[#eee8df]">
                  {/* Hero Outlined Style WhatsApp CTA */}
                  <button
                    type="button"
                    onClick={() => { setMobileMenuOpen(false); handleQuickBook(); }}
                    className="w-full py-3 px-4 border border-[#3c342f] text-[#3c342f] hover:bg-[#3c342f] hover:text-white flex items-center justify-center gap-2.5 text-xs tracking-[0.16em] uppercase font-normal transition-all duration-300 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{isEn ? "Book via WhatsApp" : "Pesan via WhatsApp"}</span>
                  </button>

                  {/* Seamless Language Selector for Mobile Drawer */}
                  <div className="pt-1 font-sans text-xs">
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-9 justify-between px-1.5 text-xs text-stone-700 hover:bg-stone-100/50 hover:text-stone-900 rounded-none font-normal cursor-pointer border-0 shadow-none bg-transparent transition-colors"
                          />
                        }
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Globe className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                          <span className="font-medium text-[#9a6a43] truncate">
                            {locale === "en" ? "English (EN)" : "Bahasa Indonesia (ID)"}
                          </span>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuItem
                          onClick={() => setLocale("en")}
                          className="flex items-center justify-between text-xs cursor-pointer py-2.5"
                        >
                          <span>English (EN)</span>
                          <Check className={cn("w-4 h-4 text-[#9a6a43]", locale !== "en" && "hidden")} />
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setLocale("id")}
                          className="flex items-center justify-between text-xs cursor-pointer py-2.5"
                        >
                          <span>Bahasa Indonesia (ID)</span>
                          <Check className={cn("w-4 h-4 text-[#9a6a43]", locale !== "id" && "hidden")} />
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
              ? "Relaxing massage to your doorstep."
              : "Pijat relaksasi ke rumah anda."}
          </p>

          {/* Book Now outlined button */}
          <a
            href="#reservation"
            onClick={(e) => handleNavScroll(e, "#reservation")}
            className="mt-6 sm:mt-8 inline-flex items-center justify-center px-8 sm:px-12 py-3 sm:py-3.5 border border-white/85 hover:border-white hover:bg-white/10 text-white text-xs sm:text-[13px] tracking-[0.16em] sm:tracking-[0.20em] uppercase font-normal transition-all duration-300 backdrop-blur-[2px] cursor-pointer"
          >
            <span>
              {isEn ? "Book Now" : "Pesan Sekarang"}
            </span>
          </a>
        </div>
      </section>

      {/* 3. ABOUT / NARRATIVE SECTION (Matching Reference Screenshot) */}
      <section id="about" className="scroll-mt-16 sm:scroll-mt-20 md:scroll-mt-24 py-14 sm:py-28 lg:py-36 bg-[#f6f3ee] text-stone-900 relative overflow-hidden">
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
                    SerenaRaga delivers comfortable and personalized massage<br className="hidden sm:inline" />
                    {" "}services in the comfort of your home
                  </>
                ) : (
                  <>
                    SerenaRaga menghadirkan layanan pijat panggilan yang nyaman<br className="hidden sm:inline" />
                    {" "}dan personal langsung ke hunian Anda
                  </>
                )}
              </h3>

              {/* Seamless Seren & Raga Philosophy Narrative */}
              <p className="text-[#685f58] text-[14px] sm:text-[15px] leading-relaxed font-sans font-[350] mt-5 sm:mt-6">
                {isEn
                  ? "Seren embodies the art of resting, where true peace begins at home. We bring the tranquility and harmony of professional massage directly into your private sanctuary without you needing to step outside. Your body is the home of your life; through the skilled touch of certified therapists who understand every point of fatigue, we restore your physical vitality and holistic wellbeing."
                  : "Seren memiliki arti istirahat, di mana istirahat sejati selalu bermula dari rumah. Kami membawa ketenangan dan keharmonisan pijat langsung ke ruang paling sakral bagi Anda tanpa perlu melangkah keluar. Tubuh adalah rumah bagi hidup Anda; dengan sentuhan terapis profesional yang memahami setiap titik lelah, kami memulihkan vitalitas dan harmoni fisik Anda secara menyeluruh."}
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
            <div className="md:max-w-sm lg:max-w-md">
              <p className="text-[#4a423d] text-[13.5px] sm:text-[14.5px] leading-relaxed font-sans font-[350]">
                {isEn
                  ? "SerenaRaga was born to restore the timeless harmony between body and soul. We believe the finest self-care unfolds within your most intimate sanctuary—your own home."
                  : "SerenaRaga terlahir untuk menghidupkan kembali harmoni antara tubuh dan jiwa. Kami percaya bahwa pemulihan diri terbaik selalu bermula dari ruang privat yang paling nyaman—rumah Anda sendiri."}
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
      <section id="services" className="scroll-mt-16 sm:scroll-mt-20 md:scroll-mt-24 py-14 sm:py-28 lg:py-32 bg-[#f6f3ee] text-stone-900 overflow-hidden">
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
                id: "traditional",
                title: "Traditional",
                titleId: "Pijat Tradisional",
                tagline: "Authentic Relaxation",
                taglineId: "Relaksasi Otentik",
                image: "/images/service-balinese.jpg",
                alt: "Traditional Massage Treatment",
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
          <div id="benefits" className="scroll-mt-16 sm:scroll-mt-20 md:scroll-mt-24 mt-14 sm:mt-28 lg:mt-32 pt-12 sm:pt-20 border-t border-stone-300/60 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 xl:gap-16 items-start">
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
                  titleEn: "Skilled Therapists",
                  titleId: "Terapis Terampil",
                  descEn: "All our therapists are professionally trained and certified to premium spa standards.",
                  descId: "Seluruh terapis kami terlatih profesional dan setara standar spa premium.",
                },
                {
                  titleEn: "Guaranteed Privacy",
                  titleId: "Privasi Terjaga",
                  descEn: "Enjoy a relaxing massage in your own private sanctuary without interacting with others.",
                  descId: "Nikmati pijat relaksasi di ruang aman tanpa berinteraksi dengan pelanggan lain.",
                },
                {
                  titleEn: "Time Saving",
                  titleId: "Hemat Waktu",
                  descEn: "Free from traffic and queues. Let our professional therapist come directly to you.",
                  descId: "Bebas macet dan antre. Biar terapis kami yang datang ke lokasi Anda.",
                },
                {
                  titleEn: "Hygienic Equipment",
                  titleId: "Alat Higienis",
                  descEn: "Massage linens, mats, and aromatherapy oils are always fresh, sanitized, and pristine.",
                  descId: "Alas pijat dan minyak aromaterapi selalu bersih, wangi, dan disanitasi.",
                },
                {
                  titleEn: "Transparent Pricing",
                  titleId: "Harga Transparan",
                  descEn: "Honest all-inclusive rates with no hidden fees.",
                  descId: "Tidak ada biaya tersembunyi.",
                },
                {
                  titleEn: "Flexible Scheduling",
                  titleId: "Jadwal Fleksibel",
                  descEn: "Ready to serve daily. Feel free to set your own preferred therapy schedule.",
                  descId: "Kami siap melayani setiap hari. Bebas tentukan waktu terapi Anda.",
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
      <section id="testimonials" className="scroll-mt-16 sm:scroll-mt-20 md:scroll-mt-24 py-14 sm:py-24 lg:py-28 bg-[#241c17] text-stone-100 border-t border-stone-800/80 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 space-y-12 sm:space-y-20 lg:space-y-24">
          
          {/* PART 1: CUSTOMER TESTIMONIALS (VERTICAL SCREENSHOT, NO BORDER, NO ROUNDED CORNER) */}
          {isLoadingTestimonials ? (
            /* Stable Loading Skeleton - Zero Layout Shift or Flickering */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-center animate-pulse">
              <div className="lg:col-span-6 xl:col-span-6 flex justify-center lg:justify-start">
                <div className="w-full max-w-[360px] sm:max-w-[400px] aspect-[9/14] bg-stone-900/60" />
              </div>
              <div className="lg:col-span-6 xl:col-span-6 space-y-6">
                <div className="h-12 w-3/4 bg-stone-900/60" />
                <div className="h-4 w-1/2 bg-stone-900/40" />
              </div>
            </div>
          ) : testimonials.length > 0 ? (
            <div ref={testimonialSectionRef} className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-center">
              {/* Left: Physical Pushing Screenshot Carousel (Center Main, Left & Right Flanking Slides) */}
              <div className="lg:col-span-6 xl:col-span-6 flex justify-center items-center">
                <div
                  onWheel={handleTestimonialWheel}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  className="relative w-full max-w-[460px] sm:max-w-[500px] lg:max-w-[540px] h-[480px] sm:h-[540px] md:h-[580px] flex items-center justify-center select-none overflow-hidden sm:overflow-visible"
                >
                  {displayTestimonials.map((item, idx) => {
                    const dist = getTestimonialDistance(idx, activeTestimonialPage, displayTestimonials.length);
                    const isCenter = dist === 0;
                    const isLeft = dist === -1;
                    const isRight = dist === 1;
                    const isVisible = isCenter || isLeft || isRight;

                    // Snug / Mepet physical push offsets:
                    let xOffset = "0%";
                    if (dist === -1) xOffset = "-48%";
                    else if (dist === 1) xOffset = "48%";
                    else if (dist > 1) xOffset = "120%";
                    else if (dist < -1) xOffset = "-120%";

                    return (
                      <motion.div
                        key={item._key || `${item.id}-${idx}`}
                        animate={{
                          x: xOffset,
                          scale: isCenter ? 1 : isVisible ? 0.82 : 0.65,
                          opacity: isVisible ? 1 : 0,
                          filter: isCenter ? "brightness(1)" : isVisible ? "brightness(0.65)" : "brightness(0.5)",
                          zIndex: isCenter ? 20 : isVisible ? 10 : 0,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 240,
                          damping: 26,
                          mass: 0.9,
                        }}
                        onClick={() => {
                          if (isLeft) paginateTestimonial(-1);
                          if (isRight) paginateTestimonial(1);
                        }}
                        className={`absolute w-[62%] sm:w-[66%] max-h-[560px] flex items-center justify-center select-none ${
                          isCenter
                            ? "cursor-grab active:cursor-grabbing pointer-events-auto"
                            : isVisible
                            ? "cursor-pointer pointer-events-auto"
                            : "pointer-events-none"
                        }`}
                        drag={isCenter ? "x" : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.25}
                        onDragEnd={
                          isCenter
                            ? (e, { offset, velocity }) => {
                                const swipe = Math.abs(offset.x) * velocity.x;
                                if (swipe < -600 || offset.x < -40) {
                                  paginateTestimonial(1);
                                } else if (swipe > 600 || offset.x > 40) {
                                  paginateTestimonial(-1);
                                }
                              }
                            : undefined
                        }
                      >
                        <img
                          src={item.image_url}
                          alt={item.customer_name || "WhatsApp Client Review Screenshot"}
                          className="w-full h-auto max-h-[520px] sm:max-h-[560px] object-contain rounded-none border-0 shadow-none outline-none ring-0 pointer-events-none"
                          draggable={false}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Right: Section Title, Subtitle Description & Carousel Navigation */}
              <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center space-y-6 lg:pl-2">
                <h2
                  className="text-3xl sm:text-4xl lg:text-[44px] xl:text-[50px] text-stone-100 font-normal tracking-tight leading-[1.15]"
                  style={{ fontFamily: "var(--font-gallient), Georgia, serif" }}
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

                {/* Subtitle / Sub Judul Description */}
                <p className="text-stone-300 text-sm sm:text-[15px] font-light leading-relaxed max-w-xl">
                  {isEn
                    ? "All client experiences shown are genuine feedback and authentic WhatsApp conversations directly from our valued clients after their massage sessions."
                    : "Seluruh ulasan dan kepuasan pelanggan Serena Raga merupakan tangkapan layar percakapan asli langsung dari WhatsApp setelah menikmati sesi pijat relaksasi kami."}
                </p>

                {/* Navigation Circular Arrows */}
                {testimonials.length > 1 && (
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => paginateTestimonial(-1)}
                      className="w-11 h-11 rounded-full bg-[#3a2e26] hover:bg-[#4a3b32] text-stone-300 flex items-center justify-center transition-colors cursor-pointer"
                      aria-label="Previous Testimonial"
                    >
                      <ArrowLeft className="w-4 h-4 stroke-[1.5]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => paginateTestimonial(1)}
                      className="w-11 h-11 rounded-full bg-[#eed7a1] hover:bg-[#e4cb91] text-[#241c17] flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                      aria-label="Next Testimonial"
                    >
                      <ArrowRight className="w-4 h-4 stroke-[1.5]" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Graceful Empty State when database is awaiting uploads */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-center">
              <div className="lg:col-span-6 xl:col-span-6 flex justify-center lg:justify-start">
                <div className="w-full max-w-[360px] sm:max-w-[420px] aspect-[9/13] bg-stone-900/40 flex flex-col items-center justify-center p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#eed7a1]/10 text-[#eed7a1] flex items-center justify-center">
                    <MessageSquareQuote className="w-6 h-6" />
                  </div>
                  <p className="text-stone-300 text-xs sm:text-sm font-medium">
                    {isEn ? "Authentic WhatsApp Screenshots" : "Screenshot Chat WhatsApp Pelanggan"}
                  </p>
                  <p className="text-stone-500 text-[11px] max-w-xs font-light">
                    {isEn
                      ? "Screenshots uploaded via Admin Dashboard will appear here."
                      : "Screenshot ulasan asli dari WhatsApp yang diunggah via Admin Dashboard akan tampil di sini."}
                  </p>
                </div>
              </div>

              <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center space-y-6 lg:pl-2">
                <h2
                  className="text-3xl sm:text-4xl lg:text-[44px] xl:text-[50px] text-stone-100 font-normal tracking-tight leading-[1.15]"
                  style={{ fontFamily: "var(--font-gallient), Georgia, serif" }}
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

                <p className="text-stone-300 text-sm sm:text-[15px] font-light leading-relaxed max-w-xl">
                  {isEn
                    ? "All client experiences shown are genuine feedback and authentic WhatsApp conversations directly from our valued clients after their massage sessions."
                    : "Seluruh ulasan dan kepuasan pelanggan Serena Raga merupakan tangkapan layar percakapan asli langsung dari WhatsApp setelah menikmati sesi pijat relaksasi kami."}
                </p>
              </div>
            </div>
          )}

          {/* PART 2: FREQUENTLY ASKED QUESTIONS (FAQS) */}
          <div id="faq" className="scroll-mt-16 sm:scroll-mt-20 md:scroll-mt-24 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start pt-10 sm:pt-16 border-t border-stone-800/60">
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

              {/* Clean Luxury Accordion using official Shadcn Base UI */}
              <Accordion
                defaultValue={["faq-0"]}
                className="space-y-2 pt-1 w-full"
              >
                {FAQ_ITEMS.map((item, idx) => (
                  <AccordionItem
                    key={idx}
                    value={`faq-${idx}`}
                    className="border-b border-stone-800/80 pb-2.5 transition-colors"
                  >
                    <AccordionTrigger
                      showChevron={false}
                      className="w-full flex items-center justify-between text-left py-2 gap-3 group/accordion-trigger cursor-pointer hover:no-underline"
                    >
                      <span className="text-[13px] sm:text-[14.5px] font-medium text-stone-100 group-hover/accordion-trigger:text-[#eed7a1] transition-colors">
                        {isEn ? item.q_en : item.q_id}
                      </span>
                      <span className="text-stone-400 shrink-0 ml-auto pl-3">
                        <Plus className="w-4 h-4 text-stone-400 group-hover/accordion-trigger:text-stone-200 group-aria-expanded/accordion-trigger:hidden block" />
                        <Minus className="w-4 h-4 text-stone-300 group-aria-expanded/accordion-trigger:block hidden" />
                      </span>
                    </AccordionTrigger>

                    <AccordionContent className="pt-1 pb-1 pr-2 text-xs sm:text-[13px] text-stone-400 font-light leading-relaxed">
                      {isEn ? item.a_en : item.a_id}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
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
      <section id="reservation" className="scroll-mt-16 sm:scroll-mt-20 md:scroll-mt-24 relative py-14 sm:py-24 lg:py-28 overflow-hidden bg-[#18120f] border-t border-stone-800 flex items-center justify-center">
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
                    Book your relaxing <br />
                    massage session now
                  </>
                ) : (
                  <>
                    Pesan sesi pijat <br />
                    relaksasi Anda sekarang
                  </>
                )}
              </h2>

              {/* Subtitle */}
              <p className="text-xs sm:text-[14px] text-stone-200/90 font-light tracking-wide mt-2.5 sm:mt-4 max-w-xl mx-auto">
                {isEn
                  ? "Escape. Relax. Rejuvenate. In the comfort of your home."
                  : "Lepaskan kepenatan dan nikmati kenyamanan relaksasi di hunian Anda."}
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
                    href={`https://wa.me/${cleanWhatsAppNumber(settings.whatsapp_number)}`}
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
                  <a
                    href={`https://wa.me/${cleanWhatsAppNumber(settings.whatsapp_number)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-[14px] text-white hover:text-[#eed8a1] font-medium underline underline-offset-4 cursor-pointer transition-colors block mx-auto"
                    suppressHydrationWarning
                  >
                    {isEn ? "Book Now" : "Pesan Sekarang"}
                  </a>
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
                  ? `Serving All of ${settings.service_areas ? settings.service_areas.split(",")[0].trim() : "Yogyakarta"} – Hotels, Private Residences & More`
                  : `Melayani Seluruh ${settings.service_areas || "Wilayah Yogyakarta & Sekitarnya"} – Hotel, Rumah Tinggal & Apartemen`}
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

      {/* 11. LUXURY EDITORIAL FOOTER (CLEAN MINIMALIST SIGNATURE) */}
      <footer className="bg-white text-stone-800 border-t border-stone-200 text-xs sm:text-[13px] pt-14 sm:pt-16 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Centered Brand & Contact Info */}
          <div className="flex flex-col items-center text-center space-y-3 max-w-md mx-auto">
            {/* Centered Brand Logo */}
            <Link href="/" className="inline-flex items-center hover:opacity-85 transition-opacity">
              <BrandLogo variant="full" className="h-9 sm:h-11 w-auto text-stone-900" />
            </Link>

            {/* Address */}
            <div className="flex items-center justify-center gap-2 text-stone-600 font-light text-xs sm:text-[13px] pt-1" suppressHydrationWarning>
              <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <span>{settings.service_areas || "Yogyakarta, Sleman, Bantul, & Sekitarnya"}</span>
            </div>

            {/* Phone / WhatsApp */}
            <div className="flex items-center justify-center gap-2 text-stone-600 font-mono text-xs sm:text-[13px]" suppressHydrationWarning>
              <Phone className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <a
                href={`https://wa.me/${cleanWhatsAppNumber(settings.whatsapp_number)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-stone-900 transition-colors"
                suppressHydrationWarning
              >
                {formatDisplayPhone(settings.whatsapp_number)}
              </a>
            </div>

            {/* Email */}
            <div className="flex items-center justify-center gap-2 text-stone-600 font-mono text-xs sm:text-[13px]" suppressHydrationWarning>
              <Mail className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <a
                href={`mailto:${settings.email || "info@serenaraga.com"}`}
                className="hover:text-stone-900 transition-colors"
                suppressHydrationWarning
              >
                {settings.email || "info@serenaraga.com"}
              </a>
            </div>

            {/* Circular Social Media Icons Grid (Matching User Reference) */}
            <div className="flex items-center justify-center gap-3 pt-4 pb-1">
              {/* Instagram */}
              <a
                href={getInstagramUrl(settings.instagram_handle)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#6f665e] hover:bg-[#5a524b] text-[#f6f3ee] flex items-center justify-center transition-all duration-300 shadow-sm hover:scale-105 cursor-pointer"
                suppressHydrationWarning
              >
                <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>

              {/* TikTok */}
              <a
                href={getTikTokUrl(settings.tiktok_handle)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#6f665e] hover:bg-[#5a524b] text-[#f6f3ee] flex items-center justify-center transition-all duration-300 shadow-sm hover:scale-105 cursor-pointer"
                suppressHydrationWarning
              >
                <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.86-4.49V8.62a8.3 8.3 0 0 0 4.91 1.6V6.77a4.87 4.87 0 0 1-1-.08z" />
                </svg>
              </a>

              {/* Facebook */}
              <a
                href={getFacebookUrl(settings.facebook_url)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#6f665e] hover:bg-[#5a524b] text-[#f6f3ee] flex items-center justify-center transition-all duration-300 shadow-sm hover:scale-105 cursor-pointer"
                suppressHydrationWarning
              >
                <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>

              {/* Threads */}
              <a
                href={getThreadsUrl(settings.threads_handle)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Threads"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#6f665e] hover:bg-[#5a524b] text-[#f6f3ee] flex items-center justify-center transition-all duration-300 shadow-sm hover:scale-105 cursor-pointer"
                suppressHydrationWarning
              >
                <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-current" viewBox="0 0 512 512">
                  <path d="M363.2 239.6c-1.9-.9-3.9-1.8-5.9-2.7c-3.5-63.7-38.3-100.2-96.7-100.6h-.8c-35 0-64 14.9-81.9 42.1l32.2 22.1c13.4-20.3 34.4-24.6 49.8-24.6h.5c19.2.1 33.8 5.7 43.2 16.6c6.8 7.9 11.4 18.9 13.7 32.8c-17.1-2.9-35.5-3.8-55.3-2.7c-55.6 3.2-91.3 35.6-88.9 80.7c1.2 22.8 12.6 42.5 32 55.3c16.4 10.9 37.6 16.2 59.6 15c29.1-1.6 51.9-12.7 67.8-33c12.1-15.4 19.7-35.4 23.1-60.5c13.9 8.4 24.1 19.4 29.8 32.6c9.6 22.5 10.2 59.4-19.9 89.5c-26.4 26.4-58.2 37.8-106.1 38.2c-53.2-.4-93.5-17.5-119.6-50.7c-24.5-31.2-37.2-76.1-37.6-133.7c.5-57.6 13.1-102.6 37.6-133.7C166 89 206.2 72 259.4 71.6c53.6.4 94.6 17.5 121.7 51c13.3 16.4 23.4 37 30 61l37.7-10.1c-8-29.6-20.7-55.1-37.8-76.2c-34.8-42.9-85.8-64.8-151.4-65.3h-.3c-65.5.5-115.9 22.5-149.7 65.5c-30.1 38.3-45.6 91.6-46.2 158.3v.4c.5 66.8 16.1 120 46.2 158.3c33.8 43 84.2 65.1 149.7 65.5h.3c58.2-.4 99.3-15.7 133.1-49.4C436.9 386.4 435.6 331 421 297c-10.5-24.4-30.4-44.2-57.7-57.3Zm-100.6 94.6c-24.4 1.4-49.7-9.6-50.9-33c-.9-17.4 12.4-36.7 52.4-39c4.6-.3 9.1-.4 13.5-.4c14.5 0 28.2 1.4 40.5 4.1c-4.6 57.6-31.7 67-55.5 68.3" />
                </svg>
              </a>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="mt-8 pt-6 border-t border-stone-200/80 text-center text-xs text-stone-500 font-light" suppressHydrationWarning>
            Copyright {new Date().getFullYear()} {settings.brand_name ? settings.brand_name.toUpperCase() : "SERENA RAGA"}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
