"use client";

import { useRef, useEffect, useCallback } from "react";
import { Trash2 } from "lucide-react";
import type { DrawSegment } from "@/hooks/use-pictionary";

const COLORS = ["#ffffff", "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#6b7280", "#000000"];
const SIZES = [3, 6, 12];

type Props = {
  isDrawer: boolean;
  onBroadcast: (seg: DrawSegment) => void;
  onClearBroadcast: () => void;
  onDrawSegment: (cb: (seg: DrawSegment) => void) => () => void;
  onClearCanvas: (cb: () => void) => () => void;
  color: string;
  size: number;
  onColorChange: (c: string) => void;
  onSizeChange: (s: number) => void;
};

export function DrawingCanvas({
  isDrawer, onBroadcast, onClearBroadcast, onDrawSegment, onClearCanvas,
  color, size, onColorChange, onSizeChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const pendingPoints = useRef<{ x: number; y: number }[]>([]);
  const flushTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const getCanvas = () => canvasRef.current;
  const getCtx = () => canvasRef.current?.getContext("2d");

  const toRelative = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (clientX - rect.left) / rect.width, y: (clientY - rect.top) / rect.height };
  }, []);

  const drawLine = useCallback(
    (x1: number, y1: number, x2: number, y2: number, c: string, s: number) => {
      const canvas = getCanvas();
      const ctx = getCtx();
      if (!canvas || !ctx) return;
      const w = canvas.width, h = canvas.height;
      ctx.strokeStyle = c;
      ctx.lineWidth = s;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(x1 * w, y1 * h);
      ctx.lineTo(x2 * w, y2 * h);
      ctx.stroke();
    }, [],
  );

  const applySeg = useCallback((seg: DrawSegment) => {
    const pts = seg.points;
    for (let i = 1; i < pts.length; i++) {
      drawLine(pts[i - 1]!.x, pts[i - 1]!.y, pts[i]!.x, pts[i]!.y, seg.color, seg.size);
    }
  }, [drawLine]);

  const clearCanvas = useCallback(() => {
    const canvas = getCanvas();
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Listen for remote draw/clear events
  useEffect(() => {
    const unsub1 = onDrawSegment(applySeg);
    const unsub2 = onClearCanvas(clearCanvas);
    return () => { unsub1(); unsub2(); };
  }, [onDrawSegment, onClearCanvas, applySeg, clearCanvas]);

  // Flush buffered points to broadcast every 50ms
  useEffect(() => {
    flushTimer.current = setInterval(() => {
      if (pendingPoints.current.length < 2) return;
      onBroadcast({ type: "segment", points: pendingPoints.current, color, size, isEnd: false });
      pendingPoints.current = [pendingPoints.current[pendingPoints.current.length - 1]!];
    }, 50);
    return () => clearInterval(flushTimer.current!);
  }, [color, size, onBroadcast]);

  const startDraw = useCallback((clientX: number, clientY: number) => {
    if (!isDrawer) return;
    isDrawing.current = true;
    const pt = toRelative(clientX, clientY);
    lastPoint.current = pt;
    pendingPoints.current = [pt];
  }, [isDrawer, toRelative]);

  const moveDraw = useCallback((clientX: number, clientY: number) => {
    if (!isDrawer || !isDrawing.current || !lastPoint.current) return;
    const pt = toRelative(clientX, clientY);
    drawLine(lastPoint.current.x, lastPoint.current.y, pt.x, pt.y, color, size);
    pendingPoints.current.push(pt);
    lastPoint.current = pt;
  }, [isDrawer, toRelative, drawLine, color, size]);

  const endDraw = useCallback(() => {
    if (!isDrawer || !isDrawing.current) return;
    isDrawing.current = false;
    if (pendingPoints.current.length >= 1) {
      onBroadcast({ type: "segment", points: pendingPoints.current, color, size, isEnd: true });
    }
    pendingPoints.current = [];
    lastPoint.current = null;
  }, [isDrawer, color, size, onBroadcast]);

  const handleClear = () => {
    clearCanvas();
    onClearBroadcast();
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Canvas */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#1a1a2e]">
        <canvas
          ref={canvasRef}
          width={560}
          height={380}
          className={`w-full ${isDrawer ? "cursor-crosshair" : "cursor-default"}`}
          onPointerDown={(e) => startDraw(e.clientX, e.clientY)}
          onPointerMove={(e) => moveDraw(e.clientX, e.clientY)}
          onPointerUp={endDraw}
          onPointerLeave={endDraw}
          style={{ touchAction: "none" }}
        />
        {!isDrawer && (
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-2">
            <span className="rounded-full bg-black/60 px-3 py-1 text-xs text-slate-400">Watching the artist…</span>
          </div>
        )}
      </div>

      {/* Tools (only for drawer) */}
      {isDrawer && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/8 bg-white/4 p-3">
          {/* Colors */}
          <div className="flex flex-wrap gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onColorChange(c)}
                title={c}
                className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? "border-white scale-110" : "border-transparent"}`}
                style={{ background: c }}
              />
            ))}
          </div>
          {/* Sizes */}
          <div className="flex items-center gap-1.5">
            {SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSizeChange(s)}
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${size === s ? "bg-white/20" : "hover:bg-white/10"}`}
              >
                <div className="rounded-full bg-white" style={{ width: s + 2, height: s + 2 }} />
              </button>
            ))}
          </div>
          {/* Clear */}
          <button
            type="button"
            onClick={handleClear}
            className="ml-auto flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </button>
        </div>
      )}
    </div>
  );
}
