const fs = require("fs");
const path = require("path");
const https = require("https");

const MODEL_URL =
  "https://github.com/onnx/models/raw/main/validated/vision/classification/mnist/model/mnist-8.onnx";
const OUT_PATH = path.join(__dirname, "..", "model.onnx");

console.log("Downloading MNIST ONNX model...");
const file = fs.createWriteStream(OUT_PATH);
https
  .get(MODEL_URL, (res) => {
    res.pipe(file);
    file.on("finish", () => {
      file.close();
      console.log("Model saved to model.onnx");
    });
  })
  .on("error", (err) => {
    fs.unlink(OUT_PATH, () => {});
    console.error("Download failed:", err.message);
    process.exit(1);
  });
