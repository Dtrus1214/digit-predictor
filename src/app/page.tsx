"use client";

import { useState } from "react";
import DigitCanvas from "@/components/DigitCanvas";

export default function Home() {
  const [digit, setDigit] = useState<number>(-1);
  const [confidence, setConfidence] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const handlePredict = (predictedDigit: number, predictedConfidence: number) => {
    setDigit(predictedDigit);
    setConfidence(predictedConfidence);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 p-6 dark:bg-stone-950">
      <main className="flex w-full max-w-2xl flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-center">
        <div className="flex flex-col items-center">
          <h1 className="mb-2 text-xl font-semibold text-stone-800 dark:text-stone-200">
            Draw a digit (0–9)
          </h1>
          <DigitCanvas
            onPredict={handlePredict}
            onPredictStart={() => setLoading(true)}
            onPredictEnd={() => setLoading(false)}
            disabled={loading}
          />
        </div>
        <aside className="flex min-w-[200px] flex-col items-center rounded-xl border border-stone-200 bg-white px-8 py-6 shadow-md dark:border-stone-700 dark:bg-stone-900 sm:min-h-[320px] sm:justify-center">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Prediction
          </h2>
          {loading ? (
            <p className="text-stone-500 dark:text-stone-400">Predicting…</p>
          ) : digit >= 0 ? (
            <>
              <span className="text-7xl font-bold tabular-nums text-emerald-600 dark:text-emerald-500">
                {digit}
              </span>
              <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
                Confidence: {(confidence * 100).toFixed(1)}%
              </p>
            </>
          ) : (
            <p className="text-center text-stone-400 dark:text-stone-500">
              Draw a digit and click Predict
            </p>
          )}
        </aside>
      </main>
    </div>
  );
}
