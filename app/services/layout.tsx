import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daftar Layanan & Perawatan | Serena Raga - Home Massage Jogja",
  description:
    "Jelajahi seluruh menu layanan pijat panggilan, spa, refleksi, perawatan ibu & anak, serta paket couple Serena Raga di Yogyakarta. Pesan terapis profesional langsung ke lokasi Anda.",
  openGraph: {
    title: "Daftar Layanan & Perawatan | Serena Raga",
    description:
      "Jelajahi seluruh menu layanan pijat panggilan, spa, refleksi, perawatan ibu & anak, serta paket couple Serena Raga di Yogyakarta.",
    type: "website",
    locale: "id_ID",
    url: "https://www.serenaraga.com/services",
    siteName: "SerenaRaga",
  },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
