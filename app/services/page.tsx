"use client";

import * as React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import {
  useBrandSettings,
  cleanWhatsAppNumber,
  formatDisplayPhone,
  getInstagramUrl,
  getTikTokUrl,
  getFacebookUrl,
  getThreadsUrl,
  buildWhatsAppInboundMessage,
  buildWhatsAppServiceBookingMessage,
  getWhatsAppUrl,
} from "@/lib/brand-settings";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sparkles,
  Clock,
  MapPin,
  Check,
  MessageCircle,
  Phone,
  Mail,
  ArrowLeft,
  ChevronRight,
  Globe,
  ChevronDown,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { cn, formatIDR } from "@/lib/utils";

interface ServiceItem {
  id: number;
  name: string;
  category: string;
  duration_minutes: number;
  price: number;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at?: string;
  consumables_cost?: number;
}

// Category display mapping for bilingual support
const CATEGORY_TRANSLATIONS: Record<string, { id: string; en: string }> = {
  "Massage Packages": { id: "Paket Pijat", en: "Massage Packages" },
  "Paket Pijat": { id: "Paket Pijat", en: "Massage Packages" },
  "Massage Services": { id: "Layanan Pijat", en: "Massage Services" },
  "Layanan Pijat": { id: "Layanan Pijat", en: "Massage Services" },
  "Refleksi Service": { id: "Refleksi", en: "Reflexology" },
  "Refleksi": { id: "Refleksi", en: "Reflexology" },
  "Kids & Mom Services": { id: "Ibu & Anak", en: "Kids & Mom" },
  "Ibu & Anak": { id: "Ibu & Anak", en: "Kids & Mom" },
  "Couple Package": { id: "Paket Couple", en: "Couple Packages" },
  "Paket Couple": { id: "Paket Couple", en: "Couple Packages" },
  "Add-On Service": { id: "Layanan Tambahan", en: "Add-On Services" },
  "Layanan Tambahan": { id: "Layanan Tambahan", en: "Add-On Services" },
  "Full Body Massage": { id: "Pijat Seluruh Tubuh", en: "Full Body Massage" },
  "Holistic Wellness": { id: "Kebugaran Holistik", en: "Holistic Wellness" },
  "Therapeutic": { id: "Terapi Pemulihan", en: "Therapeutic" },
  "Body Glow & Spa": { id: "Spa & Lulur", en: "Body Glow & Spa" },
  "Targeted Relief": { id: "Refleksi Terarah", en: "Targeted Relief" },
  "Maternal Wellness": { id: "Perawatan Ibu Hamil", en: "Maternal Wellness" },
};

export default function ServicesPage() {
  const { settings } = useBrandSettings();
  const [locale, setLocale] = React.useState<"id" | "en">("en");
  const isEn = locale === "en";

  const [services, setServices] = React.useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Filter States
  const [selectedCategory, setSelectedCategory] = React.useState<string>("Layanan Pijat");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [durationFilter, setDurationFilter] = React.useState<string>("all");
  const [sortBy, setSortBy] = React.useState<"default" | "price_asc" | "price_desc" | "duration_desc">("default");

  // Fetch Services from Supabase
  const fetchServices = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("id", { ascending: true });

      if (!error && data) {
        setServices(data);
        if (data.length > 0) {
          const match = data.find(
            (s: ServiceItem) =>
              s.category?.toLowerCase() === "layanan pijat" ||
              s.category?.toLowerCase() === "massage services"
          );
          if (match?.category) {
            setSelectedCategory(match.category);
          } else if (data[0]?.category) {
            setSelectedCategory(data[0].category);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch services:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchServices();

    // Subscribe to realtime database changes from admin dashboard
    const channelName = `services_realtime_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "services" },
        () => {
          fetchServices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchServices]);

  // Derived Dynamic Categories (Ensuring 'Massage Services' is 1st and 'Massage Packages' is 2nd)
  const categoriesList = React.useMemo(() => {
    const set = new Set<string>();
    services.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    const list = Array.from(set);
    return list.sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      const getPriority = (name: string) => {
        if (name === "layanan pijat" || name === "massage services") return 1;
        if (name === "paket pijat" || name === "massage packages") return 2;
        return 99;
      };
      const pA = getPriority(aLower);
      const pB = getPriority(bLower);
      if (pA !== pB) return pA - pB;
      return a.localeCompare(b);
    });
  }, [services]);

  // Derived Default Category (Massage Services / Layanan Pijat)
  const defaultCategory = React.useMemo(() => {
    if (categoriesList.length === 0) return "Layanan Pijat";
    const found = categoriesList.find(
      (c) => c.toLowerCase() === "layanan pijat" || c.toLowerCase() === "massage services"
    );
    return found || categoriesList[0];
  }, [categoriesList]);

  // Check if filters are dirty / modified from defaults
  const isFiltersActive = React.useMemo(() => {
    return (
      (selectedCategory !== defaultCategory && selectedCategory !== "") ||
      searchQuery.trim() !== "" ||
      durationFilter !== "all" ||
      sortBy !== "default"
    );
  }, [selectedCategory, defaultCategory, searchQuery, durationFilter, sortBy]);

  const handleResetFilters = React.useCallback(() => {
    setSelectedCategory(defaultCategory);
    setSearchQuery("");
    setDurationFilter("all");
    setSortBy("default");
  }, [defaultCategory]);

  // Category Translation Helper
  const getCategoryLabel = React.useCallback((cat: string) => {
    if (CATEGORY_TRANSLATIONS[cat]) {
      return isEn ? CATEGORY_TRANSLATIONS[cat].en : CATEGORY_TRANSLATIONS[cat].id;
    }
    return cat;
  }, [isEn]);

  // Filter and Sort Services
  const filteredServices = React.useMemo(() => {
    return services
      .filter((s) => {
        // Category filter
        if (selectedCategory && s.category !== selectedCategory) {
          return false;
        }

        // Duration filter
        if (durationFilter === "short" && (s.duration_minutes || 0) > 45) return false;
        if (durationFilter === "medium" && ((s.duration_minutes || 0) < 60 || (s.duration_minutes || 0) > 95)) return false;
        if (durationFilter === "long" && (s.duration_minutes || 0) < 100) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = s.name.toLowerCase().includes(q);
          const matchDesc = s.description?.toLowerCase().includes(q) || false;
          const matchCat = s.category?.toLowerCase().includes(q) || false;
          if (!matchName && !matchDesc && !matchCat) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") return a.price - b.price;
        if (sortBy === "price_desc") return b.price - a.price;
        if (sortBy === "duration_desc") return (b.duration_minutes || 0) - (a.duration_minutes || 0);
        return a.id - b.id;
      });
  }, [services, selectedCategory, durationFilter, searchQuery, sortBy]);

  // Category counts
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: services.length };
    services.forEach((s) => {
      const cat = s.category || "Other";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [services]);

  // WhatsApp Booking Action Generator (Using Dedicated Book Treatment Inbound Setting)
  const handleBookService = (service: ServiceItem) => {
    const brandName = settings.brand_name || "Serena Raga";
    const durationText = service.duration_minutes ? `${service.duration_minutes} Menit` : "";
    const priceText = formatIDR(service.price);

    const message = buildWhatsAppServiceBookingMessage({
      template: settings.wa_service_book_message_template,
      brandName,
      serviceName: service.name,
      detailTreatment: service.description,
      durationText,
      priceText,
    });

    const url = getWhatsAppUrl(settings.whatsapp_number, message);
    window.open(url, "_blank");
  };

  // Consultation WhatsApp Action (Synchronized with Admin Dashboard Inbound Setting)
  const handleConsultation = () => {
    const brandName = settings.brand_name || "Serena Raga";
    const message = buildWhatsAppInboundMessage({
      template: settings.wa_support_default_message,
      brandName,
      isEn,
    });

    const url = getWhatsAppUrl(settings.whatsapp_number, message);
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#f6f3ee] text-stone-900 font-sans antialiased selection:bg-[#8b5e3c]/30 selection:text-[#2b2420]">
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
              { href: "/", label: isEn ? "Home" : "Beranda" },
              { href: "/#about", label: isEn ? "About Us" : "Tentang Kami" },
              { href: "/services", label: isEn ? "Services Catalog" : "Katalog Layanan", active: true },
              { href: "/#benefits", label: isEn ? "Why Choose Us" : "Keunggulan" },
              { href: "/#testimonials", label: isEn ? "Testimonials" : "Testimoni" },
              { href: "/#reservation", label: isEn ? "Reservation" : "Reservasi" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "text-[13px] lg:text-[13.5px] tracking-[0.03em] transition-colors duration-200 font-sans cursor-pointer",
                  item.active
                    ? "text-[#9a6a43] font-medium"
                    : "text-stone-600 hover:text-stone-950 font-[350]"
                )}
              >
                {item.label}
              </Link>
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

              <SheetContent
                side="right"
                className="bg-[#fcfaf7] border-l border-[#ebe6df] text-stone-900 p-5 sm:p-7 w-[300px] sm:w-[340px] max-w-[85vw] flex flex-col justify-between shadow-2xl overflow-y-auto max-h-screen"
              >
                <div>
                  <SheetHeader className="text-left pb-4 border-b border-[#eee8df] mb-2 p-0">
                    <SheetTitle className="text-stone-900 flex items-center">
                      <BrandLogo variant="full" className="h-7 sm:h-8 w-auto" />
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col py-2">
                    {[
                      { href: "/", label: isEn ? "Home" : "Beranda" },
                      { href: "/#about", label: isEn ? "About Us" : "Tentang Kami" },
                      { href: "/services", label: isEn ? "Services Catalog" : "Katalog Layanan", active: true },
                      { href: "/#benefits", label: isEn ? "Why Choose Us" : "Keunggulan" },
                      { href: "/#testimonials", label: isEn ? "Testimonials" : "Testimoni" },
                      { href: "/#faq", label: isEn ? "FAQ" : "FAQ" },
                      { href: "/#reservation", label: isEn ? "Reservation" : "Reservasi" },
                    ].map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "text-[14px] sm:text-[14.5px] font-sans tracking-[0.03em] py-2.5 px-1 border-b border-[#f0ece4] transition-colors flex items-center justify-between group cursor-pointer",
                          item.active
                            ? "text-[#9a6a43] font-medium"
                            : "text-[#3c342f] hover:text-[#9a6a43] font-[350]"
                        )}
                      >
                        <span>{item.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-[#9a6a43] group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    ))}
                  </nav>
                </div>

                <div className="pt-5 space-y-3.5 border-t border-[#eee8df]">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleConsultation();
                    }}
                    className="w-full py-3 px-4 border border-[#3c342f] text-[#3c342f] hover:bg-[#3c342f] hover:text-white flex items-center justify-center gap-2.5 text-xs tracking-[0.16em] uppercase font-normal transition-all duration-300 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{isEn ? "Book via WhatsApp" : "Pesan via WhatsApp"}</span>
                  </button>

                  <div className="pt-1 font-sans text-xs">
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-9 justify-between px-1.5 text-xs text-stone-700 hover:bg-stone-100/50 rounded-none font-normal cursor-pointer border-0 shadow-none bg-transparent"
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

      {/* 3. HERO / CATALOG HEADER (Cinematic Sanctuary Aesthetic) */}
      <section className="relative w-full py-14 sm:py-20 lg:py-24 bg-stone-950 text-stone-100 overflow-hidden border-b border-stone-800/80">
        {/* Full-bleed Luxury Background Photo */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-sanctuary.jpg"
            alt="Serena Raga Sanctuary Wellness Treatments"
            className="w-full h-full object-cover object-[center_35%]"
          />
          {/* Subtle warm luxury dark gradient overlay for optimal text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs text-stone-300 mb-4 sm:mb-6">
            <Link href="/" className="hover:text-amber-200 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" />
              <span>{isEn ? "Home" : "Beranda"}</span>
            </Link>
            <span>/</span>
            <span className="text-amber-100/95 font-medium">
              {isEn ? "Treatment Menu" : "Katalog Layanan"}
            </span>
          </div>

          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl text-white font-normal tracking-tight font-gallient leading-[1.1] drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
              {isEn ? "Bespoke Treatments & Therapies" : "Layanan & Menu Perawatan"}
            </h1>

            <p className="text-xs sm:text-base text-stone-200/95 font-light leading-relaxed mt-4 max-w-2xl drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]">
              {isEn
                ? "Experience authentic therapeutic massage, traditional reflexology, organic body scrubs, and tailored wellness rituals delivered right to your home, villa, or hotel in Yogyakarta."
                : "Temukan pilihan lengkap pijat terapeutik tradisional, spa & lulur herbal, refleksi, perawatan ibu & anak, hingga paket pasangan yang dihadirkan langsung ke tempat tinggal, hotel, atau villa Anda di Yogyakarta."}
            </p>
          </div>
        </div>
      </section>

      {/* 4. SEARCH & FILTER CONTROLS BAR (Sticky-Ready & Crisp) */}
      <section className="bg-white border-b border-stone-200/90 py-5 sm:py-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-5">
          {/* Search Input & Sort Options Bar (Seamless & Borderless) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-4 items-center pb-1">
            {/* Search Box */}
            <div className="md:col-span-7 lg:col-span-8 relative">
              <Search className="absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
              <Input
                type="text"
                placeholder={
                  isEn
                    ? "Search treatment name, technique, or keyword (e.g. Balinese, Totok, Couple)..."
                    : "Cari nama layanan, teknik, atau kata kunci (contoh: Tradisional, Totok Wajah, Couple)..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-8 h-10 bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 rounded-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Duration Filter */}
            <div className="md:col-span-3 lg:col-span-2">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      className="w-full h-10 justify-between text-xs border-0 bg-transparent hover:bg-stone-100/60 text-stone-800 font-normal shadow-none cursor-pointer rounded-none px-2"
                    />
                  }
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Clock className="w-3.5 h-3.5 text-stone-500" />
                    <span className="truncate">
                      {durationFilter === "all"
                        ? isEn
                          ? "All Durations"
                          : "Semua Durasi"
                        : durationFilter === "short"
                        ? "≤ 45 Menit"
                        : durationFilter === "medium"
                        ? "60 - 95 Menit"
                        : "≥ 100 Menit"}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => setDurationFilter("all")}
                    className="text-xs cursor-pointer justify-between"
                  >
                    <span>{isEn ? "All Durations" : "Semua Durasi"}</span>
                    {durationFilter === "all" && <Check className="w-3.5 h-3.5 text-[#9a6a43]" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDurationFilter("short")}
                    className="text-xs cursor-pointer justify-between"
                  >
                    <span>≤ 45 Menit (Singkat / Add-On)</span>
                    {durationFilter === "short" && <Check className="w-3.5 h-3.5 text-[#9a6a43]" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDurationFilter("medium")}
                    className="text-xs cursor-pointer justify-between"
                  >
                    <span>60 – 95 Menit (Standar)</span>
                    {durationFilter === "medium" && <Check className="w-3.5 h-3.5 text-[#9a6a43]" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDurationFilter("long")}
                    className="text-xs cursor-pointer justify-between"
                  >
                    <span>≥ 100 Menit (Paket Komplit)</span>
                    {durationFilter === "long" && <Check className="w-3.5 h-3.5 text-[#9a6a43]" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Price / Sort Dropdown */}
            <div className="md:col-span-2 lg:col-span-2">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      className="w-full h-10 justify-between text-xs border-0 bg-transparent hover:bg-stone-100/60 text-stone-800 font-normal shadow-none cursor-pointer rounded-none px-2"
                    />
                  }
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500" />
                    <span className="truncate">
                      {sortBy === "default"
                        ? isEn
                          ? "Featured"
                          : "Rekomendasi"
                        : sortBy === "price_asc"
                        ? isEn
                          ? "Price: Low to High"
                          : "Harga Terendah"
                        : sortBy === "price_desc"
                        ? isEn
                          ? "Price: High to Low"
                          : "Harga Tertinggi"
                        : isEn
                        ? "Longest Duration"
                        : "Durasi Terpanjang"}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem
                    onClick={() => setSortBy("default")}
                    className="text-xs cursor-pointer justify-between"
                  >
                    <span>{isEn ? "Featured / Default" : "Rekomendasi / Standar"}</span>
                    {sortBy === "default" && <Check className="w-3.5 h-3.5 text-[#9a6a43]" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSortBy("price_asc")}
                    className="text-xs cursor-pointer justify-between"
                  >
                    <span>{isEn ? "Price: Lowest to Highest" : "Harga: Terendah ke Tertinggi"}</span>
                    {sortBy === "price_asc" && <Check className="w-3.5 h-3.5 text-[#9a6a43]" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSortBy("price_desc")}
                    className="text-xs cursor-pointer justify-between"
                  >
                    <span>{isEn ? "Price: Highest to Lowest" : "Harga: Tertinggi ke Terendah"}</span>
                    {sortBy === "price_desc" && <Check className="w-3.5 h-3.5 text-[#9a6a43]" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSortBy("duration_desc")}
                    className="text-xs cursor-pointer justify-between"
                  >
                    <span>{isEn ? "Duration: Longest First" : "Durasi: Terlama ke Tercepat"}</span>
                    {sortBy === "duration_desc" && <Check className="w-3.5 h-3.5 text-[#9a6a43]" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Interactive Category Filter Tabs (Clean, Minimalist & Seamless) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto pb-1.5 pt-1 no-scrollbar text-xs sm:text-sm">
            {categoriesList.map((cat) => {
              const isActive = selectedCategory === cat;
              const count = categoryCounts[cat] || 0;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-4 py-2 rounded-full text-[13px] sm:text-[14px] whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 cursor-pointer border-0",
                    isActive
                      ? "bg-[#947864] text-white font-medium shadow-sm"
                      : "bg-transparent text-stone-600 hover:text-stone-950 hover:bg-stone-100/70 font-normal"
                  )}
                >
                  <span>{getCategoryLabel(cat)}</span>
                  <span
                    className={cn(
                      "text-[11px] sm:text-xs",
                      isActive ? "text-stone-200" : "text-stone-400"
                    )}
                  >
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. SERVICES CATALOG LIST / GRID */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* Results Counter & Active Filters Tag Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-stone-300/60 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-gallient text-[#1c1815] font-normal leading-tight">
              {getCategoryLabel(selectedCategory)}
            </h2>
            <p className="text-xs sm:text-[13px] text-stone-500 font-light mt-1">
              {isEn
                ? `Displaying ${filteredServices.length} available treatment${filteredServices.length === 1 ? "" : "s"}`
                : `Menampilkan ${filteredServices.length} pilihan layanan aktif`}
            </p>
          </div>

          {/* Quick Clear Filter if modified from default */}
          {isFiltersActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs text-[#947864] hover:text-[#7e6451] h-8 px-2.5 self-start sm:self-auto cursor-pointer"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              <span>{isEn ? "Reset All Filters" : "Hapus Semua Filter"}</span>
            </Button>
          )}
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5 lg:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-none border border-stone-200/80 p-3.5 sm:p-5 lg:p-6 space-y-3 sm:space-y-4 animate-pulse shadow-sm"
              >
                <div className="flex justify-between items-center gap-1">
                  <div className="h-3.5 sm:h-4 bg-stone-200 rounded w-16 sm:w-20" />
                  <div className="h-3.5 sm:h-4 bg-stone-200 rounded w-10 sm:w-14" />
                </div>
                <div className="h-5 sm:h-6 bg-stone-200 rounded w-3/4" />
                <div className="h-4 bg-stone-200 rounded w-1/2" />
                <div className="h-10 sm:h-14 bg-stone-100 rounded w-full hidden sm:block" />
                <div className="h-8 sm:h-10 bg-stone-200 rounded w-full pt-1" />
              </div>
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          /* Empty / No Results State */
          <div className="bg-white border border-stone-200/80 p-10 sm:p-16 text-center max-w-xl mx-auto shadow-sm">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400 mb-4">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-gallient text-stone-900 font-normal">
              {isEn ? "No treatments found" : "Layanan tidak ditemukan"}
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 font-light mt-1.5 max-w-md mx-auto">
              {isEn
                ? "Try adjusting your search keyword or clearing the active category filters."
                : "Coba ubah kata kunci pencarian atau bersihkan filter kategori yang sedang aktif."}
            </p>
            <div className="mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs border-[#947864] text-[#947864] hover:bg-[#947864] hover:text-white cursor-pointer"
              >
                {isEn ? "Reset All Filters" : "Hapus Semua Filter"}
              </Button>
            </div>
          </div>
        ) : (
          /* Luxury Grid of Services (2 cards on Mobile, 3 on Desktop) */
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5 lg:gap-6">
            {filteredServices.map((service) => {
              return (
                <Card
                  key={service.id}
                  className="group bg-white rounded-none border border-stone-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] hover:border-stone-300 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  <CardContent className="p-3.5 sm:p-5 lg:p-6 flex flex-col h-full justify-between space-y-3 sm:space-y-4 lg:space-y-5">
                    {/* Header Strip: Category, Duration */}
                    <div className="space-y-1.5 sm:space-y-2.5 lg:space-y-3">
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        <span className="text-[9px] sm:text-[10.5px] lg:text-[11px] uppercase tracking-[0.08em] sm:tracking-[0.14em] font-medium text-[#947864] bg-[#947864]/10 px-1.5 sm:px-2 py-0.5 rounded-none max-w-full truncate">
                          {getCategoryLabel(service.category)}
                        </span>

                        <div className="flex items-center gap-1 text-[9px] sm:text-[11px] lg:text-xs text-stone-600 font-light shrink-0">
                          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-400" />
                          <span>{service.duration_minutes || 60} {isEn ? "mins" : "menit"}</span>
                        </div>
                      </div>

                      {/* Service Title - Bold, Crystal Clear & Readable */}
                      <h3 className="text-[14px] sm:text-[16.5px] lg:text-[18px] font-sans font-semibold tracking-tight text-[#1c1815] leading-snug group-hover:text-[#947864] transition-colors line-clamp-2">
                        {service.name}
                      </h3>

                      {/* Price Strip */}
                      <div className="pt-0 flex items-baseline gap-1">
                        <span className="text-[13px] sm:text-base lg:text-lg font-bold text-[#1c1815] font-sans">
                          {formatIDR(service.price)}
                        </span>
                        <span className="text-[9.5px] sm:text-[11px] text-stone-400 font-light hidden xs:inline sm:inline">
                          {isEn ? "/ session" : "/ sesi"}
                        </span>
                      </div>

                      {/* Description / Content Details */}
                      {service.description ? (
                        <div className="pt-0.5">
                          <p className="text-[10.5px] sm:text-xs lg:text-[13px] text-stone-600 font-light leading-snug sm:leading-relaxed whitespace-pre-line line-clamp-2 sm:line-clamp-3">
                            {service.description}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[10.5px] sm:text-xs text-stone-400 italic pt-0.5 hidden sm:block">
                          {isEn
                            ? "Authentic massage therapy delivered by certified therapists."
                            : "Terapi pijat profesional oleh terapis tersertifikasi."}
                        </p>
                      )}
                    </div>

                    {/* Card Action: Book via WhatsApp */}
                    <div className="pt-2.5 sm:pt-3 border-t border-stone-100">
                      <Button
                        type="button"
                        onClick={() => handleBookService(service)}
                        className="w-full h-8 sm:h-9.5 lg:h-10 bg-[#947864] hover:bg-[#7e6451] text-white text-[10px] sm:text-xs tracking-[0.06em] sm:tracking-[0.08em] uppercase font-normal rounded-none shadow-sm transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer px-2"
                      >
                        <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                        <span className="truncate">{isEn ? "Book Treatment" : "Pesan Layanan"}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Bottom Consultation Box */}
        <div className="mt-14 sm:mt-20 p-6 sm:p-10 bg-white border border-stone-300/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <h3 className="text-xl sm:text-2xl font-gallient text-[#1c1815] font-normal">
              {isEn ? "Need Help Choosing the Right Treatment?" : "Butuh Bantuan Memilih Layanan yang Tepat?"}
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 font-light max-w-xl">
              {isEn
                ? "Our wellness customer service is ready to assist you in selecting the ideal therapy or customizing your session."
                : "Konsultasikan kebutuhan keluhan tubuh Anda secara gratis. Customer service kami siap membantu merekomendasikan terapis dan paket terbaik."}
            </p>
          </div>

          <Button
            type="button"
            onClick={handleConsultation}
            className="shrink-0 h-11 px-7 bg-[#947864] hover:bg-[#7e6451] text-white text-xs tracking-[0.14em] uppercase font-normal rounded-none transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{isEn ? "Free Consultation" : "Konsultasi Gratis via WA"}</span>
          </Button>
        </div>
      </main>

      {/* 6. FINAL LUXURY BOOKING BANNER (MATCHING LANDING PAGE) */}
      <section id="reservation" className="relative py-14 sm:py-24 lg:py-28 overflow-hidden bg-[#18120f] border-t border-stone-800 flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/reservation-back-massage.jpg"
            alt="Relaxing luxury Balinese back massage experience"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/35 sm:bg-black/30" />
        </div>

        <div className="relative z-10 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto rounded-none overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-md sm:backdrop-blur-lg">
            {/* Top Gold Strip */}
            <div className="bg-[#eed8a1] text-[#241c17] py-2 sm:py-3 text-xs sm:text-[13px] font-medium tracking-[0.06em] uppercase text-center rounded-none">
              {isEn ? "Instant Reservation" : "Reservasi Cepat & Nyaman"}
            </div>

            {/* Card Content Body */}
            <div className="bg-stone-950/50 p-6 sm:p-11 lg:p-14 text-stone-100 flex flex-col items-center text-center">
              <h2 className="text-2.5xl sm:text-4xl lg:text-[44px] text-white leading-[1.15] tracking-tight font-normal font-gallient">
                {isEn ? "Book your relaxing massage session now" : "Pesan sesi pijat relaksasi Anda sekarang"}
              </h2>

              <p className="text-xs sm:text-[14px] text-stone-200/90 font-light tracking-wide mt-2.5 sm:mt-4 max-w-xl mx-auto">
                {isEn
                  ? "Escape. Relax. Rejuvenate. In the comfort of your home."
                  : "Lepaskan kepenatan dan nikmati kenyamanan relaksasi di hunian Anda."}
              </p>

              <div className="mt-5 sm:mt-8">
                <div className="bg-[#947864]/90 text-stone-100 py-1.5 sm:py-2.5 px-5 sm:px-12 rounded-none text-xs sm:text-[13px] font-normal inline-block shadow-sm">
                  {isEn ? "Easy Booking in Just Seconds" : "Pemesanan Mudah dalam Hitungan Detik"}
                </div>
              </div>

              {/* 2 Booking Channels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-0 mt-6 sm:mt-9 w-full max-w-lg mx-auto items-center text-center">
                <div className="space-y-1 pb-3 sm:pb-0 border-b sm:border-b-0 sm:border-r border-white/20 sm:pr-6">
                  <span className="text-[10.5px] sm:text-[11px] text-stone-300 uppercase tracking-wider block font-light">
                    WhatsApp
                  </span>
                  <a
                    href={`https://wa.me/${cleanWhatsAppNumber(settings.whatsapp_number)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-[14px] text-white hover:text-[#eed8a1] font-sans font-medium transition-colors block tracking-wide"
                    suppressHydrationWarning
                  >
                    {formatDisplayPhone(settings.whatsapp_number)}
                  </a>
                </div>

                <div className="space-y-1 sm:pl-6">
                  <span className="text-[10.5px] sm:text-[11px] text-stone-300 uppercase tracking-wider block font-light">
                    {isEn ? "Direct Chat" : "Chat Sekarang"}
                  </span>
                  <button
                    type="button"
                    onClick={handleConsultation}
                    className="text-xs sm:text-[14px] text-white hover:text-[#eed8a1] font-medium underline underline-offset-4 cursor-pointer transition-colors block mx-auto"
                  >
                    {isEn ? "Book via WhatsApp" : "Pesan via WhatsApp"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-7 sm:mt-9 space-y-2 text-center max-w-2xl mx-auto px-4">
            <span className="text-xs sm:text-[13.5px] font-medium text-[#eed8a1] flex items-center justify-center gap-1">
              <span>📍</span>
              <span>
                {isEn
                  ? `Serving All of ${settings.service_areas ? settings.service_areas.split(",")[0].trim() : "Yogyakarta"} – Hotels, Private Residences & More`
                  : `Melayani Seluruh ${settings.service_areas || "Wilayah Yogyakarta & Sekitarnya"} – Hotel, Rumah Tinggal & Apartemen`}
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* 7. LUXURY EDITORIAL FOOTER */}
      <footer className="bg-white text-stone-800 border-t border-stone-200 text-xs sm:text-[13px] pt-14 sm:pt-16 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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

            {/* Operational Hours */}
            {settings.operational_hours && (
              <div className="flex items-center justify-center gap-2 text-stone-600 font-light text-xs sm:text-[13px]" suppressHydrationWarning>
                <Clock className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                <span>{settings.operational_hours}</span>
              </div>
            )}

            {/* Phone / WhatsApp */}
            <div className="flex items-center justify-center gap-2 text-stone-600 font-light text-xs sm:text-[13px]" suppressHydrationWarning>
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
            {settings.email && (
              <div className="flex items-center justify-center gap-2 text-stone-600 font-light text-xs sm:text-[13px]" suppressHydrationWarning>
                <Mail className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                <a
                  href={`mailto:${settings.email}`}
                  className="hover:text-stone-900 transition-colors"
                  suppressHydrationWarning
                >
                  {settings.email}
                </a>
              </div>
            )}

            {/* Social Media Links */}
            {(() => {
              const igUrl = getInstagramUrl(settings.instagram_handle);
              const ttUrl = getTikTokUrl(settings.tiktok_handle);
              const fbUrl = getFacebookUrl(settings.facebook_url);
              const thUrl = getThreadsUrl(settings.threads_handle);

              if (!igUrl && !ttUrl && !fbUrl && !thUrl) return null;

              return (
                <div className="flex items-center justify-center gap-3 pt-4 pb-1">
                  {igUrl && (
                    <a
                      href={igUrl}
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
                  )}

                  {ttUrl && (
                    <a
                      href={ttUrl}
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
                  )}

                  {fbUrl && (
                    <a
                      href={fbUrl}
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
                  )}

                  {thUrl && (
                    <a
                      href={thUrl}
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
                  )}
                </div>
              );
            })()}
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-6 border-t border-stone-200/80 text-center text-xs text-stone-500 font-light" suppressHydrationWarning>
            Copyright {new Date().getFullYear()} {settings.brand_name ? settings.brand_name.toUpperCase() : "SERENA RAGA"}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
