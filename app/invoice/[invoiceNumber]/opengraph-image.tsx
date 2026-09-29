import { ImageResponse } from "next/og";
import { supabase } from "@/lib/supabase";
import QRCode from "qrcode";
import { generateDynamicQRIS } from "@/lib/qris";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
export const alt = "SerenaRaga Official Invoice & Dynamic QRIS";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

function formatIDR(amount: number): string {
  const rounded = Math.round(amount || 0);
  return "Rp " + rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export default async function Image({
  params,
}: {
  params: Promise<{ invoiceNumber: string }> | { invoiceNumber: string };
}) {
  let invoiceNumber = "";
  try {
    const resolvedParams = await Promise.resolve(params);
    invoiceNumber = resolvedParams?.invoiceNumber || "";
  } catch {
    // fallback
  }

  // Default fallback data
  let invoiceNo = invoiceNumber || "SR-260929-3067";
  let customerName = "Kak Nurul J";
  let serviceName = "Essential Relax";
  let formattedDate = "28 September 2026";
  let subtotal = 110000;
  let transportFee = 10000;
  let additionalCharge = 0;
  let additionalChargeDesc = "";
  let discount = 5500;
  let discountName = "First-Time Customer Promo";
  let totalAmount = 114500;
  let adminPhone = "+62 895-1835-9037";
  let brandName = "SERENA RAGA";
  let nmid = "ID1026517681023";
  let staticQrisPayload =
    "00020101021126570011ID.DANA.WWW011893600915387201928302098720192830303UMI51440014ID.CO.QRIS.WWW0215ID10200234567890303UMI5204729953033605802ID5911SERENA RAGA6010YOGYAKARTA6105552816304D1A4";

  try {
    // 1. Fetch Brand Settings
    const { data: brandSetting } = await supabase
      .from("brand_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (brandSetting) {
      if (brandSetting.brand_name) brandName = brandSetting.brand_name.toUpperCase();
      if (brandSetting.qris_payload) staticQrisPayload = brandSetting.qris_payload;
      if (brandSetting.admin_phone) adminPhone = brandSetting.admin_phone;
      if (brandSetting.nmid) nmid = brandSetting.nmid;
    }

    // 2. Fetch Invoice Details
    const cleanParam = decodeURIComponent(invoiceNumber || "").trim();
    const isNumeric = !isNaN(Number(cleanParam)) && cleanParam !== "";

    let query = supabase.from("invoices").select(`
      id,
      invoice_number,
      public_token,
      total_amount,
      subtotal,
      discount,
      discount_name,
      applied_promo_name,
      transport_fee,
      additional_charge,
      additional_charge_description,
      payment_status,
      customer_name,
      therapist_name,
      service_name,
      booking_date,
      booking_time,
      created_at,
      notes,
      booking_id,
      bookings (
        id,
        booking_date,
        booking_time,
        service_name,
        therapist_name,
        total_price,
        customer_name
      )
    `);

    if (isNumeric) {
      query = query.or(`public_token.ilike.${cleanParam},invoice_number.ilike.${cleanParam},id.eq.${Number(cleanParam)}`);
    } else {
      query = query.or(`public_token.ilike.${cleanParam},invoice_number.ilike.${cleanParam}`);
    }

    const { data: invoiceData } = await query.maybeSingle();

    if (invoiceData) {
      invoiceNo = invoiceData.invoice_number || `SR-${invoiceData.id}`;
      customerName =
        invoiceData.customer_name ||
        (invoiceData.bookings as any)?.customer_name ||
        "Pelanggan";

      let meta: any = null;
      let rawNotesText = invoiceData.notes || "";
      if (rawNotesText.trim().startsWith("{") && rawNotesText.trim().endsWith("}")) {
        try {
          meta = JSON.parse(rawNotesText.trim());
          rawNotesText = meta.raw_notes || "";
        } catch (e) {}
      }

      totalAmount = Number(invoiceData.total_amount) || 0;
      subtotal = Number(invoiceData.subtotal) || totalAmount;
      discount = Number(invoiceData.discount) || 0;

      const promoMatch = rawNotesText?.match(/\[Promo:\s*([^\]]+)\]/i);
      discountName =
        invoiceData.discount_name ||
        invoiceData.applied_promo_name ||
        (promoMatch ? promoMatch[1].trim() : null) ||
        meta?.promo_name ||
        "";

      transportFee = Number(invoiceData.transport_fee) || 0;

      additionalCharge = Number(
        invoiceData.additional_charge !== undefined && invoiceData.additional_charge !== null
          ? invoiceData.additional_charge
          : meta?.additional_charge !== undefined
          ? meta.additional_charge
          : Array.isArray(meta?.items)
          ? meta.items.reduce((acc: number, it: any) => acc + (Number(it.additional_charge) || 0), 0)
          : 0
      );

      additionalChargeDesc =
        invoiceData.additional_charge_description ||
        meta?.additional_charge_description ||
        (Array.isArray(meta?.items)
          ? meta.items.map((it: any) => it.additional_charge_description).filter(Boolean).join(", ")
          : "");

      const rawService = invoiceData.service_name || (invoiceData.bookings as any)?.service_name || "Layanan Massage";
      serviceName = rawService;

      const rawDate = invoiceData.booking_date || invoiceData.created_at;
      if (rawDate) {
        try {
          formattedDate = new Date(rawDate).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });
        } catch {
          // ignore
        }
      }
    }
  } catch (err) {
    console.error("OpenGraph Image query error:", err);
  }

  // 3. Generate dynamic QRIS string
  let dynamicPayload = staticQrisPayload;
  try {
    if (totalAmount > 0) {
      dynamicPayload = generateDynamicQRIS(staticQrisPayload, totalAmount);
    }
  } catch {
    dynamicPayload = staticQrisPayload;
  }

  // 4. Generate QR code PNG Data URL
  let qrCodeDataUrl = "";
  try {
    qrCodeDataUrl = await QRCode.toDataURL(dynamicPayload, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 280,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
  } catch (err) {
    console.error("Failed to generate QR Data URL:", err);
  }

  const formattedTotal = formatIDR(totalAmount);
  const formattedSubtotal = formatIDR(subtotal);
  const formattedTransport = formatIDR(transportFee);
  const formattedAdditionalCharge = formatIDR(additionalCharge);
  const formattedDiscount = formatIDR(discount);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          backgroundColor: "#f4f3ef",
          padding: "24px 36px",
          gap: "28px",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* ========================================================= */}
        {/* LEFT COLUMN: 100% Exact Replica of Real Serena Raga Invoice */}
        {/* ========================================================= */}
        <div
          style={{
            width: "560px",
            height: "582px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "22px 26px",
            border: "1px solid #e7e5e4",
            boxShadow: "0 6px 24px -6px rgba(0, 0, 0, 0.08)",
            position: "relative",
          }}
        >
          {/* 1. Header: Logo (Left) + Invoice Badge & Date (Right) */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
            {/* Brand Logo & Tagline */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {/* Authentic Serena Icon SVG Emblem */}
                <svg width="24" height="24" viewBox="0 0 500 500" style={{ display: "flex" }}>
                  <g transform="translate(250, 250) scale(0.95) translate(-320.38, -750.0)">
                    <path
                      fill="#8b5e3c"
                      d="M 95.3125 855.527344 C 131.660156 845.808594 172.097656 849.09375 216.457031 864.730469 C 262.976562 881.144531 268.746094 881.65625 310.886719 859.035156 C 336.074219 845.503906 362.039062 834.925781 392.230469 840.402344 C 418.679688 845.199219 426.027344 856.898438 450.300781 835.328125 C 497.210938 793.660156 527.417969 825.917969 512.683594 874.558594 C 540.046875 833.832031 502.882812 767.515625 442.496094 828.355469 C 425.515625 845.460938 412.554688 834.636719 393.089844 829.839844 C 362.425781 822.296875 331.417969 831.238281 300.269531 846.253906 C 261.246094 865.0625 261.703125 866.046875 217.871094 853.171875 C 166.136719 837.992188 126.75 840.945312 95.3125 855.527344"
                    />
                    <path
                      fill="#8b5e3c"
                      d="M 417.03125 854.710938 C 465.464844 864.355469 505.292969 905.792969 545.453125 881.1875 C 500.164062 890.722656 464.96875 849.636719 417.03125 854.710938"
                    />
                    <path
                      fill="#8b5e3c"
                      d="M 295.664062 760.5 C 310.871094 786.753906 327.964844 808.285156 346.761719 824.503906 C 318.21875 816.574219 303 793.1875 295.664062 760.5"
                    />
                    <path
                      fill="#8b5e3c"
                      d="M 230.46875 851.175781 C 256.214844 828.507812 252.554688 774.585938 253.109375 754.136719 C 253.523438 738.570312 256.0625 724.472656 270.589844 716.070312 C 295.527344 701.652344 296.511719 709.070312 303.664062 677.90625 C 305.730469 668.898438 307.367188 659.304688 309.722656 650.683594 C 322.03125 605.644531 379.867188 630.136719 361.316406 676.703125 C 351.78125 700.613281 326.675781 729.449219 308.140625 697.425781 C 315.171875 737.667969 357.671875 713.367188 370.039062 680.265625 C 389.792969 627.40625 318.511719 594.207031 302.777344 649.824219 C 300.378906 658.304688 298.5625 667.273438 296.304688 675.855469 C 290.648438 697.246094 290.09375 694.570312 271.726562 702.582031 C 247.078125 713.328125 243.640625 730.390625 242.808594 754.648438 C 242.046875 777.175781 244.402344 820.511719 230.46875 851.175781"
                    />
                    <path
                      fill="#8b5e3c"
                      d="M 419.152344 826.539062 C 401.171875 805.554688 370.800781 803.558594 355.386719 771.671875 C 341.855469 743.699219 342.726562 726.164062 305.0625 717.5 C 333.496094 730.972656 335.894531 747.289062 344.65625 773.363281 C 353.597656 799.980469 401.714844 814.496094 419.152344 826.539062"
                    />
                    <path
                      fill="#8b5e3c"
                      d="M 312.246094 629.347656 C 302.941406 599.875 339.316406 594.761719 335.753906 620.269531 C 328.992188 603.769531 311.925781 609.71875 312.246094 629.347656"
                    />
                  </g>
                </svg>
                <span
                  style={{
                    fontSize: "19px",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    color: "#1c1917",
                  }}
                >
                  SerenaRaga
                </span>
              </div>
              <span
                style={{
                  fontSize: "9.5px",
                  letterSpacing: "0.18em",
                  fontWeight: 700,
                  color: "#8b5e3c",
                  marginTop: "2px",
                  textTransform: "uppercase",
                }}
              >
                COMFORTABLE HOME MASSAGE
              </span>
            </div>

            {/* Invoice Tag & Date Box */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <span
                style={{
                  backgroundColor: "#8b5e3c",
                  color: "#ffffff",
                  fontSize: "10px",
                  fontWeight: 800,
                  fontStyle: "italic",
                  letterSpacing: "0.08em",
                  padding: "2px 8px",
                  borderRadius: "4px",
                }}
              >
                INVOICE
              </span>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#1c1917", marginTop: "3px" }}>
                {invoiceNo}
              </span>
              <span style={{ fontSize: "10px", color: "#78716c", marginTop: "1px" }}>
                {formattedDate}
              </span>
            </div>
          </div>

          {/* 2. DITUJUKAN UNTUK (Recipient) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              borderLeft: "3px solid #8b5e3c",
              paddingLeft: "10px",
              margin: "8px 0 4px 0",
            }}
          >
            <span
              style={{
                fontSize: "9.5px",
                fontWeight: 800,
                letterSpacing: "0.15em",
                color: "#8b5e3c",
                textTransform: "uppercase",
              }}
            >
              DITUJUKAN UNTUK:
            </span>
            <span style={{ fontSize: "18px", fontWeight: 800, color: "#1c1917", marginTop: "1px" }}>
              {customerName}
            </span>
          </div>

          {/* 3. Items Table */}
          <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
            {/* Table Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px solid #e7e5e4",
                paddingBottom: "5px",
              }}
            >
              <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.06em", color: "#78716c", textTransform: "uppercase" }}>
                ITEM & LAYANAN
              </span>
              <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.06em", color: "#78716c", textTransform: "uppercase" }}>
                HARGA
              </span>
            </div>

            {/* Item Row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 0",
              }}
            >
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#1c1917" }}>
                {serviceName}
              </span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1c1917" }}>
                {formattedSubtotal}
              </span>
            </div>
          </div>

          {/* 4. Calculation Breakdown */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", color: "#78716c", textTransform: "uppercase" }}>
                SUBTOTAL
              </span>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#1c1917" }}>
                {formattedSubtotal}
              </span>
            </div>

            {transportFee > 0 ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "10.5px", fontWeight: 600, letterSpacing: "0.05em", color: "#78716c", textTransform: "uppercase" }}>
                  BIAYA TRANSPORT
                </span>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#1c1917" }}>
                  {formattedTransport}
                </span>
              </div>
            ) : null}

            {additionalCharge > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "10.5px", fontWeight: 600, letterSpacing: "0.05em", color: "#78716c", textTransform: "uppercase" }}>
                    BIAYA TAMBAHAN
                  </span>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#1c1917" }}>
                    {formattedAdditionalCharge}
                  </span>
                </div>
                {additionalChargeDesc ? (
                  <span style={{ fontSize: "10px", color: "#78716c", paddingLeft: "8px" }}>
                    ↳ {additionalChargeDesc}
                  </span>
                ) : null}
              </div>
            ) : null}

            {discount > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.05em", color: "#059669", textTransform: "uppercase" }}>
                    🏷️ DISKON DIGUNAKAN
                  </span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#059669" }}>
                    -{formattedDiscount}
                  </span>
                </div>
                {discountName ? (
                  <span style={{ fontSize: "10px", color: "#059669", paddingLeft: "16px" }}>
                    ↳ {discountName}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* 5. Signature Terracotta TOTAL BAYAR Banner */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#8b5e3c",
              color: "#ffffff",
              padding: "10px 16px",
              borderRadius: "10px",
              marginTop: "4px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "2px", height: "14px", backgroundColor: "rgba(255,255,255,0.4)" }} />
              <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                TOTAL BAYAR
              </span>
            </div>
            <span style={{ fontSize: "20px", fontWeight: 800, fontStyle: "italic", letterSpacing: "-0.01em" }}>
              {formattedTotal}
            </span>
          </div>

          {/* 6. Footer Notes */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              borderTop: "1px solid #f5f5f4",
              paddingTop: "6px",
              marginTop: "2px",
            }}
          >
            <span style={{ fontSize: "9.5px", fontWeight: 600, color: "#44403c", textAlign: "center" }}>
              Terima kasih telah mempercayakan relaksasi Anda pada Serena Raga.
            </span>
            <span style={{ fontSize: "8.5px", color: "#78716c", textAlign: "center", marginTop: "1px" }}>
              Dokumen ini merupakan bukti transaksi resmi. Layanan pelanggan WhatsApp {adminPhone}.
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: 100% Exact Official Template Replica of Serena Raga QRIS */}
        {/* ========================================================= */}
        <div
          style={{
            width: "380px",
            height: "582px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "18px 20px",
            border: "1px solid #e7e5e4",
            boxShadow: "0 6px 24px -6px rgba(0, 0, 0, 0.08)",
          }}
        >
          {/* Official QRIS Template Frame Container */}
          <div
            style={{
              width: "100%",
              height: "485px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              border: "1.5px solid #e2e8f0",
              padding: "14px 14px 10px 14px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Left Red Chevron Accent */}
            <svg
              style={{
                position: "absolute",
                left: "-1px",
                top: "145px",
                width: "30px",
                height: "85px",
              }}
              viewBox="0 0 30 85"
            >
              <polygon points="0,0 28,42.5 0,85" fill="#e11d48" />
            </svg>

            {/* Bottom-Right Red Ribbon Banner */}
            <svg
              style={{
                position: "absolute",
                right: "-1px",
                bottom: "-1px",
                width: "120px",
                height: "75px",
              }}
              viewBox="0 0 120 75"
            >
              <polygon points="120,0 120,75 0,75" fill="#e11d48" />
            </svg>

            {/* Content on top of the red bottom-right ribbon */}
            <div
              style={{
                position: "absolute",
                right: "6px",
                bottom: "5px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                color: "#ffffff",
                width: "80px",
              }}
            >
              <span style={{ fontSize: "5.5px", fontWeight: 700, letterSpacing: "0.02em" }}>
                Cara pembayaran QRIS:
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "3px", marginTop: "2px" }}>
                {/* 3 Step Icon Circles */}
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "7px", color: "#e11d48" }}>📱</span>
                </div>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "7px", color: "#e11d48" }}>📷</span>
                </div>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "7px", color: "#e11d48" }}>✓</span>
                </div>
              </div>
              <span style={{ fontSize: "4.5px", marginTop: "1px", opacity: 0.9 }}>
                Buka • Scan • Bayar
              </span>
            </div>

            {/* Top QRIS + GPN Header Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                paddingBottom: "6px",
                borderBottom: "1.5px solid #f1f5f9",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "20px", fontWeight: 900, color: "#1e293b", letterSpacing: "-0.02em" }}>
                  QRIS
                </span>
                <div style={{ display: "flex", flexDirection: "column", fontSize: "7px", fontWeight: 700, color: "#64748b", lineHeight: 1 }}>
                  <span>QR Code Standar</span>
                  <span>Pembayaran Nasional</span>
                </div>
              </div>

              {/* GPN Bird Emblem */}
              <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                <svg width="18" height="18" viewBox="0 0 100 100">
                  <path
                    fill="#e11d48"
                    d="M10,60 C30,30 60,20 90,10 C80,35 65,55 45,70 C35,78 20,85 10,60 Z"
                  />
                  <path
                    fill="#dc2626"
                    d="M30,50 C50,35 70,30 85,25 C75,45 60,60 40,65 Z"
                  />
                </svg>
                <span style={{ fontSize: "14px", fontWeight: 900, color: "#e11d48", fontStyle: "italic" }}>
                  GPN
                </span>
              </div>
            </div>

            {/* Merchant Name & NMID */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "4px" }}>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "#000000", textTransform: "uppercase" }}>
                {brandName}
              </span>
              <span style={{ fontSize: "9px", color: "#64748b", fontWeight: 600, marginTop: "1px" }}>
                NMID: {nmid}
              </span>
            </div>

            {/* Exact Nominal Text (Pitch Black) */}
            <span
              style={{
                fontSize: "17px",
                fontWeight: 900,
                color: "#000000",
                marginTop: "3px",
                letterSpacing: "-0.01em",
              }}
            >
              {formattedTotal}
            </span>

            {/* Dynamic QR Code Matrix */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "2px",
                marginTop: "2px",
              }}
            >
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="Dynamic QR Code"
                  style={{
                    width: "215px",
                    height: "215px",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <div style={{ width: "215px", height: "215px", backgroundColor: "#f8fafc" }} />
              )}
            </div>

            {/* Template Footer Area */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", marginTop: "2px" }}>
              <span style={{ fontSize: "8px", fontWeight: 800, color: "#334155", letterSpacing: "0.04em" }}>
                SATU QRIS UNTUK SEMUA
              </span>
              <span style={{ fontSize: "6.5px", color: "#94a3b8", marginTop: "1px" }}>
                Cek aplikasi penyelenggara di: www.aspi-qris.id
              </span>

              {/* Bottom Left Print Info */}
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginTop: "6px" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "6.5px", color: "#64748b", fontWeight: 600 }}>
                    Dicetak oleh: 93600914
                  </span>
                  <span style={{ fontSize: "6px", color: "#94a3b8" }}>
                    Versi cetak: v0.0.2026.05.09
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Download Button Mockup */}
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "7px 12px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              backgroundColor: "#ffffff",
              color: "#334155",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            <span>⬇</span>
            <span>Unduh QRIS (PNG)</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
