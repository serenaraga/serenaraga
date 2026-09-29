import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const alt = "SerenaRaga - Comfortable Home Massage Jogja";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  // 1. Load Hero Sanctuary Image as Base64 Data URL
  let heroImageBase64 = "";
  try {
    const heroImgPath = path.join(process.cwd(), "public/images/hero-sanctuary.jpg");
    if (fs.existsSync(heroImgPath)) {
      const heroBuf = fs.readFileSync(heroImgPath);
      heroImageBase64 = `data:image/jpeg;base64,${heroBuf.toString("base64")}`;
    }
  } catch (err) {
    console.warn("Could not load hero-sanctuary image:", err);
  }

  // 2. Load Fonts: Geist (Sans) + Gallient (Luxury Serif)
  const fonts = [];

  // Primary Sans Font: Geist
  try {
    const geistPath = path.join(
      process.cwd(),
      "node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf"
    );
    if (fs.existsSync(geistPath)) {
      const geistBuf = fs.readFileSync(geistPath);
      fonts.push({
        name: "Geist",
        data: geistBuf.buffer.slice(
          geistBuf.byteOffset,
          geistBuf.byteOffset + geistBuf.byteLength
        ),
        style: "normal" as const,
        weight: 400 as const,
      });
    }
  } catch (e) {}

  // Luxury Display Font: Gallient
  try {
    const gallientPath = path.join(process.cwd(), "public/font/Gallient Regular.ttf");
    if (fs.existsSync(gallientPath)) {
      const gallientBuf = fs.readFileSync(gallientPath);
      fonts.push({
        name: "Gallient",
        data: gallientBuf.buffer.slice(
          gallientBuf.byteOffset,
          gallientBuf.byteOffset + gallientBuf.byteLength
        ),
        style: "normal" as const,
        weight: 400 as const,
      });
    }
  } catch (e) {}

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#171513",
          fontFamily: 'Geist, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* ========================================================= */}
        {/* FULL-BLEED SANCTUARY HERO BACKGROUND IMAGE                */}
        {/* ========================================================= */}
        {heroImageBase64 ? (
          <img
            src={heroImageBase64}
            alt="Serena Raga Sanctuary"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : null}

        {/* Subtle Luxury Contrast Overlay (Matching app/page.tsx) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(180deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.35) 50%, rgba(0, 0, 0, 0.45) 100%)",
          }}
        />

        {/* ========================================================= */}
        {/* CENTER HERO CONTENT (Exact Match of Landing Page Hero)    */}
        {/* ========================================================= */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "0 60px",
            maxWidth: "1050px",
          }}
        >
          {/* Main Title: SERENA RAGA in Gallient Luxury Roman Serif */}
          <h1
            style={{
              fontSize: "88px",
              fontWeight: 400,
              fontFamily: "Gallient, serif",
              letterSpacing: "0.22em",
              color: "#ffffff",
              textTransform: "uppercase",
              margin: 0,
              lineHeight: 1.1,
              textShadow: "0 4px 30px rgba(0, 0, 0, 0.65)",
            }}
          >
            SERENA RAGA
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "22px",
              fontWeight: 300,
              color: "rgba(255, 255, 255, 0.95)",
              letterSpacing: "0.04em",
              marginTop: "18px",
              marginBottom: "32px",
              maxWidth: "680px",
              textShadow: "0 2px 14px rgba(0, 0, 0, 0.7)",
              lineHeight: 1.4,
            }}
          >
            Relaxing massage to your doorstep.
          </p>

          {/* Outlined Luxury Book Now Button */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "14px 48px",
              border: "1.5px solid rgba(255, 255, 255, 0.88)",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 400,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              backgroundColor: "rgba(0, 0, 0, 0.15)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.35)",
            }}
          >
            BOOK NOW
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fonts.length > 0 ? fonts : undefined,
    }
  );
}
