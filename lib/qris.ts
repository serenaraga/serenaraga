import jsQR from "jsqr";
import QRCode from "qrcode";

/**
 * Interface representing decoded QRIS metadata according to EMVCo / Bank Indonesia ASPI standard.
 */
export interface QRISInfo {
  raw: string;
  isValid: boolean;
  pointOfInitiation: "static" | "dynamic" | "unknown";
  merchantName?: string;
  merchantCity?: string;
  postalCode?: string;
  currency?: string;
  amount?: number;
  countryCode?: string;
  merchantCategoryCode?: string;
  nmid?: string;
  crc?: string;
  error?: string;
}

/**
 * QR Code Bounding Box inside a template image
 */
export interface QRLocationBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculates standard CRC-16/CCITT-FALSE checksum for EMVCo QRIS specification.
 * Polynomial: 0x1021, Initial: 0xFFFF, No reflection, Final XOR: 0x0000.
 */
export function calculateCRC16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Validates whether the CRC16 of a given raw QRIS string matches its declared checksum (Tag 63).
 */
export function validateQRISChecksum(raw: string): boolean {
  if (!raw || raw.length < 12) return false;
  const tag63Index = raw.lastIndexOf("6304");
  if (tag63Index === -1) return false;

  const dataWithoutCrc = raw.substring(0, tag63Index + 4);
  const declaredCrc = raw.substring(tag63Index + 4, tag63Index + 8).toUpperCase();
  const calculatedCrc = calculateCRC16(dataWithoutCrc);

  return declaredCrc === calculatedCrc;
}

/**
 * Parses raw TLV (Tag-Length-Value) string into a dictionary of tags.
 */
export function parseTLV(raw: string): Map<string, string> {
  const tags = new Map<string, string>();
  let index = 0;

  while (index < raw.length) {
    if (index + 4 > raw.length) break;
    const tag = raw.substring(index, index + 2);
    const lengthStr = raw.substring(index + 2, index + 4);
    const length = parseInt(lengthStr, 10);

    if (isNaN(length) || index + 4 + length > raw.length) break;

    const value = raw.substring(index + 4, index + 4 + length);
    tags.set(tag, value);
    index += 4 + length;
  }

  return tags;
}

/**
 * Decodes a raw QRIS string into a structured human-readable object.
 */
export function parseQRIS(rawPayload: string): QRISInfo {
  const raw = (rawPayload || "").trim();
  if (!raw) {
    return {
      raw: "",
      isValid: false,
      pointOfInitiation: "unknown",
      error: "Empty QRIS string",
    };
  }

  try {
    const tags = parseTLV(raw);

    // Tag 00: Payload Format Indicator (Must be "01")
    if (tags.get("00") !== "01") {
      return {
        raw,
        isValid: false,
        pointOfInitiation: "unknown",
        error: "Invalid Payload Format Indicator (Tag 00)",
      };
    }

    // Tag 01: Point of Initiation Method ("11" = static, "12" = dynamic)
    const poiRaw = tags.get("01");
    const pointOfInitiation =
      poiRaw === "11" ? "static" : poiRaw === "12" ? "dynamic" : "unknown";

    // Tag 59: Merchant Name
    const merchantName = tags.get("59");

    // Tag 60: Merchant City
    const merchantCity = tags.get("60");

    // Tag 61: Postal Code
    const postalCode = tags.get("61");

    // Tag 58: Country Code ("ID")
    const countryCode = tags.get("58");

    // Tag 53: Transaction Currency ("360" for IDR)
    const currency = tags.get("53") === "360" ? "IDR" : tags.get("53");

    // Tag 54: Transaction Amount
    const amountStr = tags.get("54");
    const amount = amountStr ? parseFloat(amountStr) : undefined;

    // Tag 52: Merchant Category Code
    const merchantCategoryCode = tags.get("52");

    // Check NMID across Merchant Account Info (Tags 26 to 51)
    let nmid: string | undefined = undefined;
    for (let t = 26; t <= 51; t++) {
      const tagKey = t.toString().padStart(2, "0");
      const accountVal = tags.get(tagKey);
      if (accountVal) {
        // Sub-TLV inside merchant account info
        const subTags = parseTLV(accountVal);
        const subNmid = subTags.get("02") || subTags.get("01") || subTags.get("03");
        if (subNmid && subNmid.toUpperCase().startsWith("ID")) {
          nmid = subNmid;
          break;
        }
      }
    }

    // Tag 63: CRC Checksum
    const crc = tags.get("63");
    const isCrcValid = validateQRISChecksum(raw);

    return {
      raw,
      isValid: isCrcValid,
      pointOfInitiation,
      merchantName,
      merchantCity,
      postalCode,
      currency,
      amount,
      countryCode,
      merchantCategoryCode,
      nmid,
      crc,
    };
  } catch (err: any) {
    return {
      raw,
      isValid: false,
      pointOfInitiation: "unknown",
      error: err.message || "Failed to parse QRIS string",
    };
  }
}

/**
 * Converts a static QRIS string into a dynamic QRIS string with the exact transaction nominal.
 *
 * Algorithm:
 * 1. Replaces initiation method Tag 01 '11' with '12' (dynamic).
 * 2. Strips existing Tag 63 (checksum).
 * 3. Strips existing Tag 54 (amount), Tag 55/56/57 (convenience fees) if present.
 * 4. Injects Tag 54 with the target amount before Tag 58 (Country Code) or end of merchant payload.
 * 5. Appends '6304' and calculates new CRC-16/CCITT checksum.
 */
export function generateDynamicQRIS(
  staticPayload: string,
  amount: number,
  options?: {
    fee?: number;
    feeType?: "fixed" | "percentage";
  }
): string {
  const cleanRaw = (staticPayload || "").trim();
  if (!cleanRaw) {
    throw new Error("Static QRIS payload is empty.");
  }

  // Ensure amount is integer (IDR standard)
  const nominal = Math.max(0, Math.round(amount || 0));
  if (nominal === 0) {
    // Return original payload if no amount specified
    return cleanRaw;
  }

  // 1. Remove existing Tag 63 (last 8 characters "6304XXXX")
  let basePayload = cleanRaw;
  const tag63Index = basePayload.lastIndexOf("6304");
  if (tag63Index !== -1) {
    basePayload = basePayload.substring(0, tag63Index);
  }

  // 2. Change Tag 01 from static (11) to dynamic (12)
  if (basePayload.includes("010211")) {
    basePayload = basePayload.replace("010211", "010212");
  } else if (!basePayload.includes("010212")) {
    // If Tag 01 is missing or not 11/12, insert after Tag 00
    if (basePayload.startsWith("000201")) {
      basePayload = "000201010212" + basePayload.substring(6);
    }
  }

  // 3. Parse existing tags to rebuild cleanly without conflicting amount/fee tags
  const tags = parseTLV(basePayload);

  // Set/overwrite Tag 01 to dynamic
  tags.set("01", "12");

  // Format Tag 54 (Transaction Amount)
  const amountStr = nominal.toString();
  tags.set("54", amountStr);

  // Handle optional fee (Tag 55: 02 = Fixed, 03 = Percentage)
  if (options?.fee && options.fee > 0) {
    if (options.feeType === "percentage") {
      tags.set("55", "03");
      tags.set("57", options.fee.toString());
    } else {
      tags.set("55", "02");
      tags.set("56", Math.round(options.fee).toString());
    }
  } else {
    tags.delete("55");
    tags.delete("56");
    tags.delete("57");
  }

  // 4. Reconstruct EMVCo QRIS string according to canonical tag ordering
  // Ordered tag keys according to EMVCo QR Code standard
  const standardTagOrder = [
    "00", "01",
    // Merchant Accounts (02 - 51)
    ...Array.from({ length: 50 }, (_, i) => (i + 2).toString().padStart(2, "0")),
    "52", "53", "54", "55", "56", "57", "58", "59", "60", "61", "62"
  ];

  let reconstructed = "";
  for (const tagKey of standardTagOrder) {
    if (tags.has(tagKey)) {
      const val = tags.get(tagKey)!;
      const len = val.length.toString().padStart(2, "0");
      reconstructed += `${tagKey}${len}${val}`;
      tags.delete(tagKey);
    }
  }

  // Append any remaining custom tags
  for (const [tagKey, val] of tags.entries()) {
    if (tagKey !== "63") {
      const len = val.length.toString().padStart(2, "0");
      reconstructed += `${tagKey}${len}${val}`;
    }
  }

  // 5. Append Tag 63 with length 04 and calculate CRC16
  const dataForCrc = reconstructed + "6304";
  const newCrc = calculateCRC16(dataForCrc);

  return dataForCrc + newCrc;
}

/**
 * Decodes QR code from an image File/Blob/URL in browser using jsQR.
 * Also returns pixel bounding box for precise canvas replacement.
 */
export async function decodeQRFromImage(
  imageSource: File | Blob | string
): Promise<{
  payload: string;
  bounds?: QRLocationBounds;
  imageWidth: number;
  imageHeight: number;
}> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Image decoding only supported in browser environment"));
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas 2D context not available"));
          return;
        }

        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        });

        if (!qrCode || !qrCode.data) {
          reject(
            new Error(
              "No valid QR code was detected in the image. Please ensure the QR barcode is clear and unobstructed."
            )
          );
          return;
        }

        // Calculate bounding box from corners
        const loc = qrCode.location;
        const minX = Math.min(
          loc.topLeftCorner.x,
          loc.bottomLeftCorner.x,
          loc.topRightCorner.x,
          loc.bottomRightCorner.x
        );
        const maxX = Math.max(
          loc.topLeftCorner.x,
          loc.bottomLeftCorner.x,
          loc.topRightCorner.x,
          loc.bottomRightCorner.x
        );
        const minY = Math.min(
          loc.topLeftCorner.y,
          loc.bottomLeftCorner.y,
          loc.topRightCorner.y,
          loc.bottomRightCorner.y
        );
        const maxY = Math.max(
          loc.topLeftCorner.y,
          loc.bottomLeftCorner.y,
          loc.topRightCorner.y,
          loc.bottomRightCorner.y
        );

        const bounds: QRLocationBounds = {
          x: Math.floor(minX),
          y: Math.floor(minY),
          width: Math.ceil(maxX - minX),
          height: Math.ceil(maxY - minY),
        };

        resolve({
          payload: qrCode.data,
          bounds,
          imageWidth: canvas.width,
          imageHeight: canvas.height,
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load QR image for decoding."));
    };

    if (typeof imageSource === "string") {
      img.src = imageSource;
    } else {
      img.src = URL.createObjectURL(imageSource);
    }
  });
}

/**
 * Composites a newly generated Dynamic QR code directly on top of the original
 * merchant QRIS image template in the center, preserving 100% of the authentic header,
 * NMID, merchant title, and GPN footer!
 */
export async function compositeDynamicQRISImage({
  templateImageUrl,
  dynamicPayload,
  amount,
  fallbackBounds,
}: {
  templateImageUrl?: string;
  dynamicPayload: string;
  amount?: number;
  fallbackBounds?: QRLocationBounds;
}): Promise<string> {
  if (typeof window === "undefined") {
    return "";
  }

  // If no template image provided, render standard standalone high-res QR code
  if (!templateImageUrl || !templateImageUrl.trim()) {
    return await QRCode.toDataURL(dynamicPayload, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 600,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = async () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not initialize canvas context"));
          return;
        }

        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        // 1. Draw the authentic template image (Header, Logos, NMID, Frame, Footer)
        ctx.drawImage(img, 0, 0);

        // 2. Locate the QR code center coordinates
        let bounds = fallbackBounds;

        if (!bounds) {
          try {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qr = jsQR(imgData.data, imgData.width, imgData.height, {
              inversionAttempts: "attemptBoth",
            });
            if (qr) {
              const loc = qr.location;
              const minX = Math.min(
                loc.topLeftCorner.x,
                loc.bottomLeftCorner.x,
                loc.topRightCorner.x,
                loc.bottomRightCorner.x
              );
              const maxX = Math.max(
                loc.topLeftCorner.x,
                loc.bottomLeftCorner.x,
                loc.topRightCorner.x,
                loc.bottomRightCorner.x
              );
              const minY = Math.min(
                loc.topLeftCorner.y,
                loc.bottomLeftCorner.y,
                loc.topRightCorner.y,
                loc.bottomRightCorner.y
              );
              const maxY = Math.max(
                loc.topLeftCorner.y,
                loc.bottomLeftCorner.y,
                loc.topRightCorner.y,
                loc.bottomRightCorner.y
              );

              bounds = {
                x: Math.floor(minX),
                y: Math.floor(minY),
                width: Math.ceil(maxX - minX),
                height: Math.ceil(maxY - minY),
              };
            }
          } catch (e) {
            // Non-blocking fallback
          }
        }

        // Default center fallback if QR coordinates couldn't be detected
        if (!bounds || bounds.width <= 10) {
          const side = Math.floor(canvas.width * 0.72);
          bounds = {
            x: Math.floor((canvas.width - side) / 2),
            y: Math.floor((canvas.height - side) / 2),
            width: side,
            height: side,
          };
        }

        // 3. Clear the old QR code square with clean crisp white background
        // Add subtle 2px padding to ensure old edges are completely covered
        const pad = Math.max(2, Math.floor(bounds.width * 0.02));
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(
          bounds.x - pad,
          bounds.y - pad,
          bounds.width + pad * 2,
          bounds.height + pad * 2
        );

        // 4. Generate high-resolution Dynamic QR code
        const qrCanvas = document.createElement("canvas");
        await QRCode.toCanvas(qrCanvas, dynamicPayload, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: bounds.width + pad * 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });

        // 5. Draw the newly generated Dynamic QR code directly over the exact square
        ctx.drawImage(
          qrCanvas,
          bounds.x - pad,
          bounds.y - pad,
          bounds.width + pad * 2,
          bounds.height + pad * 2
        );

        // 6. Draw nominal text with typography matching the QRIS template (clean, bold, unified)
        if (amount && amount > 0) {
          const nominalStr = `Rp ${Math.round(amount).toLocaleString("id-ID")}`;
          const fontSize = Math.max(16, Math.round(bounds.width * 0.075));

          // Position text right above the QR box in the whitespace below NMID
          const textY = bounds.y - Math.max(8, Math.floor(bounds.height * 0.025));
          const clearHeight = fontSize * 1.5;
          const clearY = textY - clearHeight + 3;

          // Clear previous text (e.g. 'A01') with crisp white background
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(
            bounds.x,
            clearY,
            bounds.width,
            clearHeight
          );

          // Draw nominal in bold clean sans-serif matching official QRIS typography
          ctx.font = `bold ${fontSize}px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
          ctx.fillStyle = "#000000";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(nominalStr, canvas.width / 2, textY);
        }

        // 7. Return high-quality PNG data URL
        try {
          const dataUrl = canvas.toDataURL("image/png", 1.0);
          resolve(dataUrl);
        } catch (canvasErr) {
          console.warn("Canvas toDataURL CORS warning, using standalone QR code fallback:", canvasErr);
          const fallbackUrl = await QRCode.toDataURL(dynamicPayload, {
            errorCorrectionLevel: "M",
            margin: 2,
            width: 600,
          });
          resolve(fallbackUrl);
        }
      } catch (err) {
        console.warn("Canvas composite error, generating standalone QR fallback:", err);
        try {
          const fallbackUrl = await QRCode.toDataURL(dynamicPayload, {
            errorCorrectionLevel: "M",
            margin: 2,
            width: 600,
          });
          resolve(fallbackUrl);
        } catch (qrErr) {
          reject(qrErr);
        }
      }
    };

    img.onerror = async () => {
      // Fallback to standalone QR code
      try {
        const fallbackUrl = await QRCode.toDataURL(dynamicPayload, {
          errorCorrectionLevel: "M",
          margin: 2,
          width: 600,
        });
        resolve(fallbackUrl);
      } catch (err) {
        reject(err);
      }
    };

    img.src = templateImageUrl;
  });
}
