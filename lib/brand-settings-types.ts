export interface BrandSettings {
  brand_name: string;
  tagline: string;
  description: string;
  whatsapp_number: string;
  phone_number: string;
  email: string;
  website_url: string;
  instagram_handle: string;
  tiktok_handle?: string;
  facebook_url?: string;
  threads_handle?: string;
  operational_hours: string;
  service_areas: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_holder: string;
  qris_image_url: string;
  qris_payload?: string;
  invoice_footer_note: string;
  invoice_support_text: string;
  wa_invoice_message_template: string;
  wa_booking_message_template: string;
  wa_support_default_message: string;
  wa_service_book_message_template?: string;
  landing_services_section?: FeaturedServiceCard[];
  featured_services?: FeaturedServiceCard[];
}

export interface FeaturedServiceCard {
  id: string;
  title: string;
  title_id?: string;
  tagline: string;
  tagline_id?: string;
  image: string;
}

export const DEFAULT_FEATURED_SERVICES: FeaturedServiceCard[] = [
  {
    id: "traditional",
    title: "Traditional",
    title_id: "Pijat Tradisional",
    tagline: "Authentic Relaxation",
    tagline_id: "Relaksasi Otentik",
    image: "/images/service-balinese.jpg",
  },
  {
    id: "foot",
    title: "Foot Reflexology",
    title_id: "Refleksi Kaki",
    tagline: "Relax Tired Feet",
    tagline_id: "Redakan Kaki Lelah",
    image: "/images/service-foot-reflexology.jpg",
  },
  {
    id: "back-neck",
    title: "Back, Neck & Shoulder",
    title_id: "Punggung, Leher & Pundak",
    tagline: "Release Everyday Tension",
    tagline_id: "Lepaskan Ketegangan Otot",
    image: "/images/service-back-neck.jpg",
  },
  {
    id: "face-lifting",
    title: "Face Lifting & Acupressure",
    title_id: "Totok Wajah & Akupresur",
    tagline: "Lift, Refresh & Relax",
    tagline_id: "Segarkan & Kencangkan Wajah",
    image: "/images/service-face-lifting.jpg",
  },
];

export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  brand_name: "Serena Raga",
  tagline: "Comfortable Home Massage",
  description:
    "Layanan pijat panggilan yang nyaman langsung ke rumah, hotel, dan apartemen Anda.",
  whatsapp_number: "6289518359037",
  phone_number: "+62 895-1835-9037",
  email: "ragaserena@gmail.com",
  website_url: "https://www.serenaraga.com",
  instagram_handle: "@serena.raga",
  tiktok_handle: "@serenaraga",
  facebook_url: "https://facebook.com/serenaraga",
  threads_handle: "@serena.raga",
  operational_hours: "08:00 - 22:00 WIB (Setiap Hari)",
  service_areas: "Yogyakarta, Sleman, Bantul, & Sekitarnya",
  bank_name: "BCA (Bank Central Asia)",
  bank_account_number: "8720-1928-33",
  bank_account_holder: "PT Serena Raga Indonesia",
  qris_image_url: "",
  qris_payload: "",
  invoice_footer_note:
    "Terima kasih telah mempercayakan relaksasi Anda pada Serena Raga.",
  invoice_support_text:
    "Dokumen ini merupakan bukti transaksi resmi. Layanan pelanggan WhatsApp {whatsapp}.",
  wa_invoice_message_template:
    "Halo {customer_name},\n\nTerima kasih telah menggunakan layanan *{brand_name} – {service_name}* 🤎\n\nBerikut rincian invoice {customer_name}:\n📄 No. Invoice: *{invoice_number}*\n📅 Jadwal: *{booking_date}, {booking_time} WIB*\n💰 Total: *{total_amount}*\n💳 Status: *{payment_status}*\n\n🧾 Nota digital:\n{invoice_url}\n\nSalam hangat,\n*{brand_name}*",
  wa_booking_message_template:
    "Halo {customer_name},\n\nPesanan *{service_name}* di *{brand_name}* Anda telah dikonfirmasi!\n\n📅 *Tanggal:* {booking_date}\n⏰ *Jam:* {booking_time}\n📍 *Alamat:* {address}\n💆 *Terapis:* {therapist_name}\n\nMohon bersiap 10 menit sebelum waktu pelayanan.",
  wa_support_default_message:
    "Halo Admin SerenaRaga! Saya ingin tanya layanan massage di rumah. Bisa bantu informasinya?",
  wa_service_book_message_template:
    "Halo {brand_name}, saya ingin memesan layanan pijat:\n\n✨ Treatment: *{service_name}*\n💆🏻‍♀️ Detail Treatment: *{detail_treatment}*\n💵 Tarif: *{price}*\n\nMohon info ketersediaan jadwal terapis untuk lokasi saya. Terima kasih!",
  landing_services_section: DEFAULT_FEATURED_SERVICES,
  featured_services: DEFAULT_FEATURED_SERVICES,
};
