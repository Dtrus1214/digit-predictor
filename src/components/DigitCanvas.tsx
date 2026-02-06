"use client";

import { useRef, useState, useCallback, useEffect } from "react";

const CANVAS_SIZE = 280;
const MODEL_SIZE = 28;

function getImageDataAsMnist(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): number[] {
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  const resized: number[] = [];

  const scaleX = width / MODEL_SIZE;
  const scaleY = height / MODEL_SIZE;

  for (let py = 0; py < MODEL_SIZE; py++) {
    for (let px = 0; px < MODEL_SIZE; px++) {
      let sum = 0;
      let count = 0;
      const y0 = Math.floor(py * scaleY);
      const y1 = Math.min(Math.ceil((py + 1) * scaleY), height);
      const x0 = Math.floor(px * scaleX);
      const x1 = Math.min(Math.ceil((px + 1) * scaleX), width);

      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          const gray = (r + g + b) / 3;
          const normalized = (255 - gray) / 255;
          sum += normalized * (a / 255);
          count++;
        }
      }
      const avg = count > 0 ? sum / count : 0;
      resized.push(Math.min(1, Math.max(0, avg)));
    }
  }

  return resized;
}

export default function DigitCanvas({
  onPredict,
  onPredictStart,
  onPredictEnd,
  disabled,
}: {
  onPredict: (digit: number, confidence: number) => void;
  onPredictStart?: () => void;
  onPredictEnd?: () => void;
  disabled: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  }, []);

  const startDraw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (disabled) return;
      setIsDrawing(true);
      const ctx = getCtx();
      if (!ctx) return;
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
      const x = ("clientX" in e ? e.clientX : e.touches[0].clientX) - rect.left;
      const y = ("clientY" in e ? e.clientY : e.touches[0].clientY) - rect.top;
      ctx.beginPath();
      ctx.moveTo(x, y);
    },
    [disabled, getCtx]
  );

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing || disabled) return;
      const ctx = getCtx();
      if (!ctx) return;
      e.preventDefault();
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
      const x = ("clientX" in e ? e.clientX : e.touches[0].clientX) - rect.left;
      const y = ("clientY" in e ? e.clientY : e.touches[0].clientY) - rect.top;
      ctx.lineTo(x, y);
      ctx.stroke();
    },
    [isDrawing, disabled, getCtx]
  );

  const endDraw = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clear = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    onPredict(-1, 0);
  }, [getCtx, onPredict]);

  const predict = useCallback(async () => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas || disabled) return;

    const imageData = getImageDataAsMnist(ctx, canvas.width, canvas.height);

    onPredictStart?.();

    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Prediction failed");
      onPredict(json.digit, json.confidence ?? 0);
    } catch (err) {
      console.error(err);
      onPredict(-1, 0);
    } finally {
      onPredictEnd?.();
    }
  }, [getCtx, onPredict, onPredictStart, onPredictEnd, disabled]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="cursor-crosshair touch-none rounded-lg border-2 border-zinc-300 bg-white shadow-md dark:border-zinc-600 dark:bg-zinc-900"
        style={{ imageRendering: "pixelated" }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={predict}
          disabled={disabled}
          className="rounded-lg bg-emerald-600 px-5 py-2 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          Predict
        </button>
        <button
          type="button"
          onClick={clear}
          className="rounded-lg border border-zinc-300 px-5 py-2 font-medium transition hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
