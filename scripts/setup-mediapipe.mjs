import { mkdir, cp, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const wasmSrc = path.join(root, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const wasmDst = path.join(root, 'public', 'mediapipe', 'wasm');
const modelDir = path.join(root, 'public', 'mediapipe', 'models');
const modelDst = path.join(modelDir, 'hand_landmarker.task');
const modelUrl =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task';

if (!existsSync(wasmSrc)) {
  console.error(`Missing ${wasmSrc} — run \`npm install @mediapipe/tasks-vision\` first.`);
  process.exit(1);
}

await mkdir(wasmDst, { recursive: true });
await cp(wasmSrc, wasmDst, { recursive: true });
console.log(`OK  Copied WASM -> ${path.relative(root, wasmDst)}`);

await mkdir(modelDir, { recursive: true });
if (!existsSync(modelDst)) {
  console.log(`Downloading hand_landmarker.task ...`);
  const res = await fetch(modelUrl);
  if (!res.ok) {
    console.error(`Download failed: ${res.status} ${res.statusText}`);
    process.exit(1);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(modelDst, buf);
  console.log(`OK  Saved model -> ${path.relative(root, modelDst)} (${(buf.length / 1024).toFixed(0)} KB)`);
} else {
  console.log(`OK  Model already present -> ${path.relative(root, modelDst)}`);
}
