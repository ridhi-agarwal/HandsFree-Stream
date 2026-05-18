import { useEffect, useRef } from 'react';
import { getHandLandmarker, HAND_CONNECTIONS } from '../lib/handLandmarker.js';
import {
  analyzeHand,
  detectStaticGesture,
  palmCenter,
  SwipeDetector,
} from '../lib/gestures.js';

const NO_HAND_RESET_FRAMES = 30;

export function useHandTracker({
  videoRef,
  canvasRef,
  mirrored = true,
  enabled = true,
  debug = false,
  onGesture,
  onLandmarks,
} = {}) {
  const callbacksRef = useRef({ onGesture, onLandmarks });
  callbacksRef.current = { onGesture, onLandmarks };
  const debugRef = useRef(debug);
  debugRef.current = debug;

  useEffect(() => {
    if (!enabled) return;

    let rafId = 0;
    let cancelled = false;
    let landmarker = null;
    let lastVideoTime = -1;
    let lastStaticGesture = null;
    let noHandFrames = 0;
    let lastDebugLog = 0;
    const swipe = new SwipeDetector();

    (async () => {
      landmarker = await getHandLandmarker();
      if (cancelled) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const ctx = canvas.getContext('2d', { alpha: true });

      function loop() {
        if (cancelled) return;
        rafId = requestAnimationFrame(loop);

        if (!video.videoWidth || video.readyState < 2) return;

        if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
        if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;

        if (video.currentTime === lastVideoTime) return;
        lastVideoTime = video.currentTime;

        const t = performance.now();
        const result = landmarker.detectForVideo(video, t);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const hands = result?.landmarks ?? [];
        if (hands.length === 0) {
          lastStaticGesture = null;
          if (++noHandFrames > NO_HAND_RESET_FRAMES) swipe.reset();
          return;
        }
        noHandFrames = 0;

        const hand = hands[0];
        drawHand(ctx, hand, canvas.width, canvas.height);
        callbacksRef.current.onLandmarks?.(hand);

        const staticGesture = detectStaticGesture(hand);
        if (staticGesture !== lastStaticGesture) {
          lastStaticGesture = staticGesture;
          if (staticGesture) {
            if (debugRef.current) console.log('[gesture]', staticGesture);
            callbacksRef.current.onGesture?.(staticGesture);
          }
        }

        const center = palmCenter(hand);
        const trackedX = mirrored ? 1 - center.x : center.x;
        swipe.push(trackedX, t);
        const swipeResult = swipe.detect(t);
        if (swipeResult) {
          if (debugRef.current) console.log('[gesture]', swipeResult);
          callbacksRef.current.onGesture?.(swipeResult);
        }

        if (debugRef.current && t - lastDebugLog > 500) {
          lastDebugLog = t;
          const peek = swipe.peek();
          console.log('[hand]', {
            ...analyzeHand(hand),
            swipe: peek && {
              dx: +peek.dx.toFixed(3),
              dt: Math.round(peek.dt),
              samples: peek.n,
            },
          });
        }
      }

      loop();
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [videoRef, canvasRef, mirrored, enabled]);
}

function drawHand(ctx, landmarks, w, h) {
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.9)';
  ctx.fillStyle = 'rgba(245, 158, 11, 0.95)';

  ctx.beginPath();
  for (const [a, b] of HAND_CONNECTIONS) {
    ctx.moveTo(landmarks[a].x * w, landmarks[a].y * h);
    ctx.lineTo(landmarks[b].x * w, landmarks[b].y * h);
  }
  ctx.stroke();

  for (const p of landmarks) {
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
