"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Undo2,
  RotateCcw,
  Check,
  X,
  Sliders,
  Sparkles,
  ShieldCheck,
  MousePointerClick,
} from "lucide-react";

interface ImageBlurEditorProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  onSave: (processedBlob: Blob) => void;
}

interface BlurRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const ImageBlurEditor: React.FC<ImageBlurEditorProps> = ({
  isOpen,
  onClose,
  file,
  onSave,
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [imageObj, setImageObj] = React.useState<HTMLImageElement | null>(null);
  const [blurHistory, setBlurHistory] = React.useState<BlurRect[]>([]);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [startPos, setStartPos] = React.useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = React.useState<BlurRect | null>(null);
  const [blurStrength, setBlurStrength] = React.useState<number>(16); // px

  // Load image when file changes
  React.useEffect(() => {
    if (!file || !isOpen) {
      setImageObj(null);
      setBlurHistory([]);
      setCurrentRect(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setImageObj(img);
        setBlurHistory([]);
        setCurrentRect(null);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [file, isOpen]);

  // Redraw canvas whenever image, blur history, or current rect changes
  const redrawCanvas = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObj) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = imageObj.naturalWidth || imageObj.width;
    canvas.height = imageObj.naturalHeight || imageObj.height;

    // 1. Draw original base image
    ctx.drawImage(imageObj, 0, 0, canvas.width, canvas.height);

    // 2. Apply all blur rectangles in history
    blurHistory.forEach((rect) => {
      applyBlurToArea(ctx, canvas, rect, blurStrength);
    });

    // 3. Draw active dragging selection rectangle
    if (currentRect && currentRect.w > 0 && currentRect.h > 0) {
      ctx.save();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = Math.max(3, Math.round(canvas.width / 300));
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h);
      ctx.fillStyle = "rgba(56, 189, 248, 0.2)";
      ctx.fillRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h);
      ctx.restore();
    }
  }, [imageObj, blurHistory, currentRect, blurStrength]);

  React.useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Helper to blur a specific rectangle on the canvas
  const applyBlurToArea = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    rect: BlurRect,
    radius: number
  ) => {
    const { x, y, w, h } = rect;
    if (w <= 0 || h <= 0) return;

    // Fast and realistic box/gaussian blur approximation
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    // Draw source region to temp canvas
    tempCtx.drawImage(canvas, x, y, w, h, 0, 0, w, h);

    // Apply multiple blur passes or scaled down/up pixelation blur
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    // Use CSS canvas filter blur
    ctx.filter = `blur(${radius}px)`;
    ctx.drawImage(
      canvas,
      x - radius,
      y - radius,
      w + radius * 2,
      h + radius * 2,
      x - radius,
      y - radius,
      w + radius * 2,
      h + radius * 2
    );
    ctx.filter = "none";
    ctx.restore();
  };

  // Coordinate mapping from mouse/touch event to actual image canvas pixels
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.max(0, Math.min(canvas.width, (e.clientX - rect.left) * scaleX));
    const y = Math.max(0, Math.min(canvas.height, (e.clientY - rect.top) * scaleY));

    return { x: Math.round(x), y: Math.round(y) };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPos(coords);
    setCurrentRect({ x: coords.x, y: coords.y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos) return;

    const coords = getCanvasCoords(e);
    const x = Math.min(startPos.x, coords.x);
    const y = Math.min(startPos.y, coords.y);
    const w = Math.abs(coords.x - startPos.x);
    const h = Math.abs(coords.y - startPos.y);

    setCurrentRect({ x, y, w, h });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentRect) return;
    setIsDrawing(false);

    // Only commit if selection is larger than minimum area (e.g. 5x5 px)
    if (currentRect.w > 6 && currentRect.h > 6) {
      setBlurHistory((prev) => [...prev, currentRect]);
    }
    setCurrentRect(null);
    setStartPos(null);
  };

  const handleUndo = () => {
    setBlurHistory((prev) => prev.slice(0, prev.length - 1));
  };

  const handleReset = () => {
    setBlurHistory([]);
    setCurrentRect(null);
  };

  const handleSaveAndApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Convert canvas to WebP/JPEG Blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onSave(blob);
          onClose();
        }
      },
      "image/webp",
      0.94
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[95vh] p-4 sm:p-6 bg-card border-border flex flex-col">
        <DialogHeader className="pb-3 border-b border-border/80 flex flex-row items-center justify-between gap-4">
          <div>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span>Sensor / Blur Area Sensitif Screenshot</span>
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tarik kotak di atas gambar untuk mem-blur nomor HP, nama, atau foto profil pelanggan.
            </p>
          </div>
        </DialogHeader>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 py-2 px-1 border-b border-border/60 bg-muted/20 rounded-md">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium px-2 py-1 bg-muted rounded">
              <MousePointerClick className="w-3.5 h-3.5 text-primary" />
              <span>Tarik kursor untuk mem-blur</span>
            </span>

            {blurHistory.length > 0 && (
              <span className="text-xs font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
                {blurHistory.length} area disensor
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={blurHistory.length === 0}
              className="h-8 text-xs gap-1"
              title="Batalkan sensor terakhir"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={blurHistory.length === 0}
              className="h-8 text-xs gap-1 text-muted-foreground hover:text-destructive"
              title="Hapus semua sensor"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </Button>
          </div>
        </div>

        {/* Canvas Workspace */}
        <div
          ref={containerRef}
          className="relative flex-1 min-h-[360px] max-h-[60vh] overflow-auto bg-stone-950/90 rounded-lg p-2 flex items-center justify-center select-none"
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="max-h-[55vh] max-w-full object-contain cursor-crosshair shadow-2xl border border-stone-800 rounded"
          />
        </div>

        <DialogFooter className="pt-3 border-t border-border/80 flex sm:justify-between items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Batal
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSaveAndApply}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Terapkan Sensor & Lanjutkan Upload</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
