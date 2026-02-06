import { NextResponse } from "next/server";
import * as ort from "onnxruntime-node";
import path from "path";

export const runtime = "nodejs"; // IMPORTANT for onnxruntime-node

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // tighten this later to your domain
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

let session: ort.InferenceSession | null = null;

async function getSession() {
  if (session) return session;
  const modelPath = path.join(process.cwd(), "public", "model.onnx");
  session = await ort.InferenceSession.create(modelPath, {
    executionProviders: ["cpu"],
  });
  return session;
}

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

    const NORMALIZE_MEAN = 0.1307;
    const NORMALIZE_STD = 0.3081;
    const normalized = floats.map((v) => (v - NORMALIZE_MEAN) / NORMALIZE_STD);

    const session = await getSession();
    const inputTensor = new ort.Tensor(
      "float32",
      new Float32Array(normalized),
      [1, 1, 28, 28]
    );

    const results = await session.run({ [session.inputNames[0]]: inputTensor });
    const output = results[session.outputNames[0]] as ort.Tensor;
    const logits = Array.from(output.data as Float32Array);

    const digit = logits.indexOf(Math.max(...logits));
    const maxLogit = logits[digit];
    const expSum = logits.reduce((s, l) => s + Math.exp(l - maxLogit), 0);
    const confidence = 1 / expSum;

    return NextResponse.json({ digit, confidence }, { headers: corsHeaders });
  } catch (err) {
    console.error("Prediction error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Prediction failed", details: message },
      { status: 500, headers: corsHeaders }
    );
  }
}
