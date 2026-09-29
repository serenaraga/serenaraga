import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ invoiceNumber: string }> | { invoiceNumber: string };
}): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://serenaraga.com";
  let invoiceNumber = "";

  try {
    const resolvedParams = await Promise.resolve(params);
    invoiceNumber = resolvedParams?.invoiceNumber || "";
  } catch {
    // safe fallback
  }

  let title = invoiceNumber ? `Invoice ${invoiceNumber} - SerenaRaga` : "Invoice - SerenaRaga";
  let description = "Nota digital & pembayaran QRIS resmi Serena Raga Home Massage Jogja.";
  let customerName = "";
  let totalAmount = 0;
  let formattedTotal = "";

  try {
    if (invoiceNumber) {
      const cleanParam = decodeURIComponent(invoiceNumber || "").trim();
      const isNumeric = !isNaN(Number(cleanParam)) && cleanParam !== "";

      let query = supabase.from("invoices").select(`
        id,
        invoice_number,
        public_token,
        total_amount,
        payment_status,
        customer_name
      `);

      if (isNumeric) {
        query = query.or(`public_token.ilike.${cleanParam},invoice_number.ilike.${cleanParam},id.eq.${Number(cleanParam)}`);
      } else {
        query = query.or(`public_token.ilike.${cleanParam},invoice_number.ilike.${cleanParam}`);
      }

      const { data: invoice } = await query.maybeSingle();

      if (invoice) {
        const invNo = invoice.invoice_number || `SR-${invoice.id}`;
        customerName = invoice.customer_name || "Pelanggan";
        totalAmount = Number(invoice.total_amount) || 0;
        formattedTotal = "Rp " + totalAmount.toLocaleString("id-ID");

        title = `Nota Digital #${invNo} (${customerName}) - SerenaRaga`;
        description = `Rincian tagihan ${customerName} sebesar ${formattedTotal}. Buka tautan untuk melihat nota lengkap dan scan pembayaran QRIS.`;
      }
    }
  } catch (err) {
    console.error("Failed to generate metadata for invoice:", err);
  }

  const pageUrl = invoiceNumber ? `${siteUrl}/invoice/${invoiceNumber}` : siteUrl;
  const ogImageUrl = invoiceNumber ? `${siteUrl}/invoice/${invoiceNumber}/opengraph-image` : `${siteUrl}/opengraph-image`;

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "SerenaRaga",
      locale: "id_ID",
      url: pageUrl,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `Nota Digital & QRIS ${title}`,
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default function InvoiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
