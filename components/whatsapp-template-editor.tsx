"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  MessageCircle,
  RotateCcw,
  Check,
  Copy,
  Tag,
  Bold,
  Italic,
  Eye,
  FileText,
  Calendar,
  Banknote,
  CreditCard,
  Receipt,
  Heart,
  Link2,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface WhatsAppTemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  brandName?: string;
  isEn?: boolean;
}

interface TemplatePreset {
  id: string;
  label: string;
  labelEn: string;
  description: string;
  descriptionEn: string;
  template: string;
}

export function normalizeNewlines(str?: string | null): string {
  if (!str) return "";
  return str.replace(/\\n/g, "\n").replace(/\\r/g, "");
}

export const SERENA_DEFAULT_WA_TEMPLATE = `Halo {customer_name},

Terima kasih telah menggunakan layanan *{brand_name} – {service_name}* 🤎

Berikut rincian invoice {customer_name}:
📄 No. Invoice: *{invoice_number}*
📅 Jadwal: *{booking_date}, {booking_time} WIB*
💰 Total: *{total_amount}*
💳 Status: *{payment_status}*

🧾 Nota digital:
{invoice_url}

Salam hangat,
*{brand_name}*`;

const PRESETS: TemplatePreset[] = [
  {
    id: "serena-default",
    label: "Gaya Resmi Serena Raga (Bawaan)",
    labelEn: "Serena Raga Official (Default)",
    description: "Sapaan ramah, rincian lengkap rapi dengan icon & salam hangat.",
    descriptionEn: "Warm greeting, clean icons with complete invoice details.",
    template: SERENA_DEFAULT_WA_TEMPLATE,
  },
  {
    id: "minimalist",
    label: "Gaya Singkat & Ringkas",
    labelEn: "Minimalist & Short",
    description: "To the point, cocok untuk pengiriman cepat tanpa basa-basi.",
    descriptionEn: "Concise summary with direct digital receipt link.",
    template: `Halo {customer_name},

Berikut adalah nota resmi *{brand_name}* untuk pesanan {service_name}:

📄 Invoice: *{invoice_number}*
💰 Total: *{total_amount}* ({payment_status})
🔗 Link Nota: {invoice_url}

Terima kasih!`,
  },
  {
    id: "formal",
    label: "Gaya Formal & Bisnis",
    labelEn: "Formal & Corporate",
    description: "Format baku & profesional untuk klien korporat / instansi.",
    descriptionEn: "Formal wording for corporate bookings and official accounting.",
    template: `Yth. {customer_name},

Terima kasih atas kepercayaan Anda terhadap layanan *{brand_name}*.
Berikut rincian bukti transaksi & nota digital Anda:

• Nomor Invoice : *{invoice_number}*
• Layanan : {service_name}
• Jadwal : {booking_date} ({booking_time} WIB)
• Total Biaya : *{total_amount}*
• Status Pembayaran : *{payment_status}*

Akses dokumen nota resmi:
{invoice_url}

Hormat kami,
Management *{brand_name}*`,
  },
  {
    id: "english",
    label: "Format Bahasa Inggris (Expat / Tourist)",
    labelEn: "English (Expat / Tourist)",
    description: "Format full English untuk tamu mancanegara / ekspatriat.",
    descriptionEn: "Full English template for foreign guests and tourists.",
    template: `Hello {customer_name},

Thank you for choosing *{brand_name} – {service_name}* 🤎

Here are your official invoice details:
📄 Invoice No: *{invoice_number}*
📅 Schedule: *{booking_date}, {booking_time} WIB*
💰 Total: *{total_amount}*
💳 Status: *{payment_status}*

🧾 Digital Receipt:
{invoice_url}

Warm regards,
*{brand_name}*`,
  },
];

const AVAILABLE_VARIABLES = [
  {
    tag: "{customer_name}",
    name: "Nama Pelanggan",
    nameEn: "Customer Name",
    sample: "Kak Lia",
  },
  {
    tag: "{brand_name}",
    name: "Nama Brand",
    nameEn: "Brand Name",
    sample: "Serena Raga",
  },
  {
    tag: "{service_name}",
    name: "Nama Layanan",
    nameEn: "Service Name",
    sample: "Deep Relax",
  },
  {
    tag: "{invoice_number}",
    name: "No. Invoice",
    nameEn: "Invoice Number",
    sample: "SR-260928-9231",
  },
  {
    tag: "{booking_date}",
    name: "Tanggal Jadwal",
    nameEn: "Booking Date",
    sample: "28 September 2026",
  },
  {
    tag: "{booking_time}",
    name: "Jam Layanan",
    nameEn: "Booking Time",
    sample: "15.00",
  },
  {
    tag: "{total_amount}",
    name: "Total Tagihan",
    nameEn: "Total Amount",
    sample: "Rp177.250",
  },
  {
    tag: "{payment_status}",
    name: "Status Bayar",
    nameEn: "Payment Status",
    sample: "Belum Lunas",
  },
  {
    tag: "{invoice_url}",
    name: "Link Nota Digital",
    nameEn: "Digital Invoice Link",
    sample: "https://www.serenaraga.com/invoice/inv_9b9f75036d990857",
  },
  {
    tag: "{admin_phone}",
    name: "No. WhatsApp CS",
    nameEn: "CS Phone",
    sample: "+62 895-1835-9037",
  },
];

const QUICK_INSERT_ICONS = [
  { text: "🤎", label: "Heart", icon: Heart },
  { text: "📄", label: "File", icon: FileText },
  { text: "📅", label: "Calendar", icon: Calendar },
  { text: "💰", label: "Money", icon: Banknote },
  { text: "💳", label: "Credit Card", icon: CreditCard },
  { text: "🧾", label: "Receipt", icon: Receipt },
  { text: "✨", label: "Sparkles", icon: Sparkles },
  { text: "🔗", label: "Link", icon: Link2 },
  { text: "📍", label: "Location", icon: MapPin },
  { text: "✅", label: "Check", icon: CheckCircle2 },
];

export function WhatsAppTemplateEditor({
  value,
  onChange,
  brandName = "Serena Raga",
  isEn = false,
}: WhatsAppTemplateEditorProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = React.useState(false);

  // Clean raw escaped \n characters on input
  const normalizedValue = React.useMemo(() => normalizeNewlines(value), [value]);

  // Insert variable or text at current cursor position
  const insertAtCursor = (textToInsert: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange((normalizedValue || "") + textToInsert);
      return;
    }

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const currentVal = normalizedValue || "";
    const newVal = currentVal.substring(0, start) + textToInsert + currentVal.substring(end);
    onChange(newVal);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + textToInsert.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 10);
  };

  // Wrap selected text (for formatting like *bold* or _italic_)
  const wrapSelection = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const currentVal = normalizedValue || "";
    const selectedText = currentVal.substring(start, end);

    if (!selectedText) {
      insertAtCursor(`${prefix}${suffix}`);
      return;
    }

    const newVal =
      currentVal.substring(0, start) + `${prefix}${selectedText}${suffix}` + currentVal.substring(end);
    onChange(newVal);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 10);
  };

  // Render live preview split by line breaks for accurate multi-line rendering
  const previewLines = React.useMemo(() => {
    let raw = normalizedValue || "";
    AVAILABLE_VARIABLES.forEach((v) => {
      const regex = new RegExp(v.tag.replace(/\{/g, "\\{").replace(/\}/g, "\\}"), "g");
      raw = raw.replace(regex, v.sample);
    });
    return raw.split("\n");
  }, [normalizedValue]);

  const handleCopyPreview = () => {
    navigator.clipboard.writeText(previewLines.join("\n"));
    setCopied(true);
    toast.success(isEn ? "Preview copied to clipboard!" : "Pratinjau pesan berhasil disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* 1. Quick Presets Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
            <span>{isEn ? "Choose Template Preset" : "Pilihan Template Siap Pakai"}</span>
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(SERENA_DEFAULT_WA_TEMPLATE)}
            className="h-6 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{isEn ? "Reset to Default" : "Reset Bawaan"}</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {PRESETS.map((preset) => {
            const isSelected = normalizedValue.trim() === preset.template.trim();
            return (
              <Button
                key={preset.id}
                type="button"
                variant="outline"
                onClick={() => {
                  onChange(preset.template);
                  toast.success(
                    isEn
                      ? `Applied: ${preset.labelEn}`
                      : `Template aktif: ${preset.label}`
                  );
                }}
                className={cn(
                  "p-3 h-auto text-left rounded-xl border transition-all duration-200 cursor-pointer flex flex-col items-start justify-between gap-1 shadow-none whitespace-normal",
                  isSelected
                    ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/30"
                    : "border-border bg-card hover:bg-muted/40 hover:border-border/90 text-foreground"
                )}
              >
                <div className="w-full">
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="text-xs font-semibold">
                      {isEn ? preset.labelEn : preset.label}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed font-normal">
                    {isEn ? preset.descriptionEn : preset.description}
                  </p>
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      {/* 2. Interactive Click-to-Insert Variables Bar */}
      <Card className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2 shadow-none">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-muted-foreground" />
            <span>
              {isEn
                ? "Click any tag below to insert dynamic variable:"
                : "Klik tag variabel di bawah untuk menyisipkan ke teks:"}
            </span>
          </span>
          <span className="text-xs text-muted-foreground italic">
            {isEn ? "Values are auto-filled per invoice" : "Nilai otomatis terisi sesuai data nota"}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {AVAILABLE_VARIABLES.map((v) => (
            <Button
              key={v.tag}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => insertAtCursor(` ${v.tag} `)}
              className="h-7 text-xs px-2.5 py-0 gap-1.5 rounded-md border-border bg-background hover:bg-muted/80 hover:text-foreground text-foreground shadow-none cursor-pointer"
              title={`${v.name} (contoh: ${v.sample})`}
            >
              <span className="text-primary font-semibold text-xs">{v.tag}</span>
              <span className="text-muted-foreground text-xs">({isEn ? v.nameEn : v.name})</span>
            </Button>
          ))}
        </div>
      </Card>

      {/* 3. Main Split View: Editor + Real-time WhatsApp Chat Bubble Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Textarea Editor & Formatting Toolbar (7 Cols) */}
        <div className="lg:col-span-7 space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-border">
            {/* Formatting Toolbar */}
            <div className="flex items-center gap-1 flex-wrap">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => wrapSelection("*", "*")}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                title="Tebal (*bold*)"
              >
                <Bold className="w-3.5 h-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => wrapSelection("_", "_")}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                title="Miring (_italic_)"
              >
                <Italic className="w-3.5 h-3.5" />
              </Button>
              <div className="w-[1px] h-4 bg-border mx-1" />
              {/* Quick Icons */}
              {QUICK_INSERT_ICONS.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Button
                    key={item.text}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertAtCursor(item.text)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md"
                    title={`Sisipkan icon ${item.label}`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                  </Button>
                );
              })}
            </div>
            <span className="text-xs text-muted-foreground">
              {normalizedValue.length} {isEn ? "chars" : "karakter"}
            </span>
          </div>

          <Textarea
            ref={textareaRef}
            rows={12}
            value={normalizedValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Ketik template pesan WhatsApp Anda..."
            className="text-xs leading-relaxed bg-background border-border text-foreground shadow-none resize-y min-h-[220px] rounded-xl focus-visible:ring-1"
          />
        </div>

        {/* Right: Live Interactive WhatsApp Bubble Mockup (5 Cols) */}
        <div className="lg:col-span-5 space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-border">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
              <span>{isEn ? "Live WhatsApp Preview" : "Simulasi Tampilan WhatsApp"}</span>
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopyPreview}
              className="h-6 text-xs text-muted-foreground hover:text-foreground gap-1 px-1.5"
              title="Salin hasil teks"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? (isEn ? "Copied" : "Tersalin") : (isEn ? "Copy" : "Salin")}</span>
            </Button>
          </div>

          {/* WhatsApp Chat Window Container */}
          <div className="rounded-xl border border-border overflow-hidden bg-[#0c1317] dark:bg-[#0b141a] text-slate-100 shadow-sm">
            {/* WA Header Bar */}
            <div className="bg-[#202c33] dark:bg-[#202c33] px-3.5 py-2.5 flex items-center justify-between border-b border-[#2a3942]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#00a884] text-[#111b21] flex items-center justify-center font-bold text-xs shrink-0">
                  SR
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#e9edef] leading-tight flex items-center gap-1">
                    <span>{brandName || "Serena Raga"}</span>
                  </h4>
                  <p className="text-xs text-[#8696a0]">
                    {isEn ? "Official Business Account" : "Akun Bisnis Resmi"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-[#8696a0] bg-[#111b21]/60 px-2 py-0.5 rounded">
                <MessageCircle className="w-3 h-3 text-[#00a884]" />
                <span>Online</span>
              </div>
            </div>

            {/* WA Message Bubble Body with exact Line Break (Enter) rendering */}
            <div className="p-3 sm:p-4 bg-[#0b141a] bg-opacity-95 min-h-[220px] flex flex-col justify-end space-y-2">
              <div className="max-w-[95%] sm:max-w-[90%] bg-[#005c4b] text-[#e9edef] rounded-lg rounded-tr-none p-3 shadow-sm relative text-xs leading-relaxed space-y-1.5 self-start">
                {/* Formatted Message Content with Accurate Paragraphs & Line Breaks */}
                <div className="whitespace-pre-wrap break-words selection:bg-[#00a884]/30 space-y-1">
                  {previewLines.length > 0 && previewLines.some((l) => l.trim()) ? (
                    previewLines.map((line, idx) => {
                      if (!line.trim()) {
                        return <div key={idx} className="h-2.5" />;
                      }

                      // Render bold *text* and clickable URLs
                      const parts = line.split(/(\*[^*]+\*|https?:\/\/[^\s]+)/g);
                      return (
                        <div key={idx} className="min-h-[1.15rem]">
                          {parts.map((part, pIdx) => {
                            if (part.startsWith("*") && part.endsWith("*")) {
                              return (
                                <strong key={pIdx} className="font-bold text-white">
                                  {part.slice(1, -1)}
                                </strong>
                              );
                            }
                            if (part.startsWith("http://") || part.startsWith("https://")) {
                              return (
                                <span
                                  key={pIdx}
                                  className="text-[#53bdeb] underline break-all text-xs"
                                >
                                  {part}
                                </span>
                              );
                            }
                            return <span key={pIdx}>{part}</span>;
                          })}
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-[#8696a0] italic">
                      {isEn ? "No message content..." : "Belum ada teks pesan..."}
                    </span>
                  )}
                </div>

                {/* Bubble Timestamp & Double Blue Tick */}
                <div className="flex items-center justify-end gap-1 pt-1 text-xs text-[#8696a0] select-none">
                  <span>14:39</span>
                  <span className="text-[#53bdeb] font-bold tracking-tighter text-xs">✓✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
