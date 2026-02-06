import { NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const { imageData } = await request.json();

    if (!imageData || !Array.isArray(imageData)) {
      return NextResponse.json(
        { error: "Invalid image data. Expected float32 array of 784 values." },
        { status: 400, headers: corsHeaders }
      );
    }

    const floats = imageData as number[];
    if (floats.length !== 784) {
      return NextResponse.json(
        { error: `Expected 784 values (28×28), got ${floats.length}` },
        { status: 400, headers: corsHeaders }
      );
    }

    // Mock prediction: pick a "digit" based on average pixel intensity
    const avg = floats.reduce((a, b) => a + b, 0) / floats.length;
    const digit = Math.min(9, Math.floor(avg * 10)) % 10;
    const confidence = 0.85 + Math.random() * 0.14; // ~0.85–0.99

    return NextResponse.json({ digit, confidence }, { headers: corsHeaders });
  } catch (err) {
    console.error("Predict-test error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Prediction failed", details: message },
      { status: 500, headers: corsHeaders }
    );
  }
}
