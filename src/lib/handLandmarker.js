import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

let cached = null;
let inflight = null;

function resolveAsset(relativePath) {
  return new URL(relativePath, document.baseURI).href;
}

export async function getHandLandmarker({
  wasmBase = resolveAsset('mediapipe/wasm/'),
  modelPath = resolveAsset('mediapipe/models/hand_landmarker.task'),
  numHands = 1,
  delegate = 'GPU',
  minHandDetectionConfidence = 0.5,
  minHandPresenceConfidence = 0.5,
  minTrackingConfidence = 0.5,
} = {}) {
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    const fileset = await FilesetResolver.forVisionTasks(wasmBase);
    const landmarker = await HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: modelPath, delegate },
      runningMode: 'VIDEO',
      numHands,
      minHandDetectionConfidence,
      minHandPresenceConfidence,
      minTrackingConfidence,
    });
    cached = landmarker;
    inflight = null;
    return landmarker;
  })();

  return inflight;
}

export function disposeHandLandmarker() {
  cached?.close?.();
  cached = null;
}

export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];
