import { useCallback, useEffect, useRef, useState } from 'react';
import { useHandTracker } from '../hooks/useHandTracker.js';

const GESTURE_LABEL = {
  open_palm: 'Open palm',
  closed_fist: 'Closed fist',
  swipe_left: 'Swipe left',
  swipe_right: 'Swipe right',
};

export default function GestureView() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [streamReady, setStreamReady] = useState(false);
  const [error, setError] = useState(null);
  const [gesture, setGesture] = useState(null);
  const [counts, setCounts] = useState({ swipe_left: 0, swipe_right: 0 });

  useEffect(() => {
    let active = true;
    let mediaStream = null;

    (async () => {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
          audio: false,
        });
        if (!active) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = videoRef.current;
        if (video) {
          video.srcObject = mediaStream;
          await video.play().catch(() => {});
          setStreamReady(true);
        }
      } catch (err) {
        setError(err.message || String(err));
      }
    })();

    return () => {
      active = false;
      mediaStream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleGesture = useCallback((g) => {
    setGesture(g);
    if (g === 'swipe_left' || g === 'swipe_right') {
      setCounts((c) => ({ ...c, [g]: c[g] + 1 }));
    }
  }, []);

  useHandTracker({
    videoRef,
    canvasRef,
    mirrored: true,
    enabled: streamReady,
    onGesture: handleGesture,
  });

  return (
    <section className="flex flex-col gap-3">
      <div className="relative aspect-video w-full max-w-3xl overflow-hidden rounded-lg border border-neutral-800 bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
        />
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100"
        />

        <div className="absolute left-2 top-2 rounded-md bg-black/60 px-3 py-2 text-sm text-white backdrop-blur">
          <p className="text-xs uppercase tracking-wide text-neutral-400">Gesture</p>
          <p className="text-lg font-semibold">{GESTURE_LABEL[gesture] ?? '—'}</p>
        </div>

        <div className="absolute right-2 top-2 rounded-md bg-black/60 px-3 py-2 text-xs text-white backdrop-blur">
          <p>← {counts.swipe_left}</p>
          <p>→ {counts.swipe_right}</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">Camera error: {error}</p>}
    </section>
  );
}
